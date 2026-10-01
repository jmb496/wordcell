import { expect, type Page, type Route, test } from '@playwright/test';
import { fixture, seedStorage } from './helpers/seed';
import { armStorageSpy, storageWrites } from './helpers/storage-spy';

// Blocking messages (AD-15 fatal, Q-38 another window, §2 Session rejected) on android.

test.beforeEach(() => {
  test.skip(test.info().project.name !== 'android', 'blocking-message flows run on android');
});

const FATAL = 'Something went wrong.';
const ANOTHER_WINDOW = 'WordCell is open in another window.';
const REJECTED = "This saved game can't be opened.";

const kind = (page: Page) => page.evaluate(() => window.__wordcell?.current().kind);
const stored = (page: Page, key = 'wordcell:session') =>
  page.evaluate((k) => localStorage.getItem(k), key);

// The one button on the page is `name`.
async function expectOnlyButton(page: Page, name: string): Promise<void> {
  await expect(page.getByRole('button')).toHaveCount(1);
  await expect(page.getByRole('button', { name, exact: true })).toBeVisible();
}

async function expectFatal(page: Page, body?: string): Promise<void> {
  const dialog = page.getByRole('alertdialog');
  await expect(dialog).toHaveCount(1);
  await expect(dialog.getByRole('heading', { name: FATAL, exact: true })).toBeVisible();
  await expect(dialog).toHaveAccessibleName(FATAL);
  await expect(dialog).toHaveAccessibleDescription(body ?? /\S/);
  await expectOnlyButton(page, 'Reload');
  expect(await kind(page)).toBe('halted');
}

async function expectAnotherWindow(page: Page): Promise<void> {
  const dialog = page.getByRole('alertdialog');
  await expect(dialog).toHaveCount(1);
  await expect(dialog.getByRole('heading', { name: ANOTHER_WINDOW, exact: true })).toBeVisible();
  await expect(dialog).toHaveAccessibleName(ANOTHER_WINDOW);
  await expect(dialog).toHaveAccessibleDescription('');
  await expectOnlyButton(page, 'Reload');
  expect(await kind(page)).toBe('halted');
}

async function expectNoBoard(page: Page): Promise<void> {
  await expect(page.locator('[data-testid^="card-"]')).toHaveCount(0);
  for (const id of ['undo', 'redo', 'primary-action']) {
    await expect(page.getByTestId(id)).toHaveCount(0);
  }
}

const hookReady = (page: Page) => page.waitForFunction(() => window.__wordcell !== undefined);

async function expectFontFatal(page: Page, body?: string): Promise<void> {
  await expectFatal(page, body);
  await expectNoBoard(page);
  expect(await page.evaluate(() => localStorage.length)).toBe(0);
}

test.describe('Q-37 AD-15 fatal', () => {
  test('Q-37 AD-15 a 404 on the font gives the fatal surface and writes nothing', async ({
    page,
  }) => {
    await page.route('**/*.woff2', (route) => route.fulfill({ status: 404 }));
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    // Chromium rejects the load with a NetworkError DOMException.
    await expectFontFatal(page, 'A network error occurred.');
  });

  test('Q-37 AD-15 a font load held past 30 s gives the fatal surface and writes nothing', async ({
    page,
  }) => {
    // Paused before the page loads, so the timer is bounded from below too.
    await page.clock.install({ time: 0 });
    await page.clock.pauseAt(1000);
    const held: Route[] = [];
    await page.route('**/*.woff2', (route) => {
      held.push(route);
    });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await hookReady(page);
    expect(await kind(page)).toBe('booting');
    await page.clock.runFor(29_999);
    expect(await kind(page)).toBe('booting');
    await expect(page.getByRole('alertdialog')).toHaveCount(0);
    await page.clock.runFor(1);
    await expectFontFatal(page, 'AD-15 font check timed out after 30000 ms');
  });

  test('Q-37 AD-15 document.fonts.load resolving [] gives the fatal surface and writes nothing', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      document.fonts.load = () => Promise.resolve([]);
    });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expectFontFatal(page, 'AD-15 font check: WordCell Serif did not load');
  });

  test('Q-37 AD-15 a healthy boot stays active past the 30 s font timeout', async ({ page }) => {
    await page.clock.install();
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('card-0')).toBeVisible();
    // AD-8: the word list loads first, so the runFor below does not also fire its 30 s timeout.
    await page.waitForFunction(() => window.__wordcell?.dictionaryState() === 'ready');
    await page.clock.runFor(31_000);
    expect(await kind(page)).toBe('active');
    await expect(page.getByRole('alertdialog')).toHaveCount(0);
    await expect(page.getByTestId('card-0')).toBeVisible();
  });

  test('Q-37 AD-15 an unhandled rejection with a string or blank reason gives a non-blank fatal body', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.getByTestId('card-0')).toBeVisible();
    await page.evaluate(() => {
      setTimeout(() => Promise.reject('Q-37 string reason'));
    });
    await expectFatal(page, 'Q-37 string reason');
    await page.evaluate(() => {
      setTimeout(() => Promise.reject(''));
    });
    await expectFatal(page, '[object String]');
  });

  test('Q-37 AD-15 a throwing Session write on Undo gives the fatal surface and stops writing', async ({
    page,
  }) => {
    const text = fixture('session-place.json');
    await seedStorage(page, { session: text });
    await page.goto('/');
    await expect(page.getByTestId('card-0')).toBeVisible();
    await armStorageSpy(page, { throwOn: 'wordcell:session' });
    await page.getByTestId('undo').click();
    await expectFatal(page, 'storage-spy: wordcell:session');
    await expectNoBoard(page);
    expect(await storageWrites(page)).toEqual([
      { key: 'wordcell:session', value: expect.any(String) },
    ]);
    expect(await stored(page)).toBe(text);
  });
});

test.describe('§2 Session rejected', () => {
  type Variant = {
    name: string;
    session: string;
    body: string;
    history?: string;
  };

  const variants: Variant[] = [
    {
      name: '§2 R-74 Q-29 version-unknown (version 3): the rejected root names the version; New game stores a fresh Session and leaves the history',
      session: 'session-invalid-version-unknown.json',
      body: "It was saved in format version 3, which this version of WordCell can't read. It stays saved until you start a new game.",
      history: 'history-three-records.json',
    },
    {
      name: '§2 R-74 Q-29 version-unreadable: the rejected root names no version; New game stores a fresh Session and leaves the history',
      session: 'session-invalid-null.json',
      body: "It was saved in a format this version of WordCell can't read. It stays saved until you start a new game.",
      history: 'history-three-records.json',
    },
    {
      name: '§2 pre-replay AD-7 check (version 1): the rejected root shows the replay-failed text; New game stores a fresh Session',
      session: 'session-invalid-s2-last-only.json',
      body: 'It (format version 1) failed a rules check while loading. It stays saved until you start a new game.',
    },
    {
      name: '§2 replay rule (version 1): the rejected root shows the replay-failed text; New game stores a fresh Session',
      session: 'session-invalid-r50-placement-order.json',
      body: 'It (format version 1) failed a rules check while loading. It stays saved until you start a new game.',
    },
  ];

  async function expectRejected(page: Page, variant: Variant, text: string): Promise<void> {
    const dialog = page.getByRole('alertdialog');
    await expect(dialog).toHaveCount(1);
    await expect(dialog.getByRole('heading', { name: REJECTED, exact: true })).toBeVisible();
    await expect(dialog).toHaveAccessibleName(REJECTED);
    await expect(dialog).toHaveAccessibleDescription(variant.body);
    await expectOnlyButton(page, 'New game');
    await expectNoBoard(page);
    expect(await kind(page)).toBe('rejected');
    expect(await stored(page)).toBe(text);
  }

  for (const variant of variants) {
    test(variant.name, async ({ page }) => {
      const text = fixture(variant.session);
      const historyText = variant.history === undefined ? undefined : fixture(variant.history);
      await seedStorage(page, {
        session: text,
        ...(historyText !== undefined && { history: historyText }),
      });
      await page.goto('/');
      await expectRejected(page, variant, text);
      await page.reload();
      await expectRejected(page, variant, text);

      // New game acts at once: click and read storage in one task.
      const after = await page.evaluate(() => {
        const button = [...document.querySelectorAll('button')].find(
          (b) => b.textContent === 'New game',
        );
        if (button === undefined) throw new Error('no New game button');
        button.click();
        const value = localStorage.getItem('wordcell:session');
        return {
          stored: value === null ? null : JSON.parse(value),
          current: window.__wordcell?.current(),
        };
      });
      const { version } = JSON.parse(fixture('session-idle-fresh.json')) as { version: number };
      expect(after.stored).toEqual({
        version,
        seed: expect.any(Number),
        moves: [],
        cursor: { index: 0, phase: 'idle' },
        gaveUp: false,
        activeMs: 0,
      });
      const { seed } = after.stored as { seed: number };
      expect(Number.isInteger(seed)).toBe(true);
      expect(seed).toBeGreaterThanOrEqual(0);
      expect(seed).toBeLessThanOrEqual(4294967295);
      expect(after.current).toEqual({
        kind: 'active',
        session: after.stored,
        history: historyText !== undefined ? JSON.parse(historyText) : { version: 1, records: [] },
        prefs: { version: 1, animationSpeed: 'normal', showTimer: false },
      });
      await expect(page.getByTestId('card-0')).toBeVisible();
      await expect(page.getByRole('alertdialog')).toHaveCount(0);

      if (historyText !== undefined) {
        expect(await stored(page, 'wordcell:history')).toBe(historyText);
        await page.reload();
        await expect(page.getByText(`Seed ${seed}`, { exact: true })).toBeVisible();
        await expect(page.getByTestId('card-0')).toBeVisible();
        expect(await stored(page, 'wordcell:history')).toBe(historyText);
      } else {
        expect(await stored(page, 'wordcell:history')).toBeNull();
      }
    });
  }
});

test.describe('Q-38 single instance', () => {
  test('R-84 Q-38 an Undo in a second page halts the first with the another-window message', async ({
    page,
  }) => {
    const page1 = page;
    await seedStorage(page1, { session: fixture('session-place.json') });
    await page1.goto('/');
    await expect(page1.getByTestId('card-0')).toBeVisible();
    expect(await kind(page1)).toBe('active');
    await armStorageSpy(page1);

    const page2 = await page.context().newPage();
    await page2.goto('/');
    await expect(page2.getByTestId('card-0')).toBeVisible();
    await expect(page1.getByRole('alertdialog')).toHaveCount(0);
    await page2.getByTestId('undo').click();

    await expectAnotherWindow(page1);
    await expectNoBoard(page1);
    expect(await storageWrites(page1)).toEqual([]);
    expect(await kind(page2)).toBe('active');
    const session2 = await page2.evaluate(() => {
      const current = window.__wordcell?.current();
      if (current?.kind !== 'active') throw new Error(`page 2 is ${current?.kind}`);
      return current.session;
    });

    await page1.getByRole('button', { name: 'Reload', exact: true }).click();
    await expect(page1.getByTestId('card-0')).toBeVisible();
    expect(await page1.evaluate(() => window.__wordcell?.current())).toEqual({
      kind: 'active',
      session: session2,
      history: { version: 1, records: [] },
      prefs: { version: 1, animationSpeed: 'normal', showTimer: false },
    });
  });

  test('Q-38 a write by another page during boot halts it: no Board, no Session, and a later fatal replaces the message', async ({
    page,
  }) => {
    const page1 = page;
    const held: Route[] = [];
    await page1.route('**/*.woff2', (route) => {
      held.push(route);
    });
    await page1.goto('/', { waitUntil: 'domcontentloaded' });
    await hookReady(page1);
    expect(await kind(page1)).toBe('booting');

    const page2 = await page.context().newPage();
    await page2.goto('/favicon.svg');
    await page2.evaluate(() => localStorage.setItem('wordcell:prefs', '{}'));
    await page1.waitForFunction(() => window.__wordcell?.current().kind === 'halted');

    await expect.poll(() => held.length).toBeGreaterThan(0);
    for (const route of held) await route.continue();

    await expectAnotherWindow(page1);
    await expectNoBoard(page1);
    expect(await stored(page1)).toBeNull();
    expect(await page1.evaluate(() => window.__wordcell?.loaded())).toEqual({
      session: null,
      history: null,
      prefs: { rejected: { reason: 'version-unreadable' } },
    });

    const dialog = await page1.getByRole('alertdialog').elementHandle();
    if (dialog === null) throw new Error('no alertdialog');
    await page1.evaluate(() => {
      setTimeout(() => {
        throw new Error('Q-38 later fatal');
      });
    });
    await expectFatal(page1, 'Q-38 later fatal');
    expect(await dialog.evaluate((node) => node.isConnected)).toBe(true);
    await expectNoBoard(page1);
    expect(await stored(page1)).toBeNull();
  });

  test("Q-38 a rejected root halts on another page's write", async ({ page }) => {
    const text = fixture('session-invalid-null.json');
    const page1 = page;
    await seedStorage(page1, { session: text });
    await page1.goto('/');
    await expect(page1.getByRole('heading', { name: REJECTED, exact: true })).toBeVisible();

    const page2 = await page.context().newPage();
    await page2.goto('/favicon.svg');
    await page2.evaluate(() => localStorage.setItem('wordcell:prefs', '{}'));

    await expectAnotherWindow(page1);
    await expectNoBoard(page1);
    expect(await stored(page1)).toBe(text);
  });
});

// Owner decision 2026-09-30 (ticket 3.5): the Blocking message's one button takes keyboard focus.
test.describe('Blocking message focus', () => {
  const focused = (page: Page) =>
    page.evaluate(() => {
      const active = document.activeElement;
      return active instanceof HTMLButtonElement ? active.textContent : active?.tagName;
    });

  test('AD-15 a fatal after mount focuses Reload', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('card-0')).toBeVisible();
    await page.getByTestId('primary-action').focus();
    await page.evaluate(() => {
      setTimeout(() => {
        throw new Error('AD-15 focus');
      });
    });
    await expectFatal(page, 'AD-15 focus');
    await expect.poll(() => focused(page)).toBe('Reload');
  });

  test('§2 the rejected root focuses New game', async ({ page }) => {
    await seedStorage(page, { session: fixture('session-invalid-null.json') });
    await page.goto('/');
    await expect(page.getByRole('heading', { name: REJECTED, exact: true })).toBeVisible();
    await expect.poll(() => focused(page)).toBe('New game');
  });

  test('Q-38 another window focuses Reload, and a later fatal focuses it again', async ({
    page,
  }) => {
    const page1 = page;
    await page1.goto('/');
    await expect(page1.getByTestId('card-0')).toBeVisible();

    const page2 = await page.context().newPage();
    await page2.goto('/favicon.svg');
    await page2.evaluate(() => localStorage.setItem('wordcell:prefs', '{}'));
    await expectAnotherWindow(page1);
    await expect.poll(() => focused(page1)).toBe('Reload');

    await page1.evaluate(() => {
      (document.activeElement as HTMLElement).blur();
      setTimeout(() => {
        throw new Error('Q-38 cause change');
      });
    });
    await expectFatal(page1, 'Q-38 cause change');
    await expect.poll(() => focused(page1)).toBe('Reload');
  });
});
