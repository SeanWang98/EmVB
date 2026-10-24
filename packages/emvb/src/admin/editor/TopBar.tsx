/**
 * [INPUT]: 依赖编辑状态、延迟翻译消息与后台语言订阅。
 * [OUTPUT]: 提供页面操作栏或字段应用操作栏。
 * [POS]: 顶部入口按后台语言显示；字段模式隐藏发布。
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import { useI18n } from "../i18n/index.ts";
import { Button, DropdownMenu, Loader } from "@cloudflare/kumo";
import * as React from "react";
import {
  ArrowSquareOutIcon,
  CaretDownIcon,
  DesktopIcon,
  DeviceMobileIcon,
  DeviceTabletIcon,
  FloppyDiskIcon,
  KeyboardIcon,
  PaintBrushIcon,
  SignOutIcon,
  UploadSimpleIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import { BUTTON, SOLID_PRIMARY } from "../ui.ts";
import { statusLabel } from "../entry-status.ts";
import type { SaveStatus } from "./useSave.ts";
import { formatMessage } from "./localized-message.ts";
import type { PopupDevice } from "../../core/index.ts";
import { useMediaQuery } from "./useMediaQuery.ts";

/** Preview sizes (W-158): the canvas device widths, in a window of that size. */
const PREVIEW_SIZES = [
  { device: "desktop", label: "Desktop", icon: DesktopIcon },
  { device: "tablet", label: "Tablet (768 px)", icon: DeviceTabletIcon },
  { device: "mobile", label: "Mobile (390 px)", icon: DeviceMobileIcon },
] as const;

export type TopBarPage = { title: string; status: string };

function SaveStatusText({
  status,
  dirty,
  busy,
  onRetry,
}: {
  status: SaveStatus;
  dirty: boolean;
  busy: "save" | "publish" | null;
  onRetry: () => void;
}) {
  const t = useI18n();
  let content: React.ReactNode = null;
  if (busy === "publish") content = t("Publishing…");
  else if (busy === "save" || status.kind === "saving") content = t("Saving…");
  else if (status.kind === "error") {
    content = (
      <>
        <WarningCircleIcon size={16} aria-hidden="true" className="emvb-danger-icon" />
        {formatMessage(status.message, t)}
        {status.retry && (
          <button type="button" className="emvb-link-button" onClick={onRetry}>
            {t("Retry")}
          </button>
        )}
      </>
    );
  } else if (dirty) content = t("Unsaved changes");
  else if (status.kind === "saved") content = t("Saved");
  return (
    <div className="emvb-save-status" role="status" aria-live="polite" data-emvb-save={status.kind}>
      {content}
    </div>
  );
}

/** Top bar (IA): Exit, page, status | save status | shortcuts, Preview, Save draft, Publish. */
export function TopBar({
  page,
  dirty,
  status,
  busy,
  onExit,
  onShortcuts,
  onSiteStyles,
  onPreview,
  onSave,
  onPublish,
  stylesUnpublished = false,
  canRevert = false,
  onRevert,
  tools,
  fieldMode = false,
}: {
  page: TopBarPage | null;
  dirty: boolean;
  status: SaveStatus;
  busy: "save" | "publish" | null;
  onExit: () => void;
  onShortcuts: () => void;
  onSiteStyles?: () => void;
  /** Opens the preview; with no device, at the device shown on the canvas (W-158). */
  onPreview: (device?: PopupDevice) => void;
  onSave: () => void;
  onPublish: () => void;
  /** Site styles have unpublished changes (W-153): the Publish button carries a dot. */
  stylesUnpublished?: boolean;
  /** Something differs from the published version (W-193). */
  canRevert?: boolean;
  /** Shown once the entry has a published version; asks before discarding. */
  onRevert?: () => void;
  /** Extra tools beside Site styles: the page weight and accessibility meters, … (W-310). */
  tools?: React.ReactNode;
  fieldMode?: boolean;
}) {
  const t = useI18n();
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  // W-769: a disabled button drops focus to the page body, so the button that was focused when
  // the work began gets it back once it is done. W-816: Save draft and Publish no longer disable
  // while busy (aria-disabled, repeat presses ignored), so focus stays on them throughout.
  const refocus = React.useRef<HTMLElement | null>(null);
  const remember = (event: React.MouseEvent<HTMLElement>) => {
    refocus.current = document.activeElement === event.currentTarget ? event.currentTarget : null;
  };
  React.useEffect(() => {
    const button = refocus.current;
    if (busy !== null || !button) return;
    refocus.current = null;
    const active = document.activeElement;
    if (button.isConnected && (!active || active === document.body)) button.focus();
  }, [busy]);
  return (
    <header className="emvb-topbar">
      <div className="emvb-topbar-start">
        <Button
          type="button"
          variant="ghost"
          className={BUTTON}
          icon={<SignOutIcon aria-hidden="true" />}
          onClick={onExit}
        >
          {fieldMode ? t("Cancel") : t("Exit")}
        </Button>
        {page && (
          <>
            {/* UX-031: a long title ellipsizes; the tooltip keeps the whole name (DESIGN.md). */}
            <span
              className="emvb-topbar-title"
              title={page.title ? page.title : t("Untitled page")}
            >
              {page.title || t("Untitled page")}
            </span>
            {!fieldMode && (
              <span className="emvb-status" data-status={page.status}>
                <span className="emvb-status-dot" aria-hidden="true" />
                {t(statusLabel(page.status))}
              </span>
            )}
          </>
        )}
      </div>
      {page ? (
        <SaveStatusText status={status} dirty={dirty} busy={busy} onRetry={onSave} />
      ) : (
        <div />
      )}
      <div
        className="emvb-topbar-end"
        style={{
          display: "flex",
          flexDirection: "row",
          flexWrap: "nowrap",
          alignItems: "center",
          gap: 6,
        }}
      >
        <div
          className="emvb-topbar-tools"
          style={{
            display: "flex",
            flexDirection: "row",
            flexWrap: "nowrap",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Button
            variant="ghost"
            shape="square"
            className="emvb-icon-btn"
            aria-label={t("Keyboard shortcuts")}
            title={t("Keyboard shortcuts")}
            icon={<KeyboardIcon aria-hidden="true" />}
            onClick={onShortcuts}
          />
          {page && onSiteStyles && (
            <Button
              variant="ghost"
              shape="square"
              className="emvb-icon-btn"
              aria-label={t("Site styles")}
              title={t("Site styles")}
              icon={<PaintBrushIcon aria-hidden="true" />}
              onClick={onSiteStyles}
            />
          )}
          {page && tools}
        </div>
        {page && (
          <div
            className="emvb-topbar-actions"
            style={{
              display: "flex",
              flexDirection: "row",
              flexWrap: "nowrap",
              alignItems: "center",
              gap: 8,
            }}
          >
            {!fieldMode && (
              <div className="emvb-preview-split">
                <Button
                  variant="secondary"
                  className={BUTTON}
                  icon={<ArrowSquareOutIcon aria-hidden="true" />}
                  onClick={() => onPreview()}
                >
                  {t("Preview")}
                  {/* UX-082: the icon shows a new tab opens; screen readers hear it. */}
                  <span className="emvb-sr-only">{t(" (opens in a new tab)")}</span>
                </Button>
                <DropdownMenu>
                  <DropdownMenu.Trigger>
                    <Button
                      variant="secondary"
                      shape="square"
                      className={`${BUTTON} emvb-preview-sizes`}
                      aria-label={t("Preview size")}
                      title={t("Preview size")}
                      icon={<CaretDownIcon aria-hidden="true" />}
                    />
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Content data-emvb-preview-sizes="">
                    {PREVIEW_SIZES.map(({ device, label, icon }) => (
                      <DropdownMenu.Item key={device} icon={icon} onClick={() => onPreview(device)}>
                        {t(label)}
                      </DropdownMenu.Item>
                    ))}
                  </DropdownMenu.Content>
                </DropdownMenu>
              </div>
            )}
            {onRevert && (page.status === "published" || page.status === "changed") && (
              <Button
                variant="ghost"
                className={`${BUTTON} emvb-revert-button`}
                // W-828: a save or publish no longer disables Revert (focus fell to the page
                // body on Ctrl+S); it stays focusable and ignores presses while busy.
                disabled={!canRevert}
                aria-disabled={busy !== null}
                title={
                  canRevert ? t("Revert to published") : t("No changes since the last publish")
                }
                aria-label={t("Revert to published")}
                onClick={() => {
                  if (busy !== null) return;
                  onRevert();
                }}
              >
                {t("Revert")}
              </Button>
            )}
            <Button
              type="button"
              variant="secondary"
              className={`${BUTTON} emvb-save-button`}
              icon={
                busy === "save" && !reducedMotion ? (
                  <Loader size={14} />
                ) : (
                  <FloppyDiskIcon size={14} aria-hidden="true" />
                )
              }
              aria-disabled={busy !== null}
              aria-busy={busy === "save"}
              aria-label={
                fieldMode
                  ? t("Apply changes")
                  : dirty
                    ? t("Save draft (unsaved changes)")
                    : t("Save draft")
              }
              onClick={(event) => {
                if (busy !== null) return;
                remember(event);
                onSave();
              }}
            >
              {fieldMode ? t("Apply changes") : t("Save draft")}
              {dirty && <span className="emvb-unsaved-dot" aria-hidden="true" />}
            </Button>
            {!fieldMode && (
              <Button
                variant="primary"
                className={`${BUTTON} emvb-publish-button`}
                style={SOLID_PRIMARY}
                icon={
                  busy === "publish" && !reducedMotion ? (
                    <Loader size={14} />
                  ) : (
                    <UploadSimpleIcon size={14} aria-hidden="true" />
                  )
                }
                aria-disabled={busy !== null}
                aria-busy={busy === "publish"}
                aria-label={stylesUnpublished ? t("Publish (site styles unpublished)") : undefined}
                title={
                  stylesUnpublished
                    ? t(
                        "Site styles have unpublished changes. After publishing the page, you can publish them too.",
                      )
                    : undefined
                }
                data-emvb-styles-pending={stylesUnpublished ? "true" : undefined}
                onClick={(event) => {
                  if (busy !== null) return;
                  remember(event);
                  onPublish();
                }}
              >
                {t("Publish")}
              </Button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
