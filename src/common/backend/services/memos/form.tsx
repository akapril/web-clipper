import { Form, Input } from 'antd';
import React from 'react';
import { MemosBackendServiceConfig } from './interface';
import useOriginForm from '@/hooks/useOriginForm';
import { FormattedMessage } from 'react-intl';

interface MemosFormProps {
  verified?: boolean;
  info?: MemosBackendServiceConfig;
}

const FormItem: React.FC<MemosFormProps> = ({ info, verified }) => {
  const form = Form.useFormInstance();

  const { verified: formVerified, handleAuthentication, formRules } = useOriginForm({
    form,
    initStatus: !!info,
  });

  let initData: Partial<MemosBackendServiceConfig> = {};
  if (info) {
    initData = info;
  }
  let editMode = info ? true : false;
  return (
    <>
      <Form.Item
        label="Host"
        name="origin"
        initialValue={initData.origin || 'https://demo.usememos.com'}
        rules={[
          {
            required: true,
            message: (
              <FormattedMessage
                id="backend.services.memos.form.authentication"
                defaultMessage="Host URL requeired!"
              />
            ),
            type: 'url',
          },
          ...formRules,
        ]}
      >
        <Input.Search
          enterButton={
            <FormattedMessage
              id="backend.services.memos.form.hostTest"
              defaultMessage="test"
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
            message: (
              <FormattedMessage
                id="backend.services.memos.accessToken.message"
                defaultMessage='AccessToken is required!'
              />
            ),
          },
        ]}
      >
        <Input disabled={editMode || verified || !formVerified} />
      </Form.Item>
    </>
  );
};

export default FormItem;
