/**
 * [INPUT]: 依赖编辑命令、样式消费界面、删除动作与语言订阅。
 * [OUTPUT]: 验证持久错误及删除确认随语言更新，用户值保持原样。
 * [POS]: 命令到界面的语言边界回归；切换语言不重发保存请求。
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import { afterEach, expect, test } from "bun:test";
import { createKumoToastManager } from "@cloudflare/kumo";
import * as React from "react";
import { act } from "react";
import { auditPage, emptyDesign, type DesignSystem, type Layout } from "../../core/index.ts";
import { cleanup, mount, settle } from "../../../test/dom/mount.ts";
import type { Fetcher } from "../api.ts";
import { EditorDialogs, useChromeFlags } from "./editor-chrome.tsx";
import { EditorToasts } from "./EditorToasts.tsx";
import { errorMessage, LocalizedMessageText, type LocalizedMessage } from "./localized-message.ts";
import { SiteStylesDrawer } from "./panels/SiteStylesDrawer.tsx";
import { ClassChipInput } from "./panels/settings/ClassChipInput.tsx";
import type { EditorState } from "./store.ts";
import { useEditorCommands } from "./useEditorCommands.ts";
import { useNodeActions } from "./useNodeActions.ts";
import type { useSave } from "./useSave.ts";

const initialLanguage = document.documentElement.lang;
afterEach(async () => {
  await cleanup();
  document.documentElement.lang = initialLanguage;
});
const noop = () => undefined;
const layout: Layout = {
  schemaVersion: 17,
  root: {
    id: "root0001",
    type: "container",
    props: {},
    children: [
      {
        id: "box00001",
        type: "container",
        props: {},
        children: [{ id: "head0001", type: "heading", props: { text: "Title", level: 1 } }],
      },
    ],
  },
};
const state: EditorState = {
  id: "01PAGE",
  page: {
    title: "Page",
    slug: "page",
    canvasMode: "contained",
    seoTitle: "",
    seoDescription: "",
    layout,
  },
  status: "draft",
  rev: "r1",
  design: emptyDesign(),
  designRevision: "r1",
  selectedId: null,
  version: 0,
  savedVersion: 0,
  lastDeleted: null,
};
const saver = { save: async () => "r2", publish: async () => true } as ReturnType<typeof useSave>;

async function switchLanguage(locale: string) {
  document.documentElement.lang = locale;
  await settle();
}

async function press(name: string) {
  const button = [...document.querySelectorAll<HTMLButtonElement>("button")].find(
    (item) => item.textContent === name,
  );
  expect(button).toBeDefined();
  await act(async () => button?.click());
  await settle();
}

function StylesHarness({ fetcher, chip = false }: { fetcher: Fetcher; chip?: boolean }) {
  const latest = React.useRef(state);
  const commands = useEditorCommands({
    fetcher,
    collection: "emvb_pages",
    latest,
    dispatch: noop,
    saver,
    toasts: { add: () => "" } as never,
  });
  return chip ? (
    <ClassChipInput
      applied={undefined}
      design={state.design}
      editing={null}
      onEdit={noop}
      onChange={noop}
      onDesignChange={commands.changeDesign}
    />
  ) : (
    <SiteStylesDrawer
      design={state.design}
      layout={layout}
      onDesignChange={commands.changeDesign}
      unpublished
      onPublishStyles={commands.publishStyles}
      onLayoutChange={noop}
      onClose={noop}
    />
  );
}

test.each(["publish", "save"] as const)(
  "site-style %s errors follow Chinese → English → Chinese without retrying or translating API text",
  async (mode) => {
    document.documentElement.lang = "zh-CN";
    let calls = 0;
    await mount(
      <StylesHarness
        chip={mode === "save"}
        fetcher={async () => {
          calls += 1;
          return Response.json({ error: { code: "INVALID", message: "Save" } }, { status: 422 });
        }}
      />,
    );
    if (mode === "publish") await press("发布样式");
    else {
      const field = document.querySelector<HTMLInputElement>("[data-emvb-class-input]");
      await act(async () => {
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(
          field,
          "Save",
        );
        field?.dispatchEvent(new Event("input", { bubbles: true }));
      });
      await act(async () =>
        field?.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true })),
      );
    }
    const error = () => document.querySelector('[role="alert"]')?.textContent;
    const zh = mode === "publish" ? "无法发布站点样式。Save" : "无法保存站点样式。Save";
    const en =
      mode === "publish" ? "Couldn't publish site styles. Save" : "Couldn't save site styles. Save";
    expect(error()).toBe(zh);
    await switchLanguage("en");
    expect(error()).toBe(en);
    await switchLanguage("zh-CN");
    expect(error()).toBe(zh);
    expect(calls).toBe(1);
    if (mode === "save")
      expect(document.querySelector<HTMLInputElement>("[data-emvb-class-input]")?.value).toBe(
        "Save",
      );
  },
);

test("a real style conflict retains its typed retry path and the user's class name", async () => {
  document.documentElement.lang = "zh-CN";
  const base: DesignSystem = {
    ...emptyDesign(),
    classes: [{ id: "card", name: "Save", style: { color: "#000000" } }],
  };
  const changed = (color: string): DesignSystem => ({
    ...base,
    classes: [{ id: "card", name: "Save", style: { color } }],
  });
  let calls = 0;
  function Harness() {
    const latest = React.useRef({ ...state, design: base });
    const [error, setError] = React.useState<LocalizedMessage | null>(null);
    const commands = useEditorCommands({
      fetcher: async (input) => {
        calls += 1;
        return String(input).endsWith("/design/save")
          ? Response.json({ error: { code: "CONFLICT", message: "Save" } }, { status: 409 })
          : Response.json({
              data: { design: changed("#222222"), revision: "r2", publishedRevision: null },
            });
      },
      collection: "emvb_pages",
      latest,
      dispatch: noop,
      saver,
      toasts: { add: () => "" } as never,
    });
    return (
      <>
        <button
          type="button"
          onClick={() =>
            void commands
              .changeDesign(changed("#111111"))
              .catch((failure: unknown) => setError(errorMessage(failure, "Failed")))
          }
        >
          conflict
        </button>
        <p role="alert">{error && <LocalizedMessageText message={error} />}</p>
      </>
    );
  }
  await mount(<Harness />);
  await press("conflict");
  const error = () => document.querySelector('[role="alert"]')?.textContent;
  expect(error()).toBe("站点样式已在其他标签页或窗口更改（Save）。现已加载最新样式，请重新修改。");
  await switchLanguage("en");
  expect(error()).toContain(
    "window (Save). The latest styles are loaded now: make your change again.",
  );
  expect(calls).toBe(2);
});

test.each([undefined, "Save"])(
  "open deletion confirmation follows language changes while preserving user label %p",
  async (userLabel) => {
    document.documentElement.lang = "zh-CN";
    const current: EditorState = {
      ...state,
      page: {
        ...state.page,
        layout: {
          ...layout,
          root: {
            ...layout.root,
            children: layout.root.children.map((node) => ({ ...node, label: userLabel })),
          },
        },
      },
    };
    function Harness() {
      const latest = React.useRef(current);
      const chrome = useChromeFlags();
      const toasts = React.useMemo(() => createKumoToastManager(), []);
      const actions = useNodeActions({
        state: current,
        latest,
        dispatch: noop,
        announce: noop,
        toasts,
      });
      return (
        <>
          <button type="button" onClick={() => actions.remove("box00001")}>
            remove
          </button>
          <EditorDialogs
            chrome={chrome}
            fetcher={async () => new Response("{}")}
            collection="pages"
            state={current}
            latest={latest}
            dispatch={noop}
            saver={saver}
            toasts={toasts}
            save={async () => undefined}
            a11y={auditPage(layout, current.design)}
            canvasStyles={[]}
            selectedNode={null}
            formsAvailable={false}
            paletteActions={[]}
            addFromPanel={noop}
            addRecipe={noop}
            deleteAsk={actions.deleteAsk}
            setDeleteAsk={actions.setDeleteAsk}
            finishDelete={actions.finishDelete}
            setAnnouncement={noop}
            fieldMode
          />
        </>
      );
    }
    await mount(<Harness />);
    await press("remove");
    const title = () =>
      document.querySelector('[data-emvb-dialog="delete-subtree"] h2')?.textContent;
    const zh = `删除${userLabel ?? "容器"}及其中的 1 个元素？`;
    expect(title()).toBe(zh);
    await switchLanguage("en");
    expect(title()).toBe(`Delete ${userLabel ?? "Container"} and the 1 element inside it?`);
    await switchLanguage("zh-CN");
    expect(title()).toBe(zh);
  },
);

test("published toast content and actions follow the current language in their portal", async () => {
  document.documentElement.lang = "zh-CN";
  function Harness() {
    const latest = React.useRef({ ...state, designUnpublished: true });
    const toasts = React.useMemo(() => createKumoToastManager(), []);
    const commands = useEditorCommands({
      fetcher: async (input) =>
        String(input).endsWith("/design/publish")
          ? Response.json({ error: { code: "INVALID", message: "Save" } }, { status: 422 })
          : Response.json({ data: { collection: { urlPattern: "/{slug}" } } }),
      collection: "emvb_pages",
      latest,
      dispatch: noop,
      saver,
      toasts,
    });
    return (
      <EditorToasts toastManager={toasts}>
        <button type="button" onClick={() => void commands.publish()}>
          publish
        </button>
      </EditorToasts>
    );
  }
  await mount(<Harness />);
  await press("publish");
  const toast = () => document.querySelector("[data-emvb-toasts]")?.textContent;
  expect(toast()).toContain("已发布");
  expect(toast()).toContain("发布站点样式");
  await switchLanguage("en");
  expect(toast()).toContain("Published");
  expect(toast()).toContain("Publish site styles");
  expect(toast()).toContain("View page");
  await press("Publish site styles");
  expect(toast()).toContain("Couldn't publish site styles. Save");
  await switchLanguage("zh-CN");
  expect(toast()).toContain("无法发布站点样式。Save");
});
