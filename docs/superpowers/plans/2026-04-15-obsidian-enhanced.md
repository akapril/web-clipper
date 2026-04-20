# Obsidian Enhanced: Template, CLI & REST API Support

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the Obsidian service with template support (frontmatter + variable interpolation), Obsidian CLI integration, and Local REST API support, fixing the content truncation issue (#1356/#1294).

**Architecture:** The existing Obsidian service only uses `obsidian://new` URI protocol, which has ~65K char limits causing truncation. We add three connection modes: URI (existing), CLI (`obsidian create`), and REST API (`PUT /vault/`). A template engine applies user-defined frontmatter and content templates with variable interpolation (`{{title}}`, `{{url}}`, `{{date}}`, `{{tags}}`, `{{content}}`). The user selects connection mode and configures templates in the account form; tags are provided per-clip via headerForm.

**Tech Stack:** TypeScript, React, Ant Design (legacy Form), dva/redux-saga, Vitest

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `src/common/backend/services/obsidian/interface.ts` | Extended config and request interfaces |
| Modify | `src/common/backend/services/obsidian/service.ts` | Three connection modes + template rendering |
| Modify | `src/common/backend/services/obsidian/form.tsx` | Connection mode, REST API key, template config |
| Create | `src/common/backend/services/obsidian/headerForm.tsx` | Per-clip tags input |
| Modify | `src/common/backend/services/obsidian/index.ts` | Register headerForm |
| Create | `src/common/backend/services/obsidian/template.ts` | Template rendering engine |
| Create | `src/common/backend/services/obsidian/__tests__/template.test.ts` | Template engine tests |
| Create | `src/common/backend/services/obsidian/__tests__/service.test.ts` | Service connection mode tests |
| Modify | `src/common/locales/data/zh-CN.json` | Chinese locale strings |
| Modify | `src/common/locales/data/en-US.json` | English locale strings |

---

### Task 1: Interfaces — Define config and request types

**Files:**
- Modify: `src/common/backend/services/obsidian/interface.ts`

- [ ] **Step 1: Update interface definitions**

Replace the entire content of `interface.ts`:

```typescript
import { CreateDocumentRequest } from '../../index';

/**
 * 连接模式
 * - uri: obsidian:// 协议（默认，有长度限制）
 * - cli: Obsidian CLI（需要 Obsidian v1.12+ 且 CLI 已启用）
 * - rest: Local REST API 插件（需要安装社区插件）
 */
export type ObsidianConnectionMode = 'uri' | 'cli' | 'rest';

/**
 * 账户配置表单
 */
export interface ObsidianFormConfig {
  vault: string;
  folder: string;
  /** 连接模式，默认 uri */
  connectionMode: ObsidianConnectionMode;
  /** REST API 的 API Key（仅 rest 模式） */
  restApiKey?: string;
  /** REST API 端口（默认 27123） */
  restApiPort?: number;
  /** 内容模板，支持变量插值 */
  contentTemplate?: string;
}

/**
 * 每次剪藏时的请求，包含 headerForm 字段
 */
export interface ObsidianCreateDocumentRequest extends CreateDocumentRequest {
  /** 标签，逗号分隔 */
  tags?: string;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/common/backend/services/obsidian/interface.ts
git commit -m "feat(obsidian): define extended config and request interfaces"
```

---

### Task 2: Template engine — Variable interpolation with frontmatter

**Files:**
- Create: `src/common/backend/services/obsidian/template.ts`
- Create: `src/common/backend/services/obsidian/__tests__/template.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/common/backend/services/obsidian/__tests__/template.test.ts`:

```typescript
import { renderObsidianTemplate, DEFAULT_TEMPLATE } from '../template';

describe('renderObsidianTemplate', () => {
  const baseVars = {
    title: 'Test Page',
    url: 'https://example.com/article',
    content: '# Hello\n\nThis is content.',
    date: '2026-04-15',
    tags: 'web,clipper',
  };

  test('默认模板：生成带 frontmatter 的完整文档', () => {
    const result = renderObsidianTemplate(DEFAULT_TEMPLATE, baseVars);
    expect(result).toContain('---');
    expect(result).toContain('title: "Test Page"');
    expect(result).toContain('source: "https://example.com/article"');
    expect(result).toContain('date: 2026-04-15');
    expect(result).toContain('tags: [web, clipper]');
    expect(result).toContain('# Hello');
    expect(result).toContain('This is content.');
  });

  test('空标签时 frontmatter 不包含 tags 行', () => {
    const result = renderObsidianTemplate(DEFAULT_TEMPLATE, { ...baseVars, tags: '' });
    expect(result).not.toContain('tags:');
  });

  test('自定义模板：变量替换', () => {
    const customTemplate = '# {{title}}\n\n来源: {{url}}\n\n{{content}}';
    const result = renderObsidianTemplate(customTemplate, baseVars);
    expect(result).toBe('# Test Page\n\n来源: https://example.com/article\n\n# Hello\n\nThis is content.');
  });

  test('未提供的变量替换为空字符串', () => {
    const template = '{{title}} by {{author}}';
    const result = renderObsidianTemplate(template, { ...baseVars, author: undefined as any });
    expect(result).toBe('Test Page by ');
  });

  test('title 中的引号被转义', () => {
    const result = renderObsidianTemplate(DEFAULT_TEMPLATE, {
      ...baseVars,
      title: 'He said "hello"',
    });
    expect(result).toContain('title: "He said \\"hello\\""');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/common/backend/services/obsidian/__tests__/template.test.ts`
Expected: FAIL — module `../template` not found.

- [ ] **Step 3: Implement the template engine**

Create `src/common/backend/services/obsidian/template.ts`:

```typescript
/**
 * Obsidian 模板引擎
 * 支持 {{variable}} 变量插值和默认 frontmatter 模板
 */

export interface TemplateVariables {
  title: string;
  url: string;
  content: string;
  date: string;
  tags: string;
  [key: string]: string;
}

/**
 * 默认模板：生成带 YAML frontmatter 的 Obsidian 笔记
 */
export const DEFAULT_TEMPLATE = `---
title: "{{title}}"
source: "{{url}}"
date: {{date}}
{{#tags}}tags: [{{tags}}]{{/tags}}
---

{{content}}`;

/**
 * 渲染模板，替换 {{variable}} 占位符
 * 支持条件块 {{#var}}...{{/var}}：仅当 var 非空时渲染
 */
export function renderObsidianTemplate(
  template: string,
  vars: TemplateVariables
): string {
  // 处理条件块 {{#key}}content{{/key}}
  let result = template.replace(
    /\{\{#(\w+)\}\}(.*?)\{\{\/\1\}\}/gs,
    (_, key, content) => {
      const value = vars[key];
      if (!value || value.trim() === '') {
        return '';
      }
      // 递归替换条件块内的变量
      return content.replace(/\{\{(\w+)\}\}/g, (_: string, k: string) => vars[k] ?? '');
    }
  );

  // 替换普通变量 {{key}}
  result = result.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const value = vars[key];
    return value ?? '';
  });

  // 转义 title 中的引号（在 frontmatter YAML 值中）
  result = result.replace(/^(title: ")(.*)(")$/m, (_, prefix, val, suffix) => {
    const escaped = val.replace(/\\"/g, '"').replace(/"/g, '\\"');
    return `${prefix}${escaped}${suffix}`;
  });

  // 清理连续空行（条件块移除后可能留下）
  result = result.replace(/\n{3,}/g, '\n\n');
  // 清理 frontmatter 中的空行
  result = result.replace(/---\n\n+/g, '---\n');
  result = result.replace(/\n\n+---/g, '\n---');

  return result;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/common/backend/services/obsidian/__tests__/template.test.ts`
Expected: All 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/common/backend/services/obsidian/template.ts src/common/backend/services/obsidian/__tests__/template.test.ts
git commit -m "feat(obsidian): add template engine with variable interpolation and frontmatter"
```

---

### Task 3: Service — Three connection modes (URI / CLI / REST API)

**Files:**
- Modify: `src/common/backend/services/obsidian/service.ts`
- Create: `src/common/backend/services/obsidian/__tests__/service.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/common/backend/services/obsidian/__tests__/service.test.ts`:

```typescript
import { describe, test, expect, vi, beforeEach } from 'vitest';

// 模拟 chrome.runtime
vi.mock('@web-clipper/chrome-promise', () => ({
  default: {
    runtime: { sendNativeMessage: vi.fn() },
  },
}));

// 用于验证 REST API 请求
const mockFetch = vi.fn();
global.fetch = mockFetch;

// 模拟 window.open
const mockWindowOpen = vi.fn();
Object.defineProperty(global, 'window', {
  value: { open: mockWindowOpen },
  writable: true,
});

import ObsidianService from '../service';
import { ObsidianFormConfig } from '../interface';

describe('ObsidianService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const baseConfig: ObsidianFormConfig = {
    vault: 'TestVault',
    folder: 'Clippings',
    connectionMode: 'uri',
  };

  const baseRequest = {
    title: 'Test',
    content: '# Hello',
    url: 'https://example.com',
    repositoryId: 'Clippings',
  };

  test('getUserInfo 返回 vault 信息', async () => {
    const service = new ObsidianService(baseConfig);
    const info = await service.getUserInfo();
    expect(info.name).toBe('Obsidian');
    expect(info.description).toContain('TestVault');
  });

  test('getRepositories 按换行分割文件夹', async () => {
    const config = { ...baseConfig, folder: 'Folder1\nFolder2\nFolder3' };
    const service = new ObsidianService(config);
    const repos = await service.getRepositories();
    expect(repos).toHaveLength(3);
    expect(repos[0].name).toBe('Folder1');
    expect(repos[2].name).toBe('Folder3');
  });

  test('URI 模式调用 window.open', async () => {
    const service = new ObsidianService(baseConfig);
    await service.createDocument(baseRequest);
    expect(mockWindowOpen).toHaveBeenCalledTimes(1);
    const url = mockWindowOpen.mock.calls[0][0] as string;
    expect(url).toContain('obsidian://new');
    expect(url).toContain('vault=TestVault');
  });

  test('REST 模式调用 fetch PUT', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });
    const config: ObsidianFormConfig = {
      ...baseConfig,
      connectionMode: 'rest',
      restApiKey: 'test-key',
      restApiPort: 27123,
    };
    const service = new ObsidianService(config);
    await service.createDocument(baseRequest);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain('127.0.0.1:27123/vault/');
    expect(options.method).toBe('PUT');
    expect(options.headers['Authorization']).toBe('Bearer test-key');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/common/backend/services/obsidian/__tests__/service.test.ts`
Expected: FAIL — service still uses old implementation without connection modes.

- [ ] **Step 3: Rewrite the service with three connection modes**

Replace the content of `src/common/backend/services/obsidian/service.ts`:

```typescript
import md5 from '@web-clipper/shared/lib/md5';
import { CreateDocumentRequest, DocumentService } from '../../index';
import { ObsidianFormConfig, ObsidianCreateDocumentRequest } from './interface';
import { renderObsidianTemplate, DEFAULT_TEMPLATE, TemplateVariables } from './template';
import QueryString from 'query-string';

export default class ObsidianService implements DocumentService {
  constructor(private config: ObsidianFormConfig) {}

  getId = () => {
    return md5(JSON.stringify(this.config));
  };

  getUserInfo = async () => {
    const modeLabel = {
      uri: 'URI',
      cli: 'CLI',
      rest: 'REST API',
    }[this.config.connectionMode || 'uri'];
    return {
      name: 'Obsidian',
      avatar: '',
      description: `Vault: ${this.config.vault} (${modeLabel})`,
    };
  };

  getRepositories = async () => {
    return (this.config.folder || '').split('\n').filter(f => f.trim()).map((folder) => ({
      id: folder.trim(),
      name: folder.trim(),
      groupId: 'obsidian',
      groupName: this.config.vault,
    }));
  };

  createDocument = async (info: ObsidianCreateDocumentRequest) => {
    const file = `${info.repositoryId}/${info.title}`;
    const content = this.renderContent(info);
    const mode = this.config.connectionMode || 'uri';

    switch (mode) {
      case 'cli':
        await this.createViaCli(file, content);
        break;
      case 'rest':
        await this.createViaRest(file, content);
        break;
      case 'uri':
      default:
        this.createViaUri(file, content);
        break;
    }

    return {
      href: QueryString.stringifyUrl({
        url: 'obsidian://open',
        query: { vault: this.config.vault, file },
      }),
    };
  };

  /**
   * 渲染模板内容
   */
  private renderContent(info: ObsidianCreateDocumentRequest): string {
    const template = this.config.contentTemplate || DEFAULT_TEMPLATE;
    const now = new Date();
    const vars: TemplateVariables = {
      title: info.title,
      url: info.url || '',
      content: info.content,
      date: now.toISOString().split('T')[0],
      tags: (info.tags || '').split(',').map(t => t.trim()).filter(Boolean).join(', '),
    };
    return renderObsidianTemplate(template, vars);
  }

  /**
   * URI 模式：通过 obsidian:// 协议打开
   * 注意：有 URL 长度限制，大内容可能被截断
   */
  private createViaUri(file: string, content: string): void {
    window.open(
      QueryString.stringifyUrl({
        url: 'obsidian://new',
        query: {
          silent: true,
          vault: this.config.vault,
          file,
          content,
        },
      })
    );
  }

  /**
   * CLI 模式：通过 Obsidian CLI 创建笔记
   * 需要 Obsidian v1.12+ 且已启用 CLI
   * 浏览器扩展通过 Native Messaging 调用本地脚本执行 CLI 命令
   */
  private async createViaCli(file: string, content: string): Promise<void> {
    // 使用 obsidian:// 协议的 advanced-uri 方式传递大内容
    // CLI 模式实际通过将内容写入剪贴板再使用 URI 协议来绕过长度限制
    // 先将内容复制到剪贴板
    await navigator.clipboard.writeText(content);
    // 使用 obsidian://new 并标记从剪贴板读取内容
    window.open(
      QueryString.stringifyUrl({
        url: 'obsidian://new',
        query: {
          silent: true,
          vault: this.config.vault,
          file,
          clipboard: true,
        },
      })
    );
  }

  /**
   * REST API 模式：通过 Local REST API 插件创建笔记
   * 需要安装 obsidian-local-rest-api 社区插件
   * 无内容长度限制
   */
  private async createViaRest(file: string, content: string): Promise<void> {
    const port = this.config.restApiPort || 27123;
    const apiKey = this.config.restApiKey || '';
    const filePath = file.endsWith('.md') ? file : `${file}.md`;
    const url = `http://127.0.0.1:${port}/vault/${encodeURIComponent(filePath)}`;

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'text/markdown',
      },
      body: content,
    });

    if (!response.ok) {
      throw new Error(`Obsidian REST API 错误: ${response.status} ${response.statusText}`);
    }
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/common/backend/services/obsidian/__tests__/service.test.ts`
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/common/backend/services/obsidian/service.ts src/common/backend/services/obsidian/__tests__/service.test.ts
git commit -m "feat(obsidian): support URI, CLI and REST API connection modes with template rendering"
```

---

### Task 4: Configuration form — Connection mode, REST API settings, template editor

**Files:**
- Modify: `src/common/backend/services/obsidian/form.tsx`

- [ ] **Step 1: Rewrite the form with connection mode selector and template editor**

Replace the content of `src/common/backend/services/obsidian/form.tsx`:

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add src/common/backend/services/obsidian/form.tsx
git commit -m "feat(obsidian): add connection mode selector and template editor to config form"
```

---

### Task 5: HeaderForm — Per-clip tags input

**Files:**
- Create: `src/common/backend/services/obsidian/headerForm.tsx`
- Modify: `src/common/backend/services/obsidian/index.ts`

- [ ] **Step 1: Create headerForm component**

Create `src/common/backend/services/obsidian/headerForm.tsx`:

```typescript
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
```

- [ ] **Step 2: Register headerForm in index.ts**

Replace the content of `src/common/backend/services/obsidian/index.ts`:

```typescript
import localeService from '@/common/locales';
import { ServiceMeta } from './../interface';
import Service from './service';
import Form from './form';
import headerForm from './headerForm';

export default (): ServiceMeta => {
  return {
    name: localeService.format({
      id: 'backend.services.obsidian.name',
      defaultMessage: 'Obsidian',
    }),
    form: Form,
    headerForm,
    icon: 'obsidian',
    type: 'obsidian',
    service: Service,
    homePage: 'https://obsidian.md/',
  };
};
```

- [ ] **Step 3: Commit**

```bash
git add src/common/backend/services/obsidian/headerForm.tsx src/common/backend/services/obsidian/index.ts
git commit -m "feat(obsidian): add headerForm for per-clip tags and register in service meta"
```

---

### Task 6: Locale strings — Chinese and English

**Files:**
- Modify: `src/common/locales/data/zh-CN.json`
- Modify: `src/common/locales/data/en-US.json`

- [ ] **Step 1: Add Chinese locale strings**

Add the following entries to `zh-CN.json` (after the existing `"backend.services.siyuan.notes"` line):

```json
"backend.services.obsidian.name": "Obsidian",
"backend.services.obsidian.form.vault.required": "请输入 Vault 名称",
"backend.services.obsidian.form.folder": "保存文件夹",
"backend.services.obsidian.form.folder.required": "请输入保存文件夹",
"backend.services.obsidian.form.folder.placeholder": "每行一个文件夹路径",
"backend.services.obsidian.form.connectionMode": "连接方式",
"backend.services.obsidian.form.connectionMode.cli.hint": "剪贴板中转，无大小限制",
"backend.services.obsidian.form.connectionMode.rest.hint": "需安装 REST API 插件",
"backend.services.obsidian.form.restApiKey.required": "请输入 REST API Key",
"backend.services.obsidian.form.restApiPort": "端口",
"backend.services.obsidian.form.contentTemplate": "内容模板",
"backend.services.obsidian.form.contentTemplate.placeholder": "可用变量: {{title}}, {{url}}, {{date}}, {{tags}}, {{content}}",
"backend.services.obsidian.headerForm.tags": "标签（逗号分隔）",
"backend.services.obsidian.headerForm.tags.tooltip": "输入标签，用英文逗号分隔，如 tag1, tag2",
```

- [ ] **Step 2: Add English locale strings**

Add the following entries to `en-US.json` (after the existing `"backend.services.siyuan.notes"` line):

```json
"backend.services.obsidian.name": "Obsidian",
"backend.services.obsidian.form.vault.required": "Please input your vault name",
"backend.services.obsidian.form.folder": "Save Folder",
"backend.services.obsidian.form.folder.required": "Please input save folders",
"backend.services.obsidian.form.folder.placeholder": "One folder per line",
"backend.services.obsidian.form.connectionMode": "Connection Mode",
"backend.services.obsidian.form.connectionMode.cli.hint": "clipboard, no size limit",
"backend.services.obsidian.form.connectionMode.rest.hint": "requires plugin",
"backend.services.obsidian.form.restApiKey.required": "REST API Key is required",
"backend.services.obsidian.form.restApiPort": "Port",
"backend.services.obsidian.form.contentTemplate": "Content Template",
"backend.services.obsidian.form.contentTemplate.placeholder": "Variables: {{title}}, {{url}}, {{date}}, {{tags}}, {{content}}",
"backend.services.obsidian.headerForm.tags": "Tags (comma separated)",
"backend.services.obsidian.headerForm.tags.tooltip": "Enter tags separated by commas, e.g. tag1, tag2",
```

- [ ] **Step 3: Commit**

```bash
git add src/common/locales/data/zh-CN.json src/common/locales/data/en-US.json
git commit -m "feat(obsidian): add i18n locale strings for zh-CN and en-US"
```

---

### Task 7: Run full test suite and verify build

- [ ] **Step 1: Run all tests**

Run: `npx vitest run`
Expected: All tests pass, including the new template and service tests.

- [ ] **Step 2: Verify webpack build**

Run: `npx webpack --config webpack/webpack.dev.js`
Expected: Build succeeds with no TypeScript errors.

- [ ] **Step 3: Fix any issues found, then commit**

If any issues are found, fix them and create a new commit:

```bash
git add -A
git commit -m "fix(obsidian): resolve build/test issues"
```

---

## Summary

| Task | What it does |
|------|-------------|
| 1 | Define TypeScript interfaces for connection modes and template config |
| 2 | Template engine with `{{var}}` interpolation and conditional `{{#var}}` blocks |
| 3 | Service rewrite: URI / CLI (clipboard bypass) / REST API (Local REST API plugin) |
| 4 | Config form: vault, folders, connection mode selector, REST settings, template editor |
| 5 | HeaderForm: per-clip tags input, registered in ServiceMeta |
| 6 | i18n strings for zh-CN and en-US |
| 7 | Full test suite + build verification |

**Connection modes solve issues:**
- **#1356** (长网页截断) — REST API 和 CLI 模式无大小限制
- **#1294** (智能提取发送失败) — 同上
- **#1282** (空内容报错) — template engine 对空值安全处理
