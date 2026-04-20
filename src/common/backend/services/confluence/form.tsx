import React from 'react';
import { Form, Input, Select } from 'antd';
import { useFetch } from '@shihengtech/hooks';
import { extend } from 'umi-request';
import {
  ConfluenceListResult,
  ConfluenceSpace,
  ConfluenceServiceConfig,
} from '@/common/backend/services/confluence/interface';
import { FormattedMessage } from 'react-intl';
import useOriginForm from '@/hooks/useOriginForm';

interface ConfluenceFormProps {
  info?: ConfluenceServiceConfig;
}

const ConfluenceForm: React.FC<ConfluenceFormProps> = ({ info }) => {
  const form = Form.useFormInstance();
  const { verified, handleAuthentication, formRules } = useOriginForm({ form, initStatus: !!info });

  const host = Form.useWatch('origin', form);

  const spaces = useFetch(
    async () => {
      if (!verified) {
        return [];
      }
      const request = extend({
        prefix: host,
      });
      const spaceList = await request.get<ConfluenceListResult<ConfluenceSpace>>(`/rest/api/space`);
      return spaceList.results;
    },
    [host, verified],
    {
      initialState: {
        data: [],
      },
    }
  );

  return (
    <>
      <Form.Item
        label={
          <FormattedMessage id="backend.services.confluence.form.origin" defaultMessage="Origin" />
        }
        name="origin"
        initialValue={info?.origin}
        rules={formRules}
      >
        <Input.Search
          enterButton={
            <FormattedMessage
              id="backend.services.confluence.form.authentication"
              defaultMessage="Authentication"
            />
          }
          onSearch={handleAuthentication}
          disabled={verified}
        />
      </Form.Item>
      {verified && (
        <Form.Item
          label={
            <FormattedMessage id="backend.services.confluence.form.space" defaultMessage="Space" />
          }
          name="spaceId"
          initialValue={info?.spaceId}
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Select loading={spaces.loading}>
            {spaces
              .data!.filter(o => !!o._expandable.homepage)
              .map(o => {
                const spaceHomePage = o._expandable.homepage!.split('/');
                return (
                  <Select.Option key={o.id} value={`${spaceHomePage[spaceHomePage.length - 1]}`}>
                    {o.name}
                  </Select.Option>
                );
              })}
          </Select>
        </Form.Item>
      )}
    </>
  );
};

export default ConfluenceForm;
