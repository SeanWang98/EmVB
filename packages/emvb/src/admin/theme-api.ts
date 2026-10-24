/**
 * [INPUT]: 依赖公开内容 API、主题条件契约与可选界面翻译。
 * [OUTPUT]: 提供部件查询、写入和结构化条件标签。
 * [POS]: 主题后台客户端；翻译系统标签，保留内容与用户参数。
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import { createTranslator, type Translate } from "./i18n/index.ts";
import {
  CONTENT_THEME_PART_TYPES,
  defaultConditionsFor,
  defaultFloatSettings,
  defaultTriggers,
  parseThemePartType,
  starterLayout,
  THEME_PART_TYPE_LABELS,
  validateLayout,
  type ConditionsDoc,
  type FloatSettings,
  type Layout,
  type ThemePartType,
  type TriggersDoc,
} from "../core/index.ts";
import { THEME_PARTS_COLLECTION } from "../constants.ts";
import { listAllItems, requestJson, type Fetcher } from "./api.ts";
import { titleOf, type ContentItem } from "./content-item.ts";
import { publishEntry } from "./content-api.ts";
import { entryStatus } from "./entry-status.ts";

const CONTENT = `/_emdash/api/content/${THEME_PARTS_COLLECTION}`;

export type ThemePartSummary = {
  id: string;
  title: string;
  partType: ThemePartType;
  status: string;
  updatedAt: string;
  conditionsSummary: string;
  /** 英文条件检索别名；只含系统标签及原始参数。 */
  conditionsSearch?: string;
};

export type ThemePartDraft = {
  title: string;
  slug: string;
  partType: ThemePartType;
  conditions: ConditionsDoc;
  triggers: TriggersDoc;
  float: FloatSettings;
  layout: Layout | null;
};

function partTypeOf(item: ContentItem): ThemePartType {
  return parseThemePartType(item.data?.["part_type"]) ?? "header";
}

export function partTypeLabel(type: ThemePartType): string {
  return THEME_PART_TYPE_LABELS[type];
}

type RuleArgs = Record<string, unknown> | undefined;

const arg = (args: RuleArgs, key: string) => String(args?.[key] ?? "?");

/**
 * The names the conditions editor uses for EmDash's built-in collections and taxonomies, so the
 * list reads "Visual pages", not "emvb_pages" (W-294). Others show their slug.
 */
const COLLECTION_NAMES: Record<string, string> = {
  pages: "Pages",
  posts: "Posts",
  emvb_pages: "Visual pages",
};
const TAXONOMY_NAMES: Record<string, { one: string; all: string }> = {
  category: { one: "Category", all: "All categories" },
  tag: { one: "Tag", all: "All tags" },
};

const collectionName = (args: RuleArgs, t: Translate) => {
  const slug = arg(args, "collection");
  return Object.hasOwn(COLLECTION_NAMES, slug) ? t(COLLECTION_NAMES[slug] as string) : slug;
};

function taxonomyLabel(args: RuleArgs, t: Translate): string {
  const slug = arg(args, "taxonomy");
  const names = Object.hasOwn(TAXONOMY_NAMES, slug) ? TAXONOMY_NAMES[slug] : undefined;
  if (args?.["slug"])
    return t("{taxonomy}: {slug}", {
      taxonomy: names ? t(names.one) : slug,
      slug: String(args["slug"]),
    });
  return names ? t(names.all) : t("All {taxonomy}", { taxonomy: slug });
}

/** 内置条件标签接受翻译函数，用户集合与分类路径名保持原值。 */
const RULE_LABELS: Record<string, (args: RuleArgs, t: Translate) => string> = {
  "general/entire_site": (_args, t) => t("Entire site"),
  "singular/front": (_args, t) => t("Front page"),
  "singular/not_found": (_args, t) => t("404 page"),
  "singular/collection": (args, t) =>
    t("{collection} (all)", { collection: collectionName(args, t) }),
  "singular/entry": (args, t) =>
    t("One entry in {collection}", { collection: collectionName(args, t) }),
  "singular/all": (_args, t) => t("All singular"),
  "archive/collection": (args, t) =>
    t("{collection} archive", { collection: collectionName(args, t) }),
  "archive/search": (_args, t) => t("Search results"),
  "archive/taxonomy": taxonomyLabel,
  "archive/all": (_args, t) => t("All archives"),
};

const english = createTranslator("en");

/** A rule's short label, e.g. "Tag: news" (also the Display conditions menu, W-694). */
export function conditionRuleLabel(r: unknown, t: Translate = english): string {
  const rule = r as { group?: string; name?: string; args?: RuleArgs };
  const key = `${rule.group ?? "?"}/${rule.name ?? "?"}`;
  const label = Object.hasOwn(RULE_LABELS, key) ? RULE_LABELS[key] : undefined;
  return label ? label(rule.args, t) : key;
}

export function summarizeConditions(raw: unknown, t: Translate = english): string {
  let value = raw;
  if (typeof raw === "string") {
    try {
      value = JSON.parse(raw) as unknown;
    } catch {
      return t("Invalid conditions");
    }
  }
  const rules = (value as { rules?: unknown } | null)?.rules;
  if (!Array.isArray(rules) || rules.length === 0) return t("No conditions");
  const includes = rules.filter((r) => (r as { op?: string }).op === "include");
  const excludes = rules.filter((r) => (r as { op?: string }).op === "exclude");
  const parts: string[] = [];
  if (includes.length) parts.push(includes.map((rule) => conditionRuleLabel(rule, t)).join(" · "));
  if (excludes.length)
    parts.push(
      t("Exclude: {conditions}", {
        conditions: excludes.map((rule) => conditionRuleLabel(rule, t)).join(" · "),
      }),
    );
  return parts.join(" · ") || t("No conditions");
}

const ITEM_PART_USE_SHORT: Partial<Record<ThemePartType, string>> = {
  loop_item: "Used by Loops",
  section: "Used by Theme sections",
  page_template: "Offered in New page",
};

export async function listThemeParts(
  fetcher: Fetcher,
  t: Translate = english,
): Promise<ThemePartSummary[]> {
  const items = await listAllItems<ContentItem>(fetcher, CONTENT);
  return items.map((item) => {
    const partType = partTypeOf(item);
    const usage = ITEM_PART_USE_SHORT[partType];
    const summary: ThemePartSummary = {
      id: item.id,
      title: titleOf(item, "Untitled theme part"),
      partType,
      status: entryStatus(item),
      updatedAt: item.updatedAt ?? "",
      // UX-061: reusable parts explain their use instead of matching a page location.
      conditionsSummary: usage ? t(usage) : summarizeConditions(item.data?.["conditions"], t),
    };
    if (t !== english)
      summary.conditionsSearch = usage ?? summarizeConditions(item.data?.["conditions"]);
    return summary;
  });
}

/** Parts that are the page's main content (or become a page) keep the page's H1. */
const OWNS_PAGE_HEADING: ReadonlySet<ThemePartType> = new Set([
  ...CONTENT_THEME_PART_TYPES,
  "page_template",
]);

/**
 * A float, header, footer, popup, section or loop item shows on pages that have their own H1, so
 * its starter heading is an H2: no second H1 and no skipped level (W-179).
 */
function starterPartLayout(title: string, partType: ThemePartType): Layout {
  const layout = starterLayout(title);
  if (OWNS_PAGE_HEADING.has(partType)) return layout;
  for (const child of layout.root.children) if (child.type === "heading") child.props.level = 2;
  return layout;
}

export async function createThemePart(
  fetcher: Fetcher,
  input: { title: string; slug: string; partType: ThemePartType; layout?: Layout },
): Promise<string> {
  const body = await requestJson<{ item: ContentItem }>(fetcher, CONTENT, {
    method: "POST",
    body: {
      data: {
        title: input.title,
        // W-876: a synced section starts from the element it was made from.
        layout: input.layout ?? starterPartLayout(input.title, input.partType),
        part_type: input.partType,
        conditions: defaultConditionsFor(input.partType),
        triggers: defaultTriggers(),
        float: defaultFloatSettings(),
      },
      slug: input.slug,
    },
  });
  return body.item.id;
}

export async function saveThemePart(
  fetcher: Fetcher,
  id: string,
  draft: ThemePartDraft,
  rev: string | null,
): Promise<string> {
  const body = await requestJson<{ _rev: string }>(
    fetcher,
    `${CONTENT}/${encodeURIComponent(id)}`,
    {
      method: "PUT",
      body: {
        data: {
          title: draft.title,
          // UX-094: a part with no layout yet leaves the field alone; the server refuses null.
          ...(draft.layout ? { layout: draft.layout } : {}),
          part_type: draft.partType,
          conditions: draft.conditions,
          triggers: draft.triggers,
          float: draft.float,
        },
        slug: draft.slug,
        ...(rev ? { _rev: rev } : {}),
      },
    },
  );
  return body["_rev"];
}

export const publishThemePart = (fetcher: Fetcher, id: string, rev: string | null) =>
  publishEntry(fetcher, CONTENT, id, rev);

/** The part's layout when it is the expected type. Null when missing or unreadable. */
export async function themePartLayout(
  fetcher: Fetcher,
  id: string,
  partType: ThemePartType,
): Promise<Layout | null> {
  try {
    const body = await requestJson<{ item?: { data?: Record<string, unknown> } }>(
      fetcher,
      `${CONTENT}/${encodeURIComponent(id)}`,
    );
    const data = body?.item?.data;
    if (!data || data["part_type"] !== partType) return null;
    const result = validateLayout(data["layout"]);
    return result.ok ? result.layout : null;
  } catch {
    return null;
  }
}
