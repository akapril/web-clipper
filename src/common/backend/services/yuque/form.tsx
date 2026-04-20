import { Form, Input, Select } from 'antd';
import React from 'react';
import { YuqueBackendServiceConfig, RepositoryType } from './interface';
import { FormattedMessage } from 'react-intl';

interface YuqueFormProps {
  verified?: boolean;
  info?: YuqueBackendServiceConfig;
}

const RepositoryTypeOptions = [
  {
    key: RepositoryType.all,
    label: (
      <FormattedMessage
        id="backend.services.yuque.form.showAllRepository"
        defaultMessage="Show All Repository"
      />
    ),
  },
  {
    key: RepositoryType.self,
    label: (
      <FormattedMessage
        id="backend.services.yuque.form.showSelfRepository"
        defaultMessage="Show Self Repository"
      />
    ),
  },
  {
    key: RepositoryType.group,
    label: (
      <FormattedMessage
        id="backend.services.yuque.form.showGroupRepository"
        defaultMessage="Show Group Repository"
      />
    ),
  },
];

const YuqueForm: React.FC<YuqueFormProps> = ({ info, verified }) => {
  let initData: Partial<YuqueBackendServiceConfig> = {
    repositoryType: RepositoryType.self,
  };
  if (info) {
    initData = info;
  }
  let editMode = info ? true : false;
  return (
    <>
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
        <Input disabled={editMode || verified} />
      </Form.Item>
      <Form.Item
        label={
          <FormattedMessage
            id="backend.services.yuque.form.repositoryType"
            defaultMessage="Repository Type"
          />
        }
        name="repositoryType"
        initialValue={initData.repositoryType}
        rules={[{ required: true, message: 'repositoryType is required!' }]}
      >
        <Select>
          {RepositoryTypeOptions.map(o => (
            <Select.Option key={o.key} value={o.key}>
              {o.label}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>
    </>
  );
};

export default YuqueForm;
