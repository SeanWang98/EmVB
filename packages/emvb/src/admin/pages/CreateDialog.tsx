/**
 * [INPUT]: 依赖受控表单、创建回调与界面翻译。
 * [OUTPUT]: 提供页面和主题部件共用的新建弹窗。
 * [POS]: 创建失败保留原因与原文；当前语言只参与渲染。
 * [PROTOCOL]: 变更时更新此头部，然后检查 AGENTS.md
 */
import { useI18n, type Translate } from "../i18n/index.ts";
import { Button, Dialog, Input, Loader } from "@cloudflare/kumo";
import { PlusIcon } from "@phosphor-icons/react";
import * as React from "react";
import { pageSlug } from "../../core/index.ts";
import { ApiError } from "../api.ts";
import { slugTakenMessage } from "../editor/useSave.ts";
import { useMediaQuery } from "../editor/useMediaQuery.ts";
import { BUTTON, FIELD, SOLID_PRIMARY, UI_CSS } from "../ui.ts";

type FieldError =
  | { field: "title"; reason: "required" }
  | { field: "slug"; reason: "invalid" }
  | { field: "slug"; reason: "conflict"; slug: string }
  | { field: "form"; reason: "api"; code: string; message: string }
  | { field: "form"; reason: "connection" };

/** 创建失败只记录原因；切换语言不重提创建请求。 */
function createFailure(failure: unknown, slug: string): FieldError {
  if (failure instanceof ApiError && failure.code === "SLUG_CONFLICT") {
    return { field: "slug", reason: "conflict", slug };
  }
  return failure instanceof ApiError
    ? { field: "form", reason: "api", code: failure.code, message: failure.message }
    : { field: "form", reason: "connection" };
}

/** 只有已知界面错误进入词典；外部 API 原文按参数展示。 */
function createErrorMessage(
  error: FieldError | undefined,
  emptyTitle: string,
  noun: string,
  t: Translate,
): string | undefined {
  if (!error) return;
  switch (error.reason) {
    case "required":
      return t(emptyTitle);
    case "invalid":
      return t("Enter a slug using letters, digits or -.");
    case "conflict":
      return slugTakenMessage(error.slug, t);
    case "api":
      return t("Couldn't create the {type}. {message}", {
        type: t(noun),
        message:
          error.code === "TEMPLATE_UNAVAILABLE"
            ? t("The selected page template couldn't be loaded. Try again or choose Blank page.")
            : error.message,
      });
    case "connection":
      return t("Couldn't create the {type}. Check your connection and try again.", {
        type: t(noun),
      });
  }
}

/**
 * The New page / New theme part form (IA): title, a slug that follows `slugPrefix` + title until
 * edited, then `create` returns the editor URL to open. `children` go above the title.
 */
export function CreateDialog({
  name,
  heading,
  noun,
  emptyTitle,
  slugPrefix = "",
  slugHint,
  submitLabel,
  create,
  open,
  onOpenChange,
  children,
}: {
  name: string;
  heading: string;
  noun: string;
  emptyTitle: "Enter a title for the page." | "Enter a title.";
  slugPrefix?: string;
  slugHint: string;
  submitLabel: string;
  create: (title: string, slug: string) => Promise<string>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children?: React.ReactNode;
}) {
  const t = useI18n();
  const [title, setTitle] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [slugEdited, setSlugEdited] = React.useState(false);
  const [error, setError] = React.useState<FieldError>();
  const errorMessage = createErrorMessage(error, emptyTitle, noun, t);
  const [busy, setBusy] = React.useState(false);
  const pending = React.useRef(false);
  // W-813: a refused or failed create moved focus nowhere (to the page body after a 409), and
  // the field in error wasn't marked invalid, so a screen reader user heard nothing.
  const titleInput = React.useRef<HTMLInputElement>(null);
  const slugInput = React.useRef<HTMLInputElement>(null);
  const [errorTurn, setErrorTurn] = React.useState(0);
  React.useEffect(() => {
    if (busy || !error || error.field === "form") return;
    (error.field === "title" ? titleInput : slugInput).current?.focus();
  }, [error, busy, errorTurn]);
  // Native autofocus can run before Kumo records its return-focus target.
  const opener = React.useRef<HTMLElement | null>(null);
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  // A new prefix (theme part type) re-derives an untouched slug for the title typed so far.
  const titleRef = React.useRef(title);
  titleRef.current = title;
  const slugEditedRef = React.useRef(slugEdited);
  slugEditedRef.current = slugEdited;
  React.useEffect(() => {
    if (!slugEditedRef.current && titleRef.current) {
      setSlug(pageSlug(`${slugPrefix}${titleRef.current}`));
    }
  }, [slugPrefix]);

  const submit = async () => {
    if (pending.current) return;
    const cleanTitle = title.trim();
    const cleanSlug = pageSlug(slug);
    setErrorTurn((turn) => turn + 1);
    if (!cleanTitle) return setError({ field: "title", reason: "required" });
    if (!cleanSlug) {
      return setError({ field: "slug", reason: "invalid" });
    }
    setError(undefined);
    pending.current = true;
    setBusy(true);
    try {
      window.location.assign(await create(cleanTitle, cleanSlug));
    } catch (failure) {
      pending.current = false;
      setBusy(false);
      setError(createFailure(failure, cleanSlug));
    }
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next && pending.current) return;
        onOpenChange(next);
      }}
      onOpenChangeComplete={(next) => {
        if (next) return;
        const target = opener.current;
        opener.current = null;
        if (target?.isConnected) target.focus({ preventScroll: true });
      }}
    >
      <Dialog size="base" className="p-6">
        <style>{UI_CSS}</style>
        <form
          data-emvb-dialog={name}
          className="emvb-dialog"
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <Dialog.Title>{heading}</Dialog.Title>
          {/* W-826: locked, not disabled, while creating: a disabled field or button dropped
              keyboard focus to the page body for the whole request and after a failure. */}
          <fieldset className="emvb-create-fields" aria-disabled={busy}>
            {children}
            <Input
              label={t("Title")}
              readOnly={busy}
              ref={titleInput}
              aria-invalid={error?.field === "title" || undefined}
              className={FIELD}
              autoFocus
              onFocus={(event) => {
                const previous = event.relatedTarget;
                if (
                  !opener.current &&
                  previous instanceof HTMLElement &&
                  !event.currentTarget.closest('[role="dialog"]')?.contains(previous)
                ) {
                  opener.current = previous;
                }
              }}
              value={title}
              error={error?.field === "title" ? errorMessage : undefined}
              onChange={(event) => {
                setTitle(event.target.value);
                if (!slugEdited) setSlug(pageSlug(`${slugPrefix}${event.target.value}`));
              }}
            />
            <Input
              label={t("Slug")}
              readOnly={busy}
              ref={slugInput}
              aria-invalid={error?.field === "slug" || undefined}
              className={`${FIELD} emvb-mono`}
              value={slug}
              description={slugHint}
              error={error?.field === "slug" ? errorMessage : undefined}
              onChange={(event) => {
                setSlugEdited(true);
                setSlug(event.target.value);
              }}
            />
          </fieldset>
          {error?.field === "form" && (
            <p className="emvb-inline-error" role="alert">
              {errorMessage}
            </p>
          )}
          <p
            className="emvb-create-status"
            role="status"
            aria-label={t("Creation status")}
            aria-live="polite"
          >
            {busy ? t("Creating {type}…", { type: t(noun) }) : ""}
          </p>
          <div className="emvb-dialog-actions">
            <Dialog.Close
              render={(props) => (
                <Button {...props} variant="secondary" className={BUTTON} aria-disabled={busy}>
                  {t("Cancel")}
                </Button>
              )}
            />
            <Button
              type="submit"
              variant="primary"
              className={BUTTON}
              style={SOLID_PRIMARY}
              icon={
                busy && !reducedMotion ? (
                  <Loader size={14} />
                ) : (
                  <PlusIcon size={14} aria-hidden="true" />
                )
              }
              aria-disabled={busy}
              aria-busy={busy}
            >
              {submitLabel}
            </Button>
          </div>
        </form>
      </Dialog>
    </Dialog.Root>
  );
}
