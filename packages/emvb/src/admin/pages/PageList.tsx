/**
 * [INPUT]: 依赖页面摘要 API、列表组件与界面翻译。
 * [OUTPUT]: 提供可搜索的独立画布页面列表。
 * [POS]: 独立页面入口；只翻译界面，保留标题和路径名。
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import { useI18n } from "../i18n/index.ts";
import { Empty, Table } from "@cloudflare/kumo";
import { FileIcon } from "@phosphor-icons/react";
import * as React from "react";
import type { Fetcher } from "../api.ts";
import { listPages } from "../content-api.ts";
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
import { NewPageDialog } from "./NewPageDialog.tsx";

/** The Visual pages list (IA): title and slug, status, last edited; New page. */
export function PageList({ fetcher }: { fetcher: Fetcher }) {
  const t = useI18n();
  const list = useList(fetcher, listPages);
  const [creating, setCreating] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const searchRef = React.useRef<HTMLInputElement>(null);
  const shown =
    list.state === "ready"
      ? list.items.filter((page) => matchesSearch(query, page.title, `/${page.slug}`))
      : [];

  const newPage = <NewButton label={t("New page")} onClick={() => setCreating(true)} />;

  return (
    <>
      <div className="emvb-list-header">
        <h1 className="emvb-page-title">{t("Pages VisualBuilder")}</h1>
        {list.state === "ready" && list.items.length > 0 && newPage}
      </div>
      {list.state === "loading" && <ListLoading label={t("Loading pages…")} />}
      {list.state === "error" && (
        <ListError
          title={t("Couldn't load your pages")}
          message={list.message}
          onRetry={list.retry}
        />
      )}
      {list.state === "ready" && list.items.length === 0 && (
        <div className="emvb-surface-card emvb-empty-shell">
          <Empty
            icon={<FileIcon size={32} aria-hidden="true" />}
            title={t("No visual pages yet")}
            description={t("Create a page to start building.")}
            contents={newPage}
          />
        </div>
      )}
      {list.state === "ready" && list.items.length > 0 && (
        <ListSearch
          value={query}
          onChange={setQuery}
          label={t("Search pages")}
          inputRef={searchRef}
        />
      )}
      {list.state === "ready" && list.items.length > 0 && shown.length === 0 && (
        <NoMatches
          query={query}
          onClear={() => {
            setQuery("");
            searchRef.current?.focus();
          }}
        />
      )}
      {list.state === "ready" && shown.length > 0 && (
        <div className="emvb-surface-card" data-emvb-list="pages">
          <Table data-emvb-list="pages">
            <Table.Header>
              <Table.Row>
                <Table.Head>{t("Title")}</Table.Head>
                <Table.Head>{t("Status")}</Table.Head>
                <Table.Head>{t("Last edited")}</Table.Head>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {shown.map((page) => (
                <Table.Row key={page.id} data-emvb-row={page.id}>
                  <Table.Cell>
                    <a className="emvb-row-title" href={editorUrl(page.id)}>
                      {page.title}
                    </a>
                    <div className="emvb-row-slug">/{page.slug}</div>
                  </Table.Cell>
                  <Table.Cell>
                    <StatusBadge status={page.status} />
                  </Table.Cell>
                  <Table.Cell>
                    <EditedTime iso={page.updatedAt} />
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </div>
      )}
      <NewPageDialog fetcher={fetcher} open={creating} onOpenChange={setCreating} />
    </>
  );
}
