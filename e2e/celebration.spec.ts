import { expect, type Page, type Request, test } from '@playwright/test';
import { LONG_PRESS_MS } from '../src/ui/gestures/classify';
import { SWALLOW_MS } from '../src/ui/gestures/click-swallow';
import {
  box,
  centre,
  column,
  END_SHEET,
  openFixture,
  type Point,
  sameSession,
  stashSession,
} from './helpers/board';
import {
  advance,
  enableCelebration,
  FAST_CAP_STEP_MS,
  finishCelebration,
  MANUAL_STEP_MS,
  NORMAL_CAP_STEP_MS,
  running,
  SLOW_CAP_STEP_MS,
  WON_ROWS,
  watchAdded,
} from './helpers/celebration';
import { button, expectLeaves, wc } from './helpers/dialogs';
import { animationFrames, hidePage, pageHide, showPage } from './helpers/lifecycle';
import { recordRegion, sets } from './helpers/live-region';
import { onAndroid, onDesktop } from './helpers/project';
import { isList, waitForDictionary } from './helpers/restore';
import { doubleTap, touchHold } from './helpers/touch';

// Epic 10 entry 5 (R-87; AD-13 celebration bullet, AD-17 Celebration seam, AD-19 Start): the win
// trigger, driven through the hook's manual clock. session-won-words (seed 2089, ten words, QU in
// JDAQUYE) plus one Undo is the Place phase whose Confirm wins. Speeds: `prefs-fast` Fast,
// `prefs-non-default` Slow, Normal by default.

const ROOT = '[data-celebration-root]';
const GROUP = '[data-celebration-group]';
const primary = (page: Page) => page.getByTestId('primary-action');
const sheet = (page: Page) => page.getByRole('dialog', { name: END_SHEET });
const wcOf = (page: Page) => wc(page).then((state) => state?.wc);
const historyLength = (page: Page) => page.evaluate(() => history.length);

/** The board one Confirm from a win, the celebration enabled (manual clock). */
async function readyToWin(page: Page, prefs?: string): Promise<void> {
  await openFixture(page, 'session-won-words', {
    ...(prefs === undefined ? {} : { prefs }),
    steps: ['undo'],
  });
  await enableCelebration(page);
}

async function winIntoRun(page: Page): Promise<void> {
  await primary(page).click();
  await expect.poll(() => running(page)).toBe(true);
}

const REPLAY = 'Replay this deal';
const replay = (page: Page) => sheet(page).getByRole('button', { name: REPLAY, exact: true });
const replayConfirm = (page: Page) => page.getByRole('dialog', { name: 'Replay this deal?' });
const viewSheet = (page: Page) => page.locator('[data-view-sheet]');

// An empty band point (AD-12): the centre of column 1 (empty on the won board) clipped to the band
// between the lower of the top bar's and the banner's bottom and the action bar's top.
async function emptyPoint(page: Page): Promise<Point> {
  const bottomOf = async (band: string) => {
    const b = await box(page.locator(`[data-band="${band}"]`));
    return b.y + b.h;
  };
  const col = await box(column(page, 1));
  const top = Math.max(col.y, await bottomOf('topBar'), await bottomOf('banner'));
  const bottom = Math.min(col.y + col.h, (await box(page.locator('[data-band="actionBar"]'))).y);
  if (!(bottom > top)) throw new Error('column 1 is not in the band');
  return { x: col.x + col.w / 2, y: (top + bottom) / 2 };
}

type Recorded = { __inputs?: string[] };

// A page-side window bubble-phase `pointerdown`/`pointerup`/`click` recorder, from now on (no
// `__wordcell`).
async function recordInputs(page: Page): Promise<() => Promise<string[]>> {
  await page.evaluate(() => {
    const w = window as unknown as Recorded;
    const seen: string[] = [];
    w.__inputs = seen;
    for (const type of ['pointerdown', 'pointerup', 'click']) {
      window.addEventListener(type, () => seen.push(type));
    }
  });
  return () => page.evaluate(() => [...((window as unknown as Recorded).__inputs ?? [])]);
}

type Seen = { type: string; pointerType: string; timeStamp: number };
type Captured = { __captured?: Seen[] };

// A page-side window capture-phase recorder (window capture runs before every `document` listener,
// the skip's included) of `pointerdown`, `pointerup`, `click` and `keydown` with their
// `event.timeStamp`, from now on (no `__wordcell`).
async function recordCaptured(page: Page): Promise<() => Promise<Seen[]>> {
  await page.evaluate(() => {
    const w = window as unknown as Captured;
    const seen: Seen[] = [];
    w.__captured = seen;
    for (const type of ['pointerdown', 'pointerup', 'click', 'keydown']) {
      window.addEventListener(
        type,
        (event) => {
          const pointerType = event instanceof PointerEvent ? event.pointerType : '';
          seen.push({ type, pointerType, timeStamp: event.timeStamp });
        },
        { capture: true },
      );
    }
  });
  return () => page.evaluate(() => [...((window as unknown as Captured).__captured ?? [])]);
}

/** The `timeStamp` of the one recorded `type` event; throws unless exactly one was recorded. */
function stampOf(seen: Seen[], type: string): number {
  const matches = seen.filter((event) => event.type === type);
  if (matches.length !== 1) throw new Error(`expected one ${type}, recorded ${matches.length}`);
  return (matches[0] as Seen).timeStamp;
}

// The sheet expanded with Replay this deal focused and not activated, the Session unchanged.
async function expectSkipped(page: Page): Promise<void> {
  expect(await running(page)).toBe(false);
  await expect(sheet(page)).toBeVisible();
  await expect(replay(page)).toBeFocused();
  // Vacuous on a finished game (new-game.ts `requestReplay` opens the confirm only in progress):
  // `sameSession` and the visible sheet are the activation detectors here.
  await expect(replayConfirm(page)).toHaveCount(0);
  await expect(viewSheet(page)).toHaveCount(0);
  expect(await sameSession(page)).toBe(true);
}

// Steps the manual clock 16 ms at a time, at most `cap` ms, until a group of the live run is shown
// (computed opacity > 0 and a transform written to its first copy, SPEC F21, once that copy has
// had its turn, SPEC F26); returns its index, -1 if none was.
function stepUntilShown(page: Page, cap: number): Promise<number> {
  return page.evaluate(
    ([max, stepMs]) => {
      const hook = window.__wordcell;
      if (hook === undefined) throw new Error('AD-17 no test hook');
      const groups = [...document.querySelectorAll<HTMLElement>('[data-celebration-group]')];
      for (let t = 0; t < max && hook.celebration.running(); t += stepMs) {
        hook.celebration.advance(stepMs);
        const shown = groups.findIndex((g) => {
          // A group with no copy is never shown.
          const first = g.firstElementChild as HTMLElement | null;
          return (
            Number(getComputedStyle(g).opacity) > 0 &&
            first !== null &&
            first.style.transform !== ''
          );
        });
        if (shown >= 0) return shown;
      }
      return -1;
    },
    [cap, MANUAL_STEP_MS] as const,
  );
}

// Ticket 10.7 (R-87 interruption rows; AD-19 Hide, Resize; SPEC F13).
const COPIES = '[data-celebration]';
/** The AD-15 Halted surface's heading (e2e/blocking.spec.ts `FATAL`). */
const FATAL = 'Something went wrong.';
const WIN_TITLE = 'Every column cleared.';
const menuButton = (page: Page) => page.getByRole('button', { name: 'Menu', exact: true });
const menu = (page: Page) => page.getByRole('dialog', { name: 'Menu' });
const fatal = (page: Page) => page.getByRole('heading', { name: FATAL, exact: true });
const collapsedBar = (page: Page) => page.getByRole('button', { name: /^Show result:/ });

// The run over with no sheet: no copies, the end sheet not open, history back at the base entry.
async function expectEndedNoSheet(page: Page): Promise<void> {
  expect(await running(page)).toBe(false);
  await expect(page.locator(COPIES)).toHaveCount(0);
  await expect(sheet(page)).toHaveCount(0);
  await expect.poll(() => wcOf(page)).toBe(0);
}

// The Cancel outcome (Undo, New game, `N`): as above, and still no sheet a few frames later.
async function expectCancelled(page: Page): Promise<void> {
  await expectEndedNoSheet(page);
  await animationFrames(page, 3);
  await expect(sheet(page)).toHaveCount(0);
  expect(await wcOf(page)).toBe(0);
}

// The run ended into the expanded sheet: no copies, Replay this deal focused, one overlay entry.
async function expectEndedIntoSheet(page: Page): Promise<void> {
  expect(await running(page)).toBe(false);
  await expect(page.locator(COPIES)).toHaveCount(0);
  await expect(sheet(page)).toBeVisible();
  await expect(replay(page)).toBeFocused();
  await expect.poll(() => wcOf(page)).toBe(1);
}

// One menu over the expanded sheet, two overlay entries, no Halted surface.
async function expectOneMenu(page: Page): Promise<void> {
  await expect(menu(page)).toBeVisible();
  await animationFrames(page, 3);
  await expect(menu(page)).toHaveCount(1);
  await expect.poll(() => wcOf(page)).toBe(2);
  await expect(fatal(page)).toHaveCount(0);
  expect(await running(page)).toBe(false);
  await expect(page.locator(COPIES)).toHaveCount(0);
}

test.describe('android', () => {
  test.beforeEach(onAndroid);

  test('R-87 a win plays the celebration with the sheet hidden; its end pops the entry before the sheet opens expanded with Replay this deal focused', async ({
    page,
  }) => {
    await readyToWin(page);
    await winIntoRun(page);
    await expect(page.locator(GROUP)).toHaveCount(WON_ROWS.length);
    const lengthWhileRunning = await historyLength(page);
    expect(await wcOf(page)).toBe(1);
    await expect(sheet(page)).toHaveCount(0);
    await expect(collapsedBar(page)).toHaveCount(0);
    // A page-side popstate counter: the run's end makes exactly one pop (`pushState` fires no
    // popstate); the pop-before-push order follows from the wc and history.length checks.
    await page.evaluate(() => {
      const w = window as unknown as { __pops?: number };
      w.__pops = 0;
      window.addEventListener('popstate', () => {
        w.__pops = (w.__pops ?? 0) + 1;
      });
    });
    const pops = () => page.evaluate(() => (window as unknown as { __pops?: number }).__pops);
    expect(await pops()).toBe(0);
    await finishCelebration(page);
    await expect(sheet(page).getByRole('button', { name: 'Replay this deal' })).toBeFocused();
    await expect.poll(() => wcOf(page)).toBe(1);
    expect(await pops()).toBe(1);
    await animationFrames(page, 3);
    expect(await wcOf(page)).toBe(1);
    expect(await pops()).toBe(1);
    expect(await historyLength(page)).toBe(lengthWhileRunning);
  });

  test('R-87 at Fast the run ends by the cap rounded up to a 16 ms step: sheet expanded', async ({
    page,
  }) => {
    await readyToWin(page, 'prefs-fast');
    await winIntoRun(page);
    await advance(page, FAST_CAP_STEP_MS);
    expect(await running(page)).toBe(false);
    await expect(sheet(page)).toBeVisible();
  });

  test('R-87 at Slow the run still runs after the Fast cap and ends by the Slow cap rounded up to a 16 ms step: sheet expanded', async ({
    page,
  }) => {
    await readyToWin(page, 'prefs-non-default');
    await winIntoRun(page);
    await advance(page, FAST_CAP_STEP_MS);
    expect(await running(page)).toBe(true);
    await expect(sheet(page)).toHaveCount(0);
    await expect(collapsedBar(page)).toHaveCount(0);
    await advance(page, SLOW_CAP_STEP_MS - FAST_CAP_STEP_MS);
    expect(await running(page)).toBe(false);
    await expect(sheet(page)).toBeVisible();
  });

  test('R-87 a Give up plays no celebration: the sheet opens expanded at once', async ({
    page,
  }) => {
    await openFixture(page, 'session-idle-fresh');
    await enableCelebration(page);
    const added = await watchAdded(page, ROOT);
    await page.getByRole('button', { name: 'Menu', exact: true }).click();
    await page.getByRole('button', { name: 'Give up', exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'Game given up.' })).toBeVisible();
    expect(await running(page)).toBe(false);
    expect(await added()).toBe(false);
  });

  test('R-87 under reduced motion a win plays no celebration: the sheet opens expanded', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await readyToWin(page);
    const added = await watchAdded(page, ROOT);
    await primary(page).click();
    await expect(sheet(page)).toBeVisible();
    expect(await running(page)).toBe(false);
    expect(await added()).toBe(false);
  });

  test('R-87 a page hidden when the win settles plays no celebration: the sheet is expanded on return', async ({
    page,
  }) => {
    await readyToWin(page, 'prefs-non-default');
    const added = await watchAdded(page, ROOT);
    await primary(page).click();
    await hidePage(page);
    // Slow (`prefs-non-default`): its longer glide plus the 300 ms floor give the `hidePage` its
    // margin before the settle. The hide flush finishes the glide, but the settle callback still
    // waits for the winning guard's 300 ms floor (AD-14): stay hidden until today's open has run
    // (the visibility is emulated, so the opened sheet renders).
    await expect(sheet(page)).toBeVisible();
    await showPage(page);
    await expect(sheet(page)).toBeVisible();
    expect(await running(page)).toBe(false);
    expect(await added()).toBe(false);
  });

  test('R-87 a reload mid-run is a relaunch: the sheet opens expanded at boot and no copy is drawn', async ({
    page,
  }) => {
    await readyToWin(page);
    await winIntoRun(page);
    await page.reload();
    await expect(sheet(page)).toBeVisible();
    expect(await running(page)).toBe(false);
    await expect(page.locator('[data-celebration]')).toHaveCount(0);
  });

  test('R-87 the copies: 55 face copies beside the 52 live cards, none live or a mirror, each group spelling its word, a group shown by the run', async ({
    page,
  }) => {
    await readyToWin(page);
    await winIntoRun(page);
    await expect(page.locator('[data-card-id]')).toHaveCount(52);
    await expect(page.locator('[data-celebration]')).toHaveCount(55);
    await expect(
      page.locator('[data-celebration]:is([data-card-id], [data-testid], [data-mirror-of])'),
    ).toHaveCount(0);
    const words = await page
      .locator(GROUP)
      .evaluateAll((groups) =>
        groups.map((g) =>
          [...g.querySelectorAll('.glyph')]
            .map((glyph) => (glyph.textContent === 'Qu' ? 'QU' : glyph.textContent))
            .join(''),
        ),
      );
    expect(words).toEqual(WON_ROWS.map((row) => row.split(',')[0]));
    expect(await stepUntilShown(page, NORMAL_CAP_STEP_MS)).toBeGreaterThanOrEqual(0);
  });

  for (const [name, at] of [
    ['an empty band point', emptyPoint],
    ['a non-empty WordCell', (page: Page) => centre(page.getByTestId('wordcell-3'))],
  ] as const) {
    test(`R-87 a touch press on ${name} skips the run, consumed: held until the sheet is expanded and released within the tap window, no pointerdown, pointerup or click reaches the page, nothing activated, Session unchanged`, async ({
      page,
    }) => {
      await readyToWin(page);
      await winIntoRun(page);
      await stashSession(page);
      const point = await at(page);
      const inputs = await recordInputs(page);
      const captured = await recordCaptured(page);
      const hold = await touchHold(page, point);
      try {
        // At frame rate, not toBeVisible's retry backoff, so the hold stays within the tap window.
        await expect.poll(() => sheet(page).isVisible(), { intervals: [16] }).toBe(true);
      } finally {
        await hold.end();
      }
      await expect(sheet(page)).toBeVisible();
      // The browser made the press a tap (its click dispatched) and released it within the
      // long-press time, by the page's event clock: fail rather than prove nothing.
      await expect
        .poll(async () => (await captured()).map((e) => `${e.type} ${e.pointerType}`))
        .toEqual(['pointerdown touch', 'pointerup touch', 'click touch']);
      const seen = await captured();
      expect(stampOf(seen, 'pointerup') - stampOf(seen, 'pointerdown')).toBeLessThan(LONG_PRESS_MS);
      await animationFrames(page, 3);
      expect(await inputs()).toEqual([]);
      await expectSkipped(page);
      // Positive control: once the tail is gone, the recorder sees an ordinary tap on the empty
      // point.
      const empty = await emptyPoint(page);
      await page.waitForTimeout(300);
      await page.touchscreen.tap(empty.x, empty.y);
      await expect.poll(inputs).toEqual(['pointerdown', 'pointerup', 'click']);
    });
  }

  test('R-87 a quick second tap on Replay this deal after a touch press skip is consumed (SPEC F18): no pointerdown, pointerup or click reaches the page, nothing activated, Session unchanged', async ({
    page,
  }) => {
    await readyToWin(page);
    await winIntoRun(page);
    await stashSession(page);
    const point = await emptyPoint(page);
    const inputs = await recordInputs(page);
    const captured = await recordCaptured(page);
    await page.touchscreen.tap(point.x, point.y);
    // At frame rate, so the second tap lands within the guard.
    await expect.poll(() => replay(page).isVisible(), { intervals: [16] }).toBe(true);
    const second = await centre(replay(page));
    const hit = await page.evaluate(
      ({ x, y }) => document.elementFromPoint(x, y)?.closest('button')?.textContent?.trim(),
      second,
    );
    expect(hit).toBe(REPLAY);
    await page.touchscreen.tap(second.x, second.y);
    // Both presses were taps, the second pressed within the guard after the first's release, by
    // the page's event clock: fail rather than prove nothing.
    await expect
      .poll(async () => (await captured()).map((e) => `${e.type} ${e.pointerType}`))
      .toEqual([
        'pointerdown touch',
        'pointerup touch',
        'click touch',
        'pointerdown touch',
        'pointerup touch',
        'click touch',
      ]);
    const [, firstUp, , secondDown] = (await captured()).map((e) => e.timeStamp);
    expect((secondDown as number) - (firstUp as number)).toBeLessThan(SWALLOW_MS);
    await animationFrames(page, 3);
    expect(await inputs()).toEqual([]);
    await expectSkipped(page);
  });

  test('R-87 back skips the run: the sheet expanded and the app open; back again collapses the sheet, the app still open', async ({
    page,
  }) => {
    await readyToWin(page);
    await winIntoRun(page);
    await page.goBack();
    await expect(sheet(page)).toBeVisible();
    expect(await running(page)).toBe(false);
    expect(page.url()).not.toBe('about:blank');
    await expect.poll(() => wcOf(page)).toBe(1);
    await page.goBack();
    await expect(sheet(page)).toHaveCount(0);
    await expect(page.getByRole('button', { name: /^Show result:/ })).toBeVisible();
    await expect.poll(() => wcOf(page)).toBe(0);
    expect(page.url()).not.toBe('about:blank');
    await expect(page.getByRole('heading', { name: 'WordCell' })).toBeVisible();
  });

  test('R-87 a touch held on an empty band point from before the Confirm, released mid-run, does not skip it', async ({
    page,
  }) => {
    await readyToWin(page);
    const point = await emptyPoint(page);
    const captured = await recordCaptured(page);
    const hold = await touchHold(page, point);
    try {
      // Undo leaves focus on the first strip card (focusByPhase), where Enter confirms.
      await page.keyboard.press('Enter');
      await expect.poll(() => running(page)).toBe(true);
    } finally {
      await hold.end();
    }
    // The Enter came within the long-press time of the touch, by the page's event clock.
    const seen = await captured();
    expect(stampOf(seen, 'keydown') - stampOf(seen, 'pointerdown')).toBeLessThan(LONG_PRESS_MS);
    // The release never reaches the page here either way: the AD-14 winning guard marks every
    // gesture open at its install consumed (motion.ts `install`, F8), so only `running()` shows the
    // skip ignored it.
    await animationFrames(page, 3);
    expect(await running(page)).toBe(true);
    await expect(sheet(page)).toHaveCount(0);
  });

  const CONTROL =
    'button, a[href], input, select, textarea, [role="button"], [tabindex]:not([tabindex="-1"])';

  // A point inside the `band` (a bar or the dictionary banner) whose `elementFromPoint` is in it and
  // under no control (so a press there activates nothing): the first of a few candidates (its centre, then its padding).
  async function quietBarPoint(
    page: Page,
    band: 'topBar' | 'actionBar' | 'banner',
  ): Promise<Point> {
    const b = await box(page.locator(`[data-band="${band}"]`));
    const candidates = [
      { x: b.x + b.w / 2, y: b.y + b.h / 2 },
      { x: b.x + b.w / 2, y: b.y + 2 },
      { x: b.x + 2, y: b.y + b.h / 2 },
    ];
    for (const p of candidates) {
      const quiet = await page.evaluate(
        ({ x, y, selector, control }) => {
          const el = document.elementFromPoint(x, y);
          return el !== null && el.closest(selector) !== null && el.closest(control) === null;
        },
        { ...p, selector: `[data-band="${band}"]`, control: CONTROL },
      );
      if (quiet) return p;
    }
    throw new Error(`no point in ${band} without a control under it`);
  }

  type Pressed = { __pressed?: string[] };

  // A page-side window capture-phase `pointerdown` recorder, from now on (no `__wordcell`): each
  // press's pointer type, its target's `data-band` and whether a control holds the target.
  async function recordPressTargets(page: Page): Promise<() => Promise<string[]>> {
    await page.evaluate((control) => {
      const w = window as unknown as Pressed;
      const seen: string[] = [];
      w.__pressed = seen;
      window.addEventListener(
        'pointerdown',
        (event) => {
          const target = event.target as Element;
          const band = target.closest<HTMLElement>('[data-band]')?.dataset.band;
          const where = target.closest(control) === null ? 'no control' : 'control';
          seen.push(`${event.pointerType} ${band} ${where}`);
        },
        { capture: true },
      );
    }, CONTROL);
    return () => page.evaluate(() => [...((window as unknown as Pressed).__pressed ?? [])]);
  }

  // The top bar by touch on its score. The action bar by mouse: its one control, the primary
  // button, spans the bar but for a 4–6 px margin, and Chromium's touch adjustment retargets every
  // touch in that margin to the button (its click would act), so only a mouse press lands there.
  test('R-87 a press on the top bar (touch) or the action bar (mouse) where no control lies does not skip the run', async ({
    page,
  }) => {
    await readyToWin(page);
    await winIntoRun(page);
    const pressed = await recordPressTargets(page);
    const top = await quietBarPoint(page, 'topBar');
    await page.touchscreen.tap(top.x, top.y);
    await animationFrames(page, 3);
    expect(await pressed()).toEqual(['touch topBar no control']);
    expect(await running(page)).toBe(true);
    await expect(sheet(page)).toHaveCount(0);
    const bar = await quietBarPoint(page, 'actionBar');
    await page.mouse.click(bar.x, bar.y);
    await animationFrames(page, 3);
    expect(await pressed()).toEqual(['touch topBar no control', 'mouse actionBar no control']);
    expect(await running(page)).toBe(true);
    await expect(sheet(page)).toHaveCount(0);
  });

  // A point 2 px below the top bar under Undo, and 1 px above the action bar over the primary
  // button: outside the bar's rect (elementFromPoint is in the band), where Chromium's touch
  // adjustment retargets the touch onto that bar control (its click would un-win or deal).
  for (const [name, beside] of [
    [
      'the top bar',
      async (page: Page): Promise<Point> => {
        const b = await box(page.locator('[data-band="topBar"]'));
        const undo = await box(page.getByTestId('undo'));
        return { x: undo.x + undo.w / 2, y: b.y + b.h + 2 };
      },
    ],
    [
      'the action bar',
      async (page: Page): Promise<Point> => {
        const b = await box(page.locator('[data-band="actionBar"]'));
        const p = await box(primary(page));
        return { x: p.x + p.w / 2, y: b.y - 1 };
      },
    ],
  ] as const) {
    test(`R-87 a touch just beside ${name}, outside its rect, skips the run, consumed: no pointerdown, pointerup or click reaches the page, nothing activated, Session unchanged`, async ({
      page,
    }) => {
      await readyToWin(page);
      await winIntoRun(page);
      await stashSession(page);
      const point = await beside(page);
      const outside = await page.evaluate(
        ({ x, y }) =>
          document.elementFromPoint(x, y)?.closest('[data-band]')?.getAttribute('data-band'),
        point,
      );
      expect(['topBar', 'actionBar']).not.toContain(outside);
      const pressed = await recordPressTargets(page);
      const inputs = await recordInputs(page);
      await page.touchscreen.tap(point.x, point.y);
      await expect(sheet(page)).toBeVisible();
      await animationFrames(page, 3);
      // The touch was retargeted onto the bar control: fail rather than prove nothing.
      expect(await pressed()).toEqual([
        `touch ${name === 'the top bar' ? 'topBar' : 'actionBar'} control`,
      ]);
      expect(await inputs()).toEqual([]);
      await expectSkipped(page);
    });
  }

  test('R-87 the dictionary banner’s Reload pressed mid-run refetches and does not skip the run', async ({
    page,
  }) => {
    const requests: Request[] = [];
    page.on('request', (request) => {
      if (isList(request)) requests.push(request);
    });
    await page.route('**/en*.txt', (route) => route.fulfill({ status: 500, body: '' }));
    await readyToWin(page);
    await waitForDictionary(page, 'failed');
    await expect(page.getByText("Word list didn't load.", { exact: true })).toBeVisible();
    expect(requests).toHaveLength(1);
    await winIntoRun(page);
    await button(page, 'Reload').tap();
    await expect.poll(() => requests.length).toBe(2);
    expect(await running(page)).toBe(true);
    await expect(sheet(page)).toHaveCount(0);
  });

  // The standing rule of 2026-10-24 (R-87, story Notes): the whole dictionary banner is exempt.
  test('R-87 a press on the dictionary banner where no control lies does not skip the run', async ({
    page,
  }) => {
    await page.route('**/en*.txt', (route) => route.fulfill({ status: 500, body: '' }));
    await readyToWin(page);
    await waitForDictionary(page, 'failed');
    await expect(page.getByText("Word list didn't load.", { exact: true })).toBeVisible();
    await winIntoRun(page);
    const pressed = await recordPressTargets(page);
    const point = await quietBarPoint(page, 'banner');
    await page.touchscreen.tap(point.x, point.y);
    await animationFrames(page, 3);
    expect(await pressed()).toEqual(['touch banner no control']);
    expect(await running(page)).toBe(true);
    await expect(sheet(page)).toHaveCount(0);
  });

  test('R-87 a Redo that restores the win plays it again: the first run is gone and a new group is shown', async ({
    page,
  }) => {
    await readyToWin(page);
    await winIntoRun(page);
    const first = await page.locator(GROUP).first().elementHandle();
    if (first === null) throw new Error('no first-run group');
    await finishCelebration(page);
    await page.getByTestId('undo').click();
    await expect(sheet(page)).toHaveCount(0);
    expect(await running(page)).toBe(false);
    await page.getByTestId('redo').click();
    await expect.poll(() => running(page)).toBe(true);
    expect(await first.evaluate((el) => el.isConnected)).toBe(false);
    await expect(page.locator(GROUP)).toHaveCount(WON_ROWS.length);
    await expect(page.locator('[data-celebration]')).toHaveCount(55);
    expect(await stepUntilShown(page, NORMAL_CAP_STEP_MS)).toBeGreaterThanOrEqual(0);
  });

  test('R-87 hiding the app mid-run ends it with no sheet and no overlay entry; a second flush changes nothing; on return the sheet is expanded with Replay this deal focused and no outcome announced; ☰ opens the menu over it and back closes only the menu; back again collapses the sheet, the app still open', async ({
    page,
  }) => {
    await readyToWin(page);
    await winIntoRun(page);
    await recordRegion(page);
    await hidePage(page);
    await expectEndedNoSheet(page);
    // The `pagehide` flush after the hide: no run left, so nothing changes and nothing throws.
    await pageHide(page);
    await animationFrames(page, 3);
    await expect(fatal(page)).toHaveCount(0);
    await expectEndedNoSheet(page);
    await showPage(page);
    await expectEndedIntoSheet(page);
    // Epic 6 SPEC F16: a return from hidden is silent.
    await animationFrames(page, 3);
    expect((await sets(page)).filter((set) => set.startsWith(WIN_TITLE))).toEqual([]);
    await menuButton(page).tap();
    await expect(menu(page)).toBeVisible();
    await expect.poll(() => wcOf(page)).toBe(2);
    await page.goBack();
    await expect(menu(page)).toHaveCount(0);
    await expect(sheet(page)).toBeVisible();
    await expect.poll(() => wcOf(page)).toBe(1);
    await page.goBack();
    await expect(sheet(page)).toHaveCount(0);
    await expect(collapsedBar(page)).toBeVisible();
    await expect.poll(() => wcOf(page)).toBe(0);
    expect(page.url()).not.toBe('about:blank');
  });

  for (const [name, trigger] of [
    ['a resize', (page: Page) => page.setViewportSize({ width: 412, height: 800 })],
    [
      'an orientationchange',
      (page: Page) => page.evaluate(() => window.dispatchEvent(new Event('orientationchange'))),
    ],
  ] as const) {
    test(`R-87 ${name} mid-run ends it: no copies, the sheet expanded with Replay this deal focused`, async ({
      page,
    }) => {
      await readyToWin(page);
      await winIntoRun(page);
      await recordRegion(page);
      await trigger(page);
      await expect.poll(() => running(page)).toBe(false);
      await expectEndedIntoSheet(page);
      // Positive control for the hide row's silence: the visible branch announces the outcome.
      await animationFrames(page, 3);
      expect((await sets(page)).some((set) => set.startsWith(WIN_TITLE))).toBe(true);
    });
  }

  test('R-87 ☰ ends the run, the sheet expanded behind the menu; back closes the menu only', async ({
    page,
  }) => {
    await readyToWin(page);
    await winIntoRun(page);
    await menuButton(page).tap();
    await expectOneMenu(page);
    await page.goBack();
    await expect(menu(page)).toHaveCount(0);
    // Menu.svelte: closed over the expanded sheet, focus returns to ☰.
    await expect(menuButton(page)).toBeFocused();
    await expect(sheet(page)).toBeVisible();
    await expect.poll(() => wcOf(page)).toBe(1);
  });

  test('R-87 a double ☰ tap mid-run gives one menu and no Halted surface', async ({ page }) => {
    await readyToWin(page);
    await winIntoRun(page);
    const point = await centre(menuButton(page));
    await doubleTap(page, point);
    await expectOneMenu(page);
    await page.goBack();
    await expect(menu(page)).toHaveCount(0);
    await expect(sheet(page)).toBeVisible();
    await expect.poll(() => wcOf(page)).toBe(1);
  });

  test('R-87 the Undo button stops the run: no end sheet, no overlay entry', async ({ page }) => {
    await readyToWin(page);
    await winIntoRun(page);
    await page.getByTestId('undo').tap();
    await expectCancelled(page);
  });

  test('R-87 New game stops the run: no end sheet, no overlay entry; back leaves the app', async ({
    page,
  }) => {
    await readyToWin(page);
    await winIntoRun(page);
    await primary(page).tap();
    await expectCancelled(page);
    await expectLeaves(page);
  });

  test('R-87 Undo mid-run, then a Redo that restores the win, then the run’s end: exactly one end sheet, expanded', async ({
    page,
  }) => {
    await readyToWin(page);
    await winIntoRun(page);
    await page.getByTestId('undo').tap();
    await expectCancelled(page);
    await page.getByTestId('redo').tap();
    await expect.poll(() => running(page)).toBe(true);
    await finishCelebration(page);
    await expect(sheet(page)).toHaveCount(1);
    await expect(sheet(page)).toBeVisible();
    await expect.poll(() => wcOf(page)).toBe(1);
    // Still one sheet and one entry a few frames later (no late second open).
    await animationFrames(page, 3);
    await expect(sheet(page)).toHaveCount(1);
    expect(await wcOf(page)).toBe(1);
  });
});

test.describe('desktop', () => {
  test.beforeEach(onDesktop);

  // Undo leaves focus on the first strip card (focusByPhase), where Enter confirms; the AD-14
  // winning guard eats keys sent before the run, so each key waits for `running()`.
  async function enterIntoRun(page: Page): Promise<void> {
    await readyToWin(page);
    await page.keyboard.press('Enter');
    await expect.poll(() => running(page)).toBe(true);
    await stashSession(page);
    // Focus is on the body once the strip card is gone: a bar control holds it for the skip keys,
    // which read no focus (SPEC F17).
    await primary(page).focus();
    await expect(primary(page)).toBeFocused();
  }

  test('R-87 Space skips the run: its repeat once Replay this deal has focus and its release activate nothing', async ({
    page,
  }) => {
    await enterIntoRun(page);
    // A page-side window bubble-phase Space `keydown`/`keyup` recorder (no `__wordcell`).
    await page.evaluate(() => {
      const w = window as unknown as Recorded;
      const seen: string[] = [];
      w.__inputs = seen;
      for (const type of ['keydown', 'keyup']) {
        window.addEventListener(type, (event) => {
          if ((event as KeyboardEvent).key === ' ') seen.push(type);
        });
      }
    });
    await page.keyboard.down('Space');
    await expect(replay(page)).toBeFocused();
    await page.keyboard.down('Space');
    await page.keyboard.up('Space');
    await animationFrames(page, 3);
    expect(await page.evaluate(() => (window as unknown as Recorded).__inputs)).toEqual([]);
    await expectSkipped(page);
  });

  test('R-87 Esc skips the run: the sheet expanded with Replay this deal focused, Session unchanged', async ({
    page,
  }) => {
    await enterIntoRun(page);
    await page.keyboard.press('Escape');
    await animationFrames(page, 3);
    await expectSkipped(page);
  });

  // The run still live, the sheet hidden and the focused New game not activated (SPEC F17).
  async function expectNotSkipped(page: Page): Promise<void> {
    await animationFrames(page, 3);
    expect(await running(page)).toBe(true);
    await expect(sheet(page)).toHaveCount(0);
    await expect(primary(page)).toBeFocused();
    expect(await sameSession(page)).toBe(true);
  }

  test('R-87 Shift+Space, Ctrl+Space, Alt+Space and Meta+Space do not skip the run and never activate the focused New game; Esc then skips it', async ({
    page,
  }) => {
    await enterIntoRun(page);
    for (const chord of ['Shift+Space', 'Control+Space', 'Alt+Space', 'Meta+Space']) {
      await page.keyboard.press(chord);
      await expectNotSkipped(page);
    }
    await page.keyboard.press('Escape');
    await animationFrames(page, 3);
    expect(await running(page)).toBe(false);
    await expect(sheet(page)).toBeVisible();
  });

  test('R-87 a Shift+Space held past the repeat delay, its Shift released before the Space, does not skip the run and never activates the focused New game', async ({
    page,
  }) => {
    await enterIntoRun(page);
    await page.keyboard.down('Shift');
    await page.keyboard.down('Space');
    // A second `down` of a held key is a repeat keydown.
    await page.keyboard.down('Space');
    await page.keyboard.up('Shift');
    await page.keyboard.down('Space');
    await page.keyboard.up('Space');
    await expectNotSkipped(page);
  });

  test('R-87 a mouse click on a non-empty WordCell hovered past the long-press time skips the run, consumed: no pointerdown, pointerup or click reaches the page, nothing activated, Session unchanged', async ({
    page,
  }) => {
    await enterIntoRun(page);
    const point = await centre(page.getByTestId('wordcell-3'));
    await page.mouse.move(point.x, point.y);
    await page.waitForTimeout(LONG_PRESS_MS + 100);
    // No hover peek opens during the run: `overlays.openHoverPeek` opens none under the
    // `celebration` top (MODAL_TOP), nor while the winning guard starts no timer (F8). Structural
    // (overlays.svelte.ts MODAL_TOP), not evidence for `cancelGesture()`.
    await expect(page.locator('[data-hover-peek]')).toHaveCount(0);
    const inputs = await recordInputs(page);
    await page.mouse.click(point.x, point.y);
    await expect(sheet(page)).toBeVisible();
    await animationFrames(page, 3);
    expect(await inputs()).toEqual([]);
    await expect(page.locator('[data-hover-peek]')).toHaveCount(0);
    await expectSkipped(page);
  });

  test('R-87 M twice mid-run gives one menu over the expanded sheet and no Halted surface', async ({
    page,
  }) => {
    await enterIntoRun(page);
    // SPEC F29: both keydowns land in one task, so the second arrives before the first's pending
    // pop settles (popstate is async); keys.ts reads no `isTrusted`.
    await page.evaluate(() => {
      // On the focused element, as a real key press (the trackers read `target.closest`).
      const m = () =>
        (document.activeElement ?? document.body).dispatchEvent(
          new KeyboardEvent('keydown', { key: 'm', code: 'KeyM', bubbles: true, cancelable: true }),
        );
      m();
      m();
    });
    await expectOneMenu(page);
    await page.goBack();
    await expect(menu(page)).toHaveCount(0);
    // Menu.svelte: closed over the expanded sheet, focus returns to ☰.
    await expect(menuButton(page)).toBeFocused();
    await expect(sheet(page)).toBeVisible();
    await expect.poll(() => wcOf(page)).toBe(1);
  });

  test('R-87 ? and WordCell Enter do nothing while it runs; Z, Ctrl+Z and N cancel it, each its own run (Y restores the win)', async ({
    page,
  }) => {
    await enterIntoRun(page);
    await page.keyboard.press('Shift+?');
    await page.getByTestId('wordcell-3').focus();
    await expect(page.getByTestId('wordcell-3')).toBeFocused();
    await page.keyboard.press('Enter');
    await animationFrames(page, 3);
    await expect(page.getByRole('dialog', { name: 'How to play' })).toHaveCount(0);
    await expect(viewSheet(page)).toHaveCount(0);
    expect(await running(page)).toBe(true);
    for (const key of ['z', 'Control+z', 'n']) {
      await page.keyboard.press(key);
      await expectCancelled(page);
      if (key === 'n') break;
      await page.keyboard.press('y');
      await expect.poll(() => running(page)).toBe(true);
    }
  });
});
