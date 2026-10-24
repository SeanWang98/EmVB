/**
 * [INPUT]: 依赖快捷键源文案、按键分组与后台语言上下文。
 * [OUTPUT]: 提供可翻译的快捷键说明弹窗。
 * [POS]: 编辑器帮助界面；按键定义保持原始标识。
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import { useI18n } from "../i18n/index.ts";
import * as React from "react";
import { Dialog } from "@cloudflare/kumo";
import { keyCombos, SHORTCUTS } from "./shortcuts.ts";
import { DialogCloseButton } from "./DialogCloseButton.tsx";

export function ShortcutsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useI18n();
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog size="base" className="p-6">
        <div className="emvb-dialog" data-emvb-dialog="shortcuts">
          <Dialog.Title>{t("Keyboard shortcuts")}</Dialog.Title>
          <table className="emvb-shortcuts">
            <tbody>
              {SHORTCUTS.map(({ action, keys }) => (
                <tr key={action}>
                  <td>{t(action)}</td>
                  {/* W-864: key boxes, as the command palette's tips; the text still reads "Ctrl/Cmd+K". */}
                  <td>
                    {keyCombos(keys).map(({ before, keys: combo }, i) => (
                      <React.Fragment key={i}>
                        {before === " or " ? t(" or ") : before}
                        {combo.map((key, k) => (
                          <React.Fragment key={k}>
                            {k > 0 ? "+" : null}
                            <kbd>{key}</kbd>
                          </React.Fragment>
                        ))}
                      </React.Fragment>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="emvb-helper">
            {t(
              "Shortcuts don't fire while a text field has focus, except Ctrl/Cmd+S and Ctrl/Cmd+K. In a dialog, only Ctrl/Cmd+S fires.",
            )}
          </p>
          <div className="emvb-dialog-actions">
            <DialogCloseButton>{t("Close")}</DialogCloseButton>
          </div>
        </div>
      </Dialog>
    </Dialog.Root>
  );
}
