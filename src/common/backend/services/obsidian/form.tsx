import { Form } from '@ant-design/compatible';
import '@ant-design/compatible/assets/index.less';
import { FormComponentProps } from '@ant-design/compatible/lib/form';
import { Input, Select, InputNumber, Button, message } from 'antd';
import React, { Fragment, useState, useCallback } from 'react';
import { ObsidianFormConfig, ObsidianConnectionMode } from './interface';
import { DEFAULT_TEMPLATE } from './template';
import localeService from '@/common/locales';

const { Option } = Select;

interface ObsidianFormProps {
  info?: ObsidianFormConfig;
}

/**
 * 通过 REST API 递归获取 vault 中所有文件夹
 */
async function fetchVaultFolders(port: number, apiKey: string): Promise<string[]> {
  const folders: string[] = [];

  async function listDir(dir: string) {
    const url = dir
      ? `http://127.0.0.1:${port}/vault/${encodeURIComponent(dir)}/`
      : `http://127.0.0.1:${port}/vault/`;
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    });
    if (!res.ok) {
      throw new Error(`${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    const entries: string[] = data.files || [];
    for (const entry of entries) {
      if (entry.endsWith('/')) {
        const folderName = entry.slice(0, -1);
        const fullPath = dir ? `${dir}/${folderName}` : folderName;
        folders.push(fullPath);
        // 递归获取子目录
        await listDir(fullPath);
      }
    }
  }

  await listDir('');
  return folders.sort();
}

const ObsidianForm: React.FC<ObsidianFormProps & FormComponentProps> = ({ form, info }) => {
  const { getFieldDecorator, getFieldValue, setFieldsValue } = form;
  const initData: Partial<ObsidianFormConfig> = info || {};
  const connectionMode: ObsidianConnectionMode = getFieldValue('connectionMode') || initData.connectionMode || 'uri';
  const [fetching, setFetching] = useState(false);

  // 从 REST API 获取文件夹列表并填充到表单
  const handleFetchFolders = useCallback(async () => {
    const port = getFieldValue('restApiPort') || 27123;
    const apiKey = getFieldValue('restApiKey') || '';
    if (!apiKey) {
      message.warning(localeService.format({
        id: 'backend.services.obsidian.form.restApiKey.required',
        defaultMessage: 'REST API Key is required',
      }));
      return;
    }
    setFetching(true);
    try {
      const folders = await fetchVaultFolders(port, apiKey);
      if (folders.length === 0) {
        // vault 根目录也可以保存
        setFieldsValue({ folder: '/' });
        message.info(localeService.format({
          id: 'backend.services.obsidian.form.fetchFolders.empty',
          defaultMessage: 'No subfolders found, using vault root',
        }));
      } else {
        setFieldsValue({ folder: folders.join('\n') });
        message.success(localeService.format({
          id: 'backend.services.obsidian.form.fetchFolders.success',
          defaultMessage: `Found ${folders.length} folders`,
        }));
      }
    } catch (e: any) {
      message.error(localeService.format({
        id: 'backend.services.obsidian.form.fetchFolders.error',
        defaultMessage: `Failed to fetch: ${e.message}`,
      }));
    } finally {
      setFetching(false);
    }
  }, [getFieldValue, setFieldsValue]);

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
        {connectionMode === 'rest' && (
          <Button
            size="small"
            loading={fetching}
            onClick={handleFetchFolders}
            style={{ marginTop: 4 }}
          >
            {localeService.format({
              id: 'backend.services.obsidian.form.fetchFolders',
              defaultMessage: 'Fetch folders from Obsidian',
            })}
          </Button>
        )}
      </Form.Item>

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
