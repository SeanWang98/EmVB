/**
 * [INPUT]: 依赖核心状态枚举、Kumo Tabs 与后台翻译。
 * [OUTPUT]: 导出 StateDot、StateSwitcher 与 StyleStateChoice。
 * [POS]: 元素设置面板的交互状态切换器，翻译展示文案并保留存储值。
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import { useI18n } from "../../../i18n/index.ts";
import { Tabs } from "@cloudflare/kumo";
import * as React from "react";
import { STYLE_STATES, type StyleStateName, type StyleStates } from "../../../../core/index.ts";

/** Normal edits `style`; the others edit `states[state]` (W-089). */
export type StyleStateChoice = "normal" | StyleStateName;

const STATE_LABELS: Record<StyleStateChoice, string> = {
  normal: "Normal",
  hover: "Hover",
  focus: "Focus",
  active: "Active",
};

const CHOICES: StyleStateChoice[] = ["normal", ...STYLE_STATES];

const isChoice = (value: string): value is StyleStateChoice =>
  (CHOICES as string[]).includes(value);

/**
 * The dot shown where state styles exist (DESIGN.md § State styles). Decorative on the state tabs,
 * so their names stay "Hover", "Focus" and "Active".
 */
export function StateDot({ decorative = false }: { decorative?: boolean }) {
  const t = useI18n();
  return decorative ? (
    <span className="emvb-state-dot" aria-hidden="true" title={t("Has state styles")} />
  ) : (
    <span
      className="emvb-state-dot"
      role="img"
      aria-label={t("Has state styles")}
      title={t("Has state styles")}
    />
  );
}

/** Normal | Hover | Focus | Active, under the Classes box (W-089). */
export function StateSwitcher({
  value,
  states,
  className,
  onChange,
}: {
  value: StyleStateChoice;
  /** The states of what is being edited, for the dots on the tabs. */
  states: StyleStates | undefined;
  /** The class being edited, or null for the element's own style. */
  className: string | null;
  onChange: (next: StyleStateChoice) => void;
}) {
  const t = useI18n();
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    ref.current?.querySelector('[role="tablist"]')?.setAttribute("aria-label", t("Style state"));
  });
  const tabs = CHOICES.map((choice) => ({
    value: choice,
    label:
      choice !== "normal" && Object.keys(states?.[choice] ?? {}).length > 0 ? (
        <>
          {t(STATE_LABELS[choice])}
          <StateDot decorative />
        </>
      ) : (
        t(STATE_LABELS[choice])
      ),
  }));
  const label = t(STATE_LABELS[value]);
  return (
    <div ref={ref} className="emvb-state-switch" data-emvb-state-switch={value}>
      <Tabs
        variant="segmented"
        size="sm"
        className="emvb-state-tabs"
        tabs={tabs}
        value={value}
        onValueChange={(next) => onChange(isChoice(next) ? next : "normal")}
      />
      {value !== "normal" && (
        <p className="emvb-helper" data-emvb-state-help="">
          {className
            ? t('Editing {state} for class "{name}"', { state: label, name: className })
            : t("Editing {state} for this element", { state: label })}
        </p>
      )}
    </div>
  );
}
