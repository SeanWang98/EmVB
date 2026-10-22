/**
 * [INPUT]: 依赖宿主返回入口及会话退出保护。
 * [OUTPUT]: 提供窄屏提示与受保护的返回动作。
 * [POS]: 编辑器响应式边界；字段会话复用取消确认。
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import { Button, Empty } from "@cloudflare/kumo";
import { DesktopIcon } from "@phosphor-icons/react";
import { useEditorHost } from "./host.ts";

export function SmallScreenNotice({ onBack }: { onBack?: () => void } = {}) {
  const { back } = useEditorHost();
  return (
    <div className="emvb-state emvb-small-screen" data-emvb-small-screen="">
      <Empty
        icon={<DesktopIcon size={32} aria-hidden="true" />}
        title="EmVB needs a larger screen"
        description="The editor works on screens at least 1024 px wide, and 1280 px or wider is best."
        contents={
          <Button type="button" variant="secondary" onClick={onBack ?? back.go}>
            Back to {back.label}
          </Button>
        }
      />
    </div>
  );
}
