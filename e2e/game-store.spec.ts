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

// AD-8: the word list has loaded (plain Validate labels need it).
async function dictionaryReady(page: Page): Promise<void> {
  await page.waitForFunction(() => window.__wordcell?.dictionaryState() === 'ready');
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
  expect(snap.loaded).toEqual({ session: null, history: null });
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

test('R-73 Undo, Validate, Redo and Confirm on session-place.json are each stored before the next action', async ({
  page,
}) => {
  await seedStorage(page, { session: fixture('session-place.json') });
  await open(page);
  // The real word list contains TAN (R-38).
  await dictionaryReady(page);
  const undo = page.getByRole('button', { name: 'Undo', exact: true });
  const redo = page.getByRole('button', { name: 'Redo', exact: true });
  const primary = page.getByTestId('primary-action');
  await expect(redo).toBeDisabled();
  let before = sessionOf(await snapshot(page));
  expect(before).toEqual(JSON.parse(fixture('session-place.json')));
  for (const step of ['undo', 'validate', 'undo', 'redo', 'confirm'] as const) {
    if (step === 'validate') {
      await expect(primary).toHaveText('Validate');
      await expect(primary).toBeEnabled();
    }
    if (step === 'confirm') {
      // Confirm is the primary action, enabled in Place (R-42).
      await expect(primary).toHaveText('Confirm');
      await expect(primary).toBeEnabled();
    }
    await { undo, redo, validate: primary, confirm: primary }[step].click();
    const snap = await snapshot(page);
    const after = sessionOf(snap);
    expect(snap.stored).toEqual(after);
    expect(after).not.toEqual(before);
    before = after;
    if (step === 'undo') await expect(redo).toBeEnabled();
    if (step === 'redo') await expect(redo).toBeDisabled();
    if (step === 'validate') {
      // R-38: Validate enters Place and discards the redo data.
      expect(after).toMatchObject({ cursor: { phase: 'place' } });
      await expect(primary).toHaveText('Confirm');
      await expect(redo).toBeDisabled();
    }
    if (step === 'confirm') {
      // R-42: Confirm commits the one move and returns to Idle.
      expect(after).toMatchObject({ cursor: { index: 1, phase: 'idle' } });
      expect((after as { moves: unknown[] }).moves).toHaveLength(1);
      await expect(primary).toHaveText('Validate');
    }
  }
});

test('R-74 R-73 Q-29 game-over New game on session-gave-up.json stores a fresh Session at once', async ({
  page,
}) => {
  const historyText = fixture('history-three-records.json');
  await seedStorage(page, { session: fixture('session-gave-up.json'), history: historyText });
  await open(page);
  const primary = page.getByTestId('primary-action');
  await expect(primary).toHaveText('New game');
  await expect(primary).toBeEnabled();
  await primary.click();
  const snap = await snapshot(page);
  expect(snap.stored).toEqual(sessionOf(snap));
  const { version } = JSON.parse(fixture('session-idle-fresh.json')) as { version: number };
  expect(snap.stored).toEqual({
    version,
    seed: expect.any(Number),
    moves: [],
    cursor: { index: 0, phase: 'idle' },
    gaveUp: false,
    activeMs: 0,
  });
  const { seed } = snap.stored as { seed: number };
  expect(Number.isInteger(seed)).toBe(true);
  expect(seed).toBeGreaterThanOrEqual(0);
  expect(seed).toBeLessThanOrEqual(4294967295);
  // Q-29: New game leaves the score history untouched.
  expect(await page.evaluate(() => localStorage.getItem('wordcell:history'))).toBe(historyText);
  await dictionaryReady(page);
  await expect(primary).toHaveText('Validate');
  await expect(primary).toBeDisabled();
});

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

type Dictionary = 'held' | 'failing' | 'ready';

// AD-8: hold the word list (never answered), fail it (500) or let the real list through.
async function routeDictionary(page: Page, dictionary: Dictionary): Promise<void> {
  if (dictionary === 'held') await page.route('**/en*.txt', () => {});
  if (dictionary === 'failing') {
    await page.route('**/en*.txt', (route) => route.fulfill({ status: 500, body: '' }));
  }
}

// Primary-action label per Session fixture and dictionary state (EXPERIENCE.md Validate
// precedence); `reason` is the ink-secondary disabled-reason style.
type Row = [
  fixture: string,
  dictionary: Dictionary,
  label: string,
  enabled: boolean,
  reason: boolean,
];
const LABELS: Row[] = [
  ['session-idle-fresh.json', 'held', 'Loading words…', false, true],
  ['session-idle-fresh.json', 'failing', 'Word list unavailable', false, true],
  ['session-idle-fresh.json', 'ready', 'Validate', false, false],
  ['session-idle-pending-draft.json', 'held', 'Loading words…', false, true],
  ['session-idle-pending-draft.json', 'failing', 'Word list unavailable', false, true],
  ['session-idle-pending-draft.json', 'ready', 'Validate', false, false],
  ['session-composing-draft-2-letters.json', 'held', 'Loading words…', false, true],
  ['session-composing-draft-2-letters.json', 'failing', 'Word list unavailable', false, true],
  ['session-composing-draft-2-letters.json', 'ready', 'Need 3+ letters', false, true],
  ['session-composing.json', 'held', 'Loading words…', false, true],
  ['session-composing.json', 'failing', 'Word list unavailable', false, true],
  ['session-composing.json', 'ready', 'Validate', true, false],
  ['session-place.json', 'held', 'Confirm', true, false],
  ['session-place.json', 'failing', 'Confirm', true, false],
  ['session-place.json', 'ready', 'Confirm', true, false],
  ['session-gave-up.json', 'held', 'New game', true, false],
  ['session-gave-up.json', 'failing', 'New game', true, false],
  ['session-won.json', 'held', 'New game', true, false],
  ['session-won.json', 'failing', 'New game', true, false],
];

for (const [name, dictionary, label, enabled, reason] of LABELS) {
  test(`R-38 AD-3 primary-action on ${name} with the word list ${dictionary} reads ${label}, ${enabled ? 'enabled' : 'disabled'}`, async ({
    page,
  }) => {
    await routeDictionary(page, dictionary);
    await seedStorage(page, { session: fixture(name) });
    await open(page);
    const state = { held: 'loading', failing: 'failed', ready: 'ready' }[dictionary];
    await page.waitForFunction(
      (expected) => window.__wordcell?.dictionaryState() === expected,
      state,
    );
    const primary = page.getByTestId('primary-action');
    await expect(primary).toHaveText(label);
    if (enabled) await expect(primary).toBeEnabled();
    else await expect(primary).toBeDisabled();
    if (!enabled) {
      // DESIGN.md Ink: a disabled reason reads in ink-secondary, plain Validate in ink-disabled.
      const token = reason ? '--wc-ink-secondary' : '--wc-ink-disabled';
      await expect(primary).toHaveCSS('color', await tokenColor(page, token));
    }
    if (name === 'session-composing-draft-2-letters.json' && dictionary === 'ready') {
      // Undo leaves Idle with a 2-letter pending draft: plain Validate.
      await page.getByRole('button', { name: 'Undo', exact: true }).click();
      await expect
        .poll(async () => sessionOf(await snapshot(page)))
        .toMatchObject({
          cursor: { phase: 'idle' },
        });
      await expect(primary).toHaveText('Validate');
      await expect(primary).toBeDisabled();
      await expect(primary).toHaveCSS('color', await tokenColor(page, '--wc-ink-disabled'));
    }
  });
}

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
  expect(restored.loaded).toEqual({ session: written, history: null });
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
