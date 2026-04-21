import { ToolExtension } from '../../common';

/**
 * 去除图片扩展 (#1274)
 * 从剪藏内容中移除所有 markdown 图片引用
 */
export default new ToolExtension(
  {
    name: 'Strip Images',
    icon: 'delete',
    version: '1.0.0',
    automatic: false,
    description: 'Remove all images from clipped content.',
    i18nManifest: {
      'zh-CN': { name: '去除图片', description: '移除内容中的所有图片' },
      'en-US': { name: 'Strip Images', description: 'Remove all images from clipped content' },
    },
  },
  {
    afterRun: async (context) => {
      let content = context.data || '';
      if (!content.trim()) return content;

      // 移除 markdown 图片: ![alt](url) 和 ![[wikilink]]
      content = content.replace(/!\[([^\]]*)\]\([^)]+\)/g, '');
      content = content.replace(/!\[\[[^\]]+\]\]/g, '');
      // 移除 HTML img 标签
      content = content.replace(/<img[^>]*>/gi, '');
      // 清理多余空行
      content = content.replace(/\n{3,}/g, '\n\n');

      context.message.success('已移除所有图片');
      return content.trim();
    },
  }
);
