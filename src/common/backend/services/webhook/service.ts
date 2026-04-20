import md5 from '@web-clipper/shared/lib/md5';
import { DocumentService, CreateDocumentRequest } from '../interface';

interface WebhookFormConfig {
  webhookUrl: string;
  /** 自定义请求头，JSON 格式 */
  customHeaders?: string;
}

export default class WebhookService implements DocumentService {
  constructor(private config: WebhookFormConfig) {}

  getId = () => md5(this.config.webhookUrl);

  getUserInfo = async () => ({
    name: 'Webhook',
    avatar: '',
    description: this.config.webhookUrl,
  });

  getRepositories = async () => [
    { id: 'default', name: 'Default', groupId: 'webhook', groupName: 'Webhook' },
  ];

  createDocument = async (info: CreateDocumentRequest) => {
    let extraHeaders: Record<string, string> = {};
    if (this.config.customHeaders) {
      try {
        extraHeaders = JSON.parse(this.config.customHeaders);
      } catch (_e) {}
    }

    const response = await fetch(this.config.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...extraHeaders,
      },
      body: JSON.stringify({
        title: info.title,
        content: info.content,
        url: info.url,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`Webhook 错误: ${response.status} ${response.statusText}`);
    }

    return {};
  };
}
