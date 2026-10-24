/**
 * [INPUT]: 依赖编辑器状态、操作接口与后台语言。
 * [OUTPUT]: 提供随后台语言更新的面板控件。
 * [POS]: 编辑器面板；只翻译界面，保留用户内容原值。
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import { useI18n } from "../../i18n/index.ts";
import { Button, Input } from "@cloudflare/kumo";
import * as React from "react";
import { elementIcon } from "../element-chrome.ts";
import {
  ELEMENT_DESCRIPTORS,
  SECTION_RECIPES,
  typeMayAddScript,
  type ElementType,
} from "../../../core/index.ts";
import { NEW_ELEMENT_MIME } from "../dnd/drop-target.ts";
import { BUTTON, FIELD } from "../../ui.ts";
import { isCancelEscape } from "../ime.ts";
import { matchesSearch } from "../../search.ts";
import { dragStash } from "../dnd/drag-stash.ts";
import type { SavedSectionActions } from "../useSavedSections.ts";
import { matchingSections, SavedSectionsGroup } from "./SavedSectionsGroup.tsx";

const GROUPS = [
  { id: "layout", label: "Layout" },
  { id: "content", label: "Content" },
  { id: "dynamic", label: "Dynamic" },
  { id: "form", label: "Form" },
] as const;

export function AddPanel({
  onAdd,
  onRecipe,
  saved,
  defaultQuery = "",
  formsAvailable = true,
}: {
  onAdd: (type: ElementType) => void;
  /** Adds a section recipe (W-320); without it, recipes are not offered. */
  onRecipe?: (id: string) => void;
  /** My sections (W-876); without it the group is not shown. */
  saved?: SavedSectionActions;
  /** Test-only initial search string. */
  defaultQuery?: string;
  /** Hide the Form group when the forms plugin is missing (W-036). */
  formsAvailable?: boolean;
}) {
  const t = useI18n();
  const [query, setQuery] = React.useState(defaultQuery);
  const searchRef = React.useRef<HTMLInputElement>(null);
  const clear = () => {
    setQuery("");
    searchRef.current?.focus();
  };
  const matched = ELEMENT_DESCRIPTORS.filter(
    (d) =>
      d.type !== "tab-panel" &&
      (formsAvailable || d.group !== "form") &&
      matchesSearch(
        query,
        d.type,
        d.name,
        d.group,
        t(d.name),
        t(GROUPS.find((group) => group.id === d.group)?.label ?? d.group),
      ),
  );
  const recipes = onRecipe
    ? SECTION_RECIPES.filter((r) =>
        matchesSearch(
          query,
          r.id,
          r.name,
          r.description,
          t(r.name),
          t(r.description),
          "recipe section",
          t("Section recipes"),
        ),
      )
    : [];
  return (
    <div className="emvb-panel-body" data-emvb-panel="add">
      {/* UX-053: named like the other searches; a visible heading only repeated the placeholder. */}
      <Input
        aria-label={t("Search elements")}
        type="search"
        className={FIELD}
        ref={searchRef}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={(event) => {
          // UX-013: Escape clears a search first, as Site styles searches do.
          if (isCancelEscape(event) && query) {
            event.stopPropagation();
            setQuery("");
          }
        }}
        placeholder={t("Search elements…")}
      />
      {matched.length === 0 &&
      recipes.length === 0 &&
      (!saved || matchingSections(saved, query, t).length === 0) ? (
        <div className="emvb-add-nomatch" data-emvb-add-nomatch="">
          <p className="emvb-helper" role="status">
            {t('No elements match "{query}".', { query: query.trim() })}
          </p>
          <Button type="button" variant="secondary" className={BUTTON} onClick={clear}>
            {t("Clear search")}
          </Button>
        </div>
      ) : (
        GROUPS.map((group) => {
          const tiles = matched.filter((d) => d.group === group.id);
          if (tiles.length === 0) return null;
          return (
            <div key={group.id} className="emvb-add-group">
              <h3 className="emvb-add-group-title">{t(group.label)}</h3>
              <div className="emvb-add-tiles" aria-label={t(group.label)}>
                {tiles.map((tile) => {
                  const Icon = elementIcon(tile.type);
                  return (
                    <button
                      key={tile.type}
                      type="button"
                      className="emvb-element-tile"
                      data-emvb-add-tile={tile.type}
                      // UX-029: the JS badge is drawn for sighted users; this says the same aloud.
                      aria-description={
                        typeMayAddScript(tile.type)
                          ? t("Adds a small script to the page")
                          : undefined
                      }
                      draggable
                      onDragStart={(event) => {
                        event.dataTransfer.setData(NEW_ELEMENT_MIME, tile.type);
                        event.dataTransfer.effectAllowed = "copy";
                        dragStash.new(tile.type);
                      }}
                      onClick={() => onAdd(tile.type as ElementType)}
                    >
                      <Icon size={20} aria-hidden="true" />
                      <span>{t(tile.name)}</span>
                      {typeMayAddScript(tile.type) && (
                        <span
                          className="emvb-js-badge"
                          title={t("Adds a small script to the page; everything else is zero-JS")}
                          aria-hidden="true"
                        >
                          JS
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })
      )}
      {onRecipe && recipes.length > 0 && (
        <div className="emvb-add-group" data-emvb-recipes="">
          <h3 className="emvb-add-group-title">{t("Section recipes")}</h3>
          <p className="emvb-helper">
            {t("Whole sections that use your Site styles colours, sizes and classes.")}
          </p>
          <div className="emvb-recipe-list" aria-label={t("Section recipes")}>
            {recipes.map((recipe) => (
              <button
                key={recipe.id}
                type="button"
                className="emvb-recipe-tile"
                data-emvb-recipe={recipe.id}
                onClick={() => onRecipe(recipe.id)}
              >
                <span className="emvb-recipe-name">{t(recipe.name)}</span>
                <span className="emvb-recipe-desc">{t(recipe.description)}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      {saved && <SavedSectionsGroup saved={saved} query={query} />}
    </div>
  );
}
