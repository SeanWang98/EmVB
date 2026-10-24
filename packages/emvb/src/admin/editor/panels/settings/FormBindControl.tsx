/**
 * [INPUT]: 依赖布局节点、后台界面翻译与同目录字段控件。
 * [OUTPUT]: 表单绑定；探测表单插件并选择表单 id。
 * [POS]: 元素设置面板的 FormBindControl；不拥有页面保存与发布。
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import { useI18n, type Translate } from "../../../i18n/index.ts";
import { Input, Select } from "@cloudflare/kumo";
import * as React from "react";
import type { Fetcher } from "../../../api.ts";
import {
  loadFormsCapability,
  type FormListItem,
  type FormsCapability,
} from "../../../forms-api.ts";
import { FIELD } from "../../../ui.ts";
import { useAdminLinks } from "../../host.ts";

const MANUAL = "__manual__";

/** W-326: a paused form is marked, since the page then shows it isn't accepting responses. */
const formLabel = (form: FormListItem, t: Translate) =>
  form.paused ? t("{name} (paused)", { name: form.name }) : form.name;

/**
 * Form id binder (W-036 / D-015): admins pick from forms/list; others enter the id.
 */
export function FormBindControl({
  value,
  fetcher,
  onChange,
}: {
  value: string;
  fetcher: Fetcher;
  onChange: (formId: string) => void;
}) {
  const t = useI18n();
  const [capability, setCapability] = React.useState<FormsCapability | null>(null);
  const adminLinks = useAdminLinks();

  React.useEffect(() => {
    let cancelled = false;
    void loadFormsCapability(fetcher).then((next) => {
      if (!cancelled) setCapability(next);
    });
    return () => {
      cancelled = true;
    };
  }, [fetcher]);

  if (capability?.status === "missing") {
    return (
      <p className="emvb-helper" data-emvb-forms-missing="">
        {t(
          "The forms plugin is not installed. Form elements are unavailable until it is added to the site.",
        )}
      </p>
    );
  }

  if (capability?.status === "ready" && capability.forms.length > 0) {
    const known = capability.forms.some((form) => form.id === value);
    const placeholder = t(!known && value ? "Current id (not in list)" : "Choose a form…");
    return (
      <div className="emvb-field-group" data-emvb-form-bind="list">
        <Select
          label={t("Form")}
          className={FIELD}
          value={known ? value : MANUAL}
          onValueChange={(next) => {
            if (!next || next === MANUAL) return;
            onChange(next);
          }}
          renderValue={(current: unknown) => {
            const form = capability.forms.find((item) => item.id === current);
            return form ? formLabel(form, t) : placeholder;
          }}
        >
          <Select.Option value={MANUAL}>{placeholder}</Select.Option>
          {capability.forms.map((form: FormListItem) => (
            <Select.Option key={form.id} value={form.id}>
              {formLabel(form, t)}
            </Select.Option>
          ))}
        </Select>
        <Input
          label={t("Form id")}
          className={`${FIELD} emvb-mono`}
          value={value}
          onChange={(event) => onChange(event.target.value.trim())}
        />
        {adminLinks && (
          <p className="emvb-helper">
            <a href="/_emdash/admin/plugins/emdash-forms/pages">{t("Create or edit forms")}</a>
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="emvb-field-group" data-emvb-form-bind="manual">
      <Input
        label={t("Form id")}
        className={`${FIELD} emvb-mono`}
        value={value}
        onChange={(event) => onChange(event.target.value.trim())}
      />
      <p className="emvb-helper">
        {t("Paste a forms-plugin form id.")}
        {adminLinks && (
          <>
            {" "}
            <a href="/_emdash/admin/plugins/emdash-forms/pages">{t("Open Forms")}</a>
          </>
        )}
      </p>
    </div>
  );
}
