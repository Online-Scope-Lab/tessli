import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

import styles from "./button.module.css";

export type ButtonVariant = "primary" | "secondary" | "quiet";

type CommonProps = Readonly<{
  variant?: ButtonVariant;
  className?: string;
  children: ReactNode;
}>;

type ButtonElementProps = CommonProps &
  Omit<ComponentPropsWithoutRef<"button">, "className" | "children"> & {
    href?: undefined;
  };

type LinkElementProps = CommonProps &
  Omit<ComponentPropsWithoutRef<"a">, "className" | "children" | "href"> & {
    /** Internal paths and #fragments render a Next link; http(s) URLs open in a new tab. */
    href: string;
  };

export type ButtonProps = ButtonElementProps | LinkElementProps;

export function buttonClassName(
  variant: ButtonVariant = "primary",
  className?: string,
) {
  return [styles.button, styles[variant], className].filter(Boolean).join(" ");
}

export function Button(props: ButtonProps) {
  if (props.href !== undefined) {
    const { variant, className, children, href, ...rest } = props;
    const classes = buttonClassName(variant, className);

    if (/^https?:\/\//.test(href)) {
      return (
        <a
          {...rest}
          className={classes}
          href={href}
          rel="noopener noreferrer"
          target="_blank"
        >
          {children}
        </a>
      );
    }

    return (
      <Link {...rest} className={classes} href={href}>
        {children}
      </Link>
    );
  }

  const { variant, className, children, type = "button", ...rest } = props;
  return (
    <button
      {...rest}
      className={buttonClassName(variant, className)}
      type={type}
    >
      {children}
    </button>
  );
}
