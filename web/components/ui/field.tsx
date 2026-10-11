import type { ComponentPropsWithoutRef } from "react";

import styles from "./field.module.css";

type FieldBaseProps = Readonly<{
  /** Required so the label, hint, and error can be wired without client state. */
  id: string;
  label: string;
  hint?: string;
  error?: string;
  className?: string;
}>;

type InputFieldProps = FieldBaseProps &
  Omit<ComponentPropsWithoutRef<"input">, "id" | "className"> & {
    multiline?: false;
  };

type TextareaFieldProps = FieldBaseProps &
  Omit<ComponentPropsWithoutRef<"textarea">, "id" | "className"> & {
    multiline: true;
  };

export type FieldProps = InputFieldProps | TextareaFieldProps;

export function Field({
  id,
  label,
  hint,
  error,
  className,
  ...control
}: FieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  const wiring = {
    "aria-describedby": describedBy,
    "aria-invalid": error ? true : undefined,
    className: styles.control,
    id,
  } as const;
  const { multiline, ...attributes } = control;

  return (
    <div className={[styles.field, className].filter(Boolean).join(" ")}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      {multiline ? (
        <textarea
          {...(attributes as ComponentPropsWithoutRef<"textarea">)}
          {...wiring}
        />
      ) : (
        <input
          {...(attributes as ComponentPropsWithoutRef<"input">)}
          {...wiring}
        />
      )}
      {hint ? (
        <p className={styles.hint} id={hintId}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p className={styles.error} id={errorId}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
