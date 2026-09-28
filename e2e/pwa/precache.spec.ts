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
