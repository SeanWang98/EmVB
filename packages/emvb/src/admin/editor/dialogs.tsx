/**
 * [INPUT]: 依赖编辑确认动作、字段模式与后台语言。
 * [OUTPUT]: 提供冲突、回退、离开与删除确认弹窗。
 * [POS]: 确认边界；翻译操作模板，保留标签和数量参数。
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import { useI18n } from "../i18n/index.ts";
import { Button, Dialog, Loader } from "@cloudflare/kumo";
import { useMediaQuery } from "./useMediaQuery.ts";
import { useEditedNoun } from "./edited-noun.ts";
import { BUTTON, SOLID_DESTRUCTIVE, SOLID_PRIMARY, UI_CSS } from "../ui.ts";
import { DialogCloseButton } from "./DialogCloseButton.tsx";

type OpenProps = { open: boolean; onOpenChange: (open: boolean) => void };

/** 409 on save (R-006): the stored page changed; the user chooses, nothing is overwritten silently. */
export function ConflictDialog({
  open,
  onOpenChange,
  onReload,
  onOverwrite,
}: OpenProps & { onReload: () => void; onOverwrite: () => void }) {
  const t = useI18n();
  const noun = useEditedNoun();
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog size="base" className="p-6">
        <style>{UI_CSS}</style>
        <div data-emvb-dialog="conflict" className="emvb-dialog">
          <Dialog.Title>
            {t("This {noun} was changed somewhere else", { noun: t(noun) })}
          </Dialog.Title>
          <Dialog.Description>
            {t(
              "Someone saved this {noun} after you opened it. Reload to get their version and lose your unsaved changes, or overwrite their version with yours.",
              { noun: t(noun) },
            )}
          </Dialog.Description>
          <div className="emvb-dialog-actions">
            <Button variant="secondary" className={BUTTON} onClick={onReload}>
              {t("Reload page")}
            </Button>
            <Button
              variant="destructive"
              className={BUTTON}
              style={SOLID_DESTRUCTIVE}
              onClick={onOverwrite}
            >
              {t("Overwrite their version")}
            </Button>
          </div>
        </div>
      </Dialog>
    </Dialog.Root>
  );
}

/** Revert to published (W-193): drops the saved draft and any unsaved edits, after a confirm. */
export function RevertDialog({
  open,
  onOpenChange,
  onRevert,
}: OpenProps & { onRevert: () => void }) {
  const t = useI18n();
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog size="base" className="p-6">
        <style>{UI_CSS}</style>
        <div data-emvb-dialog="revert" className="emvb-dialog">
          <Dialog.Title>{t("Revert to the published version?")}</Dialog.Title>
          <Dialog.Description>
            {t(
              "Your saved draft and any unsaved changes are discarded, and the editor shows what is live now. This can't be undone.",
            )}
          </Dialog.Description>
          <div className="emvb-dialog-actions">
            <DialogCloseButton>{t("Cancel")}</DialogCloseButton>
            <Button
              variant="destructive"
              className={BUTTON}
              style={SOLID_DESTRUCTIVE}
              onClick={onRevert}
            >
              {t("Revert to published")}
            </Button>
          </div>
        </div>
      </Dialog>
    </Dialog.Root>
  );
}

/** Exit with unsaved changes (IA "Leaving the editor"). */
export function LeaveDialog({
  open,
  onOpenChange,
  onDiscard,
  onSaveAndLeave,
  saving = false,
  fieldMode = false,
}: OpenProps & {
  onDiscard: () => void;
  onSaveAndLeave: () => void;
  /** W-834: Save and leave is saving; the dialog shows it and ignores presses and closing. */
  saving?: boolean;
  fieldMode?: boolean;
}) {
  const t = useI18n();
  const noun = useEditedNoun();
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const unlessSaving = (run: () => void) => () => {
    if (!saving) run();
  };
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next && saving) return;
        onOpenChange(next);
      }}
    >
      <Dialog size="base" className="p-6">
        <style>{UI_CSS}</style>
        <div data-emvb-dialog="leave" className="emvb-dialog">
          <Dialog.Title>
            {fieldMode ? t("Discard canvas changes?") : t("Leave without saving?")}
          </Dialog.Title>
          <Dialog.Description>
            {fieldMode ? (
              t(
                "Only Apply changes returns this layout to the Page form. Site styles and shared resources save separately.",
              )
            ) : (
              <>{t("You have unsaved changes on this {noun}.", { noun: t(noun) })}</>
            )}
          </Dialog.Description>
          <div className="emvb-dialog-actions">
            <Dialog.Close
              render={(props) => (
                <Button {...props} variant="secondary" className={BUTTON} aria-disabled={saving}>
                  {t("Keep editing")}
                </Button>
              )}
            />
            <Button
              variant="secondary"
              className={`${BUTTON} emvb-danger-text`}
              aria-disabled={saving}
              onClick={unlessSaving(onDiscard)}
            >
              {t("Discard changes")}
            </Button>
            <Button
              variant="primary"
              className={BUTTON}
              style={SOLID_PRIMARY}
              icon={saving && !reducedMotion ? <Loader size={14} /> : undefined}
              aria-disabled={saving}
              aria-busy={saving}
              onClick={unlessSaving(onSaveAndLeave)}
            >
              {saving ? t("Saving…") : fieldMode ? t("Apply and return") : t("Save and leave")}
            </Button>
          </div>
        </div>
      </Dialog>
    </Dialog.Root>
  );
}

/** Confirm deleting an element that has children (W-020). */
export function DeleteSubtreeDialog({
  open,
  onOpenChange,
  label,
  count,
  onConfirm,
}: OpenProps & { label: string; count: number; onConfirm: () => void }) {
  const t = useI18n();
  const inside = count - 1;
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog size="base" className="p-6">
        <style>{UI_CSS}</style>
        <div data-emvb-dialog="delete-subtree" className="emvb-dialog">
          <Dialog.Title>
            {inside === 1
              ? t("Delete {label} and the {inside} element inside it?", { label, inside })
              : t("Delete {label} and the {inside} elements inside it?", { label, inside })}
          </Dialog.Title>
          <Dialog.Description>
            {t("You can undo this with Restore right after.")}
          </Dialog.Description>
          <div className="emvb-dialog-actions">
            <DialogCloseButton>{t("Cancel")}</DialogCloseButton>
            <Button
              variant="destructive"
              className={BUTTON}
              style={SOLID_DESTRUCTIVE}
              onClick={onConfirm}
            >
              {t("Delete {count} elements", { count })}
            </Button>
          </div>
        </div>
      </Dialog>
    </Dialog.Root>
  );
}
