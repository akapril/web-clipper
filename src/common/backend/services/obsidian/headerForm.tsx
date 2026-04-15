import { Form } from '@ant-design/compatible';
import '@ant-design/compatible/assets/index.less';
import { FormComponentProps } from '@ant-design/compatible/lib/form';
import { Input, Tooltip } from 'antd';
import React, { Fragment } from 'react';
import localeService from '@/common/locales';

const HeaderForm: React.FC<FormComponentProps> = ({ form: { getFieldDecorator } }) => {
  return (
    <Fragment>
      <Form.Item>
        <Tooltip
          trigger={['focus']}
          title={localeService.format({
            id: 'backend.services.obsidian.headerForm.tags.tooltip',
            defaultMessage: 'Comma separated tags, e.g. tag1, tag2',
          })}
          placement="topLeft"
        >
          {getFieldDecorator('tags', {
            initialValue: '',
          })(
            <Input
              autoComplete="off"
              placeholder={localeService.format({
                id: 'backend.services.obsidian.headerForm.tags',
                defaultMessage: 'Tags (comma separated)',
              })}
            />
          )}
        </Tooltip>
      </Form.Item>
    </Fragment>
  );
};

export default HeaderForm;
