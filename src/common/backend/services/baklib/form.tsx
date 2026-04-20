import { Form, Input } from 'antd';
import React from 'react';
import { BaklibBackendServiceConfig } from './interface';
import useOriginForm from '@/hooks/useOriginForm';
import { FormattedMessage } from 'react-intl';

interface BaklibFormProps {
  verified?: boolean;
  info?: BaklibBackendServiceConfig;
}

const FormItem: React.FC<BaklibFormProps> = ({ info, verified }) => {
  const form = Form.useFormInstance();

  const { verified: formVerified, handleAuthentication, formRules } = useOriginForm({
    form,
    initStatus: !!info,
  });

  let initData: Partial<BaklibBackendServiceConfig> = {};
  if (info) {
    initData = info;
  }
  let editMode = info ? true : false;
  return (
    <>
      <Form.Item
        label="Host"
        name="origin"
        initialValue={initData.origin || 'https://www.baklib.com'}
        rules={[
          {
            required: true,
            message: 'Host is required!',
          },
          ...formRules,
        ]}
      >
        <Input.Search
          enterButton={
            <FormattedMessage
              id="backend.services.baklib.form.authentication"
              defaultMessage="Authentication"
            />
          }
          disabled={editMode || formVerified}
          onSearch={handleAuthentication}
        />
      </Form.Item>
      <Form.Item
        label="AccessToken"
        name="accessToken"
        initialValue={initData.accessToken}
        rules={[
          {
            required: true,
            message: 'AccessToken is required!',
          },
        ]}
      >
        <Input disabled={editMode || verified || !formVerified} />
      </Form.Item>
    </>
  );
};

export default FormItem;
