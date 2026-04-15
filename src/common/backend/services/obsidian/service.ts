import md5 from '@web-clipper/shared/lib/md5';
import { CreateDocumentRequest, DocumentService } from '../../index';
import { ObsidianFormConfig, ObsidianCreateDocumentRequest } from './interface';
import { renderObsidianTemplate, DEFAULT_TEMPLATE, TemplateVariables } from './template';
import QueryString from 'query-string';

export default class ObsidianService implements DocumentService {
  constructor(private config: ObsidianFormConfig) {}

  getId = () => {
    return md5(JSON.stringify(this.config));
  };

  getUserInfo = async () => {
    const modeLabel = {
      uri: 'URI',
      cli: 'CLI',
      rest: 'REST API',
    }[this.config.connectionMode || 'uri'];
    return {
      name: 'Obsidian',
      avatar: '',
      description: `Vault: ${this.config.vault} (${modeLabel})`,
    };
  };

  getRepositories = async () => {
    return (this.config.folder || '').split('\n').filter(f => f.trim()).map((folder) => ({
      id: folder.trim(),
      name: folder.trim(),
      groupId: 'obsidian',
      groupName: this.config.vault,
    }));
  };

  /**
   * 清理文件名中的非法字符
   * Obsidian 使用文件系统存储，标题中的特殊字符会导致路径异常
   */
  private sanitizeTitle(title: string): string {
    // 替换路径分隔符和文件系统非法字符为短横线
    return title
      .replace(/[\/\\:*?"<>|]/g, '-')
      .replace(/-{2,}/g, '-')
      .replace(/^-|-$/g, '')
      .trim() || 'Untitled';
  }

  createDocument = async (info: ObsidianCreateDocumentRequest) => {
    const safeTitle = this.sanitizeTitle(info.title);
    const file = `${info.repositoryId}/${safeTitle}`;
    const content = this.renderContent(info);
    const mode = this.config.connectionMode || 'uri';

    switch (mode) {
      case 'cli':
        await this.createViaCli(file, content);
        break;
      case 'rest':
        await this.createViaRest(file, content);
        break;
      case 'uri':
      default:
        this.createViaUri(file, content);
        break;
    }

    return {
      href: QueryString.stringifyUrl({
        url: 'obsidian://open',
        query: { vault: this.config.vault, file },
      }),
    };
  };

  /**
   * 渲染模板内容
   */
  private renderContent(info: ObsidianCreateDocumentRequest): string {
    const template = this.config.contentTemplate || DEFAULT_TEMPLATE;
    const now = new Date();
    const vars: TemplateVariables = {
      title: info.title,
      url: info.url || '',
      content: info.content,
      date: now.toISOString().split('T')[0],
      tags: (info.tags || '').split(',').map(t => t.trim()).filter(Boolean).join(', '),
    };
    return renderObsidianTemplate(template, vars);
  }

  /**
   * URI 模式：通过 obsidian:// 协议打开
   * 注意：有 URL 长度限制，大内容可能被截断
   */
  private createViaUri(file: string, content: string): void {
    window.open(
      QueryString.stringifyUrl({
        url: 'obsidian://new',
        query: {
          silent: true,
          vault: this.config.vault,
          file,
          content,
        },
      })
    );
  }

  /**
   * CLI 模式：通过剪贴板中转绕过 URL 长度限制
   * 先将内容复制到剪贴板，再使用 obsidian://new 的 clipboard 参数
   */
  private async createViaCli(file: string, content: string): Promise<void> {
    await navigator.clipboard.writeText(content);
    window.open(
      QueryString.stringifyUrl({
        url: 'obsidian://new',
        query: {
          silent: true,
          vault: this.config.vault,
          file,
          clipboard: true,
        },
      })
    );
  }

  /**
   * REST API 模式：通过 Local REST API 插件创建/追加笔记
   * 需要安装 obsidian-local-rest-api 社区插件
   * 无内容长度限制
   *
   * 写入模式：
   * - create: PUT 创建或覆盖文件
   * - append: POST 追加到文件末尾（文件不存在则创建）
   * - prepend: POST 插入到文件开头（frontmatter 之后）
   */
  private async createViaRest(file: string, content: string): Promise<void> {
    const port = this.config.restApiPort || 27123;
    const apiKey = this.config.restApiKey || '';
    const writeMode = this.config.writeMode || 'create';
    const filePath = file.endsWith('.md') ? file : `${file}.md`;
    const url = `http://127.0.0.1:${port}/vault/${encodeURIComponent(filePath)}`;

    let method: string;
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'text/markdown',
    };

    switch (writeMode) {
      case 'append':
        // POST 追加到文件末尾，添加分隔线
        method = 'POST';
        content = `\n\n---\n\n${content}`;
        break;
      case 'prepend':
        // PATCH 插入到文件开头（frontmatter 之后）
        method = 'PATCH';
        headers['Operation'] = 'prepend';
        headers['Target-Type'] = 'heading';
        headers['Target'] = '';
        content = `${content}\n\n---\n\n`;
        break;
      case 'create':
      default:
        method = 'PUT';
        break;
    }

    const response = await fetch(url, { method, headers, body: content });

    if (!response.ok) {
      throw new Error(`Obsidian REST API 错误: ${response.status} ${response.statusText}`);
    }
  }
}
