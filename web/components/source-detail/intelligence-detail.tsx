import Link from "next/link";

import { Tag } from "@/components/ui/tag";
import type { SourceProfile } from "@/lib/source-profiles";
import type { SimilarSourceMatch } from "@/lib/similar-sources";

import styles from "./intelligence-detail.module.css";

function label(value: string) {
  return value
    .split("-")
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

function accessRequirement(auth: "none" | "user" | "unknown") {
  if (auth === "none") return "No user sign-in recorded";
  if (auth === "user") return "Uses your own account or credentials";
  return "Access requirements are not recorded";
}

function GuideList({
  items,
  empty,
}: Readonly<{
  items: readonly string[];
  empty: string;
}>) {
  return items.length > 0 ? (
    <ul className={styles.guideList}>
      {items.map((item) => (
        <li key={item}>{label(item)}</li>
      ))}
    </ul>
  ) : (
    <p className={styles.emptyNote}>{empty}</p>
  );
}

function GuideSection({
  title,
  children,
}: Readonly<{
  title: string;
  children: React.ReactNode;
}>) {
  const id = title.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-");
  return (
    <section className={styles.section} aria-labelledby={id}>
      <h2 id={id}>{title}</h2>
      {children}
    </section>
  );
}

export function IntelligenceDetail({
  profile,
  similar,
}: Readonly<{
  profile: SourceProfile;
  similar: readonly SimilarSourceMatch[];
}>) {
  const exploration = [
    ...new Set([...profile.capabilities, ...profile.contentObjects]),
  ];
  const compatibility = [
    ...new Set([...profile.frameworks, ...profile.platforms]),
  ];

  return (
    <>
      <GuideSection title="What to explore">
        <GuideList
          items={exploration}
          empty="No structured exploration points are recorded for this source. Start with the canonical provider page."
        />
      </GuideSection>

      <GuideSection title="How to access it">
        <ul className={styles.accessRoutes}>
          {profile.accessRoutes.map((route) => (
            <li key={`${route.kind}-${route.url ?? route.agentAction}`}>
              <div>
                <strong>{label(route.kind)}</strong>
                {route.preferred ? (
                  <Tag tone="signal">Preferred route</Tag>
                ) : null}
              </div>
              <p>{route.agentAction}</p>
              <p className={styles.routeMeta}>
                {accessRequirement(route.auth)}
              </p>
              {route.url ? (
                <a href={route.url} rel="noopener noreferrer" target="_blank">
                  Open recorded {label(route.kind)} ↗
                </a>
              ) : null}
            </li>
          ))}
        </ul>
      </GuideSection>

      {compatibility.length > 0 ? (
        <GuideSection title="Works with">
          <GuideList items={compatibility} empty="" />
        </GuideSection>
      ) : null}

      <GuideSection title="Important limitations">
        <GuideList
          items={profile.limitations}
          empty="No structured limitation is recorded. Confirm current availability, pricing, and terms with the source before relying on it."
        />
      </GuideSection>

      <GuideSection title="Consider instead">
        {similar.length > 0 ? (
          <ul className={styles.alternatives}>
            {similar.map((match) => (
              <li key={match.profile.id}>
                <Link href={`/resources/${match.profile.slug}`}>
                  {match.profile.name}
                </Link>
                <p>{match.differentiator}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.emptyNote}>
            No differentiated alternatives are recorded for this source yet.
          </p>
        )}
      </GuideSection>

      <details className={styles.diagnostics}>
        <summary>Source details</summary>
        <div className={styles.diagnosticsBody}>
          <dl>
            <div>
              <dt>Domain</dt>
              <dd>{profile.domain}</dd>
            </div>
            <div>
              <dt>Source type</dt>
              <dd>{label(profile.sourceType)}</dd>
            </div>
            <div>
              <dt>Access model</dt>
              <dd>{label(profile.accessModel.access)}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{label(profile.status)}</dd>
            </div>
          </dl>

          <p className={styles.emptyNote}>
            This page does not imply live provider verification.
          </p>
        </div>
      </details>
    </>
  );
}
