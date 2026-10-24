/**
 * [INPUT]: 依赖内容 API、布局校验与延迟翻译消息。
 * [OUTPUT]: 提供独立条目持久化、字段应用及当前语言的字段错误。
 * [POS]: 保存边界；状态保留模板与参数，API 原文不进入词典。
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import { translate, useI18n, type Translate } from "../i18n/index.ts";
import * as React from "react";
import {
  byteLength,
  MAX_LAYOUT_BYTES,
  nodeIdAtPath,
  validateLayout,
  type Layout,
} from "../../core/index.ts";
import { PAGES_COLLECTION, THEME_PARTS_COLLECTION } from "../../constants.ts";
import { ApiError, type Fetcher } from "../api.ts";
import { publishPage, savePage } from "../content-api.ts";
import { publishThemePart, saveThemePart } from "../theme-api.ts";
import type { EditorAction, EditorState } from "./store.ts";
import { loadEntry } from "./useEditorData.ts";
import { formatMessage, literalMessage, type LocalizedMessage } from "./localized-message.ts";

export type SaveStatus =
  | { kind: "idle" | "saving" | "saved" }
  | { kind: "error"; message: LocalizedMessage; retry: boolean };

/** 字段只向宿主表单应用布局，不拥有条目发布权限。 */
export type FieldSession = { onApply: (layout: Layout | null) => void };

const FIX_AND_SAVE = "Couldn't save. Fix the highlighted setting and save again.";
const OFFLINE = "Couldn't save. Check your connection and try again.";

export const tooLargeMessage = (bytes: number, t: Translate = translate) =>
  t(
    "Couldn't save. This page is {size} KB and the limit is {limit} KB. Remove some content and save again.",
    { size: Math.ceil(bytes / 1024), limit: MAX_LAYOUT_BYTES / 1024 },
  );

export const slugTakenMessage = (slug: string, t: Translate = translate) =>
  t('A page with the slug "{slug}" already exists. Choose a different slug.', { slug });

/** What the editor shows and does after a failed save. */
export type SaveFailure = {
  status: SaveStatus;
  /** The inline error for the Slug field. */
  slugError?: LocalizedMessage;
  /** Open the "changed somewhere else" dialog. */
  conflict?: true;
  /** Move the selection: to the rejected element, or `null` to show page settings. */
  select?: string | null;
  /** The server's rejection, shown in the element panel. */
  rejection?: LocalizedMessage;
};

const fixAndSave = (): SaveStatus => ({
  kind: "error",
  message: FIX_AND_SAVE,
  retry: false,
});
const offline = (): SaveStatus => ({ kind: "error", message: OFFLINE, retry: true });

export function saveFailure(
  error: unknown,
  page: { slug: string; layout: Layout | null },
): SaveFailure {
  if (!(error instanceof ApiError) || error.status >= 500) return { status: offline() };
  if (error.status === 401) {
    // W-205: the session ran out. The edits stay here; signing in again in another tab and
    // retrying saves them.
    const message = "Couldn't save. You're signed out: sign in again in another tab, then Retry.";
    return { status: { kind: "error", message, retry: true } };
  }
  if (error.status === 404) {
    // W-206: deleted (moved to Trash) while open. Restoring it keeps these edits savable.
    const message =
      "Couldn't save. This was moved to Trash or deleted: restore it from the Trash, then Retry.";
    return { status: { kind: "error", message, retry: true } };
  }
  if (error.status === 409 && error.code === "SLUG_CONFLICT") {
    const slug = page.slug;
    return {
      status: fixAndSave(),
      slugError: { format: (t) => slugTakenMessage(slug, t) },
      select: null,
    };
  }
  if (error.status === 409) {
    const message = "Couldn't save. This page was changed somewhere else.";
    return { status: { kind: "error", message, retry: false }, conflict: true };
  }
  if (error.status === 400 || error.status === 422) {
    const path = /\broot(?:\.children\[\d+\])*/.exec(error.message)?.[0];
    const id = path && page.layout ? nodeIdAtPath(page.layout, path) : null;
    // UX-095: with no element to highlight, "fix the highlighted setting" pointed at nothing.
    if (!id) {
      const reason = error.message;
      const message: LocalizedMessage = {
        format: (t) => t("Couldn't save. {message}", { message: reason }),
      };
      return {
        status: { kind: "error", message, retry: false },
        rejection: literalMessage(reason),
      };
    }
    return { status: fixAndSave(), rejection: literalMessage(error.message), select: id };
  }
  const reason = error.message;
  return {
    status: {
      kind: "error",
      message: { format: (t) => t("Couldn't save. {message}", { message: reason }) },
      retry: false,
    },
  };
}

export function publishFailureMessage(error: unknown): string {
  if (error instanceof ApiError && error.status === 401) {
    return "Couldn't publish. You're signed out: sign in again in another tab, then publish.";
  }
  // W-298: a 404 means the page is gone (moved to Trash while open), not a dropped connection.
  if (error instanceof ApiError && error.status === 404) {
    return "Couldn't publish. This was moved to Trash or deleted: restore it from the Trash, then publish.";
  }
  if (error instanceof ApiError && error.status === 403) {
    return "Couldn't publish. Your role can't publish pages.";
  }
  if (error instanceof ApiError && error.status === 409) {
    return "Couldn't publish. This page was changed somewhere else.";
  }
  return "Couldn't publish. Check your connection and try again.";
}

/**
 * Save, publish and their failure modes (R-006, IA "Save and publish"). Saves send `_rev`, so a
 * concurrent change surfaces as a conflict instead of being overwritten.
 */
export function useSave(
  fetcher: Fetcher,
  state: EditorState,
  dispatch: React.Dispatch<EditorAction>,
  collection: string = PAGES_COLLECTION,
  fieldSession?: FieldSession,
) {
  const currentLanguage = useI18n();
  const latest = React.useRef(state);
  latest.current = state;
  const [status, setStatus] = React.useState<SaveStatus>({ kind: "idle" });
  const [conflict, setConflict] = React.useState(false);
  const [slugError, setSlugError] = React.useState<LocalizedMessage | null>(null);
  const [rejection, setRejection] = React.useState<LocalizedMessage | null>(null);

  const write = React.useCallback(
    async (rev: string | null): Promise<string | null> => {
      const current = latest.current;
      const bytes = current.page.layout ? byteLength(current.page.layout) : 0;
      if (bytes > MAX_LAYOUT_BYTES) {
        setStatus({
          kind: "error",
          message: { format: (t) => tooLargeMessage(bytes, t) },
          retry: false,
        });
        return null;
      }
      setStatus({ kind: "saving" });
      setSlugError(null);
      setRejection(null);
      try {
        if (fieldSession) {
          const layout = current.page.layout;
          if (layout) {
            const checked = validateLayout(layout);
            if (!checked.ok) {
              const reason = "The canvas layout is invalid. Fix it before applying.";
              setRejection(reason);
              setStatus({
                kind: "error",
                message: { format: (t) => t("Couldn't save. {message}", { message: t(reason) }) },
                retry: false,
              });
              return null;
            }
          }
          // 外层 Page 保留所有未保存字段，由其统一保存、发布。
          fieldSession.onApply(layout);
          return "field-applied";
        }
        const next =
          collection === THEME_PARTS_COLLECTION
            ? await saveThemePart(
                fetcher,
                current.id,
                {
                  title: current.page.title,
                  slug: current.page.slug,
                  partType: current.page.partType ?? "header",
                  conditions: current.page.conditions ?? {
                    schemaVersion: 1,
                    rules: [],
                  },
                  triggers: current.page.triggers ?? {
                    schemaVersion: 1,
                    open: [{ type: "page_load" }],
                    advanced: {},
                  },
                  float: current.page.float ?? {
                    schemaVersion: 1,
                    edge: "top",
                    dismiss: false,
                  },
                  layout: current.page.layout,
                },
                rev,
              )
            : await savePage(fetcher, current.id, current.page, rev);
        dispatch({ type: "saved", rev: next, version: current.version });
        setStatus({ kind: "saved" });
        return next;
      } catch (error) {
        const failure = saveFailure(error, current.page);
        if (failure.slugError) setSlugError(failure.slugError);
        if (failure.select !== undefined) dispatch({ type: "select", id: failure.select });
        if (failure.conflict) setConflict(true);
        if (failure.rejection !== undefined) setRejection(failure.rejection);
        setStatus(failure.status);
        return null;
      }
    },
    [fetcher, dispatch, collection, fieldSession],
  );

  // W-199: one save at a time. A save asked for while one is in flight (Ctrl+S, autosave) runs once
  // after it, with the revision that save returned, instead of racing it with a stale `_rev`
  // and reporting a conflict with itself.
  const inFlight = React.useRef<Promise<string | null> | null>(null);
  const queued = React.useRef<Promise<string | null> | null>(null);
  const start = React.useCallback(
    (rev: string | null): Promise<string | null> => {
      const run = write(rev).finally(() => {
        if (inFlight.current === run) inFlight.current = null;
      });
      inFlight.current = run;
      return run;
    },
    [write],
  );
  const save = React.useCallback((): Promise<string | null> => {
    if (queued.current) return queued.current;
    const pending = inFlight.current;
    if (!pending) return start(latest.current.rev);
    // The state may not have re-rendered yet, so take the new revision from the save itself.
    const after = pending.then((rev) => {
      queued.current = null;
      return start(rev ?? latest.current.rev);
    });
    queued.current = after;
    return after;
  }, [start]);

  /** Conflict → Overwrite: take the stored revision and save over it. */
  // W-836: the overwrite counts as the save in flight, so a save asked for meanwhile (Save draft,
  // Ctrl+S, autosave) waits for it and uses its new revision instead of the stale one, which
  // reopened the conflict right after a successful overwrite.
  const overwrite = React.useCallback(async () => {
    if (fieldSession) return;
    setConflict(false);
    const run: Promise<string | null> = (async () => {
      try {
        const stored = await loadEntry(fetcher, latest.current.id, collection);
        return await write(stored.rev);
      } catch {
        setStatus({ kind: "error", message: OFFLINE, retry: true });
        return null;
      }
    })().finally(() => {
      if (inFlight.current === run) inFlight.current = null;
    });
    inFlight.current = run;
    await run;
  }, [fetcher, write, collection, fieldSession]);

  const publish = React.useCallback(async (): Promise<boolean> => {
    if (fieldSession) return false;
    let rev: string | null = latest.current.rev;
    const pending = queued.current ?? inFlight.current;
    if (pending) {
      // W-199: publish the revision the running save makes, never race it.
      const saved = await pending;
      if (!saved) return false;
      rev = saved;
    }
    if (latest.current.version !== latest.current.savedVersion) {
      rev = await start(rev);
      if (!rev) return false;
    }
    try {
      const result =
        collection === THEME_PARTS_COLLECTION
          ? await publishThemePart(fetcher, latest.current.id, rev)
          : await publishPage(fetcher, latest.current.id, rev);
      dispatch({ type: "published", rev: result.rev });
      setStatus({ kind: "saved" });
      return true;
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) setConflict(true);
      setStatus({ kind: "error", message: publishFailureMessage(error), retry: false });
      return false;
    }
  }, [fetcher, dispatch, start, collection, fieldSession]);

  return {
    status,
    save,
    publish,
    overwrite,
    conflict,
    closeConflict: () => setConflict(false),
    markIdle: () => setStatus({ kind: "idle" }),
    slugError: slugError === null ? null : formatMessage(slugError, currentLanguage),
    clearSlugError: () => setSlugError(null),
    rejection: rejection === null ? null : formatMessage(rejection, currentLanguage),
  };
}
