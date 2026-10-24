/**
 * [INPUT]: 依赖编辑权限、初始化外壳与主题列表。
 * [OUTPUT]: 提供主题构建器后台入口。
 * [POS]: 插件路由入口；界面语言随后台偏好。
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import { useI18n } from "../i18n/index.ts";
import { RequireEditor } from "../access/RequireEditor.tsx";
import { defaultFetcher, type Fetcher } from "../api.ts";
import { SetupShell } from "./SetupShell.tsx";
import { ThemePartList } from "./ThemePartList.tsx";

/** Theme Builder (`/theme`): setup states, then the theme parts list. */
export function ThemeBuilderPage({ fetcher = defaultFetcher }: { fetcher?: Fetcher }) {
  const t = useI18n();
  return (
    <RequireEditor fetcher={fetcher}>
      {(role) => (
        <SetupShell
          fetcher={fetcher}
          role={role}
          page="theme"
          title={t("Theme Builder")}
          keptNote={t("Existing content is kept.")}
        >
          <div data-emvb-setup="ready" className="emvb-pages">
            <ThemePartList fetcher={fetcher} />
          </div>
        </SetupShell>
      )}
    </RequireEditor>
  );
}
