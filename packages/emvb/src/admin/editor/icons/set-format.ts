/**
 * [INPUT]: 依赖固定图标构建脚本输出的 JSON 结构。
 * [OUTPUT]: 提供IconSetStyle、IconEntry 与 IconSetFile 类型。
 * [POS]: 构建脚本与编辑器懒加载共享的数据协议。
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
/**
 * The Icon library set files (W-234): one JSON per set in ./sets, built by
 * `scripts/build-icon-sets.ts` from the pinned icon packages and loaded lazily by the editor.
 */
export type IconSetStyle = {
  /** Sidebar sub-item id inside the set ("solid", "outline"…). */
  id: string;
  label: string;
  /** The stored icon id is `${prefix}:${name}` ("fa-solid:rocket", "lucide:rocket"). */
  prefix: string;
  /** viewBox used when an icon doesn't carry its own. */
  viewBox: string;
  /** Root `<svg>` presentation attributes (stroke or fill style). */
  attrs: Record<string, string>;
};

/** `[name, style index, label, inner SVG markup, search tags, viewBox?]` */
export type IconEntry =
  | [string, number, string, string, string]
  | [string, number, string, string, string, string];

export type IconSetFile = {
  id: string;
  label: string;
  version: string;
  license: string;
  styles: IconSetStyle[];
  icons: IconEntry[];
};
