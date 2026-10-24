/**
 * [INPUT]: 依赖编辑权限、URL 参数与画布编辑器。
 * [OUTPUT]: 提供编辑器入口与空选择提示。
 * [POS]: 路由与画布之间的边界；保留条目标识。
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import { useI18n } from "../i18n/index.ts";
import { Empty } from "@cloudflare/kumo";
import { CursorClickIcon } from "@phosphor-icons/react";
import { PAGES_COLLECTION, THEME_PARTS_COLLECTION } from "../../constants.ts";
import { RequireEditor } from "../access/RequireEditor.tsx";
import { defaultFetcher, type Fetcher } from "../api.ts";
import { Editor } from "../editor/Editor.tsx";
import { PAGES_URL, THEME_URL } from "../editor/exit.ts";

function parseSearch(search: string): { entry: string | null; collection: string } {
  const params = new URLSearchParams(search);
  const entry = params.get("entry")?.trim() || null;
  const raw = params.get("collection")?.trim();
  const collection = raw === THEME_PARTS_COLLECTION ? THEME_PARTS_COLLECTION : PAGES_COLLECTION;
  return { entry, collection };
}

/** The editor (`/editor`), exported but not declared, so it has no sidebar or palette entry (D-024). */
export function EditorPage({ fetcher = defaultFetcher }: { fetcher?: Fetcher }) {
  return (
    <RequireEditor fetcher={fetcher}>
      {() => {
        const { entry, collection } = parseSearch(window.location.search);
        return <EditorLanding fetcher={fetcher} entry={entry} collection={collection} />;
      }}
    </RequireEditor>
  );
}

function EditorLanding({
  fetcher,
  entry,
  collection,
}: {
  fetcher: Fetcher;
  entry: string | null;
  collection: string;
}) {
  const t = useI18n();
  if (!entry) {
    const listUrl = collection === THEME_PARTS_COLLECTION ? THEME_URL : PAGES_URL;
    const listLabel =
      collection === THEME_PARTS_COLLECTION ? t("Theme Builder") : t("Visual pages");
    return (
      <section data-emvb-page="editor">
        <Empty
          icon={<CursorClickIcon size={32} aria-hidden="true" />}
          title={t("No page selected")}
          description={t("Choose an entry to edit from {list}.", { list: listLabel })}
          contents={<a href={listUrl}>{t("Go to {list}", { list: listLabel })}</a>}
        />
      </section>
    );
  }
  return (
    <section data-emvb-page="editor" data-emvb-entry={entry} data-emvb-collection={collection}>
      <Editor fetcher={fetcher} entryId={entry} collection={collection} />
    </section>
  );
}
