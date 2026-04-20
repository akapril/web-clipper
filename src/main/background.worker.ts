import 'reflect-metadata';
import 'regenerator-runtime/runtime';

// services
import { IContentScriptService } from '@/service/common/contentScript';
import { ICookieService } from '@/service/common/cookie';
import { IChannelServer } from '@/service/common/ipc';
import { IPermissionsService } from '@/service/common/permissions';
import { ITabService } from '@/service/common/tab';
import { IWebRequestService } from '@/service/common/webRequest';
import { ContentScriptChannelClient } from '@/service/contentScript/common/contentScriptIPC';
import '@/service/cookie/background/cookieService';
import { CookieChannel } from '@/service/cookie/common/cookieIpc';
import { BackgroundIPCServer } from '@/service/ipc/browser/background-main/ipcService';
import { PopupContentScriptIPCClient } from '@/service/ipc/browser/popup/ipcClient';
import '@/service/permissions/chrome/permissionsService';
import { PermissionsChannel } from '@/service/permissions/common/permissionsIpc';
import '@/service/tab/browser/background/tabService';
import { TabChannel } from '@/service/tab/common/tabIpc';
import '@/service/webRequest/chrome/background/tabService';
import { WebRequestChannel } from '@/service/webRequest/common/webRequestIPC';
import Container from 'typedi';
import { WorkerServiceChannel } from '@/service/worker/common/workserServiceIPC';
import '@/service/worker/worker/workerService';
import { IWorkerService } from '@/service/worker/common';
import '@/service/extension/browser/extensionContainer';
import '@/service/extension/browser/extensionService';
import { ILocalStorageService } from '@/service/common/storage';
//
import { syncStorageService, localStorageService } from '@/common/chrome/storage';
Container.set(ILocalStorageService, localStorageService);
Container.set(ISyncStorageService, syncStorageService);
import { ISyncStorageService } from '@/service/common/storage';
//
import localeService from '@/common/locales';
import { ILocaleService } from '@/service/common/locale';
import { IExtensionContainer, IExtensionService } from '@/service/common/extension';
import { getResourcePath } from '@/common/getResource';
Container.set(ILocaleService, localeService);

function main() {
  const backgroundIPCServer: IChannelServer = new BackgroundIPCServer();
  backgroundIPCServer.registerChannel('tab', new TabChannel(Container.get(ITabService)));
  backgroundIPCServer.registerChannel(
    'worker',
    new WorkerServiceChannel(Container.get(IWorkerService))
  );
  const contentScriptIPCClient = new PopupContentScriptIPCClient(Container.get(ITabService));
  const contentScriptChannel = contentScriptIPCClient.getChannel('contentScript');
  Container.set(IContentScriptService, new ContentScriptChannelClient(contentScriptChannel));
  const contentScriptService = Container.get(IContentScriptService);
  /**
   * 检测是否为 Firefox（Firefox manifest 中脚本路径带 chrome/ 前缀）
   */
  const isFirefox = typeof navigator !== 'undefined' && navigator.userAgent.includes('Firefox');
  const contentScriptFile = isFirefox ? 'chrome/content_script.js' : 'content_script.js';

  chrome.action.onClicked.addListener(async (tab) => {
    if (!tab || !tab.id) {
      return;
    }
    try {
      await contentScriptService.checkStatus();
      contentScriptService.toggle();
    } catch (_e) {
      // content script 未注入，按优先级尝试三种方案

      // 方案1：chrome.scripting API（MV3）
      let injected = false;
      if (chrome.scripting?.executeScript) {
        try {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: [contentScriptFile],
          });
          await new Promise(r => setTimeout(r, 500));
          await contentScriptService.checkStatus();
          contentScriptService.toggle();
          injected = true;
        } catch (_e2) {
          // scripting API 失败，继续尝试下一个方案
        }
      }

      // 方案2：自动刷新页面（最可靠，manifest 声明的 content_scripts 会在页面加载时自动注入）
      if (!injected) {
        try {
          await chrome.tabs.reload(tab.id);
          // 等待页面刷新和 content script 初始化
          await new Promise(r => setTimeout(r, 2000));
          await contentScriptService.checkStatus();
          contentScriptService.toggle();
          injected = true;
        } catch (_e3) {
          // 刷新后仍失败
        }
      }

      // 方案3：都失败了，显示提示（如 about:、chrome:// 等特殊页面）
      if (!injected) {
        chrome.tabs.create({
          url: `${chrome.runtime.getURL(getResourcePath('error.html'))}`,
        });
      }
    }
  });
  backgroundIPCServer.registerChannel(
    'permissions',
    new PermissionsChannel(Container.get(IPermissionsService))
  );

  backgroundIPCServer.registerChannel(
    'webRequest',
    new WebRequestChannel(Container.get(IWebRequestService))
  );

  backgroundIPCServer.registerChannel('cookies', new CookieChannel(Container.get(ICookieService)));

  chrome.contextMenus.onClicked.addListener(async (_info, tab) => {
    const extensionContainer = Container.get(IExtensionContainer);
    const extensionService = Container.get(IExtensionService);
    const contentScriptService = Container.get(IContentScriptService);
    await extensionContainer.init();
    await extensionService.init();
    const contextMenus = extensionContainer.contextMenus;
    const currentContextMenus = contextMenus.filter(
      (p) => !extensionService.DisabledExtensionIds.includes(p.id)
    );
    let config: unknown;
    const Menu = currentContextMenus.find((p) => p.id === _info.menuItemId)!;
    if (!Menu) {
      return;
    }
    const instance = new Menu.contextMenu();
    if (instance.manifest.extensionId) {
      config =
        extensionService.getExtensionConfig(instance.manifest.extensionId!) ||
        instance.manifest.config?.default;
    }
    instance.run(tab!, {
      config,
      contentScriptService,
    });
  });

  chrome.commands.onCommand.addListener(async (e) => {
    if (e === 'save-selection') {
      const extensionService = Container.get(IExtensionService);
      const extensionContainer = Container.get(IExtensionContainer);
      const contextMenus = extensionContainer.contextMenus;
      const currentContextMenus = contextMenus.filter(
        // eslint-disable-next-line max-nested-callbacks
        (p) => !extensionService.DisabledExtensionIds.includes(p.id)
      );
      for (const iterator of currentContextMenus) {
        const Factory = iterator.contextMenu;
        const instance = new Factory();
        if (iterator.id === 'contextMenus.selection.save') {
          let config: unknown;
          if (instance.manifest.extensionId) {
            config =
              extensionService.getExtensionConfig(instance.manifest.extensionId!) ||
              instance.manifest.config?.default;
          }
          instance.run((await Container.get(ITabService).getCurrent()) as any, {
            config,
            contentScriptService,
          });
        }
      }
    }
  });
}

try {
  main();
} catch (error) {
  console.log((error as Error).message);
  console.error(error);
}
