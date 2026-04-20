import { Form, TreeSelect } from 'antd';
import React, { useEffect } from 'react';
import locale from '@/common/locales';
import { Repository } from '../interface';
import { useFetch } from '@shihengtech/hooks';
import backend from '../..';
import BaklibDocumentService from './service';

const HeaderForm: React.FC<{ currentRepository: Repository }> = ({
  currentRepository,
}) => {
  const form = Form.useFormInstance();
  const service = backend.getDocumentService() as BaklibDocumentService;
  const channals = useFetch(() => {
    if (currentRepository) {
      return service.getTentChannel(currentRepository.id);
    }
    return [];
  }, [currentRepository]);

  useEffect(() => {
    form.setFieldsValue({
      channel: null,
    });
  }, [currentRepository, form]);

  useEffect(() => {
    if (Array.isArray(channals.data) && channals.data.length > 0 && !form.getFieldValue('channel')) {
      form.setFieldsValue({
        channel: channals.data[0].value,
      });
    }
  }, [channals.data, form]);
  return (
    <>
      <Form.Item name="channel" rules={[]}>
        <TreeSelect
          disabled={channals.loading}
          loading={channals.loading}
          allowClear
          treeData={channals.data}
          style={{ width: '100%' }}
          placeholder={locale.format({
            id: 'backend.services.baklib.headerForm.channel',
            defaultMessage: 'Channel',
          })}
        />
      </Form.Item>
    </>
  );
};

export default HeaderForm;
