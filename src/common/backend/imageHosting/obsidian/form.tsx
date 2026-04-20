import React, { Fragment } from 'react';
import { Form, Input, InputNumber } from 'antd';

interface ObsidianImageHostingFormProps {
  info?: {
    restApiKey?: string;
    restApiPort?: number;
    attachmentFolder?: string;
  };
}

// Obsidian 图床配置表单：填写 REST API Key、端口和附件目录
const ObsidianImageHostingForm: React.FC<ObsidianImageHostingFormProps> = ({ info }) => {
  const initData = info || {};

  return (
    <Fragment>
      <Form.Item
        label="API Key"
        name="restApiKey"
        initialValue={initData.restApiKey}
        rules={[{ required: true, message: '请输入 REST API Key' }]}
      >
        <Input.Password />
      </Form.Item>
      <Form.Item label="端口" name="restApiPort" initialValue={initData.restApiPort || 27123}>
        <InputNumber min={1} max={65535} />
      </Form.Item>
      <Form.Item
        label="附件目录"
        name="attachmentFolder"
        initialValue={initData.attachmentFolder || 'attachments'}
      >
        <Input placeholder="attachments" />
      </Form.Item>
    </Fragment>
  );
};

export default ObsidianImageHostingForm;
