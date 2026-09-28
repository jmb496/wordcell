import { expect, test } from '@playwright/test';
import { buildRoot, walk } from '../helpers/dist-test';
import { readPrecacheManifest } from '../helpers/precache';

// Runs under both the pwa (dist-test/) and dist-smoke (dist/) projects, so it must stay hook-free:
// tests that use the VITE_TEST_HOOKS hook belong in pwa-only files.

test('AD-8 the precache manifest lists the hashed dictionary once with revision null', async ({
  request,
}) => {
  const manifest = await readPrecacheManifest(request);
  const dictionary = manifest.filter((entry) => /^assets\/en-[^/]+\.txt$/.test(entry.url));
  expect(dictionary).toHaveLength(1);
  expect(dictionary[0]?.revision).toBeNull();
});

test('AD-16 the precache manifest lists the hashed WordCell Serif font once with revision null', async ({
  request,
}) => {
  const manifest = await readPrecacheManifest(request);
  const font = manifest.filter((entry) => /^assets\/wordcell-serif-[^/]+\.woff2$/.test(entry.url));
  expect(font).toHaveLength(1);
  expect(font[0]?.revision).toBeNull();
});

// AD-16 globPatterns '**/*.{js,css,html,txt,woff2,png,svg,webmanifest}' as a path filter.
const GLOB_EXTENSIONS = /\.(js|css|html|txt|woff2|png|svg|webmanifest)$/;

test('AD-16 the precache manifest holds exactly one entry per URL, one per build file the globPatterns match', async ({
  request,
}) => {
  const manifest = await readPrecacheManifest(request);

  // Workbox globs with dot: false (covers .vite/). Root sw.js and workbox-*.js are ignored by
  // workbox-build itself; manifest.webmanifest comes from vite-plugin-pwa's own entry, not the
  // glob (vite.config.ts globIgnores). Re-check these exclusions on a plugin upgrade.
  const expected = walk(buildRoot()).filter(
    (file) =>
      GLOB_EXTENSIONS.test(file) &&
      !file.split('/').some((segment) => segment.startsWith('.')) &&
      file !== 'sw.js' &&
      !/^workbox-[^/]+\.js$/.test(file),
  );
  const urls = manifest.map((entry) => entry.url).sort();
  expect(urls).toEqual(expected);

  for (const member of [
    'index.html',
    'manifest.webmanifest',
    'favicon.svg',
    'icons/icon-192.png',
    'icons/icon-512.png',
    'icons/icon-512-maskable.png',
  ]) {
    expect(urls).toContain(member);
  }
  expect(urls.some((url) => /^assets\/[^/]+\.js$/.test(url))).toBe(true);
  expect(urls.some((url) => /^assets\/[^/]+\.css$/.test(url))).toBe(true);
});
