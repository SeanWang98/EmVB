/**
 * [INPUT]: 依赖真实画布组件、DOM 挂载器与后台根语言。
 * [OUTPUT]: 验证空态提示翻译且保留用户内容与画布会话。
 * [POS]: canvas 的语言切换回归，不读取组件源码。
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import { afterEach, expect, test } from "bun:test";
import { act, createElement } from "react";
import { cleanup, mount } from "../../../../test/dom/mount.ts";
import { CanvasFrame, type CanvasSelection } from "./CanvasFrame.tsx";
import type { Layout, VNode } from "../../../core/index.ts";

const selection: CanvasSelection = {
  selectedId: null,
  labelFor: () => "User element",
  canDelete: () => true,
  canMove: () => true,
  canDuplicate: () => true,
  onSelect: () => {},
  onDelete: () => {},
  onDuplicate: () => {},
  onKeyDown: () => {},
};
afterEach(async () => {
  await cleanup();
  document.documentElement.lang = "en";
});

test("UX-019: an empty page's root fills the canvas and says how to start", async () => {
  document.documentElement.lang = "en";
  await mount(
    createElement(CanvasFrame, {
      vnode: { tag: "div", attrs: { class: "emvb-root" }, children: [] },
      css: "",
      layout: null,
      selection,
      onDropNew: () => {},
      onMove: () => {},
      onCommitText: () => {},
    }),
  );
  const iframe = document.querySelector("iframe") as HTMLIFrameElement;
  await act(async () => {
    iframe.dispatchEvent(new Event("load"));
  });
  const style = iframe.contentDocument?.querySelector("[data-emvb-editor-canvas-css]")?.textContent;
  expect(style).toContain(":where(.emvb-root:empty){min-height:100vh}");
  expect(style).toContain("Drag an element here from Add to start building");
  expect(style).not.toContain("start this page");
});

test("canvas language changes preserve the frame and user content", async () => {
  document.documentElement.lang = "en";
  const layout: Layout = {
    schemaVersion: 17,
    root: { id: "root0001", type: "container", props: {}, children: [] },
  };
  const vnode: VNode = {
    tag: "div",
    attrs: { class: "emvb-root" },
    children: ["Drop elements here"],
  };
  const before = JSON.stringify({ layout, vnode });
  await mount(
    createElement(CanvasFrame, {
      vnode,
      css: "",
      layout,
      selection,
      onDropNew: () => {},
      onMove: () => {},
      onCommitText: () => {},
    }),
  );
  const iframe = document.querySelector("iframe") as HTMLIFrameElement;
  await act(async () => {
    iframe.dispatchEvent(new Event("load"));
  });
  await act(async () => {
    document.documentElement.lang = "zh-CN";
    await new Promise((r) => setTimeout(r, 0));
  });
  expect(document.querySelector("iframe")).toBe(iframe);
  expect(iframe.title).toBe("页面画布");
  expect(iframe.contentDocument?.body.textContent).toBe("Drop elements here");
  const style = iframe.contentDocument?.querySelector("[data-emvb-editor-canvas-css]")?.textContent;
  expect(style).toContain("从“添加”面板拖入元素，开始搭建");
  expect(style).toContain("将元素拖到此处");
  expect(JSON.stringify({ layout, vnode })).toBe(before);
});
