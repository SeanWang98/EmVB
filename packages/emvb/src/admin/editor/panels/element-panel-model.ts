/**
 * [INPUT]: 依赖 core 布局树、样式规则与界面偏好。
 * [OUTPUT]: 提供字段可见性、分组、面包屑与折叠偏好。
 * [POS]: 元素面板模型；只记录界面偏好，不写页面内容。
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import {
  classStylesInListOrder,
  isFormNode,
  resolveCascade,
  STYLE_STATES,
  type DesignSystem,
  type Layout,
  type LayoutNode,
  type PopupDevice,
  type StyleProps,
  type StyleStates,
} from "../../../core/index.ts";
import { indexLayout } from "../../../core/tree-ops.ts";
import { ELEMENT_NAMES } from "../element-chrome.ts";
import type { StyleStateChoice } from "./settings/StateSwitcher.tsx";
import {
  keysFor,
  SECTION_LABELS,
  type StyleKey,
  type StyleSectionId,
} from "./settings/style-sections.ts";

export const enclosingFormId = (layout: Layout, nodeId: string): string | undefined => {
  const index = indexLayout(layout);
  let current = index.parentOf.get(nodeId);
  while (current) {
    const node = index.byId.get(current);
    if (node && isFormNode(node)) return node.props.formId || undefined;
    current = index.parentOf.get(current);
  }
  return undefined;
};

export const GRID_ITEM_KEYS = new Set<string>([
  "gridColumnSpan",
  "gridColumnStart",
  "gridRowSpan",
  "gridRowStart",
]);

/** Whether the node sits directly in a box that lays its children out on a grid. */
export const inGridParent = (layout: Layout | null | undefined, nodeId: string): boolean => {
  if (!layout) return true;
  const index = indexLayout(layout);
  const parentId = index.parentOf.get(nodeId);
  const parent = parentId ? index.byId.get(parentId) : undefined;
  return parent?.type === "grid" || parent?.type === "loop";
};

const sectionKey = (type: string) => `emvb-style-sections:${type}`;

/**
 * Open the first time an element type is selected, where it has them (W-137): the sections most
 * edits need. After that the open and closed sections are remembered per type, across visits.
 */
export const OPEN_FIRST: StyleSectionId[] = ["typography", "spacing", "background", "border"];

export const readSections = (type: string, fallback: StyleSectionId[]): Set<StyleSectionId> => {
  try {
    const raw = localStorage.getItem(sectionKey(type));
    if (!raw) return new Set(fallback);
    const parsed = JSON.parse(raw) as string[];
    return new Set(parsed.filter((id): id is StyleSectionId => id in SECTION_LABELS));
  } catch {
    return new Set(fallback);
  }
};

export const writeSections = (type: string, open: Set<StyleSectionId>) => {
  try {
    localStorage.setItem(sectionKey(type), JSON.stringify([...open]));
  } catch {
    /* private mode */
  }
};

export const countSet = (type: string, style: StyleProps | undefined, section: StyleSectionId) =>
  keysFor(type, section, style).filter((key) => style?.[key] !== undefined).length;

/** Whether any state sets a key of this section (the section header's dot in Normal). */
export const sectionHasStates = (
  type: string,
  states: StyleStates | undefined,
  section: StyleSectionId,
) => STYLE_STATES.some((state) => countSet(type, states?.[state], section) > 0);

/** Sections where a state change moves things around (DESIGN.md § State styles). */
export const JUMPY = new Set<StyleSectionId>(["layout", "size", "position"]);

/** Set on Normal only (W-089, W-101, W-237); a state's Style tab leaves them out. */
export const NORMAL_ONLY_KEYS = new Set<StyleKey>([
  "transition",
  "entrance",
  "iconAnimation",
  "scrollMotion",
]);

export const JUMP_HELP: Record<Exclude<StyleStateChoice, "normal">, string> = {
  hover: "Changing size or position on hover can make the page jump.",
  focus: "Changing size or position on focus can make the page jump.",
  active: "Changing size or position while active can make the page jump.",
};

/** The position in effect: the class's own when editing a class, else classes then local. */
export const positionInEffect = (
  node: LayoutNode,
  design: DesignSystem,
  cls: { style?: StyleProps } | undefined,
) =>
  cls
    ? cls.style?.position
    : resolveCascade(classStylesInListOrder(design.classes, node.classes ?? []), node.style)
        .position;

/** What an item's content is, since it has no content field of its own (W-130). */
export const ITEM_NOTES: Record<string, string> = {
  "accordion-item":
    "The item's content is the elements in its body. Select this item, then add elements, or drag them into its body on the canvas.",
  "tab-panel":
    "The tab's content is the elements in its panel. Select this tab, then add elements, or drag them into its panel on the canvas.",
  menu: "Add Menu items. An item that holds other elements opens a dropdown. Wide panel stretches that dropdown across the menu.",
  "menu-item":
    "The label is the link. Elements inside this item are its dropdown. Wide panel stretches the dropdown across the menu.",
};

export const FORM_TYPES = new Set([
  "form",
  "text-input",
  "textarea",
  "select",
  "checkbox",
  "radio",
  "submit",
]);

export const SPACER_HEIGHT = {
  key: "height",
  kind: "number",
  label: "Height",
  message: "Height can't be negative. Enter 0 or more.",
} as const;

/**
 * UX-028: settings that only matter once another is set stay out of the way
 * until then. A value already stored always shows, so nothing set is ever hidden.
 */
const DEPENDS_ON: Readonly<Record<string, string>> = {
  iconPosition: "iconId",
  iconSize: "iconId",
  iconGap: "iconId",
  // UX-072: a new tab needs a link, typed or bound to live data (W-276 drops the target without one).
  newTab: "href",
};

/** UX-040: number pairs that read as one setting share a row (X beside Y, width beside height). */
const PAIRED: Readonly<Record<string, string>> = { focalX: "focalY", width: "height" };

export function pairFields<F extends { key: string }>(fields: readonly F[]): F[][] {
  const rows: F[][] = [];
  for (let i = 0; i < fields.length; i += 1) {
    const field = fields[i] as F;
    const next = fields[i + 1];
    if (next && PAIRED[field.key] === next.key) {
      rows.push([field, next]);
      i += 1;
    } else rows.push([field]);
  }
  return rows;
}

/** UX-071: fields that only apply to some values of another field on the same element. */
const SHOWN_WHEN: Readonly<
  Record<string, (props: Record<string, unknown>, device: PopupDevice) => boolean>
> = {
  "loop.columns": (props) => props["display"] === "grid" || props["display"] === "cards",
  "pagination.countText": (props) => props["showCount"] === true,
  // Post Link always links to its post, so its new-tab switch always applies.
  "post-link.newTab": () => true,
  // UX-075: each device's tracks show on that device, as Columns does (W-139).
  "grid.columnTracks": (_props, device) => device === "desktop",
  "grid.columnTracksTablet": (_props, device) => device === "tablet",
  "grid.columnTracksMobile": (_props, device) => device === "mobile",
};

export function fieldShown(
  key: string,
  node: LayoutNode,
  device: PopupDevice = "desktop",
): boolean {
  const props = node.props as Record<string, unknown>;
  // A stored value always shows, so it can be seen and reset.
  if (props[key] !== undefined) return true;
  const when = SHOWN_WHEN[`${node.type}.${key}`];
  if (when) return when(props, device);
  const parent = DEPENDS_ON[key];
  if (!parent) return true;
  const bound = (node as { bind?: Record<string, unknown> }).bind?.[parent] !== undefined;
  return (props[parent] !== undefined && props[parent] !== "") || bound;
}

export function breadcrumb(
  layout: Layout | null,
  id: string,
): Array<{ id: string | null; label: string }> {
  if (!layout) return [];
  const index = indexLayout(layout);
  const chain: Array<{ id: string; label: string }> = [];
  let current: string | undefined = id;
  while (current) {
    const node = index.byId.get(current);
    if (!node) break;
    chain.unshift({
      id: node.id,
      label: ELEMENT_NAMES[node.type] ?? node.type,
    });
    current = index.parentOf.get(current);
  }
  return [{ id: null, label: "Page" }, ...chain];
}
