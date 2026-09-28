import { expect, test } from '@playwright/test';
import { type Attributes, distTest, linkTags, readSite, relOf, walk } from '../helpers/dist-test';

// AD-16 / AD-18 Font (SPEC CAP-4) against the dist-test/ build the pwa project serves; the epic
// Decision lets dist-test/ stand in for dist/ because VITE_TEST_HOOKS changes only JS.

function fontFaceBlocks(css: string): string[] {
  return [...css.matchAll(/@font-face\s*\{[^}]*\}/g)].map((m) => m[0]);
}

function urls(block: string): string[] {
  return [...block.matchAll(/url\(\s*(['"]?)(.*?)\1\s*\)/g)].map((m) => m[2] ?? '');
}

function sitePathname(url: string, base: string): string {
  return new URL(url, new URL(base, 'http://site.invalid/')).pathname;
}

test('AD-16 the font preload href equals the @font-face URL of WordCell Serif', () => {
  const links = linkTags(readSite('index.html'));

  const preloads = links.filter(
    (link) => relOf(link).includes('preload') && link.get('as')?.toLowerCase() === 'font',
  );
  expect(preloads).toHaveLength(1);
  const preload = preloads[0] as Attributes;
  expect(preload.get('type')?.toLowerCase()).toBe('font/woff2');
  expect(preload.has('crossorigin')).toBe(true);
  expect(['', 'anonymous']).toContain(preload.get('crossorigin')?.toLowerCase());
  const href = preload.get('href');
  expect(href).toBeTruthy();

  const faces = links
    .filter((link) => relOf(link).includes('stylesheet'))
    .map((link) => sitePathname(link.get('href') ?? '', '/'))
    .map((cssPath) => ({ cssPath, blocks: fontFaceBlocks(readSite(cssPath)) }))
    .filter(({ blocks }) => blocks.length > 0);
  expect(faces).toHaveLength(1);
  const { cssPath, blocks } = faces[0] as { cssPath: string; blocks: string[] };
  expect(blocks).toHaveLength(1);
  const block = blocks[0] as string;
  const faceUrls = urls(block);
  expect(faceUrls).toHaveLength(1);

  expect(sitePathname(href as string, '/')).toBe(sitePathname(faceUrls[0] as string, cssPath));
  expect(block).toMatch(/font-family:\s*(['"]?)WordCell Serif\1/);
  expect(block).toMatch(/font-display:\s*block/);
});

test('AD-18 dist-test/ holds the WordCell Serif font once and never as a data: URL', () => {
  const files = walk(distTest());
  const fonts = files.filter((file) => file.endsWith('.woff2'));
  expect(fonts).toHaveLength(1);
  expect(fonts[0]).toMatch(/^assets\/wordcell-serif-[^/]+\.woff2$/);

  const css = files.filter((file) => /^assets\/[^/]+\.css$/.test(file));
  expect(css.length).toBeGreaterThan(0);
  const dataUrls = css.flatMap((file) =>
    fontFaceBlocks(readSite(file))
      .flatMap(urls)
      .filter((url) => url.trim().toLowerCase().startsWith('data:')),
  );
  expect(dataUrls).toEqual([]);
});

test('AD-18 the placeholder card letters render in WordCell Serif and nothing else does', async ({
  page,
}) => {
  await page.goto('/');
  const card = page.getByTestId('card-0');
  await expect(card).toBeVisible();

  const fonts = await page.evaluate(async () => {
    const loaded = await document.fonts.load('600 1em "WordCell Serif"', 'W');
    const faces: { weight: string; status: string }[] = [];
    document.fonts.forEach((face) => {
      if (face.family.replace(/['"]/g, '') === 'WordCell Serif') {
        faces.push({ weight: face.weight, status: face.status });
      }
    });
    return { loaded: loaded.length, faces };
  });
  expect(fonts.loaded).toBe(1);
  expect(fonts.faces).toEqual([{ weight: '600', status: 'loaded' }]);

  const style = (element: Element) => {
    const computed = getComputedStyle(element);
    return { family: computed.fontFamily, weight: computed.fontWeight };
  };
  const firstFamily = (family: string) => (family.split(',')[0] ?? '').trim().replace(/['"]/g, '');

  const cardStyle = await card.evaluate(style);
  expect(firstFamily(cardStyle.family)).toBe('WordCell Serif');
  expect(cardStyle.weight).toBe('600');

  for (const other of [
    page.getByRole('heading', { name: 'WordCell' }),
    page.getByText(/placeholder board/),
  ]) {
    const { family } = await other.evaluate(style);
    expect(family.replace(/['"]/g, '').startsWith('WordCell Serif')).toBe(false);
  }
});
