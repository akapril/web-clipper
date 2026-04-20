import { Form, Select } from 'antd';
import React from 'react';
import backend from '../..';
import { useFetch } from '@shihengtech/hooks';
import WizNoteDocumentService from './service';
import locale from '@/common/locales';

const HeaderForm: React.FC = () => {
  const service = backend.getDocumentService() as WizNoteDocumentService;

  const tagResponse = useFetch(async () => service.getTags(), [service], {
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
            id: 'backend.services.wiznote.headerForm.tags',
            defaultMessage: 'Tags',
          })}
          loading={tagResponse.loading}
        >
          {tagResponse.data?.map(o => (
            <Select.Option key={o.id} value={o.name} title={o.name}>
              {o.name}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>
    </>
  );
};

export default HeaderForm;
