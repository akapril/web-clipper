import md5 from '@web-clipper/shared/lib/md5';
import { DocumentService, CreateDocumentRequest } from '../interface';

interface LogseqFormConfig {
  apiToken: string;
  apiPort: number;
}

export default class LogseqService implements DocumentService {
  constructor(private config: LogseqFormConfig) {}

  getId = () => md5(JSON.stringify(this.config));

  getUserInfo = async () => ({
    name: 'Logseq',
    avatar: '',
    description: `Port: ${this.config.apiPort || 12315}`,
  });

  /**
   * 调用 Logseq HTTP API（RPC 风格）
   */
  private async callApi(method: string, args: any[]): Promise<any> {
    const port = this.config.apiPort || 12315;
    const response = await fetch(`http://127.0.0.1:${port}/api`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiToken}`,
      },
      body: JSON.stringify({ method, args }),
    });
    if (!response.ok) {
      throw new Error(`Logseq API 错误: ${response.status}`);
    }
    return response.json();
  }

  getRepositories = async () => {
    // 获取所有页面作为可选目标
    try {
      const pages = await this.callApi('logseq.Editor.getAllPages', []);
      return (pages || [])
        .filter((p: any) => !p['journal?'])
        .slice(0, 100)
        .map((p: any) => ({
          id: p.name || p.originalName,
          name: p.originalName || p.name,
          groupId: 'logseq',
          groupName: 'Logseq',
        }));
    } catch (_e) {
      return [
        { id: '__new__', name: '新建页面（使用标题）', groupId: 'logseq', groupName: 'Logseq' },
      ];
    }
  };

  createDocument = async (info: CreateDocumentRequest) => {
    const pageName = info.repositoryId === '__new__' ? info.title : info.repositoryId;

    // 将 markdown 内容转为 Logseq 块格式（每段一个块）
    const blocks = this.markdownToBlocks(info.content);

    // 创建或获取页面
    try {
      await this.callApi('logseq.Editor.createPage', [
        pageName,
        {},
        { redirect: false },
      ]);
    } catch (_e) {
      // 页面已存在，忽略错误
    }

    // 添加来源信息块
    if (info.url) {
      await this.callApi('logseq.Editor.appendBlockInPage', [
        pageName,
        `来源: [${info.title}](${info.url})`,
      ]);
    }

    // 逐块追加内容
    for (const block of blocks) {
      if (block.trim()) {
        await this.callApi('logseq.Editor.appendBlockInPage', [
          pageName,
          block,
        ]);
      }
    }

    return {
      href: `logseq://graph/?page=${encodeURIComponent(pageName)}`,
    };
  };

  /**
   * 将 markdown 文本拆分为 Logseq 块
   * Logseq 每个块是一个独立单元，用空行分隔
   */
  private markdownToBlocks(markdown: string): string[] {
    return markdown
      .split(/\n{2,}/)
      .map(block => block.trim())
      .filter(Boolean);
  }
}
