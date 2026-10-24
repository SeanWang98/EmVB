/**
 * [INPUT]: 依赖布局字段与设置面板的调用参数。
 * [OUTPUT]: 统计同一表单内的字段名冲突。
 * [POS]: 元素设置面板的 form-names 边界。
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import { isFormNode, type Layout, type LayoutNode } from "../../../../core/index.ts";
import { indexLayout } from "../../../../core/tree-ops.ts";

const fieldOf = (node: LayoutNode): string => {
  const value = (node.props as Record<string, unknown> | undefined)?.field;
  return typeof value === "string" ? value.trim() : "";
};

/**
 * W-194: true when another control in the same form submits under this node's field name, so
 * one value would overwrite the other. Controls outside any form are not checked.
 */
export function duplicateFieldName(layout: Layout, nodeId: string): boolean {
  const index = indexLayout(layout);
  const self = index.byId.get(nodeId);
  const name = self ? fieldOf(self) : "";
  if (!name) return false;
  let current = index.parentOf.get(nodeId);
  while (current) {
    const form = index.byId.get(current);
    if (form && isFormNode(form)) {
      let count = 0;
      const walk = (node: LayoutNode) => {
        if (node.id !== form.id && fieldOf(node) === name) count += 1;
        if ("children" in node && Array.isArray(node.children))
          for (const child of node.children) walk(child);
      };
      walk(form);
      return count > 1;
    }
    current = index.parentOf.get(current);
  }
  return false;
}
