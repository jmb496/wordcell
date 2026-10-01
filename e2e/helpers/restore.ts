import { expect, type Page } from '@playwright/test';

// AD-17 restore boundaries: snapshots of the stored Session and the hook's views, shared by the
// game-store and restore specs.

const KEYS = ['wordcell:session', 'wordcell:history', 'wordcell:prefs'] as const;

export type Key = (typeof KEYS)[number];

export type Snapshot = {
  stored: unknown;
  current: ReturnType<NonNullable<Window['__wordcell']>['current']>;
  loaded: ReturnType<NonNullable<Window['__wordcell']>['loaded']>;
  // The wordcell:* keys present in localStorage at snapshot time, in KEYS order.
  present: Key[];
};

// Reads the stored Session (JSON.parse of wordcell:session), the hook's views and the present keys
// in one task.
export function snapshot(page: Page): Promise<Snapshot> {
  return page.evaluate(
    (keys) => {
      const hook = window.__wordcell;
      if (hook === undefined) throw new Error('window.__wordcell is missing');
      const text = localStorage.getItem('wordcell:session');
      return {
        stored: text === null ? null : JSON.parse(text),
        current: hook.current(),
        loaded: hook.loaded(),
        present: keys.filter((k) => localStorage.getItem(k) !== null),
      };
    },
    [...KEYS],
  );
}

export function sessionOf(snap: Snapshot): unknown {
  if (snap.current.kind !== 'active') throw new Error(`store is ${snap.current.kind}`);
  return snap.current.session;
}

// AD-17: the hook exists and the store has left 'booting' (loaded() throws until then).
export async function booted(page: Page): Promise<void> {
  await page.waitForFunction(
    () => window.__wordcell !== undefined && window.__wordcell.current().kind !== 'booting',
  );
}

export async function open(page: Page, url = '/'): Promise<void> {
  await page.goto(url);
  await expect(page.getByRole('heading', { name: 'WordCell' })).toBeVisible();
  await booted(page);
}

// AD-8: the word list has loaded (plain Validate labels need it).
export async function dictionaryReady(page: Page): Promise<void> {
  await page.waitForFunction(() => window.__wordcell?.dictionaryState() === 'ready');
}
