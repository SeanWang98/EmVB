/**
 * [INPUT]: 依赖页面体积估算、布局与后台语言上下文。
 * [OUTPUT]: 提供体积预算界面与字节格式函数。
 * [POS]: 编辑器性能审计；界面翻译不改页面数据。
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import { useI18n, type Translate } from "../i18n/index.ts";
import { Dialog } from "@cloudflare/kumo";
import * as React from "react";
import {
  measurePage,
  PERF_BUDGETS,
  SCRIPT_LABELS,
  type DesignSystem,
  type Layout,
  type PerfKind,
  type ThemeDynamicData,
} from "../../core/index.ts";
import { ELEMENT_NAMES } from "./element-chrome.ts";
import { useEditedNoun } from "./edited-noun.ts";
import { DialogCloseButton } from "./DialogCloseButton.tsx";

const KINDS: { kind: PerfKind; label: string }[] = [
  { kind: "html", label: "HTML" },
  { kind: "css", label: "CSS" },
  { kind: "js", label: "JavaScript" },
  { kind: "images", label: "Images" },
];

// 预算数字来自核心估算；界面只翻译固定诊断模板。
function warningText(t: Translate, warning: string): string {
  const budget = /^(HTML|CSS|JS|IMAGES) is (.+), over the (.+) budget\.$/.exec(warning);
  if (budget)
    return t("{kind} is {size}, over the {budget} budget.", {
      kind: t(budget[1] === "IMAGES" ? "Images" : (budget[1] ?? "")),
      size: budget[2] ?? "",
      budget: budget[3] ?? "",
    });
  const embeds = /^(\d+) video embeds? load a third-party player \(about (.+) each\)\.$/.exec(
    warning,
  );
  if (embeds)
    return t(
      Number(embeds[1]) === 1
        ? "{count} video embed load a third-party player (about {size} each)."
        : "{count} video embeds load a third-party player (about {size} each).",
      { count: embeds[1] ?? "", size: embeds[2] ?? "" },
    );
  return t(warning);
}

/** UX-083: "1.4 KB", "100 KB", "1.5 MB": one decimal only where it says something. */
export const kb = (bytes: number) => {
  if (bytes < 1000) return `${bytes} B`;
  // W-771: round before choosing the form, so 1999 B is "2 KB", not "2.0 KB", and 999.6 KB is "1 MB".
  const inMb = Math.round(bytes / 1000) >= 1000;
  const raw = inMb ? bytes / 1_000_000 : bytes / 1000;
  const value = raw >= 100 ? Math.round(raw) : Math.round(raw * 10) / 10;
  return `${value} ${inMb ? "MB" : "KB"}`;
};

/**
 * The page's weight against its budget (W-310): one bar per kind, the scripts it loads (zero
 * by default, W-311), warnings, and the heaviest sections, each a click away on the canvas.
 */
export function PerfMeterDialog({
  open,
  onOpenChange,
  layout,
  design,
  parts,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  layout: Layout | null;
  design: DesignSystem;
  /** W-671: the synced sections and Loop Item parts the canvas shows, weighed with the page. */
  parts?: ThemeDynamicData;
  onSelect: (id: string) => void;
}) {
  const t = useI18n();
  const noun = useEditedNoun();
  const report = React.useMemo(
    () => (open && layout ? measurePage(layout, design, parts) : null),
    [open, layout, design, parts],
  );
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog size="base" className="p-6 emvb-perf" data-emvb-perf="">
        <div className="emvb-dialog" data-emvb-dialog="perf">
          <Dialog.Title>{t("Page weight")}</Dialog.Title>
          {report && (
            <>
              <ul className="emvb-perf-bars">
                {KINDS.map(({ kind, label }) => {
                  const share = Math.min(1, report.bytes[kind] / PERF_BUDGETS[kind]);
                  const over = report.over.includes(kind);
                  return (
                    <li key={kind} data-emvb-perf-kind={kind} data-over={over ? "" : undefined}>
                      <span className="emvb-perf-label">{t(label)}</span>
                      <span
                        className="emvb-perf-bar"
                        role="meter"
                        aria-label={t("{kind} weight", { kind: t(label) })}
                        aria-valuemin={0}
                        aria-valuemax={PERF_BUDGETS[kind]}
                        aria-valuenow={Math.min(report.bytes[kind], PERF_BUDGETS[kind])}
                        aria-valuetext={t("{size} of {budget}", {
                          size: kb(report.bytes[kind]),
                          budget: kb(PERF_BUDGETS[kind]),
                        })}
                      >
                        <span style={{ width: `${Math.round(share * 100)}%` }} />
                      </span>
                      <span className="emvb-perf-value">
                        {kb(report.bytes[kind])} / {kb(PERF_BUDGETS[kind])}
                      </span>
                    </li>
                  );
                })}
              </ul>
              <p className="emvb-helper" data-emvb-perf-js="">
                {report.scripts.length === 0
                  ? t("Zero JavaScript: this {noun} is plain HTML and CSS.", { noun: t(noun) })
                  : t("Scripts: {scripts}.", {
                      scripts: report.scripts.map((s) => t(SCRIPT_LABELS[s.script])).join(", "),
                    })}
              </p>
              {report.warnings.length > 0 && (
                <ul className="emvb-perf-warnings" data-emvb-perf-warnings="">
                  {report.warnings.map((warning) => (
                    <li key={warning}>{warningText(t, warning)}</li>
                  ))}
                </ul>
              )}
              {report.sections.length > 0 && (
                <>
                  <h3 className="emvb-perf-heading">{t("Heaviest sections")}</h3>
                  <ol className="emvb-perf-sections">
                    {report.sections.slice(0, 5).map((section) => (
                      <li key={section.id}>
                        <button
                          type="button"
                          className="emvb-link-button"
                          data-emvb-perf-section={section.id}
                          onClick={() => {
                            onSelect(section.id);
                            onOpenChange(false);
                          }}
                        >
                          {section.label || t(ELEMENT_NAMES[section.type] || section.type)}
                        </button>{" "}
                        {kb(section.bytes)}
                        {section.images > 0
                          ? t(section.images === 1 ? " · {count} image" : " · {count} images", {
                              count: section.images,
                            })
                          : ""}
                      </li>
                    ))}
                  </ol>
                </>
              )}
              <p className="emvb-helper">
                {t(
                  "HTML and CSS are gzipped estimates; image sizes come from their width and height.",
                )}
              </p>
            </>
          )}
          <div className="emvb-dialog-actions">
            <DialogCloseButton>{t("Close")}</DialogCloseButton>
          </div>
        </div>
      </Dialog>
    </Dialog.Root>
  );
}
