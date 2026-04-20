import React from 'react';
import styles from './index.less';
import { theme } from 'antd';

interface Props {
  title?: string | React.ReactNode;
  className?: string;
}

const Section: React.FC<Props> = ({ title, children, className }) => {
  const { token } = theme.useToken();
  return (
    <div className={className}>
      {title && <h1 className={styles.sectionTitle} style={{ color: token.colorTextSecondary }}>{title}</h1>}
      {children}
    </div>
  );
};
export default Section;
