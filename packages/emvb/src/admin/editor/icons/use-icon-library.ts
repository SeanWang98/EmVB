/**
 * [INPUT]: 依赖图标模型、上传 API 与结构化显示消息。
 * [OUTPUT]: 提供useIconLibrary 与计数格式化函数。
 * [POS]: 图标状态层；模板随语言切换，API 错误保留原文。
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import {
  errorMessage,
  formatMessage,
  LocalizedMessageError,
  type LocalizedMessage,
} from "../localized-message.ts";
import { useI18n } from "../../i18n/index.ts";
import * as React from "react";
import type { Fetcher } from "../../api.ts";
import {
  deleteUploadedIcon,
  listUploadedIcons,
  renameUploadedIcon,
  uploadIconFile,
} from "../../icon-uploads-api.ts";
import {
  ALL_ICONS,
  filterIcons,
  ICON_CATEGORIES,
  ICON_SETS,
  loadIconSet,
  locateIcon,
  setsFor,
  uploadedIcons,
  UPLOADS,
  UPLOADS_CATEGORY,
  type IconCategory,
  type IconSetId,
  type LibraryIcon,
} from "./library.ts";

export const fmt = (count: number) => count.toLocaleString("en-US");

function initialCategory(currentId: string | undefined, uploads: boolean): string {
  const at = currentId ? locateIcon(currentId) : undefined;
  if (!at) return ALL_ICONS;
  if (at.set === UPLOADS) return uploads ? UPLOADS : ALL_ICONS;
  const style = ICON_CATEGORIES.find((category) => category.id === `${at.set}/${at.style}`);
  return style?.id ?? at.set;
}

/** Category, search, uploads and the keyboard cursor for the icon library. */
export function useIconLibrary({
  currentId,
  fetcher,
  loadSet = loadIconSet,
}: {
  currentId: string | undefined;
  fetcher?: Fetcher;
  /** Loads one icon set; replaceable so a failed download can be tested. */
  loadSet?: typeof loadIconSet;
}) {
  const t = useI18n();
  const [categoryId, setCategoryId] = React.useState(() =>
    initialCategory(currentId, fetcher !== undefined),
  );
  const categories = React.useMemo(
    () => (fetcher ? [...ICON_CATEGORIES, UPLOADS_CATEGORY] : ICON_CATEGORIES),
    [fetcher],
  );
  const [uploads, setUploads] = React.useState<LibraryIcon[]>();
  const [uploadsFailed, setUploadsFailed] = React.useState<string>();
  const [uploading, setUploading] = React.useState(false);
  const [uploadNoteMessage, setUploadNote] = React.useState<{
    error: boolean;
    text: LocalizedMessage;
    values?: Readonly<Record<string, string | number>>;
    imagesLeftOut?: number;
    fallbackName?: boolean;
  }>();
  const uploadNote = uploadNoteMessage
    ? {
        ...uploadNoteMessage,
        text:
          typeof uploadNoteMessage.text === "string"
            ? t(uploadNoteMessage.text, {
                ...uploadNoteMessage.values,
                ...(uploadNoteMessage.fallbackName ? { name: t("an icon") } : {}),
                ...(uploadNoteMessage.imagesLeftOut !== undefined
                  ? {
                      removed:
                        uploadNoteMessage.imagesLeftOut > 0
                          ? " " +
                            t(
                              uploadNoteMessage.imagesLeftOut === 1
                                ? "{count} outside image was left out."
                                : "{count} outside images were left out.",
                              { count: uploadNoteMessage.imagesLeftOut },
                            )
                          : "",
                    }
                  : {}),
              })
            : formatMessage(uploadNoteMessage.text, t),
      }
    : undefined;
  const fileRef = React.useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = React.useState("");
  const [selectedId, setSelectedId] = React.useState(
    () => (currentId ? locateIcon(currentId)?.id : undefined) ?? currentId,
  );
  const [sets, setSets] = React.useState<Partial<Record<IconSetId, LibraryIcon[]>>>({});
  const [failed, setFailed] = React.useState<string>();
  const [attempt, setAttempt] = React.useState(0);
  const gridRef = React.useRef<HTMLDivElement | null>(null);
  const searchId = React.useId();

  const category: IconCategory =
    categories.find((item) => item.id === categoryId) ?? (ICON_CATEGORIES[0] as IconCategory);
  const inUploads = category.id === UPLOADS;
  const needed = inUploads ? [] : setsFor(category);
  const neededKey = needed.join(",");

  // My uploads loads when first needed: its category, All icons (which lists them first, W-295),
  // or a stored upload to show as picked.
  const inAll = category.id === ALL_ICONS;
  const wantUploads =
    fetcher !== undefined && (inUploads || inAll || locateIcon(currentId ?? "")?.set === UPLOADS);
  React.useEffect(() => {
    if (!wantUploads || !fetcher || uploads) return undefined;
    let live = true;
    setUploadsFailed(undefined);
    listUploadedIcons(fetcher).then(
      (items) => {
        if (live) setUploads(uploadedIcons(items));
      },
      (caught: unknown) => {
        if (live)
          setUploadsFailed(caught instanceof Error ? caught.message : "Couldn't load uploads.");
      },
    );
    return () => {
      live = false;
    };
  }, [wantUploads, fetcher, uploads, attempt]);

  React.useEffect(() => {
    let live = true;
    setFailed(undefined);
    for (const id of (neededKey ? neededKey.split(",") : []) as IconSetId[]) {
      loadSet(id).then(
        (icons) => {
          if (live) setSets((prev) => (prev[id] ? prev : { ...prev, [id]: icons }));
        },
        () => {
          if (live) setFailed(ICON_SETS.find((set) => set.id === id)?.label ?? id);
        },
      );
    }
    return () => {
      live = false;
    };
  }, [neededKey, attempt, loadSet]);

  // All icons waits for the uploads list too, unless it failed (the sets still show, W-295).
  const uploadsSettled = !fetcher || uploads !== undefined || uploadsFailed !== undefined;
  const ready = inUploads
    ? uploads !== undefined
    : needed.every((id) => sets[id]) && (!inAll || uploadsSettled);
  const filtered = React.useMemo(
    () =>
      ready
        ? filterIcons(
            inUploads
              ? (uploads ?? [])
              : [...(inAll ? (uploads ?? []) : []), ...needed.flatMap((id) => sets[id] ?? [])],
            category,
            query,
          )
        : [],
    // `needed` follows `category`; `ready` follows `sets` and `uploads`.
    [ready, sets, uploads, category, query, inAll],
  );

  // Matches per sidebar entry, for the sets loaded so far (a search shows where its hits are).
  const counts = React.useMemo(() => {
    const loaded = Object.values(sets).flat();
    const tally = new Map<string, number>();
    for (const icon of filterIcons(loaded, ICON_CATEGORIES[0] as IconCategory, query)) {
      tally.set(icon.set, (tally.get(icon.set) ?? 0) + 1);
      tally.set(`${icon.set}/${icon.style}`, (tally.get(`${icon.set}/${icon.style}`) ?? 0) + 1);
    }
    if (uploads) tally.set(UPLOADS, filterIcons(uploads, UPLOADS_CATEGORY, query).length);
    const allLoaded = ICON_SETS.every((set) => sets[set.id]);
    if (allLoaded)
      tally.set(
        ALL_ICONS,
        [...ICON_SETS].reduce((n, s) => n + (tally.get(s.id) ?? 0), 0) + (tally.get(UPLOADS) ?? 0),
      );
    return tally;
  }, [sets, uploads, query]);

  // The keyboard cursor belongs to one list. A new list (search, category) starts from the picked
  // icon if it is in it, else nowhere, in the same render: an index left over from the last list
  // would scroll this one to a tile it doesn't have.
  const [cursor, setCursor] = React.useState<{ list: readonly LibraryIcon[]; index: number }>({
    list: [],
    index: -1,
  });
  const active =
    cursor.list === filtered ? cursor.index : filtered.findIndex((icon) => icon.id === selectedId);
  const setActive = (index: number) => setCursor({ list: filtered, index });

  const selected = React.useMemo(() => {
    if (!selectedId) return undefined;
    for (const icons of [...Object.values(sets), uploads]) {
      const found = icons?.find((icon) => icon.id === selectedId);
      if (found) return found;
    }
    return undefined;
  }, [sets, uploads, selectedId]);

  const onUpload = async (file: File | undefined) => {
    if (!file || !fetcher) return;
    setUploading(true);
    setUploadNote(undefined);
    try {
      const result = await uploadIconFile(fetcher, file, (svg) => {
        const [probe] = uploadedIcons([{ id: "new", name: "", svg, uploadedAt: "" }]);
        return uploads?.find((other) => other.markup === probe?.markup)?.id;
      });
      setQuery("");
      setCursor({ list: [], index: -1 });
      if ("existingId" in result) {
        const known = uploads?.find((other) => other.id === result.existingId);
        setSelectedId(result.existingId);
        setUploadNote({
          error: false,
          text: "You already uploaded this SVG as {name}, so it's selected. Insert adds it to the page.",
          values: { name: known?.label ?? "" },
          fallbackName: !known?.label,
        });
        return;
      }
      const { item, imagesLeftOut } = result;
      const [icon] = uploadedIcons([item]);
      if (!icon)
        throw new LocalizedMessageError("The uploaded SVG couldn't be shown. Try another file.");
      setUploads((prev) => [icon, ...(prev ?? []).filter((other) => other.id !== icon.id)]);
      setSelectedId(icon.id);
      setUploadNote({
        error: false,
        text: "Uploaded {name}. Insert adds it to the page.{removed}",
        values: { name: icon.label },
        imagesLeftOut,
      });
    } catch (caught) {
      setUploadNote({
        error: true,
        text: errorMessage(caught, "The upload failed. Try again."),
      });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const activate = (index: number) => {
    setActive(index);
    const icon = filtered[index];
    if (icon) setSelectedId(icon.id);
  };

  const uploadId = selected?.id.startsWith("upload:")
    ? selected.id.slice("upload:".length)
    : undefined;
  const renameUpload = () => {
    if (!fetcher || !uploadId || !selected) return;
    const name = window.prompt(t("Rename this upload"), selected.label);
    if (!name || !name.trim() || name.trim() === selected.label) return;
    void renameUploadedIcon(fetcher, uploadId, name.trim())
      .then((item) => {
        const [icon] = uploadedIcons([item]);
        if (!icon) return;
        setUploads((current) => current?.map((entry) => (entry.id === icon.id ? icon : entry)));
        setUploadNote({
          error: false,
          text: "Renamed to {name}. Pages that already use it are unchanged.",
          values: { name: icon.label },
        });
      })
      .catch((caught: unknown) => {
        setUploadNote({
          error: true,
          text: errorMessage(caught, "Couldn't rename that upload."),
        });
      });
  };
  const deleteUpload = () => {
    if (!fetcher || !uploadId || !selected) return;
    if (
      !window.confirm(
        t("Remove “{name}” from My uploads? Icons already on a page stay as they are.", {
          name: selected.label,
        }),
      )
    ) {
      return;
    }
    void deleteUploadedIcon(fetcher, uploadId)
      .then(() => {
        setUploads((current) => current?.filter((entry) => entry.id !== selected.id));
        setSelectedId(undefined);
        setUploadNote({
          error: false,
          text: "Removed from My uploads. Icons already placed on a page still show.",
        });
      })
      .catch((caught: unknown) => {
        setUploadNote({
          error: true,
          text: errorMessage(caught, "Couldn't remove that upload."),
        });
      });
  };

  const status = failed
    ? t("{set} didn't load.", { set: failed })
    : inUploads && uploadsFailed
      ? t("Uploads didn't load.")
      : !ready
        ? t("Loading icons…")
        : filtered.length === 0
          ? query.trim()
            ? t('No icons match "{query}" in {category}.', {
                query: query.trim(),
                category: t(category.label),
              })
            : inUploads
              ? t("No uploads yet.")
              : t("No icons here.")
          : filtered.length === 1
            ? t("{count} icon", { count: fmt(filtered.length) })
            : t("{count} icons", { count: fmt(filtered.length) });

  return {
    categories,
    categoryId,
    setCategoryId,
    query,
    setQuery,
    searchId,
    category,
    filtered,
    active,
    setActive,
    gridRef,
    inUploads,
    uploading,
    fileRef,
    onUpload,
    uploadNote,
    uploadsFailed,
    setUploadsFailed,
    setAttempt,
    failed,
    ready,
    status,
    counts,
    selectedId,
    activate,
    selected,
    uploadId,
    renameUpload,
    deleteUpload,
  };
}
