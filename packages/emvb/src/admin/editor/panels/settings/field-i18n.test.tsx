/**
 * [INPUT]: 依赖后台语言、字段控件与 DOM 测试挂载器。
 * [OUTPUT]: 验证中文字段、校验插值与原始数据边界。
 * [POS]: 设置字段的语言回归；不依赖整页快照。
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import { afterEach, expect, test } from "bun:test";
import { act } from "react";
import type { LayoutNode, FieldDescriptor } from "../../../../core/index.ts";
import { createTranslator } from "../../../i18n/index.ts";
import { cleanup, mount, settle } from "../../../../../test/dom/mount.ts";
import { FieldControl } from "./FieldControl.tsx";
import { fieldNameError } from "./FieldBindControl.tsx";
import { imageAltNote } from "./image-alt.ts";
import { svgImagesNotice } from "./svg-images.ts";
import { ChoiceGroup, LAYOUT_CHOICES } from "./ChoiceGroup.tsx";

const originalLanguage = document.documentElement.lang;
afterEach(async () => {
  await cleanup();
  document.documentElement.lang = originalLanguage;
});

test("field errors translate dynamic counts and retain the English helper contract", () => {
  const t = createTranslator("zh-CN");
  expect(fieldNameError("x".repeat(81), t)).toBe("最多输入 80 个字符。");
  expect(fieldNameError("x".repeat(81))).toBe("Use at most 80 characters.");
  expect(svgImagesNotice(2, t)).toContain("2 张外部图片");
  expect(svgImagesNotice(2)).toContain("2 external images");
});

test("Chinese image feedback keeps user-provided alt text unchanged", () => {
  const node: LayoutNode = {
    id: "image0001",
    type: "image",
    props: { src: "/image.jpg", alt: "Color.jpg" },
  };
  const note = imageAltNote(node, createTranslator("zh-CN"));
  expect(note).toContain("“Color.jpg”没有说明图片内容");
  expect(node.props).toEqual({ src: "/image.jpg", alt: "Color.jpg" });
});

test("Chinese boolean chrome preserves the user's content and stored prop name", async () => {
  document.documentElement.lang = "zh-CN";
  const changes: LayoutNode[] = [];
  const field: FieldDescriptor = { key: "newTab", kind: "boolean", label: "Open in a new tab" };
  const node: LayoutNode = {
    id: "button001",
    type: "button",
    props: { text: "Color", href: "/pricing" },
  };
  const host = await mount(
    <FieldControl field={field} node={node} onChange={(next) => changes.push(next)} />,
  );
  const toggle = host.querySelector<HTMLElement>('[role="switch"]');
  expect(host.textContent).toContain("在新标签页打开");
  await act(async () => toggle?.click());
  expect(changes[0]?.props).toEqual({ text: "Color", href: "/pricing", newTab: true });
});

test("layout choices follow language changes while committing CSS enum values", async () => {
  document.documentElement.lang = "en";
  const values: string[] = [];
  const host = await mount(
    <ChoiceGroup
      label="Direction"
      value="row"
      options={LAYOUT_CHOICES.flexDirection ?? []}
      onChange={(value) => values.push(value)}
    />,
  );
  expect(host.querySelector('[data-emvb-choice="column"]')?.getAttribute("aria-label")).toBe(
    "Column",
  );
  await act(async () => {
    document.documentElement.lang = "zh-CN";
    await settle();
  });
  const column = host.querySelector<HTMLButtonElement>('[data-emvb-choice="column"]');
  expect(column?.getAttribute("aria-label")).toBe("纵向");
  await act(async () => column?.click());
  expect(values).toEqual(["column"]);
});
