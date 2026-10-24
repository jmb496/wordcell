import { describe, expect, it } from 'vitest';
import { cardMetrics, cardWidth } from '../layout/geometry';
import {
  CARD_STEP,
  cardBounces,
  cardExited,
  cardX,
  cardY,
  type Group,
  type LaunchInput,
  launch,
  RISE_SHARE,
  rowScale,
  rowWidth,
  type StepState,
  step,
} from './step';

// AD-19 (R-87): the pure step. Band 360 x 500, card 40 x 53.
const BASE: LaunchInput = {
  groups: [{ x: 180, y: 300, letters: 3 }],
  cardW: 40,
  cardH: 53,
  floor: 500,
  ceiling: 0,
  walls: { left: 0, right: 360 },
  capMs: 6000,
  baseMs: 180,
};
const make = (over: Partial<LaunchInput> = {}) => launch({ ...BASE, ...over });
const withGroup = (state: StepState, patch: Partial<Group>, i = 0): StepState => ({
  ...state,
  groups: state.groups.map((g, j) => (j === i ? { ...g, ...patch } : g)),
});
const run = (state: StepState, ms: number, dt = 16): StepState => {
  let s = state;
  for (let t = 0; t < ms && !s.finished; t += dt) s = step(s, dt);
  return s;
};
const first = (s: StepState): Group => s.groups[0] as Group;
/** `state` read at another elapsed time (positions are a function of the group and the time). */
const at = (state: StepState, elapsedMs: number): StepState => ({ ...state, elapsedMs });
/** Card `j` of `group` in letter order at `elapsedMs`. */
const card = (state: StepState, group: Group, j: number, elapsedMs = state.elapsedMs) => {
  const s = at(state, elapsedMs);
  return {
    x: cardX(s, group, j),
    y: cardY(s, group, j),
    bounces: cardBounces(s, group, j),
    exited: cardExited(s, group, j),
  };
};
/** The cards in travel order: the leading end first (SPEC F21). */
const travel = (g: Group): number[] =>
  [...Array(g.cards).keys()].map((k) => (g.side === 1 ? g.cards - 1 - k : k));
const cards = (g: Group): number[] => [...Array(g.cards).keys()];

describe('AD-19 step', () => {
  it('AD-19 floor contact: each card meets the floor at its own first contact, rebounds and counts one bounce', () => {
    const s = make({ groups: [{ x: 100, y: 300, letters: 4 }] });
    const g = first(s);
    for (const [k, j] of travel(g).entries()) {
      const contact = g.launchMs + k * g.lagMs + g.contactMs;
      const before = card(s, g, j, contact - 1);
      const on = card(s, g, j, contact + 0.01);
      const after = card(s, g, j, contact + 50);
      expect([j, before.bounces, on.bounces, after.bounces]).toEqual([j, 0, 1, 1]);
      expect(before.y + g.cardH / 2).toBeLessThan(500);
      expect(on.y + g.cardH / 2).toBeCloseTo(500, 1);
      expect(after.y).toBeLessThan(on.y);
    }
    expect(s.finished).toBe(false);
  });

  it('AD-19 a row starting on the floor rises, then meets it again: one bounce', () => {
    const s = make({ groups: [{ x: 180, y: 500 - 26.5, letters: 3 }] });
    const g = first(s);
    const lead = travel(g)[0] as number;
    expect(g.vy).toBeLessThan(0);
    expect(card(s, g, lead, g.contactMs / 2).y).toBeLessThan(500 - 26.5);
    expect(card(s, g, lead, g.contactMs - 1).bounces).toBe(0);
    expect(card(s, g, lead, g.contactMs + 1).bounces).toBe(1);
  });

  it('AD-19 no card ever ends below the floor over a whole run', () => {
    let s = make({
      groups: [
        { x: 60, y: 300, letters: 5 },
        { x: 300, y: 450, letters: 4 },
      ],
    });
    while (!s.finished) {
      s = step(s, 16);
      for (const g of s.groups)
        for (const j of cards(g)) expect(card(s, g, j).y + g.cardH / 2).toBeLessThanOrEqual(500);
    }
  });

  it('AD-19 no card passes the ceiling: every rebound peaks at the launch apex, below it', () => {
    // An origin near the ceiling: the launch rises RISE_SHARE of the little room above it.
    let s = make({ groups: [{ x: 20, y: 40, letters: 3 }] });
    const g = first(s);
    const apex = 40 - RISE_SHARE * (40 - g.cardH / 2);
    let minY = Number.POSITIVE_INFINITY;
    while (!s.finished) {
      s = step(s, 16);
      for (const j of cards(g)) {
        const { y } = card(s, g, j);
        expect(y - g.cardH / 2).toBeGreaterThan(0);
        minY = Math.min(minY, y);
      }
    }
    expect(minY).toBeGreaterThanOrEqual(apex - 1e-9);
    expect(minY - apex).toBeLessThan(1);
  });

  it('AD-19 exited needs the whole box beyond its wall, then the group is hidden and no longer written', () => {
    const one = make({ groups: [{ x: 180, y: 250, letters: 1 }] });
    const s = withGroup(one, { launchMs: 0, x: 350, vx: 0.1, cardW: 80 });
    // Box left edge 311.6 < 360: still inside.
    expect(first(step(s, 16)).exited).toBe(false);
    const past = withGroup(s, { x: 405, vx: 0 });
    // Box left edge 365 >= 360: wholly past.
    const gone = step(past, 16);
    expect(first(gone).exited).toBe(true);
    expect(first(gone).opacity).toBe(0);
    expect(step(gone, 16).groups[0]).toBe(first(gone));
    expect(gone.finished).toBe(true);
  });

  it("AD-19 group exit is its last card's exit: the leading card leaves first, the group when its last card is wholly past the wall (left)", () => {
    let s = make({ groups: [{ x: 300, y: 300, letters: 6 }] });
    expect(first(s).side).toBe(-1);
    const order = travel(first(s));
    expect(order).toEqual([0, 1, 2, 3, 4, 5]);
    const exitedAt = new Map<number, number>();
    while (!s.finished) {
      s = step(s, 16);
      const g = first(s);
      for (const j of order)
        if (!exitedAt.has(j) && card(s, g, j).exited) exitedAt.set(j, s.elapsedMs);
      if (!g.exited) expect(card(s, g, 5).x + g.cardW / 2).toBeGreaterThan(0);
    }
    const g = first(s);
    expect(g.exited).toBe(true);
    expect(card(s, g, 5).x + g.cardW / 2).toBeLessThanOrEqual(0);
    const times = order.map((j) => exitedAt.get(j) as number);
    for (let k = 1; k < times.length; k++)
      expect(times[k]).toBeGreaterThanOrEqual(times[k - 1] as number);
    expect(times[0]).toBeLessThan(times[5] as number);
    expect(s.elapsedMs).toBe(times[5]);
  });

  it('AD-19 the run is deterministic: equal inputs give equal states and card positions', () => {
    const input = {
      groups: [3, 5, 4, 7].map((letters, i) => ({ x: 60 + i * 80, y: 380, letters })),
    };
    const a = run(make(input), 3000);
    const b = run(make(input), 3000);
    expect(a).toEqual(b);
    const places = (s: StepState) =>
      s.groups.flatMap((g) => cards(g).map((j) => [cardX(s, g, j), cardY(s, g, j)]));
    expect(places(a)).toEqual(places(b));
  });

  it('AD-19 dt is clamped to 50 ms (500 equals 50)', () => {
    const s = withGroup(make(), { launchMs: 0 });
    expect(step(s, 500)).toEqual(step(s, 50));
    expect(step(s, 500).elapsedMs).toBe(50);
    expect(step(s, -20).elapsedMs).toBe(0);
  });

  it('AD-19 per-cell origins: each row starts centred on its own origin, hidden', () => {
    const s = make({
      groups: [
        { x: 30, y: 400, letters: 3 },
        { x: 300, y: 410, letters: 4 },
      ],
    });
    const rows = s.groups.map((g) => {
      const xs = cards(g).map((j) => card(s, g, j).x);
      return [
        ((xs[0] as number) + (xs.at(-1) as number)) / 2,
        cards(g).map((j) => card(s, g, j).y),
      ];
    });
    expect(rows[0]?.[0]).toBeCloseTo(30, 9);
    expect(rows[1]?.[0]).toBeCloseTo(300, 9);
    expect(rows.map((r) => r[1])).toEqual([
      [400, 400, 400],
      [410, 410, 410, 410],
    ]);
    expect(s.groups.map((g) => g.opacity)).toEqual([0, 0]);
  });

  it('AD-19 SPEC F20: at launch consecutive cards sit CARD_STEP (0.65) card widths apart in letter order, the row rowWidth wide', () => {
    expect(CARD_STEP).toBe(0.65);
    expect(rowWidth(4, 40)).toBeCloseTo(118, 10);
    for (const x of [100, 260]) {
      const s = make({ groups: [{ x, y: 300, letters: 4 }] });
      const g = first(s);
      const xs = cards(g).map((j) => card(s, g, j).x);
      for (const [j, v] of xs.entries()) expect(v - (xs[0] as number)).toBeCloseTo(j * 26, 9);
      expect((xs[3] as number) - (xs[0] as number) + g.cardW).toBeCloseTo(118, 9);
    }
  });

  it("AD-19 SPEC F21: each card runs the leading card's path a lag behind the card ahead (lag = gap / |vx|)", () => {
    const s = make({
      groups: [
        { x: 100, y: 380, letters: 5 },
        { x: 280, y: 400, letters: 4 },
      ],
    });
    for (const g of s.groups) {
      expect(g.gap).toBeCloseTo(CARD_STEP * g.cardW, 12);
      expect(g.lagMs).toBeCloseTo(g.gap / Math.abs(g.vx), 9);
      const order = travel(g);
      for (let t = g.launchMs; t < 6000; t += 37) {
        const lead = card(s, g, order[0] as number, t);
        for (const [k, j] of order.entries()) {
          const c = card(s, g, j, t + k * g.lagMs);
          expect([j, c.x]).toEqual([j, expect.closeTo(lead.x, 6)]);
          expect([j, c.y]).toEqual([j, expect.closeTo(lead.y, 6)]);
        }
      }
    }
  });

  it('AD-19 SPEC F21: until its start a trailing card slides along the row line at the drift speed', () => {
    const s = make({ groups: [{ x: 100, y: 380, letters: 5 }] });
    const g = first(s);
    const last = travel(g)[4] as number;
    const row = card(s, g, last, 0);
    for (const t of [10, 100, 4 * g.lagMs - 1]) {
      const c = card(s, g, last, t);
      expect(c.y).toBe(380);
      expect(c.x - row.x).toBeCloseTo(g.vx * t, 9);
    }
    expect(card(s, g, last, 4 * g.lagMs + 50).y).toBeLessThan(380);
  });

  it('AD-19 SPEC F21: letter order holds all run, the cards a constant gap apart in x (both sides)', () => {
    let s = make({
      groups: [
        { x: 60, y: 420, letters: 7 },
        { x: 300, y: 420, letters: 6 },
      ],
    });
    expect(s.groups.map((g) => g.side)).toEqual([1, -1]);
    while (!s.finished) {
      s = step(s, 16);
      for (const g of s.groups)
        for (let j = 1; j < g.cards; j++)
          expect(card(s, g, j).x - card(s, g, j - 1).x).toBeCloseTo(g.gap, 9);
    }
  });

  it('AD-19 drifts toward the side with more room: left of centre goes right, right goes left, centre goes right', () => {
    const side = (x: number) => first(make({ groups: [{ x, y: 300, letters: 3 }] })).side;
    expect(side(100)).toBe(1);
    expect(side(260)).toBe(-1);
    expect(side(180)).toBe(1);
    expect(first(make({ groups: [{ x: 100, y: 300, letters: 3 }] })).vx).toBeGreaterThan(0);
    expect(first(make({ groups: [{ x: 260, y: 300, letters: 3 }] })).vx).toBeLessThan(0);
  });

  it('AD-19 a pre-launch group is hidden, then shown after its stagger offset', () => {
    const s = make({
      groups: Array.from({ length: 4 }, (_, i) => ({ x: 100 + i * 30, y: 380, letters: 3 })),
    });
    const late = s.groups[3] as Group;
    const lead = travel(late)[0] as number;
    expect(late.launchMs).toBeGreaterThan(0);
    let t = s;
    while (t.elapsedMs + 16 < late.launchMs) t = step(t, 16);
    expect((t.groups[3] as Group).opacity).toBe(0);
    expect(card(t, t.groups[3] as Group, lead).y).toBe(380);
    expect((t.groups[0] as Group).opacity).toBe(1);
    while (t.elapsedMs <= late.launchMs) t = step(t, 16);
    expect((t.groups[3] as Group).opacity).toBe(1);
    expect(card(t, t.groups[3] as Group, lead).y).not.toBe(380);
  });

  it('AD-19 the cap: moving groups fade over the last baseMs and the run finishes by the cap', () => {
    // A group that never exits (no horizontal speed) fades over [cap - baseMs, cap].
    let s = withGroup(make(), { launchMs: 0, vx: 0 });
    s = run(s, 6000 - 180 - 16);
    expect(first(s).opacity).toBe(1);
    const t = step(withGroup(s, {}), 16);
    s = run(t, 6000);
    expect(s.elapsedMs).toBeGreaterThanOrEqual(6000);
    expect(s.elapsedMs).toBeLessThanOrEqual(6000 + 16);
    expect(s.finished).toBe(true);
    expect(first(s).opacity).toBe(0);
    const mid = withGroup(make(), { launchMs: 0, vx: 0 });
    const half = run(mid, 6000 - 90 + 1);
    expect(first(half).opacity).toBeGreaterThan(0);
    expect(first(half).opacity).toBeLessThan(1);
  });

  for (const [name, capMs, baseMs] of [
    ['Fast', 3000, 90],
    ['Slow', 10666.67, 320],
  ] as const) {
    it(`AD-19 the closing fade lasts baseMs at ${name}: 1 just before cap − baseMs, half at cap − baseMs/2`, () => {
      // Steps of at most 50 ms that land exactly on `at`.
      const until = (state: StepState, to: number): StepState => {
        let t = state;
        while (t.elapsedMs < to) t = step(t, Math.min(50, to - t.elapsedMs));
        return t;
      };
      let s = withGroup(make({ capMs, baseMs }), { launchMs: 0, vx: 0 });
      s = until(s, capMs - baseMs - 1);
      expect(first(s).exited).toBe(false);
      expect(first(s).opacity).toBe(1);
      s = until(s, capMs - baseMs / 2);
      expect(first(s).opacity).toBeGreaterThan(0);
      expect(first(s).opacity).toBeLessThan(1);
      expect(first(s).opacity).toBeCloseTo(0.5, 6);
    });
  }

  for (const [name, capMs, baseMs] of [
    ['Fast', 3000, 90],
    ['Normal', 6000, 180],
    ['Slow', 10666.67, 320],
  ] as const) {
    it(`AD-19 a large list is done before the closing fade at ${name}: every group launched, then exited by cap − baseMs`, () => {
      const groups = Array.from({ length: 40 }, (_, i) => ({
        x: 40 + (i % 8) * 40,
        y: 420,
        letters: 3 + (i % 8),
      }));
      const s0 = make({ groups, capMs, baseMs });
      expect(Math.max(...s0.groups.map((g) => g.launchMs))).toBeLessThanOrEqual(capMs / 2);
      const s = run(s0, capMs + 100);
      expect(s.finished).toBe(true);
      expect(s.elapsedMs).toBeLessThanOrEqual(capMs - baseMs + 16);
      for (const g of s.groups) expect(g.exited).toBe(true);
    });
  }

  for (const n of [41, 42]) {
    it(`AD-19 the last launch is within half the cap with ${n} entries`, () => {
      const groups = Array.from({ length: n }, (_, i) => ({
        x: 40 + (i % 8) * 40,
        y: 420,
        letters: 3,
      }));
      const s0 = make({ groups, capMs: 6000, baseMs: 180 });
      expect(Math.max(...s0.groups.map((g) => g.launchMs))).toBeLessThanOrEqual(6000 * 0.5 + 1e-6);
    });
  }

  it('AD-19 one entry finishes by the cap too, with a single group at Normal', () => {
    const s = run(make(), 7000);
    expect(s.finished).toBe(true);
    expect(s.elapsedMs).toBeLessThanOrEqual(6016);
  });

  it('AD-19 zero groups is finished at once', () => {
    expect(make({ groups: [] }).finished).toBe(true);
    expect(step(make({ groups: [] }), 16).finished).toBe(true);
  });

  it('AD-19 rowScale fits 90 % of the band, floors at 0.4 and never enlarges (card width 40)', () => {
    expect(rowScale(3, 40, 360)).toBe(1);
    expect(rowScale(23, 40, 360)).toBeCloseTo(324 / 612, 10);
    expect(rowScale(23, 60, 360)).toBe(0.4);
    expect(rowScale(23, 150, 360)).toBe(0.4);
    expect(rowScale(1, 40, 3600)).toBe(1);
  });

  it('AD-19 a 23-letter row is scaled, its cards spanning 90 % of the band at launch', () => {
    const s = make({ groups: [{ x: 180, y: 300, letters: 23 }] });
    const g = first(s);
    expect(g.scale).toBeCloseTo(324 / 612, 10);
    expect(g.cardW).toBeCloseTo(40 * g.scale, 10);
    expect(g.cardH).toBeCloseTo(53 * g.scale, 10);
    expect(card(s, g, 22).x - card(s, g, 0).x + g.cardW).toBeCloseTo(0.9 * 360, 9);
  });

  // SPEC F6: overlapping waves, in word-list order. Origins along the WordCell row.
  const row = (n: number) =>
    Array.from({ length: n }, (_, i) => ({ x: 22.5 + (i % 8) * 45, y: 420, letters: 3 + (i % 5) }));

  it('AD-19 launchMs strictly increases with the entry index (list order, longest first)', () => {
    const launches = make({ groups: row(7) }).groups.map((g) => g.launchMs);
    for (let i = 1; i < launches.length; i++)
      expect(launches[i]).toBeGreaterThan(launches[i - 1] as number);
  });

  it('AD-19 the launch offsets of the first entries at Normal are 0, 160, 320 and 480 ms (7 entries)', () => {
    const launches = make({ groups: row(7) }).groups.map((g) => g.launchMs);
    expect(launches.slice(0, 4)).toEqual([0, 160, 320, 480]);
  });

  for (const [name, capMs, baseMs] of [
    ['Fast', 3000, 90],
    ['Normal', 6000, 180],
    ['Slow', 10666.67, 320],
  ] as const) {
    it(`AD-19 waves overlap at ${name}: every later group launches while an earlier one is shown`, () => {
      let s = make({ groups: row(6), capMs, baseMs });
      const launches = s.groups.map((g) => g.launchMs);
      for (let i = 1; i < launches.length; i++) {
        while (s.elapsedMs < (launches[i] as number) && !s.finished) s = step(s, 16);
        expect(s.elapsedMs).toBeGreaterThanOrEqual(launches[i] as number);
        const shown = s.groups
          .slice(0, i)
          .some((g) => g.launchMs < (launches[i] as number) && !g.exited && g.opacity > 0);
        expect([i, shown]).toEqual([i, true]);
      }
    });
  }

  it('AD-19 the launch rises: vy < 0, the leading card peaks near origin minus RISE_SHARE x the room above, before the floor', () => {
    // Near the left wall: the group drifts right across the band and meets the floor first.
    let s = make({ groups: [{ x: 20, y: 300, letters: 3 }] });
    const g = first(s);
    const lead = travel(g)[0] as number;
    expect(g.vy).toBeLessThan(0);
    s = step(step(s, 16), 16);
    expect(card(s, g, lead).y).toBeLessThan(300);
    let minY = card(s, g, lead).y;
    while (card(s, g, lead).bounces === 0 && !s.finished) {
      s = step(s, 16);
      minY = Math.min(minY, card(s, g, lead).y);
    }
    expect(card(s, g, lead).bounces).toBe(1);
    const expected = 300 - RISE_SHARE * (300 - g.cardH / 2 - s.ceiling);
    expect(Math.abs(minY - expected)).toBeLessThan(5);
  });

  it('AD-19 a floor bounce keeps the drift: x moves vx per ms across a contact', () => {
    const s = make({ groups: [{ x: 100, y: 300, letters: 3 }] });
    const g = first(s);
    const lead = travel(g)[0] as number;
    const before = card(s, g, lead, g.contactMs - 20);
    const after = card(s, g, lead, g.contactMs + 20);
    expect([before.bounces, after.bounces]).toEqual([0, 1]);
    expect(after.x - before.x).toBeCloseTo(g.vx * 40, 9);
  });

  // EXPERIENCE.md Win celebration: each card bounces on the floor before it leaves past a side
  // edge. Real layouts (AD-11 card width, no insets): the band lies between the 44 px top bar and
  // the 60 px action bar, the board is centred and the WordCell labels row (16 px) sits above the
  // WordCells (H) and the 8 px action gap; label n is centred over column n − 2.
  const scene = (
    clientWidth: number,
    innerHeight: number,
    hoverFine: boolean,
    rows: readonly (readonly [letters: number, cell: number])[],
  ) => {
    const cardW = cardWidth(clientWidth, innerHeight, { top: 0, bottom: 0 }, hoverFine);
    const { H, slot, board } = cardMetrics(cardW);
    const floor = innerHeight - 44 - 60;
    const boardLeft = (clientWidth - board) / 2;
    const groups = rows.map(([letters, cell]) => ({
      x: boardLeft + (cell - 3) * slot + slot / 2,
      y: floor - 8 - H - 8,
      letters,
    }));
    return { groups, cardW, cardH: H, floor, ceiling: 0, walls: { left: 0, right: clientWidth } };
  };
  const LONG = [23, 17, 12, 10, 9, 8, 7, 6, 5, 4, 3, 3].map(
    (letters, i) => [letters, 3 + ((i * 3) % 8)] as const,
  );
  // session-won-words' word list (WON_ROWS, longest first): card counts and WordCells.
  const FIXTURE = [
    [10, 10],
    [6, 7],
    [6, 6],
    [6, 6],
    [5, 5],
    [5, 5],
    [5, 5],
    [4, 4],
    [4, 4],
    [4, 3],
  ] as const;
  for (const [list, rows] of [
    ['12 groups up to 23 letters', LONG],
    ['the session-won-words list', FIXTURE],
  ] as const) {
    for (const [geometry, clientWidth, innerHeight, hoverFine] of [
      ['portrait 360x740', 360, 740, false],
      ['desktop 1280x720', 1280, 720, true],
      ['landscape 839x412', 839, 412, false],
    ] as const) {
      for (const [name, capMs, baseMs] of [
        ['Fast', 3000, 90],
        ['Normal', 6000, 180],
        ['Slow', 10666.67, 320],
      ] as const) {
        it(`AD-19 every card bounces on the floor, then exits, all before the closing fade (${geometry}, ${name}, ${list})`, () => {
          let s = launch({ ...scene(clientWidth, innerHeight, hoverFine, rows), capMs, baseMs });
          const exited = new Set<string>();
          while (!s.finished) {
            s = step(s, 16);
            s.groups.forEach((g, i) => {
              for (const j of cards(g)) {
                const key = `${i}:${j}`;
                if (exited.has(key)) continue;
                const c = card(s, g, j);
                if (!c.exited) continue;
                exited.add(key);
                expect([key, c.bounces >= 1]).toEqual([key, true]);
              }
            });
          }
          expect(s.elapsedMs).toBeLessThanOrEqual(capMs - baseMs + 16);
          expect(s.groups.every((g) => g.exited)).toBe(true);
          expect(exited.size).toBe(rows.reduce((n, [letters]) => n + letters, 0));
        });
      }
    }
  }

  // The pace launch() applied to a group: its gravity over the unpaced gravity, 2 x band height /
  // (FALL_FRAC x cap)² with step.ts's FALL_FRAC 0.2 (gravity x pace², so the square root).
  const paceOf = (s: StepState, g: Group): number =>
    Math.sqrt((g.gravity * (0.2 * s.capMs) ** 2) / (2 * (s.floor - s.ceiling)));

  for (const [geometry, clientWidth, innerHeight, hoverFine] of [
    ['portrait 360x740', 360, 740, false],
    ['desktop 1280x720', 1280, 720, true],
    ['landscape 839x412', 839, 412, false],
  ] as const) {
    it(`AD-19 the trail fit leaves the session-won-words arcs near their natural tempo: every group's pace ≤ 1.15 (${geometry}, Normal)`, () => {
      const s = launch({
        ...scene(clientWidth, innerHeight, hoverFine, FIXTURE),
        capMs: 6000,
        baseMs: 180,
      });
      // Measured 2026-10-24: at most 1.11 (portrait), 1.00 (desktop, landscape).
      for (const [i, g] of s.groups.entries())
        expect(paceOf(s, g), `group ${i}`).toBeLessThanOrEqual(1.15);
    });
  }

  it('AD-19 the physics scales with the speed: half the cap and base double |vx| and |vy|, quadruple gravity, halve launches and lags', () => {
    const groups = row(4);
    const fast = make({ groups, capMs: 3000, baseMs: 90 });
    const normal = make({ groups, capMs: 6000, baseMs: 180 });
    fast.groups.forEach((g, i) => {
      const n = normal.groups[i] as Group;
      expect(g.gravity).toBeCloseTo(4 * n.gravity, 12);
      expect(Math.abs(g.vx)).toBeCloseTo(2 * Math.abs(n.vx), 12);
      expect(Math.abs(g.vy)).toBeCloseTo(2 * Math.abs(n.vy), 12);
      expect(g.launchMs).toBeCloseTo(n.launchMs / 2, 9);
      expect(g.lagMs).toBeCloseTo(n.lagMs / 2, 9);
    });
  });

  it('AD-19 a trail that would overrun is fitted: the group plays its arc faster, the last card out by cap − baseMs', () => {
    // A 23-letter row from the left edge: at its natural pace its last card would leave after the cap.
    const s = make({ groups: [{ x: 20, y: 420, letters: 23 }] });
    const g = first(s);
    const out = g.launchMs + 22 * g.lagMs + (360 + g.cardW / 2 - g.x) / g.vx;
    expect(out).toBeCloseTo(6000 - 180, 6);
    const free = make({ groups: [{ x: 20, y: 420, letters: 23 }], capMs: 60000, baseMs: 180 });
    const relaxed = first(free);
    // The fitted arc is the same shape: equal apex, a shorter first contact, and the path y(x) is
    // unchanged (slope vy / vx and curvature gravity / vx² match: drift and launch share the pace).
    expect(g.contactMs).toBeLessThan(relaxed.contactMs / 10);
    expect((g.vy * g.vy) / (2 * g.gravity)).toBeCloseTo(
      (relaxed.vy * relaxed.vy) / (2 * relaxed.gravity),
      6,
    );
    expect(g.vy / g.vx).toBeCloseTo(relaxed.vy / relaxed.vx, 9);
    expect(g.gravity / g.vx ** 2).toBeCloseTo(relaxed.gravity / relaxed.vx ** 2, 12);
  });
});
