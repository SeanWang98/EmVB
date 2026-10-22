/**
 * [INPUT]: 依赖编辑器内容、脏状态与字段应用回调。
 * [OUTPUT]: 提供隔离后台的全屏 Portal 与退出保护。
 * [POS]: 编辑器外壳；字段模式隔离宿主表单事件。
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import * as React from "react";
import { createPortal } from "react-dom";
import { EDITOR_CSS } from "./editor-css.ts";
import { inDialog, isPaletteShortcut, shortcutKey } from "./shortcuts.ts";

/**
 * The full-screen editor layer (D-011, S0-6). It is portaled to `document.body` with
 * `z-index: auto`: it still covers the admin shell, and Kumo and host layers portaled later
 * (dialogs, the palette, toasts) stack above it. A positive z-index would hide them while they
 * keep focus.
 */
export function EditorOverlay({
  label,
  dirty = false,
  onPalette,
  onFieldSave,
  children,
}: {
  label: string;
  dirty?: boolean;
  /** Ctrl/Cmd+K opens EmVB's own command palette instead of the host's (W-314). */
  onPalette?: () => void;
  /** 字段模式接管保存快捷键，阻止宿主提前提交 Page。 */
  onFieldSave?: () => void;
  children: React.ReactNode;
}) {
  const paletteRef = React.useRef(onPalette);
  const fieldSaveRef = React.useRef(onFieldSave);
  fieldSaveRef.current = onFieldSave;
  paletteRef.current = onPalette;
  React.useEffect(() => {
    const block = (event: KeyboardEvent) => {
      if (fieldSaveRef.current && (event.ctrlKey || event.metaKey) && shortcutKey(event) === "s") {
        event.preventDefault();
        event.stopImmediatePropagation();
        fieldSaveRef.current();
        return;
      }
      if (!isPaletteShortcut(event)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      // Not over an open dialog: closing the palette would strand focus outside it.
      if (inDialog(event.target)) return;
      paletteRef.current?.();
    };
    window.addEventListener("keydown", block, true);
    return () => window.removeEventListener("keydown", block, true);
  }, []);

  // W-300: the overlay covers the EmDash admin shell, but Tab still walked its sidebar first.
  // Mark the shell inert while the editor is open; hosts without #admin-root (the playground) are
  // unchanged. Toast portals stay after the overlay so they stay focusable.
  React.useEffect(() => {
    const shell = document.getElementById("admin-root");
    const previous = document.activeElement as HTMLElement | null;
    const wasInert = shell?.inert ?? false;
    if (shell) shell.inert = true;
    if (fieldSaveRef.current)
      document.querySelector<HTMLElement>("[data-emvb-editor] button")?.focus();
    return () => {
      if (shell) shell.inert = wasInert;
      if (fieldSaveRef.current && previous?.isConnected) previous.focus();
    };
  }, []);

  React.useEffect(() => {
    if (!dirty) return;
    const guard = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // Older browsers need returnValue set to show the prompt.
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, [dirty]);

  return createPortal(
    <div
      data-emvb-editor=""
      role="region"
      aria-label={label}
      style={{ position: "fixed", inset: 0, zIndex: "auto" }}
      onSubmit={
        onFieldSave
          ? (event) => {
              event.preventDefault();
              event.stopPropagation();
            }
          : undefined
      }
    >
      <style>{EDITOR_CSS}</style>
      {children}
    </div>,
    document.body,
  );
}
