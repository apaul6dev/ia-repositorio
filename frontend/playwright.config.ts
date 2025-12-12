import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 60 * 1000,
  retries: 0,
  // Permite personalizar puerto/host via E2E_PORT/E2E_BASE_URL
  expect: { timeout: 15_000 },
  use: {
    baseURL: process.env.E2E_BASE_URL || `http://127.0.0.1:${process.env.E2E_PORT || 4300}`,
    headless: true,
    browserName: 'chromium',
    channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
    trace: 'retain-on-failure',
  },
  webServer:
    process.env.E2E_SKIP_WEBSERVER === 'true'
      ? undefined
      : {
          command:
            process.env.E2E_START_CMD ||
            `E2E_PORT=${process.env.E2E_PORT || 4300} npm run start:e2e`,
          url: process.env.E2E_BASE_URL || `http://127.0.0.1:${process.env.E2E_PORT || 4300}`,
          reuseExistingServer: true,
          timeout: 120_000,
        },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], channel: undefined },
    },
  ],
});
