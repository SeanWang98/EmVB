/**
 * [INPUT]: 依赖真实编辑器、字段会话和只读模拟 API。
 * [OUTPUT]: 验证加载错误切语言，不重请求或改写 API 原文。
 * [POS]: 加载边界回归；损坏布局保持错误，不转成空画布。
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import { afterEach, expect, test } from "bun:test";
import { act } from "react";
import { cleanup, mount, settle } from "../../../test/dom/mount.ts";
import { emptyDesign } from "../../core/index.ts";
import type { Fetcher } from "../api.ts";
import { Editor } from "./Editor.tsx";
import { FieldEditor } from "./FieldEditor.tsx";

const originalLanguage = document.documentElement.lang;
afterEach(async () => {
  await cleanup();
  document.documentElement.lang = originalLanguage;
});
const switchToEnglish = async () => {
  await act(async () => {
    document.documentElement.lang = "en";
    await settle();
  });
};
const noop = () => undefined;

test("字段损坏错误随语言切换，不读取设计或应用字段值", async () => {
  document.documentElement.lang = "zh-CN";
  let calls = 0;
  let applies = 0;
  const fetcher: Fetcher = async () => {
    calls++;
    return Response.json({});
  };
  await mount(
    <FieldEditor
      value="{not json"
      label="Brand canvas"
      fetcher={fetcher}
      onApply={() => applies++}
      onCancel={noop}
    />,
  );
  expect(document.querySelector(".emvb-state")?.textContent).toContain(
    "此页面的画布数据无法读取，原值未修改。",
  );
  await switchToEnglish();
  expect(document.querySelector(".emvb-state")?.textContent).toContain(
    "This page’s canvas data cannot be read. The original value was not changed.",
  );
  expect(document.querySelector("iframe")).toBeNull();
  expect(calls).toBe(0);
  expect(applies).toBe(0);
});

test("独立页面损坏错误切语言，不重新请求内容或设计", async () => {
  document.documentElement.lang = "zh-CN";
  const calls: string[] = [];
  const fetcher: Fetcher = async (path) => {
    calls.push(path);
    return path.endsWith("/design/draft")
      ? Response.json({ data: { design: emptyDesign() } })
      : Response.json({ data: { item: { data: { layout: "{not json" } } } });
  };
  await mount(<Editor fetcher={fetcher} entryId="01BROKEN" />);
  await settle();
  expect(document.querySelector(".emvb-state")?.textContent).toContain("无法读取此页面的布局。");
  const before = [...calls];
  await switchToEnglish();
  expect(document.querySelector(".emvb-state")?.textContent).toContain(
    "This page's layout can't be read.",
  );
  expect(document.querySelector("iframe")).toBeNull();
  expect(calls).toEqual(before);
});

test("API 错误即使与词条同名也保留原文", async () => {
  document.documentElement.lang = "zh-CN";
  let calls = 0;
  const fetcher: Fetcher = async () => {
    calls++;
    return Response.json({ error: { code: "SERVER_ERROR", message: "Cancel" } }, { status: 500 });
  };
  await mount(<Editor fetcher={fetcher} entryId="01FAILED" />);
  await settle();
  expect(document.querySelector(".emvb-state")?.textContent).toContain("Cancel");
  const before = calls;
  await switchToEnglish();
  expect(document.querySelector(".emvb-state")?.textContent).toContain("Cancel");
  expect(calls).toBe(before);
});
