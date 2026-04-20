import { Form, Input, Tooltip, Select } from 'antd';
import React from 'react';
import locales from '@/common/locales';
import { VisibilityType } from './interface';

const { Option } = Select;

const HeaderForm: React.FC = () => {
  return (
    <>
      <Form.Item
        name="tags"
        rules={[
          {
            pattern: /^(?! )[^\u4e00-\u9fa5~`!@#$%^&*()_+={}\[\]:;"'<>.?\/\\|]*[^\s.,;:!?"'()]*$/,
            message: locales.format({
              id: 'backend.services.memos.headerForm.tag_error',
            }),
          },
        ]}
      >
        <Tooltip
          trigger={['focus']}
          title={locales.format({
            id: 'backend.services.memos.headerForm.tag',
            defaultMessage: 'Input tags (eg. tag1, tag2...)'
          })}
          placement="topLeft"
          overlayClassName="numeric-input"
        >
          <Input
            autoComplete="off"
            placeholder={locales.format({
              id: 'backend.services.memos.headerForm.tag',
              defaultMessage: 'Input tags (eg. tag1, tag2...)'
            })}
          />
        </Tooltip>
      </Form.Item>

      <Form.Item
        label={locales.format({
          id: 'backend.services.memos.headerForm.visibility',
          defaultMessage: 'visibility'
        })}
        name="visibility"
        initialValue={VisibilityType[0].value}
      >
        <Select style={{ width: '100%' }}>
          {VisibilityType.map(option => (
            <Option key={option.value} value={option.value}>
              {option.label()}
            </Option>
          ))}
        </Select>
      </Form.Item>
    </>
  );
};

export default HeaderForm;
