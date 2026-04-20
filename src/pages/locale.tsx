import React from 'react';
import { IntlProvider } from 'react-intl';
import { ConfigProvider, theme } from 'antd';
import { connect } from 'dva';
import { useObserver } from 'mobx-react';
import Container from 'typedi';
import { localesMap } from '@/common/locales';
import { localeProvider } from '@/common/locales/antd';
import { GlobalStore } from '@/common/types';
import { IPreferenceService } from '@/service/common/preference';

const mapStateToProps = ({ userPreference: { locale } }: GlobalStore) => {
  return {
    locale,
  };
};
type PageStateProps = ReturnType<typeof mapStateToProps>;

const LocalWrapper: React.FC<PageStateProps> = ({ children, locale }) => {
  const language = locale;
  const model = (localesMap.get(language) || localesMap.get('en-US'))!;

  // 通过 iconColor 偏好检测暗色模式
  const iconColor = useObserver(() => {
    return Container.get(IPreferenceService).userPreference.iconColor;
  });
  const isDark =
    iconColor === 'dark' ||
    (iconColor === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <IntlProvider key={locale} locale={language} messages={model.messages}>
      <ConfigProvider
        locale={localeProvider[model.locale as keyof typeof localeProvider]}
        theme={isDark ? { algorithm: theme.darkAlgorithm } : undefined}
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
