/**
 * [INPUT]: 依赖图片引擎工具状态、通用控件与色调面板。
 * [OUTPUT]: 提供ToolPanel。
 * [POS]: 工具面板分派与裁剪界面，配方枚举保持原值。
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
/**
 * The sidebar panels: the crop tool's controls (W-483), the tone tools (W-484, in tone-panels.tsx
 * CurvesPanel.tsx and MetadataPanel.tsx), and a placeholder for the blender tool.
 *
 * The crop panel follows photocn's `crop-panel.tsx` (https://github.com/rbbydotdev/photocn,
 * apps/www/src/registry/image-editor), MIT License, Copyright (c) 2026 rbbydotdev, rebuilt with
 * Kumo components and EmVB tokens.
 */
import { useI18n, type Translate } from "../i18n/index.ts";
import { Button, Select } from "@cloudflare/kumo";
import {
  ArrowCounterClockwiseIcon,
  ClockCountdownIcon,
  FlipHorizontalIcon,
  FlipVerticalIcon,
  RectangleIcon,
} from "@phosphor-icons/react";
import * as React from "react";
import { SOLID_PRIMARY } from "../ui.ts";
import { useImageEditor } from "./engine.ts";
import {
  CenteredSlider,
  IconButton,
  PanelHeader,
  RotateSquareIcon,
  SkewIcon,
  TOOL_ICONS,
} from "./parts.tsx";
import { CurvesPanel } from "./CurvesPanel.tsx";
import { AdjustPanel, BlurPanel, FiltersPanel } from "./tone-panels.tsx";
import { MetadataPanel } from "./MetadataPanel.tsx";
import { COMING_SOON, IMAGE_EDITOR_TOOLS, type ImageEditorToolId } from "./tools.ts";

/** Keys handled by photocn while the crop tool is active (its `handleCropKey`). */
const CROP_SHORTCUTS: readonly [keys: string, action: string][] = [
  ["R / ⇧R", "Rotate right / left"],
  ["H · V", "Flip horizontal · vertical"],
  ["X", "Portrait ⇄ landscape"],
  ["[ ]", "Straighten ±0.5° (⇧ ±5°)"],
  ["← → ↑ ↓", "Move the image (⇧ faster)"],
  ["Scroll · + −", "Zoom inside the frame (+ − with the frame focused)"],
  ["Esc", "Cancel a drag / leave corners"],
  ["⌫", "Reset crop"],
  ["↵", "Done"],
];

const degrees = (v: number) => `${v > 0 ? "+" : ""}${v.toFixed(1)}°`;
const percent = (v: number) => `${v > 0 ? "+" : ""}${Math.round(v * 100)}`;

function aspectLabel(label: string, t: Translate): string {
  const fit = /^Fit this element \((.+)\)$/.exec(label);
  return fit ? t("Fit this element ({size})", { size: fit[1] ?? "" }) : t(label);
}

/** Quarter turns, flips, ratio, straighten and perspective. Cropping happens on the canvas. */
function CropPanel() {
  const t = useI18n();
  const editor = useImageEditor();
  const g = editor.geometry;
  const disabled = editor.disabled || !editor.hasImage;
  const canToggleOrientation = g.aspectRatio !== "1:1";
  const ratioId = React.useId();
  return (
    <section aria-label={t("Crop")} className="emvb-ie-panel" data-emvb-image-panel="compose">
      <PanelHeader
        title={t("Crop")}
        description={t("Drag the frame on the image to crop")}
        onReset={() => g.reset()}
        resetDisabled={disabled || g.isDefault}
      />
      <div className="emvb-ie-group">
        <div className="emvb-ie-row" role="group" aria-label={t("Rotate and flip")}>
          <IconButton
            label={t("Rotate left")}
            icon={<RotateSquareIcon direction="left" />}
            disabled={disabled}
            onClick={() => g.rotate(-1)}
            data-emvb-image-rotate="left"
          />
          <IconButton
            label={t("Rotate right")}
            icon={<RotateSquareIcon direction="right" />}
            disabled={disabled}
            onClick={() => g.rotate(1)}
            data-emvb-image-rotate="right"
          />
          <span className="emvb-ie-vsep" aria-hidden="true" />
          <IconButton
            label={t("Flip horizontal")}
            icon={<FlipHorizontalIcon aria-hidden="true" />}
            disabled={disabled}
            onClick={() => g.flip("horizontal")}
            data-emvb-image-flip="horizontal"
          />
          <IconButton
            label={t("Flip vertical")}
            icon={<FlipVerticalIcon aria-hidden="true" />}
            disabled={disabled}
            onClick={() => g.flip("vertical")}
            data-emvb-image-flip="vertical"
          />
        </div>
        <div className="emvb-ie-field">
          <span className="emvb-ie-label" id={ratioId}>
            {t("Aspect ratio")}
          </span>
          <div className="emvb-ie-row emvb-ie-row-fill">
            <Select
              aria-labelledby={ratioId}
              className="emvb-ie-select"
              disabled={disabled}
              value={g.aspectRatio}
              items={Object.fromEntries(
                g.aspectRatioOptions.map((o) => [o.value, aspectLabel(o.label, t)]),
              )}
              onValueChange={(next) => {
                if (typeof next === "string" && next) g.setAspectRatio(next);
              }}
            >
              {g.aspectRatioOptions.map((option) => (
                <Select.Option key={option.value} value={option.value}>
                  {aspectLabel(option.label, t)}
                </Select.Option>
              ))}
            </Select>
            <IconButton
              variant="outline"
              label={t(g.portrait ? "Switch to landscape" : "Switch to portrait")}
              icon={
                <RectangleIcon
                  aria-hidden="true"
                  style={g.portrait ? { transform: "rotate(90deg)" } : undefined}
                />
              }
              disabled={disabled || !canToggleOrientation}
              onClick={() => g.toggleOrientation()}
              data-emvb-image-orientation={g.portrait ? "portrait" : "landscape"}
            />
          </div>
        </div>
        <CenteredSlider
          name="straighten"
          label={t("Straighten")}
          min={-45}
          max={45}
          step={0.1}
          value={g.value.straighten}
          disabled={disabled}
          format={degrees}
          onChange={(v) => g.setStraighten(v, { transient: true })}
          onCommit={() => g.commit()}
        />
      </div>
      <hr className="emvb-ie-sep" />
      <fieldset className="emvb-ie-group">
        <div className="emvb-ie-row emvb-ie-row-between">
          <legend className="emvb-ie-label">{t("Perspective")}</legend>
          <div className="emvb-ie-row">
            {g.value.corners ? (
              <Button
                type="button"
                variant="ghost"
                size="xs"
                className="emvb-ie-btn"
                icon={<ArrowCounterClockwiseIcon aria-hidden="true" />}
                disabled={disabled}
                onClick={() => g.resetCorners()}
              >
                {t("Corners")}
              </Button>
            ) : null}
            <IconButton
              variant="outline"
              label={t("Adjust corners")}
              icon={<SkewIcon />}
              aria-pressed={g.editingCorners}
              disabled={disabled}
              onClick={() => g.setEditingCorners(!g.editingCorners)}
              data-emvb-image-corners=""
            />
          </div>
        </div>
        <CenteredSlider
          name="perspective-y"
          label={t("Vertical")}
          min={-1}
          max={1}
          step={0.01}
          value={g.value.perspectiveY}
          disabled={disabled}
          format={percent}
          onChange={(y) => g.setPerspective({ y }, { transient: true })}
          onCommit={() => g.commit()}
        />
        <CenteredSlider
          name="perspective-x"
          label={t("Horizontal")}
          min={-1}
          max={1}
          step={0.01}
          value={g.value.perspectiveX}
          disabled={disabled}
          format={percent}
          onChange={(x) => g.setPerspective({ x }, { transient: true })}
          onCommit={() => g.commit()}
        />
      </fieldset>
      <hr className="emvb-ie-sep" />
      <div className="emvb-ie-group emvb-ie-group-tight">
        <Button
          type="button"
          variant="primary"
          size="sm"
          className="emvb-ie-btn emvb-ie-done"
          style={SOLID_PRIMARY}
          disabled={disabled}
          onClick={() => g.done()}
          data-emvb-image-crop-done=""
        >
          {t("Done")}
        </Button>
        <details className="emvb-ie-shortcuts">
          <summary>{t("Keyboard shortcuts")}</summary>
          <dl>
            {CROP_SHORTCUTS.map(([keys, action]) => (
              <div key={keys}>
                <dt>
                  <kbd>{keys}</kbd>
                </dt>
                <dd>{t(action)}</dd>
              </div>
            ))}
          </dl>
        </details>
      </div>
    </section>
  );
}

/** A tool whose controls arrive in a later update: its header and what it will do. */
function ComingSoonPanel({ tool }: { tool: keyof typeof COMING_SOON }) {
  const t = useI18n();
  const meta = IMAGE_EDITOR_TOOLS.find((item) => item.id === tool) ?? IMAGE_EDITOR_TOOLS[0];
  const ToolIcon = TOOL_ICONS[tool];
  return (
    <section aria-label={t(meta.label)} className="emvb-ie-panel" data-emvb-image-panel={tool}>
      <PanelHeader title={t(meta.label)} description={t(meta.blurb)} />
      <div className="emvb-ie-group">
        <div className="emvb-ie-soon">
          <span className="emvb-ie-soon-icon" aria-hidden="true">
            <ToolIcon />
          </span>
          <div>
            <p className="emvb-ie-soon-title">
              <ClockCountdownIcon aria-hidden="true" />
              {t("Coming in the next update")}
            </p>
            <ul>
              {COMING_SOON[tool].map((line) => (
                <li key={line}>{t(line)}</li>
              ))}
            </ul>
          </div>
        </div>
        <p className="emvb-ie-note">
          {t(
            "Saving makes a new copy in the media library; the picture you started from is never changed.",
          )}
        </p>
      </div>
    </section>
  );
}

/** The active tool's panel. */
export function ToolPanel() {
  const editor = useImageEditor();
  const tool = editor.tool as ImageEditorToolId;
  switch (tool) {
    case "compose":
      return <CropPanel />;
    case "adjust":
      return <AdjustPanel />;
    case "effects":
      return <AdjustPanel defaultSection="effects" />;
    case "filters":
      return <FiltersPanel />;
    case "curves":
      return <CurvesPanel />;
    case "blur":
      return <BlurPanel />;
    case "metadata":
      return <MetadataPanel />;
    case "blender":
      return <ComingSoonPanel tool={tool} />;
    default:
      return null;
  }
}
