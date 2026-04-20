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
    clipperData,
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
      clipperData,
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
      if (pathname === '/') {
        if (accounts.length === 0) {
          dispatch(routerRedux.push('/preference/account'));
        }
      }
    }, [accounts.length, dispatch, pathname]);

    const onRepositorySelect = useCallback(
      (repositoryId: string) => {
        dispatch(selectRepository({ repositoryId }));
      },
      [dispatch]
    );
    let repositoryId: string | undefined;
    if (currentRepository) {
      repositoryId = currentRepository.id;
    }
    useEffect(() => {
      if (currentAccount && currentAccount.defaultRepositoryId) {
        if (repositoryId) return;
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

    // 内容预览
    const previewContent = clipperData[pathname] || '';

    // 账户下拉菜单
    const overlay = useMemo(() => (
      <Menu onClick={e => dispatch(asyncChangeAccount.started({ id: e.key as string }))}>
        {accounts.map(o => (
          <Menu.Item key={o.id} title={o.name}>
            <UserItem
              avatar={o.avatar}
              name={o.name}
              description={o.description}
              icon={servicesMeta[o.type].icon}
            />
          </Menu.Item>
        ))}
      </Menu>
    ), [dispatch, accounts, servicesMeta]);

    const configService = Container.get(IConfigService);

    return (
      <ToolContainer onClickCloseButton={Container.get(IContentScriptService).hide}>
        {/* 顶栏 */}
        <div className={styles.topBar} style={{ borderColor: token.colorBorderSecondary }}>
          <span className={styles.title} style={{ color: token.colorText }}>Web Clipper</span>
          <div className={styles.actions}>
            <Dropdown overlay={overlay} placement="bottomRight">
              <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                {currentAccount && (
                  <IconAvatar size="small" avatar={currentAccount.avatar} icon={servicesMeta[currentAccount.type].icon} />
                )}
                <CaretDownOutlined style={{ fontSize: 8, color: token.colorTextTertiary, marginLeft: 4 }} />
              </div>
            </Dropdown>
            <Button
              type="text"
              size="small"
              icon={
                <Observer>
                  {() => (
                    <Badge dot={!configService.isLatestVersion} offset={[-2, 2]}>
                      <SettingOutlined style={{ fontSize: 15 }} />
                    </Badge>
                  )}
                </Observer>
              }
              onClick={() => push(pathname.startsWith('/preference') ? '/' : '/preference/account')}
            />
          </div>
        </div>

        {/* 主体分栏 */}
        <div className={styles.wrapper}>
          {/* 左侧：剪藏类型 + 工具 */}
          <div className={styles.leftPanel} style={{ borderColor: token.colorBorderSecondary }}>
            <div className={styles.sectionLabel} style={{ color: token.colorTextQuaternary }}>
              <FormattedMessage id="tool.clipExtensions" defaultMessage="Clip" />
            </div>
            {hasEditor && (
              <button
                className={`${styles.clipButton} ${pathname === '/editor' ? styles.clipButtonActive : ''}`}
                onClick={() => push('/editor')}
              >
                <EditOutlined style={{ fontSize: 13 }} />
                <span>Selection</span>
              </button>
            )}
            {clipExts.map(o => (
              <button
                key={o.id}
                className={`${styles.clipButton} ${pathname === o.router ? styles.clipButtonActive : ''}`}
                onClick={() => push(o.router)}
                title={o.manifest.description}
              >
                <IconFont type={o.manifest.icon} style={{ fontSize: 13 }} />
                <span>{o.manifest.name}</span>
              </button>
            ))}

            {toolExts.length > 0 && (
              <>
                <div className={styles.sectionLabel} style={{ color: token.colorTextQuaternary, marginTop: 4 }}>
                  <FormattedMessage id="tool.toolExtensions" defaultMessage="Tools" />
                </div>
                <div className={styles.toolGrid}>
                  {toolExts.map(o => (
                    <button
                      key={o.id}
                      className={styles.toolIcon}
                      title={o.manifest.description || o.manifest.name}
                      onClick={() =>
                        dispatch(asyncRunExtension.started({ pathname, extension: o }))
                      }
                    >
                      <IconFont type={o.manifest.icon} />
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* 右侧：表单 + 预览 + 操作 */}
          <div className={styles.rightPanel}>
            <Header
              pathname={pathname}
              service={currentService}
              currentRepository={currentRepository}
            />

            {/* 内容预览 */}
            {previewContent && (
              <div className={styles.previewArea} style={{
                borderColor: token.colorBorderSecondary,
                color: token.colorTextSecondary,
                background: token.colorBgLayout,
              }}>
                {typeof previewContent === 'string'
                  ? previewContent.slice(0, 500) + (previewContent.length > 500 ? '...' : '')
                  : ''}
              </div>
            )}

            {/* 目标选择 */}
            <div className={styles.bottomBar}>
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
          </div>
        </div>
      </ToolContainer>
    );
  },
  (prevProps: PageProps, nextProps: PageProps) => {
    const selector = ({
      repositories,
      currentAccount,
      currentRepository,
      history,
      loadingAccount,
      locale,
      servicesMeta,
      accounts,
      hasEditor,
      clipperData,
    }: PageProps) => ({
      hasEditor,
      loadingAccount,
      currentRepository,
      repositories,
      currentAccount,
      pathname: history.location.pathname,
      locale,
      servicesMeta,
      accounts,
      clipperData,
    });
    return isEqual(selector(prevProps), selector(nextProps));
  }
);

export default connect(mapStateToProps)(Page as React.FC<PageProps>);
