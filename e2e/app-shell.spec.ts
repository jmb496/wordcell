import { expect, test } from '@playwright/test';

// App shell head and base styles against vite dev, in android and desktop.

test('AD-16 the dev head carries the title, theme colour and viewport, and no PWA injection', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByTestId('card-0')).toBeVisible();

  expect(await page.title()).toBe('WordCell');
  const themeColors = page.locator('meta[name="theme-color"]');
  await expect(themeColors).toHaveCount(1);
  await expect(themeColors).toHaveAttribute('content', '#15171B');
  const viewports = page.locator('meta[name="viewport"]');
  await expect(viewports).toHaveCount(1);
  await expect(viewports).toHaveAttribute(
    'content',
    'width=device-width, initial-scale=1.0, viewport-fit=cover',
  );
  // The plugin injects the manifest link only at build; the worker stays off in vite dev.
  await expect(page.locator('link[rel~="manifest"]')).toHaveCount(0);
  await expect(page.locator('script[id^="vite-plugin-pwa:"]')).toHaveCount(0);
});

// DESIGN.md `colors`, hand-copied: a v1 limit, not re-read from DESIGN.md.
const COLORS: [string, string][] = [
  ['table', '#15171B'],
  ['surface', '#1E2127'],
  ['surface-raised', '#282C34'],
  ['hairline', '#363B45'],
  ['outline', '#6E7480'],
  ['card-face', '#23262C'],
  ['card-edge', '#6A707C'],
  ['card-ink', '#F3EEE4'],
  ['ink-primary', '#F3EEE4'],
  ['ink-secondary', '#A9A398'],
  ['ink-disabled', '#6B675F'],
  ['ink-on-accent', '#15171B'],
  ['accent-teal', '#3DBDB5'],
  ['accent-orange', '#EF7A3D'],
  ['destination', '#7FA2D6'],
  ['destination-fill', '#2E3A52'],
  ['error', '#F08A84'],
  ['scrim', '#000000B3'],
];

for (const colorScheme of ['dark', 'light'] as const) {
  test(`AD-11 the --wc-* palette and base styles hold under prefers-color-scheme ${colorScheme}`, async ({
    page,
  }) => {
    expect(COLORS).toHaveLength(18);
    await page.emulateMedia({ colorScheme });
    await page.goto('/');
    const card = page.getByTestId('card-0');
    await expect(card).toBeVisible();

    const tokens = await page.evaluate(
      (keys) =>
        keys.map((key) =>
          getComputedStyle(document.documentElement)
            .getPropertyValue(`--wc-${key}`)
            .trim()
            .toLowerCase(),
        ),
      COLORS.map(([key]) => key),
    );
    expect(tokens).toEqual(COLORS.map(([, value]) => value.toLowerCase()));

    const base = await page.evaluate(() =>
      [document.documentElement, document.body].map((element) => {
        const style = getComputedStyle(element);
        return {
          overflowX: style.overflowX,
          overflowY: style.overflowY,
          overscrollBehaviorX: style.overscrollBehaviorX,
          overscrollBehaviorY: style.overscrollBehaviorY,
          backgroundColor: style.backgroundColor,
        };
      }),
    );
    for (const element of base) {
      expect(element).toEqual({
        overflowX: 'visible',
        overflowY: 'visible',
        overscrollBehaviorX: 'none',
        overscrollBehaviorY: 'none',
        backgroundColor: 'rgb(21, 23, 27)',
      });
    }

    expect(await page.evaluate(() => getComputedStyle(document.body).color)).toBe(
      'rgb(243, 238, 228)',
    );
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme)).toBe(
      'dark',
    );
    expect(
      await card.evaluate((element) => {
        const style = getComputedStyle(element);
        return { backgroundColor: style.backgroundColor, color: style.color };
      }),
    ).toEqual({ backgroundColor: 'rgb(35, 38, 44)', color: 'rgb(243, 238, 228)' });
  });
}
