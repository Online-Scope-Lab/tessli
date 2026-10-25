import Link from "next/link";

import { BrandMark } from "@/components/brand-mark/brand-mark";

import { footerGroups } from "./footer-navigation";
import styles from "./site-footer.module.css";

// Owner rule (2026-10-25): every Online Scope Labs product carries this credit,
// a plain link to the product's page on the company site (www host).
const labsCreditUrl = "https://www.onlinescope.in/labs/tessli";

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={`tessli-container ${styles.inner}`}>
        <div className={styles.intro}>
          <Link className={styles.wordmark} href="/" aria-label="Tessli home">
            <BrandMark className={styles.wordmarkMark} />
          </Link>
          <p>
            UI with the reasoning attached: components and sections that explain
            themselves, and a curated directory of design sources.
          </p>
        </div>

        <div className={styles.groups}>
          {footerGroups.map((group) => (
            <nav
              aria-labelledby={group.id}
              className={styles.group}
              key={group.id}
            >
              <h2 id={group.id}>{group.label}</h2>
              <ul>
                {group.links.map((link) => (
                  <li key={link.href}>
                    {link.external ? (
                      <a
                        href={link.href}
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        {link.label}
                        <span
                          className={styles.externalMark}
                          aria-hidden="true"
                        >
                          ↗
                        </span>
                        <span className="sr-only"> (opens in a new tab)</span>
                      </a>
                    ) : (
                      <Link href={link.href}>{link.label}</Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className={styles.footnote}>
          <p>
            Tessli indexes links and limited descriptive metadata. Third-party
            names, trademarks, content, and assets remain the property of their
            respective owners.
          </p>
          <p>
            A public repository does not itself grant reuse rights. Verify the
            original source and its licence before using a resource in
            production.
          </p>
          <p className={styles.credit}>
            Built by <a href={labsCreditUrl}>Online Scope Labs</a>
          </p>
        </div>
      </div>
    </footer>
  );
}
