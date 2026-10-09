// AD-11 live layout (build-notes CAP-1, CAP-3, F20, F21): card width, metrics, `wide`, band
// heights, band order and the gate-latched banner flag as `$state`, computed by geometry.ts and
// bands.ts only. First values are synchronous at creation; every later change runs as one pending
// gate `whenIdle` task that reads live inputs, re-lays and keeps the anchor band in place with a
// clamped `scrollTo({ top })` (an own write the gate ignores). Every DOM read and write goes
// through `deps`, so Vitest drives it with fakes (server-compiled runes: `flushSync` is a no-op).
import { flushSync } from 'svelte';
import { dictionary } from '../../shell/dictionary.svelte';
import type { Gate } from '../gestures/gate';
import { BAND_ORDER, type BandId, parseBandsParam, type Unit } from './bands';
import {
  anchorScroll,
  availableWidth,
  type BandLayout,
  bands,
  type CardMetrics,
  cardMetrics,
  cardWidth,
  type Insets,
  shouldRecomputeWidth,
} from './geometry';

export type ProbeElement = { style: { cssText: string } };

export type LayoutWindow<E extends ProbeElement> = {
  readonly innerWidth: number;
  readonly innerHeight: number;
  readonly scrollY: number;
  readonly location: { readonly search: string };
  readonly document: {
    readonly documentElement: { readonly clientWidth: number };
    readonly body: { append(node: E): void };
    createElement(tag: 'div'): E;
  };
  addEventListener(type: string, listener: () => void, options?: { passive: boolean }): void;
  scrollTo(options: { top: number }): void;
};

export type LayoutMediaQuery = {
  readonly matches: boolean;
  addEventListener(type: 'change', listener: () => void): void;
};

export type LayoutDeps<E extends ProbeElement = ProbeElement> = {
  window: LayoutWindow<E>;
  matchMedia(query: string): LayoutMediaQuery;
  getComputedStyle(element: E): { paddingTop: string; paddingBottom: string };
  showBanner(): boolean;
  watchBanner(callback: () => void): void;
};

export type Layout = {
  readonly w: number;
  readonly metrics: CardMetrics;
  readonly wide: boolean;
  readonly heights: Record<BandId, number>;
  readonly bandOrder: readonly Unit[];
  readonly bannerShown: boolean;
  /**
   * Epic 4 SPEC CAP-9, epic 4 SPEC F19: live `(hover: hover) and (pointer: fine)`, set at the media
   * `change`.
   */
  readonly hoverFine: boolean;
  /**
   * Epic 4 SPEC F19: calls `callback` after every hoverFine media `change`; returns the unwatch.
   */
  watchHoverFine(callback: () => void): () => void;
};

const HOVER_FINE = '(hover: hover) and (pointer: fine)';
// Epic 4 always lays one tray row (build-notes CAP-1; AD-11's tray-row trigger is epic 5).
const TRAY_ROWS = 1;
// build-notes CAP-3 insets probe: invisible, out of flow, never hit.
const PROBE_CSS =
  'position: fixed; top: 0; left: 0; width: 0; height: 0; visibility: hidden; ' +
  'pointer-events: none; padding-top: env(safe-area-inset-top); ' +
  'padding-bottom: env(safe-area-inset-bottom);';

/** The browser deps `main.ts` passes: `window`, and the dictionary banner flag through an effect. */
export function browserLayoutDeps(): LayoutDeps<HTMLDivElement> {
  return {
    window,
    matchMedia: (query) => window.matchMedia(query),
    getComputedStyle: (element) => window.getComputedStyle(element),
    showBanner: () => dictionary.showBanner,
    watchBanner: (callback) => {
      $effect.root(() => {
        $effect(() => {
          void dictionary.showBanner;
          callback();
        });
      });
    },
  };
}

export function createLayout<E extends ProbeElement>(gate: Gate, deps: LayoutDeps<E>): Layout {
  const win = deps.window;
  const media = deps.matchMedia(HOVER_FINE);
  const probe = win.document.createElement('div');
  probe.style.cssText = PROBE_CSS;
  win.document.body.append(probe);

  // Parsed once; inert in every production build (dist-test included).
  const bandOrder: readonly Unit[] = import.meta.env.DEV
    ? parseBandsParam(new URLSearchParams(win.location.search))
    : BAND_ORDER;

  function readInsets(): Insets {
    const style = deps.getComputedStyle(probe);
    return { top: parseFloat(style.paddingTop), bottom: parseFloat(style.paddingBottom) };
  }

  function widthOf(clientWidth: number, innerHeight: number, insets: Insets, hoverFine: boolean) {
    const nextW = cardWidth(clientWidth, innerHeight, insets, hoverFine);
    const nextMetrics = cardMetrics(nextW);
    return {
      w: nextW,
      metrics: nextMetrics,
      wide: nextMetrics.board > availableWidth(clientWidth, hoverFine),
    };
  }

  // Creation: the relayout task's live inputs, applied synchronously with no scroll write.
  const insets0 = readInsets();
  const hoverFine0 = media.matches;
  const banner0 = deps.showBanner();
  const first = widthOf(
    win.document.documentElement.clientWidth,
    win.innerHeight,
    insets0,
    hoverFine0,
  );
  const result0 = bands(first.w, bandOrder, TRAY_ROWS, banner0, win.innerHeight, insets0);

  let w = $state(first.w);
  let metrics = $state.raw(first.metrics);
  let wide = $state(first.wide);
  let heights = $state.raw(result0.heights);
  let bannerShown = $state(banner0);
  // Epic 4 SPEC F19: follows the media query at once (the hover peek's watcher), unlike w (gate
  // idle task).
  let hoverFine = $state(hoverFine0);
  const hoverFineWatchers = new Set<() => void>();

  // `last`: the inputs of the last w computation (A-D11); `applied`: the last band layout's.
  let last = { innerWidth: win.innerWidth, innerHeight: win.innerHeight, hoverFine: hoverFine0 };
  let applied: { result: BandLayout; innerHeight: number; insets: Insets; banner: boolean } = {
    result: result0,
    innerHeight: win.innerHeight,
    insets: insets0,
    banner: banner0,
  };
  let pending = false;

  function relayout(): void {
    pending = false;
    const innerWidth = win.innerWidth;
    const innerHeight = win.innerHeight;
    const hoverFine = media.matches;
    const insets = readInsets();
    const banner = deps.showBanner();
    const recompute =
      shouldRecomputeWidth(last, { innerWidth, innerHeight }) || hoverFine !== last.hoverFine;
    const relay =
      recompute ||
      banner !== applied.banner ||
      innerHeight !== applied.innerHeight ||
      insets.top !== applied.insets.top ||
      insets.bottom !== applied.insets.bottom;
    if (!relay) return;

    const next = recompute
      ? widthOf(win.document.documentElement.clientWidth, innerHeight, insets, hoverFine)
      : undefined;
    const y = win.scrollY;
    const result = bands(next?.w ?? w, bandOrder, TRAY_ROWS, banner, innerHeight, insets);
    const target = anchorScroll(applied.result, result, y, innerHeight);
    if (next !== undefined) {
      w = next.w;
      metrics = next.metrics;
      wide = next.wide;
      last = { innerWidth, innerHeight, hoverFine };
    }
    heights = result.heights;
    bannerShown = banner;
    applied = { result, innerHeight, insets, banner };
    flushSync();
    if (target !== y) {
      gate.ignoreNextScroll();
      win.scrollTo({ top: target });
    }
  }

  function schedule(): void {
    if (pending) return;
    pending = true;
    gate.whenIdle(relayout);
  }

  win.addEventListener('resize', schedule);
  win.addEventListener('orientationchange', schedule);
  media.addEventListener('change', () => {
    hoverFine = media.matches;
    schedule();
    for (const callback of hoverFineWatchers) callback();
  });
  deps.watchBanner(schedule);
  win.addEventListener('scroll', () => gate.scroll(), { passive: true });
  win.addEventListener('scrollend', () => gate.scrollEnd(), { passive: true });

  return {
    get w() {
      return w;
    },
    get metrics() {
      return metrics;
    },
    get wide() {
      return wide;
    },
    get heights() {
      return heights;
    },
    get bandOrder() {
      return bandOrder;
    },
    get bannerShown() {
      return bannerShown;
    },
    get hoverFine() {
      return hoverFine;
    },
    watchHoverFine(callback) {
      hoverFineWatchers.add(callback);
      return () => {
        hoverFineWatchers.delete(callback);
      };
    },
  };
}
