const { defineConfig, devices } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./e2e",
  timeout: 45_000,
  expect: {
    timeout: 10_000
  },
  retries: 0,
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:18080",
    trace: "on-first-retry"
  },
  webServer: {
    command: "node server.js",
    url: "http://127.0.0.1:18080/api/health",
    timeout: 60_000,
    reuseExistingServer: true,
    env: {
      ...process.env,
      HOST: "127.0.0.1",
      PORT: "18080",
      BLOCKFROST_API_KEY: process.env.BLOCKFROST_API_KEY || "e2e_dummy",
      BUG_REPORTS_TOKEN: process.env.BUG_REPORTS_TOKEN || "e2e_bug_token",
      OPERATIONS_API_TOKEN: process.env.OPERATIONS_API_TOKEN || "e2e_ops_token",
      SYNC_STARTUP_DELAY_MS: "600000"
    }
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    },
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 7"] }
    }
  ]
});
