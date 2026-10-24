/**
 * [INPUT]: 依赖画布文档与核心样式状态标识。
 * [OUTPUT]: 提供applyStatePreview 与 StatePreview 类型。
 * [POS]: 编辑态样式预览，只改文档临时属性。
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import type { StyleStateName } from "../../../core/index.ts";

export type StatePreview = { id: string; state: StyleStateName };

/**
 * Shows a style state on the selected canvas element (W-089): the editor-only
 * `data-emvb-state` attribute matches the canvas CSS's state rules, so no pointer or script is needed.
 */
export function applyStatePreview(doc: Document, preview: StatePreview | null): void {
  for (const element of doc.querySelectorAll("[data-emvb-state]")) {
    if (element.getAttribute("data-emvb-id") !== preview?.id) {
      element.removeAttribute("data-emvb-state");
    }
  }
  if (!preview) return;
  doc
    .querySelector(`[data-emvb-id="${CSS.escape(preview.id)}"]`)
    ?.setAttribute("data-emvb-state", preview.state);
}
