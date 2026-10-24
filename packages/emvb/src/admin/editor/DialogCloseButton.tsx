/**
 * [INPUT]: 依赖 Kumo 弹窗关闭契约与调用方按钮内容。
 * [OUTPUT]: 提供统一次要关闭按钮。
 * [POS]: 编辑器弹窗控件；调用方提供已翻译的文案。
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import { Button, Dialog } from "@cloudflare/kumo";
import type * as React from "react";
import { BUTTON } from "../ui.ts";

/** The secondary Close or Cancel button that closes a Kumo dialog (UX-009). */
export function DialogCloseButton({ children }: { children: React.ReactNode }) {
  return (
    <Dialog.Close
      render={(props) => (
        <Button {...props} variant="secondary" className={BUTTON}>
          {children}
        </Button>
      )}
    />
  );
}
