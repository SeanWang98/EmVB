/**
 * [INPUT]: 依赖布局字段与设置面板的调用参数。
 * [OUTPUT]: 读写节点属性；不改写其他节点字段。
 * [POS]: 元素设置面板的 node-props 边界。
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import type { LayoutNode } from "../../../../core/index.ts";

export const propsOf = (node: LayoutNode): Record<string, unknown> =>
  node.props as Record<string, unknown>;

export const withProp = (node: LayoutNode, key: string, value: unknown): LayoutNode => {
  const props = { ...propsOf(node) };
  if (value === undefined) delete props[key];
  else props[key] = value;
  return { ...node, props } as LayoutNode;
};
