import { TextExtension } from '../../common';

/** run() 返回的页面尺寸数据 */
interface PageDimensions {
  totalHeight: number;
  totalWidth: number;
  viewportHeight: number;
  viewportWidth: number;
  dpi: number;
  tabId: number;
}

/**
 * 通过 chrome.tabs.sendMessage 让 content script 滚动页面
 */
async function scrollPage(tabId: number, x: number, y: number): Promise<void> {
  try {
    await chrome.tabs.sendMessage(tabId, {
      uuid: 'contentScript',
      command: 'scrollPage',
      arg: [x, y],
    });
  } catch (_e) {
    // 回退：直接执行脚本滚动
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        func: (sx: number, sy: number) => window.scrollTo(sx, sy),
        args: [x, y],
      });
      await new Promise(r => setTimeout(r, 350));
    } catch (_e2) {}
  }
}

export default new TextExtension<PageDimensions>(
  {
    name: 'Long Screenshot',
    icon: 'picture',
    version: '0.0.2',
    i18nManifest: {
      'zh-CN': { name: '长截图', description: '截取整个页面的长图' },
      'en-US': { name: 'Long Screenshot', description: 'Capture full page as a long screenshot' },
    },
  },
  {
    run: async (context) => {
      const { toggleClipper } = context;
      toggleClipper();

      const totalHeight = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight
      );
      const totalWidth = Math.max(
        document.body.scrollWidth,
        document.documentElement.scrollWidth
      );
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const dpi = window.devicePixelRatio || 1;

      window.scrollTo(0, 0);
      await new Promise((r) => setTimeout(r, 200));

      // 获取当前 tab ID
      const tab = await new Promise<chrome.tabs.Tab>((resolve) => {
        chrome.runtime.sendMessage({ type: 'getCurrentTab' }, resolve);
      }).catch(() => null);

      return {
        totalHeight, totalWidth, viewportHeight, viewportWidth, dpi,
        tabId: (tab as any)?.id || 0,
      };
    },

    afterRun: async (context) => {
      const { result, loadImage, captureVisibleTab, imageService } = context;
      const { totalHeight, viewportHeight, viewportWidth, dpi } = result;

      // 获取当前 tab ID 用于滚动
      const currentTab = await new Promise<any>((resolve) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => resolve(tabs[0]));
      }).catch(() => null);
      const tabId = currentTab?.id || result.tabId;

      if (!tabId) {
        context.message.error('无法获取当前标签页');
        return context.data || '';
      }

      const scrollPositions: number[] = [];
      for (let y = 0; y < totalHeight; y += viewportHeight) {
        scrollPositions.push(y);
      }

      const canvas = document.createElement('canvas');
      canvas.width = viewportWidth * dpi;
      canvas.height = totalHeight * dpi;
      const ctx = canvas.getContext('2d')!;

      for (let i = 0; i < scrollPositions.length; i++) {
        const scrollY = scrollPositions[i];

        await scrollPage(tabId, 0, scrollY);

        const base64Capture = await captureVisibleTab();
        const img = await loadImage(base64Capture);

        const drawY = scrollY * dpi;
        const remainingHeight = totalHeight - scrollY;
        const segmentHeight = Math.min(viewportHeight, remainingHeight);

        if (segmentHeight < viewportHeight) {
          const srcY = (viewportHeight - segmentHeight) * dpi;
          ctx.drawImage(img, 0, srcY, img.width, segmentHeight * dpi, 0, drawY, img.width, segmentHeight * dpi);
        } else {
          ctx.drawImage(img, 0, 0, img.width, img.height, 0, drawY, img.width, img.height);
        }
      }

      // 滚回顶部
      await scrollPage(tabId, 0, 0);

      const dataUrl = canvas.toDataURL('image/png');

      // 有图床时上传
      if (imageService) {
        try {
          const url = await imageService.uploadImage({ data: dataUrl });
          return `![](${url})\n\n`;
        } catch (_e) {}
      }
      // 无图床或上传失败：下载文件
      const { createAndDownloadFile } = context;
      const timestamp = Date.now();
      const fileName = `long-screenshot-${timestamp}.png`;
      const binaryString = atob(dataUrl.split(',')[1]);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'image/png' });
      createAndDownloadFile(fileName, blob);
      return `![${fileName}](${fileName})\n\n`;
    },

    destroy: async (context) => {
      const { toggleClipper } = context;
      toggleClipper();
    },
  }
);
