import { Token } from 'typedi';

export interface IToggleConfig {
  pathname: string;
  query?: string;
}
export interface IContentScriptService {
  hide(): Promise<void>;
  remove(): Promise<void>;
  checkStatus(): Promise<boolean>;
  toggle(config?: IToggleConfig): Promise<void>;
  runScript(id: string, lifeCycle: 'run' | 'destroy'): Promise<void>;
  getSelectionMarkdown(): Promise<string>;
  getPageUrl(): Promise<string>;
  /** 滚动页面到指定位置 */
  scrollPage(x: number, y: number): Promise<void>;
}

export const IContentScriptService = new Token<IContentScriptService>('IContentScriptService');
