/**
 * [INPUT]: 依赖核心 A/B 树操作与后台翻译。
 * [OUTPUT]: 导出 VariantEditor。
 * [POS]: 元素设置面板的A/B 测试控件，翻译展示文案并保留存储值。
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import { useI18n } from "../../../i18n/index.ts";
import {
  createVariantB,
  endAbTest,
  type Arranged,
  type Layout,
  type LayoutNode,
} from "../../../../core/index.ts";

/** Types that can't be an A/B arm: items of a list that has its own rules, and the root. */
const NO_VARIANT = new Set(["tab-panel", "accordion-item", "loop-empty", "option"]);

/**
 * Edge A/B test (W-312): make this element arm A and a copy arm B. The server picks one per
 * visitor and a cookie keeps it, so nothing flickers and no script loads.
 */
export function VariantEditor({
  node,
  isRoot,
  lone = false,
  onChange,
  onArrange,
}: {
  node: LayoutNode;
  isRoot: boolean;
  /** W-627: the test's other arm is gone, so this one shows to every visitor. */
  lone?: boolean;
  onChange: (node: LayoutNode) => void;
  onArrange?: (run: (layout: Layout) => Arranged) => void;
}) {
  const t = useI18n();
  if (isRoot || NO_VARIANT.has(node.type) || !onArrange) return null;
  const v = node.variant;
  return (
    <section className="emvb-bind" data-emvb-variant-editor="">
      <h3 className="emvb-bind-title">{t("A/B test")}</h3>
      {!v ? (
        <>
          <p className="emvb-helper">
            {t(
              "Show half of your visitors a different version. The server picks the version, so nothing flickers and no script loads.",
            )}
          </p>
          <button
            type="button"
            className="emvb-link-button"
            data-emvb-create-variant=""
            onClick={() => onArrange((layout) => createVariantB(layout, node.id))}
          >
            {t("Create variant B")}
          </button>
        </>
      ) : (
        <>
          <p className="emvb-helper" data-emvb-variant-arm={v.arm}>
            {t("Variant {arm} of test {name}. The canvas shows every variant; visitors see one.", {
              arm: v.arm.toUpperCase(),
              name: v.test,
            })}
          </p>
          {lone && (
            <p className="emvb-helper" data-emvb-variant-lone="">
              {t(
                "Variant {arm} was removed, so every visitor sees this one. End the test to tidy it up.",
                { arm: v.arm === "a" ? "B" : "A" },
              )}
            </p>
          )}
          {v.arm === "b" && !lone && (
            <label className="emvb-bind-row">
              <span className="emvb-bind-label">{t("Visitors who see B (%)")}</span>
              <input
                className="emvb-native-input"
                type="number"
                min={1}
                max={99}
                value={v.split ?? 50}
                data-emvb-variant-split=""
                onChange={(event) => {
                  const n = Math.round(Number(event.currentTarget.value));
                  if (!Number.isFinite(n) || n < 1 || n > 99) return;
                  onChange({ ...node, variant: { ...v, split: n } } as LayoutNode);
                }}
              />
            </label>
          )}
          <button
            type="button"
            className="emvb-link-button"
            data-emvb-end-test=""
            onClick={() => onArrange((layout) => endAbTest(layout, node.id))}
          >
            {t("Keep this variant and end the test")}
          </button>
        </>
      )}
    </section>
  );
}
