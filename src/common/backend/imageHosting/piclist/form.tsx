import React, { Fragment } from 'react';
import { Form, Input } from 'antd';

interface Props {
  info: {
    uploadUrl: string;
    key: string;
  };
}

export default ({ info }: Props) => {
  const initInfo: Partial<Props['info']> = info || {};
  return (
    <Fragment>
      <Form.Item
        label="UploadUrl"
        name="uploadUrl"
        initialValue={initInfo.uploadUrl}
        rules={[{ required: true }]}
      >
        <Input placeholder="please input piclist upload URL" />
      </Form.Item>
      <Form.Item label="Key" name="key" initialValue={initInfo.key}>
        <Input placeholder="please input upload key (if needed)" />
      </Form.Item>
    </Fragment>
  );
};
