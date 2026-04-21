import React, { useState, useCallback, useEffect } from 'react';
import { Button, Card, Modal, Select, message, Spin } from 'antd';
import { FormattedMessage } from 'react-intl';
import { SerializedExtensionInfo } from '@/extensions/common';
import IconFont from '@/components/IconFont';
import { SettingOutlined } from '@ant-design/icons';
import { Form, FormItem, Input as FormInput, Select as FormSelect } from '@formily/antd-v5';
import { createForm, onFormValuesChange } from '@formily/core';
import { createSchemaField, useForm } from '@formily/react';
import { toJS } from 'mobx';
import Container from 'typedi';
import { IExtensionContainer, IExtensionService } from '@/service/common/extension';
import useFilterExtensions from '@/common/hooks/useFilterExtensions';
import './index.less';
import localeService from '@/common/locales/index';

interface ExtensionCardProps {
  manifest: SerializedExtensionInfo['manifest'];
  actions?: React.ReactNode[];
  className?: string;
}

const ExtensionSelect: React.FC<{ value: string; onChange: any }> = ({ value, onChange }) => {
  const extensionContainer = Container.get(IExtensionContainer);
  const [, clipExtensions] = useFilterExtensions(extensionContainer.extensions);

  return (
    <Select
      mode="multiple"
      value={value}
      onChange={onChange}
      options={clipExtensions.map(o => ({
        title: o.manifest.name,
        value: o.id,
        key: o.id,
      }))}
    ></Select>
  );
};

/**
 * AI 模型选择器：从 OpenAI 兼容 API 获取模型列表
 */
const AiModelSelect: React.FC<{ value?: string; onChange?: any }> = ({ value, onChange }) => {
  const [models, setModels] = useState<{ label: string; value: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const form = useForm();

  const fetchModels = useCallback(async () => {
    const apiBase = (form.values?.apiBase || 'https://api.openai.com/v1').replace(/\/+$/, '');
    const apiKey = form.values?.apiKey || '';
    if (!apiKey) {
      message.warning('请先填写 API Key');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/models`, {
        headers: { 'Authorization': `Bearer ${apiKey}` },
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      const list = (data.data || [])
        .map((m: any) => ({ label: m.id, value: m.id }))
        .sort((a: any, b: any) => a.label.localeCompare(b.label));
      setModels(list);
      if (list.length > 0) {
        message.success(`获取到 ${list.length} 个模型`);
      }
    } catch (e: any) {
      message.error(`获取模型列表失败: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, [form]);

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <Select
        showSearch
        value={value}
        onChange={onChange}
        placeholder="gpt-4o-mini"
        style={{ flex: 1 }}
        options={models.length > 0 ? models : (value ? [{ label: value, value }] : [])}
        filterOption={(input, option) =>
          (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
        }
      />
      <Button size="small" loading={loading} onClick={fetchModels}>
        获取列表
      </Button>
    </div>
  );
};

/**
 * AI 接口测试按钮
 */
const AiTestButton: React.FC = () => {
  const [testing, setTesting] = useState(false);
  const form = useForm();

  const handleTest = useCallback(async () => {
    const apiBase = (form.values?.apiBase || 'https://api.openai.com/v1').replace(/\/+$/, '');
    const apiKey = form.values?.apiKey || '';
    const model = form.values?.model || 'gpt-4o-mini';
    if (!apiKey) {
      message.warning('请先填写 API Key');
      return;
    }
    setTesting(true);
    try {
      const res = await fetch(`${apiBase}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: 'Hello, respond with "OK" only.' }],
          max_tokens: 5,
        }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`${res.status} ${text.slice(0, 100)}`);
      }
      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content || '';
      message.success(`连接成功！模型响应: "${reply.slice(0, 50)}"`);
    } catch (e: any) {
      message.error(`连接失败: ${e.message}`);
    } finally {
      setTesting(false);
    }
  }, [form]);

  return (
    <Button type="primary" loading={testing} onClick={handleTest} block>
      {testing ? '测试中...' : '测试连接'}
    </Button>
  );
};

const SchemaField = createSchemaField({
  components: {
    FormItem,
    Input: FormInput,
    Select: FormSelect,
    textarea: FormInput.TextArea!,
    clipExtensionsSelect: ExtensionSelect,
    AiModelSelect,
    AiTestButton,
  },
});

/**
 * 扩展配置表单组件 — createForm 只在首次渲染时创建
 */
const ExtensionConfigForm: React.FC<{ manifest: SerializedExtensionInfo['manifest'] }> = ({ manifest }) => {
  const config = manifest.config;
  const extensionId = manifest.extensionId as string;
  const formRef = React.useRef<any>(null);

  if (!formRef.current) {
    const defaultValue =
      Container.get(IExtensionService).getExtensionConfig(extensionId) ||
      toJS(config?.default);
    formRef.current = createForm({
      validateFirst: true,
      initialValues: defaultValue as any,
      effects: () => {
        onFormValuesChange(form => {
          if (form.mounted) {
            Container.get(IExtensionService).setExtensionConfig(extensionId, form.values);
          }
        });
      },
    });
  }

  return (
    <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '600px' }}>
        <Form form={formRef.current} layout="vertical">
          <SchemaField schema={config!.scheme} />
        </Form>
        <Button
          onClick={() => {
            formRef.current.setValues(toJS(config?.default), 'overwrite');
          }}
        >
          {localeService.format({ id: 'preference.extensions.form.reset' })}
        </Button>
      </div>
    </div>
  );
};

const ExtensionCard: React.FC<ExtensionCardProps> = ({ manifest, actions, className }) => {
  const extra: React.ReactNode[] = [manifest.version];
  const [configVisible, setConfigVisible] = React.useState(false);

  if (manifest.config) {
    extra.push(
      <SettingOutlined
        style={{ marginLeft: 8 }}
        key="setting"
        onClick={() => setConfigVisible(true)}
      />
    );
  }
  return (
    <React.Fragment>
      {manifest.config && (
        <Modal
          open={configVisible}
          onCancel={() => setConfigVisible(false)}
          footer={null}
          width={800}
          destroyOnClose
        >
          <ExtensionConfigForm manifest={manifest} />
        </Modal>
      )}
      <Card
        className={className}
        actions={actions}
        extra={[extra]}
        title={<Card.Meta avatar={<IconFont type={manifest.icon} />} title={manifest.name} />}
      >
        <div style={{ height: 30 }}>
          {manifest.description || <FormattedMessage id="preference.extensions.no.Description" />}
        </div>
      </Card>
    </React.Fragment>
  );
};

export default ExtensionCard;
