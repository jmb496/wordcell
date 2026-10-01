import { expect, type Page, test } from '@playwright/test';
import { fixture, seedStorage } from './helpers/seed';
import { armStorageSpy, storageWrites } from './helpers/storage-spy';

// Score-history writes (R-84, Q-39, AD-7, §2 unreadable history) through the AD-17 hook, on
// android.

test.beforeEach(() => {
  test.skip(test.info().project.name !== 'android', 'score-history flows run on android');
});

const SESSION = 'wordcell:session';
const HISTORY = 'wordcell:history';
const EMPTY_TEXT = '{"version":1,"records":[]}';
const FATAL = 'Something went wrong.';

type StoredRecord = { seed: number; outcome: string; activeMs: number; [key: string]: unknown };
type Stored = { session: string | null; history: string | null };

const stored = (page: Page, key: string) => page.evaluate((k) => localStorage.getItem(k), key);

async function readBoth(page: Page): Promise<Stored> {
  return { session: await stored(page, SESSION), history: await stored(page, HISTORY) };
}

// Clicks the `testid` button and reads both keys in the same task (the write happens at once).
function clickAndRead(page: Page, testid: string): Promise<Stored> {
  return page.evaluate(
    ([id, keys]) => {
      const button = document.querySelector<HTMLButtonElement>(`[data-testid="${id}"]`);
      if (button === null) throw new Error(`no ${id} button`);
      button.click();
      return { session: localStorage.getItem(keys[0]), history: localStorage.getItem(keys[1]) };
    },
    [testid, [SESSION, HISTORY]] as const,
  );
}

async function current(page: Page) {
  const now = await page.evaluate(() => window.__wordcell?.current());
  if (now?.kind !== 'active') throw new Error(`store is ${now?.kind}`);
  return now;
}

async function open(page: Page): Promise<void> {
  await page.goto('/');
  await expect(page.getByTestId('card-0')).toBeVisible();
}

// The index of the first spy-log entry for `key`; throws when there is none.
function indexOf(writes: { key: string }[], key: string): number {
  const index = writes.findIndex((write) => write.key === key);
  if (index < 0) throw new Error(`no ${key} write`);
  return index;
}

function withoutActiveMs(record: unknown): unknown {
  const { activeMs: _ms, ...rest } = record as StoredRecord;
  return rest;
}

// Copied from e2e/blocking.spec.ts (specs do not import each other).
async function expectFatal(page: Page, body: string): Promise<void> {
  const dialog = page.getByRole('alertdialog');
  await expect(dialog).toHaveCount(1);
  await expect(dialog.getByRole('heading', { name: FATAL, exact: true })).toBeVisible();
  await expect(dialog).toHaveAccessibleDescription(body);
  expect(await page.evaluate(() => window.__wordcell?.current().kind)).toBe('halted');
}

test.describe('R-84 finish writes', () => {
  test('R-84 a Redo onto a win on session-won.json appends its record before the Session in the same task; Undo removes it', async ({
    page,
  }) => {
    await seedStorage(page, { session: fixture('session-won.json') });
    await open(page);
    await page.getByTestId('undo').click();
    await expect(page.getByTestId('redo')).toBeEnabled();
    const before = await readBoth(page);
    expect(before.history).toBeNull();
    await armStorageSpy(page);
    const after = await clickAndRead(page, 'redo');
    expect(after.session).not.toBe(before.session);
    expect(after.history).not.toBeNull();
    const writes = await storageWrites(page);
    expect(writes.map(({ key }) => key)).toEqual([HISTORY, SESSION]);
    expect(indexOf(writes, HISTORY)).toBeLessThan(indexOf(writes, SESSION));
    const now = await current(page);
    if (!('records' in now.history)) throw new Error('history is unreadable');
    const record = now.history.records[0] as unknown as StoredRecord;
    expect(JSON.parse(after.history ?? '')).toEqual({ version: 1, records: [record] });
    expect(record.seed).toBe(now.session.seed);
    expect(record.outcome).toBe('won');
    expect(record.activeMs).toBe(now.session.activeMs);
    const fixtureRecord = JSON.parse(fixture('history-three-records.json')).records[0];
    expect(withoutActiveMs(record)).toEqual(withoutActiveMs(fixtureRecord));
    await page.getByTestId('undo').click();
    expect(await stored(page, HISTORY)).toBe(EMPTY_TEXT);
  });

  test('R-84 an Undo on session-gave-up.json removes its last record from history-three-records.json before the Session', async ({
    page,
  }) => {
    const historyText = fixture('history-three-records.json');
    await seedStorage(page, { session: fixture('session-gave-up.json'), history: historyText });
    await open(page);
    const before = await readBoth(page);
    await armStorageSpy(page);
    const after = await clickAndRead(page, 'undo');
    expect(after.session).not.toBe(before.session);
    const seeded = JSON.parse(historyText) as { version: number; records: unknown[] };
    expect(JSON.parse(after.history ?? '')).toEqual({
      ...seeded,
      records: seeded.records.slice(0, -1),
    });
    const writes = await storageWrites(page);
    expect(writes.map(({ key }) => key)).toEqual([HISTORY, SESSION]);
    expect((await current(page)).history).toEqual(JSON.parse(after.history ?? ''));
  });
});

test.describe('Q-39 history write-back', () => {
  test('Q-39 (a) a throwing Session write after a finish removes the history it added', async ({
    page,
  }) => {
    await seedStorage(page, { session: fixture('session-won.json') });
    await open(page);
    await page.getByTestId('undo').click();
    await expect(page.getByTestId('redo')).toBeEnabled();
    const sessionBefore = await stored(page, SESSION);
    await armStorageSpy(page, { throwOn: SESSION });
    await page.getByTestId('redo').click();
    await expectFatal(page, `storage-spy: ${SESSION}`);
    expect(await storageWrites(page)).toEqual([
      { key: HISTORY, value: expect.any(String) },
      { key: SESSION, value: expect.any(String) },
      { key: HISTORY, value: null },
    ]);
    expect(await stored(page, HISTORY)).toBeNull();
    expect(await stored(page, SESSION)).toBe(sessionBefore);
  });

  test('Q-39 (b) a throwing Session write after an un-finish writes the seeded history back', async ({
    page,
  }) => {
    const historyText = fixture('history-three-records.json');
    await seedStorage(page, { session: fixture('session-gave-up.json'), history: historyText });
    await open(page);
    const sessionBefore = await stored(page, SESSION);
    await armStorageSpy(page, { throwOn: SESSION });
    await page.getByTestId('undo').click();
    await expectFatal(page, `storage-spy: ${SESSION}`);
    const writes = await storageWrites(page);
    expect(writes.map(({ key }) => key)).toEqual([HISTORY, SESSION, HISTORY]);
    const seeded = JSON.parse(historyText) as { version: number; records: unknown[] };
    expect(JSON.parse(writes[0]?.value ?? '')).toEqual({
      ...seeded,
      records: seeded.records.slice(0, -1),
    });
    expect(writes[2]?.value).toBe(historyText);
    expect(await stored(page, HISTORY)).toBe(historyText);
    expect(await stored(page, SESSION)).toBe(sessionBefore);
  });
});

test.describe('AD-7 absent history', () => {
  test('AD-7 a fresh launch leaves wordcell:history absent', async ({ page }) => {
    await open(page);
    expect(await stored(page, SESSION)).not.toBeNull();
    expect(await stored(page, HISTORY)).toBeNull();
  });

  test('AD-7 Undo, Redo and Confirm on session-place.json leave wordcell:history absent', async ({
    page,
  }) => {
    await seedStorage(page, { session: fixture('session-place.json') });
    await open(page);
    const undo = page.getByTestId('undo');
    const redo = page.getByTestId('redo');
    const primary = page.getByTestId('primary-action');
    await undo.click();
    await expect(redo).toBeEnabled();
    expect(await stored(page, HISTORY)).toBeNull();
    await redo.click();
    await expect(redo).toBeDisabled();
    expect(await stored(page, HISTORY)).toBeNull();
    await expect(primary).toHaveText('Confirm');
    await primary.click();
    await expect(primary).toHaveText('Validate');
    expect(await stored(page, HISTORY)).toBeNull();
  });

  test('AD-7 New game on session-gave-up.json leaves wordcell:history absent', async ({ page }) => {
    await seedStorage(page, { session: fixture('session-gave-up.json') });
    await open(page);
    const primary = page.getByTestId('primary-action');
    await expect(primary).toHaveText('New game');
    await primary.click();
    await expect(primary).toHaveText('Validate');
    expect(await stored(page, HISTORY)).toBeNull();
  });

  test('AD-7 an un-finish of session-won.json with nothing to remove writes only the Session; Redo, Undo leave the empty history', async ({
    page,
  }) => {
    await seedStorage(page, { session: fixture('session-won.json') });
    await open(page);
    await armStorageSpy(page);
    await page.getByTestId('undo').click();
    await expect(page.getByTestId('redo')).toBeEnabled();
    expect(await stored(page, HISTORY)).toBeNull();
    expect((await storageWrites(page)).map(({ key }) => key)).toEqual([SESSION]);
    await page.getByTestId('redo').click();
    await expect(page.getByTestId('redo')).toBeDisabled();
    await page.getByTestId('undo').click();
    await expect(page.getByTestId('redo')).toBeEnabled();
    expect(await stored(page, HISTORY)).toBe(EMPTY_TEXT);
  });
});

test('§2 an unreadable history (history-invalid-version-unknown.json) is never overwritten and the finishing game is unrecorded', async ({
  page,
}) => {
  const historyText = fixture('history-invalid-version-unknown.json');
  await seedStorage(page, { session: fixture('session-won.json'), history: historyText });
  await open(page);
  const primary = page.getByTestId('primary-action');
  // The History notice opens at boot (§2); dismiss it before touching the board.
  await page.getByRole('button', { name: 'Not now', exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => (history.state as { wc: number } | null)?.wc))
    .toBe(0);
  await page.getByTestId('undo').click();
  await expect(page.getByTestId('redo')).toBeEnabled();
  expect(await stored(page, HISTORY)).toBe(historyText);
  const sessionBefore = await stored(page, SESSION);
  await armStorageSpy(page);
  await page.getByTestId('redo').click();
  await expect(primary).toHaveText('New game');
  const now = await current(page);
  const won = JSON.parse(fixture('session-won.json'));
  expect({ ...now.session, activeMs: 0 }).toEqual({ ...won, activeMs: 0 });
  expect(now.history).toEqual({ rejected: { reason: 'version-unknown', version: 2 } });
  expect(await stored(page, SESSION)).not.toBe(sessionBefore);
  expect((await storageWrites(page)).filter(({ key }) => key === HISTORY)).toEqual([]);
  expect(await stored(page, HISTORY)).toBe(historyText);
  const rejected = { rejected: { reason: 'version-unknown', version: 2 } };
  await primary.click();
  await expect(primary).toHaveText('Validate');
  expect(await stored(page, HISTORY)).toBe(historyText);
  expect((await current(page)).history).toEqual(rejected);
  await page.reload();
  await expect(page.getByTestId('card-0')).toBeVisible();
  expect(await stored(page, HISTORY)).toBe(historyText);
  expect((await page.evaluate(() => window.__wordcell?.loaded()))?.history).toEqual(rejected);
  expect((await current(page)).history).toEqual(rejected);
});

test('AD-15 a throwing Delete history halts over the History notice and Reset confirm: Reload focused, no dialog, wc 2, history bytes unchanged', async ({
  page,
}) => {
  const historyText = fixture('history-invalid-version-unknown.json');
  await seedStorage(page, { history: historyText });
  await open(page);
  await page.getByRole('button', { name: 'Reset history', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Delete the score history?' })).toBeVisible();
  const wc = () => page.evaluate(() => (history.state as { wc: number } | null)?.wc);
  await expect.poll(wc).toBe(2);
  await armStorageSpy(page, { throwOn: HISTORY });
  await page.getByRole('button', { name: 'Delete history', exact: true }).click();
  await expectFatal(page, `storage-spy: ${HISTORY}`);
  await expect(page.getByRole('button', { name: 'Reload', exact: true })).toBeFocused();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(await wc()).toBe(2);
  expect(await stored(page, HISTORY)).toBe(historyText);
});
