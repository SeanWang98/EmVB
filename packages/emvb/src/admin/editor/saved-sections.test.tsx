/**
 * [INPUT]: 依赖区块弹窗、共享区块会话与独立通知层。
 * [OUTPUT]: 验证区块复用、延迟翻译与语言切换输入保护。
 * [POS]: 区块回归测试；界面刷新不得改写用户名称与 API 原文。
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import { afterEach, describe, expect, test } from "bun:test";
import { act } from "react";
import * as React from "react";
import { createKumoToastManager } from "@cloudflare/kumo";
import {
  emptyDesign,
  findNode,
  snapshotSection,
  type DesignSystem,
  type Layout,
  type SavedSection,
} from "../../core/index.ts";
import { cleanup, mount, rerender, settle } from "../../../test/dom/mount.ts";
import { useI18n } from "../i18n/index.ts";
import { ELEMENT_NAMES } from "./element-chrome.ts";
import { EditorToasts } from "./EditorToasts.tsx";
import type { Fetcher } from "../api.ts";
import { editorCommands, runCommand } from "./editor-commands.ts";
import { paletteItems } from "./palette-items.ts";
import { AddPanel } from "./panels/AddPanel.tsx";
import { SaveSectionDialog } from "./SavedSectionDialogs.tsx";
import type { EditorAction, EditorState } from "./store.ts";
import { useSavedSections, type SavedSectionActions } from "./useSavedSections.ts";
import type { LocalizedMessage } from "./localized-message.ts";

afterEach(async () => {
  await cleanup();
});

const fakeSaved = (
  over: Partial<SavedSectionActions> = {},
): SavedSectionActions & {
  calls: string[];
} => {
  const calls: string[] = [];
  return {
    calls,
    list: [
      { id: "aaaaaaaaaaaaaaaa", name: "Hero", updatedAt: "", classCount: 0 },
      { id: "bbbbbbbbbbbbbbbb", name: "Pricing table", updatedAt: "", classCount: 1 },
    ],
    loaded: true,
    loadError: null,
    refresh: () => calls.push("refresh"),
    save: async () => null,
    insert: async (id) => {
      calls.push(`insert:${id}`);
    },
    rename: async (id, name) => {
      calls.push(`rename:${id}:${name}`);
      return null;
    },
    remove: async (id) => {
      calls.push(`remove:${id}`);
      return null;
    },
    ...over,
  };
};

const names = (host: ParentNode) =>
  [...host.querySelectorAll("[data-emvb-saved-section]")].map((el) => el.textContent);

const typeInto = (input: HTMLInputElement, value: string) => {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
};

describe("My sections in the Add panel (W-876)", () => {
  test("lists names only, inserts on click, and follows the panel's search", async () => {
    const saved = fakeSaved();
    const host = await mount(<AddPanel onAdd={() => {}} saved={saved} />);
    expect(host.querySelector("[data-emvb-saved-title]")?.textContent).toBe("My sections");
    expect(names(host)).toEqual(["Hero", "Pricing table"]);
    expect(host.querySelector(".emvb-saved-list img")).toBeNull();
    await act(async () =>
      host.querySelector<HTMLElement>('[data-emvb-saved-section="bbbbbbbbbbbbbbbb"]')?.click(),
    );
    expect(saved.calls).toEqual(["insert:bbbbbbbbbbbbbbbb"]);
    const searched = await mount(<AddPanel onAdd={() => {}} saved={saved} defaultQuery="pric" />);
    expect(names(searched)).toEqual(["Pricing table"]);
    const none = await mount(<AddPanel onAdd={() => {}} saved={saved} defaultQuery="zzzz" />);
    expect(none.querySelector("[data-emvb-saved-sections]")).toBeNull();
    expect(none.querySelector("[data-emvb-add-nomatch]")).not.toBeNull();
  });

  test("a search that only matches a saved section is not 'no match'", async () => {
    const host = await mount(<AddPanel onAdd={() => {}} saved={fakeSaved()} defaultQuery="hero" />);
    expect(host.querySelector("[data-emvb-add-nomatch]")).toBeNull();
    expect(names(host)).toEqual(["Hero"]);
  });

  test("an empty list says how to save one; a load error offers Try again", async () => {
    const empty = await mount(<AddPanel onAdd={() => {}} saved={fakeSaved({ list: [] })} />);
    expect(empty.querySelector("[data-emvb-saved-empty]")?.textContent).toContain(
      "Save as section",
    );
    const saved = fakeSaved({ list: [], loadError: "Offline" });
    const failed = await mount(<AddPanel onAdd={() => {}} saved={saved} />);
    expect(failed.querySelector('[role="alert"]')?.textContent).toBe("Offline");
    const retry = [...failed.querySelectorAll("button")].find((b) => b.textContent === "Try again");
    await act(async () => retry?.click());
    expect(saved.calls).toEqual(["refresh"]);
  });

  test("rename edits in place; Enter saves and focus returns to the section", async () => {
    const saved = fakeSaved();
    const host = await mount(<AddPanel onAdd={() => {}} saved={saved} />);
    await act(async () =>
      host.querySelector<HTMLElement>('[data-emvb-saved-rename="aaaaaaaaaaaaaaaa"]')?.click(),
    );
    const field = host.querySelector<HTMLInputElement>("[data-emvb-saved-rename-field]");
    expect(field).not.toBeNull();
    if (!field) return;
    await act(async () => typeInto(field, "Big hero"));
    await act(async () =>
      field.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true })),
    );
    await settle();
    await act(async () => new Promise((resolve) => requestAnimationFrame(() => resolve())));
    expect(saved.calls).toEqual(["rename:aaaaaaaaaaaaaaaa:Big hero"]);
    expect(document.activeElement?.getAttribute("data-emvb-saved-section")).toBe(
      "aaaaaaaaaaaaaaaa",
    );
  });

  test("Escape cancels a rename without saving", async () => {
    const saved = fakeSaved();
    const host = await mount(<AddPanel onAdd={() => {}} saved={saved} />);
    await act(async () =>
      host.querySelector<HTMLElement>('[data-emvb-saved-rename="aaaaaaaaaaaaaaaa"]')?.click(),
    );
    const field = host.querySelector<HTMLInputElement>("[data-emvb-saved-rename-field]");
    await act(async () =>
      field?.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })),
    );
    expect(saved.calls).toEqual([]);
    expect(host.querySelector("[data-emvb-saved-rename-field]")).toBeNull();
  });

  test("delete asks first; confirming removes it", async () => {
    const saved = fakeSaved();
    const host = await mount(<AddPanel onAdd={() => {}} saved={saved} />);
    await act(async () =>
      host.querySelector<HTMLElement>('[data-emvb-saved-delete="aaaaaaaaaaaaaaaa"]')?.click(),
    );
    await settle();
    const dialog = document.querySelector('[data-emvb-dialog="delete-saved-section"]');
    expect(dialog?.textContent).toContain("Delete “Hero”?");
    expect(saved.calls).toEqual([]);
    const confirm = [...(dialog?.querySelectorAll("button") ?? [])].find(
      (b) => b.textContent === "Delete section",
    );
    await act(async () => confirm?.click());
    await settle();
    expect(saved.calls).toEqual(["remove:aaaaaaaaaaaaaaaa"]);
  });

  test("deleting the only match of a search puts focus back in the search field", async () => {
    const saved = fakeSaved();
    const host = await mount(<AddPanel onAdd={() => {}} saved={saved} defaultQuery="hero" />);
    await act(async () =>
      host.querySelector<HTMLElement>('[data-emvb-saved-delete="aaaaaaaaaaaaaaaa"]')?.click(),
    );
    await settle();
    const confirm = [
      ...(document.querySelectorAll('[data-emvb-dialog="delete-saved-section"] button') ?? []),
    ].find((b) => b.textContent === "Delete section") as HTMLElement | undefined;
    // The list the panel shows after the delete.
    saved.list = saved.list.filter((item) => item.name !== "Hero");
    await act(async () => confirm?.click());
    await act(async () => new Promise((resolve) => setTimeout(resolve, 50)));
    expect(saved.calls).toEqual(["remove:aaaaaaaaaaaaaaaa"]);
    expect(document.activeElement?.getAttribute("type")).toBe("search");
  });
});

describe("Save as section command (W-876)", () => {
  const input = (isRoot: boolean, saveSection?: (id: string) => void) => ({
    surface: "layers" as const,
    targetId: "head0001",
    isRoot,
    isParent: false,
    device: "desktop" as const,
    canDuplicate: !isRoot,
    canDelete: !isRoot,
    runners: { saveSection },
  });

  test("Layers and the palette offer it for an element, never for the page", () => {
    const ids = (isRoot: boolean) => editorCommands(input(isRoot, () => {})).map((c) => c.id);
    expect(ids(false)).toContain("save-section");
    expect(ids(true)).not.toContain("save-section");
    expect(editorCommands(input(false)).map((c) => c.id)).not.toContain("save-section");
    const palette = editorCommands({ ...input(false, () => {}), surface: "palette" });
    expect(palette.find((c) => c.id === "save-section")?.label).toBe(
      "Save selected element as a section…",
    );
  });

  test("runs with the target id", () => {
    const opened: string[] = [];
    runCommand({ saveSection: (id) => opened.push(id) }, "save-section", "head0001");
    expect(opened).toEqual(["head0001"]);
  });

  test("the palette inserts saved sections by name and skips damaged ones", () => {
    const inserted: string[] = [];
    const items = paletteItems({
      layout: null,
      design: emptyDesign(),
      selected: null,
      formsAvailable: true,
      insert: () => {},
      select: () => {},
      applyClass: () => {},
      actions: [],
      savedSections: [
        { id: "a1", name: "Hero" },
        { id: "b2", name: "Broken", damaged: true },
      ],
      insertSaved: (id) => inserted.push(id),
    });
    const saved = items.filter((item) => item.id.startsWith("saved:"));
    expect(saved.map((item) => item.label)).toEqual(["Insert Hero"]);
    saved[0]?.run();
    expect(inserted).toEqual(["a1"]);
  });
});

describe("Save as section dialog (W-876)", () => {
  test("language changes preserve an edited name and Synced until the dialog reopens", async () => {
    const previousLanguage = document.documentElement.lang;
    const calls: [string, string][] = [];
    // 与 Editor 的 sectionNameFor 一致：未命名图层使用可翻译的默认元素名。
    function Host({ open }: { open: boolean }) {
      const t = useI18n();
      return (
        <SaveSectionDialog
          open={open}
          onOpenChange={() => {}}
          defaultName={t(ELEMENT_NAMES["heading"] ?? "Heading")}
          onSave={async (name, mode) => {
            calls.push([name, mode]);
            return null;
          }}
        />
      );
    }
    try {
      document.documentElement.lang = "en";
      await mount(<Host open />);
      const form = () =>
        document.querySelector<HTMLFormElement>('[data-emvb-dialog="save-section"]');
      const name = () => form()?.querySelector<HTMLInputElement>("input:not([type=radio])");
      expect(name()?.value).toBe("Heading");
      await act(async () => {
        const input = name();
        if (input) typeInto(input, "我的品牌区块");
      });
      const synced = [
        ...(form()?.querySelectorAll<HTMLElement>("[role=radio], input[type=radio]") ?? []),
      ].at(-1);
      await act(async () => synced?.click());
      await act(async () => {
        document.documentElement.lang = "zh-CN";
        await settle();
      });
      expect(name()?.value).toBe("我的品牌区块");
      expect(form()?.querySelector("[data-emvb-save-section-submit]")?.textContent).toBe(
        "创建同步区块",
      );
      await act(async () => form()?.requestSubmit());
      expect(calls).toEqual([["我的品牌区块", "synced"]]);
      await rerender(<Host open={false} />);
      await rerender(<Host open />);
      expect(name()?.value).toBe("标题");
      expect(form()?.querySelector("[data-emvb-save-section-submit]")?.textContent).toBe(
        "保存区块",
      );
    } finally {
      await cleanup();
      document.documentElement.lang = previousLanguage;
    }
  });

  test("an existing blank-name error follows the current language without resubmitting", async () => {
    const previousLanguage = document.documentElement.lang;
    try {
      document.documentElement.lang = "en";
      await mount(
        <SaveSectionDialog open onOpenChange={() => {}} defaultName="" onSave={async () => null} />,
      );
      const form = () =>
        document.querySelector<HTMLFormElement>('[data-emvb-dialog="save-section"]');
      await act(async () => form()?.requestSubmit());
      expect(form()?.textContent).toContain("Give the section a name.");
      await act(async () => {
        document.documentElement.lang = "zh-CN";
        await settle();
      });
      expect(form()?.textContent).toContain("请为区块命名。");
      expect(form()?.textContent).not.toContain("Give the section a name.");
      await act(async () => {
        document.documentElement.lang = "en";
        await settle();
      });
      expect(form()?.textContent).toContain("Give the section a name.");
    } finally {
      await cleanup();
      document.documentElement.lang = previousLanguage;
    }
  });

  test("a blank name is refused; Synced changes the action and is passed on", async () => {
    const calls: [string, string][] = [];
    await mount(
      <SaveSectionDialog
        open
        onOpenChange={() => {}}
        defaultName=""
        onSave={async (name, mode) => {
          calls.push([name, mode]);
          return null;
        }}
      />,
    );
    await settle();
    const form = document.querySelector<HTMLFormElement>('[data-emvb-dialog="save-section"]');
    await act(async () => form?.requestSubmit());
    expect(form?.textContent).toContain("Give the section a name.");
    expect(calls).toEqual([]);
    const name = form?.querySelector<HTMLInputElement>("input:not([type=radio])");
    if (name) await act(async () => typeInto(name, "Hero"));
    const synced = [
      ...(form?.querySelectorAll<HTMLElement>("[role=radio], input[type=radio]") ?? []),
    ].at(-1);
    await act(async () => synced?.click());
    expect(form?.querySelector("[data-emvb-save-section-submit]")?.textContent).toBe(
      "Make synced section",
    );
    await act(async () => form?.requestSubmit());
    expect(calls).toEqual([["Hero", "synced"]]);
  });

  test("a failed save stays open with the reason", async () => {
    let open = true;
    await mount(
      <SaveSectionDialog
        open
        onOpenChange={(next) => {
          open = next;
        }}
        defaultName="Hero"
        onSave={async () => "My sections holds up to 200 sections."}
      />,
    );
    await settle();
    const form = document.querySelector<HTMLFormElement>('[data-emvb-dialog="save-section"]');
    await act(async () => form?.requestSubmit());
    expect(form?.textContent).toContain("My sections holds up to 200 sections.");
    expect(open).toBe(true);
  });
});

describe("useSavedSections insert (W-876, D-060)", () => {
  const design = (color: string): DesignSystem => ({
    ...emptyDesign(),
    classes: [{ id: "card", name: "Card", style: { color } }],
  });
  const page: Layout = {
    schemaVersion: 17,
    root: {
      id: "root0001",
      type: "container",
      props: {},
      children: [
        { id: "head0001", type: "heading", props: { text: "Hi", level: 2 }, classes: ["card"] },
      ],
    },
  };

  test("site styles get the clashing class as a copy before the page gets the section", async () => {
    const snap = snapshotSection(page, "head0001", design("#ff0000"), "Hi", "2026-10-21T00:00:00Z");
    if (!snap.ok) throw new Error(snap.reason);
    const section: SavedSection = {
      name: "Hi",
      node: snap.record.layout.root.children[0] as SavedSection["node"],
      classes: snap.record.classes,
      createdAt: "",
      updatedAt: "",
    };
    const fetcher: Fetcher = async (path) =>
      new Response(JSON.stringify({ data: path.endsWith("/get") ? { section } : { items: [] } }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    const order: string[] = [];
    let applied: Layout | null = null;
    let savedDesign: DesignSystem | null = null;
    const latest = {
      current: { page: { layout: page }, design: design("#0000ff"), selectedId: "head0001" },
    } as unknown as React.RefObject<EditorState>;
    let actions: SavedSectionActions | null = null;
    function Harness() {
      actions = useSavedSections({
        fetcher,
        latest,
        dispatch: (action: EditorAction) => {
          order.push(action.type);
          if (action.type === "apply-arranged") applied = action.layout;
        },
        changeDesign: async (next) => {
          order.push("design");
          savedDesign = next;
        },
        announce: () => {},
        toasts: createKumoToastManager(),
      });
      return null;
    }
    await mount(<Harness />);
    await act(async () => actions?.insert("aaaaaaaaaaaaaaaa"));
    expect(order).toEqual(["design", "apply-arranged"]);
    const copy = (savedDesign as DesignSystem | null)?.classes?.find((c) => c.name === "Card 2");
    expect(copy?.style).toEqual({ color: "#ff0000" });
    expect((savedDesign as DesignSystem | null)?.classes?.[0]?.style).toEqual({ color: "#0000ff" });
    const layout = applied as Layout | null;
    const inserted = layout?.root.children[1];
    expect(inserted && findNode(layout as Layout, inserted.id)?.classes).toEqual([copy?.id ?? ""]);
  });
});

describe("useSavedSections synced (W-880)", () => {
  test("an element the Theme section can't wrap is refused before any theme part is made", async () => {
    const page: Layout = {
      schemaVersion: 17,
      root: {
        id: "root0001",
        type: "container",
        props: {},
        children: [
          {
            id: "tabs0001",
            type: "tabs",
            props: {},
            children: [{ id: "tabp0001", type: "tab-panel", props: { label: "A" }, children: [] }],
          },
        ],
      },
    };
    const paths: string[] = [];
    const fetcher: Fetcher = async (path) => {
      paths.push(path);
      return new Response(JSON.stringify({ data: { items: [], item: { id: "part0001" } } }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    };
    const latest = {
      current: { page: { layout: page }, design: emptyDesign(), selectedId: "tabp0001" },
    } as unknown as React.RefObject<EditorState>;
    let actions: SavedSectionActions | null = null;
    const dispatched: string[] = [];
    function Harness() {
      actions = useSavedSections({
        fetcher,
        latest,
        dispatch: (action: EditorAction) => dispatched.push(action.type),
        changeDesign: async () => {},
        announce: () => {},
        toasts: createKumoToastManager(),
      });
      return null;
    }
    await mount(<Harness />);
    let reason: LocalizedMessage | null = null;
    await act(async () => {
      reason = (await actions?.save("tabp0001", "Tab", "synced")) ?? null;
    });
    expect(reason).toBeTruthy();
    expect(paths.filter((p) => !p.includes("saved-sections"))).toEqual([]);
    expect(dispatched).toEqual([]);
  });
});

describe("Save as section focus (W-883)", () => {
  test("closing it after its opener is gone gives focus to the selected layer, not the page body", async () => {
    let close: (() => void) | null = null;
    function Harness() {
      const [open, setOpen] = React.useState(false);
      close = () => setOpen(false);
      return (
        <div>
          <button type="button" className="emvb-layer-select" aria-current="true">
            Div block
          </button>
          {open ? null : (
            <button type="button" role="menuitem" data-opener="" onClick={() => setOpen(true)}>
              Save as section…
            </button>
          )}
          <SaveSectionDialog
            open={open}
            onOpenChange={setOpen}
            defaultName="Hero"
            onSave={async () => null}
          />
        </div>
      );
    }
    await mount(<Harness />);
    const opener = document.querySelector<HTMLElement>("[data-opener]");
    opener?.focus();
    await act(async () => opener?.click());
    await settle();
    await act(async () => close?.());
    await act(async () => new Promise((resolve) => setTimeout(resolve, 300)));
    expect(document.activeElement?.textContent).toBe("Div block");
  });
});

describe("saved-section feedback follows the current language", () => {
  const session = (
    fetcher: Fetcher,
    render: (saved: SavedSectionActions) => React.ReactNode = () => null,
  ) => {
    const latest = {
      current: {
        page: {
          layout: {
            schemaVersion: 17,
            root: {
              id: "root0001",
              type: "container",
              props: {},
              children: [{ id: "head0001", type: "heading", props: { text: "Hello", level: 2 } }],
            },
          },
        },
        design: emptyDesign(),
        selectedId: "head0001",
      },
    } as unknown as React.RefObject<EditorState>;
    const toasts = createKumoToastManager();
    let actions: SavedSectionActions | null = null;
    function Harness() {
      actions = useSavedSections({
        fetcher,
        latest,
        dispatch: () => {},
        changeDesign: async () => {},
        announce: () => {},
        toasts,
      });
      return render(actions);
    }
    return {
      Harness,
      toasts,
      get actions() {
        return actions;
      },
    };
  };
  const language = async (locale: string) =>
    act(async () => {
      document.documentElement.lang = locale;
      await settle();
    });

  test("load fallbacks retranslate, while API messages matching UI words stay literal", async () => {
    const previousLanguage = document.documentElement.lang;
    let rawError = false;
    const state = session(
      async () => {
        if (rawError) throw new Error("Save");
        throw undefined;
      },
      (saved) => <AddPanel onAdd={() => {}} saved={saved} />,
    );
    try {
      await language("en");
      const host = await mount(<state.Harness />);
      expect(host.querySelector('[role="alert"]')?.textContent).toBe("Couldn't load My sections.");
      await language("zh-CN");
      expect(host.querySelector('[role="alert"]')?.textContent).toBe("无法加载“我的区块”。");
      rawError = true;
      await act(async () => {
        state.actions?.refresh();
        await settle();
      });
      expect(host.querySelector('[role="alert"]')?.textContent).toBe("Save");
      await language("en");
      await language("zh-CN");
      expect(host.querySelector('[role="alert"]')?.textContent).toBe("Save");
    } finally {
      await cleanup();
      document.documentElement.lang = previousLanguage;
    }
  });

  test("a save failure already shown in the dialog re-translates without another request", async () => {
    const previousLanguage = document.documentElement.lang;
    let saves = 0;
    const state = session(
      async (path) => {
        if (path.endsWith("/save")) {
          saves++;
          throw undefined;
        }
        return Response.json({ data: { items: [] } });
      },
      (saved) => (
        <SaveSectionDialog
          open
          onOpenChange={() => {}}
          defaultName="Save"
          onSave={(name, mode) => saved.save("head0001", name, mode)}
        />
      ),
    );
    try {
      await language("en");
      await mount(<state.Harness />);
      const form = () =>
        document.querySelector<HTMLFormElement>('[data-emvb-dialog="save-section"]');
      await act(async () => {
        form()?.requestSubmit();
        await settle();
      });
      expect(form()?.textContent).toContain("Couldn't save the section.");
      await language("zh-CN");
      expect(form()?.textContent).toContain("无法保存区块。");
      expect(form()?.querySelector<HTMLInputElement>("input:not([type=radio])")?.value).toBe(
        "Save",
      );
      expect(saves).toBe(1);
    } finally {
      await cleanup();
      document.documentElement.lang = previousLanguage;
    }
  });

  test("visible success toasts update title and description while preserving the user's name", async () => {
    const previousLanguage = document.documentElement.lang;
    const state = session(async () =>
      Response.json({ data: { items: [], id: "saved0001", item: { id: "part0001" } } }),
    );
    try {
      await language("en");
      await mount(
        <EditorToasts toastManager={state.toasts}>
          <state.Harness />
        </EditorToasts>,
      );
      await act(async () => {
        await state.actions?.save("head0001", "Save", "copy");
      });
      await act(async () => {
        await state.actions?.save("head0001", "Save", "synced");
      });
      const notice = () => document.querySelector("[data-emvb-toasts]")?.textContent;
      expect(notice()).toContain('Saved "Save" to My sections');
      expect(notice()).toContain('Made the synced section "Save"');
      expect(notice()).toContain(
        "Edit it in Theme Builder; publish it there to use it on the site.",
      );
      await language("zh-CN");
      expect(notice()).toContain("已将“Save”保存到“我的区块”");
      expect(notice()).toContain("已创建同步区块“Save”");
      expect(notice()).not.toContain("Edit it in Theme Builder;");
    } finally {
      await cleanup();
      document.documentElement.lang = previousLanguage;
    }
  });

  test("rename and delete failures already shown in the panel follow language changes", async () => {
    const previousLanguage = document.documentElement.lang;
    const state = session(
      async (path) => {
        if (path.endsWith("/rename") || path.endsWith("/delete")) throw undefined;
        return Response.json({ data: { items: fakeSaved().list } });
      },
      (saved) => <AddPanel onAdd={() => {}} saved={saved} />,
    );
    try {
      await language("en");
      const host = await mount(<state.Harness />);
      await act(async () =>
        host.querySelector<HTMLElement>('[data-emvb-saved-rename="aaaaaaaaaaaaaaaa"]')?.click(),
      );
      const field = host.querySelector<HTMLInputElement>("[data-emvb-saved-rename-field]");
      await act(async () => {
        if (field) typeInto(field, "My own name");
      });
      await act(async () =>
        field?.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true })),
      );
      expect(host.textContent).toContain("Couldn't rename the section.");
      await act(async () =>
        host.querySelector<HTMLElement>('[data-emvb-saved-delete="bbbbbbbbbbbbbbbb"]')?.click(),
      );
      const confirm = [
        ...document.querySelectorAll<HTMLElement>(
          '[data-emvb-dialog="delete-saved-section"] button',
        ),
      ].find((button) => button.textContent === "Delete section");
      await act(async () => confirm?.click());
      expect(host.textContent).toContain("Couldn't delete the section.");
      await language("zh-CN");
      expect(host.textContent).toContain("无法重命名区块。");
      expect(host.textContent).toContain("无法删除区块。");
      expect(field?.value).toBe("My own name");
    } finally {
      await cleanup();
      document.documentElement.lang = previousLanguage;
    }
  });
});
