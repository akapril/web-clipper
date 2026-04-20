import { ImageHostingService, UploadImageRequest } from '../interface';

// Obsidian REST API 图床服务：将图片上传到 Obsidian Vault 的附件目录
export default class ObsidianImageHostingService implements ImageHostingService {
  private config: { restApiKey: string; restApiPort: number; attachmentFolder: string };

  constructor(info: any) {
    this.config = {
      restApiKey: info.restApiKey || '',
      restApiPort: info.restApiPort || 27123,
      attachmentFolder: info.attachmentFolder || 'attachments',
    };
  }

  getId() {
    return 'obsidian_image_hosting';
  }

  async uploadImage(request: UploadImageRequest): Promise<string> {
    const timestamp = Date.now();

    // 从 data URL 中提取 MIME 类型和对应扩展名
    const mimeMatch = request.data.match(/^data:([^;]+);base64,/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/png';
    const EXT_MAP: Record<string, string> = {
      'image/png': '.png',
      'image/jpeg': '.jpg',
      'image/gif': '.gif',
      'image/webp': '.webp',
      'image/svg+xml': '.svg',
      'application/pdf': '.pdf',
      'application/octet-stream': '.bin',
    };
    const ext = EXT_MAP[mime] || '.bin';
    const fileName = `clip-${timestamp}${ext}`;
    const filePath = `${this.config.attachmentFolder}/${fileName}`;
    const port = this.config.restApiPort;
    const url = `http://127.0.0.1:${port}/vault/${encodeURIComponent(filePath)}`;

    // 将 base64 data URL 转为二进制数据
    const base64Data = request.data.replace(/^data:[^;]+;base64,/, '');
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${this.config.restApiKey}`,
        'Content-Type': 'application/octet-stream',
      },
      body: bytes.buffer,
    });

    if (!response.ok) {
      throw new Error(`Obsidian REST API error: ${response.status}`);
    }

    return filePath;
  }

  async uploadImageUrl(url: string): Promise<string> {
    // 先下载远程图片，再上传到 Obsidian Vault
    const response = await fetch(url);
    const blob = await response.blob();
    const reader = new FileReader();
    const dataUrl = await new Promise<string>((resolve) => {
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
    return this.uploadImage({ data: dataUrl });
  }
}
