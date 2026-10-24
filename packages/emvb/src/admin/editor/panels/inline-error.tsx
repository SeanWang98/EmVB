/**
 * [INPUT]: 依赖警告图标、延迟消息格式器与本地化上下文。
 * [OUTPUT]: 导出字段错误提示。
 * [POS]: 共享字段错误展示边界，保留未知错误原文。
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import { useI18n } from "../../i18n/index.ts";
import { WarningCircleIcon } from "@phosphor-icons/react";
import { formatMessage, type LocalizedMessage } from "../localized-message.ts";

/** A one-line alert under a field. */
export function InlineError({ children }: { children: LocalizedMessage }) {
  const t = useI18n();
  return (
    <p className="emvb-inline-error" role="alert">
      <WarningCircleIcon size={16} aria-hidden="true" />
      {formatMessage(children, t)}
    </p>
  );
}
