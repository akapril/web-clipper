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

  test('标题中的特殊字符被清理', async () => {
    const service = new ObsidianService(baseConfig);
    await service.createDocument({
      ...baseRequest,
      title: 'foo/bar\\baz:qux*test?"<>|end',
    });
    const url = mockWindowOpen.mock.calls[0][0] as string;
    // 所有非法字符替换为短横线，不应包含路径分隔符
    expect(url).not.toContain('file=Clippings%2Ffoo%2F');
    expect(url).toContain('foo-bar-baz-qux-test-end');
  });

  test('纯特殊字符标题回退为 Untitled', async () => {
    const service = new ObsidianService(baseConfig);
    await service.createDocument({
      ...baseRequest,
      title: '///???',
    });
    const url = mockWindowOpen.mock.calls[0][0] as string;
    expect(url).toContain('Untitled');
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
