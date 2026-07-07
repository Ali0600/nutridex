import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Mirror the tsconfig `@/* -> ./src/*` path alias so tests can import modules
// (and Next.js route handlers) that use the `@/` prefix internally.
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    // Unit tests live under src/. The Playwright E2E specs in e2e/ are run by
    // Playwright, not vitest — keep the two runners from picking up each other's files.
    include: ['src/**/*.test.ts'],
  },
});
