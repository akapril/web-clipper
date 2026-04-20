import { TextExtension } from '../../common';

interface PdfInfo {
  url: string;
  title: string;
  isPdf: boolean;
}

export default new TextExtension<PdfInfo>(
  {
    name: 'Save PDF',
    icon: 'file-pdf',
    version: '1.0.0',
    description: 'Save PDF file to Obsidian vault or download.',
    i18nManifest: {
      'zh-CN': { name: '保存 PDF', description: '将 PDF 文件保存到笔记或下载' },
      'en-US': { name: 'Save PDF', description: 'Save PDF file to notes or download' },
    },
  },
  {
    // 仅在 PDF 页面显示
    init: ({ url }) => {
      if (!url) return false;
      return url.endsWith('.pdf') || url.includes('/pdf/') || url.includes('pdf');
    },
    run: async (context) => {
      const { document } = context;
      const url = document.URL;
      const isPdf = url.endsWith('.pdf') ||
        document.contentType === 'application/pdf' ||
        url.includes('/pdf/');
      const title = document.title
        .replace(/\.pdf$/i, '')
        .replace(/[\/\\:*?"<>|]/g, '-')
        .trim() || 'document';
      return { url, title, isPdf };
    },
    afterRun: async (context) => {
      const { result, imageService, message } = context;

      if (!result.isPdf) {
        message.warning('当前页面不是 PDF');
        return context.data || '';
      }

      // 下载 PDF 文件
      let pdfBlob: Blob;
      try {
        const response = await fetch(result.url);
        if (!response.ok) {
          throw new Error(`${response.status}`);
        }
        pdfBlob = await response.blob();
      } catch (e: any) {
        message.error(`PDF 下载失败: ${e.message}`);
        return context.data || '';
      }

      const fileName = `${result.title}.pdf`;

      // 有图床（含 Obsidian 图床）时上传为附件
      if (imageService) {
        try {
          // 将 Blob 转为 base64 data URL
          const dataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(pdfBlob);
          });

          const remotePath = await imageService.uploadImage({ data: dataUrl });
          message.success('PDF 已保存为附件');

          // 生成包含 PDF 引用的笔记
          const now = new Date().toISOString().split('T')[0];
          return [
            `# ${result.title}`,
            '',
            `- 来源: [${result.title}](${result.url})`,
            `- 日期: ${now}`,
            `- 附件: ![[${remotePath}]]`,
            '',
            '---',
            '',
            context.data || '',
          ].join('\n').trim();
        } catch (e: any) {
          message.warning(`上传失败，改为下载: ${e.message}`);
        }
      }

      // 无图床或上传失败时，直接下载 PDF
      const { createAndDownloadFile } = context;
      createAndDownloadFile(fileName, pdfBlob);
      message.success('PDF 已下载');

      // 生成笔记引用源链接
      const now = new Date().toISOString().split('T')[0];
      return [
        `# ${result.title}`,
        '',
        `- 来源: [${result.title}](${result.url})`,
        `- 日期: ${now}`,
        '',
        context.data || '',
      ].join('\n').trim();
    },
  }
);
