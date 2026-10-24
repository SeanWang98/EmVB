/**
 * [INPUT]: 依赖布局节点、后台界面翻译与同目录字段控件。
 * [OUTPUT]: 主题部件绑定；选择循环项或区块并保存部件 id。
 * [POS]: 元素设置面板的 LoopItemBindControl；不拥有页面保存与发布。
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import { useI18n, type Translate } from "../../../i18n/index.ts";
import { Input, Select } from "@cloudflare/kumo";
import * as React from "react";
import type { ThemePartType } from "../../../../core/index.ts";
import type { Fetcher } from "../../../api.ts";
import { listThemeParts, type ThemePartSummary } from "../../../theme-api.ts";
import { FIELD } from "../../../ui.ts";
import { useAdminLinks } from "../../host.ts";

const MANUAL = "__manual__";
const NONE = "__none__";

/**
 * Loop Item theme-part binder (W-077): pick a published/draft Loop Item by title,
 * keep storing the part id string for render compatibility.
 */
export function LoopItemBindControl({
  value,
  fetcher,
  onChange,
  partType = "loop_item",
  label = "Loop item",
  emptyLabel = "Use nested elements",
  marker = "loop-item",
}: {
  value: string;
  fetcher: Fetcher;
  onChange: (itemPartId: string) => void;
  partType?: ThemePartType;
  label?: string;
  emptyLabel?: string;
  /** `data-emvb-${marker}-bind` keeps the loop-item tests stable. */
  marker?: string;
}) {
  const t = useI18n();
  const [parts, setParts] = React.useState<ThemePartSummary[] | null>(null);
  const [failed, setFailed] = React.useState(false);
  const adminLinks = useAdminLinks();

  React.useEffect(() => {
    let cancelled = false;
    void listThemeParts(fetcher)
      .then((all) => {
        if (cancelled) return;
        setParts(all.filter((part) => part.partType === partType));
        setFailed(false);
      })
      .catch(() => {
        if (!cancelled) {
          setParts(null);
          setFailed(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [fetcher, partType]);

  if (parts && parts.length > 0) {
    const known = parts.some((part) => part.id === value);
    const selectValue = value === "" ? NONE : known ? value : MANUAL;
    return (
      <div {...{ [`data-emvb-${marker}-bind`]: "list" }}>
        <Select
          label={t(label)}
          className={FIELD}
          value={selectValue}
          onValueChange={(next) => {
            if (!next || next === MANUAL) return;
            if (next === NONE) {
              onChange("");
              return;
            }
            onChange(next);
          }}
          renderValue={(current: unknown) => {
            if (current === NONE || current === "") return t(emptyLabel);
            if (current === MANUAL) return t("Current id (not in list)");
            const match = parts.find((part) => part.id === String(current));
            return match ? labelFor(match, t) : String(current);
          }}
        >
          <Select.Option value={NONE}>{t(emptyLabel)}</Select.Option>
          {!known && value ? (
            <Select.Option value={MANUAL}>{t("Current id (not in list)")}</Select.Option>
          ) : null}
          {parts.map((part) => (
            <Select.Option key={part.id} value={part.id}>
              {labelFor(part, t)}
            </Select.Option>
          ))}
        </Select>
        <Input
          label={t("{name} part id", { name: t(label) })}
          className={`${FIELD} emvb-mono`}
          value={value}
          onChange={(event) => onChange(event.target.value.trim())}
        />
        <p className="emvb-helper">
          {t("Optional published {name} theme part. Leave blank to use nested elements.", {
            name: t(label),
          })}
          {adminLinks && <a href="/_emdash/admin/plugins/emvb/theme"> {t("Open Theme Builder")}</a>}
        </p>
      </div>
    );
  }

  return (
    <div {...{ [`data-emvb-${marker}-bind`]: "manual" }}>
      <Input
        label={t("{name} part id", { name: t(label) })}
        className={`${FIELD} emvb-mono`}
        value={value}
        onChange={(event) => onChange(event.target.value.trim())}
      />
      <p className="emvb-helper">
        {failed
          ? t("Could not load {name} parts. Paste a theme-part id", { name: t(label) }) +
            (adminLinks ? t(", or ") : ".")
          : t("No {name} theme parts yet. Paste an id", { name: t(label) }) +
            (adminLinks ? t(", or ") : ".")}
        {adminLinks && (
          <>
            <a href="/_emdash/admin/plugins/emvb/theme">{t("create one in Theme Builder")}</a>.
          </>
        )}
      </p>
    </div>
  );
}

function labelFor(part: ThemePartSummary, t: Translate): string {
  const status = part.status === "published" ? "" : ` (${t(part.status)})`;
  return `${part.title}${status}`;
}
