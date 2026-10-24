/**
 * [INPUT]: 依赖字段错误展示、源消息格式器与 DOM 测试工具。
 * [OUTPUT]: 验证校验消息随语言刷新，API 原文保持稳定。
 * [POS]: 共享字段错误展示契约的回归测试。
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import { afterEach, expect, test } from "bun:test";
import { cleanup, mount, settle } from "../../../../test/dom/mount.ts";
import { InlineError } from "./inline-error.tsx";
import { literalMessage } from "../localized-message.ts";

const initialLanguage = document.documentElement.lang;
afterEach(async () => {
  await cleanup();
  document.documentElement.lang = initialLanguage;
});

test("an inline error is an alert with its message", async () => {
  const host = await mount(<InlineError>Enter a hex color such as #1a2b3c.</InlineError>);
  const alert = host.querySelector(".emvb-inline-error");
  expect(alert?.getAttribute("role")).toBe("alert");
  expect(alert?.textContent).toBe("Enter a hex color such as #1a2b3c.");
});

test("an inline error translates source messages and preserves API text matching a dictionary key", async () => {
  document.documentElement.lang = "en";
  const host = await mount(
    <>
      <InlineError>Enter a hex color such as #1a2b3c.</InlineError>
      <InlineError>{literalMessage("Cancel")}</InlineError>
    </>,
  );
  const alerts = host.querySelectorAll('[role="alert"]');
  expect(alerts[0]?.textContent).toBe("Enter a hex color such as #1a2b3c.");
  expect(alerts[1]?.textContent).toBe("Cancel");
  document.documentElement.lang = "zh-CN";
  await settle();
  expect(alerts[0]?.textContent).toBe("请输入十六进制颜色，如 #1a2b3c。");
  expect(alerts[1]?.textContent).toBe("Cancel");
});
