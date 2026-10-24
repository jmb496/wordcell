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
  stackOrder,
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
// The pace launch() applied to a group: its gravity over the unpaced gravity, 2 x band height /
// (FALL_FRAC x cap)² with step.ts's FALL_FRAC 0.2 (gravity x pace², so the square root).
const paceOf = (s: StepState, g: Group): number =>
  Math.sqrt((g.gravity * (0.2 * s.capMs) ** 2) / (2 * (s.floor - s.ceiling)));
/** The leading card's centre at `elapsedMs` (SPEC F25: at the word's constant speed). */
const leader = (s: StepState, g: Group, elapsedMs: number) =>
  card(s, g, travel(g)[0] as number, elapsedMs);
/**
 * The group's path at path time `t` ms, the closed form SPEC F25 retimes (the leader's centre at
 * `launchMs + t` before F24): drift, launch arc, elastic rebounds; the row's line behind it.
 */
const pathPoint = (s: StepState, g: Group, t: number) => {
  const lowest = s.floor - g.cardH / 2;
  const r = (t - g.contactMs) % g.periodMs;
  const y =
    t <= 0
      ? g.y
      : t < g.contactMs
        ? g.y + g.vy * t + (g.gravity * t * t) / 2
        : lowest - g.reboundVy * r + (g.gravity * r * r) / 2;
  return { x: g.x + g.vx * t, y: Math.min(lowest, y) };
};
/** SPEC F25: the leader's path time at `elapsedMs` (its x is the drift times its path time). */
const leaderPathMs = (s: StepState, g: Group, elapsedMs: number): number =>
  (leader(s, g, elapsedMs).x - g.x) / g.vx;
/** SPEC F25: the elapsed time at which the leader is at path time `t` (bisection). */
const when = (s: StepState, g: Group, t: number): number => {
  let [lo, hi] = [g.launchMs, g.launchMs + t + 1];
  while (leaderPathMs(s, g, hi) < t) hi += t + 1;
  for (let i = 0; i < 80; i++)
    if (leaderPathMs(s, g, (lo + hi) / 2) < t) lo = (lo + hi) / 2;
    else hi = (lo + hi) / 2;
  return (lo + hi) / 2;
};
/** SPEC F23: a step between two centres in card units (x over the card width, y its height). */
const units = (g: Group, dx: number, dy: number): number => Math.hypot(dx / g.cardW, dy / g.cardH);
/**
 * SPEC F23, measured independently of step.ts's tables: the arc length in card units along the
 * group's path between the path points with centre x `xa` and `xb` (xb ahead): the row's line
 * behind the launch point, then the path as a polyline of 2000 chords.
 */
const arcBetween = (s: StepState, g: Group, xa: number, xb: number): number => {
  const [da, db] = [g.side * (xa - g.x), g.side * (xb - g.x)];
  const [ta, tb] = [Math.max(da, 0) / Math.abs(g.vx), Math.max(db, 0) / Math.abs(g.vx)];
  let arc = (Math.min(db, 0) - Math.min(da, 0)) / g.cardW;
  let prev = pathPoint(s, g, ta);
  for (let i = 1; i <= 2000; i++) {
    const p = pathPoint(s, g, ta + ((tb - ta) * i) / 2000);
    arc += units(g, p.x - prev.x, p.y - prev.y);
    prev = p;
  }
  return arc;
};
/** SPEC F23: the arc from the launch point to the path point at centre x `x` (negative behind). */
const arcTo = (s: StepState, g: Group, x: number): number => arcBetween(s, g, g.x, x);
/**
 * SPEC F23: at `elapsedMs`, each card sits on the path (on the leader's earlier point with its x,
 * or on the row's line behind the launch point) CARD_STEP card units of arc behind the card ahead.
 */
const expectTrail = (s: StepState, g: Group, elapsedMs: number): void => {
  let ahead = Number.NaN;
  for (const [k, j] of travel(g).entries()) {
    const c = card(s, g, j, elapsedMs);
    const d = g.side * (c.x - g.x);
    const onPath = d <= 0 ? g.y : pathPoint(s, g, d / Math.abs(g.vx)).y;
    expect([elapsedMs, j, c.y]).toEqual([elapsedMs, j, expect.closeTo(onPath, 6)]);
    if (k > 0) {
      const arc = arcBetween(s, g, c.x, ahead);
      // Within 0.0005 card units: a chord across a bounce cuts its corner by up to one chord.
      expect([elapsedMs, j, arc]).toEqual([elapsedMs, j, expect.closeTo(CARD_STEP, 3)]);
    }
    ahead = c.x;
  }
};

/** Every card of `g` past the apex and before its own first contact (each one falling). */
const pathFalling = (s: StepState, g: Group): boolean =>
  cards(g).every((j) => {
    const now = card(s, g, j);
    const next = card(s, g, j, s.elapsedMs + 1);
    return now.bounces === 0 && next.bounces === 0 && next.y > now.y;
  });

describe('AD-19 step', () => {
  it('AD-19 floor contact: each card meets the floor at its own first contact, in travel order, rebounds and counts one bounce', () => {
    const s = make({ groups: [{ x: 100, y: 300, letters: 4 }] });
    const g = first(s);
    let previous = g.launchMs;
    for (const j of travel(g)) {
      // The card's first contact, by bisection on its bounce count.
      let [lo, hi] = [g.launchMs, g.launchMs + 6000];
      while (hi - lo > 1e-6)
        if (card(s, g, j, (lo + hi) / 2).bounces === 0) lo = (lo + hi) / 2;
        else hi = (lo + hi) / 2;
      const contact = hi;
      expect(contact).toBeGreaterThan(previous);
      previous = contact;
      const before = card(s, g, j, contact - 1);
      const on = card(s, g, j, contact + 1e-6);
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
    const contact = when(s, g, g.contactMs);
    expect(card(s, g, lead, when(s, g, g.contactMs / 2)).y).toBeLessThan(500 - 26.5);
    expect(card(s, g, lead, contact - 1).bounces).toBe(0);
    expect(card(s, g, lead, contact + 1).bounces).toBe(1);
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
    // Box left edge about 311.6 < 360: still inside.
    expect(first(step(s, 16)).exited).toBe(false);
    // SPEC F25: the drift stays (the leader's path time comes from its arc, which needs one).
    const past = withGroup(s, { x: 405 });
    // Box left edge 365 + 0.1 x its path time >= 360: wholly past.
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

  it('AD-19 SPEC F23: consecutive cards are CARD_STEP card units apart along the path (arc length) at launch, mid-rise, near the bounce and in the fall', () => {
    const s = make({
      groups: [
        { x: 100, y: 380, letters: 5 },
        { x: 280, y: 400, letters: 4 },
      ],
    });
    for (const g of s.groups) {
      const apexMs = -g.vy / g.gravity;
      // Leader path times; an upper bound: the card-unit arc runs at least |vx| / cardW per ms.
      const trailMs = (g.cards * CARD_STEP * g.cardW) / Math.abs(g.vx);
      for (const leaderMs of [
        0, // at launch: the row
        apexMs / 2, // mid-rise, the trail partly still on the row's line
        apexMs + trailMs, // past the apex, the whole trail on the arc
        (apexMs + g.contactMs) / 2 + trailMs, // in the fall
        g.contactMs - 5, // the leader just before the bounce, its trail falling
        g.contactMs + 5, // the bounce between the leader and its trail
        g.contactMs + 2 * trailMs, // the trail through the bounce
        g.contactMs + g.periodMs / 2, // a rebound's apex
        g.contactMs + g.periodMs + 5, // the second bounce
      ])
        expectTrail(s, g, when(s, g, leaderMs));
    }
  });

  it('AD-19 SPEC F23: before the leader has run k row steps, trailing card k slides on the row line behind the launch point', () => {
    const s = make({ groups: [{ x: 100, y: 380, letters: 5 }] });
    const g = first(s);
    const order = travel(g);
    const row = order.map((j) => card(s, g, j, 0).x);
    for (const t of [10, 40, 100, 160]) {
      const run = arcTo(s, g, leader(s, g, t).x);
      for (const [k, j] of order.entries()) {
        if (run >= k * CARD_STEP) continue;
        const c = card(s, g, j, t);
        expect([t, j, c.y]).toEqual([t, j, 380]);
        // The row's line is horizontal: a card unit of arc there is one card width.
        expect([t, j, g.side * (c.x - (row[k] as number))]).toEqual([
          t,
          j,
          expect.closeTo(run * g.cardW, 2),
        ]);
      }
    }
    // The last card leaves the row's line once the leader has run its four steps.
    let t = 0;
    while (arcTo(s, g, leader(s, g, t).x) < 4 * CARD_STEP + 0.02) t += 1;
    expect(card(s, g, order[4] as number, t).y).toBeLessThan(380);
  });

  it('AD-19 SPEC F23: letter order holds all run, each card one row step of arc behind the card ahead (both sides)', () => {
    let s = make({
      groups: [
        { x: 60, y: 420, letters: 7 },
        { x: 300, y: 420, letters: 6 },
      ],
    });
    expect(s.groups.map((g) => g.side)).toEqual([1, -1]);
    let frame = 0;
    while (!s.finished) {
      s = step(s, 16);
      frame++;
      for (const g of s.groups) {
        for (let j = 1; j < g.cards; j++) {
          const [a, b] = [card(s, g, j - 1), card(s, g, j)];
          expect(b.x).toBeGreaterThan(a.x);
          // A chord is never longer than its arc (both in card units).
          expect(units(g, b.x - a.x, b.y - a.y)).toBeLessThanOrEqual(CARD_STEP + 1e-9);
        }
        if (frame % 5 === 0 && !g.exited) expectTrail(s, g, s.elapsedMs);
      }
    }
  });

  it('AD-19 SPEC F23: the gap is in card units: the row line keeps the row step in px, a steep stretch spaces cards by card heights, the apex by card widths', () => {
    const s = make({ groups: [{ x: 100, y: 380, letters: 5 }] });
    const g = first(s);
    const order = travel(g);
    const pair = (k: number, elapsedMs: number) => {
      const [a, b] = [
        card(s, g, order[k] as number, elapsedMs),
        card(s, g, order[k - 1] as number, elapsedMs),
      ];
      return { dx: g.side * (b.x - a.x), dy: a.y - b.y };
    };
    // Horizontal: at launch, and on the row's line behind the launch point, CARD_STEP card widths.
    for (let k = 1; k < g.cards; k++)
      expect(pair(k, 0)).toEqual({ dx: CARD_STEP * g.cardW, dy: 0 });
    const early = pair(4, g.launchMs + 60);
    expect([early.dx, early.dy]).toEqual([expect.closeTo(CARD_STEP * g.cardW, 9), 0]);
    // Mid-rise, mostly vertical: more than 0.6 card heights between centres (a pixel arc of
    // 0.65 card widths gave 0.49 card heights), the chord just inside its CARD_STEP of arc.
    const apexMs = -g.vy / g.gravity;
    for (let k = 1; k < g.cards; k++) {
      const { dx, dy } = pair(k, when(s, g, apexMs / 2));
      expect([k, dy / g.cardH]).toEqual([k, expect.toSatisfy((v: number) => v > 0.6)]);
      expect(units(g, dx, dy)).toBeGreaterThan(CARD_STEP - 0.02);
      expect(units(g, dx, dy)).toBeLessThanOrEqual(CARD_STEP + 1e-9);
    }
    // The pair across the apex, when both are level: near a row step apart in x (the chord of a
    // tight apex is shorter than its CARD_STEP of arc: 0.55 card widths here).
    let [lo, hi] = [
      when(s, g, apexMs),
      when(s, g, apexMs + (CARD_STEP * g.cardW) / Math.abs(g.vx)),
    ];
    while (hi - lo > 1e-6)
      if (pair(1, (lo + hi) / 2).dy > 0) lo = (lo + hi) / 2;
      else hi = (lo + hi) / 2;
    const level = pair(1, lo);
    expect(level.dy).toBeCloseTo(0, 5);
    expect(level.dx / g.cardW).toBeGreaterThan(0.5);
    expect(level.dx / g.cardW).toBeLessThanOrEqual(CARD_STEP + 1e-9);
  });

  it('AD-19 SPEC F23 stacking: stackOrder puts the lower card (greater y) above; equal y keeps the row order (the later letter above)', () => {
    const sorted = (ys: readonly number[], from: readonly number[] = ys.map((_, j) => j)) => {
      const order = Int32Array.from(from);
      stackOrder(order, Float64Array.from(ys));
      return [...order];
    };
    expect(sorted([5, 5, 5, 5])).toEqual([0, 1, 2, 3]);
    expect(sorted([5, 5, 5, 5], [3, 1, 0, 2])).toEqual([0, 1, 2, 3]);
    expect(sorted([40, 30, 20, 10])).toEqual([3, 2, 1, 0]);
    expect(sorted([10, 30, 20, 30], [3, 2, 1, 0])).toEqual([0, 2, 1, 3]);
    expect(sorted([7])).toEqual([0]);
  });

  it('AD-19 SPEC F23 stacking: each frame the stack follows y over a whole run (both sides): rising, the trail is above its leader; falling, the leader is above its trail', () => {
    let s = make({
      groups: [
        { x: 60, y: 420, letters: 7 },
        { x: 300, y: 420, letters: 6 },
      ],
    });
    // As the controller keeps it: one order per group, re-sorted from the previous frame's.
    const orders = s.groups.map((g) => Int32Array.from(cards(g)));
    const ys = s.groups.map((g) => new Float64Array(g.cards));
    const sortedByY = (g: Group, i: number): boolean =>
      [...(orders[i] as Int32Array)].every((j, k, o) => {
        if (k === 0) return true;
        const a = o[k - 1] as number;
        const [ya, yj] = [
          (ys[i] as Float64Array)[a] as number,
          (ys[i] as Float64Array)[j] as number,
        ];
        return ya < yj || (ya === yj && a < j);
      }) && g.cards === (orders[i] as Int32Array).length;
    const phases = new Set<string>();
    while (!s.finished) {
      s = step(s, 16);
      s.groups.forEach((g, i) => {
        const y = ys[i] as Float64Array;
        for (const j of cards(g)) y[j] = card(s, g, j).y;
        stackOrder(orders[i] as Int32Array, y);
        expect([s.elapsedMs, i, sortedByY(g, i)]).toEqual([s.elapsedMs, i, true]);
        const t = s.elapsedMs > g.launchMs ? leaderPathMs(s, g, s.elapsedMs) : 0;
        const top = (orders[i] as Int32Array)[g.cards - 1] as number;
        const lead = travel(g)[0] as number;
        const tail = travel(g)[g.cards - 1] as number;
        // The whole trail rising (leader not yet at the apex, the tail off the row's line).
        if (t > 0 && t < -g.vy / g.gravity && card(s, g, tail).y < g.y) {
          expect(top).toBe(tail);
          phases.add(`${i} rise`);
        }
        // The whole trail falling to its first contact.
        if (t < g.contactMs && pathFalling(s, g)) {
          expect(top).toBe(lead);
          phases.add(`${i} fall`);
        }
      });
    }
    expect([...phases].sort()).toEqual(['0 fall', '0 rise', '1 fall', '1 rise']);
  });

  /**
   * SPEC F25: card `j`'s speed along the path in card units per ms at `ms`, by a ±0.05 ms central
   * difference; null across a floor contact or the launch point (a corner of the path).
   */
  const unitSpeed = (s: StepState, g: Group, j: number, ms: number): number | null => {
    const [a, b] = [card(s, g, j, ms - 0.05), card(s, g, j, ms + 0.05)];
    if (a.bounces !== b.bounces || (a.x - g.x) * g.side <= 0 !== (b.x - g.x) * g.side <= 0)
      return null;
    return units(g, b.x - a.x, b.y - a.y) / 0.1;
  };
  /** SPEC F25: the elapsed time of the leader's `n`th floor contact (bisection on its bounces). */
  const contactAt = (s: StepState, g: Group, n: number): number => {
    const lead = travel(g)[0] as number;
    let [lo, hi] = [g.launchMs, g.launchMs + 20000];
    for (let i = 0; i < 80; i++)
      if (card(s, g, lead, (lo + hi) / 2).bounces < n) lo = (lo + hi) / 2;
      else hi = (lo + hi) / 2;
    return hi;
  };

  it('AD-19 SPEC F25: one constant speed per word: every card moves the same card units per ms from launch to its exit, through apexes, floor contacts and the row line (both sides, real layouts)', () => {
    const band = make({
      groups: [
        { x: 100, y: 380, letters: 5 },
        { x: 280, y: 400, letters: 4 },
        { x: 20, y: 40, letters: 3 },
      ],
    });
    const real = [
      launch({ ...scene(360, 740, false, FIXTURE), capMs: 6000, baseMs: 180 }),
      launch({ ...scene(1280, 720, true, FIXTURE), capMs: 6000, baseMs: 180 }),
    ];
    for (const [i, s] of [band, ...real].entries())
      for (const [k, g] of s.groups.entries()) {
        const speed = unitSpeed(s, g, travel(g)[0] as number, g.launchMs + 0.1) as number;
        let [slow, fast] = [speed, speed];
        for (const j of cards(g))
          for (let ms = g.launchMs + 0.1; !card(s, g, j, ms).exited; ms += 23) {
            const v = unitSpeed(s, g, j, ms);
            if (v === null) continue;
            slow = Math.min(slow, v);
            fast = Math.max(fast, v);
          }
        expect([i, k, fast / slow - 1 < 2e-5]).toEqual([i, k, true]);
      }
  });

  it("AD-19 SPEC F25: one speed per word, not per lap: the last partial lap's own speed differs by over 10 %, so each run to the exit takes the path's own time (literals from the pre-F24 step) and full laps stay within 9 % of the path's", () => {
    const s = launch({ ...scene(360, 740, false, FIXTURE), capMs: 6000, baseMs: 180 });
    // Pre-F24 (`git show c448180:src/ui/celebration/step.ts`), Normal, portrait 360 x 740: each
    // group's last card wholly past its wall (ms since the start).
    const exits = [
      3810.535, 3342.054, 3392.774, 3983.139, 3763.173, 3791.917, 4404.794, 4178.887, 4177.467,
      4830.532,
    ];
    let spread = 1;
    for (const [i, g] of s.groups.entries()) {
      const exit = exits[i] as number;
      const tail = travel(g)[g.cards - 1] as number;
      expect([
        i,
        card(s, g, tail, exit - 0.01).exited,
        card(s, g, tail, exit + 0.01).exited,
      ]).toEqual([i, false, true]);
      // At the exit the leader is where the path's own timing put it.
      const out = leaderPathMs(s, g, exit);
      expect([i, out]).toEqual([i, expect.closeTo(exit - g.launchMs, 1)]);
      // Laps at the word's speed: launch to the first contact, then contact to contact (within
      // 8.1 %, measured 2026-10-24).
      const [c1, c2] = [contactAt(s, g, 1), contactAt(s, g, 2)];
      for (const share of [(c1 - g.launchMs) / g.contactMs, (c2 - c1) / g.periodMs])
        expect([i, Math.abs(share - 1) < 0.09]).toEqual([i, true]);
      // Per-lap speeds on the path's own timing (independent arcs): the first lap, the last partial
      // lap (from the last contact before the exit).
      const x = (t: number) => pathPoint(s, g, t).x;
      const last = g.contactMs + Math.floor((out - g.contactMs) / g.periodMs) * g.periodMs;
      const firstLap = arcTo(s, g, x(g.contactMs)) / g.contactMs;
      const partial = arcBetween(s, g, x(last), x(out)) / (out - last);
      spread = Math.max(spread, partial / firstLap, firstLap / partial);
    }
    // Measured 2026-10-24: 1.83 (the fourth 6-letter group's last 196 ms after a contact).
    expect(spread).toBeCloseTo(1.83, 2);
    // The run ends with the last group, as before F24 (4.83 s; 8.59 s at Slow).
    expect(run(s, 7000).elapsedMs).toBe(4832);
    const slow = launch({ ...scene(360, 740, false, FIXTURE), capMs: 10666.67, baseMs: 320 });
    expect(run(slow, 12000).elapsedMs).toBe(8592);
  });

  it("AD-19 SPEC F25: the constant speed keeps the path: every card is where the F23 path put it, read at the leader's path time (literals from the pre-F24 step)", () => {
    // Pre-F24 (`git show a1671ab:src/ui/celebration/step.ts`), elapsed = path time, Normal, band
    // 360 x 500: each card's centre at the leader's path times 0, 150, 400 and 900 ms and 5 and
    // 300 ms after its first contact.
    const pins: readonly (readonly [
      { x: number; y: number; letters: number },
      readonly (readonly (readonly [number, number])[])[],
    ])[] = [
      [
        { x: 100, y: 380, letters: 5 },
        [
          [
            [48, 380],
            [74, 380],
            [100, 380],
            [126, 380],
            [152, 380],
          ],
          [
            [99.330379843, 380],
            [125.330379843, 380],
            [151.330379843, 380],
            [156.988748017, 347.095169593],
            [162.716334622, 313.492667519],
          ],
          [
            [153.438740311, 370.162879808],
            [158.725688067, 336.433373291],
            [164.6979762, 302.906090586],
            [171.7097985, 269.736625572],
            [180.576892325, 237.369335606],
          ],
          [
            [164.813767184, 302.304019218],
            [171.849544178, 269.14354662],
            [180.764544398, 236.799946631],
            [194.641869419, 207.970547812],
            [216.298007732, 215.331005114],
          ],
          [
            [247.961817263, 340.947980269],
            [253.173520216, 374.69810205],
            [257.909351347, 408.571417621],
            [262.278859824, 442.531201916],
            [266.357211154, 470.445401176],
          ],
          [
            [268.037808039, 456.307194496],
            [272.281199931, 422.319305356],
            [276.857947571, 388.407554462],
            [281.860357613, 354.601725166],
            [287.432669244, 320.953237243],
          ],
        ],
      ],
      [
        { x: 280, y: 400, letters: 4 },
        [
          [
            [241, 400],
            [267, 400],
            [293, 400],
            [319, 400],
          ],
          [
            [228.758922916, 331.419192047],
            [235.071975737, 364.836967314],
            [240.751794975, 398.454230394],
            [265.807269559, 400],
          ],
          [
            [208.357127775, 251.840067681],
            [217.947969545, 283.844106444],
            [225.700224837, 316.722694917],
            [232.368697277, 350.018551024],
          ],
          [
            [167.553537495, 222.890152282],
            [190.498941893, 217.805724758],
            [205.908569162, 245.206353432],
            [216.086716525, 276.883132995],
          ],
          [
            [110.091964097, 470.502610308],
            [114.823468979, 442.622840389],
            [119.902892136, 408.836996988],
            [125.422603048, 375.17283874],
          ],
          [
            [86.017845832, 324.385785146],
            [92.493649705, 357.748632446],
            [98.291742458, 391.330343733],
            [103.586347158, 425.058040165],
          ],
        ],
      ],
    ];
    for (const [origin, frames] of pins) {
      const s = make({ groups: [origin] });
      const g = first(s);
      const times = [0, 150, 400, 900, g.contactMs + 5, g.contactMs + 300];
      for (const [k, t] of times.entries()) {
        const ms = t === 0 ? 0 : when(s, g, t);
        const got = cards(g).map((j) => {
          const c = card(s, g, j, ms);
          return [c.x, c.y];
        });
        expect(got).toEqual(
          (frames[k] as readonly (readonly [number, number])[]).map(([x, y]) => [
            expect.closeTo(x, 4),
            expect.closeTo(y, 4),
          ]),
        );
      }
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

  it('AD-19 a floor bounce keeps the drift: x moves vx per ms of path time across a contact, and the leader keeps its x speed through it (SPEC F25)', () => {
    const s = make({ groups: [{ x: 100, y: 300, letters: 3 }] });
    const g = first(s);
    const lead = travel(g)[0] as number;
    const before = pathPoint(s, g, g.contactMs - 20);
    const after = pathPoint(s, g, g.contactMs + 20);
    expect(after.x - before.x).toBeCloseTo(g.vx * 40, 9);
    const contact = when(s, g, g.contactMs);
    const [a, b, c] = [-20, 0, 20].map((d) => card(s, g, lead, contact + d));
    expect([a?.bounces, c?.bounces]).toEqual([0, 1]);
    expect(
      ((c?.x as number) - (b?.x as number)) / ((b?.x as number) - (a?.x as number)),
    ).toBeCloseTo(1, 9);
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

  for (const [list, rows] of [
    ['the session-won-words list', FIXTURE],
    ['12 groups up to 23 letters', LONG],
  ] as const) {
    for (const [geometry, clientWidth, innerHeight, hoverFine] of [
      ['portrait 360x740', 360, 740, false],
      ['desktop 1280x720', 1280, 720, true],
      ['landscape 839x412', 839, 412, false],
    ] as const) {
      it(`AD-19 SPEC F22, F23, F25: the card-unit trail fits at the natural tempo, pace 1, except the 23-letter row in landscape (${geometry}, Normal, ${list})`, () => {
        const s = launch({
          ...scene(clientWidth, innerHeight, hoverFine, rows),
          capMs: 6000,
          baseMs: 180,
        });
        // Measured 2026-10-24 (SPEC F25, the path's own run length, as F23): 1.00 for every group
        // but the long scene's 23-letter row in landscape, 1.093 (its steep trail is longer in card
        // units; SPEC F24's faster run needed 1.00 everywhere, the F21 time lag up to 1.11 on the
        // fixture and 2.7 on the long scene).
        const paced = list === '12 groups up to 23 letters' && geometry === 'landscape 839x412';
        for (const [i, g] of s.groups.entries())
          expect(paceOf(s, g), `group ${i}`).toBeCloseTo(
            paced && i === 0 ? 1.093 : 1,
            paced && i === 0 ? 3 : 9,
          );
      });
    }
  }

  it('AD-19 the physics scales with the speed: half the cap and base double |vx| and |vy|, quadruple gravity, halve launches and contacts, the same arc at twice the speed along it (SPEC F23, F25)', () => {
    const groups = row(4);
    const fast = make({ groups, capMs: 3000, baseMs: 90 });
    const normal = make({ groups, capMs: 6000, baseMs: 180 });
    fast.groups.forEach((g, i) => {
      const n = normal.groups[i] as Group;
      expect(g.gravity).toBeCloseTo(4 * n.gravity, 12);
      expect(Math.abs(g.vx)).toBeCloseTo(2 * Math.abs(n.vx), 12);
      expect(Math.abs(g.vy)).toBeCloseTo(2 * Math.abs(n.vy), 12);
      expect(g.launchMs).toBeCloseTo(n.launchMs / 2, 9);
      expect(g.contactMs).toBeCloseTo(n.contactMs / 2, 9);
      expect(g.periodMs).toBeCloseTo(n.periodMs / 2, 9);
      expect(g.firstArc).toEqual(n.firstArc);
      expect(g.bounceArc).toEqual(n.bounceArc);
      expect(g.speed).toBeCloseTo(2 * n.speed, 12);
    });
  });

  it('AD-19 a trail that would overrun is fitted: the group plays its arc faster, the last card out by cap − baseMs', () => {
    // A 23-letter row from the left edge launching at half the cap (the 31st entry): at its natural
    // pace its last card would leave after cap − baseMs.
    const lone = { x: 20, y: 420, letters: 23 };
    const s = make({
      groups: [...Array.from({ length: 30 }, () => ({ x: 20, y: 420, letters: 3 })), lone],
    });
    const g = s.groups[30] as Group;
    expect(g.launchMs).toBe(3000);
    const last = travel(g)[22] as number;
    expect(card(s, g, last, 6000 - 180 - 0.01).exited).toBe(false);
    expect(card(s, g, last, 6000 - 180 + 0.01).exited).toBe(true);
    // The same row alone (launch 0, the same slot) keeps its natural pace: the fitted arc is the
    // same shape (equal apex, slope vy / vx, curvature gravity / vx² and arc tables), in less time,
    // at the pace times its SPEC F25 speed (pace 1.64, measured 2026-10-24, as before F24).
    const relaxed = first(make({ groups: [lone] }));
    expect(paceOf(s, relaxed)).toBe(1);
    const pace = paceOf(s, g);
    expect(pace).toBeCloseTo(1.64, 2);
    expect(g.contactMs).toBeLessThan(relaxed.contactMs / 1.3);
    expect(g.speed).toBeCloseTo(pace * relaxed.speed, 12);
    expect((g.vy * g.vy) / (2 * g.gravity)).toBeCloseTo(
      (relaxed.vy * relaxed.vy) / (2 * relaxed.gravity),
      6,
    );
    expect(g.vy / g.vx).toBeCloseTo(relaxed.vy / relaxed.vx, 9);
    expect(g.gravity / g.vx ** 2).toBeCloseTo(relaxed.gravity / relaxed.vx ** 2, 12);
    expect(g.firstArc).toEqual(relaxed.firstArc);
    expect(g.bounceArc).toEqual(relaxed.bounceArc);
  });
});
