import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  // list for agents reading the terminal; html (never auto-opened) + traces for failure triage
  reporter: [["list"], ["html", { open: "never" }]],
  use: { baseURL: "http://localhost:5173", trace: "retain-on-failure" },
  projects: [{ name: "chromium", use: devices["Desktop Chrome"] }],
  webServer: {
    command: "pnpm dev --port 5173 --strictPort",
    url: "http://localhost:5173",
    reuseExistingServer: true,
  },
});
