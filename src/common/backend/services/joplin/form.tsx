import { Form, Input, Checkbox } from 'antd';
import React from 'react';
import { JoplinBackendServiceConfig } from '../../clients/joplin';
import { FormattedMessage } from 'react-intl';

interface FormProps {
  verified?: boolean;
  info?: JoplinBackendServiceConfig;
}

const InitForm: React.FC<FormProps> = ({ info }) => {
  return (
    <>
      <Form.Item
        label="Authorization token"
        name="token"
        initialValue={info?.token}
        rules={[
          {
            required: true,
            message: 'Authorization token is required!',
          },
        ]}
      >
        <Input.TextArea autoSize />
      </Form.Item>
      <Form.Item
        label={<FormattedMessage id="backend.services.joplin.filter_tags" />}
        name="filterTags"
        initialValue={info?.filterTags ?? false}
        valuePropName="checked"
      >
        <Checkbox>
          <FormattedMessage id="backend.services.joplin.filter_unused_tags" />
        </Checkbox>
      </Form.Item>
    </>
  );
};

export default InitForm;
