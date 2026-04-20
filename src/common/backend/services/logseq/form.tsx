import { Form } from '@ant-design/compatible';
import '@ant-design/compatible/assets/index.less';
import { FormComponentProps } from '@ant-design/compatible/lib/form';
import { Input, InputNumber } from 'antd';
import React, { Fragment } from 'react';

interface LogseqFormProps {
  info?: { apiToken?: string; apiPort?: number };
}

const LogseqForm: React.FC<LogseqFormProps & FormComponentProps> = ({ form, info }) => {
  const { getFieldDecorator } = form;
  const initData = info || {};

  return (
    <Fragment>
      <Form.Item label="API Token">
        {getFieldDecorator('apiToken', {
          initialValue: initData.apiToken,
          rules: [{ required: true, message: '请输入 API Token' }],
        })(<Input.Password placeholder="在 Logseq API 面板中生成" />)}
      </Form.Item>
      <Form.Item label="端口">
        {getFieldDecorator('apiPort', {
          initialValue: initData.apiPort || 12315,
        })(<InputNumber min={1} max={65535} />)}
      </Form.Item>
    </Fragment>
  );
};

export default LogseqForm;
