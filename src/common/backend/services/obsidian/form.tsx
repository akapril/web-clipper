import { Form } from '@ant-design/compatible';
import '@ant-design/compatible/assets/index.less';
import { FormComponentProps } from '@ant-design/compatible/lib/form';
import { Input, Select, InputNumber, Button, Tree, message, Spin } from 'antd';
import React, { Fragment, useState, useCallback } from 'react';
import { ObsidianFormConfig, ObsidianConnectionMode, ObsidianWriteMode } from './interface';
import { DEFAULT_TEMPLATE } from './template';
import localeService from '@/common/locales';

const { Option } = Select;
const { TreeNode } = Tree;

interface ObsidianFormProps {
  info?: ObsidianFormConfig;
}

/** 目录树节点 */
interface FolderTreeNode {
  title: string;
  key: string;
  children: FolderTreeNode[];
}

/**
 * 通过 REST API 获取指定目录下的子目录
 */
async function fetchChildren(port: number, apiKey: string, dir: string): Promise<string[]> {
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
  return entries
    .filter(e => e.endsWith('/'))
    .map(e => e.slice(0, -1));
}

/**
 * 递归获取完整目录树
 */
async function fetchFolderTree(port: number, apiKey: string): Promise<FolderTreeNode[]> {
  async function buildTree(parentPath: string): Promise<FolderTreeNode[]> {
    const children = await fetchChildren(port, apiKey, parentPath);
    const nodes: FolderTreeNode[] = [];
    for (const name of children) {
      const fullPath = parentPath ? `${parentPath}/${name}` : name;
      const subChildren = await buildTree(fullPath);
      nodes.push({
        title: name,
        key: fullPath,
        children: subChildren,
      });
    }
    return nodes;
  }
  return buildTree('');
}

/**
 * 渲染树节点
 */
function renderTreeNodes(nodes: FolderTreeNode[]): React.ReactNode {
  return nodes.map(node => (
    <TreeNode title={node.title} key={node.key}>
      {node.children.length > 0 ? renderTreeNodes(node.children) : null}
    </TreeNode>
  ));
}

const ObsidianForm: React.FC<ObsidianFormProps & FormComponentProps> = ({ form, info }) => {
  const { getFieldDecorator, getFieldValue, setFieldsValue } = form;
  const initData: Partial<ObsidianFormConfig> = info || {};
  const connectionMode: ObsidianConnectionMode = getFieldValue('connectionMode') || initData.connectionMode || 'uri';
  const [fetching, setFetching] = useState(false);
  const [treeData, setTreeData] = useState<FolderTreeNode[]>([]);
  const [treeLoaded, setTreeLoaded] = useState(false);

  // 已选中的文件夹（从 folder 字段解析）
  const currentFolder: string = getFieldValue('folder') || initData.folder || '';
  const checkedKeys = currentFolder ? currentFolder.split('\n').filter(f => f.trim()) : [];

  // 获取目录树
  const handleFetchTree = useCallback(async () => {
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
      const tree = await fetchFolderTree(port, apiKey);
      setTreeData(tree);
      setTreeLoaded(true);
      if (tree.length === 0) {
        setFieldsValue({ folder: '/' });
        message.info(localeService.format({
          id: 'backend.services.obsidian.form.fetchFolders.empty',
          defaultMessage: 'No subfolders found, using vault root',
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

  // 树节点勾选变化时更新 folder 字段
  const handleTreeCheck = useCallback((checked: any) => {
    const keys: string[] = Array.isArray(checked) ? checked : checked.checked || [];
    setFieldsValue({ folder: keys.join('\n') });
  }, [setFieldsValue]);

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
          <Form.Item label={localeService.format({
            id: 'backend.services.obsidian.form.writeMode',
            defaultMessage: 'Write Mode',
          })}>
            {getFieldDecorator('writeMode', {
              initialValue: initData.writeMode || 'create',
            })(
              <Select>
                <Option value="create">{localeService.format({
                  id: 'backend.services.obsidian.form.writeMode.create',
                  defaultMessage: 'Create / Overwrite',
                })}</Option>
                <Option value="append">{localeService.format({
                  id: 'backend.services.obsidian.form.writeMode.append',
                  defaultMessage: 'Append to end',
                })}</Option>
                <Option value="prepend">{localeService.format({
                  id: 'backend.services.obsidian.form.writeMode.prepend',
                  defaultMessage: 'Insert at beginning',
                })}</Option>
              </Select>
            )}
          </Form.Item>
        </Fragment>
      )}

      {/* 隐藏的 folder 字段，用于存储选中值 */}
      {getFieldDecorator('folder', {
        initialValue: initData.folder,
        rules: [{ required: true, message: localeService.format({
          id: 'backend.services.obsidian.form.folder.required',
          defaultMessage: 'Please select save folders',
        })}],
      })(<Input type="hidden" />)}

      <Form.Item label={localeService.format({
        id: 'backend.services.obsidian.form.folder',
        defaultMessage: 'Save Folder',
      })}>
        {connectionMode === 'rest' ? (
          <Fragment>
            <Button
              size="small"
              loading={fetching}
              onClick={handleFetchTree}
              style={{ marginBottom: 8 }}
            >
              {localeService.format({
                id: 'backend.services.obsidian.form.fetchFolders',
                defaultMessage: 'Fetch folders from Obsidian',
              })}
            </Button>
            {fetching && <Spin size="small" style={{ marginLeft: 8 }} />}
            {treeLoaded && treeData.length > 0 && (
              <div style={{ maxHeight: 240, overflow: 'auto', border: '1px solid #d9d9d9', borderRadius: 4, padding: 4 }}>
                <Tree
                  checkable
                  defaultExpandAll
                  checkedKeys={checkedKeys}
                  onCheck={handleTreeCheck}
                >
                  {renderTreeNodes(treeData)}
                </Tree>
              </div>
            )}
            {treeLoaded && treeData.length === 0 && (
              <div style={{ color: '#999', fontSize: 12 }}>
                {localeService.format({
                  id: 'backend.services.obsidian.form.fetchFolders.empty',
                  defaultMessage: 'No subfolders found, using vault root',
                })}
              </div>
            )}
          </Fragment>
        ) : (
          <Input.TextArea
            value={currentFolder}
            onChange={(e) => setFieldsValue({ folder: e.target.value })}
            placeholder={localeService.format({
              id: 'backend.services.obsidian.form.folder.placeholder',
              defaultMessage: 'One folder per line',
            })}
          />
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
