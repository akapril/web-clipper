import React from 'react';
import { createFromIconfontCN, QuestionCircleOutlined } from '@ant-design/icons';
import Container from 'typedi';
import { IConfigService } from '@/service/common/config';
import { Observer, useObserver } from 'mobx-react';

interface IconFontProps {
  type: string;
  style?: React.CSSProperties;
  className?: string;
  onClick?: React.MouseEventHandler;
}

const IconFont: React.FC<IconFontProps> = (props) => {
  const configService = Container.get(IConfigService);
  const RemoteIconFont = useObserver(() => {
    return createFromIconfontCN({ scriptUrl: './icon.js' });
  });
  return (
    <Observer>
      {() => {
        if (!configService.remoteIconSet.has(props.type)) {
          // antd 5 没有通用 Icon 组件，对未知图标使用默认图标
          return <QuestionCircleOutlined style={props.style} className={props.className} onClick={props.onClick} />;
        }
        if (!props.type) {
          throw new Error('Type is required');
        }
        return <RemoteIconFont {...props} type={props.type!} />;
      }}
    </Observer>
  );
};

export default IconFont;
