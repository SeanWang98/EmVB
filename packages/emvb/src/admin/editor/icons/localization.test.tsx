/**
 * [INPUT]: 依赖真实图标库和上传媒体 API 边界。
 * [OUTPUT]: 验证中文界面不改图标身份或 API 错误原文。
 * [POS]: icons 的语言回归；切换语言不重发媒体请求。
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import { afterEach, expect, test } from "bun:test";
import { act } from "react";
import { cleanup, mount, settle } from "../../../../test/dom/mount.ts";
import { IconLibraryDialog } from "./IconLibraryDialog.tsx";
import type { LibraryIcon } from "./library.ts";

afterEach(async () => {
  await cleanup();
  document.documentElement.lang = "en";
});

test("switching the icon library to Chinese preserves the selected upload and its stored data", async () => {
  document.documentElement.lang = "en";
  const item = {
    id: "aaaa000011112222",
    name: "Delete",
    svg: '<svg viewBox="0 0 10 10"><path d="M0 0h10"/></svg>',
    uploadedAt: "2026-10-08T10:00:00.000Z",
  };
  const inserted: LibraryIcon[] = [];
  await mount(
    <IconLibraryDialog
      open
      currentId={`upload:${item.id}`}
      onOpenChange={() => {}}
      fetcher={async () => Response.json({ data: { items: [item] } })}
      onInsert={(icon) => inserted.push(icon)}
    />,
  );
  await settle();
  const search = document.querySelector('input[type="search"]') as HTMLInputElement;
  const picked = document.querySelector("[data-emvb-icon-picked]") as HTMLElement;
  expect(picked.textContent).toContain("Delete");
  await act(async () => {
    document.documentElement.lang = "zh-CN";
    await new Promise((r) => setTimeout(r, 0));
  });
  expect(document.querySelector('input[type="search"]')).toBe(search);
  expect(search.placeholder).toBe("搜索我的上传…");
  expect(document.querySelector('[data-emvb-dialog="icon-library"]')?.textContent).toContain(
    "图标库",
  );
  expect(picked.textContent).toContain("Delete");
  const insert = document.querySelector("[data-emvb-icon-insert]") as HTMLButtonElement;
  expect(insert.textContent).toBe("插入");
  await act(async () => insert.click());
  expect(inserted).toHaveLength(1);
  expect(inserted[0]?.id).toBe(`upload:${item.id}`);
  expect(inserted[0]?.label).toBe("Delete");
  expect(inserted[0]?.markup).toContain('viewBox="0 0 10 10"');
});

for (const action of ["upload", "rename", "delete"] as const) {
  test(`${action} API error matching a UI key remains literal across language changes`, async () => {
    document.documentElement.lang = "zh-CN";
    const item = {
      id: "aaaa000011112222",
      name: "Brand logo",
      svg: '<svg viewBox="0 0 10 10"><path d="M0 0h10"/></svg>',
      uploadedAt: "2026-10-08T10:00:00.000Z",
    };
    const requests: string[] = [];
    const prompt = window.prompt;
    const confirm = window.confirm;
    window.prompt = () => "Renamed logo";
    window.confirm = () => true;
    try {
      await mount(
        <IconLibraryDialog
          open
          currentId={`upload:${item.id}`}
          onOpenChange={() => {}}
          fetcher={async (path) => {
            requests.push(path);
            if (path.endsWith("/icons")) return Response.json({ data: { items: [item] } });
            throw new Error("Cancel");
          }}
          onInsert={() => {}}
        />,
      );
      await settle();
      const input = document.querySelector<HTMLInputElement>("[data-emvb-icon-upload-input]");
      if (!input) throw new Error("missing file input");
      if (action === "upload") {
        const file = new File(['<svg viewBox="0 0 24 24"><path d="M1 1h2"/></svg>'], "new.svg", {
          type: "image/svg+xml",
        });
        Object.defineProperty(input, "files", { value: [file], configurable: true });
        await act(async () => {
          input.dispatchEvent(new Event("change", { bubbles: true }));
        });
      } else {
        const button = document.querySelector<HTMLButtonElement>(`[data-emvb-icon-${action}]`);
        if (!button) throw new Error("missing upload action");
        await act(async () => button.click());
      }
      await settle();
      const note = document.querySelector<HTMLElement>("[data-emvb-icon-upload-note]");
      if (!note) throw new Error("missing upload note");
      expect(note.getAttribute("data-emvb-icon-upload-note")).toBe("error");
      expect(note.textContent).toBe("Cancel");
      expect(requests).toHaveLength(2);
      const before = [...requests];
      for (const lang of ["en", "zh-CN"]) {
        // oxlint-disable-next-line no-await-in-loop -- each switch checks the same retained error
        await act(async () => {
          document.documentElement.lang = lang;
          await new Promise((resolve) => setTimeout(resolve, 0));
        });
        expect(note.textContent).toBe("Cancel");
        expect(requests).toEqual(before);
        expect(document.querySelector("[data-emvb-icon-upload-input]")).toBe(input);
      }
    } finally {
      window.prompt = prompt;
      window.confirm = confirm;
    }
  });
}
