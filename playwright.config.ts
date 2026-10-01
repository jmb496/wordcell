import { defineConfig } from '@playwright/test';
import {
  deviceProjects,
  forbidOnly,
  fullyParallel,
  reporter,
  retries,
  use,
} from './playwright.base';

/**
 * End-to-end tests. The default project emulates a phone because Android is the primary
 * target; the desktop project guards the browser experience.
 * Run: npm run test:e2e   (starts the Vite dev server automatically)
 */
export default defineConfig({
  testDir: './e2e',
  testIgnore: ['**/*.screens.spec.ts', '**/pwa/**'],
  fullyParallel,
  forbidOnly,
  retries,
  reporter,
  use: { ...use, baseURL: 'http://localhost:5173' },
  expect: {
    toHaveScreenshot: { maxDiffPixelRatio: 0.01 },
  },
  projects: deviceProjects,
  webServer: {
    command: 'npm run dev -- --port 5173 --strictPort',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
