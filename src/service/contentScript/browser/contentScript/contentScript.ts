import { IContentScriptService, IToggleConfig } from '@/service/common/contentScript';
import { Service, Inject } from 'typedi';
import styles from '@/service/contentScript/browser/contentScript/contentScript.less';
import * as QRCode from 'qrcode';
import { Readability } from '@web-clipper/readability';
import AreaSelector from '@web-clipper/area-selector';
import Highlighter from '@web-clipper/highlight';
import plugins from '@web-clipper/turndown';
import TurndownService from 'turndown';
import { ContentScriptContext } from '@/extensions/common';
import { localStorageService } from '@/common/chrome/storage';
import { LOCAL_USER_PREFERENCE_LOCALE_KEY } from '@/common/types';
import { IExtensionContainer } from '@/service/common/extension';
import { getResourcePath } from '@/common/getResource';

const turndownService = new TurndownService({ codeBlockStyle: 'fenced' });
turndownService.use(plugins);
// 修复 #1310 + #963: 图片 URL 完整保留（含查询参数），HTTP 转 HTTPS
turndownService.addRule('robustImages', {
  filter: 'img',
  replacement: (_content, node) => {
    const img = node as HTMLImageElement;
    let src = img.getAttribute('src') || '';
    if (!src) return '';
    // HTTP → HTTPS (#1310)
    if (src.startsWith('http://')) {
      src = src.replace(/^http:\/\//, 'https://');
    }
    // 对含特殊字符的 URL 用尖括号包裹，防止 markdown 解析截断 (#963)
    const alt = (img.alt || '').replace(/[\[\]]/g, '');
    if (src.includes('?') || src.includes('(') || src.includes(')')) {
      return `![${alt}](<${src}>)`;
    }
    return `![${alt}](${src})`;
  },
});
// 修复 #1081: 保留代码块中的注释，不被 Turndown 剥离
turndownService.addRule('preserveCodeComments', {
  filter: (node) => {
    return node.nodeName === 'CODE' || node.nodeName === 'PRE';
  },
  replacement: (_content, node) => {
    const el = node as HTMLElement;
    const isBlock = el.nodeName === 'PRE' || el.querySelector('code');
    const codeEl = el.nodeName === 'PRE' ? el.querySelector('code') || el : el;
    const text = codeEl.textContent || '';
    if (isBlock) {
      // 检测语言类名
      const langClass = (codeEl.className || '').match(/language-(\w+)/);
      const lang = langClass ? langClass[1] : '';
      return `\n\n\`\`\`${lang}\n${text}\n\`\`\`\n\n`;
    }
    return `\`${text}\``;
  },
});

class ContentScriptService implements IContentScriptService {
  constructor(@Inject(IExtensionContainer) private extensionContainer: IExtensionContainer) {}

  async remove() {
    $(`.${styles.toolFrame}`).remove();
  }
  async hide() {
    $(`.${styles.toolFrame}`).hide();
  }
  async toggle(config: IToggleConfig) {
    const toolPath = getResourcePath('tool.html');
    let src = chrome.runtime.getURL(toolPath);
    if (config) {
      src = `${chrome.runtime.getURL(toolPath)}#${config.pathname}?${config.query}`;
    }
    if ($(`.${styles.toolFrame}`).length === 0) {
      if (config) {
        $('body').append(`<iframe src="${src}" class=${styles.toolFrame}></iframe>`);
        return;
      }
      $('body').append(`<iframe src="${src}" class=${styles.toolFrame}></iframe>`);
    } else {
      const srcRaw = $(`.${styles.toolFrame}`).attr('src');

      if (srcRaw !== src) {
        $(`.${styles.toolFrame}`).attr('src', src);
      }
      $(`.${styles.toolFrame}`).toggle();
    }
  }
  async getSelectionMarkdown() {
    let selection = document.getSelection();
    if (selection?.rangeCount) {
      let container = document.createElement('div');
      for (let i = 0, len = selection.rangeCount; i < len; ++i) {
        container.appendChild(selection.getRangeAt(i).cloneContents());
      }
      return turndownService.turndown(container.innerHTML);
    }
    return '';
  }
  async checkStatus() {
    return true;
  }
  async getPageUrl() {
    return location.href;
  }
  async toggleLoading() {
    const loadIngStyle = styles['web-clipper-loading-box'];
    if ($(`.${loadIngStyle}`).length === 0) {
      $('body').append(`
      <div class=${loadIngStyle}>
        <div class="web-clipper-loading">
          <div>
            <div class="line"></div>
            <div class="line"></div>
            <div class="line"></div>
            <div class="line"></div>
          </div>
        </div>
      </div>
      `);
    } else {
      $(`.${loadIngStyle}`).remove();
    }
  }

  async scrollPage(x: number, y: number) {
    window.scrollTo(x, y);
    // 等待滚动和懒加载内容渲染
    await new Promise(r => setTimeout(r, 350));
  }

  async runScript(id: string, lifeCycle: 'run' | 'destroy') {
    const extensions = this.extensionContainer.extensions;
    const extension = extensions.find((o) => o.id === id);
    const lifeCycleFunc = extension?.extensionLifeCycle[lifeCycle];
    if (!lifeCycleFunc) {
      return;
    }
    await localStorageService.init();
    const toggleClipper = () => {
      $(`.${styles.toolFrame}`).toggle();
    };
    const context: ContentScriptContext = {
      locale: localStorageService.get(LOCAL_USER_PREFERENCE_LOCALE_KEY, navigator.language),
      turndown: turndownService,
      Highlighter: Highlighter,
      toggleClipper,
      Readability,
      document,
      AreaSelector,
      QRCode,
      $,
      toggleLoading: () => {
        this.toggleLoading();
      },
    };
    $(`.${styles.toolFrame}`).blur();
    return lifeCycleFunc(context);
  }
}

Service(IContentScriptService)(ContentScriptService);
