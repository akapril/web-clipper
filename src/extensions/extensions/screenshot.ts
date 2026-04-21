import { TextExtension } from '@/extensions/common';
import { SelectAreaPosition } from '@web-clipper/area-selector';

export default new TextExtension<SelectAreaPosition>(
  {
    name: 'Screenshots',
    icon: 'picture',
    version: '0.0.2',
		i18nManifest: {
			'de-DE': { name: 'Screenshots', description: 'Speichern Sie den aktuellen Inhalt als Bild.' },
			'en-US': { name: 'Screenshots', description: 'Save current clipping content as an image.' },
			'ja-JP': { name: 'スクリーンショット', description: '現在のクリップ内容を画像として保存します。' },
			'ko-KR': { name: '스크린샷', description: '현재 클립 내용을 이미지로 저장합니다.' },
			'ru-RU': { name: 'Скриншоты', description: 'Сохранить текущее содержимое как изображение.' },
			'zh-CN': { name: '截图', description: '将当前剪藏内容保存为图片' },
		}
	},
  {
    // 移除图床依赖检查，无图床时使用 data URL 内联
    run: async context => {
      const { AreaSelector, toggleClipper, toggleLoading } = context;
      toggleClipper();
      const response = await new AreaSelector().start();
      toggleLoading();
      return response;
    },
    afterRun: async context => {
      const { result, loadImage, captureVisibleTab, imageService } = context;
      const base64Capture = await captureVisibleTab();
      const img = await loadImage(base64Capture);
      let canvas: HTMLCanvasElement = document.createElement('canvas');
      let ctx = canvas.getContext('2d');
      let sx;
      let sy;
      let sheight;
      let swidth;
      let {
        rightBottom: { clientX: rightBottomX, clientY: rightBottomY },
        leftTop: { clientX: leftTopX, clientY: leftTopY },
      } = result;
      if (rightBottomX === leftTopX && rightBottomY === leftTopY) {
        sx = 0;
        sy = 0;
        swidth = img.width;
        sheight = img.height;
      } else {
        const dpi = window.devicePixelRatio;
        sx = leftTopX * dpi;
        sy = leftTopY * dpi;
        swidth = (rightBottomX - leftTopX) * dpi;
        sheight = (rightBottomY - leftTopY) * dpi;
      }
      canvas.height = sheight;
      canvas.width = swidth;
      ctx!.drawImage(img, sx, sy, swidth, sheight, 0, 0, swidth, sheight);
      const dataUrl = canvas.toDataURL();

      // 有图床时上传
      if (imageService) {
        try {
          const url = await imageService.uploadImage({ data: dataUrl });
          return `![](${url})\n\n`;
        } catch (_e) {
          // 上传失败时回退
        }
      }
      // 无图床或上传失败：将图片转为 Blob URL 下载，markdown 中标注文件名
      const { createAndDownloadFile } = context;
      const timestamp = Date.now();
      const fileName = `screenshot-${timestamp}.png`;
      // data URL 转 Blob 下载
      const binaryString = atob(dataUrl.split(',')[1]);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: 'image/png' });
      createAndDownloadFile(fileName, blob);
      return `![${fileName}](${fileName})\n\n`;
    },
    destroy: async context => {
      const { toggleClipper, toggleLoading } = context;
      toggleLoading();
      toggleClipper();
    },
  }
);
