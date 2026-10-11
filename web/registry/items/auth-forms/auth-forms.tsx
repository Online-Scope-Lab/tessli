"use client";

import * as React from "react";

import { cn } from "@/registry/shadcn/lib/utils";
import { Button } from "@/registry/shadcn/ui/button";

export type AuthMode = "sign-in" | "sign-up";

export type AuthValues = {
  /** Sign-up only. */
  name: string;
  email: string;
  password: string;
};

type AuthField = keyof AuthValues;
type AuthErrors = Partial<Record<AuthField, string>>;
type AuthStatus =
  "idle" | "submitting" | "failed" | "signed-in" | "check-email";

export type AuthFormsProps = Omit<
  React.ComponentProps<"div">,
  "title" | "onSubmit"
> & {
  mode: AuthMode;
  /**
   * 1 when this is the page's title (the default). Use 2 inside a layout that
   * already has an h1.
   */
  headingLevel?: 1 | 2;
  /** Shown as text at the top of the page, linked to homeHref if given. */
  productName: string;
  homeHref?: string;
  title?: React.ReactNode;
  /** One sentence under the title. Optional. */
  description?: React.ReactNode;
  /**
   * The route to the other form, as a link: "No account yet?" + "Create an
   * account" on sign-in, "Already have an account?" + "Sign in" on sign-up.
   */
  switchMode: { prompt: React.ReactNode; label: string; href: string };
  /** Sign-in only: where people reset a forgotten password. */
  forgotPasswordHref?: string;
  /** Sign-up only. Length is the one rule; there are no composition rules. */
  passwordMinLength?: number;
  nameHint?: React.ReactNode;
  emailHint?: React.ReactNode;
  /** Sign-up only: the terms line above the button, with links to both. */
  legal?: React.ReactNode;
  /** Shown under the form, outside it (for example "demo only"). */
  note?: React.ReactNode;
  /**
   * Called with valid, trimmed values. Throw or reject to show the failure
   * message. Without it, submitting only shows the progress state briefly and
   * then the success state, so the pattern can be previewed; nothing is sent.
   */
  onSubmit?: (values: AuthValues, mode: AuthMode) => void | Promise<void>;
  /** Said when the request fails: what failed, what is safe, what to do. */
  failureMessage?: React.ReactNode;
  /** Sign-in success, shown while the app opens. */
  signedInMessage?: React.ReactNode;
  /** Sign-up success: one more sentence after "We sent a link to …". */
  checkEmailDetail?: React.ReactNode;
  /** The UI state to start in. For previews and tests. */
  initialState?: {
    values?: Partial<AuthValues>;
    /** Fields that have been left (blurred) with a value. */
    blurred?: AuthField[];
    /** The form was submitted once, so empty required fields show errors. */
    submitted?: boolean;
    status?: Exclude<AuthStatus, "idle">;
    showPassword?: boolean;
  };
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;
const NAME_MAX = 60;
const PREVIEW_DELAY_MS = 900;

const FIELDS: Record<AuthMode, AuthField[]> = {
  "sign-in": ["email", "password"],
  "sign-up": ["name", "email", "password"],
};

function validate(
  values: AuthValues,
  mode: AuthMode,
  passwordMinLength: number,
): AuthErrors {
  const errors: AuthErrors = {};
  if (mode === "sign-up") {
    const name = values.name.trim();
    if (!name) errors.name = "Enter your name.";
    else if (name.length > NAME_MAX)
      errors.name = `Use ${NAME_MAX} characters or fewer.`;
  }
  const email = values.email.trim();
  if (!email) errors.email = "Enter your email address.";
  else if (!EMAIL_PATTERN.test(email))
    errors.email = "Enter an email address in the format name@example.com.";
  // Sign-in checks only that a password was typed: the sign-up rules may have
  // changed since the account was made, and the server decides if it matches.
  const password = values.password;
  if (mode === "sign-in") {
    if (!password) errors.password = "Enter your password.";
  } else if (!password) {
    errors.password = `Create a password of at least ${passwordMinLength} characters.`;
  } else if (password.length < passwordMinLength) {
    errors.password = `Use at least ${passwordMinLength} characters. This one has ${password.length}.`;
  }
  return errors;
}

function listFields(fields: AuthField[]) {
  if (fields.length <= 1) return fields.join("");
  return `${fields.slice(0, -1).join(", ")} and ${fields[fields.length - 1]}`;
}

const inputClass =
  "h-11 w-full min-w-0 rounded-md border border-input bg-background px-3 text-base shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive motion-reduce:transition-none dark:bg-input/30";

const linkClass =
  "rounded-sm font-medium text-foreground underline underline-offset-4 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none";

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

function Spinner() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className="size-4 animate-spin motion-reduce:animate-none"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <circle cx="8" cy="8" r="6.25" className="opacity-30" />
      <path d="M14.25 8A6.25 6.25 0 0 0 8 1.75" />
    </svg>
  );
}

export function AuthForms({
  mode,
  headingLevel = 1,
  productName,
  homeHref,
  title,
  description,
  switchMode,
  forgotPasswordHref,
  passwordMinLength = 12,
  nameHint = "Shown to people you share with.",
  emailHint = "We’ll email you a link to confirm it.",
  legal,
  note,
  onSubmit,
  failureMessage,
  signedInMessage = "Signed in. Opening your workspace…",
  checkEmailDetail = "Open it to finish creating your account. The link works for 24 hours.",
  initialState = {},
  className,
  ...props
}: AuthFormsProps) {
  const id = React.useId();
  const Title = `h${headingLevel}` as "h1" | "h2";
  const isSignUp = mode === "sign-up";
  const fields = FIELDS[mode];

  const [values, setValues] = React.useState<AuthValues>({
    name: "",
    email: "",
    password: "",
    ...initialState.values,
  });
  const [blurred, setBlurred] = React.useState<ReadonlySet<AuthField>>(
    () => new Set(initialState.blurred ?? []),
  );
  const [submitted, setSubmitted] = React.useState(
    initialState.submitted ?? false,
  );
  const [status, setStatus] = React.useState<AuthStatus>(
    initialState.status ?? "idle",
  );
  const [showPassword, setShowPassword] = React.useState(
    initialState.showPassword ?? false,
  );

  const fieldRefs = {
    name: React.useRef<HTMLInputElement>(null),
    email: React.useRef<HTMLInputElement>(null),
    password: React.useRef<HTMLInputElement>(null),
  };
  const titleRef = React.useRef<HTMLHeadingElement>(null);
  const moveFocusToTitle = React.useRef(false);
  const mounted = React.useRef(true);
  React.useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // When the form is replaced by "Check your email", focus follows the new
  // heading so keyboard and screen-reader users land on the result.
  React.useEffect(() => {
    if (moveFocusToTitle.current) {
      moveFocusToTitle.current = false;
      titleRef.current?.focus();
    }
  }, [status]);

  // Errors appear for a field once it has been left with a value, or for
  // every field after a submit. Once shown, an error updates as people type,
  // so it disappears as soon as the value is fixed.
  const allErrors = validate(values, mode, passwordMinLength);
  const errors: AuthErrors = {};
  for (const field of fields) {
    if (allErrors[field] && (submitted || blurred.has(field))) {
      errors[field] = allErrors[field];
    }
  }
  const invalidFields = fields.filter((field) => errors[field]);

  function updateField(field: AuthField, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    if (status === "failed" || status === "signed-in") setStatus("idle");
  }

  function handleBlur(field: AuthField) {
    if (!values[field].trim() || blurred.has(field)) return;
    setBlurred((current) => new Set(current).add(field));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "submitting") return;
    setSubmitted(true);
    const firstInvalid = fields.find((field) => allErrors[field]);
    if (firstInvalid) {
      setStatus("idle");
      fieldRefs[firstInvalid].current?.focus();
      return;
    }
    const next: AuthValues = {
      name: values.name.trim(),
      email: values.email.trim(),
      password: values.password,
    };
    setStatus("submitting");
    try {
      if (onSubmit) await onSubmit(next, mode);
      else
        await new Promise((resolve) => setTimeout(resolve, PREVIEW_DELAY_MS));
      if (!mounted.current) return;
      if (isSignUp) moveFocusToTitle.current = true;
      setStatus(isSignUp ? "check-email" : "signed-in");
    } catch {
      if (mounted.current) setStatus("failed");
    }
  }

  function handleDifferentEmail() {
    setStatus("idle");
    setSubmitted(false);
    // Wait for the form to render again, then put people in the email field.
    requestAnimationFrame(() => fieldRefs.email.current?.select());
  }

  const ids = {
    title: `${id}-title`,
    description: `${id}-description`,
    status: `${id}-status`,
  };

  const defaultFailure = isSignUp ? (
    <>
      Your account wasn’t created and nothing was saved. Your details are still
      in the form. Try again in a moment.
    </>
  ) : (
    <>
      You’re not signed in. The email or password is wrong; for your security we
      don’t say which. Check both and try again
      {forgotPasswordHref ? (
        <>
          , or{" "}
          <a href={forgotPasswordHref} className={linkClass}>
            reset your password
          </a>
        </>
      ) : null}
      .
    </>
  );

  const submitting = status === "submitting";
  const submitLabel = isSignUp
    ? submitting
      ? "Creating account…"
      : "Create account"
    : submitting
      ? "Signing in…"
      : "Sign in";

  const fieldConfig: Record<
    AuthField,
    {
      label: string;
      type: "text" | "email" | "password";
      autoComplete: string;
      hint?: React.ReactNode;
    }
  > = {
    name: {
      label: "Name",
      type: "text",
      autoComplete: "name",
      hint: nameHint,
    },
    email: {
      label: "Email",
      type: "email",
      autoComplete: isSignUp ? "email" : "username",
      hint: isSignUp ? emailHint : undefined,
    },
    password: {
      label: "Password",
      type: showPassword ? "text" : "password",
      autoComplete: isSignUp ? "new-password" : "current-password",
      hint: isSignUp
        ? `At least ${passwordMinLength} characters. Spaces are fine.`
        : undefined,
    },
  };

  function renderField(field: AuthField) {
    const config = fieldConfig[field];
    const inputId = `${id}-${field}`;
    const messageId = `${id}-${field}-message`;
    const error = errors[field];
    const message = error ?? config.hint;
    const isPassword = field === "password";
    return (
      <div key={field}>
        {/* A 44px row, so the reset link beside the label is a full target. */}
        <div className="flex min-h-11 items-end justify-between gap-4">
          <label
            htmlFor={inputId}
            className="pb-2 text-sm leading-5 font-medium"
          >
            {config.label}
          </label>
          {isPassword && !isSignUp && forgotPasswordHref ? (
            <a
              href={forgotPasswordHref}
              className={cn(
                linkClass,
                "inline-flex h-11 items-end pb-2 text-sm leading-5 text-muted-foreground hover:text-foreground",
              )}
            >
              Forgot password?
            </a>
          ) : null}
        </div>
        <div className="relative">
          <input
            ref={fieldRefs[field]}
            id={inputId}
            name={field}
            type={config.type}
            autoComplete={config.autoComplete}
            inputMode={field === "email" ? "email" : undefined}
            autoCapitalize={field === "name" ? "words" : "none"}
            spellCheck={false}
            required
            value={values[field]}
            onChange={(event) => updateField(field, event.target.value)}
            onBlur={() => handleBlur(field)}
            aria-invalid={error ? true : undefined}
            aria-describedby={message ? messageId : undefined}
            className={cn(inputClass, isPassword && "pr-20")}
          />
          {isPassword ? (
            <button
              type="button"
              aria-controls={inputId}
              onClick={() => setShowPassword((shown) => !shown)}
              className="absolute inset-y-0 right-0 inline-flex min-w-16 items-center justify-center rounded-r-md px-3 text-sm font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              {showPassword ? "Hide" : "Show"}
              <span className="sr-only"> password</span>
            </button>
          ) : null}
        </div>
        {/* Reserved: a hint, or the error that replaces it, never moves the form. */}
        <p
          id={messageId}
          className={cn(
            "mt-1.5 flex min-h-5 gap-1.5 text-sm leading-5",
            error ? "font-medium text-destructive" : "text-muted-foreground",
          )}
        >
          {error ? <StatusIcon kind="error" /> : null}
          {message ? <span>{message}</span> : null}
        </p>
      </div>
    );
  }

  let statusMessage: React.ReactNode = null;
  if (status === "submitting") {
    statusMessage = (
      <span className="sr-only">
        {isSignUp ? "Creating your account…" : "Signing in…"}
      </span>
    );
  } else if (status === "failed") {
    statusMessage = (
      <div className="flex gap-2 rounded-md border border-destructive px-3 py-2.5 text-sm leading-relaxed text-foreground">
        <span className="flex shrink-0 text-destructive">
          <StatusIcon kind="error" />
        </span>
        <p>{failureMessage ?? defaultFailure}</p>
      </div>
    );
  } else if (status === "signed-in") {
    statusMessage = (
      <p className="flex gap-1.5 text-sm leading-5 font-medium">
        <StatusIcon kind="ok" />
        <span>{signedInMessage}</span>
      </p>
    );
  } else if (submitted && invalidFields.length) {
    statusMessage = (
      <p className="flex gap-1.5 text-sm leading-5 font-medium text-destructive">
        <StatusIcon kind="error" />
        <span>
          {isSignUp ? "Account not created. " : "Not signed in. "}
          Fix the {listFields(invalidFields)}{" "}
          {invalidFields.length === 1 ? "field" : "fields"} above.
        </span>
      </p>
    );
  }

  const checkEmail = status === "check-email";

  return (
    <div
      data-slot="auth-forms"
      data-mode={mode}
      className={cn(
        "flex min-h-svh flex-col bg-background text-foreground",
        className,
      )}
      {...props}
    >
      <header className="mx-auto w-full max-w-6xl px-4 pt-2 sm:px-6 lg:px-8">
        {homeHref ? (
          <a
            href={homeHref}
            className={cn(
              linkClass,
              "inline-flex min-h-11 items-center text-base font-semibold no-underline",
            )}
          >
            {productName}
          </a>
        ) : (
          <p className="flex min-h-11 items-center text-base font-semibold">
            {productName}
          </p>
        )}
      </header>

      <div className="flex flex-1 justify-center px-4 pt-6 pb-12 sm:px-6 sm:pt-10 lg:pt-16">
        <div className="w-full max-w-md">
          {/* A bordered panel from 640px; on phones the form is the page. */}
          <div className="sm:rounded-lg sm:border sm:border-border sm:bg-card sm:p-8 sm:text-card-foreground">
            <Title
              ref={titleRef}
              id={ids.title}
              tabIndex={-1}
              className="text-2xl leading-tight font-semibold tracking-tight text-balance outline-none sm:text-3xl"
            >
              {checkEmail
                ? "Check your email"
                : (title ?? (isSignUp ? "Create your account" : "Sign in"))}
            </Title>

            {checkEmail ? (
              <div className="mt-3 text-base leading-relaxed text-pretty">
                <p>
                  We sent a link to{" "}
                  <strong className="font-semibold break-words">
                    {values.email.trim()}
                  </strong>
                  . {checkEmailDetail}
                </p>
                <p className="mt-3 text-sm text-muted-foreground">
                  No email after a few minutes? Check your spam folder, or go
                  back and check the address.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={handleDifferentEmail}
                  className="mt-6 h-11 w-full sm:w-auto"
                >
                  Use a different email
                </Button>
              </div>
            ) : (
              <>
                {description ? (
                  <p
                    id={ids.description}
                    className="mt-3 text-base leading-relaxed text-pretty text-muted-foreground"
                  >
                    {description}
                  </p>
                ) : null}

                <form
                  noValidate
                  onSubmit={handleSubmit}
                  aria-labelledby={ids.title}
                  aria-describedby={description ? ids.description : undefined}
                  className="mt-4"
                >
                  {fields.map(renderField)}

                  {isSignUp && legal ? (
                    <p className="mt-2 text-sm leading-relaxed text-pretty text-muted-foreground">
                      {legal}
                    </p>
                  ) : null}

                  <Button
                    type="submit"
                    size="lg"
                    aria-disabled={submitting || undefined}
                    className="mt-4 h-11 w-full"
                  >
                    {submitting ? <Spinner /> : null}
                    {submitLabel}
                  </Button>

                  {/* Reserved and below the button, so nothing above it moves. */}
                  <div
                    id={ids.status}
                    role="status"
                    aria-live="polite"
                    className="mt-3 min-h-5"
                  >
                    {statusMessage}
                  </div>
                </form>

                <p className="mt-6 border-t border-border pt-4 text-sm leading-relaxed text-muted-foreground">
                  {switchMode.prompt}{" "}
                  <a
                    href={switchMode.href}
                    className={cn(
                      linkClass,
                      "inline-flex min-h-11 items-center",
                    )}
                  >
                    {switchMode.label}
                  </a>
                </p>
              </>
            )}
          </div>

          {note ? (
            <div className="mt-6 text-sm leading-relaxed text-pretty text-muted-foreground sm:px-8">
              {note}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
