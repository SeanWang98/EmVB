/**
 * [INPUT]: 依赖布局字段与设置面板的调用参数。
 * [OUTPUT]: 标签与选项由调用方翻译；存储值保持原样。
 * [POS]: 元素设置面板的 PanelSelect 边界。
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import { Select } from "@cloudflare/kumo";
import { FIELD } from "../../../ui.ts";

type PanelOption = { value: string; label: string };

type Props = {
  value: string;
  options: readonly PanelOption[];
  onChange: (value: string) => void;
  /** Names the trigger when the row has no visible label of its own. */
  label?: string;
  /** The id of the row's visible label. */
  labelledBy?: string;
  className?: string;
  /** Data attributes for the wrapper, which also carries the current value as `data-value`. */
  data?: Record<`data-${string}`, string>;
};

/** A 28 px Kumo Select for panel rows that used a native select (UX-005). */
export function PanelSelect({
  value,
  options,
  onChange,
  label,
  labelledBy,
  className,
  data,
}: Props) {
  return (
    <span
      className={className ? `emvb-panel-select ${className}` : "emvb-panel-select"}
      data-value={value}
      {...data}
    >
      <Select
        className={FIELD}
        value={value}
        {...(labelledBy ? { "aria-labelledby": labelledBy } : { "aria-label": label })}
        onValueChange={(next) => onChange(String(next))}
        renderValue={(v: unknown) => options.find((o) => o.value === String(v))?.label ?? String(v)}
      >
        {options.map((option) => (
          <Select.Option key={option.value} value={option.value}>
            <span data-emvb-option={option.value}>{option.label}</span>
          </Select.Option>
        ))}
      </Select>
    </span>
  );
}
