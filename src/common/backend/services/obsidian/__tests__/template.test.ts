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
