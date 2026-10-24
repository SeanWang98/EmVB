/**
 * [INPUT]: 依赖背景模式、媒体控件与语言上下文
 * [OUTPUT]: 提供背景填充切换与选项字段
 * [POS]: 背景设置编排；切换时保留临时填充值
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import { useI18n } from "../../../i18n/index.ts";
import { Input, Select } from "@cloudflare/kumo";
import * as React from "react";
import type { DesignSystem, StyleProps } from "../../../../core/index.ts";
import type { Fetcher } from "../../../api.ts";
import { FIELD } from "../../../ui.ts";
import { ColorControl } from "../ColorControl.tsx";
import { BackgroundImageControl, GradientControl, OverlayControl } from "./BackgroundControls.tsx";
import {
  activeFill,
  fillIsMixed,
  fillModes,
  switchFillRemembered,
  type FillMemory,
  type FillMode,
} from "./background-mode.ts";

const LABELS: Record<FillMode, string> = {
  color: "Color",
  gradient: "Gradient",
  image: "Image",
  video: "Video",
};

/**
 * One background type at a time (W-160). Switching type clears the other fills.
 * An image or a video can still carry an overlay. Switching back to a type restores what it last
 * held while the element stays selected (W-184).
 */
export function BackgroundFill({
  style,
  elementType = "container",
  design,
  fetcher,
  sizeOptions,
  positionOptions,
  repeatOptions,
  onPatch,
  onDesignChange,
  reset,
  memoryScope = "",
}: {
  style: StyleProps | undefined;
  elementType?: string;
  design: DesignSystem;
  fetcher?: Fetcher;
  sizeOptions: { value: string; label: string }[];
  positionOptions: { value: string; label: string }[];
  repeatOptions: { value: string; label: string }[];
  onPatch: (patch: Partial<StyleProps>) => void;
  onDesignChange: (design: DesignSystem) => Promise<void>;
  reset: React.ReactNode;
  /** Keeps remembered fills apart per class, device and state on one element (W-184). */
  memoryScope?: string;
}) {
  const t = useI18n();
  const derived = activeFill(style);
  const [mode, setMode] = React.useState<FillMode>(derived);
  const signature = `${style?.backgroundVideo ?? ""}|${style?.backgroundImage ?? ""}|${style?.gradient ? "g" : ""}|${style?.backgroundColor ? "c" : ""}`;
  const seen = React.useRef(signature);
  React.useEffect(() => {
    if (seen.current === signature) return;
    seen.current = signature;
    setMode(activeFill(style));
  }, [signature, style]);

  const modes = fillModes(elementType, style);
  const shown = modes.includes(mode) ? mode : derived;
  const memory = React.useRef(new Map<string, FillMemory>());
  const choose = (next: FillMode) => {
    setMode(next);
    let slot = memory.current.get(memoryScope);
    if (!slot) {
      slot = {};
      memory.current.set(memoryScope, slot);
    }
    onPatch(switchFillRemembered(style, shown, next, slot));
  };

  return (
    <div
      className="emvb-style-row"
      data-emvb-style="backgroundColor"
      data-set={
        style?.backgroundColor ||
        style?.gradient ||
        style?.backgroundImage ||
        style?.backgroundVideo
          ? "true"
          : undefined
      }
    >
      <div className="emvb-field-group emvb-background-fill">
        {/* UX-033: the section is already "Background"; these rows name their own part. */}
        <span className="emvb-var-field-label">{t("Fill")}</span>
        <div className="emvb-fill-types" role="radiogroup" aria-label={t("Background type")}>
          {modes.map((option) => (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={shown === option}
              data-emvb-bg-type={option}
              onClick={() => choose(option)}
            >
              {t(LABELS[option])}
            </button>
          ))}
        </div>
        {fillIsMixed(style) && (
          <p className="emvb-helper">
            {t("This element has more than one fill. Choosing a type removes the others.")}
          </p>
        )}
        {shown === "color" && (
          <ColorControl
            label={t("Background color")}
            value={style?.backgroundColor}
            design={design}
            onChange={(backgroundColor) => onPatch({ backgroundColor })}
            onDesignChange={onDesignChange}
          />
        )}
        {shown === "gradient" && style?.gradient && (
          <GradientControl
            value={style.gradient}
            design={design}
            onChange={(gradient) => onPatch({ gradient })}
            onDesignChange={onDesignChange}
          />
        )}
        {shown === "image" && (
          <>
            <BackgroundImageControl
              value={style?.backgroundImage}
              fetcher={fetcher}
              onChange={(backgroundImage) => onPatch({ backgroundImage })}
              reset={null}
            />
            <OptionSelect
              label={t("Image size")}
              value={style?.backgroundSize}
              options={sizeOptions}
              onChange={(backgroundSize) =>
                onPatch({ backgroundSize: backgroundSize as StyleProps["backgroundSize"] })
              }
            />
            <OptionSelect
              label={t("Image position")}
              value={style?.backgroundPosition}
              options={positionOptions}
              onChange={(backgroundPosition) =>
                onPatch({
                  backgroundPosition: backgroundPosition as StyleProps["backgroundPosition"],
                })
              }
            />
            <OptionSelect
              label={t("Repeat")}
              value={style?.backgroundRepeat}
              options={repeatOptions}
              onChange={(backgroundRepeat) =>
                onPatch({ backgroundRepeat: backgroundRepeat as StyleProps["backgroundRepeat"] })
              }
            />
          </>
        )}
        {shown === "video" && (
          <Input
            label={t("Background video")}
            className={FIELD}
            value={style?.backgroundVideo ?? ""}
            placeholder={t("https:// or /path")}
            onChange={(event) => {
              const next = event.target.value.trim();
              onPatch({ backgroundVideo: next === "" ? undefined : next });
            }}
          />
        )}
        {(shown === "image" || shown === "video") && (
          <OverlayControl
            value={style?.overlay}
            design={design}
            onChange={(overlay) => onPatch({ overlay })}
            onDesignChange={onDesignChange}
            reset={null}
          />
        )}
      </div>
      {reset}
    </div>
  );
}

function OptionSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string | undefined;
  options: { value: string; label: string }[];
  onChange: (next: string) => void;
}) {
  const t = useI18n();
  const current = value ?? options[0]?.value ?? "";
  return (
    <Select
      label={t(label)}
      className={FIELD}
      value={current}
      onValueChange={(next) => {
        if (typeof next === "string") onChange(next);
      }}
      renderValue={(v: unknown) =>
        t(options.find((o) => o.value === String(v))?.label ?? String(v))
      }
    >
      {options.map((option) => (
        <Select.Option key={option.value} value={option.value}>
          {t(option.label)}
        </Select.Option>
      ))}
    </Select>
  );
}
