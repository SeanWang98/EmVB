/**
 * [INPUT]: 依赖后台语言订阅与纯翻译函数。
 * [OUTPUT]: 提供延迟翻译消息、结构化异常与响应语言的显示组件。
 * [POS]: 编辑器提示边界；状态保留源模板，API 原文不进入词典。
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import { createTranslator, useI18n, type Translate } from "../i18n/index.ts";

/** 静态提示保存英文源文；参数提示在失败时捕获参数快照。 */
export type LocalizedMessage = string | { format: (t: Translate) => string };

/** 未知 API 错误属于原文，即使恰好等于界面词条也不翻译。 */
export function literalMessage(text: string): LocalizedMessage {
  return { format: () => text };
}

export function formatMessage(message: LocalizedMessage, t: Translate): string {
  return typeof message === "string" ? t(message) : message.format(t);
}

/** Toast 由独立 Portal 持有；此组件自行订阅后台语言。 */
export function LocalizedMessageText({ message }: { message: LocalizedMessage }) {
  return formatMessage(message, useI18n());
}

/** 异常保留源消息；英文 message 兼容日志与既有调用方。 */
export class LocalizedMessageError extends Error {
  readonly localizedMessage: LocalizedMessage;

  constructor(message: LocalizedMessage, options?: ErrorOptions) {
    super(formatMessage(message, createTranslator("en")), options);
    this.localizedMessage = message;
  }
}

/** 命令异常恢复源消息；未知异常文本保持原样。 */
export function errorMessage(error: unknown, fallback: LocalizedMessage): LocalizedMessage {
  if (error instanceof LocalizedMessageError) return error.localizedMessage;
  return error instanceof Error ? literalMessage(error.message) : fallback;
}
