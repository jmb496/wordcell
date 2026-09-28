import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { distTest, linkTags, readSite, relOf, tags, walk } from '../helpers/dist-test';

// AD-16 / AD-18 packaging, read from dist-test/ on disk (epic Decision: dist-test/ stands in for
// dist/ because VITE_TEST_HOOKS changes only JS).

const VIEWPORT = 'width=device-width, initial-scale=1.0, viewport-fit=cover';

test('AD-16 the built web manifest is exactly DESIGN.md A-D5 plus the plugin defaults', () => {
  const manifest: unknown = JSON.parse(readSite('manifest.webmanifest'));
  // "Exactly per A-D5" reads as "no other authored fields": start_url, scope and lang are
  // vite-plugin-pwa defaults.
  expect(manifest).toEqual({
    name: 'WordCell',
    short_name: 'WordCell',
    description: 'A solo word card game in the spirit of FreeCell.',
    start_url: '/',
    scope: '/',
    lang: 'en',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#15171B',
    theme_color: '#15171B',
    icons: [
      { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      {
        src: 'icons/icon-512-maskable.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  });
});

test('AD-16 the build registers no service worker automatically', () => {
  const root = distTest();
  expect(existsSync(path.join(root, 'registerSW.js'))).toBe(false);

  // Epic 7 (AD-16 src/shell/sw.ts dynamic chunk) narrows this scan to the non-sw chunks.
  const scanned = ['index.html', ...walk(root).filter((file) => /^assets\/[^/]+\.js$/.test(file))];
  expect(scanned.length).toBeGreaterThan(1);
  for (const file of scanned) {
    const source = readSite(file);
    for (const marker of [
      'registerSW',
      'serviceWorker.register',
      'vite-plugin-pwa:',
      'virtual:pwa-register',
    ]) {
      expect(source.includes(marker), `${file} contains ${marker}`).toBe(false);
    }
  }

  // vite-plugin-pwa adds clientsClaim only for autoUpdate with automatic registration. No
  // skipWaiting assertion: the generated SKIP_WAITING message handler legitimately contains it.
  expect(readSite('sw.js')).not.toContain('clientsClaim');
});

test('AD-16 the built head carries the title, theme colour, viewport, manifest and favicon', () => {
  const html = readSite('index.html');

  const titles = [...html.matchAll(/<title>([^<]*)<\/title>/g)].map((m) => m[1]);
  expect(titles).toEqual(['WordCell']);

  const metas = tags(html, 'meta');
  const themeColors = metas.filter((meta) => meta.get('name') === 'theme-color');
  expect(themeColors.map((meta) => meta.get('content'))).toEqual(['#15171B']);
  const viewports = metas.filter((meta) => meta.get('name') === 'viewport');
  expect(viewports.map((meta) => meta.get('content'))).toEqual([VIEWPORT]);

  const links = linkTags(html);
  const manifests = links.filter((link) => relOf(link).includes('manifest'));
  expect(manifests.map((link) => link.get('href'))).toEqual(['/manifest.webmanifest']);
  const icons = links.filter((link) => relOf(link).includes('icon'));
  expect(icons.map((link) => link.get('href'))).toEqual(['/favicon.svg']);
});

// PNG signature, then the IHDR chunk: type at bytes 12–15, big-endian width at 16, height at 20.
function pngSize(file: string): { width: number; height: number } {
  const bytes = readFileSync(path.join(distTest(), file));
  expect(bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), file).toBe(
    true,
  );
  expect(bytes.subarray(12, 16).toString('latin1'), file).toBe('IHDR');
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

test('AD-16 dist-test/icons/ holds exactly the three manifest PNGs at their sizes', () => {
  expect(walk(distTest()).filter((file) => file.startsWith('icons/'))).toEqual([
    'icons/icon-192.png',
    'icons/icon-512-maskable.png',
    'icons/icon-512.png',
  ]);
  expect(pngSize('icons/icon-192.png')).toEqual({ width: 192, height: 192 });
  expect(pngSize('icons/icon-512.png')).toEqual({ width: 512, height: 512 });
  expect(pngSize('icons/icon-512-maskable.png')).toEqual({ width: 512, height: 512 });
});

test('AD-18 dist-test/.vite/manifest.json has the index.html entry under assets/', () => {
  // Read from disk: vite preview may not serve .vite/ (CAP-6 reads the same file in dist/).
  const manifest = JSON.parse(readSite('.vite/manifest.json')) as Record<
    string,
    { isEntry?: boolean; file?: string }
  >;
  const entry = manifest['index.html'];
  expect(entry?.isEntry).toBe(true);
  expect(entry?.file).toMatch(/^assets\//);
});
