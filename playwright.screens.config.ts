import { defineConfig } from '@playwright/test';
import { deviceProjects, forbidOnly, fullyParallel, reporter, use } from './playwright.base';

/**
 * Screenshot specs (AD-17 Screenshots): baselines are generated and compared only inside
 * mcr.microsoft.com/playwright:v1.63.0-noble, so this config refuses to load anywhere else.
 * Run: npm run test:screens   (docker run of the pinned image; CI calls test:screens:run)
 */
if (process.env.WORDCELL_SCREENS_CONTAINER !== '1') {
  throw new Error(
    'playwright.screens.config.ts runs only in the Playwright container (npm run test:screens); WORDCELL_SCREENS_CONTAINER must be 1',
  );
}

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.screens.spec.ts',
  fullyParallel,
  forbidOnly,
  retries: 0,
  reporter,
  updateSnapshots: process.env.CI ? 'none' : 'missing',
  use: { ...use, baseURL: 'http://localhost:5173' },
  expect: {
    toHaveScreenshot: { maxDiffPixelRatio: 0.01 },
  },
  projects: deviceProjects,
  webServer: {
    command: 'npm run dev -- --port 5173 --strictPort',
    url: 'http://localhost:5173',
    reuseExistingServer: false,
    timeout: 60_000,
    stdout: 'pipe',
  },
});
