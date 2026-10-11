/** Canonical public repository. Every repository link in the app reads from here. */
export const repositoryUrl = "https://github.com/Online-Scope-Lab/tessli";
export const repositoryCloneUrl = `${repositoryUrl}.git`;

/** A GitHub issue form in .github/ISSUE_TEMPLATE/. */
export type IssueTemplate =
  "suggest-source.yml" | "submit-design.yml" | "report-source.yml" | "bug.yml";

/** The "new issue" URL that opens one issue form. */
export function issueFormUrl(template: IssueTemplate): string {
  return `${repositoryUrl}/issues/new?template=${template}`;
}

/** A file or folder on the default branch. */
export function repositoryFileUrl(path: string, anchor?: string): string {
  const kind = /\.[a-z]+$/i.test(path) ? "blob" : "tree";
  return `${repositoryUrl}/${kind}/main/${path}${anchor ? `#${anchor}` : ""}`;
}
