import { describe, expect, it } from 'vitest';
import { createGate } from '../gestures/gate';
import { BAND_ORDER } from './bands';
import { createLayout, type LayoutDeps } from './layout.svelte';

// AD-11 live layout with fake deps and a real gate on fake frames/timers. Server-compiled runes:
// no `$effect` runs and `flushSync` is a no-op, so only getters and fake scroll writes are
// asserted. Reference numbers from geometry.ts (plan Code Map): 412 × 915 w 46 leftover 177
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
};

function setup(viewport: Viewport) {
  const listeners = new Map<string, (() => void)[]>();
  const mediaListeners: (() => void)[] = [];
  const calls: string[] = [];
  const scrolls: number[] = [];
  let bannerCallback: (() => void) | undefined;
  const padding = { paddingTop: '0px', paddingBottom: '0px' };
  const appended: unknown[] = [];
  const v = {
    hoverFine: false,
    scrollY: 0,
    banner: false,
    ...viewport,
  };

  const win = {
    get innerWidth() {
      return v.innerWidth;
    },
    get innerHeight() {
      return v.innerHeight;
    },
    get scrollY() {
      return v.scrollY;
    },
    location: { search: '' },
    document: {
      documentElement: {
        get clientWidth() {
          return v.clientWidth;
        },
      },
      body: { append: (node: unknown) => appended.push(node) },
      createElement: () => ({ style: { cssText: '' } }),
    },
    addEventListener(type: string, listener: () => void) {
      listeners.set(type, [...(listeners.get(type) ?? []), listener]);
    },
    scrollTo({ top }: { top: number }) {
      calls.push(`scrollTo ${top}`);
      scrolls.push(top);
      v.scrollY = top;
    },
  };
  const deps: LayoutDeps = {
    window: win,
    matchMedia: () => ({
      get matches() {
        return v.hoverFine;
      },
      addEventListener: (_type, listener) => mediaListeners.push(listener),
    }),
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

  const layout = createLayout(gate, deps);
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
    listeners,
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
    expect(t.calls).toEqual([]);
    for (const type of ['resize', 'orientationchange', 'scroll', 'scrollend']) {
      expect(t.listeners.get(type), type).toHaveLength(1);
    }
  });

  it('AD-11 creation with the banner already shown lays it out at once', () => {
    const t = setup({ ...PIXEL_7, innerHeight: 915, banner: true });
    expect(t.layout.bannerShown).toBe(true);
    expect(t.layout.heights.banner).toBe(44);
    expect(t.layout.heights.leftover).toBe(133);
  });

  it('AD-11 w recompute on a hoverFine change', () => {
    const t = setup({ ...PIXEL_7, innerHeight: 915 });
    t.flipMedia(true);
    expect(t.layout.w).toBe(46);
    t.frame();
    expect(t.layout.w).toBe(43);
    expect(t.layout.metrics.board).toBe(376);
    expect(t.layout.heights.leftover).toBe(185);
    expect(t.calls).toEqual([]);
  });

  it('AD-11 a hoverFine flip and flip-back before idle changes nothing', () => {
    const t = setup({ ...PIXEL_7, innerHeight: 915 });
    t.gate.enter();
    t.flipMedia(true);
    t.flipMedia(false);
    t.frame();
    t.gate.leave();
    t.frame();
    expect(t.layout.w).toBe(46);
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

  it('AD-11 an inset change delivered with a resize re-lays the bands with the new insets', () => {
    const t = setup({ ...PIXEL_7, innerHeight: 915 });
    t.padding.paddingTop = '24px';
    t.padding.paddingBottom = '24px';
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
