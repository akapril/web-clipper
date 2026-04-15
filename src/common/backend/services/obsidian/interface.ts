import { CreateDocumentRequest } from '../../index';

/**
 * 连接模式
 * - uri: obsidian:// 协议（默认，有长度限制）
 * - cli: Obsidian CLI（需要 Obsidian v1.12+ 且 CLI 已启用）
 * - rest: Local REST API 插件（需要安装社区插件）
 */
export type ObsidianConnectionMode = 'uri' | 'cli' | 'rest';

/**
 * 写入模式
 * - create: 创建新文件（默认，文件已存在则覆盖）
 * - append: 追加到已有文件末尾
 * - prepend: 插入到已有文件开头（frontmatter 之后）
 */
export type ObsidianWriteMode = 'create' | 'append' | 'prepend';

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
  /** 写入模式，默认 create（仅 rest 模式支持 append/prepend） */
  writeMode?: ObsidianWriteMode;
}

/**
 * 每次剪藏时的请求，包含 headerForm 字段
 */
export interface ObsidianCreateDocumentRequest extends CreateDocumentRequest {
  /** 标签，逗号分隔 */
  tags?: string;
}
