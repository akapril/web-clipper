import { KeyOutlined } from '@ant-design/icons';
import { Form, Input } from 'antd';
import React from 'react';
import { FormattedMessage } from 'react-intl';

interface FormProps {
  verified?: boolean;
  info?: {
    accessToken: string;
  };
}

const ConfigForm: React.FC<FormProps> = ({ info, verified }) => {
  const disabled = verified || !!info;
  let initAccessToken;
  if (info) {
    initAccessToken = info.accessToken;
  }
  return (
    <>
      <Form.Item
        label="AccessToken"
        name="accessToken"
        initialValue={initAccessToken}
        rules={[
          {
            required: true,
            message: (
              <FormattedMessage
                id="backend.services.server_chan.accessToken.message"
                defaultMessage="AccessToken is required"
              />
            ),
          },
        ]}
      >
        <Input
          disabled={disabled}
          suffix={
            <a href={'https://sc.ftqq.com/'} target={'https://sc.ftqq.com/'}>
              <KeyOutlined />
            </a>
          }
        />
      </Form.Item>
    </>
  );
};

export default ConfigForm;
