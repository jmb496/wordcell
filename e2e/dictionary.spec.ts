import { expect, type Page, type Request, type Route, test } from '@playwright/test';
import { showPage, startHidden } from './helpers/lifecycle';
import { fixture, seedStorage } from './helpers/seed';

// Dictionary load, retry and Validate (R-38, AD-8, AD-16, Q-42) on android. The route pattern
// `**/en*.txt` matches the dev and build word-list URLs (AD-8).

test.beforeEach(() => {
  test.skip(test.info().project.name !== 'android', 'dictionary flows run on android');
});

const LIST = '**/en*.txt';
const BANNER = "Word list didn't load.";
// The word-list fetch itself (as `LIST` matches it), not the dev server's `en.txt?url` module.
const isList = (request: Request) => /\/en[^/?]*\.txt$/.test(request.url());

type DictionaryState = 'loading' | 'ready' | 'failed';

const dictionaryState = (page: Page) => page.evaluate(() => window.__wordcell?.dictionaryState());

async function waitForDictionary(page: Page, state: DictionaryState): Promise<void> {
  await page.waitForFunction((s) => window.__wordcell?.dictionaryState() === s, state);
}

// Every word-list request of the page, counted from before its first goto.
function countRequests(page: Page): Request[] {
  const requests: Request[] = [];
  page.on('request', (request) => {
    if (isList(request)) requests.push(request);
  });
  return requests;
}

// Routes answered in order: each entry fulfils with a status (and body), or holds the request for
// the test to continue with the real list (`route.continue()`).
type Answer = { status: number; body?: string } | 'hold';
async function answer(page: Page, answers: Answer[]): Promise<Route[]> {
  const held: Route[] = [];
  const queue = [...answers];
  await page.route(LIST, async (route) => {
    const next = queue.shift();
    if (next === undefined)
      throw new Error(`unexpected word-list request ${route.request().url()}`);
    if (next === 'hold') held.push(route);
    else await route.fulfill({ status: next.status, body: next.body ?? '' });
  });
  return held;
}

async function open(page: Page): Promise<void> {
  await page.goto('/');
  await expect(page.getByTestId('card-0')).toBeVisible();
}

// Resolves a colour token to its computed rgb form through a probe element.
function tokenColor(page: Page, token: string): Promise<string> {
  return page.evaluate((name) => {
    const probe = document.createElement('span');
    probe.style.color = `var(${name})`;
    document.body.append(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
  }, token);
}

async function activeSession(page: Page): Promise<{ stored: unknown; current: unknown }> {
  return page.evaluate(() => {
    const current = window.__wordcell?.current();
    if (current?.kind !== 'active') throw new Error(`store is ${current?.kind}`);
    const text = localStorage.getItem('wordcell:session');
    return { stored: text === null ? null : JSON.parse(text), current: current.session };
  });
}

async function animationFrames(page: Page, count: number): Promise<void> {
  for (let i = 0; i < count; i++) {
    await page.evaluate(
      () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve())),
    );
  }
}

test('R-38 a held word list shows a disabled Loading words… on session-composing.json, then Validate places TAN once ready', async ({
  page,
}) => {
  const held = await answer(page, ['hold']);
  await seedStorage(page, { session: fixture('session-composing.json') });
  await open(page);
  await expect.poll(() => held.length).toBe(1);
  const primary = page.getByTestId('primary-action');
  await expect(primary).toHaveText('Loading words…');
  await expect(primary).toBeDisabled();
  await expect(primary).toHaveCSS('color', await tokenColor(page, '--wc-ink-secondary'));
  expect(await dictionaryState(page)).toBe('loading');

  await held[0]?.continue();
  await waitForDictionary(page, 'ready');
  await expect(primary).toHaveText('Validate');
  await expect(primary).toBeEnabled();
  await primary.click();
  await expect(primary).toHaveText('Confirm');
  const { stored, current } = await activeSession(page);
  expect(current).toMatchObject({ cursor: { index: 0, phase: 'place' } });
  expect(stored).toEqual(current);
});

test("R-38 a word not in the list shows TAN isn't in the word list., stays Composing and stores nothing new; Undo clears it", async ({
  page,
}) => {
  await answer(page, [{ status: 200, body: 'cat\ndog\n' }]);
  const seeded = JSON.parse(fixture('session-composing.json'));
  await seedStorage(page, { session: fixture('session-composing.json') });
  await open(page);
  await waitForDictionary(page, 'ready');
  const primary = page.getByTestId('primary-action');
  await expect(primary).toBeEnabled();
  await primary.click();

  const message = page.getByText("TAN isn't in the word list.", { exact: true });
  await expect(message).toBeVisible();
  await expect(message).toHaveCSS('color', await tokenColor(page, '--wc-error'));
  await expect(message.locator('xpath=preceding-sibling::*[1]')).toHaveAttribute(
    'aria-hidden',
    'true',
  );
  await expect(primary).toHaveText('Validate');
  const { stored, current } = await activeSession(page);
  expect(stored).toEqual(current);
  expect(current).toMatchObject({ moves: seeded.moves, cursor: seeded.cursor });

  await page.getByTestId('undo').click();
  await expect(message).toHaveCount(0);
});

test('§2 AD-8 replay never consults the dictionary: with the word list failing session-place.json restores to Place', async ({
  page,
}) => {
  await page.route(LIST, (route) => route.fulfill({ status: 500, body: '' }));
  await seedStorage(page, { session: fixture('session-place.json') });
  await open(page);
  await waitForDictionary(page, 'failed');
  const banner = page.getByText(BANNER, { exact: true });
  await expect(banner).toBeVisible();
  await expect(banner).toHaveCSS('color', await tokenColor(page, '--wc-error'));
  const primary = page.getByTestId('primary-action');
  await expect(primary).toHaveText('Confirm');

  await page.getByTestId('undo').click();
  await expect(primary).toHaveText('Word list unavailable');
  await expect(primary).toBeDisabled();
  await page.getByTestId('redo').click();
  await expect(primary).toHaveText('Confirm');
  await expect(primary).toBeEnabled();

  await page.reload();
  await expect(page.getByTestId('card-0')).toBeVisible();
  await waitForDictionary(page, 'failed');
  await expect(primary).toHaveText('Confirm');
  expect((await activeSession(page)).current).toMatchObject({ cursor: { phase: 'place' } });
});

test.describe('AD-8 Retry', () => {
  test('AD-8 Reload after a 500 refetches in place: banner hidden and Loading words… while held, then ready, with no page load', async ({
    page,
  }) => {
    const requests = countRequests(page);
    const held = await answer(page, [{ status: 500 }, 'hold']);
    await seedStorage(page, { session: fixture('session-composing.json') });
    await open(page);
    await waitForDictionary(page, 'failed');
    const loads: unknown[] = [];
    page.on('load', (event) => loads.push(event));

    const reload = page.getByRole('button', { name: 'Reload', exact: true });
    await reload.click();
    await expect.poll(() => held.length).toBe(1);
    await expect(page.getByText(BANNER, { exact: true })).toHaveCount(0);
    await expect(reload).toHaveCount(0);
    expect(await dictionaryState(page)).toBe('loading');
    const primary = page.getByTestId('primary-action');
    await expect(primary).toHaveText('Loading words…');
    await expect(primary).toBeDisabled();

    await held[0]?.continue();
    await waitForDictionary(page, 'ready');
    await expect(primary).toHaveText('Validate');
    await expect(primary).toBeEnabled();
    expect(requests).toHaveLength(2);
    expect(loads).toEqual([]);
  });

  test('AD-8 Reload after a 500 that fails again shows the banner again', async ({ page }) => {
    const requests = countRequests(page);
    await answer(page, [{ status: 500 }, { status: 500 }]);
    await seedStorage(page, { session: fixture('session-composing.json') });
    await open(page);
    await waitForDictionary(page, 'failed');
    await page.getByRole('button', { name: 'Reload', exact: true }).click();
    await expect.poll(() => requests.length).toBe(2);
    await waitForDictionary(page, 'failed');
    await expect(page.getByText(BANNER, { exact: true })).toBeVisible();
    await expect(page.getByTestId('primary-action')).toHaveText('Word list unavailable');
  });
});

test('Q-42 AD-8 Reload after a 404 reloads the page', async ({ page }) => {
  await page.route(LIST, (route) => route.fulfill({ status: 404, body: '' }));
  await seedStorage(page, { session: fixture('session-composing.json') });
  await open(page);
  await waitForDictionary(page, 'failed');
  const loaded = page.waitForEvent('load');
  await page.getByRole('button', { name: 'Reload', exact: true }).click();
  await loaded;
  await expect(page.getByTestId('card-0')).toBeVisible();
});

// The real-service-worker proof of this branch stays P7 (epic 7); here the controller is stubbed.
test('AD-8 under a stubbed service-worker controller, Reload after a 404 retries in place with the banner shown and Reload disabled', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      get: () => ({ controller: {} }),
    });
  });
  const held = await answer(page, [{ status: 404 }, 'hold']);
  await seedStorage(page, { session: fixture('session-composing.json') });
  await open(page);
  await waitForDictionary(page, 'failed');
  const loads: unknown[] = [];
  page.on('load', (event) => loads.push(event));

  const reload = page.getByRole('button', { name: 'Reload', exact: true });
  await reload.click();
  await expect.poll(() => held.length).toBe(1);
  await expect(page.getByText(BANNER, { exact: true })).toBeVisible();
  await expect(reload).toBeDisabled();
  expect(await dictionaryState(page)).toBe('loading');
  const primary = page.getByTestId('primary-action');
  await expect(primary).toHaveText('Loading words…');

  await held[0]?.continue();
  await waitForDictionary(page, 'ready');
  await expect(page.getByText(BANNER, { exact: true })).toHaveCount(0);
  await expect(primary).toHaveText('Validate');
  await expect(primary).toBeEnabled();
  expect(loads).toEqual([]);
});

test('AD-8 Timeout: a word list that never answers is loading 29 000 ms after the request and shows the banner by 30 000 ms', async ({
  page,
}) => {
  await page.clock.install();
  const held = await answer(page, ['hold']);
  await open(page);
  await expect.poll(() => held.length).toBe(1);
  await page.clock.runFor(29_000);
  expect(await dictionaryState(page)).toBe('loading');
  await expect(page.getByText(BANNER, { exact: true })).toHaveCount(0);
  await page.clock.runFor(1_000);
  await expect(page.getByText(BANNER, { exact: true })).toBeVisible();
  expect(await dictionaryState(page)).toBe('failed');
});

test.describe('AD-16 dictionary start', () => {
  test('AD-16 the word-list request arrives with card-0 and primary-action in the DOM', async ({
    page,
  }) => {
    const attached: boolean[] = [];
    await page.route(LIST, async (route) => {
      attached.push(
        await page.evaluate(
          () =>
            document.querySelector('[data-testid="card-0"]') !== null &&
            document.querySelector('[data-testid="primary-action"]') !== null,
        ),
      );
      await route.continue();
    });
    await page.goto('/');
    await waitForDictionary(page, 'ready');
    expect(attached).toEqual([true]);
  });

  test('AD-16 a halt during boot (another window, before mount) requests no word list', async ({
    page,
  }) => {
    const requests = countRequests(page);
    const fonts: Route[] = [];
    await page.route('**/*.woff2', (route) => {
      fonts.push(route);
    });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.__wordcell !== undefined);
    expect(await page.evaluate(() => window.__wordcell?.current().kind)).toBe('booting');

    const other = await page.context().newPage();
    await other.goto('/favicon.svg');
    await other.evaluate(() => localStorage.setItem('wordcell:prefs', '{}'));
    await page.waitForFunction(() => window.__wordcell?.current().kind === 'halted');
    await expect.poll(() => fonts.length).toBeGreaterThan(0);
    for (const route of fonts) await route.continue();

    await expect(
      page.getByRole('heading', { name: 'WordCell is open in another window.', exact: true }),
    ).toBeVisible();
    await animationFrames(page, 2);
    expect(requests).toEqual([]);
  });

  test('AD-16 a halt after mount while hidden requests no word list once shown', async ({
    page,
  }) => {
    const requests = countRequests(page);
    await startHidden(page);
    await page.goto('/');
    await expect(page.getByTestId('card-0')).toBeAttached();
    // main.ts is now parked in whenVisible().
    await animationFrames(page, 2);

    const other = await page.context().newPage();
    await other.goto('/favicon.svg');
    await other.evaluate(() => localStorage.setItem('wordcell:prefs', '{}'));
    await page.waitForFunction(() => window.__wordcell?.current().kind === 'halted');
    await showPage(page);
    await animationFrames(page, 2);
    expect(requests).toEqual([]);
  });
});

test('§2 AD-16 a Session-rejected root still loads the word list', async ({ page }) => {
  const requests = countRequests(page);
  await seedStorage(page, { session: fixture('session-invalid-version-unknown.json') });
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: "This saved game can't be opened.", exact: true }),
  ).toBeVisible();
  await waitForDictionary(page, 'ready');
  expect(requests).toHaveLength(1);
});

test('§2 AD-8 a Session-rejected root shows no word-list banner when the list fails', async ({
  page,
}) => {
  await page.route(LIST, (route) => route.fulfill({ status: 500, body: '' }));
  await seedStorage(page, { session: fixture('session-invalid-version-unknown.json') });
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: "This saved game can't be opened.", exact: true }),
  ).toBeVisible();
  await waitForDictionary(page, 'failed');
  await expect(page.getByText(BANNER, { exact: true })).toHaveCount(0);
});
