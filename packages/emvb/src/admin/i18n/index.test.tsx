/**
 * [INPUT]: 依赖纯翻译器、分域词典与 React 测试容器。
 * [OUTPUT]: 验证语言回退、参数保真与共享语言订阅。
 * [POS]: 后台语言边界测试，不读写 CMS 内容。
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import { afterEach, expect, test } from "bun:test";
import { act, useState } from "react";
import { cleanup, mount, settle } from "../../../test/dom/mount.ts";
import { createTranslator, normalizeAdminLocale, translate, useI18n } from "./index.ts";
import { zhChrome } from "./zh-chrome.ts";
import { zhChromeAux } from "./zh-chrome-aux.ts";
import { zhFields } from "./zh-fields.ts";
import { zhMedia } from "./zh-media.ts";
import { zhMetadata } from "./zh-metadata.ts";
import { zhPages } from "./zh-pages.ts";
import { zhPanels } from "./zh-panels.ts";

const originalLanguage = document.documentElement.lang;
afterEach(async () => {
  await cleanup();
  document.documentElement.lang = originalLanguage;
});

test("只将简体中文语言标识映射至中文", () => {
  for (const locale of ["zh", "zh-CN", "ZH_cn", "zh-SG", "zh-Hans", "zh-Hans-CN", " zh-cn "]) {
    expect(normalizeAdminLocale(locale)).toBe("zh-CN");
  }
  for (const locale of ["", "en", "en-US", "fr", "zh-TW", "zh-HK", "zh-MO", "zh-Hant", "zhish"]) {
    expect(normalizeAdminLocale(locale)).toBe("en");
  }
});

test("英文、未知语言及缺少词条返回原文", () => {
  expect(createTranslator("en")("Cancel")).toBe("Cancel");
  expect(createTranslator("fr")("Cancel")).toBe("Cancel");
  expect(createTranslator("zh-CN")("Cancel")).toBe("取消");
  expect(createTranslator("zh-CN")("Unknown future message")).toBe("Unknown future message");
  expect(createTranslator("zh-CN")("toString")).toBe("toString");
});

test("插值保留零、用户原文和未提供的参数", () => {
  const t = createTranslator("zh-CN");
  expect(t("{count} / {name} / {missing}", { count: 0, name: "Save <b>{count}</b>" })).toBe(
    "0 / Save <b>{count}</b> / {missing}",
  );
  expect(t("{name}", Object.create({ name: "inherited" }) as Record<string, string>)).toBe(
    "{name}",
  );
});

test("所有中文词条保留源文的插值参数", () => {
  const dictionaries = [zhChrome, zhChromeAux, zhFields, zhMedia, zhMetadata, zhPages, zhPanels];
  const parameters = (value: string) =>
    [
      ...new Set([...value.matchAll(/\{([a-zA-Z][a-zA-Z0-9_]*)\}/g)].map((match) => match[1])),
    ].toSorted();
  const mismatches = dictionaries.flatMap((dictionary) =>
    Object.entries(dictionary)
      .filter(
        ([source, target]) =>
          JSON.stringify(parameters(source)) !== JSON.stringify(parameters(target)),
      )
      .map(([source]) => source),
  );
  expect(mismatches).toEqual([]);
});

function Draft() {
  const t = useI18n();
  const [value, setValue] = useState("Save draft");
  return (
    <label>
      {t("Cancel")}
      <input value={value} onChange={(event) => setValue(event.target.value)} />
    </label>
  );
}

test("共享订阅切换语言且不重挂输入，卸载后能重新订阅", async () => {
  document.documentElement.lang = "en";
  const host = await mount(<Draft />);
  const input = host.querySelector("input");
  await act(async () => {
    document.documentElement.lang = "zh-CN";
    await settle();
  });
  expect(host.textContent).toBe("取消");
  expect(host.querySelector("input")).toBe(input);
  expect(input?.value).toBe("Save draft");
  expect(translate.locale).toBe("zh-CN");
  expect(translate("Cancel")).toBe("取消");
  await cleanup();
  document.documentElement.lang = "en";
  const second = await mount(<Draft />);
  await act(async () => {
    document.documentElement.lang = "zh-Hans";
    await settle();
  });
  expect(second.textContent).toBe("取消");
});
