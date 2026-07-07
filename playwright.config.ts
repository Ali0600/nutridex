import { defineConfig, devices } from '@playwright/test';

// Port is overridable (PORT env) so a local run can avoid a busy 3000; CI uses 3000.
const PORT = Number(process.env.PORT ?? 3000);
const baseURL = `http://localhost:${PORT}`;

/**
 * E2E config. The tests run against a real production build (`next build && next start`)
 * so they exercise the same output that ships. Locally, an already-running dev server on
 * :3000 is reused; in CI a fresh build is always started.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run build && npm run start',
    url: `${baseURL}/api/v1/health`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
