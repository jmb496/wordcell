import { expect, type Page, test } from '@playwright/test';
import { fixture, seedStorage } from './helpers/seed';

// Game store load, dispatch and storage (R-73, R-74) through the AD-17 hook, on android.

test.beforeEach(() => {
  test.skip(test.info().project.name !== 'android', 'R-73/R-74 store flows run on android');
});

type Snapshot = {
  stored: unknown;
  current: ReturnType<NonNullable<Window['__wordcell']>['current']>;
  loaded: ReturnType<NonNullable<Window['__wordcell']>['loaded']>;
};

// Reads the stored Session (JSON.parse of wordcell:session) and the hook's views in one task.
function snapshot(page: Page): Promise<Snapshot> {
  return page.evaluate(() => {
    const hook = window.__wordcell;
    if (hook === undefined) throw new Error('window.__wordcell is missing');
    const text = localStorage.getItem('wordcell:session');
    return {
      stored: text === null ? null : JSON.parse(text),
      current: hook.current(),
      loaded: hook.loaded(),
    };
  });
}

function sessionOf(snap: Snapshot): unknown {
  if (snap.current.kind !== 'active') throw new Error(`store is ${snap.current.kind}`);
  return snap.current.session;
}

async function open(page: Page, url = '/'): Promise<void> {
  await page.goto(url);
  await expect(page.getByRole('heading', { name: 'WordCell' })).toBeVisible();
}

test('R-74 a fresh context stores a uint32-seeded Session before any input, equal to current().session, loaded().session null', async ({
  page,
}) => {
  await open(page);
  const snap = await snapshot(page);
  expect(snap.stored).not.toBeNull();
  expect(snap.stored).toEqual(sessionOf(snap));
  const { seed } = snap.stored as { seed: unknown };
  expect(Number.isInteger(seed)).toBe(true);
  expect(seed).toBeGreaterThanOrEqual(0);
  expect(seed).toBeLessThanOrEqual(4294967295);
  expect(snap.stored).toMatchObject({
    moves: [],
    activeMs: 0,
    gaveUp: false,
    cursor: { index: 0, phase: 'idle' },
  });
  expect(snap.loaded).toEqual({ session: null });
});

test('R-74 two fresh contexts get different seeds', async ({ page, browser }) => {
  await open(page);
  const other = await browser.newContext();
  try {
    const page2 = await other.newPage();
    await open(page2, page.url());
    const seeds = [];
    for (const p of [page, page2]) {
      seeds.push((sessionOf(await snapshot(p)) as { seed: number }).seed);
    }
    expect(seeds[0]).not.toBe(seeds[1]);
  } finally {
    await other.close();
  }
});

test('R-73 Undo and Redo on session-place.json are each stored before the next action', async ({
  page,
}) => {
  await seedStorage(page, { session: fixture('session-place.json') });
  await open(page);
  const undo = page.getByRole('button', { name: 'Undo', exact: true });
  const redo = page.getByRole('button', { name: 'Redo', exact: true });
  await expect(redo).toBeDisabled();
  let before = sessionOf(await snapshot(page));
  expect(before).toEqual(JSON.parse(fixture('session-place.json')));
  for (const button of [undo, redo]) {
    await button.click();
    const snap = await snapshot(page);
    const after = sessionOf(snap);
    expect(snap.stored).toEqual(after);
    expect(after).not.toEqual(before);
    before = after;
    if (button === undo) await expect(redo).toBeEnabled();
  }
});

test('R-73 kill variant: an Undo on session-place-free-letter-redo-tail.json survives a renderer crash', async ({
  page,
}) => {
  const seeded = JSON.parse(fixture('session-place-free-letter-redo-tail.json'));
  await seedStorage(page, { session: fixture('session-place-free-letter-redo-tail.json') });
  await open(page);
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  const snap = await snapshot(page);
  const written = snap.stored;
  expect(written).toEqual(sessionOf(snap));
  expect(written).not.toEqual(seeded);

  // CDP Page.crash fires no unload events; the call itself never resolves normally.
  const cdp = await page.context().newCDPSession(page);
  const crashed = page.waitForEvent('crash');
  cdp.send('Page.crash').catch(() => undefined);
  await crashed;

  const page2 = await page.context().newPage();
  await open(page2);
  const restored = await snapshot(page2);
  expect(restored.loaded).toEqual({ session: written });
  expect(sessionOf(restored)).toEqual(written);
});

test('R-73 a dispatch-and-reload session makes no off-origin and no non-GET request', async ({
  page,
}) => {
  const requests: { method: string; url: string }[] = [];
  page
    .context()
    .on('request', (request) => requests.push({ method: request.method(), url: request.url() }));
  await seedStorage(page, { session: fixture('session-place.json') });
  await open(page);
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'WordCell' })).toBeVisible();
  await page.waitForLoadState('networkidle');
  const origin = new URL(page.url()).origin;
  expect(requests.length).toBeGreaterThan(0);
  expect(requests.filter((r) => r.method !== 'GET' || new URL(r.url).origin !== origin)).toEqual(
    [],
  );
});
