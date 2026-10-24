/**
 * [INPUT]: 依赖后台语言、样式控件与 DOM 挂载工具。
 * [OUTPUT]: 验证中文标签、动态校验和 CSS 存储值边界。
 * [POS]: 样式控件的语言回归；保留用户命名及英文兼容。
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import { afterEach, expect, test } from "bun:test";
import { act } from "react";
import { emptyDesign, type LayoutNode, type StyleProps } from "../../../../core/index.ts";
import { createTranslator } from "../../../i18n/index.ts";
import { cleanup, mount, settle } from "../../../../../test/dom/mount.ts";
import { BoxControl } from "./BoxControl.tsx";
import { BOX_GROUPS, type BoxGroup } from "./box-sides.ts";
import { parseLengthDraft } from "./length-units.ts";
import { parseStyleValue } from "./query-style.ts";
import { StateSwitcher } from "./StateSwitcher.tsx";
import { StyleSources } from "./StyleSources.tsx";
import { StyleRow } from "./StyleRow.tsx";
import { MotionControl } from "./MotionControl.tsx";
import { displayStyleLabel } from "./style-sections.ts";

const originalLanguage = document.documentElement.lang;
afterEach(async () => {
  await cleanup();
  document.documentElement.lang = originalLanguage;
});

test("Chinese length and query errors keep CSS values and the English default", () => {
  const t = createTranslator("zh-CN");
  expect(parseLengthDraft("-1", "paddingTop", "px", t)).toEqual({
    ok: false,
    message: "上内边距不能为负数，请输入 0 或更大的值。",
  });
  expect(parseLengthDraft("-1", "paddingTop", "px")).toEqual({
    ok: false,
    message: "Padding top can't be negative. Enter 0 or more.",
  });
  expect(parseStyleValue("gap", "", t)).toEqual({ error: "请输入值。" });
  expect(parseLengthDraft("2rem", "paddingTop", "px", t)).toEqual({
    ok: true,
    value: { value: 2, unit: "rem" },
  });
  expect(parseStyleValue("flexDirection", "row", t)).toEqual({ value: "row" });
});

test("Chinese linked box labels commit original style keys and units", async () => {
  document.documentElement.lang = "zh-CN";
  const patches: Partial<StyleProps>[] = [];
  const group = BOX_GROUPS.find((entry) => entry.id === "padding") as BoxGroup;
  const host = await mount(
    <BoxControl
      group={group}
      style={undefined}
      design={emptyDesign()}
      onPatch={(patch) => patches.push(patch)}
    />,
  );
  const input = host.querySelector<HTMLInputElement>('[aria-label="上内边距"]');
  expect(input).not.toBeNull();
  expect(host.querySelector("[data-emvb-box-link]")?.getAttribute("aria-label")).toBe(
    "联动内边距四边",
  );
  await act(async () => {
    input?.focus();
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(input, "12");
    input?.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await act(async () => input?.blur());
  expect(patches).toEqual([
    {
      paddingTop: { value: 12, unit: "px" },
      paddingRight: { value: 12, unit: "px" },
      paddingBottom: { value: 12, unit: "px" },
      paddingLeft: { value: 12, unit: "px" },
    },
  ]);
});

test("style state labels follow the admin language without changing state IDs", async () => {
  document.documentElement.lang = "en";
  const host = await mount(
    <StateSwitcher value="hover" states={undefined} className="Color" onChange={() => undefined} />,
  );
  expect(host.textContent).toContain('Editing Hover for class "Color"');
  await act(async () => {
    document.documentElement.lang = "zh-CN";
    await settle();
  });
  expect(host.textContent).toContain("正在编辑样式类“Color”的悬停样式");
  expect(
    host.querySelector("[data-emvb-state-switch]")?.getAttribute("data-emvb-state-switch"),
  ).toBe("hover");
});

test("style sources translate chrome while preserving class and variable names", async () => {
  document.documentElement.lang = "zh-CN";
  const design = emptyDesign();
  design.variables.colors = [{ id: "brand", name: "Color", value: "#112233" }];
  design.classes = [{ id: "brandclass", name: "Background", style: { color: { var: "brand" } } }];
  const node: LayoutNode = {
    id: "heading01",
    type: "heading",
    props: { text: "User text", level: 2 },
    classes: ["brandclass"],
  };
  const host = await mount(
    <StyleSources node={node} design={design} device="desktop" state="normal" />,
  );
  expect(host.textContent).toContain("样式来源");
  expect(host.querySelector('[data-emvb-source="color"] .emvb-sources-prop')?.textContent).toBe(
    "颜色",
  );
  expect(host.querySelector(".emvb-sources-value")?.textContent).toBe("Color");
  expect(host.querySelector(".emvb-sources-from")?.textContent).toBe(".Background");
});

test("Chinese border and flex labels use their CSS context while English stays unchanged", async () => {
  document.documentElement.lang = "zh-CN";
  const design = emptyDesign();
  const zh = createTranslator("zh-CN");
  const en = createTranslator("en");
  expect(displayStyleLabel("flexDirection", zh)).toBe("排列方向");
  expect(displayStyleLabel("borderRadius", zh)).toBe("圆角");
  expect(displayStyleLabel("iconScale", zh)).toBe("缩放");
  expect(displayStyleLabel("flexDirection", en)).toBe("Direction");
  expect(displayStyleLabel("borderRadius", en)).toBe("Radius");
  expect(displayStyleLabel("iconScale", en)).toBe("Scale");
  const radius = BOX_GROUPS.find((group) => group.id === "borderRadius") as BoxGroup;
  const host = await mount(
    <>
      <BoxControl group={radius} style={undefined} design={design} onPatch={() => undefined} />
      <StyleRow
        styleKey="borderStyle"
        style={{ borderStyle: "solid" }}
        design={design}
        onPatch={() => undefined}
        onDesignChange={async () => undefined}
      />
      <StyleRow
        styleKey="flexDirection"
        style={{ flexDirection: "row" }}
        design={design}
        onPatch={() => undefined}
        onDesignChange={async () => undefined}
      />
    </>,
  );
  expect(host.querySelector(".emvb-box-label")?.textContent).toBe("圆角");
  expect(host.querySelector("[data-emvb-box-link]")?.getAttribute("aria-label")).toBe(
    "联动圆角四角",
  );
  expect(host.querySelector('[data-emvb-style="borderStyle"] [role="combobox"]')?.textContent).toBe(
    "实线",
  );
  expect(host.querySelector('[data-emvb-style="flexDirection"]')?.textContent).toContain(
    "排列方向",
  );
});

test("Chinese motion uses scale and entrance context without changing generic zoom", async () => {
  document.documentElement.lang = "zh-CN";
  const value = {
    range: "enter" as const,
    effects: [{ type: "scale" as const, from: 80, to: 100 }],
  };
  const host = await mount(<MotionControl value={value} onChange={() => undefined} reset={null} />);
  expect(host.querySelector(".emvb-motion-name")?.textContent).toBe("缩放");
  expect(host.querySelector('[aria-label="移除缩放"]')).not.toBeNull();
  expect(host.querySelector('[role="combobox"]')?.textContent).toBe("放大进入");
  expect(createTranslator("zh-CN")("Zoom in")).toBe("放大");
  expect(value.effects).toEqual([{ type: "scale", from: 80, to: 100 }]);
});
