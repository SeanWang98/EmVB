/**
 * [INPUT]: 依赖后台语言、编辑器主栏、命令与保存校验。
 * [OUTPUT]: 验证中文显示、参数保留和语言切换边界。
 * [POS]: 编辑器语言回归；用户标题不进入翻译字典。
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import { afterEach, describe, expect, test } from "bun:test";
import { act } from "react";
import { cleanup, mount, settle } from "../../../test/dom/mount.ts";
import { ApiError } from "../api.ts";
import { translate } from "../i18n/index.ts";
import { formatMessage } from "./localized-message.ts";
import { localizedClassMergeNotice, localizedDroppedNotice } from "./action-notices.ts";
import { TopBar } from "./TopBar.tsx";
import { DeleteSubtreeDialog } from "./dialogs.tsx";
import { editorCommands } from "./editor-commands.ts";
import { paletteItems } from "./palette-items.ts";
import { filterPalette } from "./palette.ts";
import { saveFailure, slugTakenMessage, tooLargeMessage } from "./useSave.ts";
import { emptyDesign } from "../../core/index.ts";

const originalLanguage = document.documentElement.lang;
afterEach(async () => {
  await cleanup();
  document.documentElement.lang = originalLanguage;
});
const noop = () => undefined;
const bar = (fieldMode = false) => (
  <TopBar
    page={{ title: "Save draft", status: "draft" }}
    dirty
    status={{ kind: "idle" }}
    busy={null}
    onExit={noop}
    onShortcuts={noop}
    onSiteStyles={noop}
    onPreview={noop}
    onSave={noop}
    onPublish={noop}
    fieldMode={fieldMode}
  />
);

describe("编辑器语言边界", () => {
  test("中文主栏翻译操作并保留与消息键同名的用户标题", async () => {
    document.documentElement.lang = "zh-CN";
    const host = await mount(bar());
    expect(host.querySelector(".emvb-topbar-title")?.textContent).toBe("Save draft");
    expect(host.querySelector(".emvb-status")?.textContent).toBe("草稿");
    expect(host.querySelector(".emvb-save-status")?.textContent).toBe("有未保存的更改");
    expect(host.querySelector('[aria-label="站点样式"]')).not.toBeNull();
    expect(host.querySelector('[aria-label="保存草稿（有未保存的更改）"]')).not.toBeNull();
    expect(host.textContent).toContain("发布");
  });

  test("已挂载主栏随根语言切换，标题与回调保持不变", async () => {
    document.documentElement.lang = "en";
    const host = await mount(bar(true));
    expect(host.textContent).toContain("Apply changes");
    await act(async () => {
      document.documentElement.lang = "zh-CN";
      await settle();
    });
    expect(host.textContent).toContain("应用更改");
    expect(host.textContent).toContain("取消");
    expect(host.querySelector(".emvb-topbar-title")?.textContent).toBe("Save draft");
    expect(host.querySelector(".emvb-publish-button")).toBeNull();
    await act(async () => {
      document.documentElement.lang = "en";
      await settle();
    });
    expect(host.textContent).toContain("Apply changes");
    expect(host.textContent).toContain("Cancel");
  });

  test("中文删除确认插入完整用户标签与数量", async () => {
    document.documentElement.lang = "zh-CN";
    await mount(
      <DeleteSubtreeDialog
        open
        onOpenChange={noop}
        label="Save draft / 品牌A"
        count={3}
        onConfirm={noop}
      />,
    );
    const body = document.querySelector('[data-emvb-dialog="delete-subtree"]')?.textContent;
    expect(body).toContain("删除Save draft / 品牌A及其中的 2 个元素？");
    expect(body).toContain("删除 3 个元素");
  });

  test("中文命令可检索，稳定命令ID不随语言变化", () => {
    document.documentElement.lang = "zh-CN";
    const actions = editorCommands({
      surface: "palette",
      targetId: null,
      isRoot: true,
      isParent: false,
      device: "desktop",
      canDuplicate: false,
      canDelete: false,
      runners: {},
    });
    const items = paletteItems({
      layout: null,
      design: emptyDesign(),
      selected: null,
      formsAvailable: true,
      insert: noop,
      select: noop,
      applyClass: noop,
      actions,
    });
    expect(filterPalette(items, ">保存草稿").map((item) => item.id)).toEqual(["action:save"]);
    expect(filterPalette(items, "+标题").some((item) => item.id === "insert:heading")).toBe(true);
    expect(items.some((item) => item.group === "Actions")).toBe(true);
  });

  test("结构化通知翻译计数并保留用户样式类名称", () => {
    document.documentElement.lang = "zh-CN";
    expect(localizedDroppedNotice({ classes: 2, variables: 1, htmlIds: 0, unsafe: 0 })).toBe(
      "已忽略2 个样式类、1 个变量。本站不存在的样式类和变量已移除。",
    );
    expect(
      localizedClassMergeNotice({
        design: emptyDesign(),
        ids: new Map(),
        added: [],
        reused: [],
        renamed: [{ from: "Save draft", to: "Save draft 2" }],
      }),
    ).toBe("样式类：新增 1 个副本（Save draft → Save draft 2）。");
  });

  test("保存错误翻译上下文，slug和体积参数保持原值", () => {
    document.documentElement.lang = "zh-CN";
    expect(slugTakenMessage("Save draft-品牌A")).toContain("Save draft-品牌A");
    expect(slugTakenMessage("Save draft-品牌A")).toContain("已存在");
    expect(tooLargeMessage(4096)).toContain("4 KB");
    const failure = saveFailure(new ApiError(401, "UNAUTHORIZED", "Unauthorized"), {
      slug: "home",
      layout: null,
    });
    expect(
      failure.status.kind === "error" ? formatMessage(failure.status.message, translate) : "",
    ).toContain("登录已失效");
  });
});
