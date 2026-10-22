/**
 * [INPUT]: 依赖布局选择、站点样式与字段模式标记。
 * [OUTPUT]: 提供元素设置及站点样式面板。
 * [POS]: 编辑器右栏；字段模式将页面元数据留给宿主。
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import type * as React from "react";
import type { Deletion } from "../restore-deleted.ts";
import type { DesignSystem, LayoutNode, PopupDevice } from "../../../core/index.ts";
import type { Fetcher } from "../../api.ts";
import type { EditorAction, EditorState } from "../store.ts";
import { ElementPanel } from "./ElementPanel.tsx";
import type { ItemActions } from "./settings/ItemList.tsx";
import type { StyleStateChoice } from "./settings/StateSwitcher.tsx";
import { PageSettings } from "./PageSettings.tsx";
import { SiteStylesDrawer } from "./SiteStylesDrawer.tsx";

/** The right panel: Site styles when open, else the selected element's settings, else page settings. */
export function SettingsPanel({
  state,
  latest,
  dispatch,
  selectedNode,
  siteStylesOpen,
  onCloseSiteStyles,
  onDesignChange,
  onPublishStyles,
  onDesignItemDeleted,
  fetcher,
  formsAvailable,
  rejection,
  slugError,
  onSlugEdit,
  kind,
  onStyleState,
  device = "desktop",
  items,
  fieldMode = false,
}: {
  state: EditorState;
  latest: React.RefObject<EditorState>;
  dispatch: React.Dispatch<EditorAction>;
  selectedNode: LayoutNode | null | undefined;
  siteStylesOpen: boolean;
  onCloseSiteStyles: () => void;
  onDesignChange: (design: DesignSystem) => Promise<void>;
  onPublishStyles: () => Promise<void>;
  /** W-252: a variable or class deleted from Site styles, so undo can put it back. */
  onDesignItemDeleted?: (deletion: Deletion) => void;
  fetcher: Fetcher;
  formsAvailable: boolean;
  rejection: string | null;
  slugError: string | null;
  onSlugEdit: () => void;
  kind: "page" | "theme-part";
  /** The Style tab's chosen state, for the canvas preview (W-089). */
  onStyleState?: (nodeId: string, state: StyleStateChoice) => void;
  /** Which device's styles the Style tab edits (W-096). */
  device?: PopupDevice;
  /** Accordion and Tabs item actions (W-130). */
  items?: ItemActions;
  fieldMode?: boolean;
}) {
  return (
    <aside
      className="emvb-panel emvb-panel-right"
      aria-label={
        siteStylesOpen ? "Site styles" : selectedNode ? "Element settings" : "Page settings"
      }
    >
      {siteStylesOpen ? (
        <SiteStylesDrawer
          design={state.design}
          layout={state.page.layout}
          onDesignChange={onDesignChange}
          unpublished={state.designUnpublished === true}
          published={state.publishedDesign}
          onPublishStyles={onPublishStyles}
          {...(onDesignItemDeleted ? { onDeleted: onDesignItemDeleted } : {})}
          onLayoutChange={(layout) =>
            dispatch({
              type: "apply-arranged",
              layout,
              selected: latest.current.selectedId ?? layout.root.id,
            })
          }
          onClose={onCloseSiteStyles}
        />
      ) : selectedNode ? (
        <ElementPanel
          key={selectedNode.id}
          node={selectedNode}
          layout={state.page.layout}
          design={state.design}
          rejection={rejection}
          fetcher={fetcher}
          formsAvailable={formsAvailable}
          onChange={(node: LayoutNode) =>
            dispatch({ type: "update-node", id: node.id, update: () => node })
          }
          onDesignChange={onDesignChange}
          onSelect={(id) => dispatch({ type: "select", id })}
          onStyleState={onStyleState}
          device={device}
          items={items}
          partType={state.page.partType}
          onArrange={(run) => {
            const layout = state.page.layout;
            if (!layout) return;
            const result = run(layout);
            if (result.ok) {
              dispatch({
                type: "apply-arranged",
                layout: result.layout,
                selected: result.selected,
              });
            }
          }}
        />
      ) : fieldMode ? (
        <div className="p-4" data-emvb-field-settings="">
          <h2>页面正文</h2>
          <p>选择画布元素以修改内容和样式。</p>
          <p>应用后，Page 表单负责保存草稿（含自动保存）和发布。</p>
          <p>Site styles 独立保存，需单独发布；取消正文不会撤销站点样式。</p>
        </div>
      ) : (
        <PageSettings
          page={state.page}
          slugError={slugError}
          kind={kind}
          fetcher={fetcher}
          onChange={(patch) => {
            if (patch.slug !== undefined) onSlugEdit();
            dispatch({ type: "set-page", patch });
          }}
        />
      )}
    </aside>
  );
}
