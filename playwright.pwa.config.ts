import { defineConfig, devices, type Project } from '@playwright/test';

/**
 * D5: serves a production-shaped build with `vite preview`. `PW_PREVIEW` picks the build and the
 * only registered project: `dist-test` → `pwa` (test hooks on), `dist` → `dist-smoke`, which runs
 * dist-smoke.spec.ts (AD-18) plus the hook-free packaging specs (precache, build-output, font).
 * Run: npm run test:e2e:pwa, or npm run build && npm run test:e2e:dist
 */
const preview = process.env.PW_PREVIEW;
if (preview !== 'dist' && preview !== 'dist-test') {
  throw new Error(
    `PW_PREVIEW must be exactly 'dist' or 'dist-test' (got ${JSON.stringify(preview)})`,
  );
}

const project: Project =
  preview === 'dist-test'
    ? { name: 'pwa', testIgnore: '**/dist-smoke.spec.ts', use: { ...devices['Pixel 7'] } }
    : {
        name: 'dist-smoke',
        testMatch: [
          '**/dist-smoke.spec.ts',
          '**/precache.spec.ts',
          '**/build-output.spec.ts',
          '**/font.spec.ts',
        ],
        use: { ...devices['Pixel 7'] },
      };

export default defineConfig({
  testDir: 'e2e/pwa',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'retain-on-failure',
  },
  projects: [project],
  webServer: {
    command: `npx vite preview --outDir ${preview} --port 4173 --strictPort`,
    url: 'http://localhost:4173',
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
