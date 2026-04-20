import { Form, Input } from 'antd';
import React from 'react';
import locales from '@/common/locales';

const HeaderForm: React.FC = () => {
  return (
    <>
      <Form.Item
        name="slug"
        rules={[
          {
            pattern: /^[\w-.]{2,190}$/,
            message: locales.format({
              id: 'backend.services.yuque.headerForm.slug_error',
            }),
          },
        ]}
      >
        <Input
          autoComplete="off"
          placeholder={locales.format({
            id: 'backend.services.yuque.headerForm.slug',
          })}
        />
      </Form.Item>
    </>
  );
};

export default HeaderForm;
