import {
  ResourceCard,
  type ResourceCardData,
} from "@/components/resource-card/resource-card";

import styles from "./collection-resource-list.module.css";

type CollectionResource = Readonly<{
  resource: ResourceCardData;
  categoryLabel: string;
  role: string;
}>;

type CollectionResourceListProps = Readonly<{
  resources: readonly CollectionResource[];
  className: string;
  inspectPrompt: string;
  decisionPrompt: string;
}>;

export function CollectionResourceList({
  resources,
  className,
  inspectPrompt,
  decisionPrompt,
}: CollectionResourceListProps) {
  return (
    <ol className={className} data-collection-resource-grid>
      {resources.map(({ resource, categoryLabel, role }) => (
        <li data-playbook-resource-role key={resource.id}>
          <dl className={styles.role}>
            <div>
              <dt>Role — Why included</dt>
              <dd>{role}</dd>
            </div>
            <div>
              <dt>Inspect</dt>
              <dd>{inspectPrompt}</dd>
            </div>
            <div>
              <dt>Decision prompt</dt>
              <dd>{decisionPrompt}</dd>
            </div>
          </dl>
          <ResourceCard
            categoryLabel={categoryLabel}
            profileHref={`/resources/${resource.slug}`}
            resource={resource}
          />
        </li>
      ))}
    </ol>
  );
}
