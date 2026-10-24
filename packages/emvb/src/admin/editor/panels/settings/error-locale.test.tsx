/**
 * [INPUT]: 依赖数值、图片源、背景字段及后台根语言。
 * [OUTPUT]: 验证错误随语言重绘，失败快照与未提交草稿保持独立。
 * [POS]: 设置字段的错误语言回归；禁止语言切换触发内容写入。
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import { afterEach, expect, test } from "bun:test";
import { act } from "react";
import type { LayoutNode } from "../../../../core/index.ts";
import { cleanup, mount, settle } from "../../../../../test/dom/mount.ts";
import { ImageSourcesField } from "./ImageSourcesField.tsx";
import { NumberField } from "./NumberRow.tsx";
import { BackgroundImageControl } from "./BackgroundControls.tsx";
import { MediaPicker } from "./MediaPicker.tsx";
import type { Fetcher } from "../../../api.ts";

const originalLanguage = document.documentElement.lang;
afterEach(async () => {
  await cleanup();
  document.documentElement.lang = originalLanguage;
});

async function edit(field: HTMLInputElement | HTMLTextAreaElement, text: string) {
  const prototype =
    field instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype;
  await act(async () => {
    Object.getOwnPropertyDescriptor(prototype, "value")?.set?.call(field, text);
    field.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

async function language(locale: string) {
  await act(async () => {
    document.documentElement.lang = locale;
    await settle();
  });
}

test("a committed number error follows the language without changing or saving its draft", async () => {
  document.documentElement.lang = "en";
  const sent: (number | undefined)[] = [];
  const host = await mount(
    <NumberField
      fieldKey="opacity"
      label="Opacity"
      value={undefined}
      spec={{ min: 0, max: 100, example: "50" }}
      onCommit={(value) => sent.push(value)}
    />,
  );
  const input = host.querySelector<HTMLInputElement>("input");
  if (!input) throw new Error("Missing number field");
  await edit(input, "101");
  await act(async () => {
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
  });
  expect(host.textContent).toContain("Opacity can be from 0 to 100.");
  expect(input.getAttribute("aria-invalid")).toBe("true");

  await language("zh-CN");
  expect(host.textContent).toContain("不透明度的范围是 0 到 100。");
  expect(host.textContent).not.toContain("Opacity can be");
  expect(input.value).toBe("101");
  expect(input.getAttribute("aria-invalid")).toBe("true");
  expect(sent).toEqual([]);

  await language("en");
  expect(host.textContent).toContain("Opacity can be from 0 to 100.");
  expect(input.value).toBe("101");
  expect(sent).toEqual([]);
});

test("a source error translates the failed snapshot while preserving newer uncommitted text", async () => {
  document.documentElement.lang = "en";
  const sent: LayoutNode[] = [];
  const node: LayoutNode = {
    id: "image0001",
    type: "image",
    props: { src: "/original.jpg", alt: "Original photo" },
  };
  const host = await mount(
    <ImageSourcesField node={node} onChange={(value) => sent.push(value)} />,
  );
  const area = host.querySelector<HTMLTextAreaElement>("textarea");
  if (!area) throw new Error("Missing source field");
  await edit(area, "/failed-source.jpg");
  await act(async () => {
    area.dispatchEvent(new FocusEvent("focusout", { bubbles: true }));
  });
  const error = () => host.querySelector("[data-emvb-sources-error]")?.textContent;
  expect(error()).toBe(
    '"/failed-source.jpg": write the URL, a space, then its width in px (1–8000).',
  );

  await edit(area, "/new-source.jpg 480");
  await language("zh-CN");
  expect(error()).toBe("“/failed-source.jpg”：请输入 URL、空格和图片宽度（1–8000 像素）。");
  expect(error()).not.toContain("/new-source.jpg");
  expect(area.value).toBe("/new-source.jpg 480");
  expect(area.getAttribute("aria-invalid")).toBe("true");
  expect(sent).toEqual([]);
  expect(node.props).toEqual({ src: "/original.jpg", alt: "Original photo" });
});

test("a background URL error switches from Chinese to English without reloading its open library", async () => {
  document.documentElement.lang = "zh-CN";
  let libraryCalls = 0;
  const sent: (string | undefined)[] = [];
  const fetcher: Fetcher = async () => {
    libraryCalls++;
    return Response.json({ data: { items: [] } });
  };
  const host = await mount(
    <BackgroundImageControl
      value={undefined}
      fetcher={fetcher}
      onChange={(value) => sent.push(value)}
      reset={null}
    />,
  );
  await act(async () => {
    host.querySelector<HTMLButtonElement>("[data-emvb-bg-library]")?.click();
    await settle();
  });
  expect(libraryCalls).toBe(1);
  const input = host.querySelector<HTMLInputElement>("[data-emvb-bg-url]");
  if (!input) throw new Error("Missing background URL field");
  await edit(input, "javascript:alert(1)");
  await act(async () => {
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
  });
  expect(host.textContent).toContain("请输入完整 URL");

  await language("en");
  expect(host.textContent).toContain(
    "Use a full URL such as https://example.com/photo.jpg or a path such as /uploads/photo.jpg.",
  );
  expect(host.textContent).not.toContain("请输入完整 URL");
  expect(input.value).toBe("javascript:alert(1)");
  expect(host.querySelector('[role="dialog"]')).not.toBeNull();
  expect(libraryCalls).toBe(1);
  expect(sent).toEqual([]);
});

test("API errors matching a dictionary key remain literal in background and image libraries", async () => {
  document.documentElement.lang = "zh-CN";
  let libraryCalls = 0;
  const sent: unknown[] = [];
  const fetcher: Fetcher = async () => {
    libraryCalls++;
    return Response.json({ error: { code: "REMOTE_FAILURE", message: "Cancel" } }, { status: 500 });
  };
  const node: LayoutNode = {
    id: "image0001",
    type: "image",
    props: { src: "/original.jpg", alt: "Original photo" },
  };
  const host = await mount(
    <>
      <BackgroundImageControl
        value={undefined}
        fetcher={fetcher}
        onChange={(value) => sent.push(value)}
        reset={null}
      />
      <MediaPicker node={node} fetcher={fetcher} onChange={(value) => sent.push(value)} />
    </>,
  );
  await act(async () => {
    host.querySelector<HTMLButtonElement>("[data-emvb-bg-library]")?.click();
    host.querySelector<HTMLButtonElement>("[data-emvb-media-library]")?.click();
    await settle();
  });
  const background = host.querySelector("[data-emvb-background-image]");
  const image = host.querySelector("[data-emvb-media-picker]");
  expect(background?.textContent).toContain("Cancel");
  expect(image?.textContent).toContain("Cancel");
  expect(libraryCalls).toBe(2);

  await language("en");
  expect(background?.textContent).toContain("Cancel");
  expect(image?.textContent).toContain("Cancel");
  expect(libraryCalls).toBe(2);
  expect(sent).toEqual([]);
});
