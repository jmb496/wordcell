// @ts-check
import { globSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// AD-17: the host Playwright and the screenshot container run the same version. On a bump, also
// update by hand: the build-icons.mjs header, AGENTS.md and the spine AD-17 tag.

/** @param {string} path repo-relative */
const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const IMAGE = 'mcr.microsoft.com/playwright';
const SCANNED = [
  'package.json',
  'playwright.screens.config.ts',
  ...globSync('.github/workflows/*.yml', { cwd: fileURLToPath(new URL('../', import.meta.url)) }),
];
// Each must name the image at least once; every other scanned file may name none.
const REQUIRED = ['package.json', '.github/workflows/ci.yml'];

/**
 * Every `mcr.microsoft.com/playwright` reference in `text`, up to the next whitespace.
 * @param {string} text
 */
function imageReferences(text) {
  return [...text.matchAll(/mcr\.microsoft\.com\/playwright\S*/g)].map((m) => m[0]);
}

describe('Playwright pin', () => {
  it('AD-17 package.json pins @playwright/test exactly to the lockfile playwright versions', () => {
    const spec = JSON.parse(read('package.json')).devDependencies['@playwright/test'];
    expect(spec).toMatch(/^\d+\.\d+\.\d+$/);

    const packages = JSON.parse(read('package-lock.json')).packages;
    expect(packages[''].devDependencies['@playwright/test']).toBe(spec);
    for (const name of ['@playwright/test', 'playwright', 'playwright-core']) {
      expect(packages[`node_modules/${name}`]?.version, name).toBe(spec);
    }
  });

  it('AD-17 every Playwright container image tag is v<the pinned version>-noble', () => {
    for (const path of REQUIRED) expect(SCANNED, path).toContain(path);
    const spec = JSON.parse(read('package.json')).devDependencies['@playwright/test'];
    const expected = `${IMAGE}:v${spec}-noble`;
    for (const path of SCANNED) {
      const references = imageReferences(read(path));
      if (REQUIRED.includes(path)) {
        expect(references.length, `${path} names no ${IMAGE} image`).toBeGreaterThan(0);
      }
      for (const reference of references) {
        // Strip trailing punctuation (quotes, a comma, a full stop) that ends the reference.
        expect(reference.replace(/[^\w-]+$/, ''), path).toBe(expected);
      }
    }
  });
});
