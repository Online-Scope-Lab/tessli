import { Button } from "@/components/ui/button";
import { repositoryUrl } from "@/lib/repository";

import styles from "./route-placeholder.module.css";

type RoutePlaceholderProps = Readonly<{
  title: string;
  summary: string;
  details: readonly string[];
}>;

export function RoutePlaceholder({
  title,
  summary,
  details,
}: RoutePlaceholderProps) {
  return (
    <main className={styles.page} id="main-content">
      <div className={`tessli-container ${styles.inner}`}>
        <div className={styles.copy}>
          <h1>{title}</h1>
          <p className={styles.summary}>{summary}</p>
        </div>

        <section aria-labelledby="route-status-title" className={styles.status}>
          <h2 id="route-status-title">What this route does today</h2>
          <ul>
            {details.map((detail) => (
              <li key={detail}>{detail}</li>
            ))}
          </ul>
        </section>

        <div className={styles.actions}>
          <Button href="/">Return home</Button>
          <Button href={repositoryUrl} variant="secondary">
            View the repository
            <span aria-hidden="true">↗</span>
          </Button>
        </div>
      </div>
    </main>
  );
}
