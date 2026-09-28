import type { Page } from '@playwright/test';

// AD-17 Seeding. Each page gets at most one of seedStorage / captureBoot, before its first goto.
const tracked = new WeakSet<Page>();

type Seed = { session?: string; history?: string; prefs?: string };
type Values = Partial<Record<'wordcell:session' | 'wordcell:history' | 'wordcell:prefs', string>>;

function track(page: Page, helper: string): void {
  if (tracked.has(page)) {
    throw new Error(`${helper}: already called seedStorage or captureBoot on this page`);
  }
  if (page.url() !== 'about:blank') {
    throw new Error(`${helper}: page must still be at about:blank (got ${page.url()})`);
  }
  tracked.add(page);
}

// Sent to the page as source: everything it uses is a literal inside it or comes in through `arg`.
function initScript(arg: { values: Values | null; captureBoot: boolean }): void {
  if (arg.values !== null && sessionStorage.getItem('__wordcellSeeded') === null) {
    for (const [key, value] of Object.entries(arg.values)) {
      if (value !== undefined) localStorage.setItem(key, value);
    }
    sessionStorage.setItem('__wordcellSeeded', '1');
  }
  if (arg.captureBoot) {
    window.__wordcellBoot = {
      'wordcell:session': localStorage.getItem('wordcell:session'),
      'wordcell:history': localStorage.getItem('wordcell:history'),
      'wordcell:prefs': localStorage.getItem('wordcell:prefs'),
    };
  }
}

export async function seedStorage(
  page: Page,
  seed: Seed,
  options: { captureBoot?: boolean } = {},
): Promise<void> {
  const values: Values = {};
  if (seed.session !== undefined) values['wordcell:session'] = seed.session;
  if (seed.history !== undefined) values['wordcell:history'] = seed.history;
  if (seed.prefs !== undefined) values['wordcell:prefs'] = seed.prefs;
  if (Object.keys(values).length === 0) {
    throw new Error('seedStorage: no keys given; use captureBoot(page) to seed nothing');
  }
  track(page, 'seedStorage');
  await page.addInitScript(initScript, { values, captureBoot: options.captureBoot === true });
}

export async function captureBoot(page: Page): Promise<void> {
  track(page, 'captureBoot');
  await page.addInitScript(initScript, { values: null, captureBoot: true });
}
