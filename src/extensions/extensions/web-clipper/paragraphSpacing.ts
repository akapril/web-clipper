import { ToolExtension } from '../../common';

/**
 * 段落间距优化扩展
 * 确保 markdown 段落间有空行，提升可读性
 */
export default new ToolExtension(
  {
    name: 'Paragraph Spacing',
    icon: 'menu',
    version: '1.0.0',
    automatic: true,
    description: 'Add blank lines between paragraphs for better readability.',
    i18nManifest: {
      'zh-CN': { name: '段落间距', description: '在段落之间添加空行，提升 Markdown 可读性' },
      'en-US': { name: 'Paragraph Spacing', description: 'Add blank lines between paragraphs for better readability' },
    },
  },
  {
    afterRun: async (context) => {
      let content = context.data || '';
      if (!content.trim()) return content;

      // 标题前确保有空行
      content = content.replace(/([^\n])\n(#{1,6}\s)/g, '$1\n\n$2');
      // 标题后确保有空行
      content = content.replace(/(#{1,6}\s[^\n]+)\n([^\n#])/g, '$1\n\n$2');
      // 列表前确保有空行（非列表行后紧跟列表行）
      content = content.replace(/([^\n-*\d])\n([-*]\s|\d+\.\s)/g, '$1\n\n$2');
      // 代码块前后确保有空行
      content = content.replace(/([^\n])\n(```)/g, '$1\n\n$2');
      content = content.replace(/(```)\n([^\n])/g, '$1\n\n$2');
      // 清理超过两个连续空行为两个
      content = content.replace(/\n{3,}/g, '\n\n');

      return content;
    },
  }
);
