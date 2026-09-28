import { expect, test } from '@playwright/test';
import { distTest, walk } from '../helpers/dist-test';
import { readPrecacheManifest } from '../helpers/precache';

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

// Public files the plugin also adds (includeAssets, manifest icons, the manifest itself).
const PUBLIC_DUPLICATES = /^(favicon\.svg|icons\/[^/]+\.png|manifest\.webmanifest)$/;

test('AD-16 the unique precache URLs are exactly the dist-test/ files the globPatterns match', async ({
  request,
}) => {
  const manifest = await readPrecacheManifest(request);

  // Workbox globs with dot: false (covers .vite/). Root sw.js and workbox-*.js mirror
  // vite-plugin-pwa's default globIgnores; re-check these exclusions on a plugin upgrade.
  const expected = walk(distTest()).filter(
    (file) =>
      GLOB_EXTENSIONS.test(file) &&
      !file.split('/').some((segment) => segment.startsWith('.')) &&
      file !== 'sw.js' &&
      !/^workbox-[^/]+\.js$/.test(file),
  );
  const unique = [...new Set(manifest.map((entry) => entry.url))].sort();
  expect(unique).toEqual(expected);

  for (const member of [
    'index.html',
    'manifest.webmanifest',
    'favicon.svg',
    'icons/icon-192.png',
    'icons/icon-512.png',
    'icons/icon-512-maskable.png',
  ]) {
    expect(unique).toContain(member);
  }
  expect(unique.some((url) => /^assets\/[^/]+\.js$/.test(url))).toBe(true);
  expect(unique.some((url) => /^assets\/[^/]+\.css$/.test(url))).toBe(true);

  // The public duplicates' revisions come from two hashers (the plugin hashes the generated
  // manifest and public assets, Workbox hashes the files on disk), so a mismatch points at
  // plugin behaviour, never at a test to loosen.
  for (const url of unique) {
    const entries = manifest.filter((entry) => entry.url === url);
    if (PUBLIC_DUPLICATES.test(url)) {
      expect(entries.length, url).toBeLessThanOrEqual(2);
      expect(new Set(entries.map((entry) => entry.revision)).size, url).toBe(1);
    } else {
      expect(entries, url).toHaveLength(1);
    }
  }
});
