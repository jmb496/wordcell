import { describe, expect, it } from 'vitest';
import { createGate } from '../gestures/gate';
import { BAND_ORDER, parseBandsParam } from './bands';
import { createLayout, type Layout, type LayoutDeps } from './layout.svelte';

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
};

function setup(viewport: Viewport, initialPadding = { paddingTop: '0px', paddingBottom: '0px' }) {
  const listeners = new Map<string, (() => void)[]>();
  const listenerOptions = new Map<string, ({ passive: boolean } | undefined)[]>();
  const mediaListeners: (() => void)[] = [];
  const calls: string[] = [];
  const scrolls: number[] = [];
  let bannerCallback: (() => void) | undefined;
  const padding = { ...initialPadding };
  const appended: { style: { cssText: string } }[] = [];
  const queries: string[] = [];
  const v = {
    hoverFine: false,
    scrollY: 0,
    banner: false,
    search: '',
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
      if (layout !== undefined) {
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
