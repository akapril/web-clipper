import { Form, Input, Tooltip } from 'antd';
import React from 'react';
import localeService from '@/common/locales';

const HeaderForm: React.FC = () => {
  return (
    <>
      <Form.Item name="tags" initialValue="">
        <Tooltip
          trigger={['focus']}
          title={localeService.format({
            id: 'backend.services.obsidian.headerForm.tags.tooltip',
            defaultMessage: 'Comma separated tags, e.g. tag1, tag2',
          })}
          placement="topLeft"
        >
          <Input
            autoComplete="off"
            placeholder={localeService.format({
              id: 'backend.services.obsidian.headerForm.tags',
              defaultMessage: 'Tags (comma separated)',
            })}
          />
        </Tooltip>
      </Form.Item>
    </>
  );
};

export default HeaderForm;
