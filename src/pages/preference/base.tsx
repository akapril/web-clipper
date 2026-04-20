import React, { useCallback, useRef } from 'react';
import { GlobalStore, DvaRouterProps } from '@/common/types';
import { connect } from 'dva';
import { List, Select, Switch, Button, message, Space } from 'antd';
import { asyncSetLocaleToStorage, asyncSetEditorLiveRendering } from '@/actions/userPreference';
import { FormattedMessage } from 'react-intl';
import { locales } from '@/common/locales';
import { useObserver } from 'mobx-react';
import Container from 'typedi';
import { IConfigService } from '@/service/common/config';
import { IPreferenceService } from '@/service/common/preference';

/** 需要导出的所有存储 key */
const SYNC_KEYS = [
  'accounts', 'defaultAccountId', 'defaultPluginId',
  'liveRendering', 'showLineNumber', 'imageHosting', 'iconColor',
];
const LOCAL_KEYS = [
  'local.userPreference.locale', 'extensionConfig',
  'local.extensions.disabled.extensions',
  'local.extensions.enable.automatic.extensions',
];

const mapStateToProps = ({ userPreference: { locale, liveRendering, iconColor } }: GlobalStore) => {
  return {
    locale,
    liveRendering,
    iconColor,
  };
};
type PageStateProps = ReturnType<typeof mapStateToProps>;

type PageProps = PageStateProps & DvaRouterProps;

const Base: React.FC<PageProps> = (props) => {
  const { dispatch } = props;
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 导出设置
  const handleExport = useCallback(async () => {
    try {
      const syncData = await new Promise<Record<string, any>>(resolve =>
        chrome.storage.sync.get(SYNC_KEYS, resolve)
      );
      const localData = await new Promise<Record<string, any>>(resolve =>
        chrome.storage.local.get(LOCAL_KEYS, resolve)
      );
      const exportData = {
        _version: 1,
        _exportTime: new Date().toISOString(),
        _app: 'web-clipper',
        sync: syncData,
        local: localData,
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `web-clipper-settings-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      message.success('设置已导出');
    } catch (e: any) {
      message.error(`导出失败: ${e.message}`);
    }
  }, []);

  // 导入设置
  const handleImport = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (data._app !== 'web-clipper' || !data.sync || !data.local) {
        message.error('无效的配置文件');
        return;
      }
      // 写入 sync storage
      await new Promise<void>((resolve, reject) =>
        chrome.storage.sync.set(data.sync, () =>
          chrome.runtime.lastError ? reject(new Error(chrome.runtime.lastError.message)) : resolve()
        )
      );
      // 写入 local storage
      await new Promise<void>((resolve, reject) =>
        chrome.storage.local.set(data.local, () =>
          chrome.runtime.lastError ? reject(new Error(chrome.runtime.lastError.message)) : resolve()
        )
      );
      message.success('设置已导入，请刷新扩展');
      // 刷新页面以加载新设置
      setTimeout(() => window.location.reload(), 1000);
    } catch (e: any) {
      message.error(`导入失败: ${e.message}`);
    }
    // 清空 input 以允许重复选择同一文件
    e.target.value = '';
  }, []);

  const { iconColor, preferenceService } = useObserver(() => {
    const preferenceService = Container.get(IPreferenceService);
    return {
      preferenceService,
      iconColor: preferenceService.userPreference.iconColor,
    } as const;
  });

  const originConfigs = [
    {
      key: 'configLanguage',
      action: (
        <Select
          key="configLanguage"
          value={props.locale}
          onChange={(e: string) => dispatch(asyncSetLocaleToStorage(e))}
          dropdownMatchSelectWidth={false}
        >
          {locales.map((o) => (
            <Select.Option key={o.locale} value={o.locale}>
              {o.name}
            </Select.Option>
          ))}
        </Select>
      ),
      title: (
        <FormattedMessage id="preference.basic.configLanguage.title" defaultMessage="Language" />
      ),
      description: (
        <FormattedMessage
          id="preference.basic.configLanguage.description"
          defaultMessage="My native language is Chinese,Welcome to submit a translation on GitHub"
          values={{
            GitHub: (
              <a
                href="https://github.com/webclipper/web-clipper/tree/master/src/common/locales/data"
                target="_blank"
              >
                GitHub
              </a>
            ),
          }}
        />
      ),
    },
    {
      key: 'iconColor',
      action: (
        <Select
          key="configLanguage"
          value={iconColor}
          dropdownMatchSelectWidth={false}
          onChange={preferenceService.updateIconColor}
        >
          {[
            {
              name: <FormattedMessage id="preference.basic.iconColor.dark" />,
              value: 'dark',
            },
            {
              name: <FormattedMessage id="preference.basic.iconColor.auto" />,
              value: 'auto',
            },
            {
              name: <FormattedMessage id="preference.basic.iconColor.light" />,
              value: 'light',
            },
          ].map((o) => (
            <Select.Option key={o.value} value={o.value}>
              {o.name}
            </Select.Option>
          ))}
        </Select>
      ),
      title: <FormattedMessage id="preference.basic.iconColor.title" defaultMessage="Icon Color" />,
      description: (
        <FormattedMessage id="preference.basic.iconColor.description" defaultMessage="Icon Color" />
      ),
    },
    {
      key: 'liveRendering',
      action: (
        <Switch
          key="liveRendering"
          checked={props.liveRendering}
          onChange={() => {
            dispatch(
              asyncSetEditorLiveRendering.started({
                value: props.liveRendering,
              })
            );
          }}
        />
      ),
      title: (
        <FormattedMessage
          id="preference.basic.liveRendering.title"
          defaultMessage="LiveRendering"
        />
      ),
      description: (
        <FormattedMessage
          id="preference.basic.liveRendering.description"
          defaultMessage="Enable LiveRendering"
        />
      ),
    },
  ];

  const configService = Container.get(IConfigService);

  const configs = useObserver(() => {
    if (configService.isLatestVersion) {
      return originConfigs;
    }
    return originConfigs.concat({
      key: 'update',
      action: (
        <a href="https://github.com/webclipper/web-clipper/releases" target="_blank">
          <FormattedMessage id="preference.basic.update.button" defaultMessage="Install Update" />
        </a>
      ),
      title: <FormattedMessage id="preference.basic.update.title" defaultMessage="Has Update" />,
      description: (
        <FormattedMessage
          id="preference.basic.update.description"
          defaultMessage="Because the review takes a week, the chrome version will fall behind."
        />
      ),
    });
  });

  return (
    <React.Fragment>
      {configs.map(({ key, action, title, description }) => (
        <List.Item key={key} actions={[action]}>
          <List.Item.Meta title={title} description={description} />
        </List.Item>
      ))}
      <List.Item
        key="settingsBackup"
        actions={[
          <Space key="actions">
            <Button size="small" onClick={handleExport}>导出</Button>
            <Button size="small" onClick={handleImport}>导入</Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          </Space>,
        ]}
      >
        <List.Item.Meta
          title="设置备份"
          description="导出或导入所有账户、图床、扩展配置"
        />
      </List.Item>
    </React.Fragment>
  );
};

export default connect(mapStateToProps)(Base as React.FC<PageProps>) as any;
