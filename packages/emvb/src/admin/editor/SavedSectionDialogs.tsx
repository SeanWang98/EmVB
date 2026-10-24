/**
 * [INPUT]: 依赖共享区块保存接口、延迟错误与后台语言。
 * [OUTPUT]: 提供区块保存与删除确认弹窗。
 * [POS]: 共享区块入口；语言切换刷新错误，保留名称与类型。
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import { useI18n } from "../i18n/index.ts";
import { Button, Dialog, Input, Radio } from "@cloudflare/kumo";
import * as React from "react";
import { SAVED_SECTION_NAME_MAX } from "../../core/index.ts";
import { BUTTON, FIELD, SOLID_DESTRUCTIVE, SOLID_PRIMARY, UI_CSS } from "../ui.ts";
import { DialogCloseButton } from "./DialogCloseButton.tsx";
import { focusWhenLost } from "./focus-when-lost.ts";
import type { SaveMode } from "./useSavedSections.ts";
import { formatMessage, type LocalizedMessage } from "./localized-message.ts";

/**
 * Save as section… (W-876, D-060): a name, and Copy (My sections, independent copies) or Synced
 * (a Section theme part edited in one place). Stays open with the reason when the save fails.
 */
export function SaveSectionDialog({
  open,
  onOpenChange,
  defaultName,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultName: string;
  onSave: (name: string, mode: SaveMode) => Promise<LocalizedMessage | null>;
}) {
  const t = useI18n();
  const [name, setName] = React.useState(defaultName);
  const [mode, setMode] = React.useState<SaveMode>("copy");
  const [error, setError] = React.useState<LocalizedMessage | null>(null);
  const [busy, setBusy] = React.useState(false);
  // W-883: opened from a Layers row menu or the palette, the dialog has no opener left to give
  // focus back to, so Escape or Cancel dropped it on the page body.
  const wasOpen = React.useRef(open);
  React.useEffect(() => {
    const was = wasOpen.current;
    wasOpen.current = open;
    return was && !open ? focusWhenLost() : undefined;
  }, [open]);
  const initializedOpen = React.useRef(false);
  React.useEffect(() => {
    const opening = open && !initializedOpen.current;
    initializedOpen.current = open;
    if (!opening) return;
    // 默认名称随语言更新；已打开的表单仍属于用户当前会话。
    setName(defaultName);
    setMode("copy");
    setError(null);
  }, [open, defaultName]);
  const submit = async () => {
    if (busy) return;
    if (!name.trim()) {
      setError("Give the section a name.");
      return;
    }
    setBusy(true);
    const failed = await onSave(name, mode);
    setBusy(false);
    if (failed) setError(failed);
    else onOpenChange(false);
  };
  return (
    <Dialog.Root open={open} onOpenChange={(next) => (!busy || next) && onOpenChange(next)}>
      <Dialog size="base" className="p-6">
        <style>{UI_CSS}</style>
        <form
          data-emvb-dialog="save-section"
          className="emvb-dialog"
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <Dialog.Title>{t("Save as section")}</Dialog.Title>
          <Dialog.Description>
            {t("Reuse this element and everything inside it on any page.")}
          </Dialog.Description>
          <Input
            label={t("Name")}
            className={FIELD}
            autoFocus
            readOnly={busy}
            maxLength={SAVED_SECTION_NAME_MAX}
            value={name}
            aria-invalid={error ? true : undefined}
            error={error ? formatMessage(error, t) : undefined}
            onChange={(event) => {
              setName(event.target.value);
              setError(null);
            }}
          />
          <Radio.Group
            legend={t("Kind")}
            appearance="card"
            value={mode}
            onValueChange={(value) => setMode(value as SaveMode)}
            disabled={busy}
            className="emvb-save-kind"
          >
            <Radio.Item
              value="copy"
              label={t("Copy")}
              description={t(
                "Adds to My sections. Each insert is its own copy you edit on that page.",
              )}
            />
            <Radio.Item
              value="synced"
              label={t("Synced")}
              description={t(
                "Makes a Section theme part. Edit it once in Theme Builder and every page that uses it changes.",
              )}
            />
          </Radio.Group>
          <p className="emvb-sr-only" role="status" aria-live="polite">
            {busy ? t("Saving section…") : ""}
          </p>
          <div className="emvb-dialog-actions">
            <DialogCloseButton>{t("Cancel")}</DialogCloseButton>
            <Button
              type="submit"
              variant="primary"
              className={BUTTON}
              style={SOLID_PRIMARY}
              aria-disabled={busy || undefined}
              data-emvb-save-section-submit=""
            >
              {t(mode === "synced" ? "Make synced section" : "Save section")}
            </Button>
          </div>
        </form>
      </Dialog>
    </Dialog.Root>
  );
}

/** Delete from My sections, after a confirm. Pages that hold a copy keep it. */
export function DeleteSavedSectionDialog({
  name,
  onOpenChange,
  onDelete,
  onClosed,
}: {
  /** The section to delete; null when closed. */
  name: string | null;
  onOpenChange: (open: boolean) => void;
  onDelete: () => void;
  /** Runs after the close animation, so the caller can move focus once the dialog has gone. */
  onClosed: () => void;
}) {
  const t = useI18n();
  return (
    <Dialog.Root
      open={name !== null}
      onOpenChange={onOpenChange}
      onOpenChangeComplete={(open) => {
        if (!open) onClosed();
      }}
    >
      <Dialog size="base" className="p-6">
        <style>{UI_CSS}</style>
        <div data-emvb-dialog="delete-saved-section" className="emvb-dialog">
          <Dialog.Title>{t("Delete “{name}”?", { name: name ?? "" })}</Dialog.Title>
          <Dialog.Description>
            {t("It leaves My sections. Pages that already use a copy keep it.")}
          </Dialog.Description>
          <div className="emvb-dialog-actions">
            <DialogCloseButton>{t("Cancel")}</DialogCloseButton>
            <Button
              variant="destructive"
              className={BUTTON}
              style={SOLID_DESTRUCTIVE}
              onClick={onDelete}
            >
              {t("Delete section")}
            </Button>
          </div>
        </div>
      </Dialog>
    </Dialog.Root>
  );
}
