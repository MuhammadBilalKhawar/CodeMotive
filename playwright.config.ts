import { defineConfig, devices } from "@playwright/test"

// End-to-end tests against a production build on port 3200.
// Every external service is switched off here: empty values take precedence
// over .env, so no AI calls, emails, Jira issues, database writes or analytics
// happen. Turnstile uses Cloudflare's official always-pass test keys.
// Run: npm run test:e2e   (uses the installed Google Chrome)
const PORT = 3200

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  reporter: "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    channel: "chrome",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "mobile", testMatch: /mobile\.spec\.ts/, use: { ...devices["Pixel 7"], channel: "chrome" } },
    { name: "desktop", testMatch: /desktop\.spec\.ts/, use: { ...devices["Desktop Chrome"], channel: "chrome" } },
  ],
  webServer: {
    command: `npx next build && npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    timeout: 300_000,
    reuseExistingServer: false,
    env: {
      MONGODB_URI: "",
      ADMIN_PASSWORD: "",
      GROQ_API_KEY: "",
      GEMINI_API_KEY: "",
      RESEND_API_KEY: "",
      TASK_PROVIDER: "none",
      JIRA_API_TOKEN: "",
      NEXT_PUBLIC_GA_ID: "",
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
      TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA",
    },
  },
})
