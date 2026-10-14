// AD-11 live layout (build-notes CAP-1, CAP-3, F20, F21): card width, metrics, `wide`, band
// heights, band order and the gate-latched banner flag as `$state`, computed by geometry.ts and
// bands.ts only. First values are synchronous at creation; every later change runs as one pending
// gate `whenIdle` task that reads live inputs, re-lays and keeps the anchor band in place with a
// clamped `scrollTo({ top })` (an own write the gate ignores). The tray rows are the one exception
// (epic 5 CAP-9, AD-11): `tray` (`trayLayout`) and `heights` derive from the game view's tile count
// in the same render, and a move (`beginMove` … `endMove`, called by flip.ts) applies the row
// change's anchor `scrollTop` delta in the move's update; a restore or state swap only re-syncs.
// Every DOM read and write goes
// through `deps`, so Vitest drives it with fakes (server-compiled runes: `flushSync` is a no-op).
import { flushSync, untrack } from 'svelte';
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
import { type TrayLayout, trayLayout } from './tray';

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
  /** The Tray's tile count (`trayTileCount` of the game view; 0 without a view). Reactive. */
  tileCount(): number;
  /** Calls `callback` after every change of `tileCount()`. */
  watchTiles(callback: () => void): void;
};

export type Layout = {
  readonly w: number;
  readonly metrics: CardMetrics;
  /** DESIGN.md Tray band: the tray's inner width, `metrics.board` minus its padding 8 + 8. */
  readonly trayInnerWidth: number;
  /**
   * Epic 5 CAP-9: the one Tray sizing (`trayLayout` of the live tile count, `w` and
   * `trayInnerWidth`); the tile mode and the band's rows both read it.
   */
  readonly tray: TrayLayout;
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
  /**
   * AD-11 move bracket (flip.ts `capture()` / `play()`): `beginMove` records `scrollY`; `endMove`,
   * after the move's flush, applies a row change's anchor `scrollTop` delta. A row change finding
   * the gate busy throws.
   */
  beginMove(): void;
  endMove(): void;
};

const HOVER_FINE = '(hover: hover) and (pointer: fine)';
// build-notes CAP-3 insets probe: invisible, out of flow, never hit.
const PROBE_CSS =
  'position: fixed; top: 0; left: 0; width: 0; height: 0; visibility: hidden; ' +
  'pointer-events: none; padding-top: env(safe-area-inset-top); ' +
  'padding-bottom: env(safe-area-inset-bottom);';

/**
 * The browser deps `main.ts` passes: `window`, the dictionary banner flag and the Tray's tile count
 * (`main.ts` reads it off the game view; this module imports no game store) through effects.
 */
export function browserLayoutDeps(tileCount: () => number): LayoutDeps<HTMLDivElement> {
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
    tileCount,
    watchTiles: (callback) => {
      $effect.root(() => {
        $effect(() => {
          void tileCount();
          untrack(() => callback());
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

  // Memoised on its inputs so both `heights` and the Tray read one object per layout (references
  // are stable between changes).
  let trayMemo: { key: string; value: TrayLayout } | undefined;
  function trayFor(count: number, width: number, innerWidth: number): TrayLayout {
    const key = `${count} ${width} ${innerWidth}`;
    if (trayMemo?.key !== key) trayMemo = { key, value: trayLayout(count, width, innerWidth) };
    return trayMemo.value;
  }
  let bandsMemo: { key: string; value: BandLayout } | undefined;
  function bandsFor(
    width: number,
    rows: number,
    banner: boolean,
    innerHeight: number,
    insets: Insets,
  ): BandLayout {
    const key = `${width} ${rows} ${banner} ${innerHeight} ${insets.top} ${insets.bottom}`;
    if (bandsMemo?.key !== key) {
      bandsMemo = { key, value: bands(width, bandOrder, rows, banner, innerHeight, insets) };
    }
    return bandsMemo.value;
  }

  const rows0 = trayFor(deps.tileCount(), first.w, first.metrics.board - 16).rows;
  const result0 = bandsFor(first.w, rows0, banner0, win.innerHeight, insets0);

  let w = $state(first.w);
  let metrics = $state.raw(first.metrics);
  let wide = $state(first.wide);
  // The deferred band inputs (relayout's live reads); `heights` derives from them and the tray.
  let inputs = $state.raw({ banner: banner0, innerHeight: win.innerHeight, insets: insets0 });
  let bannerShown = $state(banner0);
  // Epic 4 SPEC F19: follows the media query at once (the hover peek's watcher), unlike w (gate
  // idle task).
  let hoverFine = $state(hoverFine0);
  const hoverFineWatchers = new Set<() => void>();

  // `last`: the inputs of the last w computation (A-D11); `applied`: the last band layout's.
  let last = { innerWidth: win.innerWidth, innerHeight: win.innerHeight, hoverFine: hoverFine0 };
  let applied: {
    result: BandLayout;
    rows: number;
    innerHeight: number;
    insets: Insets;
    banner: boolean;
  } = {
    result: result0,
    rows: rows0,
    innerHeight: win.innerHeight,
    insets: insets0,
    banner: banner0,
  };
  let pending = false;
  let moving = false;
  let moveScrollY = 0;

  const currentTray = (): TrayLayout => trayFor(deps.tileCount(), w, metrics.board - 16);
  const currentBands = (): BandLayout =>
    bandsFor(w, currentTray().rows, inputs.banner, inputs.innerHeight, inputs.insets);

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
    const nextW = next?.w ?? w;
    const nextBoard = next?.metrics.board ?? metrics.board;
    const rows = trayFor(deps.tileCount(), nextW, nextBoard - 16).rows;
    const result = bandsFor(nextW, rows, banner, innerHeight, insets);
    const target = anchorScroll(applied.result, result, y, innerHeight);
    if (next !== undefined) {
      w = next.w;
      metrics = next.metrics;
      wide = next.wide;
      last = { innerWidth, innerHeight, hoverFine };
    }
    inputs = { banner, innerHeight, insets };
    bannerShown = banner;
    applied = { result, rows, innerHeight, insets, banner };
    flushSync();
    if (target !== y) {
      gate.ignoreNextScroll();
      win.scrollTo({ top: target });
    }
  }

  function beginMove(): void {
    if (moving) throw new Error('AD-11 beginMove() while a move is open');
    // A `moving` left set by a dispatch throw between begin and end is intended: the app halts (rule 6).
    moving = true;
    moveScrollY = win.scrollY;
  }

  // After the move's flush: the DOM holds the new band heights. A row change shifts the anchor band
  // by `anchorScroll` against the move's starting scroll (a shrink may already have clamped the
  // browser's), as one own write the gate ignores.
  function endMove(): void {
    if (!moving) throw new Error('AD-11 endMove() without beginMove()');
    moving = false;
    const rows = currentTray().rows;
    if (rows === applied.rows) return;
    if (gate.busy) throw new Error('AD-11 tray rows changed while the gate is busy');
    const result = currentBands();
    const target = anchorScroll(applied.result, result, moveScrollY, applied.innerHeight);
    applied = { ...applied, result, rows };
    if (win.scrollY !== target) {
      gate.ignoreNextScroll();
      win.scrollTo({ top: target });
    }
  }

  // A tile-count change outside a move (restore, New game, Replay): rows follow, no scroll write.
  function syncTiles(): void {
    if (moving) return;
    const rows = currentTray().rows;
    if (rows === applied.rows) return;
    applied = { ...applied, result: currentBands(), rows };
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
  deps.watchTiles(syncTiles);
  win.addEventListener('scroll', () => gate.scroll(), { passive: true });
  win.addEventListener('scrollend', () => gate.scrollEnd(), { passive: true });

  return {
    get w() {
      return w;
    },
    get metrics() {
      return metrics;
    },
    get trayInnerWidth() {
      return metrics.board - 16;
    },
    get tray() {
      return currentTray();
    },
    get wide() {
      return wide;
    },
    get heights() {
      return currentBands().heights;
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
    beginMove,
    endMove,
    watchHoverFine(callback) {
      hoverFineWatchers.add(callback);
      return () => {
        hoverFineWatchers.delete(callback);
      };
    },
  };
}
