/**
 * [INPUT]: 依赖查询样式解析、节点校验与按当前语言格式化的错误。
 * [OUTPUT]: 导出 QueryStyleRows。
 * [POS]: 容器查询样式表单；错误保留提交快照，切语言不改草稿。
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import { useI18n, type LocalizedTranslate } from "../../../i18n/index.ts";
import * as React from "react";
import type { LayoutNode } from "../../../../core/index.ts";
import { FIELD } from "../../../ui.ts";
import { savableNode } from "./DraftTextField.tsx";
import { formatStyleValue, parseStyleValue, QUERY_STYLE_KEYS } from "./query-style.ts";
import { isCommitEnter } from "../../ime.ts";
import { PanelSelect } from "./PanelSelect.tsx";
import { displayStyleLabel, STYLE_LABELS, type StyleKey } from "./style-sections.ts";
import { formatError, type LocalizedError } from "./localized-error.ts";

const CHOOSE = "choose";

type QueryStyle = NonNullable<LayoutNode["query"]>["style"];

/** Store `style` as the node's query style, or say why it can't be saved. */
function withQueryStyle(node: LayoutNode, style: Record<string, unknown>): LayoutNode | string {
  const query = node.query;
  if (!query) return "Set a container width first.";
  const next = { ...node, query: { ...query, style: style as QueryStyle } } as LayoutNode;
  return savableNode(next) || !savableNode(node) ? next : "That value can't be saved here.";
}

/** One stored property: its value commits on blur or Enter; Remove deletes it. */
const styleName = (key: string, t: LocalizedTranslate): string =>
  Object.hasOwn(STYLE_LABELS, key) ? displayStyleLabel(key as StyleKey, t) : key;

function QueryStyleRow({
  node,
  styleKey,
  onChange,
}: {
  node: LayoutNode;
  styleKey: string;
  onChange: (node: LayoutNode) => void;
}) {
  const t = useI18n();
  const style = (node.query?.style ?? {}) as Record<string, unknown>;
  const stored = formatStyleValue(style[styleKey]);
  const [draft, setDraft] = React.useState(stored);
  const [error, setError] = React.useState<LocalizedError | null>(null);
  const errorText = formatError(error, t);
  React.useEffect(() => {
    setDraft(stored);
    setError(null);
  }, [stored]);
  const id = React.useId();
  const commit = () => {
    if (draft === stored) {
      setError(null);
      return;
    }
    const parsed = parseStyleValue(styleKey, draft, t);
    if ("error" in parsed) {
      setError({
        format: (tr) => {
          const again = parseStyleValue(styleKey, draft, tr);
          return "error" in again ? again.error : "";
        },
      });
      return;
    }
    const next = withQueryStyle(node, { ...style, [styleKey]: parsed.value });
    if (typeof next === "string") {
      setError(next);
      return;
    }
    setError(null);
    onChange(next);
  };
  return (
    <div className="emvb-query-row" data-emvb-query-key={styleKey}>
      <label className="emvb-field-label" htmlFor={id}>
        {styleName(styleKey, t)}
      </label>
      <input
        id={id}
        className={FIELD}
        value={draft}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (isCommitEnter(event)) commit();
        }}
      />
      <button
        type="button"
        className="emvb-link-button"
        aria-label={t("Remove {name}", {
          name: t.locale === "en" ? styleKey : styleName(styleKey, t),
        })}
        onClick={() => {
          const { [styleKey]: _gone, ...rest } = style;
          const next = withQueryStyle(node, rest);
          if (typeof next !== "string") onChange(next);
        }}
      >
        {t("Remove")}
      </button>
      {errorText && (
        <span className="emvb-helper" id={`${id}-error`} data-emvb-query-error="">
          {errorText}
        </span>
      )}
    </div>
  );
}

/** The container-query style, one property per row, plus a row to add one (W-398). */
export function QueryStyleRows({
  node,
  onChange,
}: {
  node: LayoutNode;
  onChange: (node: LayoutNode) => void;
}) {
  const t = useI18n();
  const style = (node.query?.style ?? {}) as Record<string, unknown>;
  const keys = Object.keys(style).filter((key) => style[key] !== undefined);
  const free = QUERY_STYLE_KEYS.filter((key) => !keys.includes(key));
  const [newKey, setNewKey] = React.useState("");
  const [newValue, setNewValue] = React.useState("");
  const [error, setError] = React.useState<LocalizedError | null>(null);
  const errorText = formatError(error, t);
  const keyId = React.useId();
  const valueId = React.useId();
  if (!node.query) return null;
  const add = () => {
    if (!newKey) {
      setError("Choose a property.");
      return;
    }
    const parsed = parseStyleValue(newKey, newValue, t);
    if ("error" in parsed) {
      setError({
        format: (tr) => {
          const again = parseStyleValue(newKey, newValue, tr);
          return "error" in again ? again.error : "";
        },
      });
      return;
    }
    const next = withQueryStyle(node, { ...style, [newKey]: parsed.value });
    if (typeof next === "string") {
      setError(next);
      return;
    }
    setError(null);
    setNewKey("");
    setNewValue("");
    onChange(next);
  };
  return (
    <div className="emvb-query-style" data-emvb-query-style="">
      {keys.length === 0 && <p className="emvb-helper">{t("No styles at this width yet.")}</p>}
      {keys.map((key) => (
        <QueryStyleRow key={key} node={node} styleKey={key} onChange={onChange} />
      ))}
      <div className="emvb-query-add" data-emvb-query-add="">
        <span className="emvb-field-label" id={`${keyId}-label`}>
          {t("Property")}
        </span>
        <PanelSelect
          labelledBy={`${keyId}-label`}
          value={newKey || CHOOSE}
          options={[
            { value: CHOOSE, label: t("Choose…") },
            // UX-079: the Style tab's names ("Padding top"), not the raw keys.
            ...free
              .map((key) => ({ value: key, label: styleName(key, t) }))
              .toSorted((a, b) => a.label.localeCompare(b.label)),
          ]}
          onChange={(value) => setNewKey(value === CHOOSE ? "" : value)}
        />
        <label className="emvb-field-label" htmlFor={valueId}>
          {t("Value")}
        </label>
        <input
          id={valueId}
          className={FIELD}
          placeholder="16px, auto, #112233, var(--space-4)"
          value={newValue}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${valueId}-error` : undefined}
          onChange={(event) => setNewValue(event.target.value)}
          onKeyDown={(event) => {
            if (isCommitEnter(event)) add();
          }}
        />
        <button type="button" className="emvb-link-button" onClick={add}>
          {t("Add style")}
        </button>
        {errorText && (
          <span className="emvb-helper" id={`${valueId}-error`} data-emvb-query-error="">
            {errorText}
          </span>
        )}
      </div>
    </div>
  );
}
