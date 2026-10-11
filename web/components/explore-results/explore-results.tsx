"use client";

import Link from "next/link";

import { ResourceCard } from "@/components/resource-card/resource-card";
import type { DiscoveryState } from "@/components/explore-discovery/discovery-state";

import {
  explorePageSize,
  type ExploreResultSet,
} from "./explore-results-state";
import styles from "./explore-results.module.css";

type ExploreResultsProps = Readonly<{
  resultSet: ExploreResultSet;
  state: DiscoveryState;
  totalResourceCount: number;
  visibleCount: number;
  onLoadMore: () => void;
  onResetDiscovery: () => void;
}>;

function resultSummary(
  count: number,
  state: DiscoveryState,
  totalResourceCount: number,
) {
  if (count === 0) {
    return "No catalogue entries match the current search and filters.";
  }
  if (state.query || state.category || state.access.length > 0) {
    return `${count} featured ${count === 1 ? "resource matches" : "resources match"} this homepage preview. Browse the full catalogue for more.`;
  }
  return `A curated preview from the ${totalResourceCount}-source catalogue.`;
}

export function ExploreResults({
  resultSet,
  state,
  totalResourceCount,
  visibleCount,
  onLoadMore,
  onResetDiscovery,
}: ExploreResultsProps) {
  if (resultSet.status === "error") {
    return (
      <section
        aria-labelledby="explore-results-title"
        className={styles.section}
        data-explore-results="error"
      >
        <div className={`tessli-container ${styles.statePanel}`}>
          <p className={styles.eyebrow}>Catalogue unavailable</p>
          <h2 id="explore-results-title">
            The resource list could not be prepared.
          </h2>
          <p>
            Tessli has not changed your filters. Reload Explore to retry the
            validated local catalogue.
          </p>
          <Link className={styles.primaryAction} href="/">
            Reload Explore
          </Link>
        </div>
      </section>
    );
  }

  const resultCount = resultSet.resources.length;
  const visibleResources = resultSet.resources.slice(0, visibleCount);
  const remaining = Math.max(0, resultCount - visibleResources.length);
  const nextBatch = Math.min(explorePageSize, remaining);

  if (resultCount === 0) {
    return (
      <section
        aria-labelledby="explore-results-title"
        className={styles.section}
        data-explore-results="empty"
        data-result-count="0"
      >
        <div className={`tessli-container ${styles.statePanel}`}>
          <p className={styles.eyebrow}>No matches</p>
          <h2 id="explore-results-title">
            Try a broader route through the catalogue.
          </h2>
          <p>
            Remove the search query or selected category and access filters to
            bring more resources back into view.
          </p>
          <button
            className={styles.primaryAction}
            data-reset-discovery
            onClick={onResetDiscovery}
            type="button"
          >
            Clear search and filters
          </button>
        </div>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="explore-results-title"
      className={styles.section}
      data-explore-results="ready"
      data-result-count={resultCount}
      data-total-resource-count={totalResourceCount}
      data-visible-result-count={visibleResources.length}
    >
      <div className="tessli-container">
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Catalogue results</p>
            <h2 id="explore-results-title">
              {resultCount} featured{" "}
              {resultCount === 1 ? "resource" : "resources"}
            </h2>
            <p className={styles.summary}>
              {resultSummary(resultCount, state, totalResourceCount)}
            </p>
          </div>
          <p aria-live="polite" className={styles.visibleSummary}>
            Showing {visibleResources.length} of {resultCount}
          </p>
        </header>

        <ul className={styles.grid} data-resource-grid>
          {visibleResources.map(({ resource, categoryLabel }) => (
            <li key={resource.id}>
              <ResourceCard
                categoryLabel={categoryLabel}
                profileHref={`/resources/${resource.slug}`}
                resource={resource}
              />
            </li>
          ))}
        </ul>

        <div className={styles.browseAllFrame} data-browse-all-resources>
          <Link className={styles.browseAllAction} href="/resources">
            Browse all {totalResourceCount} sources
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        {remaining > 0 ? (
          <div className={styles.loadMoreFrame}>
            <button
              className={styles.loadMoreButton}
              data-load-more-resources
              onClick={onLoadMore}
              type="button"
            >
              Load {nextBatch} more
            </button>
            <p>{remaining} resources remain in this view.</p>
          </div>
        ) : (
          <p className={styles.endNote}>All matching resources are visible.</p>
        )}
      </div>
    </section>
  );
}
