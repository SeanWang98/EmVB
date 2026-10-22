/**
 * [INPUT]: 依赖后台页面、布局摘要与受控画布字段。
 * [OUTPUT]: 导出插件页面及 layout、canvas 字段组件。
 * [POS]: EmDash 原生后台注册边界。
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import type { PluginAdminExports } from "emdash";
import { installSidebarShim } from "./access/sidebar-shim.ts";
import { defaultFetcher } from "./api.ts";
import { EditorPage } from "./pages/EditorPage.tsx";
import { PagesPage } from "./pages/PagesPage.tsx";
import { AgentsPage } from "./pages/AgentsPage.tsx";
import { ThemeBuilderPage } from "./pages/ThemeBuilderPage.tsx";
import { LayoutField } from "./widgets/LayoutField.tsx";
import { CanvasField } from "./widgets/CanvasField.tsx";

if (typeof document !== "undefined") void installSidebarShim(document, defaultFetcher);

/** `/pages`, `/theme` and `/agents` are declared; `/editor` renders by URL (D-024). */
export const pages: PluginAdminExports["pages"] = {
  "/pages": PagesPage,
  "/theme": ThemeBuilderPage,
  "/agents": AgentsPage,
  "/editor": EditorPage,
};

export const fields: PluginAdminExports["fields"] = {
  layout: LayoutField,
  canvas: CanvasField,
};
