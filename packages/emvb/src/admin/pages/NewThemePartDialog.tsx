/**
 * [INPUT]: 依赖主题类型、创建 API 与界面翻译。
 * [OUTPUT]: 提供主题部件类型和标题表单。
 * [POS]: 主题部件创建入口；类型值与校验源文保持稳定。
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import { useI18n } from "../i18n/index.ts";
import { Select } from "@cloudflare/kumo";
import * as React from "react";
import { THEME_PART_TYPES, THEME_PART_TYPE_LABELS, type ThemePartType } from "../../core/index.ts";
import { THEME_PARTS_COLLECTION } from "../../constants.ts";
import type { Fetcher } from "../api.ts";
import { createThemePart } from "../theme-api.ts";
import { editorUrl } from "../editor/exit.ts";
import { FIELD } from "../ui.ts";
import { CreateDialog } from "./CreateDialog.tsx";

const TYPES = THEME_PART_TYPES.map((value) => ({
  value,
  label: THEME_PART_TYPE_LABELS[value],
}));

/** New theme part: type + title, then open the shared editor. */
export function NewThemePartDialog({
  fetcher,
  open,
  onOpenChange,
  defaultType = "header",
}: {
  fetcher: Fetcher;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** UX-055: opened from a type's filter, the dialog starts on that type. */
  defaultType?: ThemePartType;
}) {
  const t = useI18n();
  const [partType, setPartType] = React.useState<ThemePartType>(defaultType);
  const [wasOpen, setWasOpen] = React.useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setPartType(defaultType);
  }
  return (
    <CreateDialog
      name="new-theme-part"
      heading={t("New theme part")}
      noun="theme part"
      emptyTitle="Enter a title."
      slugPrefix={`${partType}-`}
      slugHint={t("Tells theme parts apart. Theme parts have no public address.")}
      submitLabel={t("Create theme part")}
      open={open}
      onOpenChange={onOpenChange}
      create={async (title, slug) =>
        editorUrl(await createThemePart(fetcher, { title, slug, partType }), THEME_PARTS_COLLECTION)
      }
    >
      <Select
        label={t("Type")}
        className={FIELD}
        value={partType}
        onValueChange={(value) =>
          setPartType(TYPES.find((option) => option.value === value)?.value ?? "header")
        }
        renderValue={(value: unknown) =>
          t(TYPES.find((option) => option.value === value)?.label ?? String(value))
        }
      >
        {TYPES.map((option) => (
          <Select.Option key={option.value} value={option.value}>
            {t(option.label)}
          </Select.Option>
        ))}
      </Select>
    </CreateDialog>
  );
}
