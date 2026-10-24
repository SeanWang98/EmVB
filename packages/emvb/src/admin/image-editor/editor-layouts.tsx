/**
 * [INPUT]: 依赖图片会话状态、工具组件与 SaveContext。
 * [OUTPUT]: 提供DesktopLayout、CompactLayout 与保存上下文。
 * [POS]: 图片编辑器的响应式界面，不负责加载源图。
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import { useI18n } from "../i18n/index.ts";
import { Badge, Button, Dialog, DropdownMenu } from "@cloudflare/kumo";
import {
  ArrowCounterClockwiseIcon,
  DotsThreeIcon,
  DownloadSimpleIcon,
  FileArrowUpIcon,
  ScrollIcon,
  WarningCircleIcon,
  XIcon,
} from "@phosphor-icons/react";
import * as React from "react";
import { SOLID_PRIMARY } from "../ui.ts";
import { EditorCanvas } from "./Canvas.tsx";
import { errorMessage, useImageEditor } from "./engine.ts";
import type { LoadedSource } from "./load.ts";
import { ToolPanel } from "./panels.tsx";
import {
  CompactToolBar,
  CompareButton,
  Histogram,
  RedoButton,
  ResetAllButton,
  ToolSwitcher,
  UndoButton,
} from "./parts.tsx";
import { mediaLabel } from "./media-labels.ts";
import { parseRecipeFile, RECIPE_FILE_MAX_BYTES, recipeFileText } from "./save.ts";
import { sizeLabel, type ImageEditorToolId } from "./tools.ts";
import type { RenderMode } from "./worker.ts";

export type SaveApi = { open: () => void; enabled: boolean };
export const SaveContext = React.createContext<SaveApi>({ open: () => undefined, enabled: false });
export type Ready = {
  source: Extract<LoadedSource, { ok: true }>;
  renderMode: RenderMode;
  spawnWorker?: () => Worker;
  reason?: string;
};
const SIDEBAR = { default: 338, min: 288, max: 544, canvasMin: 384 };
const SNAP_POINTS = [0.42, 0.9] as const;

/** W-862 (IE-2): download the current edits as a recipe file, or load one onto this picture. */
function useRecipeFile(name: string) {
  const t = useI18n();
  const editor = useImageEditor();
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [error, setError] = React.useState<string | null>(null);
  const current = editor.recipes.current;
  const download = () => {
    if (!current) return;
    const url = URL.createObjectURL(
      new Blob([recipeFileText(current as Parameters<typeof recipeFileText>[0])], {
        type: "application/json",
      }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name.replace(/\.[^.]+$/, "") || "image"}.recipe.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  };
  const load = async (file: File | undefined) => {
    if (!file) return;
    // W-881: a huge file picked by mistake isn't read into memory, and a failed apply says so.
    if (file.size > RECIPE_FILE_MAX_BYTES) {
      setError("This file is too large to be an image edit recipe.");
      return;
    }
    try {
      const result = parseRecipeFile(await file.text());
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setError(null);
      await editor.recipes.apply(result.recipe as Parameters<typeof editor.recipes.apply>[0]);
    } catch {
      setError("This recipe couldn't be applied to this picture.");
    }
  };
  const pick = () => fileRef.current?.click();
  // W-884: the phone layout's More menu offers the same two items, so both layouts render these.
  const errorNote = error ? (
    <span className="emvb-ie-recipe-error" role="alert" data-emvb-image-recipe-error="">
      <WarningCircleIcon aria-hidden="true" />
      {t(error)}
    </span>
  ) : null;
  const fileInput = (
    <input
      ref={fileRef}
      type="file"
      accept="application/json,.json"
      hidden
      aria-label={t("Load recipe file")}
      data-emvb-image-recipe-file=""
      onChange={(event) => {
        const input = event.currentTarget;
        void load(input.files?.[0]).finally(() => {
          input.value = "";
        });
      }}
    />
  );
  return { current, download, pick, errorNote, fileInput };
}

function RecipeMenu({ name }: { name: string }) {
  const t = useI18n();
  const editor = useImageEditor();
  const recipe = useRecipeFile(name);
  return (
    <>
      {recipe.errorNote}
      <DropdownMenu>
        <DropdownMenu.Trigger
          render={
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="emvb-ie-btn"
              icon={<ScrollIcon aria-hidden="true" />}
              disabled={editor.disabled || !editor.hasImage}
              data-emvb-image-recipe=""
            >
              {mediaLabel("Recipe", t)}
            </Button>
          }
        />
        <DropdownMenu.Content align="end">
          <RecipeItems recipe={recipe} />
        </DropdownMenu.Content>
      </DropdownMenu>
      {recipe.fileInput}
    </>
  );
}

function RecipeItems({ recipe }: { recipe: ReturnType<typeof useRecipeFile> }) {
  const t = useI18n();
  return (
    <>
      <DropdownMenu.Item
        icon={DownloadSimpleIcon}
        disabled={!recipe.current}
        onClick={recipe.download}
      >
        {t("Download recipe")}
      </DropdownMenu.Item>
      <DropdownMenu.Item icon={FileArrowUpIcon} onClick={recipe.pick}>
        {t("Load recipe…")}
      </DropdownMenu.Item>
    </>
  );
}

function SaveCopyButton() {
  const t = useI18n();
  const save = React.useContext(SaveContext);
  const editor = useImageEditor();
  return (
    <Button
      type="button"
      variant="primary"
      size="sm"
      className="emvb-ie-btn"
      style={SOLID_PRIMARY}
      icon={<DownloadSimpleIcon aria-hidden="true" />}
      disabled={!save.enabled || !editor.isReady || editor.disabled}
      onClick={save.open}
      aria-haspopup="dialog"
      data-emvb-image-save=""
    >
      {t("Save copy")}
    </Button>
  );
}

export function CancelButton({ compact = false }: { compact?: boolean }) {
  const t = useI18n();
  return (
    <Dialog.Close
      render={(props) =>
        compact ? (
          <Button
            {...props}
            type="button"
            variant="ghost"
            size="sm"
            shape="square"
            className="emvb-ie-btn emvb-ie-btn-icon emvb-ie-touch"
            aria-label={t("Close editor")}
            icon={<XIcon aria-hidden="true" />}
            data-emvb-image-cancel=""
          />
        ) : (
          <Button
            {...props}
            type="button"
            variant="outline"
            size="sm"
            className="emvb-ie-btn"
            data-emvb-image-cancel=""
          >
            {t("Cancel")}
          </Button>
        )
      }
    />
  );
}

/** Loading or error (photocn ImageEditorStatusBadge), plus the main-thread fallback note. */
function StatusBadge({ renderMode, reason }: { renderMode: RenderMode; reason?: string }) {
  const t = useI18n();
  const editor = useImageEditor();
  if (editor.status === "error") {
    const message = errorMessage(editor.error);
    return (
      <span className="emvb-ie-badge" title={t(message)}>
        <Badge variant="error">
          <WarningCircleIcon aria-hidden="true" /> {t(message)}
        </Badge>
      </span>
    );
  }
  if (editor.status === "loading" || editor.status === "idle") {
    return (
      <span className="emvb-ie-badge">
        <Badge variant="neutral">{t("Loading")}</Badge>
      </span>
    );
  }
  if (renderMode !== "main") return null;
  return (
    <span
      className="emvb-ie-badge"
      title={reason ? t(reason) : undefined}
      data-emvb-image-mode="main"
    >
      <Badge variant="neutral">{t("Standard preview")}</Badge>
    </span>
  );
}

/** File name and output size, where photocn has its Open button. */
function FileLabel({ name }: { name: string }) {
  const editor = useImageEditor();
  const size = editor.geometry.outputSize;
  return (
    <span className="emvb-ie-file" data-emvb-image-editor-file="" title={name}>
      <span className="emvb-ie-file-name">{name}</span>
      {size ? (
        <span className="emvb-ie-file-size">{sizeLabel(size.width, size.height)}</span>
      ) : null}
    </span>
  );
}

export function DesktopLayout({ ready, name }: { ready: Ready; name: string }) {
  const t = useI18n();
  const [sidebar, setSidebar] = React.useState(SIDEBAR.default);
  const workspaceRef = React.useRef<HTMLDivElement>(null);
  const drag = React.useRef<{ id: number; x: number; start: number } | null>(null);
  const clamp = (w: number) => {
    const total = workspaceRef.current?.getBoundingClientRect().width ?? 0;
    const max = total ? Math.min(SIDEBAR.max, total - SIDEBAR.canvasMin) : SIDEBAR.max;
    return Math.round(Math.max(SIDEBAR.min, Math.min(Math.max(SIDEBAR.min, max), w)));
  };
  return (
    <div className="emvb-ie-layout" data-slot="image-editor-layout">
      <div className="emvb-ie-toolbar" data-slot="editor-toolbar">
        <UndoButton />
        <RedoButton />
        <FileLabel name={name} />
        <StatusBadge renderMode={ready.renderMode} reason={ready.reason} />
        {ready.source.reducedFrom ? (
          <span
            className="emvb-ie-badge"
            data-emvb-image-reduced=""
            title={t(
              "The original is {size}, more than this browser can edit. The copy is saved at the reduced size; the original stays untouched.",
              { size: sizeLabel(ready.source.reducedFrom.width, ready.source.reducedFrom.height) },
            )}
          >
            <Badge variant="neutral">{t("Reduced to fit")}</Badge>
          </span>
        ) : null}
        <div className="emvb-ie-toolbar-end">
          <RecipeMenu name={name} />
          <ResetAllButton />
          <CompareButton />
          <CancelButton />
          <SaveCopyButton />
        </div>
      </div>
      <div
        className="emvb-ie-workspace"
        ref={workspaceRef}
        style={{ gridTemplateColumns: `minmax(0, 1fr) 0 ${sidebar}px` }}
        data-slot="editor-workspace"
      >
        <main className="emvb-ie-main" data-slot="editor-canvas">
          <EditorCanvas alt={name} />
        </main>
        <div
          className="emvb-ie-resize"
          role="separator"
          aria-orientation="vertical"
          aria-label={t("Resize the sidebar")}
          aria-valuemin={SIDEBAR.min}
          aria-valuemax={SIDEBAR.max}
          aria-valuenow={sidebar}
          tabIndex={0}
          onKeyDown={(event) => {
            const step = event.shiftKey ? 48 : 16;
            if (event.key === "ArrowLeft") setSidebar((w) => clamp(w + step));
            else if (event.key === "ArrowRight") setSidebar((w) => clamp(w - step));
            else return;
            event.preventDefault();
          }}
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture?.(event.pointerId);
            drag.current = { id: event.pointerId, x: event.clientX, start: sidebar };
          }}
          onPointerMove={(event) => {
            const d = drag.current;
            if (d?.id === event.pointerId) setSidebar(clamp(d.start - (event.clientX - d.x)));
          }}
          onPointerUp={() => {
            drag.current = null;
          }}
        >
          <span aria-hidden="true" />
        </div>
        <aside className="emvb-ie-sidebar" data-slot="editor-sidebar">
          <div className="emvb-ie-sidebar-tools">
            <ToolSwitcher />
          </div>
          <Histogram />
          <ToolPanel />
        </aside>
      </div>
    </div>
  );
}

/** A non-modal bottom sheet: the photo stays touchable, e.g. to drag the crop frame. */
function PanelSheet({
  open,
  onOpenChange,
  snap,
  onSnapChange,
  label,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  snap: number;
  onSnapChange: (snap: number) => void;
  label: string;
  children: React.ReactNode;
}) {
  const t = useI18n();
  const drag = React.useRef<{
    pointerId: number;
    startY: number;
    startSnap: number;
    latest: number | null;
  } | null>(null);
  const [dragSnap, setDragSnap] = React.useState<number | null>(null);
  const height = dragSnap ?? snap;
  const onGripKey = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const [peek, expanded] = SNAP_POINTS;
    const key = event.key;
    let next: number | "close" | null = null;
    if (key === "ArrowUp" || key === "PageUp") next = expanded;
    else if (key === "ArrowDown" || key === "PageDown") next = snap > peek ? peek : "close";
    else if (key === "Home") next = peek;
    else if (key === "End") next = expanded;
    if (next === null) return;
    event.preventDefault();
    if (next === "close") onOpenChange(false);
    else onSnapChange(next);
  };
  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.pointerId !== event.pointerId) return;
    drag.current = null;
    // W-748: a quick flick can release before React re-renders with the last move.
    const released = d.latest ?? snap;
    setDragSnap(null);
    if (released < SNAP_POINTS[0] * 0.6) {
      onOpenChange(false);
      return;
    }
    onSnapChange(
      SNAP_POINTS.reduce((best, point) =>
        Math.abs(point - released) < Math.abs(best - released) ? point : best,
      ),
    );
  };
  return (
    <section
      aria-hidden={!open}
      aria-label={t("{tool} controls", { tool: t(label) })}
      className="emvb-ie-sheet"
      data-open={open || undefined}
      data-dragging={dragSnap === null ? undefined : ""}
      data-emvb-image-sheet={open ? "open" : "closed"}
      inert={!open}
      style={{ height: `${height * 100}%` }}
    >
      <div
        aria-label={t("Resize panel")}
        aria-orientation="horizontal"
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={Math.round(height * 100)}
        aria-valuetext={
          height === SNAP_POINTS[1]
            ? t("Expanded")
            : height === SNAP_POINTS[0]
              ? t("Peek")
              : undefined
        }
        className="emvb-ie-sheet-grip"
        role="separator"
        tabIndex={0}
        onKeyDown={onGripKey}
        onPointerCancel={onPointerUp}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture?.(event.pointerId);
          drag.current = {
            pointerId: event.pointerId,
            startY: event.clientY,
            startSnap: snap,
            latest: null,
          };
        }}
        onPointerMove={(event) => {
          const d = drag.current;
          if (!d || d.pointerId !== event.pointerId) return;
          const container = event.currentTarget.closest(".emvb-ie-compact");
          const containerHeight = container?.clientHeight || window.innerHeight;
          const next = d.startSnap - (event.clientY - d.startY) / containerHeight;
          d.latest = Math.min(0.96, Math.max(0.08, next));
          setDragSnap(d.latest);
        }}
        onPointerUp={onPointerUp}
      >
        <span />
      </div>
      {children}
    </section>
  );
}

export function CompactLayout({ name }: { name: string }) {
  const t = useI18n();
  const editor = useImageEditor();
  const recipe = useRecipeFile(name);
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const [rootHeight, setRootHeight] = React.useState<number | null>(null);
  React.useLayoutEffect(() => {
    const element = rootRef.current;
    if (!element) return;
    setRootHeight(element.getBoundingClientRect().height);
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setRootHeight(entry.contentRect.height);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const [panelOpen, setPanelOpen] = React.useState(false);
  const [snap, setSnap] = React.useState<number>(SNAP_POINTS[0]);
  const selectTool = (tool: ImageEditorToolId) => {
    if (tool === editor.tool) {
      setPanelOpen((open) => !open);
      return;
    }
    editor.setTool(tool);
    setPanelOpen(true);
    setSnap(SNAP_POINTS[0]);
  };
  const closePanel = () => {
    rootRef.current
      ?.querySelector<HTMLButtonElement>(':scope > nav [aria-pressed="true"]')
      ?.focus();
    setPanelOpen(false);
  };
  // Keep the photo above the sheet: pad the canvas by the sheet's peek height.
  const inset = panelOpen && rootHeight ? Math.max(0, rootHeight * SNAP_POINTS[0] - 28) : undefined;
  const label =
    editor.tool === "compose" ? "Crop" : editor.tool.charAt(0).toUpperCase() + editor.tool.slice(1);
  return (
    <div className="emvb-ie-compact" ref={rootRef} data-slot="image-editor-compact">
      <header className="emvb-ie-compact-head">
        <UndoButton className="emvb-ie-touch" />
        <RedoButton className="emvb-ie-touch" />
        <div className="emvb-ie-toolbar-end">
          <CompareButton showLabel={false} />
          <SaveCopyButton />
          <DropdownMenu>
            <DropdownMenu.Trigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  shape="square"
                  size="sm"
                  aria-label={t("More")}
                  className="emvb-ie-btn emvb-ie-btn-icon emvb-ie-touch"
                  icon={<DotsThreeIcon aria-hidden="true" weight="bold" />}
                  data-emvb-image-more=""
                />
              }
            />
            <DropdownMenu.Content align="end">
              <DropdownMenu.Item
                icon={ArrowCounterClockwiseIcon}
                variant="danger"
                disabled={!editor.hasImage || editor.recipes.current === null}
                onClick={() => editor.resetAll()}
              >
                {t("Reset all edits")}
              </DropdownMenu.Item>
              <RecipeItems recipe={recipe} />
            </DropdownMenu.Content>
          </DropdownMenu>
          {recipe.fileInput}
          <CancelButton compact />
        </div>
      </header>
      {recipe.errorNote ? <div className="emvb-ie-compact-note">{recipe.errorNote}</div> : null}
      <div className="emvb-ie-compact-canvas" style={{ paddingBottom: inset }}>
        <EditorCanvas alt={name} padding={12} />
      </div>
      <CompactToolBar onSelect={selectTool} disabled={!editor.hasImage || editor.disabled} />
      <PanelSheet
        label={label}
        open={panelOpen}
        onOpenChange={(next) => (next ? setPanelOpen(true) : closePanel())}
        snap={snap}
        onSnapChange={setSnap}
      >
        <div className="emvb-ie-sheet-tools">
          <CompactToolBar
            className="emvb-ie-compact-tools-inline"
            disabled={editor.disabled}
            onSelect={(tool) => editor.setTool(tool)}
          />
          <Button
            type="button"
            variant="ghost"
            shape="square"
            size="sm"
            aria-label={t("Close panel")}
            className="emvb-ie-btn emvb-ie-btn-icon emvb-ie-touch"
            icon={<XIcon aria-hidden="true" />}
            onClick={closePanel}
          />
        </div>
        {/* Focusable so the keyboard can scroll a panel with no controls (Metadata, W-486). */}
        <div className="emvb-ie-sheet-body" tabIndex={0} role="region" aria-label={t(label)}>
          <ToolPanel />
        </div>
      </PanelSheet>
    </div>
  );
}
