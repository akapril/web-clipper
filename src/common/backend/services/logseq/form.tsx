import { Form, Input, InputNumber } from 'antd';
import React from 'react';

interface LogseqFormProps {
  info?: { apiToken?: string; apiPort?: number };
}

const LogseqForm: React.FC<LogseqFormProps> = ({ info }) => {
  const initData = info || {};

  return (
    <>
      <Form.Item
        label="API Token"
        name="apiToken"
        initialValue={initData.apiToken}
        rules={[{ required: true, message: '请输入 API Token' }]}
      >
        <Input.Password placeholder="在 Logseq API 面板中生成" />
      </Form.Item>
      <Form.Item
        label="端口"
        name="apiPort"
        initialValue={initData.apiPort || 12315}
      >
        <InputNumber min={1} max={65535} />
      </Form.Item>
    </>
  );
};

export default LogseqForm;
