/**
 * [INPUT]: 依赖真实列表、创建表单、字段组件与界面翻译。
 * [OUTPUT]: 验证语言切换保留输入、错误原因与 API 原文。
 * [POS]: 页面后台的语言回归；不替换数据层或持久化接口。
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import { afterEach, expect, test } from "bun:test";
import { act } from "react";
import type { Fetcher } from "../api.ts";
import { createTranslator } from "../i18n/index.ts";
import { conditionRuleLabel, summarizeConditions } from "../theme-api.ts";
import { planSetup } from "../setup/plan.ts";
import { LayoutField } from "../widgets/LayoutField.tsx";
import { PageList } from "./PageList.tsx";
import { AgentsPage } from "./AgentsPage.tsx";
import { NewPageDialog } from "./NewPageDialog.tsx";
import { ThemePartList } from "./ThemePartList.tsx";
import { cleanup, mount, settle } from "../../../test/dom/mount.ts";
import { s1Page } from "../../../test/fixtures/layouts.ts";

const initialLang = document.documentElement.lang;
afterEach(async () => {
  await cleanup();
  document.documentElement.lang = initialLang;
});
const language = async (locale: string) => {
  await act(async () => {
    document.documentElement.lang = locale;
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
};
const replying =
  (items: unknown[]): Fetcher =>
  async () =>
    Response.json({ data: { items } });

const fill = async (input: HTMLInputElement, value: string) => {
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
};
const submitPage = async () => {
  const form = document.querySelector<HTMLFormElement>('[data-emvb-dialog="new-page"]');
  if (!form) throw new Error("Missing new page form");
  await act(async () => form.requestSubmit());
  await settle();
};

test("Chinese page list translates chrome and preserves a user title that matches an English key", async () => {
  await language("zh-CN");
  const host = await mount(
    <PageList
      fetcher={replying([
        { id: "page", slug: "new-page", status: "published", data: { title: "New page" } },
      ])}
    />,
  );
  await settle();
  expect(host.querySelector("h1")?.textContent).toBe("可视化页面");
  expect(host.querySelector("a.emvb-row-title")?.textContent).toBe("New page");
  expect(host.querySelector(".emvb-row-slug")?.textContent).toBe("/new-page");
  expect(host.querySelector("[data-status]")?.textContent).toBe("已发布");
  await language("en");
  expect(host.querySelector("h1")?.textContent).toBe("Pages VisualBuilder");
  expect(host.querySelector("a.emvb-row-title")?.textContent).toBe("New page");
});

test("changing language keeps the new page's unsaved title and slug without a write", async () => {
  await language("zh-CN");
  const writes: string[] = [];
  const fetcher: Fetcher = async (path, init) => {
    if (init?.method && init.method !== "GET") writes.push(path);
    return Response.json({ data: { items: [] } });
  };
  await mount(<NewPageDialog fetcher={fetcher} open onOpenChange={() => {}} />);
  const fields = [...document.querySelectorAll<HTMLInputElement>("input")];
  const title = fields[0];
  const slugField = fields[1];
  if (!title || !slugField) throw new Error("Missing create fields");
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(
      title,
      "Brand 中文",
    );
    title.dispatchEvent(new Event("input", { bubbles: true }));
  });
  const slug = slugField.value;
  expect(document.querySelector('[data-emvb-dialog="new-page"]')?.textContent).toContain(
    "新建页面",
  );
  await language("en");
  expect(title.value).toBe("Brand 中文");
  expect(slugField.value).toBe(slug);
  expect(document.querySelector('[data-emvb-dialog="new-page"]')?.textContent).toContain(
    "New page",
  );
  expect(writes).toEqual([]);
});

test("an existing required-title error changes from Chinese to English without resubmitting", async () => {
  await language("zh-CN");
  let writes = 0;
  const fetcher: Fetcher = async (_path, init) => {
    if (init?.method && init.method !== "GET") writes++;
    return Response.json({ data: { items: [] } });
  };
  await mount(<NewPageDialog fetcher={fetcher} open onOpenChange={() => {}} />);
  await submitPage();
  const title = document.querySelector<HTMLInputElement>('input[aria-invalid="true"]');
  expect(document.body.textContent).toContain("请输入页面标题。");
  expect(document.activeElement).toBe(title);
  await language("en");
  expect(document.body.textContent).toContain("Enter a title for the page.");
  expect(document.body.textContent).not.toContain("请输入页面标题。");
  expect(document.activeElement).toBe(title);
  const slug = document.querySelectorAll<HTMLInputElement>("input")[1];
  if (!title || !slug) throw new Error("Missing create fields");
  await fill(title, "Brand content");
  await fill(slug, "!!!");
  await submitPage();
  expect(document.body.textContent).toContain("Enter a slug using letters, digits or -.");
  await language("zh-CN");
  expect(document.body.textContent).toContain("请输入由字母、数字或连字符组成的路径名。");
  expect(document.activeElement).toBe(slug);
  expect(writes).toBe(0);
});

test("a failed create changes its UI language and preserves the API message literally", async () => {
  await language("zh-CN");
  let writes = 0;
  const fetcher: Fetcher = async (_path, init) => {
    if (init?.method === "POST") {
      writes++;
      return Response.json({ error: { code: "REJECTED", message: "New page" } }, { status: 422 });
    }
    return Response.json({ data: { items: [] } });
  };
  await mount(<NewPageDialog fetcher={fetcher} open onOpenChange={() => {}} />);
  const title = document.querySelector<HTMLInputElement>("input");
  if (!title) throw new Error("Missing title field");
  await fill(title, "Brand content");
  await submitPage();
  expect(document.querySelector('[role="alert"]')?.textContent).toBe("无法创建页面。New page");
  await language("en");
  expect(document.querySelector('[role="alert"]')?.textContent).toBe(
    "Couldn't create the page. New page",
  );
  expect(title.value).toBe("Brand content");
  expect(writes).toBe(1);
});

test("an AI agent save recovery notice follows the current language and preserves raw failure text", async () => {
  await language("zh-CN");
  let writes = 0;
  const fetcher: Fetcher = async (path) => {
    if (path === "/_emdash/api/auth/me") {
      return Response.json({ data: { id: "admin", role: 50 } });
    }
    if (path.endsWith("/agents/save")) {
      writes++;
      return Response.json({ error: { code: "CONFLICT", message: "New page" } }, { status: 409 });
    }
    return Response.json({
      data: {
        settings: { mcpEnabled: false, publishPages: false, publishStyles: false },
        revision: "r1",
        endpoint: "https://example.com/_emdash/api/mcp",
        activity: [],
      },
    });
  };
  const host = await mount(<AgentsPage fetcher={fetcher} />);
  await settle();
  await settle();
  const toggle = host.querySelector<HTMLButtonElement>('button[role="switch"]');
  if (!toggle) throw new Error("Missing agent master switch");
  await act(async () => toggle.click());
  await settle();
  await settle();
  expect(host.textContent).toContain("New page 已显示最新设置，请重新修改。");
  await language("en");
  expect(host.textContent).toContain(
    "New page The latest settings are shown now; make your change again.",
  );
  expect(host.textContent).not.toContain("已显示最新设置");
  expect(writes).toBe(1);
});

test("Chinese theme list translates system labels while preserving a user part name", async () => {
  await language("zh-CN");
  const host = await mount(
    <ThemePartList
      fetcher={replying([
        {
          id: "header",
          slug: "header",
          status: "published",
          data: {
            title: "Header",
            part_type: "header",
            conditions: {
              rules: [{ op: "include", group: "general", name: "entire_site", args: {} }],
            },
          },
        },
      ])}
    />,
  );
  await settle();
  expect(host.querySelector("a.emvb-row-title")?.textContent).toBe("Header");
  expect(host.querySelector('[data-emvb-row="header"]')?.textContent).toContain("整个站点");
  expect(host.querySelector('[role="tablist"]')?.textContent).toContain("页头");
});

test("translated conditions preserve custom collection and taxonomy values, and default English stays stable", () => {
  const t = createTranslator("zh-CN");
  const custom = { group: "singular", name: "collection", args: { collection: "Pages" } };
  expect(conditionRuleLabel(custom, t)).toBe("Pages（全部）");
  expect(conditionRuleLabel(custom)).toBe("Pages (all)");
  expect(
    conditionRuleLabel(
      { group: "archive", name: "taxonomy", args: { taxonomy: "Tag", slug: "Header" } },
      t,
    ),
  ).toBe("Tag：Header");
  expect(
    summarizeConditions(
      {
        rules: [{ op: "exclude", group: "singular", name: "entry", args: { collection: "pages" } }],
      },
      t,
    ),
  ).toBe("排除：页面中的单个条目");
  const plan = planSetup(
    { slug: "emvb_pages", fields: [{ slug: "title", type: "json" }] },
    null,
    t,
  );
  expect(plan.conflicts[0]).toContain("字段“title”类型为 json");
  expect(plan.steps.find((step) => step.kind === "create-collection")?.body).toMatchObject({
    label: "Theme parts",
  });
});

test("the read-only layout field translates its summary without translating its host label", async () => {
  await language("zh-CN");
  const host = await mount(
    <LayoutField
      id="layout"
      label="User field name"
      value={s1Page()}
      onChange={() => {
        throw new Error("read-only field wrote data");
      }}
    />,
  );
  expect(host.textContent).toContain("2 个元素 · 结构版本 17");
  expect(host.textContent).toContain("User field name");
  expect(host.querySelector("a")?.textContent).toMatch(/EmVB|可视化页面/);
});
