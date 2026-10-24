/**
 * [INPUT]: 依赖主题部件 API、类型定义与界面翻译。
 * [OUTPUT]: 提供类型筛选、搜索和主题部件列表。
 * [POS]: 主题构建器列表；不改写部件名称或条件参数。
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import { useI18n } from "../i18n/index.ts";
import { Empty, Table } from "@cloudflare/kumo";
import { SquaresFourIcon } from "@phosphor-icons/react";
import * as React from "react";
import type { ThemePartType } from "../../core/index.ts";
import { THEME_PARTS_COLLECTION } from "../../constants.ts";
import type { Fetcher } from "../api.ts";
import { listThemeParts, partTypeLabel } from "../theme-api.ts";
import { editorUrl } from "../editor/exit.ts";
import { matchesSearch } from "../search.ts";
import {
  EditedTime,
  ListError,
  ListLoading,
  ListSearch,
  NewButton,
  NoMatches,
  StatusBadge,
  useList,
} from "./list-kit.tsx";
import { NewThemePartDialog } from "./NewThemePartDialog.tsx";

type Filter = "all" | ThemePartType;

const PANEL_ID = "emvb-theme-parts-panel";
const tabId = (value: Filter) => `emvb-theme-filter-${value}`;

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "header", label: "Headers" },
  { value: "footer", label: "Footers" },
  { value: "error_404", label: "Error 404" },
  { value: "search_results", label: "Search results" },
  { value: "single_page", label: "Single page" },
  { value: "single_post", label: "Single post" },
  { value: "archive", label: "Archive" },
  { value: "loop_item", label: "Loop item" },
  { value: "section", label: "Sections" },
  { value: "page_template", label: "Page templates" },
  { value: "popup", label: "Popups" },
  { value: "float", label: "Floats" },
];

function countByType(items: readonly { partType: ThemePartType }[]): Map<Filter, number> {
  const counts = new Map<Filter, number>([["all", items.length]]);
  for (const { partType } of items) counts.set(partType, (counts.get(partType) ?? 0) + 1);
  return counts;
}

/** Underline tabs with roving focus: arrows, Home and End move and select. */
function FilterTabs({
  filter,
  counts,
  onChange,
}: {
  filter: Filter;
  counts: Map<Filter, number>;
  onChange: (next: Filter) => void;
}) {
  const t = useI18n();
  const refs = React.useRef(new Map<Filter, HTMLButtonElement>());

  const onKeyDown = (event: React.KeyboardEvent) => {
    // W-680: Alt+Left is the browser's Back; Ctrl/Cmd keys are shortcuts.
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const at = FILTERS.findIndex((f) => f.value === filter);
    const last = FILTERS.length - 1;
    const to =
      event.key === "ArrowRight"
        ? (at + 1) % FILTERS.length
        : event.key === "ArrowLeft"
          ? (at - 1 + FILTERS.length) % FILTERS.length
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? last
              : -1;
    const next = FILTERS[to]?.value;
    if (next === undefined) return;
    event.preventDefault();
    onChange(next);
    refs.current.get(next)?.focus();
  };

  const rowRef = useEdgeHints<HTMLDivElement>();
  return (
    <div
      ref={rowRef}
      className="emvb-theme-filters"
      role="tablist"
      aria-label={t("Filter by type")}
      onKeyDown={onKeyDown}
    >
      {FILTERS.map(({ value, label }) => {
        const count = counts.get(value) ?? 0;
        const selected = filter === value;
        return (
          <button
            key={value}
            ref={(node) => {
              if (node) refs.current.set(value, node);
              else refs.current.delete(value);
            }}
            id={tabId(value)}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={PANEL_ID}
            tabIndex={selected ? 0 : -1}
            className="emvb-theme-filter"
            data-active={selected ? "true" : undefined}
            onClick={() => onChange(value)}
          >
            {t(label)}
            {count > 0 && <span className="emvb-theme-filter-count emvb-tabular">{count}</span>}
          </button>
        );
      })}
    </div>
  );
}

/** Theme Builder list: title, type, conditions, status, last edited; New theme part. */
export function ThemePartList({ fetcher }: { fetcher: Fetcher }) {
  const t = useI18n();
  const loadParts = React.useCallback((client: Fetcher) => listThemeParts(client, t), [t]);
  const list = useList(fetcher, loadParts);
  const [creating, setCreating] = React.useState(false);
  const [filter, setFilter] = React.useState<Filter>("all");
  const [query, setQuery] = React.useState("");
  const searchRef = React.useRef<HTMLInputElement>(null);

  const newPart = <NewButton label={t("New theme part")} onClick={() => setCreating(true)} />;

  const visible =
    list.state === "ready"
      ? filter === "all"
        ? list.items
        : list.items.filter((p) => p.partType === filter)
      : [];
  const shown = visible.filter((p) =>
    matchesSearch(
      query,
      p.title,
      partTypeLabel(p.partType),
      t(partTypeLabel(p.partType)),
      p.conditionsSummary,
      p.conditionsSearch ?? "",
    ),
  );

  const emptyFilterLabel =
    filter === "all"
      ? t("theme parts")
      : t(FILTERS.find((f) => f.value === filter)?.label ?? "theme parts").toLowerCase();

  return (
    <>
      <div className="emvb-list-header">
        <h1 className="emvb-page-title">{t("Theme Builder")}</h1>
        {list.state === "ready" && list.items.length > 0 && newPart}
      </div>
      {list.state === "ready" && list.items.length > 0 && (
        <>
          <FilterTabs filter={filter} counts={countByType(list.items)} onChange={setFilter} />
          <ListSearch
            value={query}
            onChange={setQuery}
            label={t("Search theme parts")}
            inputRef={searchRef}
          />
        </>
      )}
      {list.state === "loading" && <ListLoading label={t("Loading theme parts…")} />}
      {list.state === "error" && (
        <ListError
          title={t("Couldn't load theme parts")}
          message={list.message}
          onRetry={list.retry}
        />
      )}
      {list.state === "ready" && list.items.length === 0 && (
        <div className="emvb-surface-card emvb-empty-shell">
          <Empty
            icon={<SquaresFourIcon size={32} aria-hidden="true" />}
            title={t("No site parts yet")}
            description={t("Create a Header, Footer, content template, Popup, or Float.")}
            contents={newPart}
          />
        </div>
      )}
      {list.state === "ready" && list.items.length > 0 && (
        <div role="tabpanel" id={PANEL_ID} aria-labelledby={tabId(filter)}>
          {visible.length === 0 ? (
            <div className="emvb-surface-card emvb-empty-shell">
              <Empty
                icon={<SquaresFourIcon size={32} aria-hidden="true" />}
                title={t("No {type} yet", { type: emptyFilterLabel })}
                description={t("Create one or choose a different filter.")}
                contents={newPart}
              />
            </div>
          ) : shown.length === 0 ? (
            <NoMatches
              query={query}
              onClear={() => {
                setQuery("");
                searchRef.current?.focus();
              }}
            />
          ) : (
            <div className="emvb-surface-card" data-emvb-list="theme-parts">
              <Table data-emvb-list="theme-parts">
                <Table.Header>
                  <Table.Row>
                    <Table.Head>{t("Title")}</Table.Head>
                    <Table.Head>{t("Type")}</Table.Head>
                    <Table.Head>{t("Conditions")}</Table.Head>
                    <Table.Head>{t("Status")}</Table.Head>
                    <Table.Head>{t("Last edited")}</Table.Head>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {shown.map((part) => (
                    <Table.Row key={part.id} data-emvb-row={part.id}>
                      <Table.Cell>
                        <a
                          className="emvb-row-title"
                          href={editorUrl(part.id, THEME_PARTS_COLLECTION)}
                        >
                          {part.title}
                        </a>
                      </Table.Cell>
                      <Table.Cell>{t(partTypeLabel(part.partType))}</Table.Cell>
                      <Table.Cell>
                        <span className="emvb-tabular">{part.conditionsSummary}</span>
                      </Table.Cell>
                      <Table.Cell>
                        <StatusBadge status={part.status} />
                      </Table.Cell>
                      <Table.Cell>
                        <EditedTime iso={part.updatedAt} />
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table>
            </div>
          )}
        </div>
      )}
      <NewThemePartDialog
        fetcher={fetcher}
        open={creating}
        onOpenChange={setCreating}
        defaultType={filter === "all" ? undefined : filter}
      />
    </>
  );
}

/**
 * W-863: marks which edges of a scrolling row hide more tabs (data-more-start / data-more-end),
 * so browsers without scroll-driven animations still get the UX-038 edge fade.
 */
export function useEdgeHints<T extends HTMLElement>() {
  const ref = React.useRef<T>(null);
  React.useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const update = () => {
      const max = node.scrollWidth - node.clientWidth;
      node.toggleAttribute("data-more-start", max > 1 && node.scrollLeft > 1);
      node.toggleAttribute("data-more-end", max > 1 && node.scrollLeft < max - 1);
    };
    update();
    node.addEventListener("scroll", update, { passive: true });
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(update);
    observer?.observe(node);
    return () => {
      node.removeEventListener("scroll", update);
      observer?.disconnect();
    };
  }, []);
  return ref;
}
