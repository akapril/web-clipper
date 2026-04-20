import { Form } from '@ant-design/compatible';
import '@ant-design/compatible/assets/index.less';
import { FormComponentProps } from '@ant-design/compatible/lib/form';
import { Input } from 'antd';
import React, { Fragment } from 'react';

interface WebhookFormProps {
  info?: { webhookUrl?: string; customHeaders?: string };
}

const WebhookForm: React.FC<WebhookFormProps & FormComponentProps> = ({ form, info }) => {
  const { getFieldDecorator } = form;
  const initData = info || {};

  return (
    <Fragment>
      <Form.Item label="Webhook URL">
        {getFieldDecorator('webhookUrl', {
          initialValue: initData.webhookUrl,
          rules: [{ required: true, message: '请输入 Webhook URL' }],
        })(<Input placeholder="https://your-webhook-url.com/api/clip" />)}
      </Form.Item>
      <Form.Item label="自定义请求头 (JSON)">
        {getFieldDecorator('customHeaders', {
          initialValue: initData.customHeaders || '',
        })(
          <Input.TextArea
            rows={3}
            placeholder='{"Authorization": "Bearer xxx"}'
          />
        )}
      </Form.Item>
    </Fragment>
  );
};

export default WebhookForm;
