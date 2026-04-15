import { Form } from '@ant-design/compatible';
import '@ant-design/compatible/assets/index.less';
import { FormComponentProps } from '@ant-design/compatible/lib/form';
import { Input, InputNumber } from 'antd';
import React, { Fragment } from 'react';

interface ObsidianImageHostingFormProps extends FormComponentProps {
  info?: {
    restApiKey?: string;
    restApiPort?: number;
    attachmentFolder?: string;
  };
}

// Obsidian 图床配置表单：填写 REST API Key、端口和附件目录
const ObsidianImageHostingForm: React.FC<ObsidianImageHostingFormProps> = ({ form, info }) => {
  const { getFieldDecorator } = form;
  const initData = info || {};

  return (
    <Fragment>
      <Form.Item label="API Key">
        {getFieldDecorator('restApiKey', {
          initialValue: initData.restApiKey,
          rules: [{ required: true, message: '请输入 REST API Key' }],
        })(<Input.Password />)}
      </Form.Item>
      <Form.Item label="端口">
        {getFieldDecorator('restApiPort', {
          initialValue: initData.restApiPort || 27123,
        })(<InputNumber min={1} max={65535} />)}
      </Form.Item>
      <Form.Item label="附件目录">
        {getFieldDecorator('attachmentFolder', {
          initialValue: initData.attachmentFolder || 'attachments',
        })(<Input placeholder="attachments" />)}
      </Form.Item>
    </Fragment>
  );
};

export default ObsidianImageHostingForm;
