import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import type {
  ResourceCardAccess,
  ResourceCardData,
} from "@/components/resource-card/resource-card";
import { IntelligenceDetail } from "@/components/source-detail/intelligence-detail";
import { SourceActions } from "@/components/source-detail/source-actions";
import { Tag } from "@/components/ui/tag";
import catalogue from "@/data/catalogue.json";
import { getPublishedCollections } from "@/lib/collections";
import { getSimilarSourceProfiles } from "@/lib/similar-sources";
import {
  getAllSourceProfiles,
  getArchiveNotice,
  getSourceProfile,
  isArchivedSource,
} from "@/lib/source-profiles";

import styles from "./source-detail.module.css";

export const dynamicParams = false;

const resources = new Map(catalogue.resources.map((item) => [item.id, item]));
const categories = new Map(
  catalogue.categories.map((item) => [item.id, item.label]),
);

function label(value: string) {
  return value
    .split("-")
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

function resourceCard(id: string): ResourceCardData {
  const item = resources.get(id);
  if (!item) throw new Error(`Missing catalogue record for ${id}.`);
  return {
    id: item.id,
    slug: item.slug,
    name: item.name,
    url: item.url,
    domain: item.domain,
    description: item.description,
    category: item.category,
    access: item.access as ResourceCardAccess,
    status: item.status as ResourceCardData["status"],
    faviconUrl: item.faviconUrl,
    previewImageUrl: item.previewImageUrl,
  };
}

function generatedMark(name: string) {
  return (
    Array.from(name.trim())
      .find((character) => /[a-z0-9]/i.test(character))
      ?.toUpperCase() ?? "T"
  );
}

export function generateStaticParams() {
  return getAllSourceProfiles().map((profile) => ({ slug: profile.slug }));
}

type Props = Readonly<{ params: Promise<{ slug: string }> }>;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const profile = getSourceProfile((await params).slug);
  if (!profile) return { title: "Source not found" };
  return {
    title: profile.name,
    description: profile.summary,
    alternates: { canonical: `/resources/${profile.slug}` },
    // Archived sources keep their page for old links but leave search indexes.
    ...(isArchivedSource(profile)
      ? { robots: { index: false, follow: true } }
      : {}),
  };
}

export default async function SourceProfilePage({ params }: Props) {
  const profile = getSourceProfile((await params).slug);
  if (!profile) notFound();

  const card = resourceCard(profile.id);
  const memberships = getPublishedCollections().filter((collection) =>
    collection.resourceIds.includes(profile.id),
  );
  const similar = getSimilarSourceProfiles(profile, 4);
  const archiveNotice = getArchiveNotice(profile);

  return (
    <main
      className={styles.page}
      data-source-detail={profile.slug}
      data-source-status={profile.status}
      id="main-content"
    >
      <div className="tessli-container">
        <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
          <Link href="/resources">Browse</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{profile.name}</span>
        </nav>

        <header className={styles.hero}>
          <div className={styles.identity}>
            <h1>{profile.name}</h1>
            <p className={styles.summary}>{profile.summary}</p>
            {archiveNotice ? (
              <div className={styles.archivedNotice} data-source-archived="">
                <p>
                  <strong>Archived:</strong> {archiveNotice.reason}
                </p>
                {archiveNotice.replacement ? (
                  <p>
                    Use{" "}
                    <Link href={`/resources/${archiveNotice.replacement.slug}`}>
                      {archiveNotice.replacement.name}
                    </Link>{" "}
                    instead.
                  </p>
                ) : null}
              </div>
            ) : null}
            <p className={styles.category}>
              <Tag>
                {categories.get(profile.category) ?? label(profile.category)}
              </Tag>
            </p>
          </div>

          <figure className={styles.preview}>
            <span aria-hidden="true" className={styles.previewMark}>
              {generatedMark(profile.name)}
            </span>
            {card.previewImageUrl ? (
              // Native img keeps arbitrary approved third-party preview URLs out
              // of Next's image optimiser. The mark remains as a visual fallback.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt={`Preview of ${profile.name}`}
                className={styles.previewImage}
                decoding="async"
                loading="eager"
                referrerPolicy="no-referrer"
                src={card.previewImageUrl}
              />
            ) : null}
            <figcaption>
              {card.previewImageUrl
                ? "Approved preview metadata. Tessli does not embed the provider."
                : "No approved preview is recorded for this source."}
            </figcaption>
          </figure>
        </header>

        <section aria-label="Source actions" className={styles.actions}>
          <SourceActions resource={card} />
        </section>

        <div className={styles.guide}>
          <ProfileList
            title="Use it when"
            items={profile.bestFor}
            empty="No structured task-fit guidance is recorded for this source. Start with its canonical description and provider page."
          />

          <IntelligenceDetail profile={profile} similar={similar} />

          <section
            className={styles.collectionSection}
            aria-labelledby="collections-title"
          >
            <h2 id="collections-title">Collections</h2>
            {memberships.length > 0 ? (
              <ul className={styles.collectionList}>
                {memberships.map((collection) => (
                  <li key={collection.id}>
                    <Link href={`/collections/${collection.slug}`}>
                      {collection.title}
                    </Link>
                    <p>{collection.outcome}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.emptyNote}>
                Not currently included in a published collection.
              </p>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

function ProfileList({
  title,
  items,
  empty,
}: Readonly<{
  title: string;
  items: readonly string[];
  empty: string;
}>) {
  const id = title.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-");
  return (
    <section className={styles.section} aria-labelledby={id}>
      <h2 id={id}>{title}</h2>
      {items.length > 0 ? (
        <ul className={styles.list}>
          {items.map((item) => (
            <li key={item}>{label(item)}</li>
          ))}
        </ul>
      ) : (
        <p className={styles.emptyNote}>{empty}</p>
      )}
    </section>
  );
}
