/**
 * [INPUT]: 依赖无障碍审计、布局修复与后台语言上下文。
 * [OUTPUT]: 提供可翻译的无障碍分数、诊断与修复入口。
 * [POS]: 编辑器审计界面；保留用户元素名称与正文。
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import { useI18n, type Translate } from "../i18n/index.ts";
import { Button, Dialog } from "@cloudflare/kumo";
import { WarningCircleIcon, WarningIcon } from "@phosphor-icons/react";
import * as React from "react";
import {
  applyA11yFix,
  applyAllA11yFixes,
  findNode,
  type A11yReport,
  type Layout,
} from "../../core/index.ts";
import { ELEMENT_NAMES } from "./element-chrome.ts";
import { BUTTON, SOLID_PRIMARY } from "../ui.ts";

// 核心诊断保留英文契约；只拆解已知模板，用户文本作为参数保留。
function diagnostic(t: Translate, message: string): string {
  const templates: [RegExp, string, string[]][] = [
    [
      /^The alt text "(.*)" doesn't describe the image\.$/,
      'The alt text "{text}" doesn\'t describe the image.',
      ["text"],
    ],
    [
      /^Another menu on this page is also named "(.*)"; give each menu its own label\.$/,
      'Another menu on this page is also named "{name}"; give each menu its own label.',
      ["name"],
    ],
    [
      /^"(.*)" doesn't say where the link goes; screen reader users often list links alone\.$/,
      '"{text}" doesn\'t say where the link goes; screen reader users often list links alone.',
      ["text"],
    ],
    [
      /^This H(\d) skips a level after an H(\d)\.$/,
      "This H{level} skips a level after an H{previous}.",
      ["level", "previous"],
    ],
    [
      /^This H(\d) skips a level after the page start\.$/,
      "This H{level} skips a level after the page start.",
      ["level"],
    ],
    [/^Make it H(\d)$/, "Make it H{level}", ["level"]],
    [
      /^Text contrast is ([\d.]+):1; it needs ([\d.]+):1\.$/,
      "Text contrast is {ratio}:1; it needs {needed}:1.",
      ["ratio", "needed"],
    ],
    [
      /^Text contrast is ([\d.]+):1; it needs ([\d.]+):1\. Opacity on this element or a parent fades it; raise the opacity\.$/,
      "Text contrast is {ratio}:1; it needs {needed}:1. Opacity on this element or a parent fades it; raise the opacity.",
      ["ratio", "needed"],
    ],
  ];
  for (const [pattern, source, keys] of templates) {
    const match = pattern.exec(message);
    if (match)
      return t(source, Object.fromEntries(keys.map((key, index) => [key, match[index + 1] ?? ""])));
  }
  return t(message);
}

/** Score bands for the badge colour (W-317). */
const scoreBand = (score: number) => (score >= 90 ? "good" : score >= 70 ? "fair" : "poor");

/** The live score in the top bar (W-317); opens the co-pilot. */
export function A11yScoreButton({ report, onOpen }: { report: A11yReport; onOpen: () => void }) {
  const t = useI18n();
  const count = report.issues.length;
  return (
    <button
      type="button"
      className="emvb-a11y-score"
      data-band={scoreBand(report.score)}
      data-emvb-a11y-open=""
      title={
        count === 0
          ? t("Accessibility: no issues found")
          : t(count === 1 ? "Accessibility: {count} issue" : "Accessibility: {count} issues", {
              count,
            })
      }
      aria-label={t(
        count === 1
          ? "Accessibility score {score} of 100, {count} issue"
          : "Accessibility score {score} of 100, {count} issues",
        { score: report.score, count },
      )}
      onClick={onOpen}
    >
      {t("A11y")} <b>{report.score}</b>
    </button>
  );
}

/**
 * Accessibility co-pilot (W-317): the page's issues with what's wrong, a jump to the element,
 * and a one-click fix where there is a safe one (or all at once). Fixes are ordinary edits.
 */
export function A11yDialog({
  open,
  onOpenChange,
  report,
  layout,
  onSelect,
  onApply,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: A11yReport;
  layout: Layout | null;
  onSelect: (id: string) => void;
  onApply: (layout: Layout, note: string) => void;
}) {
  const t = useI18n();
  const fixable = report.issues.filter((issue) => issue.fix);
  // W-833: a fixed issue leaves the list with its focused Fix button, so focus fell back to the
  // dialog itself. Move it to the next fix, else Fix all, else Close.
  const refocusAfterFix = React.useRef(false);
  React.useEffect(() => {
    if (!refocusAfterFix.current) return;
    refocusAfterFix.current = false;
    const body = document.querySelector<HTMLElement>('[data-emvb-dialog="a11y"]');
    const active = document.activeElement;
    if (active instanceof HTMLElement && active !== body && body?.contains(active)) return;
    const next =
      body?.querySelector<HTMLElement>("[data-emvb-a11y-fix]") ??
      body?.querySelector<HTMLElement>("[data-emvb-a11y-fix-all]") ??
      body?.querySelector<HTMLElement>("[data-emvb-a11y-close]");
    next?.focus();
  });
  const apply = (next: Layout, note: string) => {
    refocusAfterFix.current = true;
    onApply(next, note);
  };
  const name = (id: string) => {
    const node = layout ? findNode(layout, id) : undefined;
    if (!node) return t("Element");
    if (layout && node.id === layout.root.id) return t("Page");
    return node.label || t(ELEMENT_NAMES[node.type] || node.type);
  };
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog size="base" className="p-6 emvb-a11y" data-emvb-a11y="">
        <div className="emvb-dialog" data-emvb-dialog="a11y">
          <Dialog.Title>
            {t("Accessibility")} · <span data-band={scoreBand(report.score)}>{report.score}</span>
            /100
          </Dialog.Title>
          {report.issues.length === 0 ? (
            <p className="emvb-helper" data-emvb-a11y-clean="">
              {t(
                "No issues found. Automated checks catch some problems, not all: try the page with a keyboard and a screen reader too.",
              )}
            </p>
          ) : (
            <ul className="emvb-a11y-issues">
              {report.issues.map((issue) => (
                <li key={issue.id} data-emvb-a11y-issue={issue.id} data-severity={issue.severity}>
                  {/* UX-022: severity has a shape and a name, not only the bar's colour. */}
                  {issue.severity === "error" ? (
                    <WarningCircleIcon
                      className="emvb-a11y-severity"
                      size={16}
                      role="img"
                      aria-label={t("Error")}
                    />
                  ) : (
                    <WarningIcon
                      className="emvb-a11y-severity"
                      size={16}
                      role="img"
                      aria-label={t("Warning")}
                    />
                  )}
                  <span className="emvb-a11y-what">
                    <button
                      type="button"
                      className="emvb-link-button"
                      onClick={() => {
                        onSelect(issue.nodeId);
                        onOpenChange(false);
                      }}
                    >
                      {name(issue.nodeId)}
                    </button>
                    : {diagnostic(t, issue.message)}
                  </span>
                  {issue.fix && layout && (
                    <Button
                      variant="secondary"
                      className={BUTTON}
                      data-emvb-a11y-fix={issue.id}
                      onClick={() =>
                        apply(
                          applyA11yFix(layout, issue),
                          t("Fixed: {fix}", { fix: diagnostic(t, issue.fixLabel ?? "issue") }),
                        )
                      }
                    >
                      {diagnostic(t, issue.fixLabel ?? "Fix")}
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
          <div className="emvb-a11y-actions">
            <Dialog.Close
              render={(props) => (
                <Button {...props} variant="secondary" className={BUTTON} data-emvb-a11y-close="">
                  {t("Close")}
                </Button>
              )}
            />
            {fixable.length > 1 && layout && (
              <Button
                variant="primary"
                className={BUTTON}
                style={SOLID_PRIMARY}
                data-emvb-a11y-fix-all=""
                onClick={() =>
                  apply(
                    applyAllA11yFixes(layout, fixable),
                    t("Fixed {count} accessibility issues", { count: fixable.length }),
                  )
                }
              >
                {t("Fix {count} issues", { count: fixable.length })}
              </Button>
            )}
          </div>
        </div>
      </Dialog>
    </Dialog.Root>
  );
}
