import { describe, expect, it } from 'vitest';
import { BAND_ORDER, parseBandsParam } from './bands';
import {
  anchorScroll,
  availableWidth,
  type BandLayout,
  bands,
  cardMetrics,
  cardWidth,
  shouldRecomputeWidth,
  trayGrowth,
} from './geometry';

const NO_INSETS = { top: 0, bottom: 0 };

type Case = {
  w?: number;
  clientWidth?: number;
  innerHeight: number;
  insets?: { top: number; bottom: number };
  trayRows?: number;
  bannerShown?: boolean;
  order?: string;
};

/** `bands` with the plan's defaults; w from cardWidth unless stated. */
function layout(c: Case): BandLayout {
  const insets = c.insets ?? NO_INSETS;
  const w = c.w ?? cardWidth(c.clientWidth ?? 412, c.innerHeight, insets, false);
  const order = c.order ? parseBandsParam(new URLSearchParams(`?bands=${c.order}`)) : BAND_ORDER;
  return bands(w, order, c.trayRows ?? 1, c.bannerShown ?? false, c.innerHeight, insets);
}

const sum = (l: BandLayout) => l.total - l.heights.leftover;
/** The scroll range upper bound of `l` at `ih`, read through anchorScroll. */
const rangeMax = (l: BandLayout, ih: number) => anchorScroll(l, l, 1e6, ih);
const rangeMin = (l: BandLayout, ih: number) => anchorScroll(l, l, -5, ih);

describe('geometry', () => {
  it('AD-11 cardMetrics', () => {
    expect(cardMetrics(40)).toEqual({ H: 53, strip: 44, slot: 44, board: 352 });
    expect(cardMetrics(46)).toEqual({ H: 61, strip: 44, slot: 50, board: 400 });
    expect(cardMetrics(70)).toEqual({ H: 93, strip: 67, slot: 74, board: 592 });
  });

  it('AD-11 availableWidth', () => {
    expect(availableWidth(412, false)).toBe(404);
    expect(availableWidth(1265, true)).toBe(1233);
    expect(availableWidth(359, false)).toBe(351);
    expect(cardMetrics(40).board).toBe(352);
  });

  it('AD-11 cardWidth and bands reference numbers: 412 × 915, 412 × 839, 360 × 750', () => {
    expect(cardWidth(412, 915, NO_INSETS, false)).toBe(46);
    expect(cardMetrics(46).H).toBe(61);
    expect(cardMetrics(46).strip).toBe(44);
    const at915 = layout({ innerHeight: 915 });
    expect(sum(at915)).toBe(738);
    expect(at915.heights.leftover).toBe(177);

    const at839 = layout({ innerHeight: 839 });
    expect(at839.heights.leftover).toBe(101);
    expect(at839.anchorOffset).toBe(710);

    expect(cardWidth(360, 750, NO_INSETS, false)).toBe(40);
    expect(sum(layout({ clientWidth: 360, innerHeight: 750 }))).toBe(722);
  });

  it('AD-11 cardWidth 1080p with H > 92', () => {
    expect(cardWidth(1905, 950, NO_INSETS, true)).toBe(70);
    expect(cardMetrics(70).H).toBe(93);
    expect(cardMetrics(70).board).toBe(592);
    const l = bands(70, BAND_ORDER, 1, false, 950, NO_INSETS);
    expect(sum(l)).toBe(941);
    expect(l.heights.tray).toBe(177);
  });

  it('AD-11 insets: 412 × 915 with 24/24 and cardWidth(412, 782, {24, 24})', () => {
    const insets = { top: 24, bottom: 24 };
    expect(cardWidth(412, 915, insets, false)).toBe(46);
    const l = layout({ innerHeight: 915, insets });
    expect(sum(l)).toBe(786);
    expect(l.heights.leftover).toBe(129);
    expect(cardWidth(412, 782, insets, false)).toBe(44);
    expect(cardWidth(412, 782, NO_INSETS, false)).toBe(46);
  });

  it('AD-11 bands heights at 412 × 839 and 412 × 915 with 24/24 insets', () => {
    const at839 = {
      topBar: 44,
      banner: 0,
      leftover: 101,
      columns: 325,
      footRow: 44,
      trayGap: 4,
      tray: 176,
      labels: 16,
      wordcells: 61,
      actionGap: 8,
      actionBar: 60,
    };
    expect(layout({ innerHeight: 839 }).heights).toEqual(at839);
    const inset = layout({ innerHeight: 915, insets: { top: 24, bottom: 24 } });
    expect(inset.heights).toEqual({ ...at839, topBar: 68, leftover: 129, actionBar: 84 });
    expect(inset.total).toBe(915);
    expect(inset.anchorOffset).toBe(762);
  });

  it('AD-11 fractional insets are used as measured', () => {
    const l = layout({ w: 46, innerHeight: 839, insets: { top: 23.5, bottom: 12.25 } });
    expect(l.heights.topBar).toBe(67.5);
    expect(l.heights.actionBar).toBe(72.25);
    expect(l.heights.leftover).toBe(65.25);
    expect(l.anchorOffset).toBe(697.75);
    expect(l.total).toBe(839);
  });

  it('AD-11 40 px floor, width- and height-derived', () => {
    expect(availableWidth(360, false)).toBe(352);
    expect(cardWidth(360, 750, NO_INSETS, false)).toBe(40);
    expect(cardWidth(359, 750, NO_INSETS, false)).toBe(40);
    expect(availableWidth(383, true)).toBe(351);
    expect(cardWidth(383, 750, NO_INSETS, true)).toBe(40);
    expect(cardWidth(412, 500, NO_INSETS, false)).toBe(40);
  });

  it('AD-11 height rule above innerHeight: 1280 × 720 leftover 0; banner shown and hidden', () => {
    const base = { clientWidth: 1265, innerHeight: 720 };
    expect(cardWidth(1265, 720, NO_INSETS, true)).toBe(40);
    const hidden = layout({ ...base, w: 40 });
    expect(sum(hidden)).toBe(722);
    expect(hidden.heights.leftover).toBe(0);
    expect(hidden.total).toBe(722);

    const shown = layout({ ...base, w: 40, bannerShown: true });
    expect(shown.anchorOffset - hidden.anchorOffset).toBe(44);
    expect(shown.total).toBe(766);
    expect(anchorScroll(hidden, shown, 0, 720)).toBe(44);
    expect(rangeMin(shown, 720)).toBe(0);
    expect(rangeMax(shown, 720)).toBe(46);

    expect(hidden.anchorOffset - shown.anchorOffset).toBe(-44);
    expect(anchorScroll(shown, hidden, 44, 720)).toBe(0);
    expect(anchorScroll(shown, hidden, 46, 720)).toBe(2);
    expect(rangeMin(hidden, 720)).toBe(0);
    expect(rangeMax(hidden, 720)).toBe(2);
  });

  it('AD-11 banner draws from leftover first: 412 × 839 and 412 × 780', () => {
    const before = layout({ innerHeight: 839 });
    const after = layout({ innerHeight: 839, bannerShown: true });
    expect(before.heights.leftover).toBe(101);
    expect(after.heights.leftover).toBe(57);
    expect(before.heights.banner).toBe(0);
    expect(after.heights.banner).toBe(44);
    expect(before.anchorOffset).toBe(710);
    expect(after.anchorOffset).toBe(710);
    expect(anchorScroll(before, after, 0, 839)).toBe(0);

    const before780 = layout({ innerHeight: 780 });
    const after780 = layout({ innerHeight: 780, bannerShown: true });
    expect(before780.heights.leftover).toBe(42);
    expect(after780.heights.leftover).toBe(0);
    expect(before780.anchorOffset).toBe(651);
    expect(after780.anchorOffset).toBe(653);
    expect(anchorScroll(before780, after780, 0, 780)).toBe(2);
    expect(rangeMin(after780, 780)).toBe(0);
    expect(rangeMax(after780, 780)).toBe(2);
  });

  it('AD-11 trayGrowth', () => {
    expect(trayGrowth(2, 61)).toBe(0);
    expect(trayGrowth(3, 61)).toBe(48);
    expect(trayGrowth(4, 61)).toBe(96);
    expect(trayGrowth(3, 93)).toBe(47);
    expect(trayGrowth(4, 93)).toBe(95);
  });

  it('AD-11 tray growth in the default order', () => {
    const one = layout({ w: 46, innerHeight: 839 });
    const three = layout({ w: 46, innerHeight: 839, trayRows: 3 });
    const four = layout({ w: 46, innerHeight: 839, trayRows: 4 });
    expect(one.heights.leftover).toBe(101);
    expect(three.heights.leftover).toBe(53);
    expect(three.heights.tray).toBe(224);
    expect(four.heights.leftover).toBe(5);
    expect(three.anchorOffset).toBe(710);
    expect(four.anchorOffset).toBe(710);

    const one780 = layout({ w: 46, innerHeight: 780 });
    const three780 = layout({ w: 46, innerHeight: 780, trayRows: 3 });
    expect(one780.heights.leftover).toBe(42);
    expect(three780.heights.leftover).toBe(0);
    expect(one780.anchorOffset).toBe(651);
    expect(three780.anchorOffset).toBe(657);
    expect(three780.total).toBe(786);
    expect(anchorScroll(one780, three780, 0, 780)).toBe(6);

    const bannerOne = layout({ w: 46, innerHeight: 839, bannerShown: true });
    const bannerThree = layout({ w: 46, innerHeight: 839, bannerShown: true, trayRows: 3 });
    expect(bannerThree.heights.leftover).toBe(9);
    expect(bannerOne.anchorOffset).toBe(710);
    expect(bannerThree.anchorOffset).toBe(710);
  });

  it('AD-11 tray growth in the fallback order (WordCells and tray above the columns)', () => {
    const order = 'topBar,banner,leftover,wordcells,tray,columns,actionBar';
    const one = layout({ innerHeight: 839, order });
    const three = layout({ innerHeight: 839, order, trayRows: 3 });
    expect(one.heights.leftover).toBe(101);
    expect(three.heights.leftover).toBe(101);
    expect(one.anchorOffset).toBe(161);
    expect(three.anchorOffset).toBe(161);
    expect(one.total).toBe(839);
    expect(three.total).toBe(887);
    expect(anchorScroll(one, three, 0, 839)).toBe(0);
  });

  it('AD-11 fallback order with banner and tray on opposite sides of the anchor', () => {
    const order = 'topBar,banner,leftover,wordcells,tray,columns,actionBar';
    const before = layout({ innerHeight: 839, order });
    const after = layout({ innerHeight: 839, order, bannerShown: true, trayRows: 3 });
    expect(before.heights.leftover).toBe(101);
    expect(after.heights.leftover).toBe(57);
    expect(before.anchorOffset).toBe(161);
    expect(after.anchorOffset).toBe(161);
    expect(after.total).toBe(887);
    expect(anchorScroll(before, after, 0, 839)).toBe(0);
  });

  it('AD-11 tray growth with slack and tray both below the anchor', () => {
    const order = 'topBar,banner,columns,wordcells,tray,leftover,actionBar';
    const one = layout({ innerHeight: 839, order });
    const three = layout({ innerHeight: 839, order, trayRows: 3 });
    expect(one.heights.leftover).toBe(101);
    expect(three.heights.leftover).toBe(53);
    expect(one.anchorOffset).toBe(429);
    expect(three.anchorOffset).toBe(429);
    expect(three.total).toBe(839);
  });

  it('AD-11 tray growth above the anchor with slack below', () => {
    const order = 'topBar,banner,columns,tray,wordcells,leftover,actionBar';
    const one = layout({ innerHeight: 839, order });
    const three = layout({ innerHeight: 839, order, trayRows: 3 });
    expect(one.heights.leftover).toBe(101);
    expect(three.heights.leftover).toBe(101);
    expect(one.anchorOffset).toBe(609);
    expect(three.anchorOffset).toBe(657);
    expect(one.total).toBe(839);
    expect(three.total).toBe(887);
    expect(anchorScroll(one, three, 0, 839)).toBe(48);
  });

  it('AD-11 banner growth above the anchor with slack below', () => {
    const order = 'topBar,banner,columns,tray,wordcells,leftover,actionBar';
    const before = layout({ w: 46, innerHeight: 839, order });
    const after = layout({ w: 46, innerHeight: 839, order, bannerShown: true });
    expect(before.heights.leftover).toBe(101);
    expect(after.heights.leftover).toBe(101);
    expect(before.anchorOffset).toBe(609);
    expect(after.anchorOffset).toBe(653);
    expect(before.total).toBe(839);
    expect(after.total).toBe(883);
    expect(anchorScroll(before, after, 0, 839)).toBe(44);
  });

  it('AD-11 w-recompute predicate', () => {
    const last = { innerWidth: 412, innerHeight: 839 };
    expect(shouldRecomputeWidth(last, { innerWidth: 412, innerHeight: 839 + 79 })).toBe(false);
    expect(shouldRecomputeWidth(last, { innerWidth: 412, innerHeight: 839 + 80 })).toBe(true);
    expect(shouldRecomputeWidth(last, { innerWidth: 412, innerHeight: 839 - 80 })).toBe(true);
    expect(shouldRecomputeWidth(last, { innerWidth: 413, innerHeight: 839 })).toBe(true);
    expect(shouldRecomputeWidth(last, { innerWidth: 411, innerHeight: 839 })).toBe(true);
    const first = { innerWidth: 412, innerHeight: 839 - 60 };
    expect(shouldRecomputeWidth(last, first)).toBe(false);
    expect(shouldRecomputeWidth(last, { innerWidth: 412, innerHeight: 839 - 120 })).toBe(true);
  });

  it('AD-11 anchorScroll across a w change: 412 × 839 → 412 × 700', () => {
    const before = layout({ innerHeight: 839 });
    expect(cardWidth(412, 839, NO_INSETS, false)).toBe(46);
    expect(cardWidth(412, 700, NO_INSETS, false)).toBe(40);
    const after = layout({ innerHeight: 700 });
    expect(before.anchorOffset).toBe(710);
    expect(after.anchorOffset).toBe(601);
    expect(after.total).toBe(722);
    expect(anchorScroll(before, after, 0, 700)).toBe(0);
    expect(rangeMin(after, 700)).toBe(0);
    expect(rangeMax(after, 700)).toBe(22);
  });

  it('AD-11 F21 innerHeight-only change at w 46', () => {
    const at839 = layout({ w: 46, innerHeight: 839 });
    const at779 = layout({ w: 46, innerHeight: 779 });
    expect(at839.heights.leftover).toBe(101);
    expect(at779.heights.leftover).toBe(41);
    expect(at839.anchorOffset).toBe(710);
    expect(at779.anchorOffset).toBe(650);
    expect(at779.anchorOffset - at839.anchorOffset).toBe(-60);
    expect(anchorScroll(at839, at779, 0, 779)).toBe(0);
    expect(rangeMax(at779, 779)).toBe(0);

    const at780 = layout({ w: 46, innerHeight: 780 });
    const at710 = layout({ w: 46, innerHeight: 710 });
    expect(at780.heights.leftover).toBe(42);
    expect(at710.heights.leftover).toBe(0);
    expect(at780.anchorOffset).toBe(651);
    expect(at710.anchorOffset).toBe(609);
    expect(at710.anchorOffset - at780.anchorOffset).toBe(-42);
    expect(anchorScroll(at780, at710, 0, 710)).toBe(0);
    expect(rangeMax(at780, 780)).toBe(0);
    expect(rangeMax(at710, 710)).toBe(28);

    expect(anchorScroll(at710, at780, 28, 780)).toBe(0);
    expect(at780.anchorOffset - at710.anchorOffset).toBe(42);
  });
});
