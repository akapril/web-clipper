import { Form } from '@ant-design/compatible';
import '@ant-design/compatible/assets/index.less';
import { FormComponentProps } from '@ant-design/compatible/lib/form';
import { Input, Select, InputNumber } from 'antd';
import React, { Fragment } from 'react';
import { ObsidianFormConfig, ObsidianConnectionMode } from './interface';
import { DEFAULT_TEMPLATE } from './template';
import localeService from '@/common/locales';

const { Option } = Select;

interface ObsidianFormProps {
  info?: ObsidianFormConfig;
}

const ObsidianForm: React.FC<ObsidianFormProps & FormComponentProps> = ({ form, info }) => {
  const { getFieldDecorator, getFieldValue } = form;
  const initData: Partial<ObsidianFormConfig> = info || {};
  const connectionMode: ObsidianConnectionMode = getFieldValue('connectionMode') || initData.connectionMode || 'uri';

  return (
    <Fragment>
      <Form.Item label="Vault">
        {getFieldDecorator('vault', {
          initialValue: initData.vault,
          rules: [{ required: true, message: localeService.format({
            id: 'backend.services.obsidian.form.vault.required',
            defaultMessage: 'Please input your vault name',
          })}],
        })(<Input />)}
      </Form.Item>

      <Form.Item label={localeService.format({
        id: 'backend.services.obsidian.form.folder',
        defaultMessage: 'Save Folder',
      })}>
        {getFieldDecorator('folder', {
          initialValue: initData.folder,
          rules: [{ required: true, message: localeService.format({
            id: 'backend.services.obsidian.form.folder.required',
            defaultMessage: 'Please input save folders',
          })}],
        })(<Input.TextArea placeholder={localeService.format({
          id: 'backend.services.obsidian.form.folder.placeholder',
          defaultMessage: 'One folder per line',
        })} />)}
      </Form.Item>

      <Form.Item label={localeService.format({
        id: 'backend.services.obsidian.form.connectionMode',
        defaultMessage: 'Connection Mode',
      })}>
        {getFieldDecorator('connectionMode', {
          initialValue: initData.connectionMode || 'uri',
        })(
          <Select>
            <Option value="uri">URI (obsidian://)</Option>
            <Option value="cli">CLI ({localeService.format({
              id: 'backend.services.obsidian.form.connectionMode.cli.hint',
              defaultMessage: 'clipboard, no size limit',
            })})</Option>
            <Option value="rest">REST API ({localeService.format({
              id: 'backend.services.obsidian.form.connectionMode.rest.hint',
              defaultMessage: 'requires plugin',
            })})</Option>
          </Select>
        )}
      </Form.Item>

      {connectionMode === 'rest' && (
        <Fragment>
          <Form.Item label="API Key">
            {getFieldDecorator('restApiKey', {
              initialValue: initData.restApiKey,
              rules: [{ required: true, message: localeService.format({
                id: 'backend.services.obsidian.form.restApiKey.required',
                defaultMessage: 'REST API Key is required',
              })}],
            })(<Input.Password />)}
          </Form.Item>
          <Form.Item label={localeService.format({
            id: 'backend.services.obsidian.form.restApiPort',
            defaultMessage: 'Port',
          })}>
            {getFieldDecorator('restApiPort', {
              initialValue: initData.restApiPort || 27123,
            })(<InputNumber min={1} max={65535} />)}
          </Form.Item>
        </Fragment>
      )}

      <Form.Item label={localeService.format({
        id: 'backend.services.obsidian.form.contentTemplate',
        defaultMessage: 'Content Template',
      })}>
        {getFieldDecorator('contentTemplate', {
          initialValue: initData.contentTemplate || DEFAULT_TEMPLATE,
        })(
          <Input.TextArea
            rows={8}
            placeholder={localeService.format({
              id: 'backend.services.obsidian.form.contentTemplate.placeholder',
              defaultMessage: 'Variables: {{title}}, {{url}}, {{date}}, {{tags}}, {{content}}',
            })}
          />
        )}
      </Form.Item>
    </Fragment>
  );
};

export default ObsidianForm;
