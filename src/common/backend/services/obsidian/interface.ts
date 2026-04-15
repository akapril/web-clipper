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
