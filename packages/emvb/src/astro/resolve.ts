/**
 * [INPUT]: 依赖主站选定集合、EmDash 内容与请求级渲染数据。
 * [OUTPUT]: 解析单条 Page 的画布、SEO 原始条目与集合身份。
 * [POS]: 服务端页面桥接；空宿主画布回退到主站原正文。
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import { PAGES_COLLECTION } from "../constants.ts";
import { canvasCollectionSlugs, hasCanvasLayout } from "../core/host-fields.ts";
import { emdashContent, type ContentPort } from "./content-port.ts";
import { formIdsInLayouts } from "./forms-definitions.ts";
import { readLayout, renderStored, type RenderedPage } from "./render.ts";
import { designFor, formsFor } from "./render-session.ts";
import { bindingDataFor } from "./request-data.ts";
import type { HostVisitor, VisitorAstro } from "./visitor.ts";
import { referencedTemplatesFor } from "./resolve-theme.ts";

type EmDashEntry = NonNullable<Awaited<ReturnType<ContentPort["getEntry"]>>["entry"]>;

export type ResolvedEmVBPage = RenderedPage & {
  /** The EmDash entry, for `getSeoMeta` and the host's layout. */
  entry: EmDashEntry;
  /** The collection selected by the host route, including for preview/edit context. */
  collection: string;
  title: string;
  canvasMode: "site-layout" | "blank";
  /** A valid `_preview` token is serving the draft: don't cache the response. */
  isPreview: boolean;
};

type AstroLike = VisitorAstro & {
  params: Record<string, string | undefined>;
  url: URL;
  locals: unknown;
};

/**
 * Looks up the published EmVB page for this request's slug (or its draft under a preview token),
 * so a host route can try EmVB first and fall through to its own content (R-030, R-052).
 * A fixed route such as `/` passes the page's slug explicitly: `{ slug: "home" }`.
 */
export async function resolveEmVBPage(
  astro: AstroLike,
  options: {
    /** The route parameter that holds the URL-encoded slug (default `"slug"`). */
    param?: string;
    /** The page's slug, used as-is (not URL-decoded) in place of the route parameter. */
    slug?: string;
    /** Existing collection with a `layout` JSON field; defaults to EmVB's own pages. */
    collection?: string;
    /** What the host knows about the visitor: segments and facts Visitors rules use (W-329). */
    visitor?: HostVisitor;
    /** The page's language, e.g. "fr-CA", for Post Dates; defaults to Astro's locale (W-688). */
    lang?: string;
  } = {},
): Promise<ResolvedEmVBPage | null> {
  return resolveEmVBPageWith(emdashContent, astro, options);
}

/** Same as `resolveEmVBPage`, with a content port so tests can pass a fake (W-359). */
export async function resolveEmVBPageWith(
  content: ContentPort,
  astro: AstroLike,
  options: {
    param?: string;
    slug?: string;
    collection?: string;
    visitor?: HostVisitor;
    /** The page's language, e.g. "fr-CA", for Post Dates; defaults to Astro's locale (W-688). */
    lang?: string;
  } = {},
): Promise<ResolvedEmVBPage | null> {
  const slug = options.slug ?? content.decodeSlug(astro.params[options.param ?? "slug"]);
  if (!slug) return null;
  const collection = options.collection ?? PAGES_COLLECTION;
  if (
    collection !== PAGES_COLLECTION &&
    !canvasCollectionSlugs([collection]).includes(collection)
  ) {
    return null;
  }
  let found: Awaited<ReturnType<ContentPort["getEntry"]>>;
  try {
    found = await content.getEntry(collection, slug);
  } catch {
    // The selected collection does not exist yet: let the host render its fallback.
    return null;
  }
  const entry = found.entry;
  if (!entry) return null;
  const data = entry.data as Record<string, unknown>;
  if (collection !== PAGES_COLLECTION && !hasCanvasLayout(data["layout"])) return null;
  const handler = content.pluginHandler(astro.locals as never);
  const design = await designFor(astro, handler, astro.url);
  const layout = readLayout(data["layout"]);
  const referenced = layout
    ? await referencedTemplatesFor(layout, content, astro)
    : { sectionTemplates: {}, loopTemplates: {} };
  const { sectionTemplates, loopTemplates } = referenced;
  const formDefinitions = layout
    ? await formsFor(
        astro,
        handler,
        astro.url,
        formIdsInLayouts([
          layout,
          ...Object.values(sectionTemplates),
          ...Object.values(loopTemplates),
        ]),
      )
    : undefined;
  const dynamic = {
    ...(Object.keys(sectionTemplates).length > 0 ? { sectionTemplates } : {}),
    ...(Object.keys(loopTemplates).length > 0 ? { loopTemplates } : {}),
    ...(await bindingDataFor(
      layout,
      astro.url,
      astro,
      // W-666: Loop Item parts too. A Visitors rule, A/B test, bound field or collection Loop in
      // one was never seen, so the visitor was never read and "only for" elements stayed hidden.
      [...Object.values(sectionTemplates), ...Object.values(loopTemplates)],
      options.visitor ? { visitor: options.visitor } : {},
      content,
    )),
  };
  return {
    ...renderStored(
      data["layout"],
      design,
      String(data["id"] ?? slug),
      formDefinitions,
      Object.keys(dynamic).length > 0 ? dynamic : undefined,
      false,
      options.lang ?? astro.currentLocale,
    ),
    entry,
    collection,
    title: typeof data["title"] === "string" ? data["title"] : "",
    canvasMode:
      collection === PAGES_COLLECTION && data["canvas_mode"] === "blank" ? "blank" : "site-layout",
    isPreview: Boolean(found.isPreview),
  };
}
