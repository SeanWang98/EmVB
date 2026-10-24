/**
 * [INPUT]: 依赖宿主字段快照、布局错误标记、站点样式与后台语言。
 * [OUTPUT]: 提供不读写独立条目的受控画布会话。
 * [POS]: 字段适配层；加载错误切语言不重请求，宿主持久化布局。
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import { useI18n } from "../i18n/index.ts";
import { Button } from "@cloudflare/kumo";
import * as React from "react";
import { validateLayout, type Layout } from "../../core/index.ts";
import { hasCanvasLayout } from "../../core/host-fields.ts";
import type { Fetcher } from "../api.ts";
import { EditorApp } from "./Editor.tsx";
import { EditorOverlay } from "./EditorOverlay.tsx";
import { EditorHostContext, useEditorHost } from "./host.ts";
import { LiveDataProvider } from "./live-data.tsx";
import {
  errorMessage,
  formatMessage,
  literalMessage,
  LocalizedMessageError,
} from "./localized-message.ts";
import { loadDesign, type LoadedDesign, type EditorEntry } from "./useEditorData.ts";
import { EDITOR_MIN_WIDTH_QUERY, useMediaQuery } from "./useMediaQuery.ts";

/** 空字段是新画布；损坏值保留给宿主修复，不静默清空。 */
export function readFieldLayout(value: unknown): Layout | null {
  if (!hasCanvasLayout(value)) return null;
  let raw: unknown = value;
  if (typeof raw === "string") {
    try {
      raw = JSON.parse(raw) as unknown;
    } catch {
      throw new LocalizedMessageError(
        "This page’s canvas data cannot be read. The original value was not changed.",
      );
    }
  }
  const checked = validateLayout(raw);
  if (!checked.ok)
    throw new LocalizedMessageError(
      "This page’s canvas data cannot be read. The original value was not changed.",
    );
  return checked.layout;
}

export function FieldEditor({
  value,
  label,
  fetcher,
  onApply,
  onCancel,
}: {
  value: unknown;
  label: string;
  fetcher: Fetcher;
  onApply: (layout: Layout | null) => void;
  onCancel: () => void;
}) {
  const t = useI18n();
  const host = useEditorHost();
  const wideEnough = useMediaQuery(EDITOR_MIN_WIDTH_QUERY);
  const scope = `field${React.useId().replace(/[^a-z0-9]/gi, "")}`;
  const [loaded, setLoaded] = React.useState<
    { entry: EditorEntry; design: LoadedDesign } | { error: unknown } | null
  >(null);
  const [attempt, setAttempt] = React.useState(0);
  // value 是打开时的快照，编辑期间宿主重新渲染不会重置画布。
  React.useEffect(() => {
    let active = true;
    setLoaded(null);
    void (async () => {
      try {
        const layout = readFieldLayout(value);
        const design = await loadDesign(fetcher);
        if (active)
          setLoaded({
            entry: {
              id: scope,
              collection: "",
              title: label,
              slug: "",
              canvasMode: "site-layout",
              seoTitle: "",
              seoDescription: "",
              status: "draft",
              rev: null,
              layout,
            },
            design,
          });
      } catch (error) {
        if (active) setLoaded({ error });
      }
    })();
    return () => {
      active = false;
    };
    // 会话输入在挂载时冻结；重试只重新读取该快照。
  }, [fetcher, attempt]);
  const session = React.useMemo(() => ({ onApply }), [onApply]);
  const fieldHost = React.useMemo(
    () => ({
      ...host,
      exit: onCancel,
      back: { label: t("Page form"), go: onCancel },
    }),
    [host, onCancel, t],
  );
  return (
    <EditorHostContext.Provider value={fieldHost}>
      {loaded && !("error" in loaded) ? (
        <LiveDataProvider fetcher={fetcher}>
          <EditorApp
            fetcher={fetcher}
            entry={loaded.entry}
            design={loaded.design}
            wideEnough={wideEnough}
            collection=""
            fieldSession={session}
          />
        </LiveDataProvider>
      ) : (
        <EditorOverlay label={t("EmVB canvas: {label}", { label })} onFieldSave={() => undefined}>
          <div className="emvb-state" role="status">
            <p>
              {loaded && "error" in loaded
                ? formatMessage(errorMessage(loaded.error, literalMessage(String(loaded.error))), t)
                : t("Opening the canvas…")}
            </p>
            {loaded && "error" in loaded && (
              <Button type="button" onClick={() => setAttempt((n) => n + 1)}>
                {t("Retry")}
              </Button>
            )}
            <Button type="button" variant="secondary" onClick={onCancel}>
              {t("Cancel")}
            </Button>
          </div>
        </EditorOverlay>
      )}
    </EditorHostContext.Provider>
  );
}
