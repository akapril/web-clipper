import React from 'react';
import { createFromIconfontCN } from '@ant-design/icons';
import * as AntdIcons from '@ant-design/icons';
import Container from 'typedi';
import { IConfigService } from '@/service/common/config';
import { Observer, useObserver } from 'mobx-react';

interface IconFontProps {
  type: string;
  style?: React.CSSProperties;
  className?: string;
  onClick?: React.MouseEventHandler;
}

/**
 * 将 kebab-case 图标名转为 PascalCase + Outlined 后缀
 * 例如: "file-pdf" → "FilePdfOutlined", "copy" → "CopyOutlined"
 */
function getAntdIconComponent(type: string): React.ComponentType<any> | null {
  const pascal = type
    .split('-')
    .map(s => s.charAt(0).toUpperCase() + s.slice(1))
    .join('');
  const iconName = `${pascal}Outlined`;
  const icon = (AntdIcons as any)[iconName];
  return icon || null;
}

const IconFont: React.FC<IconFontProps> = (props) => {
  const configService = Container.get(IConfigService);
  const RemoteIconFont = useObserver(() => {
    return createFromIconfontCN({ scriptUrl: './icon.js' });
  });
  return (
    <Observer>
      {() => {
        if (!props.type) {
          return null;
        }
        // 优先使用 iconfont 自定义图标
        if (configService.remoteIconSet.has(props.type)) {
          return <RemoteIconFont {...props} type={props.type} />;
        }
        // 回退到 antd 内置图标
        const AntdIcon = getAntdIconComponent(props.type);
        if (AntdIcon) {
          return <AntdIcon style={props.style} className={props.className} onClick={props.onClick} />;
        }
        // 都没有，直接渲染文字
        return <span style={props.style} className={props.className} onClick={props.onClick}>{props.type}</span>;
      }}
    </Observer>
  );
};

export default IconFont;
