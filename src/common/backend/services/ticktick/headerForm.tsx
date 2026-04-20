import { Form, Select } from 'antd';
import React from 'react';
import backend from '../..';
import Dida365DocumentService from './service';
import locale from '@/common/locales';
import { useFetch } from '@shihengtech/hooks';

const HeaderForm: React.FC = () => {
  const service = backend.getDocumentService() as Dida365DocumentService;
  const tagsResponse = useFetch(async () => service.getTags(), [service], {
    initialState: {
      data: [],
    },
  });

  return (
    <>
      <Form.Item name="tags" initialValue={[]}>
        <Select
          mode="tags"
          maxTagCount={3}
          style={{ width: '100%' }}
          placeholder={locale.format({
            id: 'backend.services.dida365.headerForm.applyTags',
            defaultMessage: 'Apply tags',
          })}
          loading={tagsResponse.loading}
        >
          {tagsResponse.data?.map(o => (
            <Select.Option key={o} value={o} title={o}>
              {o}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>
    </>
  );
};

export default HeaderForm;
