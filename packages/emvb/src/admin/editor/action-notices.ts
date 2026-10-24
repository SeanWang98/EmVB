/**
 * [INPUT]: 依赖核心剪贴板计数、样式类合并结果与后台语言。
 * [OUTPUT]: 提供丢弃内容及样式类合并的本地化通知。
 * [POS]: 核心结构到界面文案的适配；不解析或改写用户名称。
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import {
  classMergeNotice,
  droppedNotice,
  type ClassMerge,
  type Dropped,
} from "../../core/index.ts";
import { translate } from "../i18n/index.ts";

export function localizedDroppedNotice(dropped: Dropped): string | null {
  if (translate.locale !== "zh-CN") return droppedNotice(dropped);
  const parts: string[] = [];
  const count = (value: number, message: string) => {
    if (value > 0) parts.push(translate(message, { count: value }));
  };
  count(dropped.classes, "{count} classes");
  count(dropped.variables, "{count} variables");
  count(dropped.htmlIds, "{count} CSS ids already used on this page");
  count(dropped.unsafe, "{count} disallowed links, images or SVGs");
  count(dropped.images ?? 0, "{count} external images");
  if (!parts.length) return null;
  const message = translate("Left out {items}.", { items: parts.join("、") });
  return dropped.classes + dropped.variables > 0
    ? message + translate("Classes and variables this site doesn't have were removed.")
    : message;
}

export function localizedClassMergeNotice(merge: ClassMerge): string | null {
  if (translate.locale !== "zh-CN") return classMergeNotice(merge);
  const parts: string[] = [];
  if (merge.added.length > 0) parts.push(translate("{count} added", { count: merge.added.length }));
  if (merge.renamed.length > 0) {
    const names = merge.renamed.map(({ from, to }) => `${from} → ${to}`).join("、");
    parts.push(
      translate("{count} added as a copy ({names})", { count: merge.renamed.length, names }),
    );
  }
  return parts.length ? translate("Classes: {items}.", { items: parts.join("；") }) : null;
}
