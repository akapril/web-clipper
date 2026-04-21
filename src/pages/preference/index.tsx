import * as React from 'react';
import styles from './index.less';
import Account from './account';
import ImageHosting from './imageHosting';
import Extensions from './extensions';
import { CenterContainer } from 'components/container';
import { router, connect } from 'dva';

import {
  CloseOutlined,
  PictureOutlined,
  ToolOutlined,
  UserOutlined,
  SettingOutlined,
} from '@ant-design/icons';

import { Badge, message, theme } from 'antd';
import { FormattedMessage } from 'react-intl';
import Base from './base';
import { DvaRouterProps, GlobalStore } from '@/common/types';
import Changelog from './changelog';
import IconFont from '@/components/IconFont';
import Privacy from './privacy';
import locale from '@/common/locales';
import Container from 'typedi';
import { IConfigService } from '@/service/common/config';
import { useObserver } from 'mobx-react';

const { Route } = router;

const mapStateToProps = ({ account: { accounts } }: GlobalStore) => {
  return { accounts };
};
type PageStateProps = ReturnType<typeof mapStateToProps>;

const tabs = [
  {
    path: 'account',
    icon: <UserOutlined />,
    title: <FormattedMessage id="preference.tab.account" defaultMessage="Account" />,
    component: Account,
  },
  {
    path: 'extensions',
    icon: <ToolOutlined />,
    title: <FormattedMessage id="preference.tab.extensions" defaultMessage="Extension" />,
    component: Extensions,
  },
  {
    path: 'imageHost',
    icon: <PictureOutlined />,
    title: <FormattedMessage id="preference.tab.imageHost" defaultMessage="ImageHost" />,
    component: ImageHosting,
  },
  {
    path: 'base',
    icon: <SettingOutlined />,
    title: <FormattedMessage id="preference.tab.basic" defaultMessage="Basic" />,
    component: Base,
  },
  {
    path: 'privacy',
    icon: <IconFont type="privacy" />,
    title: <FormattedMessage id="preference.tab.privacy" defaultMessage="Privacy policy" />,
    component: Privacy,
  },
  {
    path: 'changelog',
    icon: <IconFont type="changelog" />,
    title: <FormattedMessage id="preference.tab.changelog" defaultMessage="Changelog" />,
    component: Changelog,
  },
];

type PageProps = DvaRouterProps & PageStateProps;

const Preference: React.FC<PageProps> = ({
  location: { pathname },
  history: { push },
  accounts,
}) => {
  const { token } = theme.useToken();
  const goHome = () => {
    if (accounts.length === 0) {
      message.error(
        locale.format({
          id: 'preference.bind.message',
          defaultMessage: 'You need to bind an account before you can use it.',
        })
      );
      return;
    }
    push('/');
  };

  const configService = Container.get(IConfigService);
  const isLatestVersion = useObserver(() => configService.isLatestVersion);

  return (
    <CenterContainer>
      <div className={styles.mainContent} style={{ background: token.colorBgContainer, borderColor: token.colorBorder }}>
        <div onClick={goHome} className={styles.closeIcon} style={{ color: token.colorTextSecondary }}>
          <CloseOutlined />
        </div>
        <div style={{ display: 'flex', height: '100%' }}>
          {/* 左侧菜单 */}
          <div className={styles.menuList} style={{ borderColor: token.colorBorderSecondary }}>
            {tabs.map(tab => {
              const path = `/preference/${tab.path}`;
              const isActive = pathname === path;
              let label = (
                <div
                  className={`${styles.menuItem} ${isActive ? styles.menuItemActive : ''}`}
                  style={isActive ? { background: token.colorPrimaryBg, color: token.colorPrimary } : { color: token.colorText }}
                  onClick={() => push(path)}
                >
                  {tab.icon}
                  <span style={{ marginLeft: 6 }}>{tab.title}</span>
                </div>
              );
              if (!isLatestVersion && tab.path === 'base') {
                label = <Badge dot key={path}>{label}</Badge>;
              }
              return <React.Fragment key={path}>{label}</React.Fragment>;
            })}
          </div>
          {/* 右侧内容 */}
          <div className={styles.tabPane}>
            {tabs.map(tab => {
              const path = `/preference/${tab.path}`;
              return <Route exact key={path} path={path} component={tab.component} />;
            })}
          </div>
        </div>
      </div>
    </CenterContainer>
  );
};

export default connect(mapStateToProps)(Preference);
