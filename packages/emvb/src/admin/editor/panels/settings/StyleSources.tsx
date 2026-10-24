/**
 * [INPUT]: 依赖 traceStyle、设计变量与后台翻译。
 * [OUTPUT]: 导出 StyleSources 与 sourceValue。
 * [POS]: 元素设置面板的样式继承检查器，翻译展示文案并保留存储值。
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import { useI18n, type Translate } from "../../../i18n/index.ts";
import { CaretRightIcon } from "@phosphor-icons/react";
import {
  traceStyle,
  type DesignSystem,
  type LayoutNode,
  type StyleSource,
  type TraceDevice,
} from "../../../../core/index.ts";

/** "backgroundColor" → "Background color". */
const propertyName = (key: string) => {
  const words = key.replace(/([A-Z])/g, " $1").toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
};

/** A short, readable value: a colour, a length, a variable, or JSON cut short. */
export function sourceValue(value: unknown, design?: DesignSystem): string {
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (value && typeof value === "object") {
    if ("var" in value) {
      const id = (value as { var: string }).var;
      const { colors, fonts, fontSizes, spacings } = design?.variables ?? { colors: [] };
      const named = [...colors, ...(fonts ?? []), ...(fontSizes ?? []), ...(spacings ?? [])].find(
        (v) => v.id === id,
      );
      return named ? named.name : `var ${id}`;
    }
    if ("value" in value && "unit" in value) {
      const v = value as { value: number; unit: string };
      return `${v.value}${v.unit}`;
    }
  }
  const json = JSON.stringify(value) ?? "";
  return json.length > 32 ? `${json.slice(0, 31)}…` : json;
}

const where = (source: StyleSource, t: Translate) => {
  const label =
    source.kind === "default"
      ? t("Site default ({tag})", { tag: source.label.slice("Site default (".length, -1) })
      : source.kind === "local"
        ? t("This element")
        : source.label;
  return source.layer === "Desktop" ? label : `${label} · ${t(source.layer)}`;
};

/**
 * Style inheritance inspector (W-318): every property that applies to this element here, the
 * layer it comes from (site default, a class, this element; Desktop, Tablet, Mobile or a state)
 * and what it overrides.
 */
export function StyleSources({
  node,
  design,
  device,
  state,
}: {
  node: LayoutNode;
  design: DesignSystem;
  device: TraceDevice;
  state: "normal" | "hover" | "focus" | "active";
}) {
  const t = useI18n();
  const trace = traceStyle(node, design, device, state);
  const keys = Object.keys(trace).toSorted();
  const fromElsewhere = keys.filter((key) => trace[key]?.winner.kind !== "local").length;
  return (
    <details className="emvb-sources" data-emvb-style-sources="">
      <summary>
        <span className="emvb-sources-label">{t("Where styles come from")}</span>
        <span className="emvb-sources-count">
          {keys.length === 0
            ? t("nothing set")
            : t(fromElsewhere > 0 ? "{count} set, {inherited} inherited" : "{count} set", {
                count: keys.length,
                inherited: fromElsewhere,
              })}
          {/* UX-037: the flex summary drops the native marker, so draw the section caret. */}
          <CaretRightIcon size={16} aria-hidden="true" className="emvb-sources-caret" />
        </span>
      </summary>
      {keys.length === 0 ? (
        <p className="emvb-helper">{t("No styles apply yet beyond the element's defaults.")}</p>
      ) : (
        <ul>
          {keys.map((key) => {
            const source = trace[key];
            if (!source) return null;
            return (
              <li key={key} data-emvb-source={key} data-kind={source.winner.kind}>
                <span className="emvb-sources-prop">{t(propertyName(key))}</span>
                <span className="emvb-sources-value">
                  {sourceValue(source.winner.value, design)}
                </span>
                <span className="emvb-sources-from">{where(source.winner, t)}</span>
                {source.overridden.length > 0 && (
                  <span className="emvb-sources-over">
                    {t("overrides")}{" "}
                    {source.overridden
                      .map((o) => `${where(o, t)} (${sourceValue(o.value, design)})`)
                      .join(", ")}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </details>
  );
}
