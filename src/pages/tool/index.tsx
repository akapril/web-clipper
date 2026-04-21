import React, { useEffect, useMemo, useCallback } from 'react';
import styles from './index.less';
import { CaretDownOutlined, SettingOutlined, EditOutlined } from '@ant-design/icons';
import { Button, Badge, Dropdown, Menu, theme } from 'antd';
import { connect, routerRedux } from 'dva';
import { GlobalStore } from '@/common/types';
import { isEqual } from 'lodash';
import { ToolContainer } from 'components/container';
import { selectRepository, asyncChangeAccount } from 'pageActions/clipper';
import { asyncRunExtension } from 'pageActions/userPreference';
import { DvaRouterProps } from 'common/types';
import useFilterExtensions from '@/common/hooks/useFilterExtensions';
import { FormattedMessage } from 'react-intl';
import matchUrl from '@/common/matchUrl';
import Header from './Header';
import RepositorySelect from '@/components/RepositorySelect';
import Container from 'typedi';
import { IConfigService } from '@/service/common/config';
import { Observer, useObserver } from 'mobx-react';
import IconAvatar from '@/components/avatar';
import UserItem from '@/components/userItem';
import { IContentScriptService } from '@/service/common/contentScript';
import { IExtensionService, IExtensionContainer } from '@/service/common/extension';
import { IExtensionWithId, InitContext } from '@/extensions/common';
import IconFont from '@/components/IconFont';

const mapStateToProps = ({
  clipper: {
    currentAccountId,
    url,
    currentRepository,
    repositories,
    currentImageHostingService,
    clipperData,
  },
  loading,
  account: { accounts },
  userPreference: { locale, servicesMeta },
}: GlobalStore) => {
  const currentAccount = accounts.find(o => o.id === currentAccountId);
  const loadingAccount = loading.effects[asyncChangeAccount.started.type];
  return {
    hasEditor: typeof clipperData['/editor'] !== 'undefined',
    loadingAccount,
    accounts,
    currentImageHostingService,
    url,
    currentAccountId,
    currentRepository,
    currentAccount,
    repositories,
    locale,
    servicesMeta,
  };
};
type PageStateProps = ReturnType<typeof mapStateToProps>;
type PageProps = PageStateProps & DvaRouterProps;

const Page = React.memo<PageProps>(
  props => {
    const extensionService = Container.get(IExtensionService);
    const { token } = theme.useToken();
    const {
      repositories,
      currentAccount,
      currentRepository,
      loadingAccount,
      url,
      currentImageHostingService,
      history: {
        location: { pathname },
      },
      dispatch,
      accounts,
      servicesMeta,
      hasEditor,
    } = props;

    const extensions = useObserver(() => {
      return Container.get(IExtensionContainer)
        .extensions.filter(o => !extensionService.DisabledExtensionIds.includes(o.id))
        .filter(o => !o.manifest.powerpack)
        .filter(o => {
          const matches = o.manifest.matches;
          if (Array.isArray(matches)) {
            return matches.some(o => matchUrl(o, url!));
          }
          return true;
        });
    });

    const currentService = currentAccount ? servicesMeta[currentAccount.type] : null;

    useEffect(() => {
      if (pathname === '/' && accounts.length === 0) {
        dispatch(routerRedux.push('/preference/account'));
      }
    }, [accounts.length, dispatch, pathname]);

    const onRepositorySelect = useCallback(
      (repositoryId: string) => dispatch(selectRepository({ repositoryId })),
      [dispatch]
    );
    let repositoryId: string | undefined;
    if (currentRepository) {
      repositoryId = currentRepository.id;
    }
    useEffect(() => {
      if (currentAccount?.defaultRepositoryId && !repositoryId) {
        onRepositorySelect(currentAccount.defaultRepositoryId);
      }
    }, [repositoryId, currentAccount, onRepositorySelect]);

    const push = (path: string) => dispatch(routerRedux.push(path));

    const enableExtensions: IExtensionWithId[] = extensions.filter(o => {
      if (o.extensionLifeCycle.init) {
        const context: InitContext = {
          locale: props.locale,
          accountInfo: { type: currentAccount && currentAccount.type },
          url,
          pathname,
          currentImageHostingService,
        };
        return o.extensionLifeCycle.init(context);
      }
      return true;
    });

    const [toolExts, clipExts] = useFilterExtensions(enableExtensions);
    const configService = Container.get(IConfigService);

    // 账户下拉
    const overlay = useMemo(() => (
      <Menu onClick={e => dispatch(asyncChangeAccount.started({ id: e.key as string }))}>
        {accounts.map(o => (
          <Menu.Item key={o.id} title={o.name}>
            <UserItem avatar={o.avatar} name={o.name} description={o.description} icon={servicesMeta[o.type].icon} />
          </Menu.Item>
        ))}
      </Menu>
    ), [dispatch, accounts, servicesMeta]);

    return (
      <ToolContainer onClickCloseButton={Container.get(IContentScriptService).hide}>
        {/* 顶栏 */}
        <div className={styles.topBar} style={{ borderColor: token.colorBorderSecondary, background: token.colorBgContainer }}>
          <span className={styles.title} style={{ color: token.colorText }}>Web Clipper</span>
          <div className={styles.actions}>
            <Dropdown overlay={overlay} placement="bottomRight">
              <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                {currentAccount && (
                  <IconAvatar size="small" avatar={currentAccount.avatar} icon={servicesMeta[currentAccount.type].icon} />
                )}
                <CaretDownOutlined style={{ fontSize: 8, color: token.colorTextTertiary, marginLeft: 3 }} />
              </div>
            </Dropdown>
            <Button
              type="text"
              size="small"
              icon={
                <Observer>{() => (
                  <Badge dot={!configService.isLatestVersion} offset={[-2, 2]}>
                    <SettingOutlined style={{ fontSize: 14, color: token.colorTextSecondary }} />
                  </Badge>
                )}</Observer>
              }
              onClick={() => push(pathname.startsWith('/preference') ? '/' : '/preference/account')}
            />
          </div>
        </div>

        {/* 标题 + 表单 */}
        <div className={styles.body}>
          <Header pathname={pathname} service={currentService} currentRepository={currentRepository} />
        </div>

        {/* 剪藏类型标签 */}
        <div className={styles.clipTabs} style={{ borderColor: token.colorBorderSecondary }}>
          {hasEditor && (
            <button
              className={`${styles.clipTab} ${pathname === '/editor' ? styles.clipTabActive : ''}`}
              onClick={() => push('/editor')}
            >
              <EditOutlined style={{ fontSize: 12 }} />
              <span>选取</span>
            </button>
          )}
          {clipExts.map(o => (
            <button
              key={o.id}
              className={`${styles.clipTab} ${pathname === o.router ? styles.clipTabActive : ''}`}
              onClick={() => push(o.router)}
              title={o.manifest.description}
            >
              <IconFont type={o.manifest.icon} style={{ fontSize: 12 }} />
              <span>{o.manifest.name}</span>
            </button>
          ))}
        </div>

        {/* 工具扩展图标 */}
        {toolExts.length > 0 && (
          <div className={styles.toolRow} style={{ borderColor: token.colorBorderSecondary }}>
            {toolExts.map(o => (
              <button
                key={o.id}
                className={styles.toolIcon}
                title={o.manifest.description || o.manifest.name}
                style={{ color: token.colorTextSecondary }}
                onClick={() => dispatch(asyncRunExtension.started({ pathname, extension: o }))}
              >
                <IconFont type={o.manifest.icon} />
              </button>
            ))}
          </div>
        )}

        {/* 底部：目标选择 + 保存 */}
        <div className={styles.footer} style={{ borderColor: token.colorBorderSecondary }}>
          <RepositorySelect
            disabled={loadingAccount}
            loading={loadingAccount}
            repositories={repositories}
            onSelect={onRepositorySelect}
            style={{ width: '100%' }}
            dropdownMatchSelectWidth={true}
            value={repositoryId}
          />
        </div>
      </ToolContainer>
    );
  },
  (prevProps: PageProps, nextProps: PageProps) => {
    const selector = ({
      repositories, currentAccount, currentRepository, history,
      loadingAccount, locale, servicesMeta, accounts, hasEditor,
    }: PageProps) => ({
      hasEditor, loadingAccount, currentRepository, repositories,
      currentAccount, pathname: history.location.pathname,
      locale, servicesMeta, accounts,
    });
    return isEqual(selector(prevProps), selector(nextProps));
  }
);

export default connect(mapStateToProps)(Page as React.FC<PageProps>);
