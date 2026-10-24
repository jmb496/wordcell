import { describe, expect, it } from 'vitest';
import { cardMetrics, cardWidth } from '../layout/geometry';
import {
  CARD_STEP,
  cardBounces,
  cardExited,
  cardShown,
  cardX,
  cardY,
  type Group,
  HOP_SHARE,
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
    shown: cardShown(s, group, j),
  };
};
/** SPEC F26: the elapsed time at which card `j` appears (the leader has run its row steps). */
const appearAt = (g: Group, j: number): number =>
  g.launchMs + ((g.side === 1 ? g.cards - 1 - j : j) * CARD_STEP) / g.speed;
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
 * `launchMs + t` before F24): drift, launch arc, elastic rebounds; the launch point at t ≤ 0.
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
 * group's path between the path points with centre x `xa` and `xb` (xb ahead, neither behind the
 * launch point, SPEC F26), the path as a polyline of 2000 chords.
 */
const arcBetween = (s: StepState, g: Group, xa: number, xb: number): number => {
  const [ta, tb] = [g.side * (xa - g.x), g.side * (xb - g.x)].map((d) => {
    expect(d).toBeGreaterThanOrEqual(0);
    return d / Math.abs(g.vx);
  }) as [number, number];
  let arc = 0;
  let prev = pathPoint(s, g, ta);
  for (let i = 1; i <= 2000; i++) {
    const p = pathPoint(s, g, ta + ((tb - ta) * i) / 2000);
    arc += units(g, p.x - prev.x, p.y - prev.y);
    prev = p;
  }
  return arc;
};
/** SPEC F23: the arc from the launch point to the path point at centre x `x`. */
const arcTo = (s: StepState, g: Group, x: number): number => arcBetween(s, g, g.x, x);
/**
 * SPEC F23, F26: at `elapsedMs`, each shown card sits on the path (on the leader's earlier point
 * with its x) CARD_STEP card units of arc behind the card ahead; a card not yet shown waits at the
 * launch point.
 */
const expectTrail = (s: StepState, g: Group, elapsedMs: number): void => {
  let ahead = Number.NaN;
  for (const [k, j] of travel(g).entries()) {
    const c = card(s, g, j, elapsedMs);
    if (!c.shown) {
      expect([elapsedMs, j, c.x, c.y]).toEqual([elapsedMs, j, g.x, g.y]);
      continue;
    }
    const d = g.side * (c.x - g.x);
    expect([elapsedMs, j, d >= 0]).toEqual([elapsedMs, j, true]);
    const onPath = pathPoint(s, g, d / Math.abs(g.vx)).y;
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

  it('AD-19 per-cell origins (SPEC F8, F26): every card of a word waits at its own origin, hidden', () => {
    const s = make({
      groups: [
        { x: 30, y: 400, letters: 3 },
        { x: 300, y: 410, letters: 4 },
      ],
    });
    expect(s.groups.map((g) => [g.x, g.y])).toEqual([
      [30, 400],
      [300, 410],
    ]);
    // At elapsed 0 only the first group's leader is shown (its launch); its group is still hidden.
    for (const g of s.groups)
      for (const j of cards(g))
        expect(card(s, g, j)).toMatchObject({
          x: g.x,
          y: g.y,
          shown: g.launchMs === 0 && j === travel(g)[0],
        });
    expect(s.groups.map((g) => g.opacity)).toEqual([0, 0]);
  });

  it('AD-19 SPEC F20, F26: card k is hidden at the launch point until the leader has run k row steps (CARD_STEP card units), then appears exactly there', () => {
    expect(CARD_STEP).toBe(0.65);
    for (const x of [100, 260]) {
      const s = make({ groups: [{ x, y: 300, letters: 4 }] });
      const g = first(s);
      const order = travel(g);
      // Before launch nothing is shown; at launch the leader alone, at the origin.
      for (const j of order) expect(card(s, g, j, g.launchMs - 1).shown).toBe(false);
      for (const [k, j] of order.entries()) {
        const turn = appearAt(g, j);
        expect([x, k, turn]).toEqual([x, k, k === 0 ? g.launchMs : expect.any(Number)]);
        const before = card(s, g, j, turn - 1e-6);
        const on = card(s, g, j, turn);
        const after = card(s, g, j, turn + 30);
        expect([x, j, before.shown, before.x, before.y]).toEqual([x, j, false, g.x, g.y]);
        expect([x, j, on.shown, on.x, on.y]).toEqual([
          x,
          j,
          true,
          expect.closeTo(g.x, 9),
          expect.closeTo(g.y, 9),
        ]);
        // Then it leaves the launch point along the path, toward the exit wall.
        expect([x, j, g.side * (after.x - g.x) > 0, after.y < g.y]).toEqual([x, j, true, true]);
        // The card ahead is one row step of arc along the path when this one appears.
        if (k > 0) {
          const ahead = card(s, g, order[k - 1] as number, turn);
          expect(arcTo(s, g, ahead.x)).toBeCloseTo(CARD_STEP, 3);
        }
      }
    }
  });

  it('AD-19 SPEC F26: no card is ever on the old row line: a card not shown waits at the launch point, a shown one is never behind it (both sides, whole runs)', () => {
    let s = make({
      groups: [
        { x: 60, y: 420, letters: 7 },
        { x: 300, y: 420, letters: 6 },
        { x: 180, y: 300, letters: 23 },
      ],
    });
    const shown = new Set<string>();
    while (!s.finished) {
      s = step(s, 16);
      s.groups.forEach((g, i) => {
        for (const j of cards(g)) {
          const c = card(s, g, j);
          if (!c.shown) {
            expect([i, j, c.x, c.y]).toEqual([i, j, g.x, g.y]);
            continue;
          }
          shown.add(`${i}:${j}`);
          expect([i, j, g.side * (c.x - g.x) >= 0]).toEqual([i, j, true]);
          // Off the launch point a card is above the origin's line until the path comes down.
          if (c.y === g.y) expect([i, j, c.x]).toEqual([i, j, expect.closeTo(g.x, 9)]);
        }
      });
    }
    expect(shown.size).toBe(7 + 6 + 23);
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
        0, // at launch: the leader alone, at the launch point (SPEC F26)
        apexMs / 2, // mid-rise, the trail partly still waiting at the launch point (SPEC F26)
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
          // SPEC F26: a card waiting at the launch point shares its x with a card appearing there.
          if (a.shown && b.shown) expect(b.x).toBeGreaterThan(a.x);
          else expect(b.x).toBeGreaterThanOrEqual(a.x);
          // A chord is never longer than its arc (both in card units).
          expect(units(g, b.x - a.x, b.y - a.y)).toBeLessThanOrEqual(CARD_STEP + 1e-9);
        }
        if (frame % 5 === 0 && !g.exited) expectTrail(s, g, s.elapsedMs);
      }
    }
  });

  it('AD-19 SPEC F23: the gap is in card units: a steep stretch spaces cards by card heights, the apex by card widths', () => {
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
    // Mid-rise, mostly vertical: more than 0.6 card heights between centres (a pixel arc of
    // 0.65 card widths gave 0.49 card heights), the chord just inside its CARD_STEP of arc.
    const apexMs = -g.vy / g.gravity;
    for (let k = 1; k < g.cards; k++) {
      const { dx, dy } = pair(k, when(s, g, apexMs / 2));
      expect([k, dy / g.cardH]).toEqual([k, expect.toSatisfy((v: number) => v > 0.6)]);
      expect(units(g, dx, dy)).toBeGreaterThan(CARD_STEP - 0.04);
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
        // The whole trail rising (leader not yet at the apex, the tail shown and off the launch
        // point).
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
   * difference; null across a floor contact (a corner of the path) or before the card is shown
   * (SPEC F26: it waits at the launch point).
   */
  const unitSpeed = (s: StepState, g: Group, j: number, ms: number): number | null => {
    const [a, b] = [card(s, g, j, ms - 0.05), card(s, g, j, ms + 0.05)];
    if (a.bounces !== b.bounces || !a.shown || !b.shown) return null;
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

  it('AD-19 SPEC F25: one constant speed per word: every card moves the same card units per ms from its turn to its exit, through apexes and floor contacts (both sides, real layouts)', () => {
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
          for (let ms = appearAt(g, j) + 0.1; !card(s, g, j, ms).exited; ms += 23) {
            const v = unitSpeed(s, g, j, ms);
            if (v === null) continue;
            slow = Math.min(slow, v);
            fast = Math.max(fast, v);
          }
        expect([i, k, fast / slow - 1 < 2e-5]).toEqual([i, k, true]);
      }
  });

  it("AD-19 SPEC F25, F27: one speed per word, not per lap: each run to the exit takes the path's own time (paced), full laps stay near the path's, and the fixture run ends at the fit (portrait)", () => {
    const s = launch({ ...scene(360, 740, false, FIXTURE), capMs: 6000, baseMs: 180 });
    let [spread, lapOff] = [1, 0];
    for (const [i, g] of s.groups.entries()) {
      // The group's exit: its last card wholly past its wall (bisection).
      const tail = travel(g)[g.cards - 1] as number;
      let [lo, hi] = [g.launchMs, s.capMs];
      for (let k = 0; k < 80; k++)
        if (card(s, g, tail, (lo + hi) / 2).exited) hi = (lo + hi) / 2;
        else lo = (lo + hi) / 2;
      const exit = hi;
      expect([i, exit <= s.capMs - s.baseMs + 1e-6]).toEqual([i, true]);
      // At the exit the leader is where the path's own (paced) timing put it.
      const out = leaderPathMs(s, g, exit);
      expect([i, out]).toEqual([i, expect.closeTo(exit - g.launchMs, 1)]);
      // Laps at the word's speed: launch to the first contact, then contact to contact.
      const [c1, c2] = [contactAt(s, g, 1), contactAt(s, g, 2)];
      for (const share of [(c1 - g.launchMs) / g.contactMs, (c2 - c1) / g.periodMs])
        lapOff = Math.max(lapOff, Math.abs(share - 1));
      // Per-lap speeds on the path's own timing (independent arcs): the first lap, the last partial
      // lap (from the last contact before the exit).
      const x = (t: number) => pathPoint(s, g, t).x;
      const last = g.contactMs + Math.floor((out - g.contactMs) / g.periodMs) * g.periodMs;
      const firstLap = arcTo(s, g, x(g.contactMs)) / g.contactMs;
      const partial = arcBetween(s, g, x(last), x(out)) / (out - last);
      spread = Math.max(spread, partial / firstLap, firstLap / partial);
    }
    // Measured 2026-10-24 (SPEC F27): the last partial lap's speed differs from the first lap's by
    // up to 1.136 x, more than F25's 10 %, so one speed per word; full laps run within 7.1 % of the
    // path's.
    expect(spread).toBeCloseTo(1.136, 3);
    expect(lapOff).toBeCloseTo(0.071, 3);
    // SPEC F27 crossings are longer: the last word, from WordCell 3 at the left edge, is fitted
    // (pace 1.44), so the run ends at cap − baseMs (step granularity 16 ms) at every speed.
    for (const [capMs, baseMs, end] of [
      [3000, 90, 2912],
      [6000, 180, 5824],
      [10666.67, 320, 10352],
    ] as const)
      expect(
        run(launch({ ...scene(360, 740, false, FIXTURE), capMs, baseMs }), 12000).elapsedMs,
      ).toBe(end);
  });

  it("AD-19 SPEC F25, F26, F27: each card's place at the leader's path times (regression literals from the F27 step, 2026-10-24; a card at its origin is not yet shown)", () => {
    // Normal, band 360 x 500: each card's centre at the leader's path times 0, 150, 400 and 900 ms
    // and 5 and 300 ms after its first contact.
    const pins: readonly (readonly [
      { x: number; y: number; letters: number },
      readonly (readonly (readonly [number, number])[])[],
    ])[] = [
      [
        { x: 100, y: 380, letters: 5 },
        [
          [
            [100, 380],
            [100, 380],
            [100, 380],
            [100, 380],
            [100, 380],
          ],
          [
            [100, 380],
            [100, 380],
            [100, 380],
            [104.590981386, 347.2157493],
            [109.900130695, 313.492667519],
          ],
          [
            [101.232170888, 370.871167011],
            [106.121011341, 337.036290403],
            [111.647765575, 303.374927273],
            [118.146686567, 270.022047208],
            [126.40034852, 237.369335606],
          ],
          [
            [111.307342375, 305.307585542],
            [117.735966831, 271.93057101],
            [125.848355156, 239.214238163],
            [138.40246639, 209.265447301],
            [159.40078417, 215.331005114],
          ],
          [
            [188.605683291, 340.635061142],
            [193.438732317, 374.484048979],
            [197.826527516, 408.439600994],
            [201.872490514, 442.469727149],
            [205.647254986, 470.445401176],
          ],
          [
            [207.160702885, 456.658953465],
            [211.085993846, 422.603990229],
            [215.32129518, 388.614397868],
            [219.953174761, 354.715934825],
            [225.11751202, 320.953237243],
          ],
        ],
      ],
      [
        { x: 280, y: 400, letters: 4 },
        [
          [
            [280, 400],
            [280, 400],
            [280, 400],
            [280, 400],
          ],
          [
            [271.589309442, 324.950701646],
            [275.67060597, 358.973004576],
            [279.306290715, 393.084224542],
            [280, 400],
          ],
          [
            [257.571491845, 242.491381743],
            [264.353782472, 275.735111151],
            [269.529277022, 309.493094904],
            [273.876090986, 343.457326048],
          ],
          [
            [229.535856652, 237.408407013],
            [245.161970532, 213.952873598],
            [257.77573243, 243.310338842],
            [264.497799508, 276.576249021],
          ],
          [
            [198.790475283, 470.180100929],
            [201.754551385, 442.59458093],
            [204.943985132, 408.404905916],
            [208.422079609, 374.264777164],
          ],
          [
            [182.249450519, 312.027272695],
            [186.549137057, 346.002091066],
            [190.336835399, 380.084173386],
            [193.760144423, 414.234043779],
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

  it('AD-19 SPEC F27: drifts toward the farther wall: left of centre goes right, right of centre goes left, the exact centre goes right', () => {
    const side = (x: number, right = 360) =>
      first(make({ groups: [{ x, y: 300, letters: 3 }], walls: { left: 0, right } })).side;
    expect([20, 100, 179.999, 180].map((x) => side(x))).toEqual([1, 1, 1, 1]);
    expect([180.001, 260, 340].map((x) => side(x))).toEqual([-1, -1, -1]);
    expect([side(640, 1280), side(640.5, 1280)]).toEqual([1, -1]);
    expect(first(make({ groups: [{ x: 100, y: 300, letters: 3 }] })).vx).toBeGreaterThan(0);
    expect(first(make({ groups: [{ x: 260, y: 300, letters: 3 }] })).vx).toBeLessThan(0);
  });

  it('AD-19 SPEC F27: a word crosses the band and exits past the far wall, every card wholly past it and never past the near one (left edge, right edge, centre)', () => {
    for (const x of [20, 340, 180]) {
      let s = make({ groups: [{ x, y: 420, letters: 5 }] });
      const g = first(s);
      const far = g.side === 1 ? s.walls.right : s.walls.left;
      const near = g.side === 1 ? s.walls.left : s.walls.right;
      while (!s.finished) {
        s = step(s, 16);
        for (const j of cards(g)) {
          const c = card(s, g, j);
          // Never wholly past the near wall: its box keeps a part inside it.
          expect([x, j, g.side * (c.x - near) + g.cardW / 2 > 0]).toEqual([x, j, true]);
        }
      }
      expect(first(s).exited).toBe(true);
      for (const j of cards(g)) {
        const c = card(s, g, j);
        expect([x, j, c.exited, g.side * (c.x - far) >= g.cardW / 2]).toEqual([x, j, true, true]);
      }
    }
  });

  it("AD-19 SPEC F27: every card makes the word's `contacts` floor contacts before it exits; the count grows with the crossing, each hop near HOP_SHARE of the band (x its slot's variety)", () => {
    for (const right of [360, 839, 1280]) {
      const walls = { left: 0, right };
      let previous = 0;
      const counts: number[] = [];
      // From the centre out to the left edge: the crossing to the right wall grows.
      for (let f = 0.5; f >= 0.02; f -= 0.04) {
        const s = make({ groups: [{ x: f * right, y: 420, letters: 4 }], walls });
        const g = first(s);
        expect(g.contacts).toBeGreaterThanOrEqual(Math.max(previous, 1));
        previous = g.contacts;
        counts.push(g.contacts);
        // The hop, the x travel per bounce, near the target (slot 0): rounding the count keeps it
        // within 0.8 to 1.3 of it (measured 0.81 to 1.30).
        const hop = Math.abs(g.vx) * g.periodMs;
        expect([right, f, hop / (HOP_SHARE * right)]).toEqual([
          right,
          f,
          expect.toSatisfy((v: number) => v > 0.8 && v < 1.31),
        ]);
        // Each card's bounces when it is first wholly past the wall (bisection on its exit).
        for (const j of cards(g)) {
          let [lo, hi] = [appearAt(g, j), s.capMs];
          for (let k = 0; k < 60; k++)
            if (card(s, g, j, (lo + hi) / 2).exited) hi = (lo + hi) / 2;
            else lo = (lo + hi) / 2;
          expect([right, f, j, card(s, g, j, hi).bounces]).toEqual([right, f, j, g.contacts]);
        }
      }
      // A word from the edge makes more contacts than one from the centre (measured 1 or 2, then 3).
      expect([right, (counts.at(-1) as number) > (counts[0] as number)]).toEqual([right, true]);
      expect(counts.at(-1)).toBe(3);
    }
    // The slot variety lengthens the hop: the third entry of a wave (slot 2) has fewer contacts
    // than the first from the same edge origin.
    const wave = make({
      groups: Array.from({ length: 3 }, () => ({ x: 20, y: 420, letters: 3 })),
    });
    expect(wave.groups.map((g) => g.contacts)).toEqual([3, 3, 2]);
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

  it('AD-19 a 23-letter word is scaled as its row would span 90 % of the band (A-D12; SPEC F26: no row is drawn)', () => {
    const s = make({ groups: [{ x: 180, y: 300, letters: 23 }] });
    const g = first(s);
    expect(rowWidth(4, 40)).toBeCloseTo(40 + 3 * 26, 10);
    expect(g.scale).toBeCloseTo(324 / 612, 10);
    expect(g.cardW).toBeCloseTo(40 * g.scale, 10);
    expect(g.cardH).toBeCloseTo(53 * g.scale, 10);
    expect(rowWidth(23, 40) * g.scale).toBeCloseTo(0.9 * 360, 9);
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
  // session-won-long-words' word list (story Notes, device-read fixture): card counts and WordCells,
  // the rows serialize.test.ts pins in its won-long-words property.
  const LONG_WORDS = [
    [22, 10],
    [10, 10],
    [9, 9],
    [8, 6],
    [8, 8],
    [8, 8],
    [8, 7],
    [8, 5],
    [8, 4],
    [8, 3],
    [7, 7],
    [7, 4],
    [7, 6],
    [7, 3],
    [7, 5],
    [6, 6],
    [6, 4],
    [5, 3],
    [5, 5],
    [4, 4],
    [3, 3],
  ] as const;
  for (const [list, rows] of [
    ['12 groups up to 23 letters', LONG],
    ['the session-won-words list', FIXTURE],
    ['the session-won-long-words list', LONG_WORDS],
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

  // SPEC F22, F27: each group's pace at Normal, measured 2026-10-24 (1 = the natural tempo).
  const PACES: Record<string, readonly number[]> = {
    'the session-won-words list portrait 360x740': [1.143, 1, 1, 1, 1, 1, 1, 1, 1.013, 1.436],
    'the session-won-words list desktop 1280x720': [1, 1, 1, 1, 1, 1, 1, 1, 1, 1.023],
    'the session-won-words list landscape 839x412': [1, 1, 1, 1, 1, 1, 1, 1, 1, 1.028],
    '12 groups up to 23 letters portrait 360x740': [
      1.192, 1, 1, 1.246, 1, 1, 1, 1.011, 1.028, 1.053, 1.067, 1.109,
    ],
    '12 groups up to 23 letters desktop 1280x720': [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    '12 groups up to 23 letters landscape 839x412': [
      1.156, 1, 1, 1, 1, 1, 1, 1, 1.017, 1.043, 1.04, 1,
    ],
    // Epic 10 entry 9, measured 2026-10-24: the device-read list; later words launch nearer the cap
    // and words from an edge WordCell cross the whole band, so they play under the pace fit.
    'the session-won-long-words list portrait 360x740': [
      1.19, 1.173, 1, 1, 1, 1, 1, 1.02, 1.052, 1.466, 1, 1.152, 1.198, 1.678, 1.293, 1.332, 1.387,
      1.427, 1.501, 1.548, 1.594,
    ],
    'the session-won-long-words list desktop 1280x720': [
      1, 1, 1, 1, 1, 1, 1, 1, 1, 1.066, 1, 1, 1, 1.216, 1, 1, 1, 1, 1.47, 1, 1,
    ],
    'the session-won-long-words list landscape 839x412': [
      1.139, 1, 1, 1, 1, 1, 1.011, 1, 1, 1.097, 1, 1, 1.214, 1.244, 1, 1.341, 1.387, 1.412, 1.495,
      1.523, 1.549,
    ],
  };
  for (const [list, rows] of [
    ['the session-won-words list', FIXTURE],
    ['12 groups up to 23 letters', LONG],
    ['the session-won-long-words list', LONG_WORDS],
  ] as const) {
    for (const [geometry, clientWidth, innerHeight, hoverFine] of [
      ['portrait 360x740', 360, 740, false],
      ['desktop 1280x720', 1280, 720, true],
      ['landscape 839x412', 839, 412, false],
    ] as const) {
      it(`AD-19 SPEC F22, F27: the card-unit trail fits each word on the real layouts, at the natural tempo or a measured pace (${geometry}, Normal, ${list})`, () => {
        const s = launch({
          ...scene(clientWidth, innerHeight, hoverFine, rows),
          capMs: 6000,
          baseMs: 180,
        });
        // Measured 2026-10-24 (SPEC F27: words cross to the farther wall, so late words from an
        // edge WordCell and long words need a pace; under F23/F25 only the long scene's 23-letter
        // landscape row had one, 1.093).
        const paces = PACES[`${list} ${geometry}`] as readonly number[];
        expect(s.groups.map((g) => paceOf(s, g))).toEqual(paces.map((p) => expect.closeTo(p, 3)));
      });
    }
  }

  it("AD-19 the session-won-long-words list's smallest copy scale at portrait 360x740 is 0.553 (A-D12; the device read judges it)", () => {
    const s = launch({ ...scene(360, 740, false, LONG_WORDS), capMs: 6000, baseMs: 180 });
    expect(Math.min(...s.groups.map((g) => g.scale))).toBeCloseTo(0.553, 3);
  });

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
    // A 23-letter row launching at half the cap (the 31st entry): at its natural pace its last card
    // would leave after cap − baseMs.
    const lone = { x: 100, y: 420, letters: 23 };
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
    // at the pace times its SPEC F25 speed (pace 1.91, measured 2026-10-24 under SPEC F27).
    const relaxed = first(make({ groups: [lone] }));
    expect(paceOf(s, relaxed)).toBe(1);
    const pace = paceOf(s, g);
    expect(pace).toBeCloseTo(1.91, 2);
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
