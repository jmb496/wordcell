import { expect, test } from '@playwright/test';
import { glidesSettled, trayIds } from '../helpers/board';
import { expectNoPrompt } from '../helpers/live-region';
import { composeTan, dealNewGame, pinNextSeed, seedPins, TAN_TRAY } from '../helpers/offline';
import {
  booted,
  isList,
  type Key,
  sessionOf,
  snapshot,
  waitForDictionary,
} from '../helpers/restore';
import { fixture, seedStorage } from '../helpers/seed';

// Epic 7 CAP-4 (ticket 7.6; brief §6.8): with the precache complete, `dist-test/` reloads with the
// network off, restores the game (AD-17 Reading state, as e2e/restore.spec.ts), shows no prompt
// (AD-16), then deals a new game (seed pinned to 1 by e2e/helpers/offline.ts) and validates a word.
// The `dist/` case is the same test in e2e/pwa/dist-smoke.spec.ts, minus the hook reads.

// F6: the worker must run and control the reloaded page; set explicitly, not left to the default.
test.use({ serviceWorkers: 'allow' });

// Playwright's default 30 s is short for the 15 s precache wait plus two composes and a reload.
const TEST_TIMEOUT_MS = 60_000;
const PRECACHE_POLL_MS = 15_000;

// Copy of e2e/restore.spec.ts DEFAULTS (SPEC CAP-10): current() reports these in-memory defaults
// for a never-written key. Mirrors src/shell/prefs.svelte.ts DEFAULTS and
// src/shell/history.svelte.ts EMPTY, the score-history store's never-written default (change
// together).
const DEFAULTS = {
  history: { version: 1, records: [] },
  prefs: { version: 1, animationSpeed: 'normal', showTimer: false, theme: 'default' },
};

const FIELDS = [
  ['history', 'wordcell:history'],
  ['prefs', 'wordcell:prefs'],
] as const satisfies readonly (readonly [string, Key])[];

const activeMsOf = (session: unknown) => (session as { activeMs: number }).activeMs;

test('AD-16 AD-17 offline after the precache is complete: a reload restores the game with no prompt, then deals and validates a word', async ({
  page,
  context,
}) => {
  test.setTimeout(TEST_TIMEOUT_MS);
  // AD-15: console is not checked (offline network errors log there).
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.stack ?? error.message));
  await pinNextSeed(page);
  await seedStorage(page, { session: fixture('session-idle-fresh.json') }, { captureBoot: true });
  await page.goto('/');
  await expect(page.locator('[data-card-id]')).toHaveCount(52);
  await booted(page);

  // 1. The move, online.
  await composeTan(page);

  // 2. The precache is complete; never polled again (offline, a recompute fetches /sw.js).
  await expect
    .poll(() => page.evaluate(() => window.__wordcell?.precacheComplete()), {
      timeout: PRECACHE_POLL_MS,
    })
    .toBe(true);

  // 3. Before-state.
  const before = await snapshot(page);

  // 4. Offline reload, served by the worker.
  await context.setOffline(true);
  // One call, so neither promise is left pending if the other rejects.
  const [response, listResponse] = await Promise.all([
    page.reload(),
    page.waitForResponse((r) => isList(r.request())),
  ]);
  expect(response?.fromServiceWorker(), 'the reload is served by the worker').toBe(true);
  expect(listResponse.fromServiceWorker(), 'the word list is served by the worker').toBe(true);

  // 5. Restore (AD-17 Reading state).
  await booted(page);
  expect(await page.evaluate(() => window.__wordcell?.current().kind)).toBe('active');
  const after = await snapshot(page);
  const boot = await page.evaluate(() => window.__wordcellBoot);
  if (boot === undefined) throw new Error('window.__wordcellBoot is missing');
  for (const [field, key] of [['session', 'wordcell:session'], ...FIELDS] as const) {
    const text = boot[key];
    expect(after.loaded[field]).toEqual(text === null ? null : JSON.parse(text));
  }
  const session = sessionOf(before) as Record<string, unknown>;
  expect(after.loaded.session).toEqual({ ...session, activeMs: expect.any(Number) });
  expect(activeMsOf(after.loaded.session)).toBeGreaterThanOrEqual(activeMsOf(session));
  if (before.current.kind !== 'active') throw new Error(`store was ${before.current.kind}`);
  for (const [field, key] of FIELDS) {
    if (!before.present.includes(key)) continue;
    // loaded() is the stored shape; current().prefs resolves `theme` (AD-7).
    const resolved =
      field === 'prefs' ? { ...DEFAULTS.prefs, ...after.loaded.prefs } : after.loaded[field];
    expect(resolved).toEqual(before.current[field]);
  }
  // AD-17 Reading state's current() clauses; with session-idle-fresh only the session is stored,
  // so the history and prefs defaults are the history/prefs proof.
  if (after.current.kind !== 'active') throw new Error(`store is ${after.current.kind}`);
  expect(after.current.session).toEqual({
    ...(after.loaded.session as Record<string, unknown>),
    activeMs: expect.any(Number),
  });
  expect(activeMsOf(after.current.session)).toBeGreaterThanOrEqual(
    activeMsOf(after.loaded.session),
  );
  expect(after.current.history).toEqual(after.loaded.history ?? DEFAULTS.history);
  expect(after.current.prefs).toEqual({ ...DEFAULTS.prefs, ...after.loaded.prefs });
  await waitForDictionary(page, 'ready');
  expect(await trayIds(page)).toEqual(TAN_TRAY);
  const primary = page.getByTestId('primary-action');
  await expect(primary).toHaveText('Validate');

  // 6. No prompt after the offline reload (AD-16), before the deal.
  await expectNoPrompt(page);

  // 7. Deal, still offline.
  await dealNewGame(page);
  expect(await trayIds(page)).toEqual([]);
  const dealt = await page.evaluate(() => window.__wordcell?.current());
  if (dealt?.kind !== 'active') throw new Error(`store is ${dealt?.kind}`);
  expect({
    seed: dealt.session.seed,
    moves: dealt.session.moves,
    cursor: dealt.session.cursor,
  }).toEqual({ seed: 1, moves: [], cursor: { index: 0, phase: 'idle' } });
  expect(await seedPins(page)).toBe(1);

  // 8. Validate a word, still offline.
  await composeTan(page);
  await expect(primary).toHaveText('Validate');
  await primary.click();
  await expect(primary).toHaveText('Confirm');
  await glidesSettled(page);
  await expectNoPrompt(page);
  expect(await page.evaluate(() => window.__wordcell?.current().kind)).toBe('active');
  expect(errors).toEqual([]);
});
