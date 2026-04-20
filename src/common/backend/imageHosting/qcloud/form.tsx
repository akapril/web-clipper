import React, { Fragment } from 'react';
import { Form, Input, InputNumber, Checkbox } from 'antd';
import { QcloudCosImageHostingOption } from './service';

interface Props {
  info: QcloudCosImageHostingOption;
}

export default ({ info }: Props) => {
  const initInfo: Partial<Props['info']> = info || {};
  return (
    <Fragment>
      <Form.Item
        label="Bucket"
        name="bucket"
        initialValue={initInfo.bucket}
        rules={[{ required: true }]}
      >
        <Input placeholder="please input Bucket" />
      </Form.Item>
      <Form.Item
        label="Region"
        name="region"
        initialValue={initInfo.region}
        rules={[{ required: true }]}
      >
        <Input placeholder="please input Region" />
      </Form.Item>
      <Form.Item
        label="Folder"
        name="folder"
        initialValue={initInfo.folder}
        rules={[{ required: true }]}
      >
        <Input placeholder="please input Folder" />
      </Form.Item>
      <Form.Item
        label="SecretId"
        name="secretId"
        initialValue={initInfo.secretId}
        rules={[{ required: true }]}
      >
        <Input placeholder="please input SecretId" />
      </Form.Item>
      <Form.Item
        label="SecretKey"
        name="secretKey"
        initialValue={initInfo.secretKey}
        rules={[{ required: true }]}
      >
        <Input.Password placeholder="please input SecretKey" />
      </Form.Item>
      <Form.Item
        label="PrivateRead"
        name="privateRead"
        initialValue={initInfo.privateRead}
        valuePropName="checked"
      >
        <Checkbox />
      </Form.Item>
      <Form.Item
        label="Expires"
        name="expires"
        initialValue={initInfo.expires}
        rules={[{ required: true }]}
      >
        <InputNumber placeholder="please input Expires" />
      </Form.Item>
    </Fragment>
  );
};
