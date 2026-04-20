import { KeyOutlined } from '@ant-design/icons';
import { Form, Input, Select, Tooltip } from 'antd';
import React from 'react';
import { GithubBackendServiceConfig } from './interface';
import { FormattedMessage } from 'react-intl';
import locale from '@/common/locales';
import { stringify } from 'qs';

interface GithubFormProps {
  verified?: boolean;
  info?: GithubBackendServiceConfig;
}

const GenerateNewTokenUrl = `https://github.com/settings/tokens/new?${stringify({
  scopes: 'repo',
  description: 'Web Clipper',
})}`;

const visibilityOptions = [
  {
    label: <FormattedMessage id="backend.services.github.form.visibility.all" />,
    value: 'all',
  },
  {
    label: <FormattedMessage id="backend.services.github.form.visibility.public" />,
    value: 'public',
  },
  {
    label: <FormattedMessage id="backend.services.github.form.visibility.private" />,
    value: 'private',
  },
];

const GithubForm: React.FC<GithubFormProps> = ({ info, verified }) => {
  const disabled = verified || !!info;
  let initAccessToken;
  let visibility;
  let savePath;
  if (info) {
    initAccessToken = info.accessToken;
    visibility = info.visibility;
    savePath = info.savePath;
  }
  return (
    <>
      <Form.Item label={<FormattedMessage id="backend.services.github.form.visibility" />} name="visibility" initialValue={visibility}>
        <Select allowClear>
          {visibilityOptions.map(o => (
            <Select.Option value={o.value} key={o.value}>
              {o.label}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>
      <Form.Item
        label="AccessToken"
        name="accessToken"
        initialValue={initAccessToken}
        rules={[
          {
            required: true,
            message: (
              <FormattedMessage
                id="backend.services.github.accessToken.message"
                defaultMessage="AccessToken is required"
              />
            ),
          },
        ]}
      >
        <Input
          disabled={disabled}
          suffix={
            <Tooltip
              title={
                <span
                  style={{
                    whiteSpace: 'nowrap',
                  }}
                >
                  {locale.format({
                    id: 'backend.services.github.form.GenerateNewToken',
                    defaultMessage: 'Generate new token',
                  })}
                </span>
              }
            >
              <a href={GenerateNewTokenUrl} target={GenerateNewTokenUrl}>
                <KeyOutlined />
              </a>
            </Tooltip>
          }
        />
      </Form.Item>
      <Form.Item
        label={
          <FormattedMessage
            id="backend.services.github.form.storageLocation.code.savePath"
            defaultMessage="Save Path"
          />
        }
        name="savePath"
        initialValue={savePath}
        rules={[
          {
            required: false,
          },
          {
            validator: (_r: unknown, value: string) => {
              if (typeof value === 'string') {
                if (value.startsWith('/')) {
                  return Promise.reject('path cannot start with a slash');
                }
              }
              return Promise.resolve();
            },
          },
        ]}
      >
        <Input
          placeholder={locale.format({
            id: 'backend.services.github.form.storageLocation.code.savePathPlaceHolder',
            defaultMessage: 'Only takes effect when saving to code.',
          })}
        />
      </Form.Item>
    </>
  );
};

export default GithubForm;
