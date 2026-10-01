import { expect, test } from '@playwright/test';
import { hidePage } from './helpers/lifecycle';
import { booted, dictionaryReady, type Key, open, sessionOf, snapshot } from './helpers/restore';
import { fixture, seedStorage } from './helpers/seed';

// AD-17 restore boundaries (CAP-10): each case × hidden then reloaded / reloaded without a hide,
// on android. `current()` snapshots before the reload, `loaded()` and `__wordcellBoot` after it.

test.beforeEach(() => {
  test.skip(test.info().project.name !== 'android', 'AD-17 restore flows run on android');
});

type Case = {
  id: string;
  name: string;
  seed: { session?: string; history?: string; prefs?: string };
  undo: boolean;
};

const CASES: Case[] = [
  {
    id: 'R-73 AD-17',
    name: 'session-place-free-letter-redo-tail.json',
    seed: { session: fixture('session-place-free-letter-redo-tail.json') },
    undo: false,
  },
  {
    id: 'R-73 AD-17',
    name: 'session-gave-up.json',
    seed: { session: fixture('session-gave-up.json') },
    undo: false,
  },
  {
    id: 'R-84 AD-17',
    name: 'session-gave-up.json+history-three-records.json undone',
    seed: {
      session: fixture('session-gave-up.json'),
      history: fixture('history-three-records.json'),
    },
    undo: true,
  },
  {
    id: '§7.10 AD-17',
    name: 'prefs-non-default.json',
    seed: { prefs: fixture('prefs-non-default.json') },
    undo: false,
  },
  {
    id: 'R-73 Q-41 AD-17',
    name: 'session-below-committed-last.json',
    seed: { session: fixture('session-below-committed-last.json') },
    undo: false,
  },
];

// SPEC CAP-10: current() reports these in-memory defaults for a never-written key. Mirrors
// src/shell/prefs.svelte.ts DEFAULTS and src/shell/history.svelte.ts EMPTY, the score-history
// store's never-written default (change together).
const DEFAULTS = {
  history: { version: 1, records: [] },
  prefs: { version: 1, animationSpeed: 'normal', showTimer: false },
};

const FIELDS = [
  ['session', 'wordcell:session'],
  ['history', 'wordcell:history'],
  ['prefs', 'wordcell:prefs'],
] as const satisfies readonly (readonly [string, Key])[];

const activeMsOf = (session: unknown) => (session as { activeMs: number }).activeMs;

for (const c of CASES) {
  for (const mode of ['hidden', 'plain'] as const) {
    const title =
      mode === 'hidden'
        ? `${c.id} ${c.name} restores after hidden then reloaded`
        : `${c.id} ${c.name} restores after a reload without a hide`;
    test(title, async ({ page }) => {
      await seedStorage(page, c.seed, { captureBoot: true });
      await open(page);
      // The label depends on the word list (Validate precedence), so read it once ready.
      await dictionaryReady(page);
      const primary = page.getByTestId('primary-action');
      if (c.undo) {
        const pre = sessionOf(await snapshot(page));
        await page.getByRole('button', { name: 'Undo', exact: true }).click();
        await expect.poll(async () => sessionOf(await snapshot(page))).not.toEqual(pre);
      }
      const label = await primary.textContent();
      if (label === null) throw new Error('primary-action has no text');
      if (mode === 'hidden') await hidePage(page);

      const before = await snapshot(page);
      await page.reload();
      await booted(page);
      const after = await snapshot(page);
      expect(after.current.kind).toBe('active');
      await dictionaryReady(page);
      const boot = await page.evaluate(() => window.__wordcellBoot);
      if (boot === undefined) throw new Error('window.__wordcellBoot is missing');

      for (const [field, key] of FIELDS) {
        const text = boot[key];
        expect(after.loaded[field]).toEqual(text === null ? null : JSON.parse(text));
      }
      const session = sessionOf(before) as Record<string, unknown>;
      if (mode === 'hidden') {
        // AD-9: the hide wrote the Session.
        expect(before.stored).toEqual(session);
        // AD-9: the clock is paused after hidePage, so the reload's flush adds no time.
        expect(after.loaded.session).toEqual(session);
      } else {
        expect(after.loaded.session).toEqual({ ...session, activeMs: expect.any(Number) });
        expect(activeMsOf(after.loaded.session)).toBeGreaterThanOrEqual(activeMsOf(session));
      }
      if (before.current.kind !== 'active') throw new Error(`store was ${before.current.kind}`);
      for (const [field, key] of FIELDS) {
        if (field === 'session') continue;
        if (before.present.includes(key)) {
          expect(after.loaded[field]).toEqual(before.current[field]);
        }
      }

      // R-73 (UI): the exact phase.
      await expect(primary).toHaveText(label);
      if (after.current.kind !== 'active') return;
      expect(after.current.session).toEqual({
        ...(after.loaded.session as Record<string, unknown>),
        activeMs: expect.any(Number),
      });
      expect(activeMsOf(after.current.session)).toBeGreaterThanOrEqual(
        activeMsOf(after.loaded.session),
      );
      expect(after.current.history).toEqual(after.loaded.history ?? DEFAULTS.history);
      expect(after.current.prefs).toEqual(after.loaded.prefs ?? DEFAULTS.prefs);

      if (c.id === 'R-84 AD-17') {
        const { records } = JSON.parse(fixture('history-three-records.json')) as {
          records: unknown[];
        };
        expect((after.loaded.history as unknown as { records: unknown[] }).records).toEqual(
          records.slice(0, -1),
        );
      }
      if (c.id === '§7.10 AD-17') {
        expect(before.present).toContain('wordcell:session');
        expect(after.loaded.history).toBeNull();
      }
    });
  }
}
