import { Form, Input } from 'antd';
import React from 'react';
import localeService from '@/common/locales';

interface SiyuanFormProps {
  info?: SiyuanBackendServiceConfig;
}

interface SiyuanBackendServiceConfig {
  accessToken?: string;
}

const SiyuanForm: React.FC<SiyuanFormProps> = ({ info }) => {
  let initData: Partial<SiyuanBackendServiceConfig> = {};
  if (info) {
    initData = info;
  }
  let editMode = info ? true : false;
  return (
    <>
      <Form.Item
        label={localeService.format({
          id: 'backend.services.siyuan.form.accessToken',
        })}
        name="accessToken"
        initialValue={initData.accessToken}
      >
        <Input disabled={editMode} />
      </Form.Item>
    </>
  );
};

export default SiyuanForm;
