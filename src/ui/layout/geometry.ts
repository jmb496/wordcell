// AD-11: pure layout geometry after DESIGN.md Layout (width rule, height rule, A-D4, A-D11) and
// build-notes CAP-1. Two entry points, `cardWidth` and `bands`; the rest are helpers beside them.
// Insets are used as measured (no rounding). Pure: no DOM, `window`, timers or Svelte.
import { ANCHOR_BAND, type BandId, SLACK_BAND, type Unit } from './bands';

export type Insets = { readonly top: number; readonly bottom: number };

export type CardMetrics = { H: number; strip: number; slot: number; board: number };

export type BandLayout = {
  heights: Record<BandId, number>;
  anchorOffset: number;
  total: number;
};

export type WidthInputs = { readonly innerWidth: number; readonly innerHeight: number };

const MIN_W = 40;
const BANNER_H = 44;
const RECOMPUTE_DH = 80;

/** AD-11: card height H, column strip, slot pitch and board width for card width `w`. */
export function cardMetrics(w: number): CardMetrics {
  const H = Math.round((4 * w) / 3);
  const slot = w + 4;
  return { H, strip: Math.max(44, Math.round(0.72 * H)), slot, board: 8 * slot };
}

/** AD-11: the width the board may use: `clientWidth` minus both side gutters. */
export function availableWidth(clientWidth: number, hoverFine: boolean): number {
  return clientWidth - 2 * (hoverFine ? 16 : 4);
}

/** A-D4: the tray's extra height for `trayRows` compact rows (1 = card-height mode). */
export function trayGrowth(trayRows: number, H: number): number {
  return Math.max(0, trayRows * 44 + (trayRows - 1) * 4 - Math.max(H, 92));
}

/** Height-rule band heights without leftover, banner or tray growth (those are 0 here). */
function baseHeights(w: number, insets: Insets): Record<BandId, number> {
  const { H, strip } = cardMetrics(w);
  return {
    topBar: 44 + insets.top,
    banner: 0,
    leftover: 0,
    columns: 6 * strip + H,
    footRow: 44,
    trayGap: 4,
    tray: 24 + Math.max(H, 92) + 44 + 16,
    labels: 16,
    wordcells: H,
    actionGap: 8,
    actionBar: 60 + insets.bottom,
  };
}

function sumOf(heights: Record<BandId, number>): number {
  let sum = 0;
  for (const band of Object.keys(heights) as BandId[]) sum += heights[band];
  return sum;
}

/** The height-rule sum: the integer band terms first, the insets last (no float drift). */
function heightRuleSum(w: number, insets: Insets): number {
  return sumOf(baseHeights(w, { top: 0, bottom: 0 })) + (insets.top + insets.bottom);
}

/**
 * AD-11: card width w for the available viewport width (the layout module passes
 * `document.documentElement.clientWidth`, build-notes CAP-1) and `innerHeight`. Takes no banner
 * or tray input (A-D4). Like `bands`, it does no input validation (rule 6; callers pass DOM
 * numbers).
 */
export function cardWidth(
  clientWidth: number,
  innerHeight: number,
  insets: Insets,
  hoverFine: boolean,
): number {
  const widthDerived = Math.floor(availableWidth(clientWidth, hoverFine) / 8 - 4);
  // The height-rule sum is non-decreasing in w, so walk up while the next w still fits.
  let heightDerived = MIN_W;
  while (heightDerived < widthDerived && heightRuleSum(heightDerived + 1, insets) <= innerHeight) {
    heightDerived++;
  }
  return Math.max(MIN_W, Math.min(widthDerived, heightDerived));
}

/**
 * AD-11: every band's height, the absolute `ANCHOR_BAND` offset and the document total, with the
 * order-independent growth rule: banner and tray growth draw down `SLACK_BAND` only when on its
 * side of the anchor; the rest pushes away from the anchor into `total`.
 */
export function bands(
  w: number,
  bandOrder: readonly Unit[],
  trayRows: number,
  bannerShown: boolean,
  innerHeight: number,
  insets: Insets,
): BandLayout {
  const heights = baseHeights(w, insets);
  const order = bandOrder.flat();
  const anchorAt = order.indexOf(ANCHOR_BAND);
  const slackAbove = order.indexOf(SLACK_BAND) < anchorAt;
  const sameSideAsSlack = (band: BandId) => order.indexOf(band) < anchorAt === slackAbove;

  const baseSum = heightRuleSum(w, insets);
  const leftover = Math.max(0, innerHeight - baseSum);
  const bannerGrowth = bannerShown ? BANNER_H : 0;
  const tray = trayGrowth(trayRows, cardMetrics(w).H);
  const absorbed =
    (sameSideAsSlack('banner') ? bannerGrowth : 0) + (sameSideAsSlack('tray') ? tray : 0);

  heights.banner = bannerGrowth;
  heights.tray += tray;
  heights.leftover = Math.max(0, leftover - absorbed);
  // While leftover remains, the document fills innerHeight exactly plus the unabsorbed growth.
  const total =
    heights.leftover > 0
      ? innerHeight + bannerGrowth + tray - absorbed
      : baseSum + bannerGrowth + tray;

  let anchorOffset = 0;
  for (const band of order.slice(0, anchorAt)) anchorOffset += heights[band];
  return { heights, anchorOffset, total };
}

/**
 * AD-11: the scrollTop that keeps `ANCHOR_BAND` fixed from `prev` to `next`, clamped to the
 * scroll range of `next` at `nextInnerHeight` (the viewport height `next` was computed for).
 */
export function anchorScroll(
  prev: BandLayout,
  next: BandLayout,
  scrollTop: number,
  nextInnerHeight: number,
): number {
  const max = Math.max(0, next.total - nextInnerHeight);
  return Math.min(Math.max(scrollTop + next.anchorOffset - prev.anchorOffset, 0), max);
}

/**
 * A-D11: whether a viewport change recomputes w. `last` holds `window.innerWidth`/`innerHeight`
 * recorded at the last w computation.
 */
export function shouldRecomputeWidth(last: WidthInputs, next: WidthInputs): boolean {
  return (
    next.innerWidth !== last.innerWidth ||
    Math.abs(next.innerHeight - last.innerHeight) >= RECOMPUTE_DH
  );
}
