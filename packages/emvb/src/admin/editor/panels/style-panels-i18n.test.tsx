/**
 * [INPUT]: 依赖站点样式控件、结构化异常、语言订阅和 DOM 测试工具。
 * [OUTPUT]: 验证反馈随语言刷新，保留用户输入和未知 API 原文。
 * [POS]: 站点样式的翻译边界回归测试。
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import { afterEach, expect, test } from "bun:test";
import { act } from "react";
import { createTranslator } from "../../i18n/index.ts";
import { LocalizedMessageError } from "../localized-message.ts";
import { designImportError } from "./design-import-error.ts";
import type { DesignSystem } from "../../../core/index.ts";
import { cleanup, mount, settle } from "../../../../test/dom/mount.ts";
import { ClassesSection } from "./ClassesSection.tsx";
import { ColorControl } from "./ColorControl.tsx";
import { SiteStylesDrawer } from "./SiteStylesDrawer.tsx";
import { VariableSection } from "./VariableSection.tsx";

const design: DesignSystem = {
  schemaVersion: 16,
  variables: { colors: [{ id: "brand", name: "Color", value: "#123456" }] },
  classes: [{ id: "card", name: "Button", style: {} }],
};

const initialLanguage = document.documentElement.lang;
afterEach(async () => {
  await cleanup();
  document.documentElement.lang = initialLanguage;
});

async function input(field: HTMLInputElement | null, value: string) {
  expect(field).not.toBeNull();
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(field, value);
    field?.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

async function switchLanguage(locale: string) {
  document.documentElement.lang = locale;
  await settle();
}

test.each(["create", "rename"] as const)(
  "class %s duplicate errors follow language changes without saving",
  async (mode) => {
    document.documentElement.lang = "en";
    const saved: DesignSystem[] = [];
    const host = await mount(
      <ClassesSection
        design={{
          ...design,
          classes: [...(design.classes ?? []), { id: "link", name: "Link", style: {} }],
        }}
        layout={null}
        onSave={async (next) => void saved.push(next)}
        onAskDelete={() => {}}
      />,
    );
    if (mode === "create") {
      await act(async () =>
        host.querySelector<HTMLButtonElement>(".emvb-site-section-head button")?.click(),
      );
      await input(host.querySelector("[data-emvb-class-create] input"), "Button");
      const create = [...host.querySelectorAll("button")].find(
        (button) => button.textContent === "Create class",
      );
      await act(async () => create?.click());
    } else {
      await act(async () =>
        host
          .querySelector('[data-emvb-class-def="link"] .emvb-site-item-main')
          ?.dispatchEvent(new KeyboardEvent("keydown", { key: "F2", bubbles: true })),
      );
      const field = host.querySelector<HTMLInputElement>(".emvb-site-rename");
      await input(field, "Button");
      await act(async () =>
        field?.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true })),
      );
    }
    const error = () => host.querySelector("[data-emvb-class-name-error]")?.textContent;
    expect(error()).toBe('A class named "Button" already exists. Pick another name.');
    await switchLanguage("zh-CN");
    expect(error()).toBe("样式类“Button”已存在，请换一个名称。");
    if (mode === "create")
      expect(host.querySelector<HTMLInputElement>("[data-emvb-class-create] input")?.value).toBe(
        "Button",
      );
    await switchLanguage("en");
    expect(error()).toBe('A class named "Button" already exists. Pick another name.');
    expect(saved).toHaveLength(0);
  },
);

test.each(["create", "rename"] as const)(
  "variable %s duplicate errors follow language changes without saving",
  async (mode) => {
    document.documentElement.lang = "en";
    const saved: DesignSystem[] = [];
    const host = await mount(
      <VariableSection
        title="Colors"
        kind="color"
        design={{
          ...design,
          variables: {
            colors: [...design.variables.colors, { id: "ink", name: "Ink", value: "#000000" }],
          },
        }}
        layout={null}
        onSave={async (next) => void saved.push(next)}
        onAskDelete={() => {}}
      />,
    );
    if (mode === "create") {
      await act(async () =>
        host.querySelector<HTMLButtonElement>(".emvb-site-section-head button")?.click(),
      );
      await input(host.querySelector("[data-emvb-var-create] input"), "Color");
      const create = [...host.querySelectorAll("button")].find(
        (button) => button.textContent === "Create",
      );
      await act(async () => create?.click());
    } else {
      await act(async () =>
        host
          .querySelector('[data-emvb-var-id="ink"] .emvb-site-item-main')
          ?.dispatchEvent(new KeyboardEvent("keydown", { key: "F2", bubbles: true })),
      );
      const field = host.querySelector<HTMLInputElement>(".emvb-site-rename");
      await input(field, "Color");
      await act(async () =>
        field?.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true })),
      );
    }
    const error = () => host.querySelector('[role="alert"]')?.textContent;
    expect(error()).toBe('A variable named "Color" already exists. Pick another name.');
    await switchLanguage("zh-CN");
    expect(error()).toBe("变量“Color”已存在，请换一个名称。");
    if (mode === "create")
      expect(host.querySelector<HTMLInputElement>("[data-emvb-var-create] input")?.value).toBe(
        "Color",
      );
    expect(saved).toHaveLength(0);
  },
);

test("fluid variable inputs survive a language switch without committing", async () => {
  document.documentElement.lang = "en";
  const saved: DesignSystem[] = [];
  const host = await mount(
    <VariableSection
      title="Font sizes"
      kind="fontSize"
      design={{
        ...design,
        variables: {
          ...design.variables,
          fontSizes: [
            {
              id: "body",
              name: "Body",
              value: { value: 18, unit: "px" },
              fluid: { min: 14, max: 18 },
            },
          ],
        },
      }}
      layout={null}
      onSave={async (next) => void saved.push(next)}
      onAskDelete={() => {}}
    />,
  );
  await act(async () => host.querySelector<HTMLButtonElement>(".emvb-site-item-main")?.click());
  const field = host.querySelector<HTMLInputElement>(".emvb-site-value-input");
  await input(field, "21");
  await switchLanguage("zh-CN");
  expect(host.querySelector(".emvb-site-value-input")).toBe(field);
  expect(field?.value).toBe("21");
  expect(saved).toHaveLength(0);
});

test("design import errors refresh language while unknown API failures retain their text", async () => {
  document.documentElement.lang = "en";
  const failure = "Unknown API failure: Button / Color";
  const host = await mount(
    <SiteStylesDrawer
      design={design}
      layout={null}
      onDesignChange={async () => {
        throw new Error(failure);
      }}
      onLayoutChange={() => {}}
      onClose={() => {}}
    />,
  );
  const picker = host.querySelector<HTMLInputElement>("[data-emvb-design-import]");
  expect(picker).not.toBeNull();
  Object.defineProperty(picker, "files", {
    value: [new File(["not json"], "Button.json")],
    configurable: true,
  });
  await act(async () => picker?.dispatchEvent(new Event("change", { bubbles: true })));
  await settle();
  expect(host.querySelector('[role="alert"]')?.textContent).toBe("That file is not JSON.");
  await switchLanguage("zh-CN");
  expect(host.querySelector('[role="alert"]')?.textContent).toBe("文件不是有效的 JSON。");
  const color = host.querySelector<HTMLButtonElement>(
    '[data-emvb-var-id="brand"] .emvb-site-item-main',
  );
  await act(async () => color?.click());
  const value = host.querySelector<HTMLInputElement>(".emvb-site-value-input");
  await input(value, "#abcdef");
  await act(async () =>
    value?.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true })),
  );
  await settle();
  expect(host.querySelector('[role="alert"]')?.textContent).toBe(failure);
  await switchLanguage("en");
  expect(host.querySelector('[role="alert"]')?.textContent).toBe(failure);
});

test("Chinese site styles preserve user names that match translation keys", async () => {
  document.documentElement.lang = "zh-CN";
  const saved: DesignSystem[] = [];
  const before = structuredClone(design);
  const host = await mount(
    <SiteStylesDrawer
      design={design}
      layout={null}
      onDesignChange={async (next) => void saved.push(next)}
      onLayoutChange={() => {}}
      onClose={() => {}}
    />,
  );
  expect(host.textContent).toContain("站点样式");
  expect(host.textContent).toContain("颜色");
  expect(host.textContent).toContain("比例尺");
  expect(host.textContent).toContain("小屏幕尺寸 (px)");
  expect(host.querySelector('[data-emvb-var-id="brand"] .emvb-site-item-name')?.textContent).toBe(
    "Color",
  );
  expect(host.querySelector('[data-emvb-var-id="brand"]')?.textContent).toContain("#123456");
  expect(saved).toHaveLength(0);

  const classes = await mount(
    <ClassesSection design={design} layout={null} onSave={async () => {}} onAskDelete={() => {}} />,
  );
  expect(classes.textContent).toContain("样式类");
  expect(classes.querySelector(".emvb-site-item-name")?.textContent).toBe("Button");
  expect(design).toEqual(before);
});

test("switching admin language retains an uncommitted color variable", async () => {
  document.documentElement.lang = "zh-CN";
  const saved: DesignSystem[] = [];
  const host = await mount(
    <ColorControl
      label="Color"
      value="#112233"
      design={design}
      onChange={() => {}}
      onDesignChange={async (next) => void saved.push(next)}
    />,
  );
  expect(host.textContent).toContain("自定义颜色");
  const create = [...host.querySelectorAll("button")].find(
    (button) => button.textContent?.trim() === "新建变量",
  );
  expect(create).toBeDefined();
  await act(async () => create?.click());
  const form = host.querySelector('[data-emvb-form="new-variable"]');
  expect(form).not.toBeNull();
  if (!form) throw new Error("No color variable form");
  const fields = [...form.querySelectorAll("input")];
  await act(async () => {
    const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
    setValue?.call(fields[0], "测试品牌");
    fields[0]?.dispatchEvent(new Event("input", { bubbles: true }));
    setValue?.call(fields[1], "#abcdef");
    fields[1]?.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await act(async () => {
    document.documentElement.lang = "en";
    await settle();
  });
  expect(form?.textContent).toContain("Variable name");
  expect(fields[0]?.value).toBe("测试品牌");
  expect(fields[1]?.value).toBe("#abcdef");
  expect(saved).toHaveLength(0);
});

test.each(["localized", "literal"] as const)(
  "bound color variable %s errors follow the message boundary across languages",
  async (mode) => {
    document.documentElement.lang = "en";
    const saved: DesignSystem[] = [];
    const source = "Couldn't save site styles. Try again.";
    const host = await mount(
      <ColorControl
        label="Color"
        value={{ var: "brand" }}
        design={design}
        onChange={() => {}}
        onDesignChange={async (next) => {
          saved.push(next);
          throw mode === "localized" ? new LocalizedMessageError(source) : new Error("Cancel");
        }}
      />,
    );
    const field =
      [...host.querySelectorAll<HTMLInputElement>("input")].find(
        (candidate) => candidate.value === "#123456",
      ) ?? null;
    await input(field, "#abcdef");
    await act(async () =>
      field?.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true })),
    );
    await settle();
    const error = () => host.querySelector('[role="alert"]')?.textContent;
    expect(error()).toBe(mode === "localized" ? source : "Cancel");
    expect(saved).toHaveLength(1);
    expect(saved[0]?.variables.colors[0]).toEqual({
      id: "brand",
      name: "Color",
      value: "#abcdef",
    });

    await switchLanguage("zh-CN");
    expect(error()).toBe(mode === "localized" ? "无法保存站点样式，请重试。" : "Cancel");
    expect(host.querySelector('input[aria-invalid="true"]')).toBe(field);
    expect(field?.value).toBe("#abcdef");
    expect(field?.readOnly).toBe(false);
    await switchLanguage("en");
    expect(error()).toBe(mode === "localized" ? source : "Cancel");
    expect(field?.value).toBe("#abcdef");
    expect(saved).toHaveLength(1);
    expect(design.variables.colors[0]?.value).toBe("#123456");
  },
);

test("design import errors translate known templates and preserve user identifiers", () => {
  const zh = createTranslator("zh-CN");
  const en = createTranslator("en");
  const repeated =
    'That file has two classes with the id "Button". Give one of them a different id, then import it again.';
  expect(designImportError(repeated, en)).toBe(repeated);
  expect(designImportError(repeated, zh)).toBe(
    "文件中有两个样式类使用标识“Button”。请修改其中一个标识后重新导入。",
  );
  const variables =
    'That file has two variables with the id "Color". Give one of them a different id, then import it again.';
  expect(designImportError(variables, zh)).toBe(
    "文件中有两个变量使用标识“Color”。请修改其中一个标识后重新导入。",
  );
  const size =
    "That design is 142 KB; site styles can be at most 128 KB. Remove some classes or variables from the file, then import it again.";
  expect(designImportError(size, en)).toBe(size);
  expect(designImportError(size, zh)).toBe(
    "该设计为 142 KB，站点样式上限为 128 KB。请删除部分样式类或变量后重新导入。",
  );
  expect(designImportError("That file is not JSON.", zh)).toBe("文件不是有效的 JSON。");
  const unknown = "Unknown file: Button / Color";
  expect(designImportError(unknown, zh)).toBe(unknown);
});
