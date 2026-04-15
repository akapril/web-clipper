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
  // 将 tags 中的逗号格式化为 ", "（YAML 数组友好格式）
  const normalizedVars: TemplateVariables = {
    ...vars,
    tags: vars.tags
      ? vars.tags
          .split(',')
          .map((t) => t.trim())
          .join(', ')
      : '',
  };

  // 处理条件块 {{#key}}content{{/key}}
  let result = template.replace(
    /\{\{#(\w+)\}\}(.*?)\{\{\/\1\}\}/gs,
    (_, key, content) => {
      const value = normalizedVars[key];
      if (!value || value.trim() === '') {
        return '';
      }
      // 递归替换条件块内的变量
      return content.replace(/\{\{(\w+)\}\}/g, (_: string, k: string) => normalizedVars[k] ?? '');
    }
  );

  // 替换普通变量 {{key}}
  result = result.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const value = normalizedVars[key];
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
