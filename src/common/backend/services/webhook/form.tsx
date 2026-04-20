import { Form, Input } from 'antd';
import React from 'react';

interface WebhookFormProps {
  info?: { webhookUrl?: string; customHeaders?: string };
}

const WebhookForm: React.FC<WebhookFormProps> = ({ info }) => {
  const initData = info || {};

  return (
    <>
      <Form.Item
        label="Webhook URL"
        name="webhookUrl"
        initialValue={initData.webhookUrl}
        rules={[{ required: true, message: '请输入 Webhook URL' }]}
      >
        <Input placeholder="https://your-webhook-url.com/api/clip" />
      </Form.Item>
      <Form.Item
        label="自定义请求头 (JSON)"
        name="customHeaders"
        initialValue={initData.customHeaders || ''}
      >
        <Input.TextArea
          rows={3}
          placeholder='{"Authorization": "Bearer xxx"}'
        />
      </Form.Item>
    </>
  );
};

export default WebhookForm;
