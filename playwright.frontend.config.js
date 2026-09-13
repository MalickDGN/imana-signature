import { defineConfig, devices } from '@playwright/test';

// Exercise React hydration and historical URL rewrites in Next.js itself.
// The Express suite remains separate in playwright.config.js.
export default defineConfig({
  testDir: './tests/e2e',
  testMatch: 'storefront-alignment.spec.js',
  timeout: 30_000,
  fullyParallel: true,
  workers: 2,
  reporter: 'line',
  use: {
    baseURL: 'http://127.0.0.1:3100',
    reducedMotion: 'reduce',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'pnpm --filter @imana-signature/frontend-web dev --hostname 127.0.0.1 --port 3100',
    url: 'http://127.0.0.1:3100/index.html',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 5'] } },
  ],
});
