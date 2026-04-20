import { TextExtension } from '../../common';

interface PdfInfo {
  /** 实际的 PDF 文件 URL（可能从 viewer 参数中提取） */
  pdfUrl: string;
  title: string;
  isPdf: boolean;
}

/**
 * 从 URL 中提取实际的 PDF 地址
 * 支持直接 PDF URL 和 pdf.js viewer URL（file= 参数）
 */
function extractPdfUrl(url: string): string | null {
  // pdf.js viewer: viewer.html?file=xxx
  try {
    const u = new URL(url);
    const fileParam = u.searchParams.get('file');
    if (fileParam && (fileParam.endsWith('.pdf') || fileParam.includes('/pdf/'))) {
      return fileParam;
    }
  } catch (_e) {}
  // 直接 PDF URL
  if (url.endsWith('.pdf') || /\/pdf\/[^/]+/.test(url)) {
    return url;
  }
  return null;
}

export default new TextExtension<PdfInfo>(
  {
    name: 'Save PDF',
    icon: 'file-pdf',
    version: '1.0.1',
    description: 'Save PDF file to Obsidian vault or download.',
    i18nManifest: {
      'zh-CN': { name: '保存 PDF', description: '将 PDF 文件保存到笔记或下载' },
      'en-US': { name: 'Save PDF', description: 'Save PDF file to notes or download' },
    },
  },
  {
    // 仅在 PDF 页面或 pdf.js viewer 页面显示
    init: ({ url }) => {
      if (!url) return false;
      return extractPdfUrl(url) !== null;
    },
    run: async (context) => {
      const { document } = context;
      const url = document.URL;
      const pdfUrl = extractPdfUrl(url);
      const isPdf = pdfUrl !== null;
      const title = document.title
        .replace(/\.pdf$/i, '')
        .replace(/[\/\\:*?"<>|]/g, '-')
        .trim() || 'document';
      return { pdfUrl: pdfUrl || url, title, isPdf };
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
        const response = await fetch(result.pdfUrl);
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

          // 根据路径格式判断引用方式
          // 本地路径（Obsidian/SiYuan 等）用 wikilink，远程 URL 用 markdown 链接
          const isLocalPath = !remotePath.startsWith('http');
          const attachmentRef = isLocalPath
            ? `![[${remotePath}]]`
            : `[${fileName}](${remotePath})`;

          const now = new Date().toISOString().split('T')[0];
          return [
            `# ${result.title}`,
            '',
            `- 来源: [${result.title}](${result.pdfUrl})`,
            `- 日期: ${now}`,
            `- 附件: ${attachmentRef}`,
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
        `- 来源: [${result.title}](${result.pdfUrl})`,
        `- 日期: ${now}`,
        '',
        context.data || '',
      ].join('\n').trim();
    },
  }
);
