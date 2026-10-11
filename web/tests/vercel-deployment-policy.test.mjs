import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { constants } from "node:fs";
import { test } from "node:test";

const repositoryRootUrl = new URL("../../", import.meta.url);
const vercelConfigUrl = new URL("vercel.json", repositoryRootUrl);
const legacyIndexUrl = new URL("index.html", repositoryRootUrl);

async function readVercelConfig() {
  return JSON.parse(await readFile(vercelConfigUrl, "utf8"));
}

test("Vercel targets the nested Next.js package", async () => {
  const config = await readVercelConfig();

  assert.equal(config.$schema, "https://openapi.vercel.sh/vercel.json");
  assert.deepEqual(config.builds, [
    {
      src: "web/package.json",
      use: "@vercel/next",
    },
  ]);
  assert.equal(config.git?.deploymentEnabled, true);
});

test("the repository-root legacy static entry point is retired", async () => {
  await assert.rejects(access(legacyIndexUrl, constants.F_OK), {
    code: "ENOENT",
  });
});

test("the Next.js cutover preserves the browser security-header contract", async () => {
  const config = await readVercelConfig();
  const catchAll = config.headers?.find((entry) => entry.source === "/(.*)");
  const headers = new Map(
    catchAll?.headers?.map((header) => [header.key, header.value]) ?? [],
  );

  assert.equal(headers.get("X-Content-Type-Options"), "nosniff");
  assert.equal(
    headers.get("Referrer-Policy"),
    "strict-origin-when-cross-origin",
  );
  // Framing is denied everywhere except the library previews, which the
  // library pages embed from the same origin.
  assert.equal(headers.has("X-Frame-Options"), false);
  const headersFor = (source) =>
    new Map(
      config.headers
        ?.find((entry) => entry.source === source)
        ?.headers?.map((header) => [header.key, header.value]) ?? [],
    );
  assert.equal(headersFor("/((?!preview/).*)").get("X-Frame-Options"), "DENY");
  const preview = headersFor("/preview/(.*)");
  assert.equal(preview.get("X-Frame-Options"), "SAMEORIGIN");
  assert.equal(
    preview.get("Content-Security-Policy"),
    "frame-ancestors 'self'",
  );
  assert.equal(preview.get("X-Robots-Tag"), "noindex");
});
