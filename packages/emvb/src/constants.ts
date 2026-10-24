/**
 * [INPUT]: 依赖 EmDash 插件身份与本包发布版本。
 * [OUTPUT]: 提供稳定集合名、存储键和插件元数据常量。
 * [POS]: 各运行时共享的身份入口；版本与 package.json 同步。
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
export const PLUGIN_ID = "emvb";
export const PLUGIN_VERSION = "0.8.0-dev.2";
export const PACKAGE_NAME = "@perkyzz/emvb";
export const ADMIN_ENTRY = `${PACKAGE_NAME}/admin`;
export const PAGES_COLLECTION = "emvb_pages";
/** Hidden collection for Header/Footer theme parts (D-TB-03). Not public URLs. */
export const THEME_PARTS_COLLECTION = "emvb_theme_parts";
/** EDITOR in EmDash's RBAC (`packages/auth/src/rbac.ts`); EmVB is for editors and above (D-020). */
export const EDITOR_ROLE = 40;
export const DESIGN_KEY = "system";
/** Editor working copy. The public route keeps reading `DESIGN_KEY` (W-100). */
export const DESIGN_DRAFT_KEY = "draft";
