/**
 * [INPUT]: 依赖后台翻译函数与失败时保留的源文案。
 * [OUTPUT]: 提供延迟翻译的字段错误值及显示函数。
 * [POS]: 设置字段的错误边界；切换语言不重提交流程。
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import type { Translate } from "../../../i18n/index.ts";

/** 静态值保留源文案；动态值保留失败时的参数快照。 */
export type LocalizedError = string | { format: (t: Translate) => string };

/** 静态源文案进入词典；API 原文由调用方封存为 formatter。 */
export function formatError(error: LocalizedError | null, t: Translate): string | null {
  return error === null ? null : typeof error === "string" ? t(error) : error.format(t);
}
