/**
 * [INPUT]: 依赖后台根语言、React 外部订阅与分域中文词典。
 * [OUTPUT]: 提供纯翻译器、即时翻译与响应语言切换的 hook。
 * [POS]: 仅翻译后台显示文案，不读取或改写页面内容。
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import { useSyncExternalStore } from "react";
import { zhChrome } from "./zh-chrome.ts";
import { zhChromeAux } from "./zh-chrome-aux.ts";
import { zhFields } from "./zh-fields.ts";
import { zhMedia } from "./zh-media.ts";
import { zhMetadata } from "./zh-metadata.ts";
import { zhPages } from "./zh-pages.ts";
import { zhPanels } from "./zh-panels.ts";

export type AdminLocale = "en" | "zh-CN";
export type Translate = (
  message: string,
  values?: Readonly<Record<string, string | number>>,
) => string;
export type LocalizedTranslate = Translate & { readonly locale: AdminLocale };

const messages: Readonly<Record<string, string>> = {
  ...zhMetadata,
  ...zhFields,
  ...zhMedia,
  ...zhPages,
  ...zhPanels,
  ...zhChromeAux,
  ...zhChrome,
};

/** 只支持英文与简体中文；不把繁体语言误判为简体。 */
export function normalizeAdminLocale(locale: string): AdminLocale {
  const code = locale.trim().replaceAll("_", "-").toLowerCase();
  return /^(?:zh|zh-cn|zh-sg|zh-hans(?:-[a-z0-9]+)*)$/.test(code) ? "zh-CN" : "en";
}

/** 缺少词条或参数时保留原文；插值只返回文本，不构造 HTML。 */
export function createTranslator(locale: string): LocalizedTranslate {
  const language = normalizeAdminLocale(locale);
  return Object.assign(
    (message: string, values: Readonly<Record<string, string | number>> = {}) => {
      const text =
        language === "zh-CN" && Object.hasOwn(messages, message)
          ? (messages[message] ?? message)
          : message;
      return text.replace(/\{([^{}]+)\}/g, (token, key: string) =>
        Object.hasOwn(values, key) ? String(values[key]) : token,
      );
    },
    { locale: language },
  );
}

const translators = { en: createTranslator("en"), "zh-CN": createTranslator("zh-CN") };
const listeners = new Set<() => void>();
let observer: MutationObserver | undefined;

function currentLocale(): AdminLocale {
  return typeof document === "undefined"
    ? "en"
    : normalizeAdminLocale(document.documentElement.lang);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!observer && typeof document !== "undefined") {
    observer = new MutationObserver(() => {
      for (const notify of listeners) notify();
    });
    // ---- EmDash 将后台当前语言同步到根 lang；不观察正文或修改 DOM。----
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
  }
  return () => {
    listeners.delete(listener);
    if (!listeners.size) {
      observer?.disconnect();
      observer = undefined;
    }
  };
}

/** 用于事件与纯显示 helper；React 组件应使用 useI18n 订阅语言。 */
export const translate = Object.defineProperty(
  (message: string, values?: Readonly<Record<string, string | number>>) =>
    translators[currentLocale()](message, values),
  "locale",
  { get: currentLocale },
) as LocalizedTranslate;

/** 不重挂编辑器；切换后台语言时保留画布与未提交输入。 */
export function useI18n(): LocalizedTranslate {
  return translators[useSyncExternalStore(subscribe, currentLocale, () => "en" as const)];
}
