/**
 * [INPUT]: 依赖真实访问边界、受控角色响应与根语言。
 * [OUTPUT]: 验证中文权限提示、重试恢复和未授权内容隔离。
 * [POS]: 访问界面的语言回归；角色判断与 API 错误保持原值。
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import { afterEach, expect, test } from "bun:test";
import { act } from "react";
import type { Fetcher } from "../api.ts";
import { RequireEditor } from "./RequireEditor.tsx";
import { cleanup, mount, settle } from "../../../test/dom/mount.ts";

const initialLang = document.documentElement.lang;
afterEach(async () => {
  await cleanup();
  document.documentElement.lang = initialLang;
});

test("Chinese restricted-role message keeps protected content inaccessible across language changes", async () => {
  document.documentElement.lang = "zh-CN";
  const calls: string[] = [];
  const fetcher: Fetcher = async (path) => {
    calls.push(path);
    return Response.json({ data: { role: 30 } });
  };
  const host = await mount(
    <RequireEditor fetcher={fetcher}>{() => <p data-secret>Protected content</p>}</RequireEditor>,
  );
  await settle();
  expect(host.querySelector('[data-emvb-access="denied"]')?.textContent).toContain(
    "你没有 EmVB 访问权限",
  );
  expect(host.querySelector("[data-secret]")).toBeNull();
  await act(async () => {
    document.documentElement.lang = "en";
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  expect(host.textContent).toContain("You don't have access to EmVB");
  expect(host.querySelector("[data-secret]")).toBeNull();
  expect(calls).toEqual(["/_emdash/api/auth/me"]);
});

test("Chinese access loading and retry recover while preserving the raw API error", async () => {
  document.documentElement.lang = "zh-CN";
  const initial = Promise.withResolvers<Response>();
  const retried = Promise.withResolvers<Response>();
  let calls = 0;
  const fetcher: Fetcher = async () => (++calls === 1 ? initial.promise : retried.promise);
  const host = await mount(
    <RequireEditor fetcher={fetcher}>{(role) => <p data-allowed>{role}</p>}</RequireEditor>,
  );
  expect(host.querySelector('[role="status"]')?.textContent).toBe("正在检查访问权限…");
  expect(host.querySelector("[data-allowed]")).toBeNull();
  await act(async () =>
    initial.resolve(
      Response.json(
        { error: { code: "INTERNAL", message: "Database temporarily offline" } },
        { status: 503 },
      ),
    ),
  );
  await settle();
  const alert = host.querySelector('[role="alert"]');
  expect(alert?.textContent).toContain("无法检查 EmVB 访问权限");
  expect(alert?.textContent).toContain("Database temporarily offline");
  const retry = [...host.querySelectorAll<HTMLButtonElement>("button")].find(
    (button) => button.textContent === "重试",
  );
  expect(retry).toBeTruthy();
  await act(async () => retry?.click());
  expect(host.querySelector('[role="status"]')?.textContent).toBe("正在检查访问权限…");
  expect(host.querySelector("[data-allowed]")).toBeNull();
  await act(async () => retried.resolve(Response.json({ data: { role: 40 } })));
  await settle();
  expect(host.querySelector("[data-allowed]")?.textContent).toBe("40");
  expect(host.querySelector('[data-emvb-access="denied"]')).toBeNull();
  expect(calls).toBe(2);
});
