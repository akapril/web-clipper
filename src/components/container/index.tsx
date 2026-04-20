import React from 'react';
import styles from './index.less';
import { CloseOutlined } from '@ant-design/icons';
import { theme } from 'antd';

const Container: React.FC = ({ children }) => {
  return <div className={styles.mainContainer}>{children}</div>;
};

export interface ToolContainerProps {
  onClickCloseButton?: () => void;
  onClickMask?: () => void;
}

export const ToolContainer: React.FC<ToolContainerProps> = ({ onClickCloseButton, onClickMask, children }) => {
  const { token } = theme.useToken();
  return (
    <React.Fragment>
      <div className={styles.mask} onClick={onClickMask}></div>
      <Container>
        <div
          className={styles.toolContainer}
          style={{ background: token.colorBgContainer, color: token.colorText }}
        >
          <div className={styles.closeButton} onClick={onClickCloseButton} style={{ color: token.colorTextSecondary }}>
            <CloseOutlined />
          </div>
          <div>{children}</div>
        </div>
      </Container>
    </React.Fragment>
  );
};

export const CenterContainer: React.FC = ({ children }) => {
  return <div className={styles.centerContainer}>{children}</div>;
};

export const EditorContainer: React.FC = ({ children }) => {
  const { token } = theme.useToken();
  return (
    <div
      className={styles.editorContainer}
      style={{ background: token.colorBgContainer, borderColor: token.colorBorder }}
    >
      {children}
    </div>
  );
};
