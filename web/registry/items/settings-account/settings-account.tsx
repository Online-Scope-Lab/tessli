"use client";

import * as React from "react";

import { cn } from "@/registry/shadcn/lib/utils";
import { Button, buttonVariants } from "@/registry/shadcn/ui/button";

export type ProfileValues = {
  /** The name other members see. */
  name: string;
  /** The sign-in address. Also the text typed to confirm deletion. */
  email: string;
};

type ProfileField = keyof ProfileValues;
type ProfileErrors = Partial<Record<ProfileField, string>>;
type SaveStatus = "idle" | "saving" | "saved" | "error";
type DeleteStatus = "idle" | "deleting" | "error" | "started";

export type SettingsAccountProps = Omit<
  React.ComponentProps<"div">,
  "title"
> & {
  /**
   * 1 when this is the page's title (the default). Use 2 inside a layout that
   * already has an h1; section headings follow one level below.
   */
  headingLevel?: 1 | 2;
  title?: React.ReactNode;
  /** One sentence on what this page changes. */
  description?: React.ReactNode;
  /** The product's name, used in the confirmation dialog's question. */
  productName: string;
  /** The saved profile. */
  profile: ProfileValues;
  nameHint?: React.ReactNode;
  emailHint?: React.ReactNode;
  /**
   * Called with valid, trimmed values. Throw or reject to show the save error.
   * Without it, saving only updates this component's state (as in previews).
   */
  onSaveProfile?: (values: ProfileValues) => void | Promise<void>;
  /** Said when saving fails: what failed, that nothing changed, what to do. */
  saveErrorMessage?: React.ReactNode;
  /** A URL that downloads everything the account owns. */
  exportHref: string;
  exportLabel?: string;
  /** What the export contains and in which format. */
  exportDescription?: React.ReactNode;
  /** What deletion removes, one line each, with the user's real counts. */
  deletes: React.ReactNode[];
  /** What survives deletion (shared work, records kept by law), if anything. */
  keeps?: React.ReactNode[];
  /** Throw or reject to show the delete error. Without it, deletion is only shown as started. */
  onDeleteAccount?: () => void | Promise<void>;
  /** Said when deletion fails: that nothing was deleted, and what to do. */
  deleteErrorMessage?: React.ReactNode;
  /** Replaces the delete action once deletion has started. */
  deletionStartedMessage?: React.ReactNode;
  /** The UI state to start in. For previews and tests. */
  initialState?: {
    values?: ProfileValues;
    showErrors?: boolean;
    save?: "saved" | "error";
    confirmOpen?: boolean;
    confirmText?: string;
    deleteError?: boolean;
    deletionStarted?: boolean;
  };
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;
const NAME_MAX = 60;

function validate(values: ProfileValues): ProfileErrors {
  const errors: ProfileErrors = {};
  const name = values.name.trim();
  if (!name) errors.name = "Enter your name, as other members should see it.";
  else if (name.length > NAME_MAX)
    errors.name = `Use ${NAME_MAX} characters or fewer.`;
  const email = values.email.trim();
  if (!email) errors.email = "Enter the email address you sign in with.";
  else if (!EMAIL_PATTERN.test(email))
    errors.email = "Enter an email address in the format name@example.com.";
  return errors;
}

const inputClass =
  "h-11 w-full min-w-0 rounded-md border border-input bg-background px-3 text-base shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive motion-reduce:transition-none dark:bg-input/30";

// The final, irreversible action. Text uses the background token so it reads
// on the destructive fill in light and dark themes alike.
const destructiveSolid =
  "h-11 w-full bg-destructive px-5 text-background hover:bg-destructive/90 sm:w-auto";
// Opens the confirmation; outlined so it never competes with Save.
const destructiveOutline =
  "h-11 w-full border-destructive px-5 text-destructive hover:bg-destructive/10 hover:text-destructive sm:w-auto dark:border-destructive dark:hover:bg-destructive/10";

function StatusIcon({ kind }: { kind: "ok" | "error" }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className="mt-0.5 size-4 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {kind === "ok" ? (
        <path d="M3.5 8.5l3 3 6-7" />
      ) : (
        <>
          <circle cx="8" cy="8" r="6.25" />
          <path d="M8 4.75v4M8 11.25v.01" />
        </>
      )}
    </svg>
  );
}

export function SettingsAccount({
  headingLevel = 1,
  title = "Account",
  description,
  productName,
  profile,
  nameHint = "Shown to people you share with.",
  emailHint = "You sign in with this address. A new address is used once you confirm it.",
  onSaveProfile,
  saveErrorMessage = "Not saved. Nothing on your account changed and your edits are still here. Try again.",
  exportHref,
  exportLabel = "Download my data",
  exportDescription,
  deletes,
  keeps,
  onDeleteAccount,
  deleteErrorMessage = "Your account wasn’t deleted. Nothing was removed. Try again, or contact support if it keeps failing.",
  deletionStartedMessage = "Deletion has started. You’ll be signed out shortly.",
  initialState = {},
  className,
  ...props
}: SettingsAccountProps) {
  const id = React.useId();
  const Title = `h${headingLevel}` as const;
  const Section = `h${headingLevel + 1}` as "h2" | "h3";
  const Sub = `h${headingLevel + 2}` as "h3" | "h4";

  // Profile form
  const [saved, setSaved] = React.useState<ProfileValues>(profile);
  const [values, setValues] = React.useState<ProfileValues>(
    initialState.values ?? profile,
  );
  const [showErrors, setShowErrors] = React.useState(
    initialState.showErrors ?? false,
  );
  const [saveStatus, setSaveStatus] = React.useState<SaveStatus>(
    initialState.save ?? "idle",
  );
  const [pendingEmail, setPendingEmail] = React.useState<string | null>(null);
  const errors = showErrors ? validate(values) : {};
  const errorCount = Object.keys(errors).length;
  const fieldRefs = {
    name: React.useRef<HTMLInputElement>(null),
    email: React.useRef<HTMLInputElement>(null),
  };

  // Deletion
  const dialogRef = React.useRef<HTMLDialogElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const cancelRef = React.useRef<HTMLButtonElement>(null);
  const confirmRef = React.useRef<HTMLInputElement>(null);
  const startedRef = React.useRef<HTMLDivElement>(null);
  const [confirmText, setConfirmText] = React.useState(
    initialState.confirmText ?? "",
  );
  const [confirmError, setConfirmError] = React.useState<string | null>(null);
  const [deleteStatus, setDeleteStatus] = React.useState<DeleteStatus>(
    initialState.deletionStarted
      ? "started"
      : initialState.deleteError
        ? "error"
        : "idle",
  );
  const deletionStarted = React.useRef(initialState.deletionStarted ?? false);

  function updateField(field: ProfileField, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    if (saveStatus === "saved" || saveStatus === "error") setSaveStatus("idle");
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saveStatus === "saving") return;
    const found = validate(values);
    setShowErrors(true);
    const firstInvalid = (["name", "email"] as const).find((f) => found[f]);
    if (firstInvalid) {
      setSaveStatus("idle");
      fieldRefs[firstInvalid].current?.focus();
      return;
    }
    const next = { name: values.name.trim(), email: values.email.trim() };
    setSaveStatus("saving");
    try {
      await onSaveProfile?.(next);
      setPendingEmail(
        next.email.toLowerCase() !== saved.email.toLowerCase()
          ? next.email
          : null,
      );
      setSaved(next);
      setValues(next);
      setSaveStatus("saved");
    } catch {
      setSaveStatus("error");
    }
  }

  const openDialog = React.useCallback(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
    // Cancel takes focus, so Enter or Space never confirms by accident.
    cancelRef.current?.focus();
  }, []);

  // initialState describes where the UI starts, so it is read once.
  const openOnMount = React.useRef(initialState.confirmOpen ?? false);
  React.useEffect(() => {
    if (openOnMount.current) openDialog();
  }, [openDialog]);

  function handleDialogClose() {
    if (deletionStarted.current) {
      startedRef.current?.focus();
      return;
    }
    setConfirmText("");
    setConfirmError(null);
    setDeleteStatus("idle");
    triggerRef.current?.focus();
  }

  // The account email is typed to confirm; case and outer spaces don't count.
  const confirmPhrase = profile.email;
  const confirmMatches =
    confirmText.trim().toLowerCase() === confirmPhrase.toLowerCase();

  async function handleDelete(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (deleteStatus === "deleting") return;
    if (!confirmMatches) {
      setConfirmError(
        confirmText.trim()
          ? `That doesn’t match. Type ${confirmPhrase} exactly.`
          : `Type ${confirmPhrase} to confirm.`,
      );
      confirmRef.current?.focus();
      return;
    }
    setConfirmError(null);
    setDeleteStatus("deleting");
    try {
      await onDeleteAccount?.();
      deletionStarted.current = true;
      setDeleteStatus("started");
      const dialog = dialogRef.current;
      // Closing fires onClose, which moves focus. If the dialog was already
      // closed while the request ran, no close event follows, so move focus
      // here: the delete button it would have returned to is gone.
      if (dialog?.open) dialog.close();
      else startedRef.current?.focus();
    } catch {
      setDeleteStatus("error");
    }
  }

  const ids = {
    title: `${id}-title`,
    profile: `${id}-profile`,
    danger: `${id}-danger`,
    exportHeading: `${id}-export`,
    deleteHeading: `${id}-delete`,
    nameHint: `${id}-name-hint`,
    nameError: `${id}-name-error`,
    emailHint: `${id}-email-hint`,
    emailError: `${id}-email-error`,
    dialogTitle: `${id}-dialog-title`,
    dialogDescription: `${id}-dialog-description`,
    confirmHint: `${id}-confirm-hint`,
    confirmError: `${id}-confirm-error`,
  };

  const fields: {
    key: ProfileField;
    label: string;
    type: "text" | "email";
    autoComplete: string;
    hint: React.ReactNode;
  }[] = [
    {
      key: "name",
      label: "Name",
      type: "text",
      autoComplete: "name",
      hint: nameHint,
    },
    {
      key: "email",
      label: "Email address",
      type: "email",
      autoComplete: "email",
      hint: emailHint,
    },
  ];

  const sectionGrid =
    "grid gap-6 border-t border-border py-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-12";
  const sectionHeading = "text-lg leading-snug font-semibold tracking-tight";
  const sectionText =
    "mt-2 max-w-prose text-sm leading-relaxed text-pretty text-muted-foreground";

  let saveMessage: React.ReactNode = null;
  if (saveStatus === "saving") saveMessage = "Saving…";
  else if (saveStatus === "saved")
    saveMessage = pendingEmail ? (
      <>
        Saved. We sent a confirmation link to {pendingEmail}. Until you open it,
        you sign in with your previous address.
      </>
    ) : (
      "Saved. Your profile is up to date."
    );
  else if (saveStatus === "error") saveMessage = saveErrorMessage;
  else if (errorCount)
    saveMessage = `Not saved. Fix the ${
      errorCount === 1 ? "field" : `${errorCount} fields`
    } marked above.`;
  const saveIsProblem = saveStatus === "error" || errorCount > 0;

  return (
    <div
      data-slot="settings-account"
      className={cn("bg-background text-foreground", className)}
      {...props}
    >
      <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
        <header className="pb-8">
          <Title
            id={ids.title}
            className="text-3xl leading-tight font-semibold tracking-tight text-balance"
          >
            {title}
          </Title>
          {description ? (
            <p className="mt-3 max-w-prose text-base leading-relaxed text-pretty text-muted-foreground">
              {description}
            </p>
          ) : null}
        </header>

        <section aria-labelledby={ids.profile} className={sectionGrid}>
          <div>
            <Section id={ids.profile} className={sectionHeading}>
              Profile
            </Section>
            <p className={sectionText}>
              How you appear to other members, and where we reach you.
            </p>
          </div>

          <form noValidate onSubmit={handleSave} className="max-w-md">
            <div className="flex flex-col gap-4">
              {fields.map((field) => {
                const error = errors[field.key];
                const hintId = ids[`${field.key}Hint` as const];
                const errorId = ids[`${field.key}Error` as const];
                return (
                  <div key={field.key}>
                    <label
                      htmlFor={`${id}-${field.key}`}
                      className="text-sm font-medium"
                    >
                      {field.label}
                    </label>
                    <p
                      id={hintId}
                      className="mt-1 text-sm leading-snug text-muted-foreground"
                    >
                      {field.hint}
                    </p>
                    <input
                      ref={fieldRefs[field.key]}
                      id={`${id}-${field.key}`}
                      name={field.key}
                      type={field.type}
                      autoComplete={field.autoComplete}
                      spellCheck={false}
                      required
                      value={values[field.key]}
                      onChange={(event) =>
                        updateField(field.key, event.target.value)
                      }
                      aria-invalid={error ? true : undefined}
                      aria-describedby={error ? `${errorId} ${hintId}` : hintId}
                      className={cn(inputClass, "mt-2")}
                    />
                    {/* Reserved so an error never pushes the form down. */}
                    <p
                      id={errorId}
                      className="mt-1.5 flex min-h-5 gap-1.5 text-sm leading-5 font-medium text-destructive"
                    >
                      {error ? (
                        <>
                          <StatusIcon kind="error" />
                          <span>{error}</span>
                        </>
                      ) : null}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
              <Button
                type="submit"
                size="lg"
                aria-disabled={saveStatus === "saving" ? true : undefined}
                className="h-11 w-full px-5 sm:w-auto"
              >
                {saveStatus === "saving" ? "Saving…" : "Save changes"}
              </Button>
              <p
                role="status"
                className={cn(
                  "flex min-h-11 gap-1.5 text-sm leading-5 sm:pt-3",
                  saveIsProblem ? "font-medium text-destructive" : "",
                )}
              >
                {saveMessage ? (
                  <>
                    {saveStatus === "saved" || saveIsProblem ? (
                      <StatusIcon kind={saveIsProblem ? "error" : "ok"} />
                    ) : null}
                    <span>{saveMessage}</span>
                  </>
                ) : null}
              </p>
            </div>
          </form>
        </section>

        <section aria-labelledby={ids.danger} className={sectionGrid}>
          <div>
            <Section id={ids.danger} className={sectionHeading}>
              Delete account
            </Section>
            <p className={sectionText}>
              Deleting your account is permanent. Download a copy of your data
              first.
            </p>
          </div>

          <div className="rounded-lg border border-destructive/50 bg-card text-card-foreground">
            <div className="p-5 sm:p-6">
              <Sub
                id={ids.exportHeading}
                className="text-base leading-snug font-semibold"
              >
                Keep a copy first
              </Sub>
              {exportDescription ? (
                <p className={sectionText}>{exportDescription}</p>
              ) : null}
              <a
                href={exportHref}
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "mt-4 h-11 w-full px-5 sm:w-auto",
                )}
              >
                {exportLabel}
              </a>
            </div>

            <div className="border-t border-border p-5 sm:p-6">
              <Sub
                id={ids.deleteHeading}
                className="text-base leading-snug font-semibold"
              >
                What deleting removes
              </Sub>
              <ul className="mt-3 max-w-prose list-disc space-y-1.5 pl-5 text-sm leading-relaxed">
                {deletes.map((line, index) => (
                  <li key={index}>{line}</li>
                ))}
              </ul>
              {keeps?.length ? (
                <>
                  <p className="mt-4 text-sm font-medium">What stays</p>
                  <ul className="mt-2 max-w-prose list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground">
                    {keeps.map((line, index) => (
                      <li key={index}>{line}</li>
                    ))}
                  </ul>
                </>
              ) : null}
              <p className="mt-4 text-sm font-semibold">
                This can’t be undone.
              </p>

              <div
                ref={startedRef}
                tabIndex={-1}
                role="status"
                className="mt-4 rounded-sm text-sm leading-relaxed outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                {deleteStatus === "started" ? (
                  <p className="flex gap-1.5 font-medium">
                    <StatusIcon kind="ok" />
                    <span>{deletionStartedMessage}</span>
                  </p>
                ) : null}
              </div>
              {deleteStatus === "started" ? null : (
                <Button
                  ref={triggerRef}
                  type="button"
                  variant="outline"
                  size="lg"
                  aria-haspopup="dialog"
                  onClick={openDialog}
                  className={destructiveOutline}
                >
                  Delete account…
                </Button>
              )}
            </div>
          </div>
        </section>
      </div>

      <dialog
        ref={dialogRef}
        aria-labelledby={ids.dialogTitle}
        aria-describedby={ids.dialogDescription}
        onClose={handleDialogClose}
        onCancel={(event) => {
          // Keep the dialog open on Escape while the request is running.
          if (deleteStatus === "deleting") event.preventDefault();
        }}
        className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-lg border border-border bg-card p-0 text-card-foreground shadow-lg backdrop:bg-background/80"
      >
        <form noValidate onSubmit={handleDelete} className="p-5 sm:p-6">
          <h2
            id={ids.dialogTitle}
            className="text-lg leading-snug font-semibold tracking-tight text-balance"
          >
            Delete your {productName} account?
          </h2>
          <div
            id={ids.dialogDescription}
            className="mt-3 text-sm leading-relaxed"
          >
            <p>This permanently removes:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {deletes.map((line, index) => (
                <li key={index}>{line}</li>
              ))}
            </ul>
            <p className="mt-3 font-semibold">This can’t be undone.</p>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            No copy yet?{" "}
            <a
              href={exportHref}
              className="rounded-sm font-medium text-foreground underline underline-offset-4 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              {exportLabel}
            </a>{" "}
            before you continue.
          </p>

          <div className="mt-5">
            <label
              htmlFor={`${id}-confirm`}
              className="text-sm font-medium break-words"
            >
              Type <span className="font-semibold">{confirmPhrase}</span> to
              confirm
            </label>
            <p
              id={ids.confirmHint}
              className="mt-1 text-sm leading-snug text-muted-foreground"
            >
              Your account’s email address.
            </p>
            <input
              ref={confirmRef}
              id={`${id}-confirm`}
              name="confirm"
              type="text"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              value={confirmText}
              onChange={(event) => {
                setConfirmText(event.target.value);
                if (confirmError) setConfirmError(null);
              }}
              aria-invalid={confirmError ? true : undefined}
              aria-describedby={
                confirmError
                  ? `${ids.confirmError} ${ids.confirmHint}`
                  : ids.confirmHint
              }
              className={cn(inputClass, "mt-2")}
            />
            <p
              id={ids.confirmError}
              className="mt-1.5 flex min-h-5 gap-1.5 text-sm leading-5 font-medium break-words text-destructive"
            >
              {confirmError ? (
                <>
                  <StatusIcon kind="error" />
                  <span className="min-w-0">{confirmError}</span>
                </>
              ) : null}
            </p>
          </div>

          <p
            role="status"
            className="mt-2 flex min-h-10 gap-1.5 text-sm leading-5 font-medium text-destructive"
          >
            {deleteStatus === "error" ? (
              <>
                <StatusIcon kind="error" />
                <span>{deleteErrorMessage}</span>
              </>
            ) : deleteStatus === "deleting" ? (
              <span className="text-foreground">Deleting your account…</span>
            ) : null}
          </p>

          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button
              ref={cancelRef}
              type="button"
              variant="outline"
              size="lg"
              onClick={() => dialogRef.current?.close()}
              className="h-11 w-full px-5 sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="lg"
              aria-disabled={deleteStatus === "deleting" ? true : undefined}
              className={destructiveSolid}
            >
              {deleteStatus === "deleting"
                ? "Deleting…"
                : deleteStatus === "error"
                  ? "Try deleting again"
                  : "Delete my account"}
            </Button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
