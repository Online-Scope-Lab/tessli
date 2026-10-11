import styles from "./explore-facts.module.css";

type FactIconName = "resources" | "categories" | "private" | "open";

const facts = [
  {
    icon: "resources",
    label: "Curated resources",
    value: "295",
  },
  {
    icon: "categories",
    label: "Practical categories",
    value: "11",
  },
  {
    icon: "private",
    label: "Needed to browse",
    value: "No account",
  },
  {
    icon: "open",
    label: "Community-built project",
    value: "Open",
  },
] satisfies ReadonlyArray<{
  icon: FactIconName;
  label: string;
  value: string;
}>;

function FactIcon({ name }: { name: FactIconName }) {
  const commonProps = {
    "aria-hidden": true,
    fill: "none",
    focusable: false,
    viewBox: "0 0 24 24",
  } as const;

  if (name === "resources") {
    return (
      <svg {...commonProps}>
        <path d="m4 8 8-4 8 4-8 4-8-4Z" />
        <path d="m4 8 8 4v8l-8-4V8Zm16 0-8 4v8l8-4V8Z" />
      </svg>
    );
  }

  if (name === "categories") {
    return (
      <svg {...commonProps}>
        <rect height="6" rx="1" width="6" x="3" y="3" />
        <rect height="6" rx="1" width="6" x="15" y="3" />
        <rect height="6" rx="1" width="6" x="3" y="15" />
        <rect height="6" rx="1" width="6" x="15" y="15" />
      </svg>
    );
  }

  if (name === "private") {
    return (
      <svg {...commonProps}>
        <rect height="10" rx="2" width="14" x="5" y="10" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v2" />
      </svg>
    );
  }

  return (
    <svg {...commonProps}>
      <path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6 5.6 18.4" />
    </svg>
  );
}

export function ExploreFacts() {
  return (
    <ul aria-label="Tessli catalogue facts" className={styles.facts}>
      {facts.map((fact) => (
        <li className={styles.fact} key={fact.label}>
          <span className={styles.icon}>
            <FactIcon name={fact.icon} />
          </span>
          <span className={styles.copy}>
            <strong>{fact.value}</strong>
            <span>{fact.label}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
