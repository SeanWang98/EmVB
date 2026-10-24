/**
 * [INPUT]: 依赖 Kumo 输入、数值范围与按当前语言格式化的错误。
 * [OUTPUT]: 导出 NumberField、NumberRow、ResetButton 与 NumberSpec。
 * [POS]: 数值与重置控件；错误保留输入和范围快照，标签跟随界面语言。
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import { useI18n, type Translate } from "../../../i18n/index.ts";
import { Button, Input } from "@cloudflare/kumo";
import { ArrowCounterClockwiseIcon } from "@phosphor-icons/react";
import * as React from "react";
import { BUTTON, FIELD } from "../../../ui.ts";
import { isCommitEnter } from "../../ime.ts";
import { formatError, type LocalizedError } from "./localized-error.ts";

/** Range and scale of a plain number field; `scale` converts stored to shown (opacity 0–1 → %). */
export type NumberSpec = {
  min: number;
  max: number;
  integer?: boolean;
  scale?: number;
  example: string;
  suffix?: string;
  placeholder?: string;
};

/** Checks a number field's text. Empty is unset. Returns the stored number. */
function parseNumberDraft(
  draft: string,
  label: string,
  spec: NumberSpec,
  t: Translate,
): { ok: true; value: number | undefined } | { ok: false; message: string } {
  const text = draft.trim();
  if (text === "") return { ok: true, value: undefined };
  const n = /^-?(?:\d+(?:\.\d*)?|\.\d+)$/.test(text) ? Number(text) : Number.NaN;
  if (!Number.isFinite(n))
    return {
      ok: false,
      message: t("Enter a number, such as {example}.", { example: spec.example }),
    };
  if (spec.integer && !Number.isInteger(n)) {
    return { ok: false, message: t("{label} must be a whole number.", { label }) };
  }
  if (n < spec.min || n > spec.max) {
    return {
      ok: false,
      message: t("{label} can be from {min} to {max}.", {
        label,
        min: spec.min,
        max: spec.max,
      }),
    };
  }
  const scale = spec.scale ?? 1;
  return { ok: true, value: scale === 1 ? n : Math.round((n / scale) * 1000) / 1000 };
}

const shown = (value: number | undefined, spec: NumberSpec) =>
  value === undefined ? "" : String(Math.round(value * (spec.scale ?? 1) * 1000) / 1000);

/** A mono number input that commits on blur or Enter (W-088). */
export function NumberField({
  fieldKey,
  label,
  value,
  spec,
  inherited,
  onCommit,
}: {
  fieldKey: string;
  label: string;
  value: number | undefined;
  spec: NumberSpec;
  /** The Normal value, shown as the placeholder while a state is edited (W-089). */
  inherited?: number;
  onCommit: (next: number | undefined) => void;
}) {
  const t = useI18n();
  const shownLabel = t(label);
  const labelRef = React.useRef(shownLabel);
  labelRef.current = shownLabel;
  const [draft, setDraft] = React.useState(shown(value, spec));
  const [error, setError] = React.useState<LocalizedError | null>(null);
  const errorText = formatError(error, t);
  // W-604: keyed on the spec's contents, not its identity; callers that build a spec per render
  // (Transition's Delay, Motion's fields) reset the draft whenever the panel re-rendered.
  const specKey = JSON.stringify(spec);
  const specRef = React.useRef(spec);
  specRef.current = spec;
  React.useEffect(() => {
    setDraft(shown(value, specRef.current));
    setError(null);
  }, [value, specKey]);

  const commit = () => {
    const parsed = parseNumberDraft(draft, shownLabel, spec, t);
    if (!parsed.ok) {
      const capturedSpec = { ...spec };
      setError({
        format: (tr) => {
          const again = parseNumberDraft(draft, labelRef.current, capturedSpec, tr);
          return again.ok ? "" : again.message;
        },
      });
      return;
    }
    setError(null);
    if (parsed.value !== value) onCommit(parsed.value);
  };

  return (
    <Input
      label={spec.suffix ? `${shownLabel} (${spec.suffix})` : shownLabel}
      className={`${FIELD} emvb-mono emvb-number`}
      inputMode="decimal"
      value={draft}
      placeholder={inherited === undefined ? spec.placeholder : shown(inherited, spec)}
      error={errorText ?? undefined}
      aria-invalid={error ? true : undefined}
      data-emvb-number={fieldKey}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (isCommitEnter(event)) commit();
      }}
    />
  );
}

/** The row's reset button (W-021): enabled once the property is set. */
export function ResetButton({
  label,
  set,
  onReset,
}: {
  label: string;
  set: boolean;
  onReset: () => void;
}) {
  const t = useI18n();
  return (
    <Button
      type="button"
      variant="ghost"
      className={`${BUTTON} emvb-reset-btn`}
      aria-label={t("Reset {label} to default", { label: t(label) })}
      title={t("Reset to default")}
      disabled={!set}
      onClick={onReset}
    >
      <ArrowCounterClockwiseIcon size={14} aria-hidden="true" />
    </Button>
  );
}

/** A number field with its reset button, as one Style row. */
export function NumberRow({
  rowKey,
  label,
  value,
  spec,
  inherited,
  onCommit,
}: {
  rowKey: string;
  label: string;
  value: number | undefined;
  spec: NumberSpec;
  inherited?: number;
  onCommit: (next: number | undefined) => void;
}) {
  const set = value !== undefined;
  return (
    <div
      className="emvb-style-row"
      data-emvb-style={rowKey}
      data-set={set ? "true" : undefined}
      data-inherited={!set && inherited !== undefined ? "true" : undefined}
    >
      <NumberField
        fieldKey={rowKey}
        label={label}
        value={value}
        spec={spec}
        inherited={inherited}
        onCommit={onCommit}
      />
      <ResetButton label={label} set={set} onReset={() => onCommit(undefined)} />
    </div>
  );
}
