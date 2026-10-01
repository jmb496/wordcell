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
/** The android/desktop device map of playwright.config.ts and playwright.screens.config.ts. */
export const deviceProjects: Project[] = [
  { name: 'android', use: { ...devices['Pixel 7'] } },
  { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
];
