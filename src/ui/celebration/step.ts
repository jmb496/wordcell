// AD-19 (R-87): the win celebration's pure physics. `step(state, dtMs)` advances groups of card
// faces (one per word-list entry) over plain data: no DOM, no clock, no `Math.random`. Launch time
// derives from the entry index; side and horizontal speed derive from the entry index, the launch
// origin and the band size (each card reaches its exit wall after EXIT_AFTER_CONTACTS first-contact
// times, so it bounces before it leaves; AD-19 Rule bullet 1 and SPEC CAP-2/F3 still say "entry
// index", see the 10.3 plan's Plan Change Log). The constants are tuned at epic 10's checkpoint
// (ticket 10.6 device reads: SPEC F20, F21, F23, F24); timing is a fraction of the cap so the run
// scales with the speed pref.
// SPEC F21, F23 (follow the leader): every card of a group runs the group's one path, an arc
// that falls and rebounds off the floor with a constant horizontal drift, one row step
// (CARD_STEP) behind the card ahead measured along the path (arc length), so the word reads as its
// row bent onto the arc. The arc is measured in card units (x over the scaled card width, y over
// the scaled card height): a horizontal stretch keeps the row's 0.65-width spacing, a vertical one
// gets 0.65 card heights, so a card never hides the letter of the card above it.
// The path and its arc length are closed-form; `launch` samples the arc length of the first fall
// and of one bounce once (`ARC_SAMPLES`), and a trailing card's path time is found by a binary
// search of those samples plus Newton steps, so a frame allocates nothing. Behind the launch
// point the path continues as the row's line: until the leader has travelled `k` steps, trailing
// card `k` slides along that line, so at launch the cards sit as the row.
// SPEC F24 (even speed): the leader runs the path on its own clock, not the path's time: its
// speed along the path (px/ms) is the path's speed v blended toward the peak P (a floor
// contact), P x v / (physical x P + (1 - physical) x v), so its apex runs at MIN_SPEED_SHARE of P
// and its floor contacts at P; the path, the trail and the stacking are unchanged. The clock is
// closed-form too, sampled and inverted like the arc.
// Coordinates are band-relative px (the band is the area between the top bar and the action bar),
// y grows downward, velocities are px per ms; a card's position is the centre of its box.

/** AD-19: one `step` never advances more than this. */
export const DT_MAX_MS = 50;
/** SPEC F20: consecutive cards sit this share of a card width apart (35 % overlap, each shows 65 %). */
export const CARD_STEP = 0.65;
/** DESIGN.md Win celebration: a row wider than this share of the band scales down. */
const FIT_SHARE = 0.9;
/** A-D12: the smallest scale of a row. */
const MIN_SCALE = 0.4;
/** Groups per wave; later waves launch later, in list order. */
const WAVE_SIZE = 3;
/** Cap fraction between two waves, shrunk so the last launch is within LAUNCH_SPAN_FRAC. */
const WAVE_GAP_FRAC = 0.08;
const LAUNCH_SPAN_FRAC = 0.5;
/** Cap fraction of a full-band fall, for gravity. */
const FALL_FRAC = 0.2;
/** Share of the room above the origin the launch rises through. */
export const RISE_SHARE = 0.5;
/**
 * EXPERIENCE.md Win celebration (bounce, then leave past a side edge): a card reaches its exit
 * wall this many times its first floor contact after its start, divided by its slot's speed
 * variety, so even the fastest slot (1 + 2 x SPEED_STEP) exits after 2 / 1.3 ≈ 1.5 first-contact
 * times.
 */
const EXIT_AFTER_CONTACTS = 2;
/** Per wave-slot speed variety. */
const SPEED_STEP = 0.15;
/** SPEC F23, F24: arc-length and clock samples per path segment (the first fall, one bounce). */
const ARC_SAMPLES = 64;
/**
 * SPEC F24: the leader's slowest speed along the path (an apex) as a share of its fastest (a floor
 * contact); a path already that even keeps its own timing.
 */
export const MIN_SPEED_SHARE = 0.67;
/** SPEC F23, F24: Newton steps after a sample lookup (the second takes the error under 1e-6 ms). */
const NEWTON_STEPS = 2;

/** SPEC F23: what the card-unit arc length depends on. */
type Metric = {
  /** The constant drift and the group's gravity (px/ms, px/ms²). */
  readonly vx: number;
  readonly gravity: number;
  /** One card's box: the card width and height, both times `scale`. */
  readonly cardW: number;
  readonly cardH: number;
};

/**
 * SPEC F24: the leader's clock. Its run along the path in px, `clockAt`, grows at
 * physical x peak + (1 - physical) x |(drift, u)| per ms of path time; the leader's elapsed time
 * is that run over `peak`.
 */
type Clock = {
  /** The drift |vx| and the leader's fastest speed along the path, at a floor contact (px/ms). */
  readonly drift: number;
  readonly peak: number;
  /** The share of the path's own timing kept: 1 keeps it, 0 is an even speed. */
  readonly physical: number;
};

/** A group's path after launch, without its sample tables. */
type Flight = Metric & {
  /** The launch's vertical speed (px/ms). */
  readonly vy: number;
  /** The first floor contact, the rebound speed and the bounce period. */
  readonly contactMs: number;
  readonly reboundVy: number;
  readonly periodMs: number;
  readonly clock: Clock;
};

/**
 * SPEC F23, F24: a group's path after launch. The arc-length tables hold the cumulative length
 * (card units), the clock tables the leader's cumulative clock run (px), at ARC_SAMPLES + 1 even
 * times over the first segment (to `contactMs`) and over one bounce (`periodMs`); a pace fit
 * leaves them unchanged (the same arc in less time).
 */
type Path = Flight & {
  readonly firstArc: Float64Array;
  readonly bounceArc: Float64Array;
  readonly firstClock: Float64Array;
  readonly bounceClock: Float64Array;
};

/** SPEC F23, F24: a measure along the path as a function of the vertical speed `u`. */
type Measure = (flight: Flight, u: number) => number;

export type Group = Path & {
  /** Cards in the row, in letter order. */
  readonly cards: number;
  readonly scale: number;
  /** The leading card's centre at launch (the row's end toward `side`). */
  readonly x: number;
  readonly y: number;
  /** The wall the group drifts toward: -1 left, 1 right. */
  readonly side: -1 | 1;
  readonly launchMs: number;
  /** Its last card is wholly past the exit wall. */
  readonly exited: boolean;
  /** 0 before launch and once exited; fades over the last `baseMs` of the cap. */
  readonly opacity: number;
};

export type StepState = {
  readonly groups: readonly Group[];
  readonly floor: number;
  readonly ceiling: number;
  readonly walls: { readonly left: number; readonly right: number };
  readonly capMs: number;
  readonly baseMs: number;
  readonly elapsedMs: number;
  readonly finished: boolean;
};

export type LaunchInput = {
  /** Per group: the launch origin (band-relative) and the letter count of its row. */
  readonly groups: readonly { readonly x: number; readonly y: number; readonly letters: number }[];
  readonly cardW: number;
  readonly cardH: number;
  readonly floor: number;
  readonly ceiling: number;
  readonly walls: { readonly left: number; readonly right: number };
  readonly capMs: number;
  readonly baseMs: number;
};

/** The unscaled width of an `n`-letter row at card width `cardW`. */
export function rowWidth(n: number, cardW: number): number {
  return cardW * (1 + CARD_STEP * (n - 1));
}

/** A-D12, DESIGN.md Win celebration: the uniform scale of an `n`-letter row, never enlarging. */
export function rowScale(n: number, cardW: number, bandW: number): number {
  const raw = (FIT_SHARE * bandW) / rowWidth(n, cardW);
  return Math.min(1, Math.max(MIN_SCALE, raw));
}

/**
 * SPEC F23: the card-unit drift, |vx| x cardH / cardW: the drift in px/ms of a card height, so the
 * card-unit speed |(vx / cardW, u / cardH)| is |(drift, u)| / cardH.
 */
function drift(m: Metric): number {
  return (Math.abs(m.vx) * m.cardH) / m.cardW;
}

/**
 * SPEC F23: the arc length in card units from vertical speed 0 to `u`, the antiderivative of the
 * card-unit speed |(drift, u)| / cardH over time (u = v0 + gravity t); odd in `u`. A pace fit (vx
 * and u x pace, gravity x pace²) leaves it unchanged.
 */
function arcAt(m: Metric, u: number): number {
  const d = drift(m);
  return (u * Math.hypot(d, u) + d * d * Math.asinh(u / d)) / (2 * m.gravity * m.cardH);
}

/** SPEC F23: the card-unit arc's growth per ms of path time at vertical speed `u`. */
function arcRate(m: Metric, u: number): number {
  return Math.hypot(drift(m), u) / m.cardH;
}

/**
 * SPEC F24: the leader's clock run (px) from vertical speed 0 to `u`, the antiderivative over path
 * time of physical x peak + (1 - physical) x |(drift, u)|; a pace fit (drift, peak and u x pace,
 * gravity x pace²) leaves it unchanged.
 */
function clockAt(f: Flight, u: number): number {
  const { drift: d, peak, physical } = f.clock;
  const even = (u * Math.hypot(d, u) + d * d * Math.asinh(u / d)) / 2;
  return (physical * peak * u + (1 - physical) * even) / f.gravity;
}

/** SPEC F24: the clock run's growth per ms of path time at vertical speed `u`. */
function clockRate(f: Flight, u: number): number {
  const { drift: d, peak, physical } = f.clock;
  return physical * peak + (1 - physical) * Math.hypot(d, u);
}

/** SPEC F23, F24: a segment's cumulative `at` at ARC_SAMPLES + 1 even times over `durMs`. */
function table(f: Flight, at: Measure, v0: number, durMs: number): Float64Array {
  const samples = new Float64Array(ARC_SAMPLES + 1);
  const start = at(f, v0);
  for (let i = 1; i <= ARC_SAMPLES; i++)
    samples[i] = at(f, v0 + (f.gravity * durMs * i) / ARC_SAMPLES) - start;
  return samples;
}

/**
 * SPEC F23, F24: the time into a segment at which its `at` has grown by `value` (binary search of
 * its samples, NEWTON_STEPS Newton steps on `rate`).
 */
function segmentMs(
  f: Flight,
  at: Measure,
  rate: Measure,
  samples: Float64Array,
  durMs: number,
  v0: number,
  value: number,
): number {
  let lo = 0;
  let hi = ARC_SAMPLES;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if ((samples[mid] as number) <= value) lo = mid;
    else hi = mid;
  }
  const a = samples[lo] as number;
  const b = samples[hi] as number;
  const dt = durMs / ARC_SAMPLES;
  const start = at(f, v0);
  let t = (lo + (b > a ? (value - a) / (b - a) : 0)) * dt;
  for (let i = 0; i < NEWTON_STEPS; i++) {
    const u = v0 + f.gravity * t;
    t = Math.min(hi * dt, Math.max(lo * dt, t - (at(f, u) - start - value) / rate(f, u)));
  }
  return t;
}

/** SPEC F23, F24: `at`'s growth along `f` from its start to path time `t` ≥ 0. */
function along(
  f: Flight,
  at: Measure,
  first: Float64Array,
  bounce: Float64Array,
  t: number,
): number {
  const { vy, gravity: g } = f;
  if (t <= f.contactMs) return at(f, vy + g * t) - at(f, vy);
  const s = t - f.contactMs;
  const laps = Math.floor(s / f.periodMs);
  const r = s - laps * f.periodMs;
  return (
    (first[ARC_SAMPLES] as number) +
    laps * (bounce[ARC_SAMPLES] as number) +
    at(f, g * r - f.reboundVy) -
    at(f, -f.reboundVy)
  );
}

/** SPEC F23, F24: the path time at which `at` has grown by `value` ≥ 0 (`along`'s inverse). */
function invert(
  f: Flight,
  at: Measure,
  rate: Measure,
  first: Float64Array,
  bounce: Float64Array,
  value: number,
): number {
  const once = first[ARC_SAMPLES] as number;
  if (value <= once) return segmentMs(f, at, rate, first, f.contactMs, f.vy, value);
  const lap = bounce[ARC_SAMPLES] as number;
  const laps = Math.floor((value - once) / lap);
  const rest = value - once - laps * lap;
  return (
    f.contactMs + laps * f.periodMs + segmentMs(f, at, rate, bounce, f.periodMs, -f.reboundVy, rest)
  );
}

/** SPEC F23: the arc length (card units) along `path` from its start to path time `t` ≥ 0. */
function pathArc(path: Path, t: number): number {
  return along(path, arcAt, path.firstArc, path.bounceArc, t);
}

/** SPEC F23: the path time at which `path` has run `arc` ≥ 0 card units (`pathArc`'s inverse). */
function pathTime(path: Path, arc: number): number {
  return invert(path, arcAt, arcRate, path.firstArc, path.bounceArc, arc);
}

/** SPEC F24: the leader's elapsed time (ms since launch) at path time `t` ≥ 0. */
function leaderElapsed(path: Path, t: number): number {
  return along(path, clockAt, path.firstClock, path.bounceClock, t) / path.clock.peak;
}

/** SPEC F24: the leader's path time `ms` ≥ 0 after launch (`leaderElapsed`'s inverse). */
function leaderPathMs(path: Path, ms: number): number {
  const run = ms * path.clock.peak;
  return invert(path, clockAt, clockRate, path.firstClock, path.bounceClock, run);
}

/**
 * The initial state: every group waiting as its row centred on its origin, hidden, launching by
 * entry index. The drift is fitted so the group's last card is past its wall by `capMs - baseMs`
 * (before the closing fade): a group whose trail would overrun plays its whole path faster
 * (`pace`: drift and launch speed x pace, gravity x pace²), the same arc in less time. SPEC F23:
 * the trail is `trail` card units of arc behind the leader, so the leader must run the arc to the last
 * card's exit point plus `trail` (SPEC F22's fit on that arc, in card units), timed by the leader's
 * SPEC F24 clock.
 */
export function launch(input: LaunchInput): StepState {
  const { walls, floor, ceiling, capMs, baseMs } = input;
  const bandW = walls.right - walls.left;
  const bandH = floor - ceiling;
  const count = input.groups.length;
  const lastWave = Math.floor((Math.max(count, 1) - 1) / WAVE_SIZE);
  const lastSlot = (Math.max(count, 1) - 1) % WAVE_SIZE;
  const waveGap = Math.min(
    WAVE_GAP_FRAC * capMs,
    (LAUNCH_SPAN_FRAC * capMs) / Math.max(lastWave + lastSlot / WAVE_SIZE, 1),
  );
  const fallMs = FALL_FRAC * capMs;
  const gravity = (2 * bandH) / (fallMs * fallMs);
  const groups = input.groups.map((entry, i): Group => {
    const n = entry.letters;
    const scale = rowScale(n, input.cardW, bandW);
    const w = input.cardW * scale;
    const h = input.cardH * scale;
    const rowW = rowWidth(n, input.cardW) * scale;
    // EXPERIENCE.md Win celebration: toward the side with more room, right on a tie.
    const side: -1 | 1 = entry.x - walls.left > walls.right - entry.x ? -1 : 1;
    const slot = i % WAVE_SIZE;
    const launchMs = Math.floor(i / WAVE_SIZE) * waveGap + (slot * waveGap) / WAVE_SIZE;
    const rise = RISE_SHARE * Math.max(0, entry.y - h / 2 - ceiling);
    const vy = -Math.sqrt(2 * gravity * rise);
    // First floor contact: y + vy t + gravity t² / 2 reaches the floor (box bottom); the rebound is
    // elastic, so every later bounce peaks at the launch's apex, below the ceiling.
    const drop = Math.max(0, floor - h / 2 - entry.y);
    const rebound = Math.sqrt(vy * vy + 2 * gravity * drop);
    const contactMs = (-vy + rebound) / gravity;
    // The leading card travels `lead` in x to be wholly past its wall; the last card, `trail` card
    // units of arc behind it, reaches that point later. A row wider than the band (A-D12 floor) can start
    // its leader at or past the wall: its drift then takes at least a card width per
    // EXIT_AFTER_CONTACTS first-contact times.
    const x = entry.x + (side * (rowW - w)) / 2;
    const lead = side === 1 ? walls.right + w / 2 - x : x + w / 2 - walls.left;
    const trail = (n - 1) * CARD_STEP;
    const natural =
      (Math.max(lead, w) / (EXIT_AFTER_CONTACTS * contactMs)) * (1 + SPEED_STEP * slot);
    const periodMs = (2 * rebound) / gravity;
    // SPEC F24: the path is slowest at an apex (the drift alone) and fastest at a floor contact;
    // `physical` blends its timing toward an even speed just enough that the apex runs at
    // MIN_SPEED_SHARE of the peak (`slow` x (1 / share - 1) / (1 - `slow`) solves
    // P x slow / (physical + (1 - physical) x slow) = share x P).
    const peak = Math.hypot(natural, rebound);
    const slow = natural / peak;
    const physical = Math.min(1, (slow * (1 / MIN_SPEED_SHARE - 1)) / (1 - slow));
    const flight: Flight = {
      vx: side * natural,
      gravity,
      cardW: w,
      cardH: h,
      vy,
      contactMs,
      reboundVy: rebound,
      periodMs,
      clock: { drift: natural, peak, physical },
    };
    const unpaced: Path = {
      ...flight,
      firstArc: table(flight, arcAt, vy, contactMs),
      bounceArc: table(flight, arcAt, -rebound, periodMs),
      firstClock: table(flight, clockAt, vy, contactMs),
      bounceClock: table(flight, clockAt, -rebound, periodMs),
    };
    const outPathMs = pathTime(unpaced, pathArc(unpaced, Math.max(lead, 0) / natural) + trail);
    const outMs = leaderElapsed(unpaced, outPathMs);
    const pace = Math.max(1, outMs / (capMs - baseMs - launchMs));
    return {
      cards: n,
      cardW: w,
      cardH: h,
      scale,
      x,
      y: entry.y,
      vx: side * natural * pace,
      vy: vy * pace,
      gravity: gravity * pace * pace,
      side,
      launchMs,
      contactMs: contactMs / pace,
      reboundVy: rebound * pace,
      periodMs: periodMs / pace,
      clock: { drift: natural * pace, peak: peak * pace, physical },
      firstArc: unpaced.firstArc,
      bounceArc: unpaced.bounceArc,
      firstClock: unpaced.firstClock,
      bounceClock: unpaced.bounceClock,
      exited: false,
      opacity: 0,
    };
  });
  return { groups, floor, ceiling, walls, capMs, baseMs, elapsedMs: 0, finished: count === 0 };
}

/**
 * SPEC F21, F23, F24: card `j`'s (letter order) time on the path, `behind` row steps (CARD_STEP
 * card units) of arc behind the leader, which runs the path on its clock. On the row's line behind
 * the launch point it is negative, that arc read at the drift speed (so `x + vx t` places it on
 * the line); the row stands still before launch.
 */
function pathMs(group: Group, j: number, elapsedMs: number): number {
  const behind = group.side === 1 ? group.cards - 1 - j : j;
  const leaderMs = leaderPathMs(group, Math.max(elapsedMs, group.launchMs) - group.launchMs);
  if (behind === 0) return leaderMs;
  const arc = pathArc(group, leaderMs) - behind * CARD_STEP;
  return arc <= 0 ? (arc * group.cardW) / Math.abs(group.vx) : pathTime(group, arc);
}

/** AD-19: card `j`'s (letter order) centre x in `state`. */
export function cardX(state: StepState, group: Group, j: number): number {
  return group.x + group.vx * pathMs(group, j, state.elapsedMs);
}

/** AD-19: card `j`'s (letter order) centre y in `state`; the box bottom never passes the floor. */
export function cardY(state: StepState, group: Group, j: number): number {
  const t = pathMs(group, j, state.elapsedMs);
  const lowest = state.floor - group.cardH / 2;
  if (t <= 0) return group.y;
  if (t < group.contactMs)
    return Math.min(lowest, group.y + group.vy * t + (group.gravity * t * t) / 2);
  const s = (t - group.contactMs) % group.periodMs;
  return Math.min(lowest, lowest - group.reboundVy * s + (group.gravity * s * s) / 2);
}

/** AD-19: card `j`'s floor contacts so far in `state`. */
export function cardBounces(state: StepState, group: Group, j: number): number {
  const t = pathMs(group, j, state.elapsedMs);
  return t < group.contactMs ? 0 : 1 + Math.floor((t - group.contactMs) / group.periodMs);
}

/** AD-19: card `j`'s whole box is beyond the group's exit wall in `state`. */
export function cardExited(state: StepState, group: Group, j: number): boolean {
  const x = cardX(state, group, j);
  return group.side === 1
    ? x - group.cardW / 2 >= state.walls.right
    : x + group.cardW / 2 <= state.walls.left;
}

/**
 * Ticket 10.6 (SPEC F23 stacking): re-sorts `order` (a group's card indices, bottom of the stack
 * first) in place by `ys` (each card's centre y): the card lower on screen is drawn above, so a
 * card only ever covers the bottom of the card above it, never its letter or badge; equal y keeps
 * the row's stacking (the later letter above, DOM order). An insertion sort that starts from the
 * previous frame's order: O(cards) while nothing swaps, and it allocates nothing.
 */
export function stackOrder(order: Int32Array, ys: Float64Array): void {
  for (let i = 1; i < order.length; i++) {
    const j = order[i] as number;
    const y = ys[j] as number;
    let k = i - 1;
    for (; k >= 0; k--) {
      const a = order[k] as number;
      const ya = ys[a] as number;
      if (ya < y || (ya === y && a < j)) break;
      order[k + 1] = a;
    }
    order[k + 1] = j;
  }
}

function advance(group: Group, state: StepState): Group {
  if (group.exited || state.elapsedMs < group.launchMs) return group;
  // The last card is the one furthest from the exit wall.
  const exited = cardExited(state, group, group.side === 1 ? 0 : group.cards - 1);
  const fade = Math.min(1, Math.max(0, (state.capMs - state.elapsedMs) / state.baseMs));
  const opacity = exited ? 0 : fade;
  if (exited === group.exited && opacity === group.opacity) return group;
  return { ...group, exited, opacity };
}

/** AD-19: advances `state` by `dtMs`, clamped to [0, 50] ms; returns a new state. */
export function step(state: StepState, dtMs: number): StepState {
  const dt = Math.min(Math.max(dtMs, 0), DT_MAX_MS);
  const next = { ...state, elapsedMs: state.elapsedMs + dt };
  const groups = state.groups.map((group) => advance(group, next));
  const finished = groups.every((group) => group.exited) || next.elapsedMs >= state.capMs;
  return { ...next, groups, finished };
}
