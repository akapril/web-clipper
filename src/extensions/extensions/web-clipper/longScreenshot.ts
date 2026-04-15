import { TextExtension } from '@/extensions/common';
import { IContentScriptService } from '@/service/common/contentScript';
import { ITabService } from '@/service/common/tab';
import Container from 'typedi';

/** run() 返回的页面尺寸数据 */
interface PageDimensions {
  /** 页面完整高度 */
  totalHeight: number;
  /** 页面完整宽度 */
  totalWidth: number;
  /** 视口高度 */
  viewportHeight: number;
  /** 视口宽度 */
  viewportWidth: number;
  /** 设备像素比 */
  dpi: number;
}

export default new TextExtension<PageDimensions>(
  {
    name: 'Long Screenshot',
    icon: 'picture',
    version: '0.0.1',
    i18nManifest: {
      'zh-CN': { name: '长截图', description: '截取整个页面的长图' },
      'en-US': { name: 'Long Screenshot', description: 'Capture full page as a long screenshot' },
    },
  },
  {
    run: async (context) => {
      const { toggleClipper } = context;
      // 隐藏剪藏UI避免遮挡截图
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

      // 先滚动到顶部
      window.scrollTo(0, 0);
      await new Promise((r) => setTimeout(r, 200));

      return { totalHeight, totalWidth, viewportHeight, viewportWidth, dpi };
    },

    afterRun: async (context) => {
      const { result, loadImage, captureVisibleTab, imageService } = context;
      const { totalHeight, totalWidth, viewportHeight, viewportWidth, dpi } = result;

      // 通过 IPC 获取内容脚本服务（用于滚动页面）和标签服务
      const contentScriptService = Container.get(IContentScriptService);

      // 计算需要滚动的位置
      const scrollPositions: number[] = [];
      for (let y = 0; y < totalHeight; y += viewportHeight) {
        scrollPositions.push(y);
      }

      // 创建完整画布
      const canvas = document.createElement('canvas');
      canvas.width = viewportWidth * dpi;
      canvas.height = totalHeight * dpi;
      const ctx = canvas.getContext('2d')!;

      // 逐段滚动、截图、绘制到画布
      for (let i = 0; i < scrollPositions.length; i++) {
        const scrollY = scrollPositions[i];

        // 通过 IPC 通知内容脚本滚动页面
        await contentScriptService.scrollPage(0, scrollY);

        // 截取当前可见区域
        const base64Capture = await captureVisibleTab();
        const img = await loadImage(base64Capture);

        // 计算本段在画布上的绘制位置和高度
        const drawY = scrollY * dpi;
        // 最后一段可能不足一个视口高度，需要特殊处理
        const remainingHeight = totalHeight - scrollY;
        const segmentHeight = Math.min(viewportHeight, remainingHeight);

        if (segmentHeight < viewportHeight) {
          // 最后一段：只取截图底部对应的部分
          const srcY = (viewportHeight - segmentHeight) * dpi;
          ctx.drawImage(
            img,
            0,
            srcY,
            img.width,
            segmentHeight * dpi,
            0,
            drawY,
            img.width,
            segmentHeight * dpi
          );
        } else {
          // 正常段：整个截图绘制
          ctx.drawImage(img, 0, 0, img.width, img.height, 0, drawY, img.width, img.height);
        }
      }

      // 滚回顶部
      await contentScriptService.scrollPage(0, 0);

      // 导出画布为 data URL
      const dataUrl = canvas.toDataURL('image/png');

      // 有图床时上传，无图床时用 data URL 内联
      if (imageService) {
        try {
          const url = await imageService.uploadImage({ data: dataUrl });
          return `![](${url})\n\n`;
        } catch (_e) {
          // 上传失败时回退到 data URL
          return `![long-screenshot](${dataUrl})\n\n`;
        }
      }
      return `![long-screenshot](${dataUrl})\n\n`;
    },

    destroy: async (context) => {
      const { toggleClipper } = context;
      toggleClipper();
    },
  }
);
