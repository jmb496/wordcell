import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { expect, type Page, type Request, test } from '@playwright/test';
import { EN, parseSession, view } from '../src/engine/index';
import { expectAnotherWindow, expectOnlyButton, kind, stored } from './helpers/blocking';
import {
  box,
  cards,
  centre,
  column,
  foot,
  glidesSettled,
  openFixture,
  sameSession,
  stashSession,
  tapAt,
  trayIds,
} from './helpers/board';
import { button, expectLeaves, hitAt, wc } from './helpers/dialogs';
import { buildRoot } from './helpers/dist-test';
import { dragResidue, expectNoResidue } from './helpers/drag';
import {
  css,
  expectFlownBack,
  faceOf,
  footCorner,
  path as gesturePath,
  holdThrough,
  idOf,
  placeholder,
  plus,
  space,
  targets,
} from './helpers/gestures';
import { openScene } from './helpers/how-to-play';
import {
  arrangeByKeys,
  expectBoardFocus,
  focusedCard,
  press,
  tiles,
  toComposing,
  tray,
  where,
} from './helpers/keys';
import {
  animationFrames,
  hidePage,
  pageHide,
  pageShow,
  showPage,
  startHidden,
} from './helpers/lifecycle';
import { onAndroid, onDesktop } from './helpers/project';
import {
  booted,
  dictionaryReady,
  isList,
  open,
  openBoard,
  type Snapshot,
  sessionOf,
  snapshot,
  waitForDictionary,
} from './helpers/restore';
import { captureBoot, fixture, seedStorage } from './helpers/seed';
import { expectSelection, select, selection, wcOf } from './helpers/selection';
import { cursorIndex, draft, draftDetail, game, storedGame, storedText } from './helpers/session';
import { SESSIONS } from './helpers/sessions';
import { armStorageSpy, storageWrites } from './helpers/storage-spy';
import { tokenColor } from './helpers/style';
import { longPress, touchDrag, touchHold } from './helpers/touch';

// AD-17 helper self-tests. The direct `page.evaluate` writes to `wordcell:*` below stand in for the
// app's own writes during a prior load; they are not seeding and are allowed only in this file.

test.beforeEach(() => {
  test.skip(test.info().project.name !== 'android', 'AD-17 helper self-tests run on android');
});

type ProbeEvent = {
  type: string;
  pointerType: string | null;
  clientX: number;
  clientY: number;
  timeStamp: number;
  coalesced: number;
};

type LifecycleEvent = {
  type: string;
  listener: 'window' | 'document';
  target: 'window' | 'document' | 'other';
  visibilityState: DocumentVisibilityState;
  hidden: boolean;
  persisted: boolean | null;
};

const readKey = (page: Page, key: string) =>
  page.evaluate((k) => localStorage.getItem(k), `wordcell:${key}`);

const writeKey = (page: Page, key: string, value: string) =>
  page.evaluate(([k, v]) => localStorage.setItem(k, v), [`wordcell:${key}`, value] as const);

const readBoot = (page: Page) => page.evaluate(() => window.__wordcellBoot);

test.describe('seedStorage / captureBoot', () => {
  test('AD-17 fixture returns a root fixture file verbatim and throws for a missing one', () => {
    const text = fixture('session-idle-fresh.json');
    expect(text).toBe(
      readFileSync(
        path.resolve(import.meta.dirname, '../fixtures/session-idle-fresh.json'),
        'utf8',
      ),
    );
    expect(JSON.parse(text)).toMatchObject({ version: 1, seed: 1 });
    expect(() => fixture('session-no-such-fixture.json')).toThrow(/ENOENT/);
  });

  test('AD-17 seedStorage seeds once; a reload does not re-seed', async ({ page }) => {
    await seedStorage(page, { session: 'a' });
    await page.goto('/');
    expect(await readKey(page, 'session')).toBe('a');
    await writeKey(page, 'session', 'b');
    await page.reload();
    expect(await readKey(page, 'session')).toBe('b');
  });

  test('AD-17 a new page in the same context is not seeded (page-scoped init script)', async ({
    page,
  }) => {
    const page1 = page;
    const context = page.context();
    await seedStorage(page1, { session: 'a' });
    await page1.goto('/');
    await writeKey(page1, 'session', 'b');
    const page2 = await context.newPage();
    await page2.goto('/');
    expect(await readKey(page2, 'session')).toBe('b');
  });

  test('AD-17 seedStorage with captureBoot records the boot values on every load', async ({
    page,
  }) => {
    const expected = { 'wordcell:session': 'a', 'wordcell:history': null, 'wordcell:prefs': null };
    await seedStorage(page, { session: 'a' }, { captureBoot: true });
    await page.goto('/');
    expect(await readBoot(page)).toEqual(expected);
    await page.reload();
    expect(await readBoot(page)).toEqual(expected);
  });

  test('AD-17 seedStorage with captureBoot records live values after reload', async ({ page }) => {
    await seedStorage(page, { session: 'a' }, { captureBoot: true });
    await page.goto('/');
    await writeKey(page, 'session', 'b');
    await page.reload();
    expect(await readBoot(page)).toEqual({
      'wordcell:session': 'b',
      'wordcell:history': null,
      'wordcell:prefs': null,
    });
  });

  test('AD-17 captureBoot records absent keys as null and later writes on reload', async ({
    page,
  }) => {
    // Paused, so the reload's pagehide flush (R-73) writes the in-memory Session unchanged.
    await page.clock.install({ time: 0 });
    await page.clock.pauseAt(1000);
    await captureBoot(page);
    await page.goto('/');
    expect(await readBoot(page)).toEqual({
      'wordcell:session': null,
      'wordcell:history': null,
      'wordcell:prefs': null,
    });
    // The app's first-launch write, then its hide flush on reload, are the later writes.
    const session = await page.evaluate(() => {
      const current = window.__wordcell?.current();
      if (current?.kind !== 'active') throw new Error(`store is ${current?.kind}`);
      return current.session;
    });
    await writeKey(page, 'prefs', 's');
    await page.reload();
    const boot = await readBoot(page);
    expect(JSON.parse(boot?.['wordcell:session'] ?? 'null')).toEqual(session);
    expect(boot).toEqual({
      'wordcell:session': expect.any(String),
      'wordcell:history': null,
      'wordcell:prefs': 's',
    });
  });

  test('AD-17 seedStorage leaves omitted keys untouched', async ({ page }) => {
    const page1 = page;
    const context = page.context();
    await page1.goto('/');
    await writeKey(page1, 'prefs', 'p');
    await page1.close();
    const page2 = await context.newPage();
    await seedStorage(page2, { session: 'a' }, { captureBoot: true });
    await page2.goto('/');
    expect(await readBoot(page2)).toEqual({
      'wordcell:session': 'a',
      'wordcell:history': null,
      'wordcell:prefs': 'p',
    });
  });

  test('AD-17 seedStorage writes values verbatim, including quotes, escapes and empty', async ({
    page,
  }) => {
    const tricky = `it's "quoted" \\ back\nslash`;
    await seedStorage(page, { history: tricky, prefs: '' }, { captureBoot: true });
    await page.goto('/');
    expect(await readBoot(page)).toEqual({
      'wordcell:session': null,
      'wordcell:history': tricky,
      'wordcell:prefs': '',
    });
  });

  test('AD-17 seedStorage twice on one page rejects', async ({ page }) => {
    const fresh = await page.context().newPage();
    await seedStorage(fresh, { session: 'a' });
    await expect(seedStorage(fresh, { session: 'a' })).rejects.toThrow(/already called/);
  });

  test('AD-17 captureBoot after seedStorage rejects', async ({ page }) => {
    const fresh = await page.context().newPage();
    await seedStorage(fresh, { session: 'a' });
    await expect(captureBoot(fresh)).rejects.toThrow(/already called/);
  });

  test('AD-17 seedStorage after captureBoot rejects', async ({ page }) => {
    const fresh = await page.context().newPage();
    await captureBoot(fresh);
    await expect(seedStorage(fresh, { session: 'a' })).rejects.toThrow(/already called/);
  });

  test('AD-17 captureBoot twice on one page rejects', async ({ page }) => {
    const fresh = await page.context().newPage();
    await captureBoot(fresh);
    await expect(captureBoot(fresh)).rejects.toThrow(/already called/);
  });

  test('AD-17 seedStorage after goto rejects', async ({ page }) => {
    const fresh = await page.context().newPage();
    await fresh.goto('/');
    await expect(seedStorage(fresh, { session: 'a' })).rejects.toThrow(/about:blank/);
  });

  test('AD-17 captureBoot after goto rejects', async ({ page }) => {
    const fresh = await page.context().newPage();
    await fresh.goto('/');
    await expect(captureBoot(fresh)).rejects.toThrow(/about:blank/);
  });

  test('AD-17 seedStorage with no keys rejects', async ({ page }) => {
    const fresh = await page.context().newPage();
    await expect(seedStorage(fresh, {})).rejects.toThrow(/no keys/);
  });

  test('AD-17 seedStorage that fails validation does not track the page', async ({ page }) => {
    const fresh = await page.context().newPage();
    await expect(seedStorage(fresh, {})).rejects.toThrow(/no keys/);
    await expect(seedStorage(fresh, { session: 'a' })).resolves.toBeUndefined();
  });

  test('AD-17 seedStorage checks no keys before already called', async ({ page }) => {
    const fresh = await page.context().newPage();
    await seedStorage(fresh, { session: 'a' });
    await expect(seedStorage(fresh, {})).rejects.toThrow(/no keys/);
  });

  test('AD-17 seedStorage checks already called before about:blank', async ({ page }) => {
    const fresh = await page.context().newPage();
    await seedStorage(fresh, { session: 'a' });
    await fresh.goto('/');
    await expect(seedStorage(fresh, { session: 'a' })).rejects.toThrow(/already called/);
  });

  test('AD-17 captureBoot checks already called before about:blank', async ({ page }) => {
    const fresh = await page.context().newPage();
    await captureBoot(fresh);
    await fresh.goto('/');
    await expect(captureBoot(fresh)).rejects.toThrow(/already called/);
  });
});

test.describe('restore helpers', () => {
  test('AD-17 snapshot reports present keys in fixed order and open() waits past booting', async ({
    page,
    browser,
  }) => {
    await seedStorage(page, { session: fixture('session-place.json') });
    await open(page);
    expect(await page.evaluate(() => window.__wordcell?.current().kind)).toBe('active');
    expect((await snapshot(page)).present).toEqual(['wordcell:session']);

    const other = await browser.newContext();
    try {
      const page2 = await other.newPage();
      await seedStorage(page2, {
        session: fixture('session-place.json'),
        history: fixture('history-three-records.json'),
        prefs: fixture('prefs-non-default.json'),
      });
      await open(page2, page.url());
      expect((await snapshot(page2)).present).toEqual([
        'wordcell:session',
        'wordcell:history',
        'wordcell:prefs',
      ]);
    } finally {
      await other.close();
    }
  });

  test('AD-17 booted, sessionOf and dictionaryReady read the active store and the ready word list', async ({
    page,
  }) => {
    await seedStorage(page, { session: fixture('session-place.json') });
    await open(page);
    const current = await page.evaluate(() => window.__wordcell?.current());
    if (current?.kind !== 'active') throw new Error(`store is ${current?.kind}`);
    expect(sessionOf(await snapshot(page))).toEqual({
      ...current.session,
      activeMs: expect.any(Number),
    });
    const halted: Snapshot = {
      stored: null,
      current: { kind: 'halted' },
      loaded: { session: null, history: null, prefs: null },
      present: [],
    };
    expect(() => sessionOf(halted)).toThrow('store is halted');

    await page.reload();
    await booted(page);
    expect(await page.evaluate(() => window.__wordcell?.current().kind)).toBe('active');
    await dictionaryReady(page);
    expect(await page.evaluate(() => window.__wordcell?.dictionaryState())).toBe('ready');
  });
});

test.describe('board, dictionary and style helpers', () => {
  test('AD-17 openBoard waits for card 0; waitForDictionary waits for the given word-list state', async ({
    page,
  }) => {
    await page.route('**/en*.txt', (route) => route.fulfill({ status: 500, body: '' }));
    await seedStorage(page, { session: fixture('session-place.json') });
    await openBoard(page);
    await expect(page.getByTestId('card-0')).toBeVisible();
    await waitForDictionary(page, 'failed');
    expect(await page.evaluate(() => window.__wordcell?.dictionaryState())).toBe('failed');
    await page.unroute('**/en*.txt');
    await page.reload();
    await waitForDictionary(page, 'ready');
    expect(await page.evaluate(() => window.__wordcell?.dictionaryState())).toBe('ready');
  });

  test('AD-17 tokenColor resolves a colour token to its computed rgb form and leaves no probe', async ({
    page,
  }) => {
    await openBoard(page);
    await page.evaluate(() => document.documentElement.style.setProperty('--probe', '#ff8000'));
    const children = () => page.evaluate(() => document.body.childElementCount);
    const before = await children();
    expect(await tokenColor(page, '--probe')).toBe('rgb(255, 128, 0)');
    expect(await children()).toBe(before);
  });
});

test.describe('board helpers', () => {
  test('AD-17 openFixture seeds the session and prefs fixtures, waits for the booted board and clicks steps; a missing fixture rejects before navigating', async ({
    page,
    context,
  }) => {
    const seeded = JSON.parse(fixture('session-idle-empty-column.json')) as {
      cursor: { index: number };
    };
    await openFixture(page, 'session-idle-empty-column', {
      prefs: 'prefs-non-default',
      steps: ['undo'],
    });
    await expect(page.locator('[data-card-id]')).toHaveCount(52);
    const current = await page.evaluate(() => window.__wordcell?.current());
    if (current?.kind !== 'active') throw new Error(`store is ${current?.kind}`);
    expect(current.session.cursor.index).toBe(seeded.cursor.index - 1);
    expect(await page.evaluate(() => localStorage.getItem('wordcell:prefs'))).toBe(
      fixture('prefs-non-default.json'),
    );

    const other = await context.newPage();
    await expect(openFixture(other, 'session-no-such-fixture')).rejects.toThrow(/ENOENT/);
    expect(other.url()).toBe('about:blank');
  });

  test('AD-17 openFixture with { booted: false } returns at the 52 cards without waiting for the store to leave booting; the default waits once', async ({
    page,
    context,
  }) => {
    // Counts the page's `waitForFunction` calls, which `booted` (restore.ts) makes once.
    const countWaits = (target: Page) => {
      const waits = { count: 0 };
      const original = target.waitForFunction.bind(target);
      target.waitForFunction = ((...args: Parameters<typeof original>) => {
        waits.count++;
        return original(...args);
      }) as typeof original;
      return waits;
    };

    const unwaited = countWaits(page);
    await openFixture(page, 'session-idle-empty-column', { booted: false });
    await expect(page.locator('[data-card-id]')).toHaveCount(52);
    expect(unwaited.count).toBe(0);

    const other = await context.newPage();
    const waited = countWaits(other);
    await openFixture(other, 'session-idle-empty-column');
    expect(waited.count).toBe(1);
  });

  test('AD-17 column, cards and foot locate column n, its live cards (no mirrors) and foot pad n; none past 8', async ({
    page,
  }) => {
    await openFixture(page, 'session-composing');
    for (let n = 1; n <= 8; n++) {
      await expect(column(page, n)).toHaveCount(1);
      await expect(foot(page, n)).toHaveCount(1);
    }
    // Column 3: five live cards above two S ghosts (column-phases.spec.ts).
    await expect(cards(page, 3)).toHaveCount(5);
    await expect(column(page, 3).locator('[data-mirror-of]')).toHaveCount(2);
    for (const card of await cards(page, 3).all()) {
      expect(await card.getAttribute('data-place')).toBe('column');
    }
    await expect(column(page, 9)).toHaveCount(0);
    await expect(cards(page, 9)).toHaveCount(0);
    await expect(foot(page, 0)).toHaveCount(0);
  });

  test('AD-17 box and centre read a bounding box as x, y, w, h and its centre; an element without a box rejects', async ({
    page,
  }) => {
    await openFixture(page, 'session-idle-fresh');
    const raw = await column(page, 2).boundingBox();
    if (raw === null) throw new Error('column 2 has no box');
    expect(await box(column(page, 2))).toEqual({ x: raw.x, y: raw.y, w: raw.width, h: raw.height });
    expect(await centre(column(page, 2))).toEqual({
      x: raw.x + raw.width / 2,
      y: raw.y + raw.height / 2,
    });
    await page.evaluate(() => {
      const probe = document.createElement('div');
      probe.id = 'no-box-probe';
      probe.style.display = 'none';
      document.body.append(probe);
    });
    const hidden = page.locator('#no-box-probe');
    await expect(box(hidden)).rejects.toThrow('element has no box');
    await expect(centre(hidden)).rejects.toThrow('element has no box');
  });

  test('AD-17 tapAt taps once at a point: one click there, its target the element under it', async ({
    page,
  }) => {
    await openFixture(page, 'session-idle-fresh');
    await page.evaluate(() => {
      const probe = document.createElement('button');
      probe.id = 'tap-probe';
      probe.type = 'button';
      probe.textContent = 'probe';
      Object.assign(probe.style, {
        position: 'fixed',
        left: '40px',
        top: '200px',
        width: '80px',
        height: '44px',
        zIndex: '1000',
      });
      const clicks: string[] = [];
      (window as unknown as { __tapClicks: string[] }).__tapClicks = clicks;
      document.addEventListener(
        'click',
        (event) => clicks.push(event.target instanceof Element ? event.target.id : ''),
        true,
      );
      document.body.append(probe);
    });
    await tapAt(page, await centre(page.locator('#tap-probe')));
    expect(
      await page.evaluate(() => (window as unknown as { __tapClicks: string[] }).__tapClicks),
    ).toEqual(['tap-probe']);
  });

  test('AD-17 stashSession returns the stored text and sameSession holds until the Session changes; sameSession rejects before a stash; both reject without an active store', async ({
    page,
    context,
  }) => {
    await openFixture(page, 'session-idle-empty-column');
    await expect(sameSession(page)).rejects.toThrow('no stashed session');
    expect(await stashSession(page)).toBe(
      await page.evaluate(() => localStorage.getItem('wordcell:session')),
    );
    expect(await sameSession(page)).toBe(true);
    await page.getByTestId('undo').click();
    await expect.poll(() => sameSession(page)).toBe(false);

    const other = await context.newPage();
    expect(other.url()).toBe('about:blank');
    await expect(stashSession(other)).rejects.toThrow('store is undefined');
    await expect(sameSession(other)).rejects.toThrow('store is undefined');
  });

  test("AD-17 trayIds lists the tray band's live tiles and mirrors (`<id>m`) in DOM order; empty in Idle", async ({
    page,
  }) => {
    await openFixture(page, 'session-composing');
    expect(await trayIds(page)).toEqual(['42', '0', '28m']);
    await page.getByTestId('undo').click();
    await expect.poll(() => trayIds(page)).toEqual([]);
  });

  test('AD-17 glidesSettled resolves once document.getAnimations() is empty after an Undo glide (Slow)', async ({
    page,
  }) => {
    await openFixture(page, 'session-composing', { prefs: 'prefs-non-default' });
    await glidesSettled(page);
    const running = await page.evaluate(() => {
      (document.querySelector('[data-testid="undo"]') as HTMLElement).click();
      return document.getAnimations().length;
    });
    expect(running).toBeGreaterThan(0);
    await glidesSettled(page);
    expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
  });
});

test.describe('drag helpers', () => {
  test('AD-17 dragResidue counts wc-drag-* classes and inline face transforms; a clean board is zero', async ({
    page,
  }) => {
    await openBoard(page);
    expect(await dragResidue(page)).toEqual({ classes: 0, transforms: 0 });
    await expectNoResidue(page);
    await page.evaluate(() => {
      document.querySelector('[data-card-id="0"]')?.classList.add('wc-drag-ghost');
      document.querySelector('[data-card-id="1"]')?.classList.add('wc-drag-target');
      const face = document.querySelector<HTMLElement>('[data-card-id="2"] > .face');
      if (face === null) throw new Error('card 2 has no face');
      face.style.transform = 'translate(3px, 4px)';
    });
    expect(await dragResidue(page)).toEqual({ classes: 2, transforms: 1 });
    await expect(expectNoResidue(page)).rejects.toThrow();
  });
});

test.describe('gesture and geometry helpers', () => {
  test('AD-17 plus offsets a point; path lists steps points from the start (excluded) to the end (included)', () => {
    expect(plus({ x: 1, y: 2 }, 3, -4)).toEqual({ x: 4, y: -2 });
    expect(gesturePath({ x: 0, y: 0 }, { x: 8, y: 4 }, 4)).toEqual([
      { x: 2, y: 1 },
      { x: 4, y: 2 },
      { x: 6, y: 3 },
      { x: 8, y: 4 },
    ]);
  });

  test('AD-17 onAndroid and onDesktop skip exactly on the project that does not match', () => {
    const original = test.skip;
    const calls: unknown[][] = [];
    (test as { skip: unknown }).skip = (...args: unknown[]) => {
      calls.push(args);
    };
    try {
      onAndroid();
      onDesktop();
    } finally {
      (test as { skip: unknown }).skip = original;
    }
    const name = test.info().project.name;
    expect(calls.map((c) => c[0])).toEqual([name !== 'android', name !== 'desktop']);
  });

  test('AD-17 isList matches the word-list fetch, not the dev server en.txt?url module', () => {
    const request = (url: string) => ({ url: () => url }) as unknown as Request;
    expect(isList(request('http://localhost/assets/en-abc123.txt'))).toBe(true);
    expect(isList(request('http://localhost/generated/dictionary/en.txt'))).toBe(true);
    expect(isList(request('http://localhost/generated/dictionary/en.txt?url'))).toBe(false);
    expect(isList(request('http://localhost/assets/other.txt'))).toBe(false);
  });

  test('AD-17 faceOf, idOf and css read a card wrapper: its own face, its card id, a computed property', async ({
    page,
  }) => {
    await openFixture(page, 'session-idle-fresh');
    const card = page.getByTestId('card-0');
    await expect(faceOf(card)).toHaveCount(1);
    expect(
      await faceOf(card).evaluate((el) => el.parentElement?.getAttribute('data-card-id')),
    ).toBe('0');
    expect(await idOf(card)).toBe(0);
    expect(await css(page.locator('body'), 'display')).toBe('block');
  });

  test('AD-17 targets lists the columns of wc-drag-target elements; none on a clean board', async ({
    page,
  }) => {
    await openFixture(page, 'session-idle-fresh');
    expect(await targets(page)).toEqual([]);
    await page.evaluate(() => {
      document.querySelector('[data-testid="column-4"]')?.classList.add('wc-drag-target');
      document.querySelector('[data-testid="foot-6"]')?.classList.add('wc-drag-target');
    });
    expect((await targets(page)).sort()).toEqual([4, 6]);
  });

  test('AD-17 expectFlownBack passes on the rest box within 1 px and rejects off it', async ({
    page,
  }) => {
    await openFixture(page, 'session-idle-fresh');
    const face = faceOf(page.getByTestId('card-0'));
    const rest = await box(face);
    await expectFlownBack(face, rest);
    await expectFlownBack(face, { ...rest, x: rest.x + 1 });
    await expect(expectFlownBack(face, { ...rest, x: rest.x + 3 })).rejects.toThrow();
    // A running animation on the face is not flown back; it resolves once the animation ends.
    await face.evaluate((el) => {
      (window as unknown as { __anim: Animation }).__anim = el.animate(
        [{ opacity: 1 }, { opacity: 0.5 }],
        { duration: 60_000 },
      );
    });
    await expect(
      expect(async () => expectFlownBack(face, rest)).toPass({ timeout: 300 }),
    ).rejects.toThrow();
    await face.evaluate(() => (window as unknown as { __anim: Animation }).__anim.cancel());
    await expectFlownBack(face, rest);
  });

  test('AD-17 placeholder, space and footCorner locate an empty column, a point in its space and a foot corner', async ({
    page,
  }) => {
    await openFixture(page, 'session-idle-empty-column');
    await expect(placeholder(page, 1)).toHaveCount(1);
    const f = await box(foot(page, 1));
    expect(await space(page, 1)).toEqual({ x: f.x + f.w / 2, y: f.y - 6 });
    expect(await footCorner(page, 1)).toEqual({ x: f.x + 3, y: f.y + 3 });
    // Column 2 is full (7 cards), column 1 is empty with room.
    await expect(cards(page, 2)).toHaveCount(7);
    await expect(space(page, 2)).rejects.toThrow('column 2 has no empty space');
  });

  test('AD-17 holdThrough moves one held touch through the points, runs check after each and returns the live hold', async ({
    page,
  }) => {
    await openFixture(page, 'session-idle-fresh');
    const from = await centre(cards(page, 1).last());
    const to = plus(from, 120, -160);
    const seen: number[] = [];
    const hold = await holdThrough(page, from, gesturePath(from, to, 3), async (i) => {
      seen.push(i);
    });
    try {
      expect(seen).toEqual([0, 1, 2]);
      await hold.moveTo(plus(to, 5, 5));
    } finally {
      await hold.end();
    }
    await expect(
      holdThrough(page, from, gesturePath(from, to, 2), async (i) => {
        if (i === 1) throw new Error('check failed');
      }),
    ).rejects.toThrow('check failed');
    await expectNoResidue(page);
  });
});

test.describe('session and selection helpers', () => {
  test('AD-17 draft and draftDetail read the move at the cursor; they reject when there is none', async ({
    page,
  }) => {
    await openFixture(page, 'session-composing');
    const detail = await draftDetail(page);
    expect(detail).toMatchObject({
      phase: 'composing',
      sourceColumn: 3,
      sourceCount: 2,
      destinationColumn: 6,
      destinationCount: 1,
    });
    expect(typeof detail.destinationSide).toBe('string');
    expect(detail.arrangement.length).toBeGreaterThan(0);
    const { destinationSide: _side, arrangement: _arrangement, ...base } = detail;
    expect(await draft(page)).toEqual(base);
    const fresh = await page.context().newPage();
    await openFixture(fresh, 'session-idle-fresh');
    await expect(draft(fresh)).rejects.toThrow('no move at cursor');
    await expect(draftDetail(fresh)).rejects.toThrow('no move at cursor');
  });

  test('AD-17 storedText, game and storedGame read the stored text and the Session without activeMs', async ({
    page,
    context,
  }) => {
    await openFixture(page, 'session-composing');
    expect(await storedText(page)).toBe(fixture('session-composing.json'));
    const inStore = JSON.parse(await game(page));
    const inStorage = JSON.parse(await storedGame(page));
    expect(inStore.activeMs).toBe(0);
    expect(inStorage).toEqual(inStore);
    expect(await cursorIndex(page)).toBe(inStore.cursor.index);

    const other = await context.newPage();
    await expect(game(other)).rejects.toThrow('store is undefined');
    await expect(cursorIndex(other)).rejects.toThrow('store is undefined');
  });

  test('AD-17 selection, wcOf, expectSelection and select read and wait for the tapped tail and its one History entry', async ({
    page,
  }) => {
    await openFixture(page, 'session-idle-fresh');
    expect(await selection(page)).toBeNull();
    expect(await wcOf(page)).toBe(0);
    await expectSelection(page, null, 0);
    await select(page, 1, 4);
    expect(await selection(page)).toEqual({ column: 1, count: 3 });
    expect(await wcOf(page)).toBe(1);
    await expectSelection(page, { column: 1, count: 3 }, 1);
  });
});

test.describe('SESSIONS literals', () => {
  test('AD-17 SESSIONS.flow6 and SESSIONS.cell10 parse and replay to their stated cursor and cells', () => {
    const expected = {
      flow6: { seed: 1, index: 3, columns: [1, 2, 3], cells: { 7: 14, 8: 7 } },
      cell10: { seed: 3608, index: 1, columns: [], cells: { 10: 10 } },
    } as const;
    for (const [name, want] of Object.entries(expected)) {
      const parsed = parseSession(SESSIONS[name as keyof typeof SESSIONS], EN);
      if (!parsed.ok) throw new Error(`${name} does not parse: ${parsed.reason}`);
      const session = parsed.session;
      expect(session.seed).toBe(want.seed);
      expect(session.cursor).toEqual({ index: want.index, phase: 'idle' });
      const current = view(session, EN);
      expect(current.phase).toBe('idle');
      for (const n of want.columns) {
        expect(current.columns.find((c) => c.column === n)?.cards).toEqual([]);
      }
      for (const [n, count] of Object.entries(want.cells)) {
        expect(current.cells.find((c) => c.cell === Number(n))?.cards).toHaveLength(count);
      }
    }
  });
});

test.describe('blocking helpers', () => {
  test('AD-17 kind and stored read the hook and localStorage; expectOnlyButton and expectAnotherWindow pass on the another-window message', async ({
    page,
  }) => {
    const text = fixture('session-place.json');
    await seedStorage(page, { session: text });
    await openBoard(page);
    expect(await kind(page)).toBe('active');
    expect(await stored(page, 'wordcell:session')).toBe(text);
    expect(await stored(page, 'wordcell:history')).toBeNull();
    // Another page's write halts this one (Q-38).
    const page2 = await page.context().newPage();
    await page2.goto('/favicon.svg');
    await writeKey(page2, 'prefs', '{}');
    await expectAnotherWindow(page);
    await expectOnlyButton(page, 'Reload');
    expect(await kind(page)).toBe('halted');
  });
});

test.describe('dialog helpers', () => {
  test('AD-17 wc, button and hitAt read a healthy board; expectLeaves goes back from the base entry to about:blank', async ({
    page,
  }) => {
    await openBoard(page);
    expect(await wc(page)).toEqual({ wc: 0, launch: expect.any(Number) });
    const undo = await button(page, 'Undo').boundingBox();
    if (undo === null) throw new Error('no Undo box');
    expect(await hitAt(page, undo.x + undo.width / 2, undo.y + undo.height / 2)).toMatchObject({
      kind: 'button',
      dialog: null,
    });
    const card = await page.getByTestId('card-0').boundingBox();
    if (card === null) throw new Error('no card-0 box');
    const hit = await hitAt(page, card.x + card.width / 2, card.y + card.height / 2);
    expect(hit.dialog).toBeNull();
    expect(hit.kind).not.toBe('scrim');
    await expectLeaves(page);
  });
});

test.describe('storage spy', () => {
  test('AD-17 the spy records localStorage writes and removals in order across keys', async ({
    page,
  }) => {
    await page.goto('/');
    await armStorageSpy(page);
    expect(await storageWrites(page)).toEqual([]);
    await page.evaluate(() => {
      localStorage.setItem('wordcell:prefs', 'p1');
      localStorage.setItem('other', 'o');
      localStorage.removeItem('wordcell:prefs');
      localStorage.setItem('wordcell:session', 's');
      localStorage.removeItem('absent');
    });
    expect(await storageWrites(page)).toEqual([
      { key: 'wordcell:prefs', value: 'p1' },
      { key: 'other', value: 'o' },
      { key: 'wordcell:prefs', value: null },
      { key: 'wordcell:session', value: 's' },
      { key: 'absent', value: null },
    ]);
    expect(await readKey(page, 'session')).toBe('s');
    expect(await readKey(page, 'prefs')).toBeNull();
    await expect(armStorageSpy(page)).rejects.toThrow(/already armed/);
  });

  test('AD-17 the thrower records its key, throws storage-spy: <key> and leaves the stored value', async ({
    page,
  }) => {
    await page.goto('/');
    await armStorageSpy(page, { throwOn: 'wordcell:session' });
    const before = await readKey(page, 'session');
    expect(before).not.toBeNull();
    const thrown = await page.evaluate(() => {
      try {
        localStorage.setItem('wordcell:session', 'x');
        return null;
      } catch (error) {
        return (error as Error).message;
      }
    });
    expect(thrown).toBe('storage-spy: wordcell:session');
    expect(await readKey(page, 'session')).toBe(before);
    await writeKey(page, 'prefs', 'p');
    expect(await readKey(page, 'prefs')).toBe('p');
    expect(await storageWrites(page)).toEqual([
      { key: 'wordcell:session', value: 'x' },
      { key: 'wordcell:prefs', value: 'p' },
    ]);
  });

  test('AD-17 the spy does not record sessionStorage writes', async ({ page }) => {
    await page.goto('/');
    await armStorageSpy(page, { throwOn: 'wordcell:session' });
    await page.evaluate(() => {
      sessionStorage.setItem('wordcell:session', 's');
      sessionStorage.setItem('other', 'o');
      sessionStorage.removeItem('wordcell:session');
    });
    expect(await page.evaluate(() => sessionStorage.getItem('other'))).toBe('o');
    expect(await storageWrites(page)).toEqual([]);
  });
});

test.describe('touchDrag / longPress / touchHold', () => {
  async function installProbe(page: Page): Promise<void> {
    await page.evaluate(() => {
      const w = window as unknown as { __probeEvents: ProbeEvent[] };
      w.__probeEvents = [];
      const probe = document.createElement('div');
      probe.style.cssText =
        'position: fixed; inset: 0; z-index: 2147483647; touch-action: none; user-select: none;';
      for (const type of ['pointerdown', 'pointermove', 'pointerup', 'pointercancel']) {
        probe.addEventListener(type, (event) => {
          const e = event as PointerEvent;
          w.__probeEvents.push({
            type: e.type,
            pointerType: e.pointerType,
            clientX: e.clientX,
            clientY: e.clientY,
            timeStamp: e.timeStamp,
            coalesced: e.getCoalescedEvents().length || 1,
          });
        });
      }
      probe.addEventListener('contextmenu', (event) => {
        event.preventDefault();
        const e = event as MouseEvent;
        w.__probeEvents.push({
          type: e.type,
          pointerType: null,
          clientX: e.clientX,
          clientY: e.clientY,
          timeStamp: e.timeStamp,
          coalesced: 1,
        });
      });
      document.body.append(probe);
    });
  }

  async function probeEvents(page: Page): Promise<ProbeEvent[]> {
    await page.waitForFunction(
      () =>
        (window as unknown as { __probeEvents: ProbeEvent[] }).__probeEvents.some(
          (e) => e.type === 'pointerup' || e.type === 'pointercancel',
        ),
      undefined,
      { timeout: 5_000 },
    );
    return page.evaluate(
      () => (window as unknown as { __probeEvents: ProbeEvent[] }).__probeEvents,
    );
  }

  test('AD-17 touchDrag produces touch pointerdown, pointermoves and pointerup', async ({
    page,
  }) => {
    const from = { x: 60, y: 200 };
    const to = { x: 300, y: 600 };
    const steps = 10;
    await page.goto('/');
    await installProbe(page);
    await touchDrag(page, from, to);
    const events = await probeEvents(page);
    const pointer = events.filter((e) => e.type !== 'contextmenu');
    expect(pointer.filter((e) => e.type === 'pointercancel')).toEqual([]);
    for (const e of pointer) expect(e.pointerType).toBe('touch');
    const down = pointer.find((e) => e.type === 'pointerdown');
    const up = pointer.find((e) => e.type === 'pointerup');
    const moves = pointer.filter((e) => e.type === 'pointermove');
    expect(down).toBeDefined();
    expect(up).toBeDefined();
    expect(moves.length).toBeGreaterThanOrEqual(1);
    expect(moves.reduce((sum, e) => sum + e.coalesced, 0)).toBeGreaterThanOrEqual(steps);
    expect(Math.abs((down?.clientX ?? Number.NaN) - from.x)).toBeLessThanOrEqual(1);
    expect(Math.abs((down?.clientY ?? Number.NaN) - from.y)).toBeLessThanOrEqual(1);
    expect(Math.abs((up?.clientX ?? Number.NaN) - to.x)).toBeLessThanOrEqual(1);
    expect(Math.abs((up?.clientY ?? Number.NaN) - to.y)).toBeLessThanOrEqual(1);
  });

  test('AD-17 longPress holds a touch pointer for at least ms', async ({ page }) => {
    const ms = 600;
    const at = { x: 200, y: 400 };
    await page.goto('/');
    await installProbe(page);
    await longPress(page, at, ms);
    const events = await probeEvents(page);
    const pointer = events.filter((e) => e.type !== 'contextmenu');
    expect(pointer.filter((e) => e.type === 'pointercancel')).toEqual([]);
    for (const e of pointer) expect(e.pointerType).toBe('touch');
    const down = pointer.find((e) => e.type === 'pointerdown');
    const up = pointer.find((e) => e.type === 'pointerup');
    expect(down).toBeDefined();
    expect(up).toBeDefined();
    expect((up?.timeStamp ?? Number.NaN) - (down?.timeStamp ?? Number.NaN)).toBeGreaterThanOrEqual(
      ms - 1,
    );
    expect(Math.abs((down?.clientX ?? Number.NaN) - at.x)).toBeLessThanOrEqual(1);
    expect(Math.abs((down?.clientY ?? Number.NaN) - at.y)).toBeLessThanOrEqual(1);
    expect(Math.abs((up?.clientX ?? Number.NaN) - at.x)).toBeLessThanOrEqual(1);
    expect(Math.abs((up?.clientY ?? Number.NaN) - at.y)).toBeLessThanOrEqual(1);
  });
  const probed = (page: Page) =>
    page.evaluate(() => (window as unknown as { __probeEvents: ProbeEvent[] }).__probeEvents);

  test('AD-17 touchHold holds a touch pointer across moveTo steps until end()', async ({
    page,
  }) => {
    const from = { x: 100, y: 300 };
    const steps = [
      { x: 120, y: 320 },
      { x: 140, y: 340 },
      { x: 160, y: 360 },
    ];
    await page.goto('/');
    await installProbe(page);
    const hold = await touchHold(page, from);
    try {
      for (const step of steps) await hold.moveTo(step);
      await animationFrames(page, 2);
      const held = await probed(page);
      expect(held.map((e) => e.type)).not.toContain('pointerup');
      expect(held.map((e) => e.type)).not.toContain('pointercancel');
      expect(held[0]?.type).toBe('pointerdown');
    } finally {
      await hold.end();
    }
    const events = (await probeEvents(page)).filter((e) => e.type !== 'contextmenu');
    for (const e of events) expect(e.pointerType).toBe('touch');
    const types = events.map((e) => e.type);
    expect(types[0]).toBe('pointerdown');
    expect(types.at(-1)).toBe('pointerup');
    expect(types.slice(1, -1).every((type) => type === 'pointermove')).toBe(true);
    expect(events.slice(1, -1).reduce((sum, e) => sum + e.coalesced, 0)).toBeGreaterThanOrEqual(
      steps.length,
    );
    const down = events[0];
    const up = events.at(-1);
    expect(Math.abs((down?.clientX ?? Number.NaN) - from.x)).toBeLessThanOrEqual(1);
    expect(Math.abs((down?.clientY ?? Number.NaN) - from.y)).toBeLessThanOrEqual(1);
    expect(Math.abs((up?.clientX ?? Number.NaN) - 160)).toBeLessThanOrEqual(1);
    expect(Math.abs((up?.clientY ?? Number.NaN) - 360)).toBeLessThanOrEqual(1);
  });

  test('AD-17 touchHold moveTo throws after a failed moveTo or after end(); end() is then a no-op', async ({
    page,
  }) => {
    await page.goto('/');
    await installProbe(page);
    const viewport = page.viewportSize();
    if (viewport === null) throw new Error('no viewport');
    const failed = await touchHold(page, { x: 100, y: 300 });
    await expect(failed.moveTo({ x: viewport.width + 10, y: 300 })).rejects.toThrow(/outside the/);
    // The failed moveTo ended the hold: a pointerup arrives with no further move.
    const events = await probeEvents(page);
    expect(events.filter((e) => e.type === 'pointerup')).toHaveLength(1);
    await expect(failed.moveTo({ x: 120, y: 300 })).rejects.toThrow(/after the hold ended/);
    await failed.end();
    await failed.end();

    const ended = await touchHold(page, { x: 100, y: 300 });
    await ended.end();
    await expect(ended.moveTo({ x: 120, y: 300 })).rejects.toThrow(/after the hold ended/);
    await ended.end();
    await animationFrames(page, 2);
    const all = await probed(page);
    expect(all.filter((e) => e.type === 'pointerdown')).toHaveLength(2);
    expect(all.filter((e) => e.type === 'pointerup')).toHaveLength(2);
    expect(all.filter((e) => e.type === 'pointermove')).toEqual([]);
  });

  test('AD-17 touchHold from outside the viewport rejects with no touch events', async ({
    page,
  }) => {
    await page.goto('/');
    await installProbe(page);
    const viewport = page.viewportSize();
    if (viewport === null) throw new Error('no viewport');
    await expect(touchHold(page, { x: 100, y: viewport.height })).rejects.toThrow(/outside the/);
    await animationFrames(page, 2);
    expect(await probed(page)).toEqual([]);
  });
});

test.describe('hidePage / showPage / pageHide / pageShow', () => {
  async function installRecorder(page: Page): Promise<void> {
    await page.evaluate(() => {
      const w = window as unknown as { __lifecycleEvents: LifecycleEvent[] };
      w.__lifecycleEvents = [];
      const record = (listener: 'window' | 'document') => (event: Event) => {
        w.__lifecycleEvents.push({
          type: event.type,
          listener,
          target:
            event.target === document ? 'document' : event.target === window ? 'window' : 'other',
          visibilityState: document.visibilityState,
          hidden: document.hidden,
          persisted: event instanceof PageTransitionEvent ? event.persisted : null,
        });
      };
      for (const type of ['visibilitychange', 'pagehide', 'pageshow']) {
        window.addEventListener(type, record('window'));
        document.addEventListener(type, record('document'));
      }
    });
  }

  const lifecycleEvents = (page: Page) =>
    page.evaluate(
      () => (window as unknown as { __lifecycleEvents: LifecycleEvent[] }).__lifecycleEvents,
    );

  // Returns the events recorded while `action` ran.
  async function during(page: Page, action: () => Promise<void>): Promise<LifecycleEvent[]> {
    const before = (await lifecycleEvents(page)).length;
    await action();
    return (await lifecycleEvents(page)).slice(before);
  }

  async function expectVisibilityChange(page: Page, action: () => Promise<void>, hidden: boolean) {
    const state = hidden ? 'hidden' : 'visible';
    const events = await during(page, action);
    expect(events).toEqual([
      {
        type: 'visibilitychange',
        listener: 'document',
        target: 'document',
        visibilityState: state,
        hidden,
        persisted: null,
      },
      {
        type: 'visibilitychange',
        listener: 'window',
        target: 'document',
        visibilityState: state,
        hidden,
        persisted: null,
      },
    ]);
    expect(await page.evaluate(() => [document.visibilityState, document.hidden])).toEqual([
      state,
      hidden,
    ]);
  }

  test('AD-17 hidePage / showPage fire one visibilitychange each and reject a no-op', async ({
    page,
  }) => {
    await page.goto('/');
    expect(await page.evaluate(() => document.visibilityState)).toBe('visible');
    await installRecorder(page);
    await expect(showPage(page)).rejects.toThrow(/already 'visible'/);
    await expectVisibilityChange(page, () => hidePage(page), true);
    await expectVisibilityChange(page, () => showPage(page), false);
    await expectVisibilityChange(page, () => hidePage(page), true);
    await expect(hidePage(page)).rejects.toThrow(/already 'hidden'/);
    expect(await lifecycleEvents(page)).toHaveLength(6);
  });

  test('AD-17 startHidden loads the page hidden; showPage then makes it visible with one visibilitychange', async ({
    page,
  }) => {
    await startHidden(page);
    await page.goto('/');
    expect(await page.evaluate(() => [document.visibilityState, document.hidden])).toEqual([
      'hidden',
      true,
    ]);
    await installRecorder(page);
    await expect(hidePage(page)).rejects.toThrow(/already 'hidden'/);
    await expectVisibilityChange(page, () => showPage(page), false);
  });

  test('AD-17 animationFrames resolves after the given number of animation frames', async ({
    page,
  }) => {
    // A blank document: no app code requests frames, so every call counted is the helper's.
    await page.setContent('<p>frames</p>');
    await page.evaluate(() => {
      const w = window as unknown as { __raf: { calls: number; fired: number } };
      w.__raf = { calls: 0, fired: 0 };
      const raf = window.requestAnimationFrame.bind(window);
      window.requestAnimationFrame = (callback) => {
        w.__raf.calls += 1;
        return raf((time) => {
          w.__raf.fired += 1;
          callback(time);
        });
      };
    });
    await animationFrames(page, 3);
    // Exactly three frames requested, each callback fired before the helper resolved.
    expect(await page.evaluate(() => (window as unknown as { __raf: unknown }).__raf)).toEqual({
      calls: 3,
      fired: 3,
    });
  });

  for (const state of ['visible', 'hidden'] as const) {
    test(`AD-17 pageHide / pageShow dispatch one window event each while ${state}`, async ({
      page,
    }) => {
      await page.goto('/');
      if (state === 'hidden') await hidePage(page);
      await installRecorder(page);
      const calls: Array<[string, boolean, () => Promise<void>]> = [
        ['pagehide', false, () => pageHide(page)],
        ['pageshow', true, () => pageShow(page, { persisted: true })],
        ['pageshow', false, () => pageShow(page, { persisted: false })],
      ];
      for (const [type, persisted, action] of calls) {
        const events = await during(page, action);
        expect(events).toEqual([
          {
            type,
            listener: 'window',
            target: 'window',
            visibilityState: state,
            hidden: state === 'hidden',
            persisted,
          },
        ]);
        expect(await page.evaluate(() => document.visibilityState)).toBe(state);
      }
    });
  }
});

test.describe('buildRoot', () => {
  test('AD-17 a missing build names the script that builds it; an unset or unknown PW_PREVIEW throws', () => {
    const repo = mkdtempSync(path.join(tmpdir(), 'build-root-'));
    const saved = process.env.PW_PREVIEW;
    try {
      process.env.PW_PREVIEW = 'dist';
      expect(() => buildRoot(repo)).toThrow(/dist\/index\.html is missing: run npm run build$/);
      process.env.PW_PREVIEW = 'dist-test';
      expect(() => buildRoot(repo)).toThrow(
        /dist-test\/index\.html is missing: run npm run build:test$/,
      );
      process.env.PW_PREVIEW = 'dist-tests';
      expect(() => buildRoot(repo)).toThrow(/PW_PREVIEW must be exactly/);
      delete process.env.PW_PREVIEW;
      expect(() => buildRoot(repo)).toThrow(/PW_PREVIEW must be exactly/);
    } finally {
      if (saved === undefined) delete process.env.PW_PREVIEW;
      else process.env.PW_PREVIEW = saved;
      rmSync(repo, { recursive: true, force: true });
    }
  });
});

test.describe('keys helpers', () => {
  test('AD-17 toComposing, press, arrangeByKeys, where and focusedCard drive Flow 6 by keys alone', async ({
    page,
  }) => {
    test.skip(test.info().project.name !== 'desktop', 'keyboard flows run on desktop');
    await toComposing(page);
    await expect(tray(page)).toBeVisible();
    await expect(tiles(page)).toHaveCount(4);
    expect(await press(page, '8')).toBe(true);
    await expect(tiles(page)).toHaveCount(5);
    await arrangeByKeys(page, 'ENANA');
    await expect(tray(page).locator('.word-line')).toHaveText('ZENANA');
    const at = await where(page);
    expect(at.place).toBe('tray');
    expect(await focusedCard(page)).toBe(at.card);
    expect(await press(page, 'F9')).toBe(false);
  });
});

test.describe('expectBoardFocus', () => {
  test('AD-17 expectBoardFocus resolves on the bottom card of the lowest non-empty column, and on main when every column is empty', async ({
    page,
    browser,
  }) => {
    await openFixture(page, 'session-idle-fresh');
    await cards(page, 1).last().focus();
    await expectBoardFocus(page);
    const second = await browser.newPage();
    await openFixture(second, 'session-idle-empty-column');
    await expect(cards(second, 1)).toHaveCount(0);
    await cards(second, 2).last().focus();
    await expectBoardFocus(second);
    await second.close();
    const won = await browser.newPage();
    await openFixture(won, 'session-won');
    await expect(won.locator('main [data-card-id][data-place="column"]')).toHaveCount(0);
    await won.locator('main').focus();
    await expectBoardFocus(won);
    await won.close();
  });

  test('AD-17 expectBoardFocus rejects with another card or the Menu button focused', async ({
    page,
  }) => {
    await openFixture(page, 'session-idle-fresh');
    await cards(page, 1).first().focus();
    await expect(expectBoardFocus(page, { timeout: 300 })).rejects.toThrow(/expected DIV/);
    await cards(page, 2).last().focus();
    await expect(expectBoardFocus(page, { timeout: 300 })).rejects.toThrow(/expected DIV/);
    await page.getByRole('button', { name: 'Menu', exact: true }).focus();
    await expect(expectBoardFocus(page, { timeout: 300 })).rejects.toThrow(/focused BUTTON/);
  });
});

test.describe('openScene', () => {
  test('AD-17 openScene reaches a scene by its dot and Next, and returns its figure', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 360, height: 740 });
    const start = await openScene(page, {
      fixture: 'session-idle-fresh',
      scene: 2,
      id: 'freeLetter',
      last: 0,
    });
    await expect(start.getByRole('button', { name: 'Next', exact: true })).toBeVisible();
    await expect(start.getByRole('button', { name: 'Replay', exact: true })).toHaveCount(0);
  });

  test('AD-17 openScene seeds prefs and clicks Next `last` times to the Replay frame', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 360, height: 740 });
    const final = await openScene(page, {
      fixture: 'session-idle-fresh',
      prefs: 'prefs-theme-paper',
      scene: 2,
      id: 'freeLetter',
      last: 2,
    });
    await expect(final.getByRole('button', { name: 'Replay', exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe('paper');
  });

  test('AD-17 the prefs-theme-scifi fixture seeds the scifi theme', async ({ page }) => {
    await openFixture(page, 'session-idle-fresh', { prefs: 'prefs-theme-scifi' });
    expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe('scifi');
  });
});
