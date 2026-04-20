import React, { useEffect } from 'react';
import { IntlProvider } from 'react-intl';
import { ConfigProvider } from 'antd';
import { connect } from 'dva';
import { localesMap } from '@/common/locales';
import { localeProvider } from '@/common/locales/antd';
import { GlobalStore } from '@/common/types';
import { useObserver } from 'mobx-react';
import Container from 'typedi';
import { IPreferenceService } from '@/service/common/preference';

const mapStateToProps = ({ userPreference: { locale } }: GlobalStore) => {
  return {
    locale,
  };
};
type PageStateProps = ReturnType<typeof mapStateToProps>;

const LocalWrapper: React.FC<PageStateProps> = ({ children, locale }) => {
  // 根据图标颜色设置应用暗色主题（dark = 暗色，auto = 跟随系统）
  const iconColor = useObserver(() => {
    return Container.get(IPreferenceService).userPreference.iconColor;
  });

  useEffect(() => {
    let isDark = false;
    if (iconColor === 'dark') {
      isDark = true;
    } else if (iconColor === 'auto') {
      isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    document.body.classList.toggle('dark-mode', isDark);
  }, [iconColor]);
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
