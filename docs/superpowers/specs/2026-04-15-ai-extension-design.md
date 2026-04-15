# AI Processing Extension Design

**Goal:** Add an AI-powered ToolExtension that processes clipped content with summary, translation, tag extraction, and format optimization capabilities via OpenAI-compatible API.

## Architecture

Single `ToolExtension` with ID `web-clipper/ai`, `automatic: true`. One file: `src/extensions/extensions/web-clipper/ai.ts`.

Uses only `afterRun()` — no DOM access needed, operates on already-extracted markdown content.

## Configuration (Formily Schema)

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `apiBase` | string | `https://api.openai.com/v1` | OpenAI-compatible API endpoint |
| `apiKey` | string | — | API Key |
| `model` | string | `gpt-4o-mini` | Model name |
| `mode` | enum | `summary` | Default mode: summary/translate/tags/format |
| `outputMode` | enum | `prepend` | Output: replace/prepend/append |
| `targetLanguage` | string | `zh-CN` | Translation target language |
| `customPrompt` | string | — | Optional custom system prompt override |

## Processing Modes

| Mode | Behavior | Default Output |
|------|----------|---------------|
| `summary` | Generate 3-5 sentence summary | prepend |
| `translate` | Translate to targetLanguage | replace |
| `tags` | Extract 5-10 keyword tags | append |
| `format` | Optimize markdown structure | replace |

## Built-in Prompts

- **summary**: "Summarize the following content in 3-5 concise sentences. Return only the summary in markdown."
- **translate**: "Translate the following content to {targetLanguage}. Preserve all markdown formatting. Return only the translation."
- **tags**: "Extract 5-10 keyword tags from the following content. Return them as a comma-separated list on a single line, prefixed with 'Tags: '."
- **format**: "Optimize the markdown formatting of the following content. Fix headings, lists, code blocks, and paragraph spacing. Preserve all original content. Return only the optimized markdown."

If `customPrompt` is set, it replaces the built-in prompt for the selected mode.

## Execution Flow

```
afterRun(context):
  1. Read config from context.config (apiBase, apiKey, model, mode, outputMode, etc.)
  2. If no apiKey configured, show warning via context.message and return context.data unchanged
  3. Select system prompt based on mode (or use customPrompt)
  4. POST {apiBase}/chat/completions with model, system prompt, user content = context.data
  5. Extract response content
  6. Apply outputMode:
     - replace: return aiResult
     - prepend: return aiResult + "\n\n---\n\n" + context.data
     - append: return context.data + "\n\n---\n\n" + aiResult
  7. Return merged content
```

## i18n Keys

- `extension.ai.name` — "AI Processing" / "AI 处理"
- `extension.ai.description` — description text
- `extension.ai.config.apiBase` — "API Address" / "API 地址"
- `extension.ai.config.apiKey` — "API Key"
- `extension.ai.config.model` — "Model" / "模型"
- `extension.ai.config.mode` — "Processing Mode" / "处理模式"
- `extension.ai.config.outputMode` — "Output Mode" / "输出方式"
- `extension.ai.config.targetLanguage` — "Target Language" / "目标语言"
- `extension.ai.config.customPrompt` — "Custom Prompt" / "自定义提示词"
