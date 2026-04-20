import { Form, Input } from 'antd';
import React from 'react';
import { WebDAVServiceConfig } from './interface';
import useOriginForm from '@/hooks/useOriginForm';
import { FormattedMessage } from 'react-intl';

interface FormProps {
  info?: WebDAVServiceConfig;
}

const ConfigForm: React.FC<FormProps> = ({ info }) => {
  const form = Form.useFormInstance();
  const { verified, handleAuthentication, formRules } = useOriginForm({ form, initStatus: !!info });
  return (
    <>
      <Form.Item
        label={
          <FormattedMessage id="backend.services.confluence.form.origin" defaultMessage="Origin" />
        }
        name="origin"
        initialValue={info?.origin}
        rules={formRules}
      >
        <Input.Search
          enterButton={
            <FormattedMessage
              id="backend.services.confluence.form.authentication"
              defaultMessage="Authentication"
            />
          }
          onSearch={handleAuthentication}
          disabled={verified}
        />
      </Form.Item>
      {verified && (
        <>
          <Form.Item
            label="Username"
            name="username"
            initialValue={info?.username}
            rules={[
              {
                required: true,
              },
            ]}
          >
            <Input disabled={!!info} />
          </Form.Item>
          <Form.Item
            label="Password"
            name="password"
            initialValue={info?.password}
            rules={[
              {
                required: true,
              },
            ]}
          >
            <Input disabled={!!info} />
          </Form.Item>
        </>
      )}
    </>
  );
};

export default ConfigForm;
