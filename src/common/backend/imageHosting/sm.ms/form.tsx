import React from 'react';
import { Form, Input } from 'antd';

interface Props {
  info: {
    secretToken: string;
  };
}

export default ({ info }: Props) => {
  const initInfo: Partial<Props['info']> = info || {};
  return (
    <Form.Item label="Secret Token" name="secretToken" initialValue={initInfo.secretToken}>
      <Input placeholder="please input Secret Token" />
    </Form.Item>
  );
};
