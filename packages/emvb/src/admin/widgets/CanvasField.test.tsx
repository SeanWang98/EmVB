/**
 * [INPUT]: 依赖真实受控字段、编辑画布及模拟只读 API。
 * [OUTPUT]: 验证应用、窄屏取消、新页面及宿主隔离。
 * [POS]: canvas 字段集成回归；不替换 EditorApp。
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import { afterEach, describe, expect, mock, test } from "bun:test";
import * as React from "react";
import { emptyDesign, type Layout } from "../../core/index.ts";
import type { Fetcher } from "../api.ts";
import { CanvasField } from "./CanvasField.tsx";
import { cleanup, mount, settle } from "../../../test/dom/mount.ts";

const originalWidth = window.innerWidth;
const viewport = (width: number) => {
  // Happy DOM 的媒体监听器首次 resize 才记录当前匹配值。
  window.dispatchEvent(new Event("resize"));
  (
    window as unknown as { happyDOM: { setViewport: (viewport: { width: number }) => void } }
  ).happyDOM.setViewport({ width });
  window.dispatchEvent(new Event("resize"));
};
afterEach(async () => {
  await cleanup();
  viewport(originalWidth);
});

const button = (name: string) =>
  [...document.querySelectorAll<HTMLButtonElement>("button")].find(
    (node) => node.textContent?.trim() === name,
  );
const click = async (name: string) => {
  const target = button(name);
  if (!target) throw new Error(`Missing button: ${name}`);
  await React.act(async () => target.click());
  await settle();
};

async function render(initial: unknown = null) {
  const calls: { path: string; method: string }[] = [];
  const changes: unknown[] = [];
  const submits = mock(() => {});
  const fetcher: Fetcher = async (path, init) => {
    calls.push({ path, method: init?.method ?? "GET" });
    if (path.endsWith("/design/draft")) return Response.json({ data: { design: emptyDesign() } });
    return Response.json({ data: {} });
  };
  function PageForm() {
    const [page, setPage] = React.useState({ title: "Original", layout: initial });
    return (
      <form
        id="admin-root"
        onSubmit={(event) => {
          event.preventDefault();
          submits();
        }}
      >
        <input aria-label="Page title" value={page.title} readOnly />
        <button
          type="button"
          onClick={() => setPage((current) => ({ ...current, title: "Unsaved brand title" }))}
        >
          Change title
        </button>
        <CanvasField
          id="canvas"
          label="Page body"
          value={page.layout}
          fetcher={fetcher}
          onChange={(layout) => {
            changes.push(layout);
            setPage((current) => ({ ...current, layout }));
          }}
        />
      </form>
    );
  }
  await mount(<PageForm />);
  return { calls, changes, submits };
}

describe("controlled Page canvas field", () => {
  test("Apply changes returns a new layout to the unsaved Page without any page API write", async () => {
    const { calls, changes, submits } = await render();
    const url = window.location.href;
    await click("Change title");
    expect(button("Edit with EmVB")?.type).toBe("button");
    button("Edit with EmVB")?.focus();
    await click("Edit with EmVB");
    await click("Add a container to start");
    await click("Apply changes");
    expect(changes.length).toBe(1);
    expect((changes[0] as Layout).root.type).toBe("container");
    expect(document.querySelector<HTMLInputElement>('[aria-label="Page title"]')?.value).toBe(
      "Unsaved brand title",
    );
    expect(document.querySelector("[data-emvb-editor]") === null).toBe(true);
    expect(document.activeElement === button("Edit with EmVB")).toBe(true);
    expect(window.location.href).toBe(url);
    expect(submits).not.toHaveBeenCalled();
    expect(calls.filter((call) => call.path.includes("/content/")).length).toBe(0);
    expect(calls.every((call) => call.method === "GET" || call.path.endsWith("/forms/list"))).toBe(
      true,
    );
    await click("Edit with EmVB");
    expect(document.querySelector("[data-emvb-empty-canvas]") === null).toBe(true);
  });

  test("Cancel asks before dropping local edits and leaves the host field unchanged", async () => {
    const { changes, submits } = await render();
    await click("Edit with EmVB");
    await click("Add a container to start");
    await click("Cancel");
    expect(document.querySelector('[data-emvb-dialog="leave"]')?.textContent).toContain(
      "Discard canvas changes?",
    );
    await click("Keep editing");
    expect(document.querySelector("[data-emvb-editor]") !== null).toBe(true);
    await click("Cancel");
    await click("Discard changes");
    expect(changes.length).toBe(0);
    expect(submits).not.toHaveBeenCalled();
    await click("Edit with EmVB");
    expect(document.querySelector("[data-emvb-empty-canvas]") !== null).toBe(true);
  });

  test("narrow-screen Back keeps dirty canvas changes behind the same cancel confirmation", async () => {
    const { changes, submits } = await render();
    await click("Edit with EmVB");
    await click("Add a container to start");
    await React.act(async () => viewport(800));
    await settle();
    await click("Back to Page form");
    expect(document.querySelector('[data-emvb-dialog="leave"]')?.textContent).toContain(
      "Discard canvas changes?",
    );
    await click("Keep editing");
    expect(changes.length).toBe(0);
    await React.act(async () => viewport(originalWidth));
    await settle();
    expect(document.querySelector("[data-emvb-empty-canvas]") === null).toBe(true);
    expect(document.querySelector("iframe[data-emvb-canvas]") !== null).toBe(true);
    await React.act(async () => viewport(800));
    await settle();
    await click("Back to Page form");
    await click("Apply and return");
    expect(changes.length).toBe(1);
    expect((changes[0] as Layout).root.type).toBe("container");
    expect(submits).not.toHaveBeenCalled();
  });

  test.each([null, undefined, "", "  ", "null", " null "])(
    "new Page supports empty JSON %p without an entry ID and hides page persistence controls",
    async (value) => {
      const { calls, changes, submits } = await render(value);
      await click("Edit with EmVB");
      expect(document.querySelector("[data-emvb-field-settings]")?.textContent).toContain(
        "Page 表单",
      );
      expect(button("Publish") === undefined).toBe(true);
      expect(button("Save draft") === undefined).toBe(true);
      expect(document.querySelector("[data-emvb-timeline-open]") === null).toBe(true);
      expect(document.querySelector("[data-emvb-undo]") !== null).toBe(true);
      await click("Add a container to start");
      const hostShortcut = mock(() => {});
      window.addEventListener("keydown", hostShortcut);
      await React.act(async () => {
        window.dispatchEvent(
          new KeyboardEvent("keydown", {
            key: "ы",
            code: "KeyS",
            ctrlKey: true,
            bubbles: true,
            cancelable: true,
          }),
        );
      });
      window.removeEventListener("keydown", hostShortcut);
      expect(hostShortcut).not.toHaveBeenCalled();
      expect(changes.length).toBe(1);
      expect(submits).not.toHaveBeenCalled();
      expect(calls.filter((call) => call.path.includes("/content/")).length).toBe(0);
    },
  );

  test("Portal submit never reaches the outer Page form and damaged layouts stay unchanged", async () => {
    const { changes, submits } = await render("{broken json");
    await click("Edit with EmVB");
    expect(document.querySelector("[data-emvb-editor]")?.textContent).toContain("原值未修改");
    await React.act(async () => {
      document
        .querySelector("[data-emvb-editor]")
        ?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });
    expect(submits).not.toHaveBeenCalled();
    expect(changes.length).toBe(0);
    await click("Cancel");
    expect(document.querySelector("[data-emvb-editor]") === null).toBe(true);
  });
});
