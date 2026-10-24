/**
 * [INPUT]: 依赖后台语言订阅与真实面板组件。
 * [OUTPUT]: 验证语言切换、双语搜索及用户内容隔离。
 * [POS]: 面板集成回归；不替代画布保存与发布测试。
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import { afterEach, expect, test } from "bun:test";
import { act } from "react";
import { emptyDesign, type Layout } from "../../../core/index.ts";
import { cleanup, mount, settle } from "../../../../test/dom/mount.ts";
import { AddPanel } from "./AddPanel.tsx";
import { LayersPanel } from "./LayersPanel.tsx";
import { PageSettings } from "./PageSettings.tsx";
import type { PagePatch } from "../store.ts";
import { ElementPanel } from "./ElementPanel.tsx";
import { LocalizedMessageError } from "../localized-message.ts";

const originalLanguage = document.documentElement.lang;
const noop = () => {};

afterEach(async () => {
  await cleanup();
  document.documentElement.lang = originalLanguage;
});

const language = async (value: string) => {
  await act(async () => {
    document.documentElement.lang = value;
    await Promise.resolve();
  });
  await settle();
};

test.each(["按钮", "button", "BUTTON"])(
  "Add search finds %s without changing saved element type",
  async (query) => {
    document.documentElement.lang = "zh-CN";
    const selected: string[] = [];
    const host = await mount(
      <AddPanel defaultQuery={query} onAdd={(type) => selected.push(type)} />,
    );
    const tile = host.querySelector<HTMLButtonElement>('[data-emvb-add-tile="button"]');
    expect(tile?.textContent).toBe("按钮");
    await act(async () => tile?.click());
    expect(selected.at(-1)).toBe("button");
  },
);

test("switching language preserves Add search input and reuses the mounted panel", async () => {
  document.documentElement.lang = "en";
  const host = await mount(<AddPanel defaultQuery="head" onAdd={noop} />);
  const search = host.querySelector<HTMLInputElement>('input[type="search"]');
  expect(search?.getAttribute("aria-label")).toBe("Search elements");
  await language("zh-CN");
  expect(host.querySelector('input[type="search"]')).toBe(search);
  expect(search?.value).toBe("head");
  expect(search?.getAttribute("aria-label")).toBe("搜索元素");
  expect(host.querySelector('[data-emvb-add-tile="heading"]')?.textContent).toBe("标题");
  await language("en");
  expect(search?.getAttribute("aria-label")).toBe("Search elements");
  expect(search?.value).toBe("head");
});

test("memoized Layers rows translate type labels but retain user names and text", async () => {
  const layout: Layout = {
    schemaVersion: 17,
    root: {
      id: "root0001",
      type: "container",
      props: {},
      children: [
        {
          id: "head0001",
          type: "heading",
          label: "Delete",
          props: { text: "Content", level: 2 },
          audience: { countries: ["US"], devices: ["mobile"], segments: ["mobile"], days: [1] },
        },
        { id: "head0002", type: "heading", props: { text: "Keep this sentence", level: 2 } },
      ],
    },
  };
  const snapshot = JSON.stringify(layout);
  document.documentElement.lang = "en";
  const host = await mount(
    <LayersPanel
      layout={layout}
      selectedId="head0001"
      onSelect={noop}
      onDuplicate={noop}
      onMoveUp={noop}
      onMoveDown={noop}
      onDelete={noop}
    />,
  );
  await language("zh-CN");
  const named = host.querySelector('[data-emvb-layer="head0001"]');
  const unnamed = host.querySelector('[data-emvb-layer="head0002"]');
  expect(named?.querySelector(".emvb-layer-name")?.textContent).toBe("Delete");
  expect(named?.querySelector(".emvb-layer-preview")?.textContent).toBe("Content");
  expect(named?.querySelector(".emvb-ab-badge")?.getAttribute("title")).toBe(
    "仅向US · 手机 · mobile · 周一显示",
  );
  expect(unnamed?.querySelector(".emvb-layer-name")?.textContent).toBe("标题");
  expect(unnamed?.querySelector(".emvb-layer-preview")?.textContent).toBe("Keep this sentence");
  expect(JSON.stringify(layout)).toBe(snapshot);
});

test("Page settings localize chrome while retaining the user's unsaved metadata", async () => {
  document.documentElement.lang = "en";
  const patches: PagePatch[] = [];
  const page = {
    title: "Delete",
    slug: "my-brand",
    canvasMode: "site-layout",
    seoTitle: "Content",
    seoDescription: "English copy stays English.",
    layout: null,
  };
  const host = await mount(
    <PageSettings page={page} slugError={null} onChange={(patch) => patches.push(patch)} />,
  );
  const title = host.querySelector<HTMLInputElement>("input");
  await language("zh-CN");
  expect(host.querySelector("h2")?.textContent).toBe("页面设置");
  expect(title?.value).toBe("Delete");
  expect(
    [...host.querySelectorAll<HTMLInputElement>("input")].some(
      (input) => input.value === "my-brand",
    ),
  ).toBe(true);
  expect(patches).toEqual([]);
  expect(page.seoTitle).toBe("Content");
});

test.each(["source", "literal"] as const)(
  "Element class save keeps %s failures distinct while switching language",
  async (mode) => {
    document.documentElement.lang = "en";
    const node = {
      id: "root0001",
      type: "container",
      props: {},
      children: [],
      classes: ["card"],
    } as const;
    const host = await mount(
      <ElementPanel
        node={{ ...node, children: [], classes: ["card"] }}
        layout={null}
        design={{
          ...emptyDesign(),
          classes: [{ id: "card", name: "Button", style: { gap: { value: 16, unit: "px" } } }],
        }}
        rejection={null}
        fetcher={async () => new Response("{}")}
        onChange={noop}
        onDesignChange={async () => {
          throw mode === "source"
            ? new LocalizedMessageError("Couldn't save the class. Try again.")
            : new Error("Cancel");
        }}
        onSelect={noop}
      />,
    );
    await act(async () =>
      host.querySelector<HTMLButtonElement>('[data-emvb-class-id="card"] .emvb-chip-main')?.click(),
    );
    const reset = host.querySelector<HTMLButtonElement>(
      '[data-emvb-style="gap"] [aria-label="Reset Gap to default"]',
    );
    expect(reset).not.toBeNull();
    await act(async () => reset?.click());
    await settle();
    expect(host.querySelector('[role="alert"]')?.textContent).toBe(
      mode === "source" ? "Couldn't save the class. Try again." : "Cancel",
    );
    await language("zh-CN");
    expect(host.querySelector('[role="alert"]')?.textContent).toBe(
      mode === "source" ? "无法保存样式类，请重试。" : "Cancel",
    );
  },
);
