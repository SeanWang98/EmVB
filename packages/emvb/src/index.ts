/**
 * [INPUT]: 依赖主站配置、画布边界与服务端插件工厂。
 * [OUTPUT]: 导出 EmVB 描述符、选项与插件工厂。
 * [POS]: 主站注册入口，规范化配置后交给原生插件。
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import type { PluginDescriptor } from "emdash";
import { ADMIN_ENTRY, PACKAGE_NAME, PLUGIN_ID, PLUGIN_VERSION } from "./constants.ts";
import { canvasStyleUrls } from "./core/canvas-styles.ts";
import { canvasCollectionSlugs } from "./core/host-fields.ts";
import { createPlugin } from "./server/plugin.ts";

/** Options a host site passes to `emvb()` in astro.config. */
export type EmVBOptions = {
  /**
   * Stylesheets the editor canvas loads before EmVB's CSS (W-327): the site's fonts and base
   * styles, so pages look in the editor as on the site. `https:` URLs or site paths
   * (`/styles/site.css`); anything else is ignored.
   */
  canvasStyles?: string[];
  /** Existing EmDash collections whose optional `layout` JSON field uses the EmVB canvas. */
  canvasCollections?: string[];
};

/** Descriptor that host sites add to `emdash({ plugins: [...] })` in astro.config. */
export function emvb(options: EmVBOptions = {}): PluginDescriptor {
  const canvasStyles = canvasStyleUrls(options.canvasStyles);
  const canvasCollections = canvasCollectionSlugs(options.canvasCollections);
  return {
    id: PLUGIN_ID,
    version: PLUGIN_VERSION,
    format: "native",
    entrypoint: PACKAGE_NAME,
    adminEntry: ADMIN_ENTRY,
    options: {
      ...(canvasStyles.length > 0 ? { canvasStyles } : {}),
      ...(canvasCollections.length > 0 ? { canvasCollections } : {}),
    },
  };
}

export { createPlugin };
export default createPlugin;
