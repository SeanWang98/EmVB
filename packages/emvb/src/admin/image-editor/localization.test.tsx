/**
 * [INPUT]: 依赖真实编辑入口、模糊控件和纯媒体显示模型。
 * [OUTPUT]: 验证中文显示、语言切换与原始媒体值隔离。
 * [POS]: image-editor 的语言回归；不模拟翻译函数。
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import { afterEach, expect, test } from "bun:test";
import { act } from "react";
import { cleanup, mount } from "../../../test/dom/mount.ts";
import { ImageEditButton } from "./ImageEditButton.tsx";
import { BlurFocus } from "./BlurFocus.tsx";
import { localizedImageEditSummary } from "./edit-summary.ts";
import { createTranslator } from "../i18n/index.ts";
import { displayName } from "./tools.ts";
import { ImageEditorError, imageError } from "./messages.ts";
import { mediaLabel } from "./media-labels.ts";
import { metadataRows } from "./MetadataPanel.tsx";

afterEach(async () => {
  await cleanup();
  document.documentElement.lang = "en";
});
const language = async (lang: string) => {
  await act(async () => {
    document.documentElement.lang = lang;
    await new Promise((r) => setTimeout(r, 0));
  });
};

test("the lazy image editor entry responds to language without changing the image", async () => {
  document.documentElement.lang = "en";
  const imageProps = { src: "/Edit image.webp", alt: "Edit image", width: 640 };
  const before = structuredClone(imageProps);
  await mount(<ImageEditButton imageProps={imageProps} />);
  const button = document.querySelector("[data-emvb-image-edit]") as HTMLButtonElement;
  expect(button.textContent).toBe("Edit image");
  await language("zh-CN");
  expect(document.querySelector("[data-emvb-image-edit]")).toBe(button);
  expect(button.textContent).toBe("编辑图片");
  expect(imageProps).toEqual(before);
  await language("en");
  expect(button.textContent).toBe("Edit image");
});

test("blur coordinates stay numeric when their accessible description changes", async () => {
  document.documentElement.lang = "zh-CN";
  const changed: number[] = [];
  await mount(
    <BlurFocus
      centerX={0.5}
      centerY={0.25}
      onChange={(next) => changed.push(next.centerX)}
      onCommit={() => {}}
    />,
  );
  const slider = document.querySelector("[data-emvb-image-blur-focus]") as HTMLElement;
  expect(slider.getAttribute("aria-label")).toBe("清晰区域（模糊中心）");
  expect(slider.getAttribute("aria-valuetext")).toBe("水平 50%，垂直 25%");
  await act(async () => {
    slider.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
  });
  expect(changed).toEqual([0.51]);
  await language("en");
  expect(document.querySelector("[data-emvb-image-blur-focus]")).toBe(slider);
  expect(slider.getAttribute("aria-valuetext")).toBe("50% across, 25% down");
});

test("Chinese summaries translate operations while media names and metadata stay raw", () => {
  const t = createTranslator("zh-CN");
  expect(
    localizedImageEditSummary(
      { version: 1, geometry: { quarterTurns: 1 }, lights: { exposure: 0.2 } },
      12,
      t,
    ),
  ).toBe("已旋转 · 曝光 +20");
  expect(displayName("Edit image.jpg", "Other", t("Library picture"))).toBe("Edit image.jpg");
  expect(displayName("01M4W9MN34FA0WDWHB5FS8YSGJ.jpg", "Name", t("Library picture"))).toBe("Name");
  expect(displayName("01M4W9MN34FA0WDWHB5FS8YSGJ.jpg", "", t("Library picture"))).toBe(
    "媒体库图片",
  );
  expect(metadataRows({ fileInfo: { name: "Size" }, image: null, metadata: undefined })).toEqual([
    { label: "Name", value: "Size" },
  ]);
});

test("media labels keep their English source and distinguish image context", () => {
  const en = createTranslator("en");
  const zh = createTranslator("zh-CN");
  for (const label of ["Recipe", "Radius", "Center", "Solid"])
    expect(mediaLabel(label, en)).toBe(label);
  expect(mediaLabel("Recipe", zh)).toBe("编辑配方");
  expect(mediaLabel("Radius", zh)).toBe("半径");
  expect(mediaLabel("Center", zh)).toBe("中心");
  expect(mediaLabel("Solid", zh)).toBe("实心");
  expect(zh("Center")).toBe("居中");
  expect(zh("Solid")).toBe("实线");
});

test("image failures retain an English source for subsequent language changes", () => {
  const cause = new Error("Name");
  const error = new ImageEditorError(
    "Couldn't save the copy.{reason}",
    { reason: " Name" },
    { cause },
  );
  expect(error.message).toBe("Couldn't save the copy. Name");
  expect(error.cause).toBe(cause);
  const notice = imageError(error, "Export failed.");
  expect(createTranslator("zh-CN")(notice.message, notice.values)).toBe("无法保存副本。 Name");
  expect(createTranslator("en")(notice.message, notice.values)).toBe(error.message);
  expect(imageError(cause, "Export failed.")).toEqual({ message: "Name" });
});
