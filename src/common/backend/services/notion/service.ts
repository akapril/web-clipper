import localeService from '@/common/locales';
import { ICookieService } from '@/service/common/cookie';
import { IWebRequestService } from '@/service/common/webRequest';
import { generateUuid } from '@web-clipper/shared/lib/uuid';
import axios, { AxiosInstance } from 'axios';
import Container from 'typedi';
import { CreateDocumentRequest, DocumentService } from '../../index';
import { CompleteStatus, UnauthorizedError } from './../interface';
import { NotionRepository, NotionUserContent, RecentPages } from './types';

const PAGE = 'page';
const COLLECTION_VIEW_PAGE = 'collection_view_page';
const origin = 'https://www.notion.so/';

export default class NotionDocumentService implements DocumentService {
  private request: AxiosInstance;
  private repositories: NotionRepository[];
  private userContent?: NotionUserContent;
  private webRequestService: IWebRequestService;
  private cookieService: ICookieService;

  constructor() {
    const request = axios.create({
      baseURL: origin,
      timeout: 10000,
      transformResponse: [
        (data): any => {
          return JSON.parse(data);
        },
      ],
      withCredentials: true,
    });
    this.request = request;
    this.repositories = [];
    this.webRequestService = Container.get(IWebRequestService);
    this.cookieService = Container.get(ICookieService);
    this.request.interceptors.response.use(
      (r) => r,
      (error) => {
        if (error.response && error.response.status === 401) {
          return Promise.reject(
            new UnauthorizedError(
              localeService.format({
                id: 'backend.services.notion.unauthorizedErrorMessage',
                defaultMessage: 'Unauthorized! Please Login Notion Web.',
              })
            )
          );
        }
        return Promise.reject(error);
      }
    );
  }

  getId = () => {
    return 'notion';
  };

  getUserInfo = async () => {
    if (!this.userContent) {
      this.userContent = await this.getUserContent();
    }
    const user = this.userContent?.recordMap?.notion_user;
    if (!user || Object.keys(user).length === 0) {
      throw new Error('无法获取 Notion 用户信息，请确认已登录 notion.so');
    }
    const userInfo = Object.values(user)[0];
    const { email, profile_photo, name } = userInfo.value;
    return {
      name,
      avatar: profile_photo,
      homePage: 'https://www.notion.so/',
      description: email,
    };
  };

  getRepositories = async () => {
    if (!this.userContent) {
      this.userContent = await this.getUserContent();
    }

    const notionUser = this.userContent?.recordMap?.notion_user;
    if (!notionUser || Object.keys(notionUser).length === 0) {
      throw new Error('无法获取 Notion 用户信息，请确认已登录 notion.so');
    }
    const userId = Object.keys(notionUser)[0] as string;
    let spaces: any[];
    try {
      const spacePointers = await this.getSpaces(userId);
      spaces = Array.isArray(spacePointers) ? spacePointers : Object.values(spacePointers || {});
    } catch (e) {
      throw new Error('获取 Notion 空间列表失败，请刷新 notion.so 后重试');
    }

    if (!spaces || spaces.length === 0) {
      throw new Error('未找到 Notion 空间，请确认账户中有可用的工作空间');
    }

    const result: Array<NotionRepository[]> = await Promise.all(
      spaces.map(async (space: any) => {
        if (!space?.spaceId) return [];
        try {
          const recentPages = await this.getRecentPageVisits(space.spaceId, userId);
          const spaceName = await this.getSpaceName(space.spaceId);
          return this.loadSpace(space.spaceId, spaceName, recentPages);
        } catch (_e) {
          // 单个空间加载失败不影响其他空间
          return [];
        }
      })
    );

    this.repositories = result.flat() as NotionRepository[];
    return this.repositories;
  };

  getSpaces = async (userId: string) => {
    const response = await this.requestWithCookie.post<any>('/api/v3/getSpacesInitial');
    const data = response.data;

    // 兼容多种 API 响应结构
    // 结构1: data.users[userId].user_root[userId].value.space_view_pointers
    // 结构2: data[userId].space（旧版）
    try {
      const userRoot = data?.users?.[userId]?.user_root?.[userId];
      if (userRoot?.value?.space_view_pointers) {
        return userRoot.value.space_view_pointers;
      }
    } catch (_e) {}

    // 回退：从 recordMap.space 中提取
    try {
      const spaces = data?.recordMap?.space || data?.[userId]?.space;
      if (spaces) {
        return Object.keys(spaces).map(spaceId => ({
          id: spaceId,
          spaceId,
          table: 'space',
        }));
      }
    } catch (_e) {}

    throw new Error('无法解析 Notion 空间数据');
  };

  getSpaceName = async (spaceId: string) => {
    try {
      const response = await this.requestWithCookie.post<any>('api/v3/getPublicSpaceData', {
        spaceIds: [spaceId],
        type: 'space-ids'
      });
      return response.data?.results?.[0]?.name || spaceId;
    } catch (_e) {
      return spaceId;
    }
  }

  createDocument = async ({
    repositoryId,
    title,
    content,
  }: CreateDocumentRequest): Promise<CompleteStatus> => {
    let fileName = `${title}.md`;

    const repository = this.repositories.find((o) => o.id === repositoryId);
    if (!repository) {
      throw new Error('Illegal repository');
    }

    const documentId = await this.createEmptyFile(repository, content);
    const fileUrl = await this.getFileUrl(encodeURI(fileName));
    await axios.put(fileUrl.signedPutUrl, `${content}`, {
      headers: {
        'Content-Type': 'text/markdown',
      },
    });
    if (!this.userContent) {
      this.userContent = await this.getUserContent();
    }
    const spaceId = await this.getSpaceId();
    await this.requestWithCookie.post('api/v3/enqueueTask', {
      task: {
        eventName: 'importFile',
        request: {
          fileURL: fileUrl.url,
          fileName,
          importType: 'ReplaceBlock',
          block: {
            id: documentId,
            spaceId: spaceId,
          },
          spaceId: spaceId,
          signedToken: fileUrl.signedToken,
        },
      },
    });

    return {
      href: `https://www.notion.so/${repository.groupId}/${documentId.replace(/-/g, '')}`,
    };
  };

  getSpaceId = async () => {
    if (!this.userContent) {
      this.userContent = await this.getUserContent();
    }

    const notionUser = this.userContent?.recordMap?.notion_user;
    if (!notionUser || Object.keys(notionUser).length === 0) {
      throw new Error('无法获取用户信息');
    }
    const userId = Object.keys(notionUser)[0] as string;
    const spaces = await this.getSpaces(userId);
    const spaceArr = Array.isArray(spaces) ? spaces : Object.values(spaces || {});
    if (!spaceArr || spaceArr.length === 0) {
      throw new Error('未找到可用的 Notion 空间');
    }
    return spaceArr[0].spaceId;
  };

  createEmptyFile = async (repository: NotionRepository, title: string) => {
    if (!this.userContent) {
      this.userContent = await this.getUserContent();
    }
    const spaceId = await this.getSpaceId();
    const documentId = generateUuid();
    const requestId = generateUuid();
    const inner_requestId = generateUuid();
    const parentId = repository.id;
    const userId = Object.values(this.userContent.recordMap.notion_user)[0].value.id;
    const time = new Date().getDate();
    let operations;
    if (repository.pageType === PAGE) {
      operations = [
        {
          id: documentId,
          table: 'block',
          path: [],
          command: 'set',
          args: {
            type: 'page',
            id: documentId,
            space_id: spaceId,
            version: 1,
          },
        },
        {
          id: documentId,
          table: 'block',
          path: [],
          command: 'update',
          args: {
            parent_id: parentId,
            parent_table: 'block',
            alive: true,
            space_id: spaceId,
          },
        },
        {
          table: 'block',
          id: parentId,
          path: ['content'],
          command: 'listAfter',
          args: {
            id: documentId,
            space_id: spaceId,
          },
        },
        {
          id: documentId,
          table: 'block',
          path: [],
          command: 'update',
          args: {
            created_by: userId,
            created_time: time,
            last_edited_time: time,
            last_edited_by: userId,
            space_id: spaceId,
          },
        },
        {
          id: parentId,
          table: 'block',
          path: [],
          command: 'update',
          args: {
            last_edited_time: time,
            space_id: spaceId,
          },
        },
        {
          id: documentId,
          table: 'block',
          path: ['properties', 'title'],
          command: 'set',
          args: [[title]],
        },
        {
          id: documentId,
          table: 'block',
          path: [],
          command: 'update',
          args: {
            last_edited_time: time,
            space_id: spaceId,
          },
        },
      ];
    } else if (repository.pageType === COLLECTION_VIEW_PAGE) {
      operations = [
        {
          id: documentId,
          table: 'block',
          path: [],
          command: 'set',
          args: {
            type: 'page',
            id: documentId,
            space_id: spaceId,
            version: 1,
          },
        },
        {
          id: documentId,
          table: 'block',
          path: [],
          command: 'update',
          args: {
            parent_id: parentId,
            parent_table: 'collection',
            space_id: spaceId,
            alive: true,
          },
        },
      ];
    }

    await this.requestWithCookie.post('api/v3/saveTransactionsFanout', {
      requestId: requestId,
      transactions: [
        {
          id: inner_requestId,
          operations: operations,
          spaceId: spaceId,
        }
      ]
    });
    return documentId;
  };

  getFileUrl = async (fileName: string) => {
    const result = await this.requestWithCookie.post<{
      url: string;
      signedPutUrl: string;
      signedToken: string;
    }>('api/v3/getUploadFileUrl', {
      bucket: 'temporary',
      name: fileName,
      contentType: 'text/markdown',
    });
    return result.data;
  };

  private async loadSpace(
    spaceId: string,
    spaceName: string,
    recentPages: RecentPages
  ): Promise<NotionRepository[]> {
    const response = await this.requestWithCookie.post<{
      pages: string[];
      recordMap: {
        block: {
          [id: string]: {
            value: {
              collection_id: string;
              id: string;
              type: string;
              space_id: string;
              properties: {
                title: string[];
              };
            };
          };
        };
      };
    }>('api/v3/getUserSharedPagesInSpace', {
      includeDeleted: false,
      includeTeamSharedPages: false,
      spaceId,
    });

    const pages: string[] = response.data.pages as string[];

    return pages
      .map((pageId): NotionRepository | null => {
        const block = response.data.recordMap?.block?.[pageId];
        if (!block?.value) return null;
        const value = block.value;
        if (value.type === PAGE && !!value.properties && !!value.properties.title) {
          return {
            id: value.id,
            name: value.properties.title.toString(),
            groupId: spaceId,
            groupName: spaceName,
            pageType: PAGE,
          };
        }
        const collections = recentPages.recordMap.collection;
        if (
          value.type === COLLECTION_VIEW_PAGE &&
          !!value.collection_id &&
          !!collections &&
          !!collections[value.collection_id] &&
          !!collections[value.collection_id].value &&
          !!collections[value.collection_id].value.name
        ) {
          return {
            id: collections[value.collection_id].value.id,
            name: collections[value.collection_id].value.name.toString(),
            groupId: spaceId,
            groupName: spaceName,
            pageType: COLLECTION_VIEW_PAGE,
          };
        }
        return null;
      })
      .filter((p): p is NotionRepository => !!p);
  }

  private async getRecentPageVisits(spaceId: string, userId: string): Promise<RecentPages> {
    const res = await this.requestWithCookie.post<RecentPages>('api/v3/getRecentPageVisits', {
      spaceId,
      userId,
    });
    return res.data;
  }

  private getUserContent = async () => {
    try {
      const response = await this.requestWithCookie.post<NotionUserContent>('api/v3/loadUserContent');
      if (!response.data?.recordMap) {
        throw new Error('Notion 返回数据格式异常');
      }
      return response.data;
    } catch (error: any) {
      if (error instanceof UnauthorizedError) {
        throw error;
      }
      throw new Error(`Notion 连接失败: ${error.message || '网络错误，请确认已登录 notion.so'}`);
    }
  };

  /**
   * Modify the cookie when request
   */
  private get requestWithCookie() {
    const post = async <T>(url: string, data?: any) => {
      const cookies = await this.cookieService.getAll({
        url: origin,
      });
      const cookieString = cookies.map((o) => `${o.name}=${o.value}`).join(';');
      const header = await this.webRequestService.startChangeHeader({
        urls: [`${origin}*`],
        requestHeaders: [
          {
            name: 'cookie',
            value: cookieString,
          },
          {
            name: `Content-Type`,
            value: 'application/json',
          },
        ],
      });
      try {
        const result = await this.request.post<T>(
          await this.webRequestService.changeUrl(url, header),
          data,
          {}
        );
        await this.webRequestService.end(header);
        return result;
      } catch (error) {
        await this.webRequestService.end(header);
        throw error;
      }
    };
    return {
      post,
    };
  }
}
