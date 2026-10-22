/**
 * [INPUT]: 依赖主站传入的集合配置与 layout JSON 值。
 * [OUTPUT]: 提供集合白名单规范化与空画布判断。
 * [POS]: 原生 Page 与画布的共享边界，不读取存储。
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */

/** 与 EmDash 集合标识符保持一致；插件内部集合不接入宿主字段。 */
export function canvasCollectionSlugs(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  const collections: string[] = [];
  for (const value of input) {
    if (typeof value !== "string") continue;
    const slug = value.trim();
    if (
      slug.length > 63 ||
      !/^[a-z][a-z0-9_]*$/.test(slug) ||
      slug.startsWith("emvb_") ||
      slug.startsWith("system_") ||
      collections.includes(slug)
    )
      continue;
    collections.push(slug);
  }
  return collections;
}

/** 空 JSON 字段保留原正文；无效的非空 JSON 仍须进入布局校验。 */
export function hasCanvasLayout(raw: unknown): boolean {
  if (raw === null || raw === undefined) return false;
  if (typeof raw !== "string") return true;
  const value = raw.trim();
  return value !== "" && value !== "null";
}
