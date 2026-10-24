/**
 * [INPUT]: 依赖核心图片配方摘要与 Translate 显示接口。
 * [OUTPUT]: 提供localizeImageEditSummary 与 localizedImageEditSummary。
 * [POS]: 媒体摘要的纯显示适配层，不加载图片引擎。
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import { summarizeImageEdit } from "../../core/image-edit/summary.ts";
import type { ImageEditRecipe } from "../../core/image-edit/schema.ts";
import type { Translate } from "../i18n/index.ts";

export function localizeImageEditSummary(summary: string, t: Translate): string {
  return summary
    .split(" · ")
    .map((part) => {
      const adjustment = /^(.*)( [+-]\d+)$/.exec(part);
      if (adjustment) return t(adjustment[1] ?? "") + adjustment[2];
      const more = /^\+(\d+) more$/.exec(part);
      return more ? t("+{count} more", { count: more[1] ?? "" }) : t(part);
    })
    .join(" · ");
}

export function localizedImageEditSummary(
  recipe: ImageEditRecipe,
  max: number,
  t: Translate,
): string {
  return localizeImageEditSummary(summarizeImageEdit(recipe, max), t);
}
