/**
 * [INPUT]: 依赖集合探测、初始化操作与界面翻译。
 * [OUTPUT]: 提供加载、初始化与升级状态外壳。
 * [POS]: 后台页面公共外壳；不翻译写入的集合数据。
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import { useI18n } from "../i18n/index.ts";
import { Banner, Button, Empty, Loader } from "@cloudflare/kumo";
import { LayoutIcon } from "@phosphor-icons/react";
import * as React from "react";
import type { Fetcher } from "../api.ts";
import { useMediaQuery } from "../editor/useMediaQuery.ts";
import { useSetupStatus } from "../setup/useSetupStatus.ts";
import { BUTTON, SOLID_PRIMARY, UI_CSS } from "../ui.ts";
import { ListError, ListLoading } from "./list-kit.tsx";

/**
 * Shared setup chrome for the plugin's admin pages: loading/error states, the set-up and upgrade
 * prompts, and the ready wrapper (`data-emvb-setup="ready"`). Page content goes in `children`.
 */
export function SetupShell({
  fetcher,
  role,
  page,
  title,
  keptNote,
  children,
}: {
  fetcher: Fetcher;
  role: number;
  /** The `data-emvb-page` value (`pages`, `theme`). */
  page: string;
  title: string;
  /** The outdated-banner reassurance line ("Existing pages are kept." / "Existing content is kept."). */
  keptNote: string;
  children: React.ReactNode;
}) {
  const t = useI18n();
  const { status, running, setup, retry } = useSetupStatus(fetcher, role);
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  // UX-012: the list's own loading card and a Retry that brings Set up back after a failure.
  if (status.state === "loading" || status.state === "error") {
    return (
      <section data-emvb-page={page} className="emvb-pages">
        <style data-emvb-ui="">{UI_CSS}</style>
        <h1 className="emvb-page-title">{title}</h1>
        {status.state === "loading" ? (
          <ListLoading label={t("Loading {title}…", { title })} />
        ) : (
          <ListError
            title={t("Couldn't load {title}", { title })}
            message={status.message}
            onRetry={() => void retry()}
          />
        )}
      </section>
    );
  }
  const action = (label: string) =>
    status.isAdmin ? (
      <Button
        variant="primary"
        className={BUTTON}
        style={SOLID_PRIMARY}
        // W-830: Kumo's `loading` disables the button, which dropped keyboard focus to the page
        // body while setup ran. It stays focusable (aria-disabled) and ignores presses instead.
        icon={running && !reducedMotion ? <Loader size={14} /> : undefined}
        aria-disabled={running}
        aria-busy={running}
        onClick={() => {
          if (!running) void setup();
        }}
      >
        {label}
      </Button>
    ) : undefined;

  return (
    <section data-emvb-page={page} className="emvb-pages">
      <style>{UI_CSS}</style>
      {status.state !== "ready" && <h1 className="emvb-page-title">{title}</h1>}
      {status.state === "missing" && (
        <div className="emvb-surface-card emvb-empty-shell">
          <Empty
            icon={<LayoutIcon size={32} aria-hidden="true" />}
            title={t("EmVB isn't set up yet")}
            description={
              status.isAdmin
                ? t("Setup creates the collections EmVB stores its pages and theme parts in.")
                : t("Ask an administrator to set up EmVB.")
            }
            contents={action(t("Set up EmVB"))}
          />
        </div>
      )}
      {status.state === "outdated" && (
        <Banner
          variant="alert"
          title={t("EmVB needs to update its collections")}
          description={
            status.conflicts.length > 0
              ? status.conflicts.join(" ")
              : status.isAdmin
                ? t("Upgrading adds or corrects EmVB's fields. {note}", { note: keptNote })
                : t("Ask an administrator to upgrade EmVB.")
          }
          action={status.conflicts.length > 0 ? undefined : action(t("Upgrade EmVB"))}
        />
      )}
      {status.state === "ready" && children}
    </section>
  );
}
