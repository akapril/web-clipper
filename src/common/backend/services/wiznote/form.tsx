import React from 'react';
import { Form, Input } from 'antd';
import { WizNoteConfig } from '@/common/backend/services/wiznote/interface';
import { FormattedMessage } from 'react-intl';
import useOriginForm from '@/hooks/useOriginForm';

interface WizNoteFormProps {
  info?: WizNoteConfig;
}

const WizNoteForm: React.FC<WizNoteFormProps> = ({ info }) => {
  const form = Form.useFormInstance();
  const { verified, handleAuthentication, formRules } = useOriginForm({ form, initStatus: !!info });
  return (
    <>
      <Form.Item
        label={
          <FormattedMessage id="backend.services.wiznote.form.origin" defaultMessage="Origin" />
        }
        name="origin"
        initialValue={info?.origin ?? 'https://note.wiz.cn'}
        rules={formRules}
      >
        <Input.Search
          enterButton={
            <FormattedMessage
              id="backend.services.wiznote.form.authentication"
              defaultMessage="Authentication"
            />
          }
          onSearch={handleAuthentication}
          disabled={verified}
        />
      </Form.Item>
    </>
  );
};

export default WizNoteForm;
