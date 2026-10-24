/**
 * [INPUT]: 依赖剪贴板包、树操作与即时翻译器。
 * [OUTPUT]: 提供元素和样式复制、粘贴及拒绝反馈。
 * [POS]: 剪贴板界面边界；内容包保持原值，仅翻译操作提示。
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import { localizedDroppedNotice } from "./action-notices.ts";
import { translate } from "../i18n/index.ts";
import type { createKumoToastManager } from "@cloudflare/kumo";
import * as React from "react";
import {
  applyStyle,
  CLIP_REASONS,
  clipStyle,
  elementClip,
  encodeClip,
  findNode,
  pasteNode,
  peekClipKind,
  prepareElement,
  prepareStyle,
  readClip,
  styleClip,
  type ClipEnvelope,
  type LayoutNode,
  type PasteMode,
} from "../../core/index.ts";
import { readClipboardText, useClipboardText, writeClipboardText } from "./clipboard-store.ts";
import { ELEMENT_NAMES } from "./element-chrome.ts";
import type { EditorAction, EditorState } from "./store.ts";

const NOTICE_TIMEOUT_MS = 4000;

const CLIPBOARD_HINTS = {
  pasteEmpty: "Copy an element first.",
  pasteStyleEmpty: "Copy an element or a style first.",
  storageBlocked: "This browser doesn't allow EmVB to keep a copy (local storage is blocked).",
} as const;

/** A refused paste, shown on the element it was aimed at (W-093). */
export type PasteRefusal = { id: string; reason: string };

export type ClipboardActions = {
  copy: (id: string) => void;
  copyStyle: (id: string) => void;
  paste: (id: string | null, mode?: PasteMode) => void;
  pasteStyle: (id: string | null) => void;
  /** Why Paste is unavailable, or null when the clipboard holds an element. */
  pasteBlocked: string | null;
  /** Why Paste style is unavailable, or null when the clipboard holds an element or a style. */
  pasteStyleBlocked: string | null;
};

const nameOf = (node: LayoutNode | undefined) =>
  node ? translate(ELEMENT_NAMES[node.type] ?? node.type) : translate("Element");

/** Copy, paste, copy style and paste style for the editor (W-093, D-033). */
export function useClipboardActions({
  latest,
  dispatch,
  announce,
  toasts,
  onRefuse,
}: {
  latest: React.RefObject<EditorState>;
  dispatch: React.Dispatch<EditorAction>;
  announce: (message: string) => void;
  toasts: ReturnType<typeof createKumoToastManager>;
  onRefuse: (refusal: PasteRefusal) => void;
}): ClipboardActions {
  const text = useClipboardText();
  const kind = peekClipKind(text);
  const lastToast = React.useRef<string | null>(null);

  const notify = (title: string, description?: string) => {
    if (lastToast.current) toasts.close(lastToast.current);
    lastToast.current = toasts.add({ title, description, timeout: NOTICE_TIMEOUT_MS });
  };

  const store = (
    id: string,
    make: (node: LayoutNode) => ClipEnvelope,
    what: (name: string) => string,
  ) => {
    const layout = latest.current.page.layout;
    const node = layout ? findNode(layout, id) : undefined;
    if (!node) return;
    if (!writeClipboardText(encodeClip(make(node)))) {
      announce(translate(CLIPBOARD_HINTS.storageBlocked));
      notify(translate("Couldn't copy"), translate(CLIPBOARD_HINTS.storageBlocked));
      return;
    }
    const message = translate("{name} copied", { name: what(nameOf(node)) });
    announce(message);
    notify(message);
  };

  const refuse = (id: string, reason: string) => {
    const message = translate(reason);
    announce(message);
    onRefuse({ id, reason: message });
  };

  const paste = (id: string | null, mode: PasteMode = "auto") => {
    const state = latest.current;
    const layout = state.page.layout;
    if (!layout) return;
    const target = id && findNode(layout, id) ? id : layout.root.id;
    const read = readClip(readClipboardText());
    if (!read.ok) return refuse(target, read.reason);
    if (read.clip.kind !== "element") return refuse(target, CLIP_REASONS.noElement);
    const { node, dropped } = prepareElement(read.clip.node, layout, state.design);
    const result = pasteNode(layout, node, target, mode);
    if (!result.ok) return refuse(target, result.reason);
    dispatch({ type: "apply-arranged", layout: result.layout, selected: result.selected });
    const message = translate("{name} pasted", { name: nameOf(node) });
    announce(message);
    const notice = localizedDroppedNotice(dropped);
    if (notice) notify(message, translate(notice));
  };

  const pasteStyle = (id: string | null) => {
    const state = latest.current;
    const layout = state.page.layout;
    if (!layout || !id || !findNode(layout, id)) return;
    const read = readClip(readClipboardText());
    if (!read.ok) return refuse(id, read.reason);
    const { style, dropped } = prepareStyle(clipStyle(read.clip), state.design);
    dispatch({ type: "update-node", id, update: (node) => applyStyle(node, style) });
    const message = translate("Style pasted on {name}", { name: nameOf(findNode(layout, id)) });
    announce(message);
    const notice = localizedDroppedNotice(dropped);
    if (notice) notify(message, translate(notice));
  };

  return {
    copy: (id) => store(id, elementClip, (name) => name),
    copyStyle: (id) => store(id, styleClip, (name) => translate("{name} style", { name })),
    paste,
    pasteStyle,
    pasteBlocked: kind === "element" ? null : translate(CLIPBOARD_HINTS.pasteEmpty),
    pasteStyleBlocked: kind ? null : translate(CLIPBOARD_HINTS.pasteStyleEmpty),
  };
}
