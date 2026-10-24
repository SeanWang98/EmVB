/**
 * [INPUT]: 依赖初始化状态 hook、真实翻译器与 DOM 挂载工具。
 * [OUTPUT]: 验证切换语言刷新冲突，保留 API 原文且不增加请求。
 * [POS]: 初始化状态的语言边界回归；集合规格保持稳定。
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import { afterEach, expect, test } from "bun:test";
import { act } from "react";
import { cleanup, mount, settle } from "../../../test/dom/mount.ts";
import { PAGES_COLLECTION } from "../../constants.ts";
import type { Fetcher } from "../api.ts";
import {
  COLLECTION_SPEC,
  FIELD_SPECS,
  THEME_PARTS_COLLECTION_SPEC,
  THEME_PARTS_FIELD_SPECS,
} from "./spec.ts";
import { useSetupStatus } from "./useSetupStatus.ts";

const initialLang = document.documentElement.lang;
afterEach(async () => {
  await cleanup();
  document.documentElement.lang = initialLang;
});

const language = async (locale: string) => {
  await act(async () => {
    document.documentElement.lang = locale;
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
};

function StatusProbe({ fetcher }: { fetcher: Fetcher }) {
  const { status } = useSetupStatus(fetcher, 50);
  return (
    <div data-state={status.state}>
      {status.state === "error"
        ? status.message
        : "conflicts" in status
          ? status.conflicts.join(" ")
          : ""}
    </div>
  );
}

test("an existing setup conflict follows the current language without rereading schema", async () => {
  await language("zh-CN");
  const calls: string[] = [];
  const fetcher: Fetcher = async (path) => {
    calls.push(path);
    const pages = path.includes(`/${PAGES_COLLECTION}?`);
    return Response.json({
      data: {
        item: pages
          ? {
              ...COLLECTION_SPEC,
              fields: FIELD_SPECS.map((field) =>
                field.slug === "title" ? Object.assign({}, field, { type: "json" }) : field,
              ),
            }
          : { ...THEME_PARTS_COLLECTION_SPEC, fields: THEME_PARTS_FIELD_SPECS },
      },
    });
  };
  const host = await mount(<StatusProbe fetcher={fetcher} />);
  await settle();
  expect(host.querySelector("[data-state]")?.getAttribute("data-state")).toBe("outdated");
  expect(host.textContent).toBe("集合 emvb_pages 的字段“title”类型为 json；EmVB 要求 string。");
  expect(calls).toHaveLength(2);
  await language("en");
  expect(host.textContent).toBe('Field "title" on emvb_pages is json; EmVB needs string.');
  expect(calls).toHaveLength(2);
});

test("an unknown schema API error stays literal across language changes without retrying", async () => {
  await language("zh-CN");
  let calls = 0;
  const fetcher: Fetcher = async () => {
    calls++;
    return Response.json({ error: { code: "REJECTED", message: "New page" } }, { status: 500 });
  };
  const host = await mount(<StatusProbe fetcher={fetcher} />);
  await settle();
  expect(host.querySelector("[data-state]")?.getAttribute("data-state")).toBe("error");
  expect(host.textContent).toBe("New page");
  expect(calls).toBe(2);
  await language("en");
  expect(host.textContent).toBe("New page");
  expect(calls).toBe(2);
});
