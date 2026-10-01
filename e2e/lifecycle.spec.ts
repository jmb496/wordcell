import { expect, type Page, test } from '@playwright/test';
import { expectAnotherWindow, kind, stored } from './helpers/blocking';
import { hidePage, pageHide, pageShow, showPage, startHidden } from './helpers/lifecycle';
import { fixture, seedStorage } from './helpers/seed';
import { armStorageSpy, storageWrites } from './helpers/storage-spy';

// Lifecycle and visible-time clock (R-73, R-76, Q-38 back/forward cache) on android. The page
// clock is installed and paused before goto and advanced only with runFor, so stored activeMs
// values are exact.

test.beforeEach(() => {
  test.skip(test.info().project.name !== 'android', 'lifecycle flows run on android');
});

const SESSION = 'wordcell:session';
const HISTORY = 'wordcell:history';

async function storedActiveMs(page: Page): Promise<number> {
  const text = await stored(page, SESSION);
  if (text === null) throw new Error('wordcell:session is absent');
  return (JSON.parse(text) as { activeMs: number }).activeMs;
}

const seededMs = (name: string) => (JSON.parse(fixture(name)) as { activeMs: number }).activeMs;

// The page clock paused before goto (as e2e/blocking.spec.ts does); time moves only by runFor.
async function pausedClock(page: Page): Promise<void> {
  await page.clock.install({ time: 0 });
  await page.clock.pauseAt(1000);
}

// Seeds `name` (unless null), loads and waits for a settled boot.
async function open(page: Page, name: string | null): Promise<void> {
  await pausedClock(page);
  if (name !== null) await seedStorage(page, { session: fixture(name) });
  await page.goto('/');
  await page.waitForFunction(() => {
    const hook = window.__wordcell;
    return hook !== undefined && hook.current().kind !== 'booting';
  });
}

// The spy log's wordcell:session entries' activeMs, asserting the log holds only that key.
async function sessionEntries(page: Page): Promise<number[]> {
  const writes = await storageWrites(page);
  for (const write of writes) expect(write.key).toBe(SESSION);
  return writes.map(({ value }) => (JSON.parse(value ?? 'null') as { activeMs: number }).activeMs);
}

test.describe('R-73 saved when hidden', () => {
  test('R-73 AD-17 hidePage alone writes exactly one wordcell:session entry', async ({ page }) => {
    await open(page, 'session-place.json');
    await armStorageSpy(page);
    await hidePage(page);
    const writes = await storageWrites(page);
    expect(writes).toHaveLength(1);
    expect(writes[0]?.key).toBe(SESSION);
  });

  test('R-73 pageHide alone writes the accrued activeMs', async ({ page }) => {
    await open(page, 'session-place.json');
    await armStorageSpy(page);
    await page.clock.runFor(1234);
    await pageHide(page);
    expect(await sessionEntries(page)).toEqual([seededMs('session-place.json') + 1234]);
  });

  test('R-73 activeMs is flushed on hide, not on ticks', async ({ page }) => {
    await open(page, 'session-place.json');
    await armStorageSpy(page);
    await page.clock.runFor(5000);
    expect(await storageWrites(page)).toEqual([]);
  });

  test('R-73 the hide flush assigns the accrued Session', async ({ page }) => {
    await open(page, 'session-place.json');
    await page.clock.runFor(300);
    await hidePage(page);
    await showPage(page);
    await page.clock.runFor(500);
    await page.getByTestId('undo').click();
    await expect(page.getByTestId('redo')).toBeEnabled();
    expect(await storedActiveMs(page)).toBe(seededMs('session-place.json') + 300 + 500);
  });
});

test.describe('R-76 visible-time clock', () => {
  test('R-76 time grows only while visible', async ({ page }) => {
    await open(page, 'session-place.json');
    await page.clock.runFor(1000);
    await hidePage(page);
    await page.clock.runFor(7000);
    await showPage(page);
    await page.clock.runFor(250);
    await hidePage(page);
    expect(await storedActiveMs(page)).toBe(seededMs('session-place.json') + 1000 + 250);
  });

  for (const name of ['session-won.json', 'session-gave-up.json']) {
    test(`R-76 a won or given-up Session keeps its activeMs (${name})`, async ({ page }) => {
      await open(page, name);
      await armStorageSpy(page);
      await page.clock.runFor(2000);
      await hidePage(page);
      expect(await sessionEntries(page)).toEqual([seededMs(name)]);
    });
  }

  test('R-76 a fresh first-launch deal grows', async ({ page }) => {
    await open(page, null);
    await armStorageSpy(page);
    await page.clock.runFor(1500);
    await hidePage(page);
    expect(await sessionEntries(page)).toEqual([1500]);
  });

  test('R-76 AD-17 a page loaded hidden does not grow until showPage', async ({ page }) => {
    await startHidden(page);
    await open(page, 'session-place.json');
    await armStorageSpy(page);
    await page.clock.runFor(4000);
    await pageHide(page);
    const seeded = seededMs('session-place.json');
    expect(await sessionEntries(page)).toEqual([seeded]);
    expect(await storedActiveMs(page)).toBe(seeded);
    await showPage(page);
    await page.clock.runFor(600);
    await hidePage(page);
    expect(await sessionEntries(page)).toEqual([seeded, seeded + 600]);
    expect(await storedActiveMs(page)).toBe(seeded + 600);
  });

  test('R-76 AD-17 pageShow not persisted while hidden does not resume', async ({ page }) => {
    await open(page, 'session-place.json');
    await armStorageSpy(page);
    await page.clock.runFor(800);
    await hidePage(page);
    await pageShow(page, { persisted: false });
    await page.clock.runFor(3000);
    await pageHide(page);
    const seeded = seededMs('session-place.json');
    expect(await sessionEntries(page)).toEqual([seeded + 800, seeded + 800]);
  });

  test('R-76 R-84 a finish records the visible-time activeMs of the Session', async ({ page }) => {
    await open(page, 'session-won.json');
    expect(seededMs('session-won.json')).toBe(0);
    await page.getByTestId('undo').click();
    await expect(page.getByTestId('redo')).toBeEnabled();
    await page.clock.runFor(2500);
    await page.getByTestId('redo').click();
    await expect(page.getByTestId('redo')).toBeDisabled();
    const { history, session } = await page.evaluate((k) => {
      const current = window.__wordcell?.current();
      if (current?.kind !== 'active') throw new Error(`store is ${current?.kind}`);
      return { history: localStorage.getItem(k), session: current.session };
    }, HISTORY);
    const records = (JSON.parse(history ?? 'null') as { records: { activeMs: number }[] }).records;
    expect(records).toHaveLength(1);
    expect(records[0]?.activeMs).toBe(2500);
    expect(records[0]?.activeMs).toBe(session.activeMs);
  });

  test('R-74 R-76 New game starts at activeMs 0 with the discarded take', async ({ page }) => {
    await open(page, 'session-gave-up.json');
    await page.clock.runFor(900);
    const primary = page.getByTestId('primary-action');
    await expect(primary).toHaveText('New game');
    await primary.click();
    // AD-8: a plain Validate label needs the word list; the runFor above fired the double rAF that
    // starts it, and the paused clock stops rAF-polled waits, so poll from the runner.
    await expect
      .poll(() => page.evaluate(() => window.__wordcell?.dictionaryState()))
      .toBe('ready');
    await expect(primary).toHaveText('Validate');
    await page.clock.runFor(350);
    await hidePage(page);
    expect(await storedActiveMs(page)).toBe(350);
  });
});

test.describe('Q-38 back/forward cache', () => {
  test('Q-38 a persisted pageshow after a same-page key change halts', async ({ page }) => {
    await open(page, 'session-place.json');
    await page.evaluate(([k, v]) => localStorage.setItem(k, v), [
      SESSION,
      fixture('session-won.json'),
    ] as const);
    expect(await kind(page)).toBe('active');
    await pageShow(page, { persisted: true });
    await expectAnotherWindow(page);
  });

  test('Q-38 a persisted pageshow after a same-page wordcell:history write (absent → present) halts', async ({
    page,
  }) => {
    await open(page, 'session-place.json');
    expect(await page.evaluate((k) => localStorage.getItem(k), HISTORY)).toBeNull();
    await page.evaluate(([k, v]) => localStorage.setItem(k, v), [
      HISTORY,
      fixture('history-three-records.json'),
    ] as const);
    expect(await kind(page)).toBe('active');
    await pageShow(page, { persisted: true });
    await expectAnotherWindow(page);
  });

  test('Q-38 a persisted pageshow after an own dispatch stays active', async ({ page }) => {
    await open(page, 'session-place.json');
    await page.getByTestId('undo').click();
    await expect(page.getByTestId('redo')).toBeEnabled();
    await page.clock.runFor(700);
    await pageHide(page);
    await pageShow(page, { persisted: true });
    expect(await kind(page)).toBe('active');
    await expect(page.getByRole('alertdialog')).toHaveCount(0);
  });

  test('Q-38 a persisted pageshow right after an own dispatch (no pageHide) stays active', async ({
    page,
  }) => {
    await open(page, 'session-place.json');
    await page.getByTestId('undo').click();
    await expect(page.getByTestId('redo')).toBeEnabled();
    await pageShow(page, { persisted: true });
    expect(await kind(page)).toBe('active');
    await expect(page.getByRole('alertdialog')).toHaveCount(0);
  });

  test('Q-38 a persisted pageshow after an own finish (wordcell:history written) stays active', async ({
    page,
  }) => {
    await open(page, 'session-won.json');
    await page.getByTestId('undo').click();
    await expect(page.getByTestId('redo')).toBeEnabled();
    expect(await stored(page, HISTORY)).toBeNull();
    await page.getByTestId('redo').click();
    await expect(page.getByTestId('redo')).toBeDisabled();
    expect(await stored(page, HISTORY)).not.toBeNull();
    await pageHide(page);
    await pageShow(page, { persisted: true });
    expect(await kind(page)).toBe('active');
    await expect(page.getByRole('alertdialog')).toHaveCount(0);
  });
});

test('AD-15 halted: the hide flush writes nothing', async ({ page }) => {
  await open(page, 'session-place.json');
  await page.evaluate(([k, v]) => localStorage.setItem(k, v), [
    SESSION,
    fixture('session-won.json'),
  ] as const);
  await pageShow(page, { persisted: true });
  await expectAnotherWindow(page);
  await armStorageSpy(page);
  await page.clock.runFor(500);
  await hidePage(page);
  await pageHide(page);
  expect(await storageWrites(page)).toEqual([]);
});

test('§2 rejected: the hide flush writes nothing', async ({ page }) => {
  const text = fixture('session-invalid-version-unknown.json');
  await open(page, 'session-invalid-version-unknown.json');
  expect(await kind(page)).toBe('rejected');
  await armStorageSpy(page);
  await page.clock.runFor(500);
  await hidePage(page);
  await pageHide(page);
  expect(await storageWrites(page)).toEqual([]);
  expect(await stored(page, SESSION)).toBe(text);
});
