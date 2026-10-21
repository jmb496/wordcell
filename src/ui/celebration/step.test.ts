import { describe, expect, it } from 'vitest';
import { type Group, type LaunchInput, launch, rowScale, type StepState, step } from './step';

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

describe('AD-19 step', () => {
  it('AD-19 floor contact clamps y to the floor, reverses vy and counts one bounce', () => {
    let s = withGroup(make(), { launchMs: 0, y: 470, vy: 0.5, vx: 0 });
    s = step(s, 50);
    const g = first(s);
    expect(g.y + g.h / 2).toBe(500);
    expect(g.vy).toBeLessThan(0);
    expect(g.bounces).toBe(1);
    expect(s.finished).toBe(false);
  });

  it('AD-19 a group starting in contact with the floor bounces once', () => {
    const s = withGroup(make(), { launchMs: 0, y: 500 - 26.5, vy: 0.2 });
    expect(first(step(s, 16)).bounces).toBe(1);
  });

  it('AD-19 y never ends below the floor over a whole run', () => {
    let s = make();
    while (!s.finished) {
      s = step(s, 16);
      const g = first(s);
      expect(g.y + g.h / 2).toBeLessThanOrEqual(500);
    }
  });

  it('AD-19 ceiling contact clamps to the ceiling and reverses vy; no bounce is counted', () => {
    let s = withGroup(make(), { launchMs: 0, y: 30, vy: -0.5, vx: 0 });
    s = step(s, 50);
    const g = first(s);
    expect(g.y - g.h / 2).toBe(0);
    expect(g.vy).toBeGreaterThan(0);
    expect(g.bounces).toBe(0);
  });

  it('AD-19 exited needs the whole box beyond its wall, then the group is hidden and no longer written', () => {
    let s = withGroup(make(), { launchMs: 0, x: 350, vx: 0.1, vy: 0, y: 250 });
    s = withGroup(s, { side: 1, w: 80 });
    // Box left edge 310 < 360: still inside.
    expect(first(step(s, 16)).exited).toBe(false);
    const past = withGroup(s, { x: 405, vx: 0 });
    // Box left edge 365 >= 360: wholly past.
    const gone = step(past, 16);
    expect(first(gone).exited).toBe(true);
    expect(first(gone).opacity).toBe(0);
    expect(step(gone, 16).groups[0]).toBe(first(gone));
    expect(gone.finished).toBe(true);
  });

  it('AD-19 a wide row exits only when wholly past a wall (left)', () => {
    const s = withGroup(make(), { launchMs: 0, side: -1, vx: -0.1, w: 200, x: 90, y: 250, vy: 0 });
    // Right edge at 190 - 1.6: far from the wall; centre already left of centre is not enough.
    expect(first(step(s, 16)).exited).toBe(false);
    const edge = withGroup(s, { x: -99, vx: 0 });
    expect(first(step(edge, 16)).exited).toBe(false);
    const past = withGroup(s, { x: -101, vx: 0 });
    expect(first(step(past, 16)).exited).toBe(true);
  });

  it('AD-19 the run is deterministic: equal inputs give equal states', () => {
    const input = {
      groups: [3, 5, 4, 7].map((letters, i) => ({ x: 60 + i * 80, y: 380, letters })),
    };
    const a = run(make(input), 3000);
    const b = run(make(input), 3000);
    expect(a).toEqual(b);
  });

  it('AD-19 dt is clamped to 50 ms (500 equals 50)', () => {
    const s = withGroup(make(), { launchMs: 0 });
    expect(step(s, 500)).toEqual(step(s, 50));
    expect(step(s, 500).elapsedMs).toBe(50);
    expect(step(s, -20).elapsedMs).toBe(0);
  });

  it('AD-19 per-cell origins: each group starts at its own origin, hidden', () => {
    const s = make({
      groups: [
        { x: 30, y: 400, letters: 3 },
        { x: 300, y: 410, letters: 4 },
      ],
    });
    expect(s.groups.map((g) => [g.x, g.y, g.opacity])).toEqual([
      [30, 400, 0],
      [300, 410, 0],
    ]);
  });

  it('AD-19 drifts toward the side with more room: left of centre goes left, right goes right, centre goes right', () => {
    const side = (x: number) => first(make({ groups: [{ x, y: 300, letters: 3 }] })).side;
    expect(side(100)).toBe(-1);
    expect(side(260)).toBe(1);
    expect(side(180)).toBe(1);
    const g = first(make({ groups: [{ x: 100, y: 300, letters: 3 }] }));
    expect(g.vx).toBeLessThan(0);
  });

  it('AD-19 a pre-launch group is hidden, then shown after its stagger offset', () => {
    const s = make({
      groups: Array.from({ length: 4 }, (_, i) => ({ x: 100 + i * 30, y: 380, letters: 3 })),
    });
    const late = s.groups[3] as Group;
    expect(late.launchMs).toBeGreaterThan(0);
    let t = s;
    while (t.elapsedMs + 16 < late.launchMs) t = step(t, 16);
    expect((t.groups[3] as Group).opacity).toBe(0);
    expect((t.groups[3] as Group).y).toBe(380);
    expect((t.groups[0] as Group).opacity).toBe(1);
    while (t.elapsedMs <= late.launchMs) t = step(t, 16);
    expect((t.groups[3] as Group).opacity).toBe(1);
    expect((t.groups[3] as Group).y).not.toBe(380);
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
    ['Normal', 6000, 180],
    ['Slow', 10666.67, 320],
  ] as const) {
    it(`AD-19 a large list is done by the cap at ${name}, every group launched, then exited or faded`, () => {
      const groups = Array.from({ length: 40 }, (_, i) => ({
        x: 40 + (i % 8) * 40,
        y: 420,
        letters: 3 + (i % 8),
      }));
      const s0 = make({ groups, capMs, baseMs });
      expect(Math.max(...s0.groups.map((g) => g.launchMs))).toBeLessThanOrEqual(capMs / 2);
      const s = run(s0, capMs + 100);
      expect(s.finished).toBe(true);
      expect(s.elapsedMs).toBeLessThanOrEqual(capMs + 16);
      for (const g of s.groups) expect(g.exited || g.opacity === 0).toBe(true);
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
    expect(rowScale(23, 40, 360)).toBeCloseTo(0.675, 10);
    expect(rowScale(23, 150, 360)).toBe(0.4);
    expect(rowScale(1, 40, 3600)).toBe(1);
  });

  it('AD-19 a 23-letter row is scaled in its group box', () => {
    const g = first(make({ groups: [{ x: 180, y: 300, letters: 23 }] }));
    expect(g.scale).toBeCloseTo(0.675, 10);
    expect(g.w).toBeCloseTo(0.9 * 360, 10);
    expect(g.h).toBeCloseTo(53 * 0.675, 10);
  });
});
