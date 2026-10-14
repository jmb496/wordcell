import { describe, expect, it, vi } from 'vitest';
import { createFlip } from '../flip';
import { createGate } from '../gestures/gate';
import { BAND_ORDER, parseBandsParam } from './bands';
import { bands } from './geometry';
import { createLayout, type Layout, type LayoutDeps } from './layout.svelte';
import { trayLayout } from './tray';

// flip.ts reaches the game store through fly-back's prefs import (window at import): mocked as
// flip.test.ts does.
vi.mock('../../shell/prefs.svelte', () => ({
  prefs: { motion: { baseMs: 180, reduced: false } },
}));

// AD-11 live layout with fake deps and a real gate on fake frames/timers. Server-compiled runes:
// no `$effect` runs and `flushSync` is a no-op, so only getters and fake scroll writes are
// asserted. Server-compiled `$state` updates synchronously, so the fake `scrollY` clamps to the
// document the layout's `heights` describe (their sum, at the innerHeight they were laid out for)
// as soon as a relayout sets state, like a real browser after `flushSync`. Reference numbers from geometry.ts (plan Code Map): 412 × 915 w 46 leftover 177
// (banner 133), hoverFine w 43; 412 × 839 leftover 101; 412 × 779 leftover 41; 412 × 719 w 40;
// 412 × 780 leftover 42, banner total 782 and anchor 651 → 653; 412 × 600 and 1280 × 720 w 40
// total 722 (banner 766); 412 × 780 hoverFine w 43 total 780.
type Viewport = {
  innerWidth: number;
  innerHeight: number;
  clientWidth: number;
  hoverFine?: boolean;
  scrollY?: number;
  banner?: boolean;
  search?: string;
  tiles?: number;
  /** The fake scrollY never clamps to the document (a browser that has not yet clamped). */
  noClamp?: boolean;
};

function setup(viewport: Viewport, initialPadding = { paddingTop: '0px', paddingBottom: '0px' }) {
  const listeners = new Map<string, (() => void)[]>();
  const listenerOptions = new Map<string, ({ passive: boolean } | undefined)[]>();
  const mediaListeners: (() => void)[] = [];
  const calls: string[] = [];
  const scrolls: number[] = [];
  let bannerCallback: (() => void) | undefined;
  let tilesCallback: (() => void) | undefined;
  const padding = { ...initialPadding };
  const appended: { style: { cssText: string } }[] = [];
  const queries: string[] = [];
  const v = {
    hoverFine: false,
    scrollY: 0,
    banner: false,
    search: '',
    tiles: 0,
    noClamp: false,
    ...viewport,
  };
  let layout: Layout | undefined;
  let laidOut: { heights: Layout['heights']; innerHeight: number } | undefined;

  const win = {
    get innerWidth() {
      return v.innerWidth;
    },
    get innerHeight() {
      return v.innerHeight;
    },
    get scrollY() {
      if (layout !== undefined && !v.noClamp) {
        if (laidOut?.heights !== layout.heights) {
          laidOut = { heights: layout.heights, innerHeight: v.innerHeight };
        }
        let total = 0;
        for (const height of Object.values(laidOut.heights)) total += height;
        v.scrollY = Math.min(v.scrollY, Math.max(0, total - laidOut.innerHeight));
      }
      return v.scrollY;
    },
    location: { search: v.search },
    document: {
      documentElement: {
        get clientWidth() {
          return v.clientWidth;
        },
      },
      body: { append: (node: { style: { cssText: string } }) => appended.push(node) },
      createElement: () => ({ style: { cssText: '' } }),
    },
    addEventListener(type: string, listener: () => void, options?: { passive: boolean }) {
      listeners.set(type, [...(listeners.get(type) ?? []), listener]);
      listenerOptions.set(type, [...(listenerOptions.get(type) ?? []), options]);
    },
    scrollTo({ top }: { top: number }) {
      calls.push(`scrollTo ${top}`);
      scrolls.push(top);
      v.scrollY = top;
    },
  };
  const deps: LayoutDeps = {
    window: win,
    matchMedia: (query) => {
      queries.push(query);
      return {
        get matches() {
          return v.hoverFine;
        },
        addEventListener: (_type, listener) => mediaListeners.push(listener),
      };
    },
    getComputedStyle: () => padding,
    showBanner: () => v.banner,
    watchBanner: (callback) => {
      bannerCallback = callback;
    },
    tileCount: () => v.tiles,
    watchTiles: (callback) => {
      tilesCallback = callback;
    },
  };

  const frames: (() => void)[] = [];
  const timers = new Map<number, () => void>();
  let handle = 0;
  const gate = createGate<number>({
    raf: (fn) => frames.push(fn),
    setTimer: (fn) => {
      timers.set(++handle, fn);
      return handle;
    },
    clearTimer: (h) => {
      timers.delete(h);
    },
  });
  const ignoreNextScroll = gate.ignoreNextScroll;
  gate.ignoreNextScroll = () => {
    calls.push('ignoreNextScroll');
    ignoreNextScroll();
  };

  layout = createLayout(gate, deps);
  const created = layout;
  laidOut = { heights: layout.heights, innerHeight: v.innerHeight };
  const emit = (type: string) => {
    for (const listener of listeners.get(type) ?? []) listener();
  };
  return {
    layout,
    gate,
    v,
    padding,
    calls,
    scrolls,
    appended,
    queries,
    listeners,
    listenerOptions,
    resize: () => emit('resize'),
    emit,
    flipMedia: (matches: boolean) => {
      v.hoverFine = matches;
      for (const listener of mediaListeners) listener();
    },
    /** A tile-count change outside a move (restore, New game, Replay): the watcher fires. */
    swapTiles: (count: number) => {
      v.tiles = count;
      tilesCallback?.();
    },
    /** One move (flip.ts capture → dispatch → play): the view changes between begin and end. */
    move: (count: number) => {
      created.beginMove();
      v.tiles = count;
      tilesCallback?.();
      created.endMove();
    },
    bannerChange: (shown: boolean) => {
      v.banner = shown;
      bannerCallback?.();
    },
    frame: () => {
      for (const fn of frames.splice(0)) fn();
    },
  };
}

const PIXEL_7 = { innerWidth: 412, clientWidth: 412 };

describe('AD-11 live layout', () => {
  it('AD-11 creation sets every getter synchronously, appends the insets probe and writes no scroll', () => {
    const t = setup({ ...PIXEL_7, innerHeight: 915 });
    expect(t.layout.w).toBe(46);
    expect(t.layout.metrics).toEqual({ H: 61, strip: 44, slot: 50, board: 400 });
    expect(t.layout.trayInnerWidth).toBe(384);
    expect(t.layout.wide).toBe(false);
    expect(t.layout.heights.leftover).toBe(177);
    expect(t.layout.heights.banner).toBe(0);
    expect(t.layout.bandOrder).toBe(BAND_ORDER);
    expect(t.layout.bannerShown).toBe(false);
    expect(t.appended).toHaveLength(1);
    const css = t.appended[0]?.style.cssText;
    for (const part of [
      'position: fixed',
      'visibility: hidden',
      'pointer-events: none',
      'padding-top: env(safe-area-inset-top)',
      'padding-bottom: env(safe-area-inset-bottom)',
    ]) {
      expect(css).toContain(part);
    }
    expect(t.calls).toEqual([]);
    for (const type of ['resize', 'orientationchange', 'scroll', 'scrollend']) {
      expect(t.listeners.get(type), type).toHaveLength(1);
    }
    for (const type of ['scroll', 'scrollend']) {
      expect(t.listenerOptions.get(type), type).toEqual([{ passive: true }]);
    }
  });

  it('AD-11 creation reads the insets probe: 412 × 915 with 24/24 insets lays the bands at once', () => {
    const t = setup(
      { ...PIXEL_7, innerHeight: 915 },
      { paddingTop: '24px', paddingBottom: '24px' },
    );
    expect(t.layout.w).toBe(46);
    expect(t.layout.heights.topBar).toBe(68);
    expect(t.layout.heights.actionBar).toBe(84);
    expect(t.layout.heights.leftover).toBe(129);
    expect(t.calls).toEqual([]);
  });

  it('AD-11 creation with the banner already shown lays it out at once', () => {
    const t = setup({ ...PIXEL_7, innerHeight: 915, banner: true });
    expect(t.layout.bannerShown).toBe(true);
    expect(t.layout.heights.banner).toBe(44);
    expect(t.layout.heights.leftover).toBe(133);
  });

  it('AD-11 w recompute on a hoverFine change', () => {
    const t = setup({ ...PIXEL_7, innerHeight: 915 });
    expect(t.queries).toEqual(['(hover: hover) and (pointer: fine)']);
    t.flipMedia(true);
    expect(t.layout.w).toBe(46);
    t.frame();
    expect(t.layout.w).toBe(43);
    expect(t.layout.metrics.board).toBe(376);
    expect(t.layout.trayInnerWidth).toBe(360);
    expect(t.layout.heights.leftover).toBe(185);
    expect(t.calls).toEqual([]);
  });

  it('AD-11 hoverFine follows a media change at once, before the gate idle task', () => {
    const t = setup({ ...PIXEL_7, innerHeight: 915 });
    expect(t.layout.hoverFine).toBe(false);
    t.gate.enter();
    t.flipMedia(true);
    expect(t.layout.hoverFine).toBe(true);
    expect(t.layout.w).toBe(46);
    t.flipMedia(false);
    expect(t.layout.hoverFine).toBe(false);
    t.gate.leave();
    t.frame();
    expect(t.layout.hoverFine).toBe(false);
  });

  it('AD-11 watchHoverFine runs its callback after every media change, with hoverFine already set, until unwatched', () => {
    const t = setup({ ...PIXEL_7, innerHeight: 915 });
    const seen: boolean[] = [];
    const unwatch = t.layout.watchHoverFine(() => seen.push(t.layout.hoverFine));
    t.flipMedia(true);
    t.flipMedia(false);
    unwatch();
    t.flipMedia(true);
    expect(seen).toEqual([true, false]);
  });

  it('AD-11 a hoverFine flip and flip-back before idle changes nothing', () => {
    const t = setup({ ...PIXEL_7, innerHeight: 915 });
    const heights = t.layout.heights;
    const metrics = t.layout.metrics;
    t.gate.enter();
    t.flipMedia(true);
    t.flipMedia(false);
    t.frame();
    t.gate.leave();
    t.frame();
    expect(t.layout.w).toBe(46);
    expect(t.layout.heights).toBe(heights);
    expect(t.layout.metrics).toBe(metrics);
    expect(t.calls).toEqual([]);
  });

  it('AD-11 two 60 px shrinks: the first keeps w and shrinks the leftover with no scroll at 0, the second recomputes w', () => {
    const t = setup({ ...PIXEL_7, innerHeight: 839 });
    expect(t.layout.heights.leftover).toBe(101);
    const heights = t.layout.heights;
    t.v.innerHeight = 779;
    t.resize();
    t.frame();
    expect(t.layout.w).toBe(46);
    expect(t.layout.heights.leftover).toBe(41);
    expect(t.layout.heights).not.toBe(heights);
    expect(t.calls).toEqual([]);
    t.v.innerHeight = 719;
    t.resize();
    t.frame();
    expect(t.layout.w).toBe(40);
    expect(t.layout.heights.leftover).toBe(0);
    expect(t.calls).toEqual([]);
  });

  it('AD-11 a 60 px shrink keeps w where a recompute would change it: 412 × 779 → 719 stays w 46, leftover 0, no scroll', () => {
    // cardWidth(412, 719) is 40; the predicate (A-D11) does not hold for 60 px.
    const t = setup({ ...PIXEL_7, innerHeight: 779 });
    expect(t.layout.w).toBe(46);
    const metrics = t.layout.metrics;
    t.v.innerHeight = 719;
    t.resize();
    t.frame();
    expect(t.layout.w).toBe(46);
    expect(t.layout.metrics).toBe(metrics);
    expect(t.layout.heights.leftover).toBe(0);
    expect(t.calls).toEqual([]);
  });

  it('AD-11 cardWidth and availableWidth take clientWidth; innerWidth feeds only the predicate', () => {
    // hoverFine 412 × 915: w 43 (innerWidth 427 would give 45).
    const t = setup({ innerWidth: 427, clientWidth: 412, innerHeight: 915, hoverFine: true });
    expect(t.layout.w).toBe(43);
    const heights = t.layout.heights;
    // clientWidth 380 would give w 40; innerWidth is unchanged, so no recompute.
    t.v.clientWidth = 380;
    t.resize();
    t.frame();
    expect(t.layout.w).toBe(43);
    expect(t.layout.heights).toBe(heights);
    // wide: board 352 > availableWidth(380) 348, not > availableWidth(400) 368.
    const u = setup({ innerWidth: 400, clientWidth: 380, innerHeight: 750, hoverFine: true });
    expect(u.layout.w).toBe(40);
    expect(u.layout.wide).toBe(true);
  });

  it('AD-11 an inset change delivered with a resize re-lays the bands with the new insets', () => {
    const t = setup({ ...PIXEL_7, innerHeight: 915 });
    t.padding.paddingBottom = '24px';
    t.resize();
    t.frame();
    expect(t.layout.w).toBe(46);
    expect(t.layout.heights.topBar).toBe(44);
    expect(t.layout.heights.actionBar).toBe(84);
    t.padding.paddingTop = '24px';
    t.resize();
    t.frame();
    expect(t.layout.w).toBe(46);
    expect(t.layout.heights.topBar).toBe(68);
    expect(t.layout.heights.actionBar).toBe(84);
    expect(t.layout.heights.leftover).toBe(129);
  });

  it('AD-11 an innerHeight growth clamps scrollTop to the new range: 412 × 600 at 122 → 660 writes 62', () => {
    const t = setup({ ...PIXEL_7, innerHeight: 600, scrollY: 122 });
    expect(t.layout.w).toBe(40);
    t.v.innerHeight = 660;
    t.resize();
    t.frame();
    expect(t.layout.w).toBe(40);
    expect(t.calls).toEqual(['ignoreNextScroll', 'scrollTo 62']);
  });

  it('AD-11 banner show at 412 × 780 (leftover 42) writes scrollTop 2 so the WordCell row stays', () => {
    const t = setup({ ...PIXEL_7, innerHeight: 780 });
    expect(t.layout.heights.leftover).toBe(42);
    t.bannerChange(true);
    expect(t.layout.bannerShown).toBe(false);
    t.frame();
    expect(t.layout.bannerShown).toBe(true);
    expect(t.layout.heights.leftover).toBe(0);
    expect(t.calls).toEqual(['ignoreNextScroll', 'scrollTo 2']);
  });

  it('AD-11 banner hide at max scroll on 1280 × 720 (hoverFine) scrolls 46 → 2', () => {
    const t = setup({
      innerWidth: 1280,
      clientWidth: 1265,
      innerHeight: 720,
      hoverFine: true,
      banner: true,
      scrollY: 46,
    });
    expect(t.layout.w).toBe(40);
    expect(t.layout.wide).toBe(false);
    t.bannerChange(false);
    t.frame();
    expect(t.layout.bannerShown).toBe(false);
    expect(t.calls).toEqual(['ignoreNextScroll', 'scrollTo 2']);
  });

  it('AD-11 a w recompute at scrollY > 0 applies the clamped anchor delta: 412 × 780 banner shown, scrollY 2, hoverFine → w 43, scrollTo 0', () => {
    // Anchor 653 → 655 would give 4, clamped to the new range [0, 780 − 780].
    const t = setup({ ...PIXEL_7, innerHeight: 780, banner: true, scrollY: 2 });
    t.flipMedia(true);
    t.frame();
    expect(t.layout.w).toBe(43);
    expect(t.layout.heights.leftover).toBe(6);
    expect(t.calls).toEqual(['ignoreNextScroll', 'scrollTo 0']);
  });

  it('AD-11 a banner hide after a show re-lays from the last applied inputs: 412 × 780 writes 2, then 0', () => {
    const t = setup({ ...PIXEL_7, innerHeight: 780 });
    t.bannerChange(true);
    t.frame();
    t.bannerChange(false);
    t.frame();
    expect(t.layout.bannerShown).toBe(false);
    expect(t.layout.heights.leftover).toBe(42);
    expect(t.calls).toEqual(['ignoreNextScroll', 'scrollTo 2', 'ignoreNextScroll', 'scrollTo 0']);
  });

  it('AD-11 a w recompute updates last: 412 × 915 → 779 recomputes (w 46), then 779 → 719 keeps w 46', () => {
    // 915 → 779 is 136 px (A-D11 holds); 779 → 719 is 60 px from the new last (a stale 915 gives w 40).
    const t = setup({ ...PIXEL_7, innerHeight: 915 });
    const metrics0 = t.layout.metrics;
    t.v.innerHeight = 779;
    t.resize();
    t.frame();
    expect(t.layout.w).toBe(46);
    expect(t.layout.metrics).not.toBe(metrics0);
    const metrics = t.layout.metrics;
    t.v.innerHeight = 719;
    t.resize();
    t.frame();
    expect(t.layout.w).toBe(46);
    expect(t.layout.metrics).toBe(metrics);
    expect(t.layout.heights.leftover).toBe(0);
  });

  it('AD-11 a ?bands= permutation sets bandOrder and drives the relayout: leftover below the anchor, banner show at 412 × 780 writes 44', () => {
    const search = '?bands=topBar,banner,columns,tray,wordcells,leftover,actionBar';
    const t = setup({ ...PIXEL_7, innerHeight: 780, search });
    expect(t.layout.bandOrder).toEqual(parseBandsParam(new URLSearchParams(search)));
    t.bannerChange(true);
    t.frame();
    // The banner sits above the anchor and the slack below it, so nothing absorbs the 44 px.
    expect(t.layout.heights.leftover).toBe(42);
    expect(t.calls).toEqual(['ignoreNextScroll', 'scrollTo 44']);
  });

  it('AD-11 a relayout whose clamped target equals scrollY writes nothing', () => {
    const t = setup({ ...PIXEL_7, innerHeight: 915 });
    t.bannerChange(true);
    t.frame();
    expect(t.layout.heights.leftover).toBe(133);
    expect(t.calls).toEqual([]);
  });

  it('AD-11 a shrink and a banner show that revert before idle change nothing', () => {
    const t = setup({ ...PIXEL_7, innerHeight: 780 });
    const heights = t.layout.heights;
    t.gate.scroll();
    t.v.innerHeight = 700;
    t.resize();
    t.bannerChange(true);
    t.frame();
    t.v.innerHeight = 780;
    t.resize();
    t.bannerChange(false);
    t.gate.scrollEnd();
    t.frame();
    expect(t.layout.w).toBe(46);
    expect(t.layout.heights).toBe(heights);
    expect(t.layout.bannerShown).toBe(false);
    expect(t.calls).toEqual([]);
  });

  it('AD-11 the banner latch waits while the gate is busy, then applies in the first idle frame', () => {
    const t = setup({ ...PIXEL_7, innerHeight: 915 });
    t.gate.enter();
    t.bannerChange(true);
    t.frame();
    expect(t.layout.bannerShown).toBe(false);
    t.gate.leave();
    t.frame();
    expect(t.layout.bannerShown).toBe(true);
  });

  it('AD-11 window scroll and scrollend reach the gate; the own scroll write is ignored', () => {
    const t = setup({ ...PIXEL_7, innerHeight: 780 });
    t.emit('scroll');
    expect(t.gate.busy).toBe(true);
    t.emit('scrollend');
    expect(t.gate.busy).toBe(false);
    t.bannerChange(true);
    t.frame();
    expect(t.scrolls).toEqual([2]);
    t.emit('scroll');
    expect(t.gate.busy).toBe(false);
  });

  it('AD-11 an orientationchange (no resize) schedules a relayout', () => {
    const t = setup({ ...PIXEL_7, innerHeight: 915 });
    t.v.innerHeight = 839;
    t.emit('orientationchange');
    expect(t.layout.heights.leftover).toBe(177);
    t.frame();
    expect(t.layout.w).toBe(46);
    expect(t.layout.heights.leftover).toBe(101);
  });

  it('AD-11 wide when the board is wider than the available width (desktop 370 × 750)', () => {
    const t = setup({ innerWidth: 370, clientWidth: 355, innerHeight: 750, hoverFine: true });
    expect(t.layout.w).toBe(40);
    expect(t.layout.metrics.board).toBe(352);
    expect(t.layout.wide).toBe(true);
  });
});

describe('AD-11 tray rows', () => {
  const PERROW = 7; // 412: w 46, trayInnerWidth 384
  const long = { ...PIXEL_7, innerHeight: 839 };

  it('AD-11 trayLayout rows are 0, 1, 1, 2, 2, 3 for 0, 1, perRow, perRow + 1, 14, 15 tiles; the band grows only from three rows', () => {
    const t = setup(long);
    const base = t.layout.heights.tray;
    const seen: [number, number, number][] = [];
    for (const count of [0, 1, PERROW, PERROW + 1, 14, 15]) {
      t.swapTiles(count);
      seen.push([count, t.layout.tray.rows, t.layout.heights.tray - base]);
    }
    expect(seen).toEqual([
      [0, 0, 0],
      [1, 1, 0],
      [7, 1, 0],
      [8, 2, 0],
      [14, 2, 0],
      [15, 3, 48],
    ]);
  });

  it('AD-3 the Tray sizing and the band rows share one value', () => {
    const t = setup({ ...long, tiles: 15 });
    expect(t.layout.tray).toBe(t.layout.tray);
    expect(t.layout.tray).toEqual(trayLayout(15, 46, 384));
    expect(t.layout.tray.mode).toBe('compact');
    expect(t.layout.heights).toBe(t.layout.heights);
  });

  it('AD-3 the Tray band height is the band value for layout.tray.rows at 0, 14 and 15 tiles on one layout', () => {
    const t = setup(long);
    const expected = (rows: number) =>
      bands(t.layout.w, t.layout.bandOrder, rows, t.layout.bannerShown, 839, { top: 0, bottom: 0 })
        .heights.tray;
    for (const count of [0, 14, 15]) {
      t.swapTiles(count);
      expect(t.layout.heights.tray, `${count} tiles`).toBe(expected(t.layout.tray.rows));
    }
  });

  it('AD-11 a move that grows 14 → 15 at 412 × 839 keeps scrollTop (leftover 101 absorbs +48) and leaves the heights', () => {
    const t = setup({ ...long, tiles: 14 });
    const before = t.layout.heights.leftover;
    t.move(15);
    expect(t.layout.tray.rows).toBe(3);
    expect(t.layout.heights.leftover).toBe(before - 48);
    expect(t.v.scrollY).toBe(0);
    expect(t.calls).toEqual([]);
  });

  it('AD-11 a move 14 → 15 → 14 at 412 × 780 scrolls 6 px, then returns to 0 (the shrink clamp equals the anchor delta)', () => {
    const t = setup({ ...PIXEL_7, innerHeight: 780, tiles: 14 });
    t.move(15);
    expect(t.calls).toEqual(['ignoreNextScroll', 'scrollTo 6']);
    expect(t.v.scrollY).toBe(6);
    t.move(14);
    // The browser already clamped scrollTop to 0 when the band shrank; the anchor delta agrees.
    expect(t.calls).toEqual(['ignoreNextScroll', 'scrollTo 6']);
    expect(t.v.scrollY).toBe(0);
  });

  it('AD-11 a shrink 15 → 14 at 412 × 780 with the browser not yet clamped issues scrollTo with the anchor value', () => {
    const t = setup({ ...PIXEL_7, innerHeight: 780, tiles: 14, noClamp: true });
    t.move(15);
    expect(t.scrolls).toEqual([6]);
    t.move(14);
    // scrollY is still 6 (no clamp), so only the anchor logic can bring it back to 0.
    expect(t.calls).toEqual(['ignoreNextScroll', 'scrollTo 6', 'ignoreNextScroll', 'scrollTo 0']);
    expect(t.scrolls).toEqual([6, 0]);
  });

  it('AD-11 row-boundary tile counts (+1 and -1 around each row boundary) follow the rows in its move', () => {
    const t = setup({ ...long, tiles: 6 });
    const rows: number[] = [];
    for (const count of [7, 8, 7, 14, 15, 14, 1, 0, 3]) {
      t.move(count);
      rows.push(t.layout.tray.rows);
    }
    expect(rows).toEqual([1, 2, 1, 2, 3, 2, 1, 0, 1]);
  });

  it('AD-11 a restore, New game or Replay swap sets the rows with no scroll write', () => {
    const t = setup({ ...PIXEL_7, innerHeight: 780 });
    t.swapTiles(15);
    expect(t.layout.tray.rows).toBe(3);
    t.swapTiles(0);
    expect(t.layout.tray.rows).toBe(0);
    expect(t.calls).toEqual([]);
    expect(t.scrolls).toEqual([]);
  });

  it('AD-11 a swap then a move applies the anchor delta against the swapped rows', () => {
    const t = setup({ ...PIXEL_7, innerHeight: 780 });
    t.swapTiles(14);
    t.move(15);
    expect(t.calls).toEqual(['ignoreNextScroll', 'scrollTo 6']);
  });

  it('AD-11 a move whose rows do not change writes nothing, even while scroll-busy', () => {
    const t = setup({ ...long, tiles: 14 });
    t.gate.scroll();
    expect(t.gate.busy).toBe(true);
    t.move(14);
    t.move(13);
    expect(t.calls).toEqual([]);
  });

  it('AD-11 a row-changing move finding the gate busy throws, with no catch', () => {
    const t = setup({ ...long, tiles: 14 });
    t.gate.enter();
    expect(() => t.move(15)).toThrow('AD-11 tray rows changed while the gate is busy');
  });

  it('AD-11 a row-changing move after a scroll-reset gate re-lays out at once (14 → 15 within 150 ms of a scroll)', () => {
    const t = setup({ ...PIXEL_7, innerHeight: 780, tiles: 14 });
    t.emit('scroll');
    expect(t.gate.busy).toBe(true);
    // flip.capture(): scrollReset first; without it the endMove below throws.
    t.gate.scrollReset();
    expect(t.gate.busy).toBe(false);
    t.move(15);
    expect(t.calls).toEqual(['ignoreNextScroll', 'scrollTo 6']);
    expect(t.layout.heights.tray).toBeGreaterThan(0);
  });

  it('AD-11 beginMove while a move is open and endMove without one throw', () => {
    const t = setup(long);
    expect(() => t.layout.endMove()).toThrow('AD-11 endMove() without beginMove()');
    t.layout.beginMove();
    expect(() => t.layout.beginMove()).toThrow('AD-11 beginMove() while a move is open');
  });
});

describe('AD-11 tray rows through flip.capture() / play()', () => {
  const rect = { getBoundingClientRect: () => ({ left: 0, top: 0, width: 1, height: 1 }) };
  const emptyRoot = { querySelectorAll: () => [], querySelector: () => rect };
  const move780 = { ...PIXEL_7, innerHeight: 780 };
  const validate = { type: 'validate' } as const;

  // A real flip over the real layout and gate; no cards on the fake root, so nothing glides.
  function flipOver(t: ReturnType<typeof setup>, gate: typeof t.gate = t.gate) {
    return createFlip({
      gate,
      layout: t.layout,
      root: () => emptyRoot as unknown as HTMLElement,
      reduced: () => false,
      phase: () => 'composing',
      duration: () => 0,
      stagger: () => 0,
    });
  }

  it('AD-11 a 14 → 15 move within 150 ms of a scroll is busy before capture(), idle after, and re-lays out in play()', () => {
    const t = setup({ ...move780, tiles: 14 });
    const flip = flipOver(t);
    t.emit('scroll');
    expect(t.gate.busy).toBe(true);
    flip.capture();
    expect(t.gate.busy).toBe(false);
    const { w, metrics } = t.layout;
    const whenIdle = vi.spyOn(t.gate, 'whenIdle');
    t.swapTiles(15);
    flip.play({ type: 'setDestinationCount', k: 2 }, { changed: true });
    expect(t.layout.tray.rows).toBe(3);
    expect(t.calls).toEqual(['ignoreNextScroll', 'scrollTo 6']);
    // A row change recomputes neither the width nor the metrics and queues no relayout task.
    expect(t.layout.w).toBe(w);
    expect(t.layout.metrics).toBe(metrics);
    expect(whenIdle).not.toHaveBeenCalled();
  });

  it('AD-11 without gate.scrollReset() in capture() the same move throws at play()', () => {
    const t = setup({ ...move780, tiles: 14 });
    const noReset = Object.create(t.gate, { scrollReset: { value: () => {} } });
    const flip = flipOver(t, noReset);
    t.emit('scroll');
    flip.capture();
    expect(t.gate.busy).toBe(true);
    t.swapTiles(15);
    expect(() => flip.play({ type: 'setDestinationCount', k: 2 }, { changed: true })).toThrow(
      'AD-11 tray rows changed while the gate is busy',
    );
  });

  it('AD-11 a failed Validate or no-op move within 150 ms of a scroll leaves the gate idle and the rows unchanged', () => {
    const t = setup({ ...move780, tiles: 14 });
    const flip = flipOver(t);
    const rows = t.layout.tray.rows;
    t.emit('scroll');
    expect(t.gate.busy).toBe(true);
    flip.capture();
    flip.play(validate, { changed: false, rejectedWord: 'xyz' });
    expect(t.gate.busy).toBe(false);
    expect(t.layout.tray.rows).toBe(rows);
    t.emit('scroll');
    flip.capture();
    flip.play({ type: 'flip' }, { changed: false });
    expect(t.gate.busy).toBe(false);
    expect(t.layout.tray.rows).toBe(rows);
    expect(t.calls).toEqual([]);
  });
});
