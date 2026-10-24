/**
 * [INPUT]: 依赖角色探测、共用状态组件与界面翻译。
 * [OUTPUT]: 为编辑者开放子界面，为其他角色展示访问提示。
 * [POS]: 后台路由访问边界；保留权限规则和原始 API 错误。
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import { useI18n } from "../i18n/index.ts";
import { Empty } from "@cloudflare/kumo";
import { LockKeyIcon } from "@phosphor-icons/react";
import type * as React from "react";
import type { Fetcher } from "../api.ts";
import { ListError, LoadingStatus } from "../pages/list-kit.tsx";
import { canUseEmvb, useRole } from "./role.ts";

/** Renders `children` for editors and above, and a "no access" state below (D-020, D-024). */
export function RequireEditor({
  fetcher,
  children,
}: {
  fetcher: Fetcher;
  children: (role: number) => React.ReactNode;
}) {
  const t = useI18n();
  const status = useRole(fetcher);
  if (status.state === "loading") return <LoadingStatus label={t("Checking your access…")} />;
  if (status.state === "error") {
    return (
      <ListError
        title={t("Couldn't check your access to EmVB")}
        message={status.message}
        onRetry={status.retry}
      />
    );
  }
  if (!canUseEmvb(status.role)) {
    return (
      <section data-emvb-access="denied">
        <Empty
          icon={<LockKeyIcon size={32} aria-hidden="true" />}
          title={t("You don't have access to EmVB")}
          description={t(
            "Visual pages are managed by editors and administrators. Ask an administrator if you need access.",
          )}
        />
      </section>
    );
  }
  return children(status.role);
}
