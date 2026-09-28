import { expect, test } from '@playwright/test';
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
