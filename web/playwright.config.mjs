// Item CI: renders every library item preview in every state and theme at five
// widths (tests/items-browser.spec.mjs). Run after `npm run build` with
// `npm run test:items`; it reuses a server on :3000 or starts `next start`.
import { defineConfig } from "@playwright/test";

const origin = process.env.TESSLI_ORIGIN ?? "http://127.0.0.1:3000";

export default defineConfig({
  testDir: "tests",
  testMatch: "items-browser.spec.mjs",
  outputDir: "artifacts/playwright",
  timeout: 120_000,
  fullyParallel: true,
  workers: 3,
  forbidOnly: Boolean(process.env.CI),
  reporter: [["list"]],
  use: { baseURL: origin, browserName: "chromium" },
  webServer: {
    command: "npm run start -- --hostname 127.0.0.1",
    url: origin,
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
