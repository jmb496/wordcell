import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { devices, type Project } from '@playwright/test';

/**
 * Settings the Playwright configs share (B11, E9). Constants only: each config keeps its own
 * baseURL, webServer, testDir/testMatch/testIgnore, expect, updateSnapshots and env guards.
 * playwright.screens.config.ts keeps `retries: 0` (AD-17); playwright.pwa.config.ts keeps its own
 * PW_PREVIEW-selected project instead of `deviceProjects`.
 */
const ci = !!process.env.CI;

export const fullyParallel = true;
export const forbidOnly = ci;
/** The CI retry value of playwright.config.ts and playwright.pwa.config.ts. */
export const retries = ci ? 2 : 0;
export const reporter = ci ? 'github' : 'list';
export const use = { trace: 'retain-on-failure' } as const;
/**
 * Where playwright.config.ts and playwright.pwa.config.ts write traces and attachments. CI keeps
 * `test-results/`, which the workflow uploads on failure. Locally it is the OS temp dir, one folder
 * per checkout and run: on the `/mnt/d` drvfs checkout, trace files in `test-results/` stalled
 * context teardown past the test timeout under 8 workers. A failure prints its trace's full path.
 */
export function outputDir(run: string): string {
  if (ci) return 'test-results';
  const checkout = createHash('sha256').update(process.cwd()).digest('hex').slice(0, 8);
  return join(tmpdir(), 'wordcell-test-results', checkout, run);
}
/** The android/desktop device map of playwright.config.ts and playwright.screens.config.ts. */
export const deviceProjects: Project[] = [
  { name: 'android', use: { ...devices['Pixel 7'] } },
  { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
];
