/**
 * [INPUT]: 依赖布局字段与设置面板的调用参数。
 * [OUTPUT]: 解析数值输入；保留 CSS 单位语义。
 * [POS]: 元素设置面板的 number-input 边界。
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
/**
 * W-436: a typed number for a settings field, or NaN. "16px" in a "(px)" field is read as 16, as
 * the label invites; "0x10", "1e3" and "Infinity", which Number() read, are not numbers here.
 */
export function fieldNumber(text: string, unit?: string): number {
  let trimmed = text.trim();
  if (unit && trimmed.toLowerCase().endsWith(unit.toLowerCase())) {
    trimmed = trimmed.slice(0, -unit.length).trimEnd();
  }
  return /^-?(?:\d+(?:\.\d*)?|\.\d+)$/.test(trimmed) ? Number(trimmed) : Number.NaN;
}
