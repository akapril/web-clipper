import { Form, Input } from 'antd';
import React from 'react';
import { OneNoteBackendServiceConfig } from './interface';

interface OneNoteProps {
  verified?: boolean;
  info?: OneNoteBackendServiceConfig;
}

const OneNoteForm: React.FC<OneNoteProps> = ({ info, verified }) => {
  let initData: Partial<OneNoteBackendServiceConfig> = {};
  if (info) {
    initData = info;
  }
  let editMode = info ? true : false;
  return (
    <>
      <Form.Item
        label="AccessToken"
        name="access_token"
        initialValue={initData.access_token}
        rules={[
          {
            required: true,
            message: 'AccessToken is required!',
          },
        ]}
      >
        <Input disabled={editMode || verified} />
      </Form.Item>
      <Form.Item
        label="RefreshToken"
        name="refresh_token"
        initialValue={initData.refresh_token}
        rules={[
          {
            required: true,
            message: 'RefreshToken is required!',
          },
        ]}
      >
        <Input disabled={editMode || verified} />
      </Form.Item>
    </>
  );
};

export default OneNoteForm;
