/**
 * [INPUT]: 依赖真实 EmDash 运行时、集合注册与插件配置入口。
 * [OUTPUT]: 验证宿主画布保存、版本围栏与代理发布边界。
 * [POS]: 原生 Page 集成测试，不替代 EmDash 的内容存储。
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { SchemaRegistry } from "emdash";
import { createPlugin, emvb } from "../../src/index.ts";
import { s1Page } from "../fixtures/layouts.ts";
import { createTestRuntime, ROLES, userWithRole } from "./runtime.ts";

let t: Awaited<ReturnType<typeof createTestRuntime>>;
async function createHostCollection(schema: SchemaRegistry, slug: string) {
  await schema.createCollection({ slug, label: slug, supports: ["drafts", "revisions"] });
  await schema.createField(slug, { slug: "title", label: "Title", type: "string" });
  await schema.createField(slug, { slug: "layout", label: "Layout", type: "json" });
}

beforeEach(async () => {
  t = await createTestRuntime({ setUp: false, canvasCollections: ["pages"] });
  const schema = new SchemaRegistry(t.runtime.db);
  await createHostCollection(schema, "pages");
  await createHostCollection(schema, "articles");
});
afterEach(async () => {
  await t.dispose();
});

const save = (collection: string, layout: unknown, role: number = ROLES.editor) =>
  t.runtime.handleContentCreate(collection, {
    data: { title: "Original Page", layout },
    actor: { id: "u", role },
  });

describe("host canvas collection configuration", () => {
  test("editors can read the private config but authors and anonymous visitors cannot", async () => {
    const editor = await t.route("editor/config", { user: userWithRole(ROLES.editor) });
    expect(editor.status).toBe(200);
    expect(editor.body["data"]).toEqual({ canvasStyles: [], canvasCollections: ["pages"] });
    expect((await t.route("editor/config", { user: userWithRole(ROLES.author) })).status).toBe(403);
    expect((await t.route("editor/config")).status).toBe(401);
  });

  test("normalizes descriptor and server options and preserves the read-only widget", async () => {
    const input = [
      " pages ",
      "pages",
      "articles",
      "../pages",
      "emvb_pages",
      "emvb_theme_parts",
      "system_users",
      "A",
      "a".repeat(64),
    ];
    expect(emvb({ canvasCollections: input }).options).toEqual({
      canvasCollections: ["pages", "articles"],
    });
    const plugin = createPlugin({ canvasCollections: input });
    const route = plugin.routes["editor/config"] as { handler: (ctx: never) => Promise<unknown> };
    expect(await route.handler({} as never)).toEqual({
      canvasStyles: [],
      canvasCollections: ["pages", "articles"],
    });
    expect(plugin.admin?.fieldWidgets).toEqual([
      { name: "layout", label: "EmVB page (read-only)", fieldTypes: ["json"] },
      { name: "canvas", label: "EmVB canvas", fieldTypes: ["json"] },
    ]);
  });
});

describe("configured Page layout at the real content boundary", () => {
  test("saves an upgraded canvas on the original collection without emvb_pages", async () => {
    const result = await save("pages", { ...s1Page(), schemaVersion: 1 });
    expect(result.success).toBe(true);
    if (!result.success) throw new Error(result.error.message);
    expect(result.data.item.data).toMatchObject({ title: "Original Page", layout: s1Page() });
    const read = await t.runtime.handleContentGet("pages", result.data.item.id);
    expect(read.success).toBe(true);
    if (!read.success) throw new Error(read.error.message);
    expect(read.data.item.id).toBe(result.data.item.id);
    expect(read.data["_rev"]).toBeTruthy();
  });

  test("rejects invalid layouts, invalid nesting, and non-editor canvas writes", async () => {
    const invalid = await save("pages", { root: "invalid" });
    expect(invalid).toMatchObject({ success: false, error: { code: "SAVE_REJECTED" } });
    const badNesting = s1Page();
    badNesting.root.children = [
      { id: "mitm0001", type: "menu-item", props: { text: "Home" }, children: [] },
    ];
    const misplaced = await save("pages", badNesting);
    expect(misplaced.success ? "" : misplaced.error.message).toContain(
      "Menu items can only go inside a Menu",
    );
    const author = await save("pages", s1Page(), ROLES.author);
    expect(author).toMatchObject({ success: false, error: { code: "SAVE_REJECTED" } });
    expect(author.success ? "" : author.error.message).toContain("Only editors and administrators");
  });

  test("empty host layouts and unconfigured collections keep their original save permissions", async () => {
    const legacy = await Promise.all(
      [null, "", "null"].map((empty) => save("pages", empty, ROLES.author)),
    );
    expect(legacy.map((result) => result.success)).toEqual([true, true, true]);
    expect((await save("articles", { root: "not an EmVB layout" }, ROLES.author)).success).toBe(
      true,
    );
  });

  test("the original Page revision still prevents a stale canvas save", async () => {
    const first = await save("pages", s1Page());
    if (!first.success) throw new Error(first.error.message);
    const id = first.data.item.id;
    const read = await t.runtime.handleContentGet("pages", id);
    if (!read.success) throw new Error(read.error.message);
    const originalRev = read.data["_rev"];
    const changed = await t.runtime.handleContentUpdate("pages", id, {
      data: { title: "Updated in Page", layout: s1Page() },
      _rev: originalRev,
      actor: { id: "u", role: ROLES.editor },
    });
    expect(changed.success).toBe(true);
    const stale = await t.runtime.handleContentUpdate("pages", id, {
      data: { title: "Stale canvas title", layout: s1Page() },
      _rev: originalRev,
      actor: { id: "u", role: ROLES.editor },
    });
    expect(stale).toMatchObject({ success: false, error: { code: "CONFLICT" } });
    const latest = await t.runtime.handleContentGet("pages", id);
    if (!latest.success) throw new Error(latest.error.message);
    expect(latest.data.item.id).toBe(id);
    expect(latest.data.item.data["title"]).toBe("Updated in Page");
  });

  test("an author cannot clear a published canvas or a canvas that only exists in a draft", async () => {
    const live = await save("pages", s1Page());
    const staged = await save("pages", null);
    if (!live.success || !staged.success) throw new Error("fixtures failed");
    expect((await t.runtime.handleContentPublish("pages", live.data.item.id)).success).toBe(true);
    expect((await t.runtime.handleContentPublish("pages", staged.data.item.id)).success).toBe(true);
    const draftCanvas = await t.runtime.handleContentUpdate("pages", staged.data.item.id, {
      data: { layout: s1Page() },
      actor: { id: "u", role: ROLES.editor },
    });
    expect(draftCanvas.success).toBe(true);
    const clears = await Promise.all(
      [live.data.item.id, staged.data.item.id].map((id) =>
        t.runtime.handleContentUpdate("pages", id, {
          data: { layout: null },
          actor: { id: "u", role: ROLES.author },
        }),
      ),
    );
    for (const cleared of clears) {
      expect(cleared).toMatchObject({ success: false, error: { code: "SAVE_REJECTED" } });
      expect(cleared.success ? "" : cleared.error.message).toContain(
        "Only editors and administrators",
      );
    }
    const legacy = await save("pages", null, ROLES.author);
    if (!legacy.success) throw new Error(legacy.error.message);
    const updatedLegacy = await t.runtime.handleContentUpdate("pages", legacy.data.item.id, {
      data: { title: "Legacy author update", layout: null },
      actor: { id: "u", role: ROLES.author },
    });
    expect(updatedLegacy.success).toBe(true);
  });

  test("MCP publish policy covers the configured collection and leaves other collections alone", async () => {
    const canvas = await save("pages", s1Page());
    const legacy = await save("pages", null);
    const article = await save("articles", s1Page());
    if (!canvas.success || !legacy.success || !article.success) throw new Error("fixtures failed");
    const mcp = {
      origin: { source: "mcp" as const },
      actor: { id: "u", role: ROLES.editor, source: "mcp" as const },
    };
    const blocked = await t.runtime.handleContentPublish("pages", canvas.data.item.id, mcp);
    expect(blocked.success ? "" : blocked.error.message).toContain("Agents may not publish");
    const empty = await t.runtime.handleContentPublish("pages", legacy.data.item.id, mcp);
    expect(empty.success ? "" : empty.error.message).toContain("Agents may not publish");
    expect(
      (await t.runtime.handleContentPublish("articles", article.data.item.id, mcp)).success,
    ).toBe(true);
    const cleared = await t.runtime.handleContentUpdate("pages", canvas.data.item.id, {
      data: { layout: null },
      actor: { id: "u", role: ROLES.editor, source: "mcp" },
    });
    expect(cleared.success).toBe(true);
    const bypass = await t.runtime.handleContentPublish("pages", canvas.data.item.id, mcp);
    expect(bypass.success ? "" : bypass.error.message).toContain("Agents may not publish");
    await t.agentSettings({ publishPages: true });
    expect((await t.runtime.handleContentPublish("pages", canvas.data.item.id, mcp)).success).toBe(
      true,
    );
  });
});
