import { ToolExtension } from '../../common';

/**
 * 批量剪藏扩展
 * 获取当前窗口所有标签页的标题和 URL，生成一份链接列表
 * 用户可直接保存为书签合集笔记
 */
export default new ToolExtension(
  {
    name: 'Batch Clip',
    icon: 'unordered-list',
    version: '1.0.0',
    description: 'Clip all open tabs as a bookmark list.',
    i18nManifest: {
      'zh-CN': { name: '批量剪藏', description: '将当前窗口所有标签页保存为书签列表' },
      'en-US': { name: 'Batch Clip', description: 'Clip all open tabs as a bookmark list' },
    },
  },
  {
    afterRun: async (context) => {
      const { data, message } = context;

      try {
        // 获取当前窗口的所有标签页
        const tabs = await new Promise<chrome.tabs.Tab[]>((resolve) => {
          chrome.tabs.query({ currentWindow: true }, (tabs) => resolve(tabs || []));
        });

        const validTabs = tabs.filter(
          (t) => t.url && !t.url.startsWith('chrome://') && !t.url.startsWith('about:') &&
                 !t.url.startsWith('moz-extension://') && !t.url.startsWith('chrome-extension://')
        );

        if (validTabs.length === 0) {
          message.warning('没有可剪藏的标签页');
          return data || '';
        }

        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const timeStr = now.toTimeString().split(' ')[0];

        // 生成书签列表 markdown
        const lines = [
          `# 批量剪藏 ${dateStr} ${timeStr}`,
          '',
          `共 ${validTabs.length} 个页面`,
          '',
        ];

        validTabs.forEach((tab, i) => {
          lines.push(`${i + 1}. [${tab.title || 'Untitled'}](${tab.url})`);
        });

        message.success(`已收集 ${validTabs.length} 个标签页`);

        // 追加到现有内容或替换
        if (data && data.trim()) {
          return `${data}\n\n---\n\n${lines.join('\n')}`;
        }
        return lines.join('\n');
      } catch (e: any) {
        message.error(`批量剪藏失败: ${e.message}`);
        return data || '';
      }
    },
  }
);
