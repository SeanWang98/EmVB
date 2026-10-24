/**
 * [INPUT]: 依赖布局树动作、元素描述与即时翻译器。
 * [OUTPUT]: 提供节点动作、删除确认源数据和撤销反馈。
 * [POS]: 节点动作边界；确认保留元素类型和用户标签，显示层翻译。
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import { translate } from "../i18n/index.ts";
import * as React from "react";
import type { createKumoToastManager } from "@cloudflare/kumo";
import {
  addNode,
  addNodeNear,
  addSectionNear,
  duplicateNode,
  wrapNode,
  type WrapType,
  ELEMENT_DESCRIPTORS,
  findNode,
  LAYOUT_SCHEMA_VERSION,
  moveDown,
  moveIn,
  moveOut,
  newNodeId,
  moveUp,
  parentOf,
  recipeNode,
  withFreshIds,
  subtreeSize,
  type Arranged,
  type ElementType,
  type Layout,
  type LayoutNode,
} from "../../core/index.ts";
import { newElement } from "./dnd/new-element.ts";
import { ELEMENT_NAMES } from "./element-chrome.ts";
import type { ItemActions } from "./panels/settings/ItemList.tsx";
import type { EditorAction, EditorState } from "./store.ts";

const MOVES = new Set<unknown>([moveUp, moveDown, moveIn, moveOut]);

/** "Moved. Heading is 2 of 3 in Container." for the screen reader after an Alt+arrow move. */
function movedTo(layout: Layout, id: string): string {
  const node = findNode(layout, id);
  const parentId = parentOf(layout, id);
  const parent = parentId ? findNode(layout, parentId) : undefined;
  const siblings: LayoutNode[] =
    parent && "children" in parent && Array.isArray(parent.children) ? parent.children : [];
  const index = siblings.findIndex((child) => child.id === id);
  const name = translate(ELEMENT_NAMES[node?.type ?? "container"] ?? "Element");
  const where = translate(ELEMENT_NAMES[parent?.type ?? "container"] ?? "its container");
  return translate("Moved. {name} is {index} of {count} in {where}.", {
    name,
    index: index + 1,
    count: siblings.length,
    where,
  });
}

const RESTORE_TIMEOUT_MS = 6000;
const NOTICE_TIMEOUT_MS = 4000;

export type DeleteAsk = {
  id: string;
  nodeType: LayoutNode["type"];
  userLabel?: string;
  count: number;
};

/**
 * UX-070: when an action removes the focused control (a deleted row, a closing toast), move focus
 * to the selected layer, the Layers tree, or the canvas, instead of leaving it on the page body.
 */
function keepFocusInLayers(force = false) {
  requestAnimationFrame(() => {
    const active = document.activeElement;
    if (!force && active && active !== document.body && active.isConnected) return;
    (
      document.querySelector<HTMLElement>('.emvb-layer-select[aria-current="true"]') ??
      document.querySelector<HTMLElement>('[data-emvb-editor] [role="tree"]') ??
      document.querySelector<HTMLElement>("iframe[data-emvb-canvas]")
    )?.focus({ preventScroll: true });
  });
}

/** Node actions on the layout tree: delete (with restore toast), duplicate, and add from the panel. */
export function useNodeActions({
  state,
  latest,
  dispatch,
  announce,
  toasts,
}: {
  state: EditorState;
  latest: React.RefObject<EditorState>;
  dispatch: React.Dispatch<EditorAction>;
  announce: (message: string) => void;
  toasts: ReturnType<typeof createKumoToastManager>;
}) {
  const [deleteAsk, setDeleteAsk] = React.useState<DeleteAsk | null>(null);
  const lastToast = React.useRef<string | null>(null);

  const canDelete = (id: string) => !!state.page.layout && state.page.layout.root.id !== id;
  const canMove = canDelete;

  const finishDelete = (id: string) => {
    // UX-062: the toast names what went, as the confirm button does ("Delete 3 elements").
    const layout = latest.current.page.layout;
    const count = layout ? subtreeSize(layout, id) : 1;
    const name = translate(
      ELEMENT_NAMES[(layout && findNode(layout, id)?.type) || "container"] ?? "Element",
    );
    const title =
      count > 1
        ? translate("{count} elements deleted", { count })
        : translate("{name} deleted", { name });
    dispatch({ type: "delete-node", id });
    // UX-070: the deleted row or canvas element took focus with it; keep the keyboard in Layers.
    keepFocusInLayers();
    setDeleteAsk(null);
    if (lastToast.current) toasts.close(lastToast.current);
    const toastId: string = toasts.add({
      title,
      timeout: RESTORE_TIMEOUT_MS,
      actions: [
        {
          children: translate("Restore"),
          variant: "secondary",
          onClick: () => {
            dispatch({ type: "restore" });
            toasts.close(toastId);
            // The toast is closing with focus in it; the restored element's row takes it.
            keepFocusInLayers(true);
          },
        },
      ],
    });
    lastToast.current = toastId;
  };

  const remove = (id: string) => {
    if (!canDelete(id)) return;
    const layout = latest.current.page.layout;
    if (!layout) return;
    const count = subtreeSize(layout, id);
    if (count > 1) {
      const node = findNode(layout, id);
      setDeleteAsk({
        id,
        nodeType: node?.type ?? "container",
        ...(node?.label ? { userLabel: node.label } : {}),
        count,
      });
      return;
    }
    finishDelete(id);
  };

  /** Runs an arrange operation on the latest layout, announcing the reason when it is refused (R-003). */
  const arrange = (id: string, run: (layout: Layout, id: string) => Arranged) => {
    const layout = latest.current.page.layout;
    if (!layout) return;
    const result = run(layout, id);
    if (!result.ok) {
      announce(translate(result.reason));
      return;
    }
    dispatch({ type: "apply-arranged", layout: result.layout, selected: result.selected });
    // W-770: a keyboard move only announced refusals; say where the element landed.
    if (MOVES.has(run)) announce(movedTo(result.layout, id));
    if (result.note) {
      announce(translate("Duplicated. {note}", { note: translate(result.note) }));
      if (lastToast.current) toasts.close(lastToast.current);
      lastToast.current = toasts.add({
        title: translate("Duplicated"),
        description: translate(result.note),
        timeout: NOTICE_TIMEOUT_MS,
      });
    }
  };

  const duplicate = (id: string) => arrange(id, duplicateNode);
  const wrap = (id: string, type: WrapType) =>
    arrange(id, (layout, nodeId) => wrapNode(layout, nodeId, type));

  /** Accordion and Tabs item list (W-130): the parent stays selected so the list stays open. */
  const items: ItemActions = {
    add: (parentId, node) => {
      const layout = latest.current.page.layout;
      const parent = layout ? findNode(layout, parentId) : undefined;
      if (!layout || !parent) return;
      const index =
        "children" in parent && Array.isArray(parent.children) ? parent.children.length : 0;
      const result = addNode(layout, node, { parentId, index });
      if (!result.ok) {
        announce(translate(result.reason));
        return;
      }
      dispatch({ type: "apply-arranged", layout: result.layout, selected: parentId });
      announce(translate("{name} added", { name: translate(ELEMENT_NAMES[node.type] ?? "Item") }));
    },
    remove: (id) => remove(id),
    move: (id, direction) => {
      const layout = latest.current.page.layout;
      if (!layout) return;
      const result = (direction === "up" ? moveUp : moveDown)(layout, id);
      if (!result.ok) {
        announce(translate(result.reason));
        return;
      }
      dispatch({
        type: "apply-arranged",
        layout: result.layout,
        selected: latest.current.selectedId ?? result.selected,
      });
    },
  };

  const notice = (message: string) => {
    announce(translate(message));
    if (lastToast.current) toasts.close(lastToast.current);
    lastToast.current = toasts.add({ title: translate(message), timeout: NOTICE_TIMEOUT_MS });
  };

  /** Puts a new element (or a recipe's section) where the selection says (W-175). */
  const place = (layout: Layout, node: LayoutNode, label: string, section = false) => {
    const result = (section ? addSectionNear : addNodeNear)(
      layout,
      node,
      latest.current.selectedId,
    );
    if (!result.ok) {
      notice(result.reason);
      return;
    }
    dispatch({ type: "apply-arranged", layout: result.layout, selected: result.selected });
    const nameOf = (id: string) =>
      translate(ELEMENT_NAMES[findNode(layout, id)?.type ?? "container"] ?? "Container");
    if (result.fallback) {
      // Added next to the nearest ancestor that takes it, rather than refused (W-175).
      const after = nameOf(result.fallback.after) ?? translate("the selection");
      notice(
        translate("{name} added after {after} instead. {reason}", {
          name: label,
          after,
          reason: translate(result.fallback.refused),
        }),
      );
      return;
    }
    announce(
      translate("{name} added inside {parent}", {
        name: label,
        parent: nameOf(result.parentId) ?? translate("Container"),
      }),
    );
  };

  const addFromPanel = (type: ElementType) => {
    const current = latest.current.page.layout;
    if (!current && type === "container") {
      dispatch({ type: "add-root-container" });
      return;
    }
    // UX-094: an empty page (one made outside EmVB has no layout) gets its container first, so
    // a click or palette insert lands instead of doing nothing.
    const layout = current ?? startingLayout();
    const node = newElement(type);
    if (!node) return;
    place(layout, node, translate(ELEMENT_DESCRIPTORS.find((d) => d.type === type)?.name ?? type));
  };

  /** A section recipe built from the site's styles (W-320). */
  const addRecipe = (id: string) => {
    const layout = latest.current.page.layout ?? startingLayout();
    const node = recipeNode(id, latest.current.design, layout);
    if (!node) return;
    place(
      layout,
      withFreshIds(layout, node),
      translate("{name} section", {
        name: node.label ? translate(node.label) : translate("Section"),
      }),
      true,
    );
  };

  return {
    deleteAsk,
    setDeleteAsk,
    canDelete,
    canMove,
    finishDelete,
    remove,
    arrange,
    duplicate,
    wrap,
    addFromPanel,
    addRecipe,
    items,
  };
}

/** One empty container, the start of a page that has no layout yet (UX-094). */
const startingLayout = (): Layout => ({
  schemaVersion: LAYOUT_SCHEMA_VERSION,
  root: { id: newNodeId(), type: "container", props: {}, children: [] },
});
