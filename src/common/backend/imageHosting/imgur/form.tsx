import React from 'react';
import { Form, Input } from 'antd';

interface Props {
  info: {
    clientId: string;
  };
}

export default ({ info }: Props) => {
  const initInfo: Partial<Props['info']> = info || {};
  return (
    <Form.Item
      label="ClientId"
      name="clientId"
      initialValue={initInfo.clientId}
      rules={[{ required: true }]}
    >
      <Input placeholder="please input clientId" />
    </Form.Item>
  );
};
