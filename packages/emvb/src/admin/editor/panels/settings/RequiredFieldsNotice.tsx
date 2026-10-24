/**
 * [INPUT]: 依赖布局节点、后台界面翻译与同目录字段控件。
 * [OUTPUT]: 表单风险提示；显示缺失必填字段、不可满足限制与控件类型冲突。
 * [POS]: 元素设置面板的 RequiredFieldsNotice；不拥有页面保存与发布。
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import { useI18n, type Translate } from "../../../i18n/index.ts";
import { Banner } from "@cloudflare/kumo";
import { WarningIcon } from "@phosphor-icons/react";
import * as React from "react";
import type { Fetcher } from "../../../api.ts";
import { loadFormFields, type DefinitionField } from "../../../forms-api.ts";
import {
  impossibleRangeFields,
  mismatchedControls,
  requiredFieldIssues,
  type LayoutNode,
  type RequiredFieldIssue,
} from "../../../../core/index.ts";

/** The panel's short line for one issue; the full sentence is its tooltip and the MCP text. */
function shortReason(issue: RequiredFieldIssue, t: Translate): string {
  if (issue.kind === "missing")
    return t("has no field on this form ({name}).", { name: issue.field });
  if (issue.kind === "hidden") {
    return issue.devices.length === 3
      ? t("is hidden on every device.")
      : t("is hidden on {devices}.", {
          devices: issue.devices.map((device) => t(device)).join(t(" and ")),
        });
  }
  return t("is shown only to some visitors: {who}.", { who: issue.who });
}

function issueText(issue: RequiredFieldIssue, t: Translate): string {
  if (issue.kind === "missing")
    return t(
      "“{name}” is required by the form but has no field here, so the form can't be sent. Add a field bound to {field}, or make it optional in Forms.",
      { name: issue.label, field: issue.field },
    );
  if (issue.kind === "audience")
    return t(
      "“{name}” is required but shown only to some visitors ({who}), so everyone else can't send the form. Remove the rule from the field, or make it optional in Forms.",
      { name: issue.label, who: issue.who },
    );
  const where =
    issue.devices.length === 3
      ? t("on every device")
      : t("on {devices}", { devices: issue.devices.map((device) => t(device)).join(t(" and ")) });
  return t(
    "“{name}” is required but hidden {where}, so visitors there can't send the form. Show the field there, or make it optional in Forms.",
    { name: issue.label, where },
  );
}

/**
 * W-511: on a Form, the required fields visitors can't fill: missing from the form, or hidden on
 * a device. Either way the form can't be sent there, and the visitor sees no reason why.
 */
export function RequiredFieldsNotice({ node, fetcher }: { node: LayoutNode; fetcher: Fetcher }) {
  const t = useI18n();
  const formId = String((node.props as { formId?: unknown }).formId ?? "").trim();
  const [fields, setFields] = React.useState<DefinitionField[] | null>(null);
  React.useEffect(() => {
    let cancelled = false;
    setFields(null);
    if (!formId) return undefined;
    void loadFormFields(fetcher, formId).then((next) => {
      if (!cancelled) setFields(next);
    });
    return () => {
      cancelled = true;
    };
  }, [fetcher, formId]);
  const issues = fields ? requiredFieldIssues(node, fields) : [];
  const ranges = fields ? impossibleRangeFields(fields) : [];
  const kinds = fields ? mismatchedControls(node, fields) : [];
  if (issues.length === 0 && ranges.length === 0 && kinds.length === 0) return null;
  // W-579: a free-text or checkbox control on a field with a list of options sends a value the
  // forms plugin refuses, so the form fails with "has an invalid selection".
  const kindBanner =
    kinds.length > 0 ? (
      <Banner
        variant="alert"
        icon={<WarningIcon aria-hidden="true" />}
        title={
          kinds.length === 1
            ? t("A field needs a choice element")
            : t("{count} fields need a choice element", { count: kinds.length })
        }
        description={
          <ul className="emvb-required-notice__list">
            {kinds.map((kind) => (
              <li key={kind.nodeId} data-emvb-kind-issue={kind.fieldType}>
                <strong>{kind.label}</strong>{" "}
                {t(
                  "only accepts one of its options in Forms, so typed or ticked answers are refused. Use a Select or Radio element for it.",
                )}
              </li>
            ))}
          </ul>
        }
      />
    ) : null;
  const rangeBanner =
    ranges.length > 0 ? (
      <Banner
        variant="alert"
        icon={<WarningIcon aria-hidden="true" />}
        title={
          ranges.length === 1
            ? t("A field's limits can't be met")
            : t("{count} fields' limits can't be met", { count: ranges.length })
        }
        description={
          <ul className="emvb-required-notice__list">
            {ranges.map((range) => (
              <li key={range.name} data-emvb-range-issue={range.kind}>
                <strong>{range.label}</strong>{" "}
                {range.kind === "length"
                  ? t("has a minimum length above its maximum length")
                  : range.kind === "both"
                    ? t(
                        "has a minimum length above its maximum length and a minimum value above its maximum",
                      )
                    : t("has a minimum value above its maximum")}
                {t(", so no answer is accepted. Fix the limits in Forms.")}
              </li>
            ))}
          </ul>
        }
      />
    ) : null;
  if (issues.length === 0) {
    return (
      <div className="emvb-required-notice" data-emvb-range-fields="">
        {kindBanner}
        {rangeBanner}
      </div>
    );
  }
  const title =
    issues.length === 1
      ? t("A required field can't be filled in")
      : t("{count} required fields can't be filled in", { count: issues.length });
  return (
    <div className="emvb-required-notice" data-emvb-required-fields="">
      {kindBanner}
      {rangeBanner}
      <Banner
        variant="alert"
        icon={<WarningIcon aria-hidden="true" />}
        title={title}
        description={
          <>
            <ul className="emvb-required-notice__list">
              {issues.map((issue) => (
                <li
                  key={`${issue.kind}:${issue.field}`}
                  data-emvb-required-issue={issue.kind}
                  title={issueText(issue, t)}
                >
                  <strong>{issue.label}</strong> {shortReason(issue, t)}
                </li>
              ))}
            </ul>
            <span className="emvb-required-notice__hint">
              {t(
                "Visitors who can't fill a required field can't send the form. Show the field to everyone, or make it optional in Forms.",
              )}
            </span>
          </>
        }
      />
    </div>
  );
}
