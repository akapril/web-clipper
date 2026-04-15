import { ToolExtension } from '../../common';

type AiMode = 'summary' | 'translate' | 'tags' | 'format';
type OutputMode = 'replace' | 'prepend' | 'append';

interface AiConfig {
  apiBase: string;
  apiKey: string;
  model: string;
  mode: AiMode;
  outputMode: OutputMode;
  targetLanguage: string;
  customPrompt: string;
}

/** 各模式的内置 system prompt */
const PROMPTS: Record<AiMode, (config: AiConfig) => string> = {
  summary: () =>
    '请用3-5句话简洁地总结以下内容，仅返回摘要，使用 Markdown 格式。',
  translate: (config) =>
    `请将以下内容翻译为 ${config.targetLanguage}，保留所有 Markdown 格式，仅返回翻译结果。`,
  tags: () =>
    '请从以下内容中提取5-10个关键词标签，以逗号分隔的单行返回，格式为 "Tags: tag1, tag2, ..."',
  format: () =>
    '请优化以下 Markdown 内容的格式，修正标题层级、列表、代码块和段落间距，保留所有原始内容，仅返回优化后的 Markdown。',
};

/**
 * 调用 OpenAI 兼容 API
 */
async function callAiApi(
  apiBase: string,
  apiKey: string,
  model: string,
  systemPrompt: string,
  content: string
): Promise<string> {
  const url = `${apiBase.replace(/\/+$/, '')}/chat/completions`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`AI API 错误: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || '';
}

/**
 * 根据输出模式合并 AI 结果和原始内容
 */
function mergeContent(original: string, aiResult: string, outputMode: OutputMode): string {
  switch (outputMode) {
    case 'replace':
      return aiResult;
    case 'prepend':
      return `${aiResult}\n\n---\n\n${original}`;
    case 'append':
      return `${original}\n\n---\n\n${aiResult}`;
    default:
      return aiResult;
  }
}

export default class AiExtension extends ToolExtension<any> {
  constructor() {
    super(
      {
        extensionId: 'ai',
        name: 'AI Processing',
        icon: 'thunderbolt',
        version: '1.0.0',
        description: 'AI-powered content processing: summary, translation, tags, formatting',
        automatic: true,
        i18nManifest: {
          'zh-CN': {
            name: 'AI 处理',
            description: 'AI 内容处理：摘要、翻译、标签提取、格式优化',
          },
        },
        config: {
          scheme: {
            type: 'object',
            properties: {
              apiBase: {
                type: 'string',
                title: 'API Address',
                'x-decorator': 'FormItem',
                'x-component': 'Input',
                'x-component-props': {
                  placeholder: 'https://api.openai.com/v1',
                },
              },
              apiKey: {
                type: 'string',
                title: 'API Key',
                'x-decorator': 'FormItem',
                'x-component': 'Input',
                'x-component-props': {
                  placeholder: 'sk-...',
                  type: 'password',
                },
              },
              model: {
                type: 'string',
                title: 'Model',
                'x-decorator': 'FormItem',
                'x-component': 'AiModelSelect',
              },
              testConnection: {
                type: 'void',
                'x-decorator': 'FormItem',
                'x-component': 'AiTestButton',
              },
              mode: {
                type: 'string',
                title: 'Processing Mode',
                'x-decorator': 'FormItem',
                'x-component': 'Select',
                enum: [
                  { label: 'Summary / 摘要', value: 'summary' },
                  { label: 'Translate / 翻译', value: 'translate' },
                  { label: 'Tags / 标签', value: 'tags' },
                  { label: 'Format / 格式优化', value: 'format' },
                ],
              },
              outputMode: {
                type: 'string',
                title: 'Output Mode',
                'x-decorator': 'FormItem',
                'x-component': 'Select',
                enum: [
                  { label: 'Replace / 替换', value: 'replace' },
                  { label: 'Prepend / 前置追加', value: 'prepend' },
                  { label: 'Append / 后置追加', value: 'append' },
                ],
              },
              targetLanguage: {
                type: 'string',
                title: 'Target Language',
                'x-decorator': 'FormItem',
                'x-component': 'Input',
                'x-component-props': {
                  placeholder: 'zh-CN',
                },
              },
              customPrompt: {
                type: 'string',
                title: 'Custom Prompt',
                'x-decorator': 'FormItem',
                'x-component': 'textarea',
                'x-component-props': {
                  autoSize: true,
                  placeholder: '留空使用内置提示词 / Leave empty to use built-in prompts',
                },
              },
            },
          },
          default: {
            apiBase: 'https://api.openai.com/v1',
            apiKey: '',
            model: 'gpt-4o-mini',
            mode: 'summary',
            outputMode: 'prepend',
            targetLanguage: 'zh-CN',
            customPrompt: '',
          },
        },
      },
      {
        afterRun: async (context) => {
          const config: AiConfig = {
            apiBase: 'https://api.openai.com/v1',
            apiKey: '',
            model: 'gpt-4o-mini',
            mode: 'summary',
            outputMode: 'prepend',
            targetLanguage: 'zh-CN',
            customPrompt: '',
            ...context.config,
          };

          // 未配置 API Key 时跳过
          if (!config.apiKey) {
            context.message.warning('请先在扩展设置中配置 AI API Key');
            return context.data;
          }

          // 内容为空时跳过
          if (!context.data || !context.data.trim()) {
            return context.data;
          }

          // 确定 system prompt
          const systemPrompt = config.customPrompt?.trim()
            || PROMPTS[config.mode](config);

          try {
            const aiResult = await callAiApi(
              config.apiBase,
              config.apiKey,
              config.model,
              systemPrompt,
              context.data
            );

            if (!aiResult) {
              context.message.error('AI 返回内容为空');
              return context.data;
            }

            return mergeContent(context.data, aiResult, config.outputMode);
          } catch (error: any) {
            context.message.error(`AI 处理失败: ${error.message}`);
            return context.data;
          }
        },
      }
    );
  }
}
