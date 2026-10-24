/**
 * [INPUT]: 依赖编辑权限、初始化外壳与页面列表。
 * [OUTPUT]: 提供独立页面后台入口。
 * [POS]: 插件路由入口；界面语言随后台偏好。
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import { useI18n } from "../i18n/index.ts";
import { RequireEditor } from "../access/RequireEditor.tsx";
import { defaultFetcher, type Fetcher } from "../api.ts";
import { PageList } from "./PageList.tsx";
import { SetupShell } from "./SetupShell.tsx";

/** "Visual pages" (`/pages`): setup states, then the page list. */
export function PagesPage({ fetcher = defaultFetcher }: { fetcher?: Fetcher }) {
  const t = useI18n();
  return (
    <RequireEditor fetcher={fetcher}>
      {(role) => (
        <SetupShell
          fetcher={fetcher}
          role={role}
          page="pages"
          title={t("Pages VisualBuilder")}
          keptNote={t("Existing pages are kept.")}
        >
          <div data-emvb-setup="ready" className="emvb-pages">
            <PageList fetcher={fetcher} />
          </div>
        </SetupShell>
      )}
    </RequireEditor>
  );
}
