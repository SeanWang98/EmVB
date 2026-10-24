/**
 * [INPUT]: 依赖共享样式类操作、命令错误源消息与后台翻译。
 * [OUTPUT]: 导出 ClassChipInput。
 * [POS]: 元素样式类选择器；当前语言格式化反馈，保留用户类名。
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import { useI18n } from "../../../i18n/index.ts";
import { Button, Input } from "@cloudflare/kumo";
import { MapPinIcon, PlusIcon, TagSimpleIcon } from "@phosphor-icons/react";
import * as React from "react";
import {
  addClassId,
  duplicateClass,
  hasStateStyles,
  moveClassId,
  removeClassId,
  renameClass,
  classNameTaken,
  cleanClassName,
  replaceClassId,
  type DesignSystem,
} from "../../../../core/index.ts";
import { BUTTON, FIELD } from "../../../ui.ts";
import { uniqueId } from "../site-list.tsx";
import { ClassChip, stopEditorShortcuts } from "./ClassChip.tsx";
import {
  appliedByName,
  classOptions,
  MAX_ELEMENT_CLASSES,
  MAX_SITE_CLASSES,
  type ClassOption,
} from "./class-suggest.ts";
import { isCancelEscape, isCommitEnter } from "../../ime.ts";
import { formatError, type LocalizedError } from "./localized-error.ts";
import { errorMessage } from "../../localized-message.ts";

type Props = {
  applied: readonly string[] | undefined;
  design: DesignSystem;
  /** The applied class the Style sections edit, or null for this element's local styles. */
  editing: string | null;
  onEdit: (classId: string | null) => void;
  onChange: (classes: string[] | undefined) => void;
  onDesignChange: (design: DesignSystem) => Promise<void>;
  /**
   * Moves this element's local styles into a new class named `name` (W-134). Absent when the
   * element has no local styles or a class is being edited. Throws with the reason it can't.
   */
  onSaveLocal?: (name: string) => Promise<void>;
};

const optionKey = (option: ClassOption) =>
  option.kind === "class" ? option.cls.id : `create-${option.name}`;

/**
 * The Style tab's Classes field (W-087, DESIGN.md "class chip input"): a Local chip, one chip per
 * applied class in cascade order, and a combobox that suggests classes or creates one.
 */
export function ClassChipInput({
  applied,
  design,
  editing,
  onEdit,
  onChange,
  onDesignChange,
  onSaveLocal,
}: Props) {
  const t = useI18n();
  const ids = applied ?? [];
  const catalog = design.classes ?? [];
  const byId = new Map(catalog.map((cls) => [cls.id, cls]));
  const baseId = React.useId();
  const listId = `${baseId}-list`;
  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState(0);
  const [error, setError] = React.useState<LocalizedError | null>(null);
  const errorText = formatError(error, t);
  const [focusAt, setFocusAt] = React.useState<{ index: number } | null>(null);
  const [naming, setNaming] = React.useState(false);
  const [localName, setLocalName] = React.useState("");
  const [savedNote, setSavedNote] = React.useState<LocalizedError | null>(null);
  const savedNoteText = formatError(savedNote, t);
  const chipRefs = React.useRef<Array<HTMLButtonElement | null>>([]);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const options = classOptions(catalog, ids, query);
  const full = ids.length >= MAX_ELEMENT_CLASSES;
  const current = options[Math.min(active, options.length - 1)];

  React.useEffect(() => {
    if (!focusAt) return;
    const target = chipRefs.current[focusAt.index] ?? inputRef.current;
    target?.focus();
    setFocusAt(null);
  }, [focusAt]);

  const commit = (next: string[]) => onChange(next.length === 0 ? undefined : next);
  /** Chip positions: 0 is Local, 1…n the classes, n + 1 the text input. */
  const focusChip = (index: number) => setFocusAt({ index: Math.max(0, index) });

  const reset = () => {
    setQuery("");
    setActive(0);
    setError(null);
  };

  const create = async (name: string) => {
    if (catalog.length >= MAX_SITE_CLASSES) {
      setError({
        format: (currentT) =>
          currentT("This site already has {count} classes, the most allowed.", {
            count: MAX_SITE_CLASSES,
          }),
      });
      return;
    }
    const id = uniqueId(
      name,
      "class",
      catalog.map((cls) => cls.id),
    );
    try {
      await onDesignChange({ ...design, classes: [...catalog, { id, name, style: {} }] });
    } catch (err) {
      setError(errorMessage(err, "Couldn't create the class. Try again."));
      return;
    }
    commit(addClassId(ids, id));
    reset();
  };

  const choose = (option: ClassOption | undefined) => {
    if (!option || full) return;
    if (option.kind === "create") {
      void create(option.name);
      return;
    }
    commit(addClassId(ids, option.cls.id));
    reset();
  };

  const saveDesign = async (next: DesignSystem) => {
    setError(null);
    try {
      await onDesignChange(next);
      return true;
    } catch (err) {
      setError(errorMessage(err, "Couldn't save the class. Try again."));
      return false;
    }
  };

  const rename = (id: string, name: string) => {
    if (classNameTaken(design, name, id)) {
      const duplicateName = cleanClassName(name);
      setError({
        format: (currentT) =>
          currentT('A class named "{name}" already exists. Pick another name.', {
            name: duplicateName,
          }),
      });
      return;
    }
    void saveDesign(renameClass(design, id, name));
  };

  /** Copies the class and swaps the copy in on this element only, ready to edit. */
  const duplicate = async (id: string) => {
    const next = duplicateClass(design, id);
    const copy = next.classes?.at(-1);
    if (next === design || !copy || !(await saveDesign(next))) return;
    commit(replaceClassId(ids, id, copy.id));
    onEdit(copy.id);
  };

  const closeNaming = () => {
    setNaming(false);
    setLocalName("");
  };

  /** "Save local styles as class" (W-134): one page edit, so one Ctrl+Z puts them back. */
  const saveLocal = async () => {
    // W-558: cleaned as every class name is, so "Hero  title" can't sit beside "Hero title".
    const name = cleanClassName(localName);
    if (!name || !onSaveLocal) return;
    if (classNameTaken(design, name)) {
      setError({
        format: (currentT) =>
          currentT('A class named "{name}" already exists. Pick another name.', { name }),
      });
      return;
    }
    setError(null);
    try {
      await onSaveLocal(name);
    } catch (err) {
      setError(errorMessage(err, "Couldn't save the class. Try again."));
      return;
    }
    closeNaming();
    setSavedNote({
      format: (currentT) =>
        currentT('Saved as class "{name}". Publish site styles to show it on the site.', { name }),
    });
  };

  const reorder = (index: number, delta: -1 | 1) => commit(moveClassId(ids, index, delta));

  const remove = (id: string, focusIndex: number) => {
    commit(removeClassId(ids, id));
    focusChip(focusIndex);
  };

  const onInputKey = (event: React.KeyboardEvent<HTMLInputElement>) => {
    stopEditorShortcuts(event);
    const atStart =
      event.currentTarget.selectionStart === 0 && event.currentTarget.selectionEnd === 0;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActive(open && options.length > 0 ? (active + step + options.length) % options.length : 0);
      setOpen(true);
    } else if (isCommitEnter(event)) {
      event.preventDefault();
      if (query.trim() && appliedByName(catalog, ids, query)) {
        const name = query.trim();
        setError({
          format: (currentT) => currentT('"{name}" is already on this element.', { name }),
        });
        return;
      }
      choose(current);
    } else if (isCancelEscape(event)) {
      if (open) setOpen(false);
      else reset();
    } else if (event.key === "Backspace" && query === "" && ids.length > 0) {
      event.preventDefault();
      commit(ids.slice(0, -1));
    } else if (event.key === "ArrowLeft" && atStart) {
      event.preventDefault();
      focusChip(ids.length);
    }
  };

  const onChipKey = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    stopEditorShortcuts(event);
    const id = ids[index - 1];
    const move = event.altKey && id !== undefined;
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      const delta = event.key === "ArrowLeft" ? -1 : 1;
      if (move) {
        const next = moveClassId(ids, index - 1, delta);
        commit(next);
        focusChip(next.indexOf(id) + 1);
      } else {
        focusChip(index + delta);
      }
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      focusChip(event.key === "Home" ? 0 : ids.length + 1);
    } else if ((event.key === "Backspace" || event.key === "Delete") && id !== undefined) {
      event.preventDefault();
      remove(id, event.key === "Backspace" ? index - 1 : index);
    }
  };

  return (
    <div className="emvb-class-field" data-emvb-class-picker="">
      <label className="emvb-field-label" htmlFor={`${baseId}-input`}>
        {t("Classes")}
      </label>
      <div className="emvb-chip-anchor">
        <div
          className="emvb-chip-box"
          data-emvb-chip-box=""
          role="group"
          aria-label={t("Classes on this element")}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              event.preventDefault();
              inputRef.current?.focus();
            }
          }}
        >
          <span
            className="emvb-chip emvb-chip-local"
            data-emvb-chip-local=""
            data-active={editing === null}
          >
            <button
              type="button"
              ref={(el) => {
                chipRefs.current[0] = el;
              }}
              className="emvb-chip-main"
              aria-pressed={editing === null}
              title={t("Local styles: this element only")}
              onClick={() => onEdit(null)}
              onKeyDown={(event) => onChipKey(event, 0)}
            >
              <MapPinIcon size={12} weight="fill" aria-hidden="true" />
              <span className="emvb-chip-label">{t("Local")}</span>
            </button>
          </span>
          {ids.map((id, index) => (
            <ClassChip
              key={id}
              id={id}
              name={byId.get(id)?.name ?? id}
              missing={!byId.has(id)}
              active={editing === id}
              hasStates={hasStateStyles(byId.get(id))}
              first={index === 0}
              last={index === ids.length - 1}
              buttonRef={(el) => {
                chipRefs.current[index + 1] = el;
              }}
              onKeyDown={(event) => onChipKey(event, index + 1)}
              onEdit={() => onEdit(id)}
              onRename={(name) => rename(id, name)}
              onDuplicate={() => void duplicate(id)}
              onMove={(delta) => reorder(index, delta)}
              onRemove={() => remove(id, index)}
            />
          ))}
          <input
            ref={inputRef}
            id={`${baseId}-input`}
            className="emvb-chip-text"
            data-emvb-class-input=""
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={open}
            aria-controls={listId}
            aria-activedescendant={
              open && current ? `${baseId}-opt-${optionKey(current)}` : undefined
            }
            autoComplete="off"
            spellCheck={false}
            disabled={full}
            placeholder={full ? "" : t("Add class…")}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(0);
              setError(null);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setOpen(false)}
            onKeyDown={onInputKey}
          />
        </div>
        {open && !full && (
          <ul
            id={listId}
            role="listbox"
            aria-label={t("Class suggestions")}
            className="emvb-chip-listbox"
            data-emvb-class-options=""
          >
            {options.length === 0 && (
              <li role="presentation" className="emvb-chip-option-hint">
                {catalog.length === 0
                  ? t("No classes yet. Type a name to create one.")
                  : query.trim()
                    ? t("That class is already on this element.")
                    : t("Every class is already on this element.")}
              </li>
            )}
            {options.map((option, index) => (
              <li
                key={optionKey(option)}
                id={`${baseId}-opt-${optionKey(option)}`}
                role="option"
                aria-selected={option === current}
                className="emvb-chip-option"
                data-emvb-class-option={option.kind === "class" ? option.cls.id : "create"}
                onMouseDown={(event) => event.preventDefault()}
                onMouseMove={() => setActive(index)}
                onClick={() => choose(option)}
              >
                {option.kind === "class" ? (
                  <>
                    <TagSimpleIcon size={14} aria-hidden="true" />
                    <span className="emvb-chip-option-name">{option.cls.name}</span>
                    <span className="emvb-mono emvb-chip-option-token">
                      .emvb-k-{option.cls.id}
                    </span>
                  </>
                ) : (
                  <>
                    <PlusIcon size={14} aria-hidden="true" />
                    <span className="emvb-chip-option-name">
                      {t('Create class "{name}"', { name: option.name })}
                    </span>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      {editing !== null && (
        <p className="emvb-helper emvb-class-scope" data-emvb-class-scope="">
          {t('Editing class "{name}". Changes apply to every element that uses it.', {
            name: byId.get(editing)?.name ?? editing,
          })}{" "}
          <button type="button" className="emvb-link-button" onClick={() => onEdit(null)}>
            {t("Back to local styles")}
          </button>
        </p>
      )}
      {onSaveLocal && editing === null && !naming && (
        <button
          type="button"
          className="emvb-link-button emvb-save-local"
          data-emvb-save-local=""
          onClick={() => {
            setNaming(true);
            setSavedNote(null);
            setError(null);
          }}
        >
          {t("Save local styles as class")}
        </button>
      )}
      {naming && (
        <div
          className="emvb-save-local-row"
          data-emvb-save-local-row=""
          onKeyDown={stopEditorShortcuts}
        >
          <Input
            label={t("New class name")}
            className={FIELD}
            value={localName}
            maxLength={60}
            // oxlint-disable-next-line jsx-a11y/no-autofocus -- the user asked to name the class; focus moves into the field
            autoFocus
            onChange={(event) => {
              setLocalName(event.target.value);
              setError(null);
            }}
            onKeyDown={(event) => {
              if (isCommitEnter(event)) {
                event.preventDefault();
                void saveLocal();
              } else if (isCancelEscape(event)) closeNaming();
            }}
          />
          {/* UX-064: Cancel, then the action, right-aligned, like New variable and dialogs. */}
          <div className="emvb-dialog-actions emvb-save-local-actions">
            <Button type="button" variant="secondary" className={BUTTON} onClick={closeNaming}>
              {t("Cancel")}
            </Button>
            <Button
              type="button"
              variant="primary"
              className={BUTTON}
              disabled={localName.trim() === ""}
              onClick={() => void saveLocal()}
            >
              {t("Save as class")}
            </Button>
          </div>
        </div>
      )}
      {savedNote && (
        <p className="emvb-helper" role="status" data-emvb-save-local-done="">
          {savedNoteText}
        </p>
      )}
      {error && (
        <p className="emvb-inline-error" role="alert" data-emvb-class-error="">
          {errorText}
        </p>
      )}
      {/* UX-025: the cascade rule only matters once two classes can disagree. */}
      {(full || ids.length >= 2) && (
        <p className="emvb-helper" data-emvb-cascade-caption="">
          {full
            ? t("{count} classes is the most one element can have.", { count: MAX_ELEMENT_CLASSES })
            : t(
                "When two classes set the same property, the one lower in Site styles wins. Local styles still win.",
              )}
        </p>
      )}
    </div>
  );
}
