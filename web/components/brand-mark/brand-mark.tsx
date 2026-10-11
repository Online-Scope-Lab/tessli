import styles from "./brand-mark.module.css";

/**
 * The Tessli mark: the T with an orange dot, the same drawing as the favicon
 * (app/icon.svg) and public/brand/tessli-mark.svg, coloured with tokens.
 * Decorative: the link around it carries the accessible name.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      className={className ? `${styles.mark} ${className}` : styles.mark}
      viewBox="0 0 32 32"
      aria-hidden="true"
      focusable="false"
    >
      <rect
        className={styles.tile}
        x="0.5"
        y="0.5"
        width="31"
        height="31"
        rx="6.5"
      />
      <path
        className={styles.letter}
        d="M7 7h18v5.2h-1.1c-.4-2-1.3-2.9-3.4-2.9h-2.6v13.3c0 1.3.6 1.8 2.3 1.9v1h-8.4v-1c1.7-.1 2.3-.6 2.3-1.9V9.3h-2.6c-2.1 0-3 .9-3.4 2.9H7z"
      />
      <circle className={styles.dot} cx="25" cy="23.9" r="2.1" />
    </svg>
  );
}
