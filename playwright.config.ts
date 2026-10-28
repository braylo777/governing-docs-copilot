import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "e2e", timeout: 90_000,
  use: { baseURL: process.env.BASE_URL ?? "http://127.0.0.1:4173", launchOptions: process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {} },
  webServer: process.env.BASE_URL ? undefined : { command: "npx serve out -l 4173", port: 4173, reuseExistingServer: true },
});
