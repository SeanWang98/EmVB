/**
 * [INPUT]: 依赖显示语言与图片、图标的上下文标签。
 * [OUTPUT]: 提供 mediaLabel。
 * [POS]: 隔离同词异义，保留原英文与持久化标识。
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import type { LocalizedTranslate } from "../i18n/index.ts";

const MEDIA_LABELS: Readonly<Record<string, string>> = {
  Recipe: "Image recipe",
  Center: "Blur center",
  Radius: "Blur radius",
  Solid: "Solid icon style",
  Regular: "Regular icon style",
  Brands: "Brands icon style",
  Outline: "Outline icon style",
  Filled: "Filled icon style",
  Line: "Line icon style",
  Fill: "Fill icon style",
};

export function mediaLabel(label: string, t: LocalizedTranslate): string {
  return t.locale === "en" ? label : t(MEDIA_LABELS[label] ?? label);
}
