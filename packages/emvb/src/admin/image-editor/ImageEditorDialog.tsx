/**
 * [INPUT]: 依赖媒体加载、图片引擎、导出与 editor-layouts。
 * [OUTPUT]: 提供图片编辑对话框、SavedCopy 与入口属性类型。
 * [POS]: 编辑会话编排层，隔离源图、编辑配方与保存副本。
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
/**
 * The full-screen image editor (W-482, laid out like photocn's editor in W-483). Loaded on demand
 * from the Image settings; photocn and this file never ship in the main editor chunk or on public
 * pages.
 *
 * The desktop layout (toolbar on top, canvas, resizable sidebar with the tool switcher, histogram
 * and panel) and the compact phone layout (photo first, tools at the bottom, controls in a sheet)
 * follow photocn's `image-editor.tsx`, `layout.tsx` and `compact-layout.tsx`
 * (https://github.com/rbbydotdev/photocn, apps/www/src/registry/image-editor), MIT License,
 * Copyright (c) 2026 rbbydotdev. Rebuilt with Kumo components and EmVB tokens.
 */
import { useI18n } from "../i18n/index.ts";
import { Button, Dialog, TooltipProvider } from "@cloudflare/kumo";
import { WarningCircleIcon } from "@phosphor-icons/react";
import * as React from "react";
import { UI_CSS } from "../ui.ts";
import {
  aspectRatioOptions,
  ImageEditorProvider,
  planEngine,
  useImageEditorState,
} from "./engine.ts";
import { ImageEditorError, type ImageMessage } from "./messages.ts";
import { IMAGE_EDITOR_CSS } from "./image-editor-css.ts";
import { Announcer } from "./announce.tsx";
import { withDataUrlFetch } from "./data-url-fetch.ts";
import { ExportDialog, type ExportResult, type ExportSettings } from "./ExportDialog.tsx";
import { fitSourceToGpu } from "./gpu-fit.ts";
import { loadEditableSource } from "./load.ts";
import { ImageNameContext } from "./MetadataPanel.tsx";
import {
  CancelButton,
  CompactLayout,
  DesktopLayout,
  SaveContext,
  type SaveApi,
  type Ready,
} from "./editor-layouts.tsx";
import { buildImageEdit, editedFileName, hasGps, outputFile, savedRecipe } from "./save.ts";
import { displayName, elementAspectOption } from "./tools.ts";
import type { RenderMode } from "./worker.ts";
import type { ImageEdit } from "../../core/index.ts";

export type ImageEditorDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The Image element's props (`src`, `alt`, `edit`, `width`, `height`…). */
  imageProps: Record<string, unknown>;
  /** Tests and the spike force main-thread rendering. */
  forceRenderMode?: RenderMode;
  onClosed?: () => void;
  /**
   * Saves the edited copy (W-485): upload `file` as a new media item and point the element at
   * it with `edit`. Rejecting keeps the editor open with the error and a Retry. Without it the
   * export step only downloads.
   */
  onSave?: (file: File, copy: SavedCopy) => Promise<void>;
};

export type SavedCopy = {
  width: number;
  height: number;
  /** The validated `ImageEdit` record for `props.edit`. */
  edit: ImageEdit;
};

/** Below this editor width the compact (phone) layout is used (photocn COMPACT_WIDTH). */
export const COMPACT_WIDTH = 640;

function withoutEdit(props: Record<string, unknown>): Record<string, unknown> {
  const { edit: _edit, ...rest } = props;
  return rest;
}
type Phase =
  | { kind: "loading" }
  | ({ kind: "error"; retry: boolean } & ImageMessage)
  | { kind: "ready"; ready: Ready };

/** The editor's width, measured before paint (null until then). */
function useWidth(ref: React.RefObject<HTMLElement | null>) {
  const [width, setWidth] = React.useState<number | null>(null);
  React.useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    setWidth(element.getBoundingClientRect().width || window.innerWidth);
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(entry.contentRect.width);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);
  return width;
}

function EditorView({
  ready,
  imageProps,
  escapeRef,
  onSave,
  onSaved,
}: {
  ready: Ready;
  imageProps: Record<string, unknown>;
  escapeRef: React.MutableRefObject<(() => void) | null>;
  onSave?: (file: File, copy: SavedCopy) => Promise<void>;
  onSaved: () => void;
}) {
  const t = useI18n();
  const fitValue = elementAspectOption(imageProps.width, imageProps.height);
  const fitKey = fitValue ? `${fitValue.value}|${fitValue.label}` : "";
  // A stable list: a new one each render would look like new options to the hook.
  const options = React.useMemo(
    () => (fitValue ? withElementOption(fitValue) : undefined),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fitKey stands for fitValue.
    [fitKey],
  );
  const editor = useImageEditorState({
    src: ready.source.blob,
    decodeOptions: { name: ready.source.name, type: ready.source.type },
    renderMode: ready.renderMode,
    ...(ready.spawnWorker ? { spawnWorker: ready.spawnWorker } : {}),
    defaultTool: "adjust",
    ...(options ? { aspectRatioOptions: options } : {}),
  });
  // Esc leaves corner editing before it closes the editor.
  const { editingCorners, setEditingCorners } = editor.geometry;
  escapeRef.current = editingCorners ? () => setEditingCorners(false) : null;
  const mainThread = ready.renderMode === "main";
  // Re-opening an edited picture: the original is loaded, then the saved recipe goes back on.
  const applied = React.useRef(false);
  const { isReady, recipes } = editor;
  React.useEffect(() => {
    if (!isReady || applied.current) return;
    applied.current = true;
    const recipe = ready.source.fromOriginal ? savedRecipe(imageProps) : null;
    if (!recipe) return;
    const task = () => recipes.apply(recipe as Parameters<typeof recipes.apply>[0]);
    void (mainThread ? withDataUrlFetch(task) : task()).catch(() => undefined);
  }, [isReady, recipes, imageProps, ready.source.fromOriginal, mainThread]);
  const [gps, setGps] = React.useState(false);
  React.useEffect(() => {
    let alive = true;
    void hasGps(ready.source.blob).then(
      (found) => alive && setGps(found),
      () => undefined,
    );
    return () => {
      alive = false;
    };
  }, [ready.source.blob]);
  const [exportOpen, setExportOpen] = React.useState(false);
  const save = React.useMemo<SaveApi>(
    () => ({ open: () => setExportOpen(true), enabled: Boolean(onSave) }),
    [onSave],
  );
  const currentRecipe = editor.recipes.current;
  const saveCopy = async (result: ExportResult, settings: ExportSettings) => {
    if (!onSave) return;
    // W-493: with the original gone, the copy becomes the new original of this edit.
    const base = ready.source.originalMissing ? withoutEdit(imageProps) : imageProps;
    const built = buildImageEdit({ imageProps: base, recipe: currentRecipe, output: settings });
    if (!built.ok) throw new Error(built.message);
    const name = editedFileName(ready.source.name, settings.format);
    const { file } = await outputFile(result.blob, name, settings.format, settings.stripGps);
    try {
      await onSave(file, { width: result.width, height: result.height, edit: built.edit });
    } catch (caught) {
      const why = caught instanceof Error && caught.message ? ` ${caught.message}` : "";
      throw new ImageEditorError(
        "Couldn't save the copy.{reason}",
        { reason: why },
        { cause: caught },
      );
    }
    setExportOpen(false);
    onSaved();
  };
  const width = useWidth(editor.rootRef);
  const compact = width !== null && width < COMPACT_WIDTH;
  const name = displayName(ready.source.name, imageProps.alt, t("Library picture"));
  return (
    <ImageEditorProvider editor={editor}>
      <SaveContext.Provider value={save}>
        <ImageNameContext.Provider value={name}>
          <div
            className="emvb-ie"
            ref={editor.rootRef}
            data-emvb-dialog="image-editor"
            data-emvb-image-editor={
              editor.status === "error" ? "error" : editor.isReady ? "ready" : "loading"
            }
            data-emvb-render-mode={ready.renderMode}
            data-layout={compact ? "compact" : "desktop"}
            data-emvb-image-tool-active={editor.tool}
          >
            {width === null ? null : compact ? (
              <CompactLayout name={name} />
            ) : (
              <DesktopLayout ready={ready} name={name} />
            )}
            <Announcer />
          </div>
          {exportOpen ? <div className="emvb-ie-scrim" aria-hidden="true" /> : null}
          {onSave ? (
            <ExportDialog
              open={exportOpen}
              onOpenChange={setExportOpen}
              mainThread={mainThread}
              sourceHasGps={gps}
              sourceType={ready.source.blob.type}
              downloadName={editedFileName(ready.source.name, "jpeg")}
              onSave={saveCopy}
            />
          ) : null}
        </ImageNameContext.Provider>
      </SaveContext.Provider>
    </ImageEditorProvider>
  );
}

/** photocn's presets with "Fit this element" after Original (W-483). */
function withElementOption(fit: { value: string; label: string }) {
  const rest = aspectRatioOptions.filter((o) => o.value !== fit.value);
  const at = rest.findIndex((o) => o.value === "original") + 1;
  return [...rest.slice(0, at), fit, ...rest.slice(at)];
}

/** Before the picture loads, or when it can't: the same frame with a message in the stage. */
function StateFrame({
  phase,
  onRetry,
}: {
  phase: Exclude<Phase, { kind: "ready" }>;
  onRetry: () => void;
}) {
  const t = useI18n();
  return (
    <div
      className="emvb-ie"
      data-emvb-dialog="image-editor"
      data-emvb-image-editor={phase.kind}
      data-layout="desktop"
    >
      <div className="emvb-ie-layout">
        <div className="emvb-ie-toolbar">
          <span className="emvb-ie-file">
            <span className="emvb-ie-file-name">
              {t(phase.kind === "error" ? "Couldn't open the picture" : "Opening the picture…")}
            </span>
          </span>
          <div className="emvb-ie-toolbar-end">
            <CancelButton />
          </div>
        </div>
        <main className="emvb-ie-main emvb-ie-main-solo">
          <div className="emvb-ie-stage emvb-ie-stage-message">
            {phase.kind === "loading" ? (
              <div className="emvb-ie-loading" aria-busy="true">
                <span className="emvb-ie-spinner" aria-hidden="true" />
                <span className="emvb-ie-sr">{t("Opening the picture…")}</span>
              </div>
            ) : (
              <div className="emvb-ie-error" role="alert" data-emvb-image-error="">
                <span className="emvb-ie-error-icon" aria-hidden="true">
                  <WarningCircleIcon weight="duotone" />
                </span>
                <h3>{t("Can't edit this picture")}</h3>
                <p>{t(phase.message, phase.values)}</p>
                {phase.retry ? (
                  <Button variant="outline" size="sm" className="emvb-ie-btn" onClick={onRetry}>
                    {t("Try again")}
                  </Button>
                ) : (
                  <Dialog.Close
                    render={(props) => (
                      <Button {...props} variant="outline" size="sm" className="emvb-ie-btn">
                        {t("Back to the page")}
                      </Button>
                    )}
                  />
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function Editor({
  imageProps,
  forceRenderMode,
  escapeRef,
  onSave,
  onSaved,
}: {
  imageProps: Record<string, unknown>;
  forceRenderMode?: RenderMode;
  escapeRef: React.MutableRefObject<(() => void) | null>;
  onSave?: (file: File, copy: SavedCopy) => Promise<void>;
  onSaved: () => void;
}) {
  const [phase, setPhase] = React.useState<Phase>({ kind: "loading" });
  const [attempt, setAttempt] = React.useState(0);
  React.useEffect(() => {
    let alive = true;
    setPhase({ kind: "loading" });
    void (async () => {
      const source = await loadEditableSource(imageProps, window.location.origin);
      if (!alive) return;
      if (!source.ok) {
        setPhase({ kind: "error", message: source.message, retry: source.reason === "network" });
        return;
      }
      const plan = await planEngine(forceRenderMode ? { force: forceRenderMode } : {});
      if (!alive) return;
      if (!plan.ok) {
        setPhase({ kind: "error", message: plan.message, retry: false });
        return;
      }
      const fitted = await fitSourceToGpu(source).catch(() => null);
      if (!alive) return;
      if (!fitted) {
        setPhase({
          kind: "error",
          retry: false,
          message: "This picture is too large to edit in the browser. Use a smaller copy.",
        });
        return;
      }
      setPhase({
        kind: "ready",
        ready: {
          source: fitted,
          renderMode: plan.renderMode,
          ...(plan.spawnWorker ? { spawnWorker: plan.spawnWorker } : {}),
          ...(plan.reason ? { reason: plan.reason } : {}),
        },
      });
    })().catch((error: unknown) => {
      if (alive) {
        setPhase({
          kind: "error",
          retry: true,
          message: "Couldn't open this picture{reason}",
          values: { reason: error instanceof Error && error.message ? `: ${error.message}` : "." },
        });
      }
    });
    return () => {
      alive = false;
    };
  }, [imageProps, forceRenderMode, attempt]);
  if (phase.kind !== "ready") {
    return <StateFrame phase={phase} onRetry={() => setAttempt((n) => n + 1)} />;
  }
  return (
    <EditorView
      key={attempt}
      ready={phase.ready}
      imageProps={imageProps}
      escapeRef={escapeRef}
      onSave={onSave}
      onSaved={onSaved}
    />
  );
}

export default function ImageEditorDialog({
  open,
  onOpenChange,
  imageProps,
  forceRenderMode,
  onClosed,
  onSave,
}: ImageEditorDialogProps) {
  const t = useI18n();
  const escapeRef = React.useRef<(() => void) | null>(null);
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next, details) => {
        // photocn's Esc leaves the corner handles; it shouldn't also close the editor.
        const leave = escapeRef.current;
        if (!next && leave && details?.reason === "escape-key") {
          leave();
          return;
        }
        onOpenChange(next);
      }}
      onOpenChangeComplete={(next) => {
        if (!next) onClosed?.();
      }}
    >
      <Dialog className="emvb-image-editor-popup" data-emvb-image-editor-popup="">
        <style>{UI_CSS + IMAGE_EDITOR_CSS}</style>
        <Dialog.Title className="emvb-ie-sr" data-emvb-dialog="image-editor-shell">
          {t("Edit image")}
        </Dialog.Title>
        <Dialog.Description className="emvb-ie-sr">
          {t("Crop, rotate and adjust a copy of this picture.")}
        </Dialog.Description>
        <TooltipProvider>
          {open ? (
            <Editor
              imageProps={imageProps}
              forceRenderMode={forceRenderMode}
              escapeRef={escapeRef}
              onSave={onSave}
              onSaved={() => onOpenChange(false)}
            />
          ) : null}
        </TooltipProvider>
      </Dialog>
    </Dialog.Root>
  );
}
