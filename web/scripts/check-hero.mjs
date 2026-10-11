import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

// The approved hero artwork is frozen. Any change to the file must fail CI.
const heroPath = new URL(
  "../public/brand/tessli-hero-geometry.webp",
  import.meta.url,
);
const expected =
  "0bf8d0fcea17d10b041b2bc08422679acf4fffd7c54fc70c1b18aba9d1d85583";

let bytes;
try {
  bytes = await readFile(heroPath);
} catch (error) {
  console.error(`Hero artwork is missing: ${error.message}`);
  process.exit(1);
}

const actual = createHash("sha256").update(bytes).digest("hex");
if (bytes.length === 0 || actual !== expected) {
  console.error(
    `Hero artwork hash mismatch for public/brand/tessli-hero-geometry.webp.\n  expected ${expected}\n  actual   ${actual}`,
  );
  process.exit(1);
}

console.log("Hero artwork matches the approved SHA-256.");
