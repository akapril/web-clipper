import { ImageHostingService, UploadImageRequest } from '../interface';

/**
 * Lsky Pro 图床服务
 * API 文档: https://docs.lsky.pro/
 */
export default class LskyImageHostingService implements ImageHostingService {
  private config: { apiUrl: string; token: string };

  constructor(info: any) {
    this.config = {
      apiUrl: (info.apiUrl || '').replace(/\/+$/, ''),
      token: info.token || '',
    };
  }

  getId() {
    return 'lsky_image_hosting';
  }

  async uploadImage(request: UploadImageRequest): Promise<string> {
    // data URL 转 Blob
    const base64Data = request.data.replace(/^data:[^;]+;base64,/, '');
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const mimeMatch = request.data.match(/^data:([^;]+);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/png';
    const blob = new Blob([bytes], { type: mime });

    const formData = new FormData();
    formData.append('file', blob, `upload.${mime.split('/')[1] || 'png'}`);

    const response = await fetch(`${this.config.apiUrl}/api/v1/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.token}`,
        'Accept': 'application/json',
      },
      body: formData,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`Lsky API error: ${response.status} ${text.slice(0, 100)}`);
    }

    const data = await response.json();
    if (!data.status) {
      throw new Error(data.message || 'Lsky upload failed');
    }

    return data.data?.links?.url || data.data?.url || '';
  }

  async uploadImageUrl(url: string): Promise<string> {
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
