import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildReleaseCatalogue,
  CATALOGUE_PATH,
  REPORT_PATH,
} from "./release-catalogue-lib.mjs";
import { CATALOGUE_FIX_GUIDE } from "./catalogue-lib.mjs";

const currentFile = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(currentFile), "../..");
const { catalogueText, report, reportText } = await buildReleaseCatalogue({
  root: repoRoot,
});
const cataloguePath = path.join(repoRoot, CATALOGUE_PATH);
const reportPath = path.join(repoRoot, REPORT_PATH);

await mkdir(path.dirname(reportPath), { recursive: true });
await writeFile(reportPath, reportText, "utf8");

if (report.issues.errors.length > 0) {
  console.error(
    `Catalogue generation found ${report.issues.errors.length} blocking issue(s).`,
  );
  for (const error of report.issues.errors) {
    console.error(`- [${error.code}] ${error.message}`);
  }
  console.error("");
  for (const line of CATALOGUE_FIX_GUIDE) console.error(line);
  process.exitCode = 1;
} else {
  await mkdir(path.dirname(cataloguePath), { recursive: true });
  await writeFile(cataloguePath, catalogueText, "utf8");

  console.log(
    `Generated ${report.summary.resources} resources, ${report.summary.categories} categories, and ${report.summary.collections} collections.`,
  );
  console.log(
    `Validation report contains ${report.issues.warnings.length} review warning(s) and no blocking errors.`,
  );
}
