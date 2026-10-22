import { describe, expect, test } from "bun:test";
import { createPlugin, emvb } from "../../src/index.ts";

// Moved from src/core/canvas-styles.test.ts (W-850): core tests may not import the plugin entry,
// which reaches the server zone.
describe("host canvas stylesheet options (W-327)", () => {
  test("emvb({ canvasStyles }) passes the kept URLs to the plugin as its options", () => {
    expect(emvb().options).toEqual({});
    expect(emvb({ canvasStyles: ["/site.css", "javascript:x"] }).options).toEqual({
      canvasStyles: ["/site.css"],
    });
  });
});

describe("the editor/config route (W-327)", () => {
  test("answers the host's kept canvas stylesheets, and needs a signed-in user", async () => {
    const route = createPlugin({ canvasStyles: ["/a.css", "//x"] }).routes["editor/config"] as {
      public?: boolean;
      handler: (ctx: never) => Promise<unknown>;
    };
    expect(route.public).toBeUndefined();
    expect(await route.handler({} as never)).toEqual({
      canvasStyles: ["/a.css"],
      canvasCollections: [],
    });
    const none = createPlugin().routes["editor/config"] as typeof route;
    expect(await none.handler({} as never)).toEqual({ canvasStyles: [], canvasCollections: [] });
  });
});
/**
 * [INPUT]: 依赖描述符与原生插件工厂。
 * [OUTPUT]: 验证主站样式配置跨描述符与私有配置路由一致。
 * [POS]: 配置传输测试；宿主画布测试另见 host-fields。
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
