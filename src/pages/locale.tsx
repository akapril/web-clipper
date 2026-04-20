import React from 'react';
import { IntlProvider } from 'react-intl';
import { ConfigProvider } from 'antd';
import { connect } from 'dva';
import { localesMap } from '@/common/locales';
import { localeProvider } from '@/common/locales/antd';
import { GlobalStore } from '@/common/types';

const mapStateToProps = ({ userPreference: { locale } }: GlobalStore) => {
  return {
    locale,
  };
};
type PageStateProps = ReturnType<typeof mapStateToProps>;

const LocalWrapper: React.FC<PageStateProps> = ({ children, locale }) => {
  // 暗色主题暂时禁用，antd 4.x 在 iframe 内无法可靠覆盖样式
  // 后续升级 antd 5.x（支持 CSS-in-JS 主题切换）后重新启用
  const language = locale;
  const model = (localesMap.get(language) || localesMap.get('en-US'))!;
  return (
    <IntlProvider key={locale} locale={language} messages={model.messages}>
      <ConfigProvider
        locale={localeProvider[model.locale as keyof typeof localeProvider]}
        getPopupContainer={e => {
          if (!e || !e.parentNode) {
            return document.body;
          }
          return e.parentNode as HTMLElement;
        }}
      >
        {children}
      </ConfigProvider>
    </IntlProvider>
  );
};

export default connect(mapStateToProps)(LocalWrapper);
