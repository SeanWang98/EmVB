/**
 * [INPUT]: 依赖 Page 的受控 JSON 字段与 EmVB 字段会话。
 * [OUTPUT]: 提供 canvas 字段组件；应用只调用 onChange。
 * [POS]: 原生 Page 表单入口；不导航、不保存独立页面。
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import { Button, Text } from "@cloudflare/kumo";
import { CursorClickIcon } from "@phosphor-icons/react";
import * as React from "react";
import { summarizeLayout, type Layout } from "../../core/index.ts";
import { defaultFetcher, type Fetcher } from "../api.ts";
import { FieldEditor, readFieldLayout } from "../editor/FieldEditor.tsx";
import type { FieldWidgetProps } from "./LayoutField.tsx";

export function CanvasField({
  value,
  onChange,
  label,
  id,
  fetcher = defaultFetcher,
}: FieldWidgetProps & { fetcher?: Fetcher }) {
  const [session, setSession] = React.useState<{ value: unknown } | null>(null);
  const trigger = React.useRef<HTMLButtonElement>(null);
  const summary = React.useMemo(() => {
    try {
      return summarizeLayout(readFieldLayout(value));
    } catch {
      return null;
    }
  }, [value]);
  const close = React.useCallback(() => {
    setSession(null);
    // Portal 清除 inert 后，再将焦点交回字段入口。
    queueMicrotask(() => trigger.current?.focus());
  }, []);
  const apply = React.useCallback(
    (layout: Layout | null) => {
      onChange(layout);
      close();
    },
    [onChange, close],
  );
  return (
    <div
      id={id}
      role="group"
      aria-label={label}
      data-emvb-widget="canvas"
      className="flex flex-col gap-2"
    >
      <Text variant="secondary">{label}</Text>
      <Text>
        {summary
          ? `${summary.nodes} elements · schema ${summary.schemaVersion}`
          : "尚无画布正文，点击开始编辑。"}
      </Text>
      <Text variant="secondary">
        应用后交由 Page 保存草稿（含自动保存）和发布。站点样式与共享资源独立保存。
      </Text>
      <div>
        <Button
          type="button"
          ref={trigger}
          variant="secondary"
          icon={<CursorClickIcon aria-hidden="true" />}
          onClick={() => setSession({ value: structuredClone(value) })}
        >
          Edit with EmVB
        </Button>
      </div>
      {session && (
        <FieldEditor
          value={session.value}
          label={label}
          fetcher={fetcher}
          onApply={apply}
          onCancel={close}
        />
      )}
    </div>
  );
}
