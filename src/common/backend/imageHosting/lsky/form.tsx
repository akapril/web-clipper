import { Form, Input } from 'antd';
import React from 'react';

interface LskyFormProps {
  info?: { apiUrl?: string; token?: string };
}

const LskyForm: React.FC<LskyFormProps> = ({ info }) => {
  const initData = info || {};

  return (
    <>
      <Form.Item
        label="API URL"
        name="apiUrl"
        initialValue={initData.apiUrl}
        rules={[{ required: true, message: '请输入 Lsky Pro 地址' }]}
      >
        <Input placeholder="https://your-lsky-domain.com" />
      </Form.Item>
      <Form.Item
        label="Token"
        name="token"
        initialValue={initData.token}
        rules={[{ required: true, message: '请输入 API Token' }]}
      >
        <Input.Password placeholder="Bearer Token" />
      </Form.Item>
    </>
  );
};

export default LskyForm;
