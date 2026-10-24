// AD-19 (R-87): the win celebration's pure physics. `step(state, dtMs)` advances groups of card
// faces (one per word-list entry) over plain data: no DOM, no clock, no `Math.random`. Launch time
// derives from the entry index; side and horizontal speed derive from the entry index, the launch
// origin and the band size (each card reaches its exit wall after EXIT_AFTER_CONTACTS first-contact
// times, so it bounces before it leaves; AD-19 Rule bullet 1 and SPEC CAP-2/F3 still say "entry
// index", see the 10.3 plan's Plan Change Log). The constants are tuned at epic 10's checkpoint
// (ticket 10.6 device reads: SPEC F20, F21, F23); timing is a fraction of the cap so the run
// scales with the speed pref.
// SPEC F21, F23 (follow the leader): every card of a group runs the group's one path, an arc
// that falls and rebounds off the floor with a constant horizontal drift, one row step (`gap`)
// behind the card ahead measured along the path (arc length), so the word reads as its row bent
// onto the arc.
// The path and its arc length are closed-form; `launch` samples the arc length of the first fall
// and of one bounce once (`ARC_SAMPLES`), and a trailing card's path time is found by a binary
// search of those samples plus one Newton step, so a frame allocates nothing. Behind the launch
// point the path continues as the row's line: until the leader has travelled `k` steps, trailing
// card `k` slides along that line, so at launch the cards sit as the row.
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
/** SPEC F23: arc-length samples per path segment (the first fall, one bounce). */
const ARC_SAMPLES = 64;

/**
 * SPEC F23: a group's path after launch. The arc-length tables hold the cumulative length (px) at
 * ARC_SAMPLES + 1 even times over the first segment (to `contactMs`) and over one bounce
 * (`periodMs`); a pace fit leaves them unchanged (the same arc in less time).
 */
type Path = {
  /** The constant drift, the launch's vertical speed and the group's gravity (px/ms, px/ms²). */
  readonly vx: number;
  readonly vy: number;
  readonly gravity: number;
  /** The first floor contact, the rebound speed and the bounce period. */
  readonly contactMs: number;
  readonly reboundVy: number;
  readonly periodMs: number;
  readonly firstArc: Float64Array;
  readonly bounceArc: Float64Array;
};

export type Group = Path & {
  /** Cards in the row, in letter order. */
  readonly cards: number;
  /** One card's box: the card width and height, both times `scale`. */
  readonly cardW: number;
  readonly cardH: number;
  readonly scale: number;
  /** SPEC F20: the distance between consecutive card centres in the row (CARD_STEP x `cardW`). */
  readonly gap: number;
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
 * SPEC F23: the arc length from vertical speed 0 to `u` at drift `vx` and gravity `g`, the
 * antiderivative of the speed |(vx, u)| over time (u = v0 + g t); odd in `u`.
 */
function arcAt(u: number, vx: number, g: number): number {
  return (u * Math.hypot(vx, u) + vx * vx * Math.asinh(u / Math.abs(vx))) / (2 * g);
}

/** SPEC F23: a segment's cumulative arc length at ARC_SAMPLES + 1 even times over `durMs`. */
function arcTable(vx: number, v0: number, g: number, durMs: number): Float64Array {
  const table = new Float64Array(ARC_SAMPLES + 1);
  const start = arcAt(v0, vx, g);
  for (let i = 1; i <= ARC_SAMPLES; i++)
    table[i] = arcAt(v0 + (g * durMs * i) / ARC_SAMPLES, vx, g) - start;
  return table;
}

/** SPEC F23: the time into a segment at which its arc is `arc` (binary search, a Newton step). */
function segmentMs(
  table: Float64Array,
  durMs: number,
  vx: number,
  v0: number,
  g: number,
  arc: number,
): number {
  let lo = 0;
  let hi = ARC_SAMPLES;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if ((table[mid] as number) <= arc) lo = mid;
    else hi = mid;
  }
  const a = table[lo] as number;
  const b = table[hi] as number;
  const dt = durMs / ARC_SAMPLES;
  const guess = (lo + (b > a ? (arc - a) / (b - a) : 0)) * dt;
  const u = v0 + g * guess;
  const t = guess - (arcAt(u, vx, g) - arcAt(v0, vx, g) - arc) / Math.hypot(vx, u);
  return Math.min(hi * dt, Math.max(lo * dt, t));
}

/** SPEC F23: the arc length along `path` from its start to path time `t` ≥ 0. */
function pathArc(path: Path, t: number): number {
  const { vx, vy, gravity: g } = path;
  if (t <= path.contactMs) return arcAt(vy + g * t, vx, g) - arcAt(vy, vx, g);
  const s = t - path.contactMs;
  const laps = Math.floor(s / path.periodMs);
  const r = s - laps * path.periodMs;
  return (
    (path.firstArc[ARC_SAMPLES] as number) +
    laps * (path.bounceArc[ARC_SAMPLES] as number) +
    arcAt(g * r - path.reboundVy, vx, g) -
    arcAt(-path.reboundVy, vx, g)
  );
}

/** SPEC F23: the path time at which `path` has run `arc` ≥ 0 px (the inverse of `pathArc`). */
function pathTime(path: Path, arc: number): number {
  const first = path.firstArc[ARC_SAMPLES] as number;
  if (arc <= first)
    return segmentMs(path.firstArc, path.contactMs, path.vx, path.vy, path.gravity, arc);
  const lap = path.bounceArc[ARC_SAMPLES] as number;
  const laps = Math.floor((arc - first) / lap);
  const rest = arc - first - laps * lap;
  return (
    path.contactMs +
    laps * path.periodMs +
    segmentMs(path.bounceArc, path.periodMs, path.vx, -path.reboundVy, path.gravity, rest)
  );
}

/**
 * The initial state: every group waiting as its row centred on its origin, hidden, launching by
 * entry index. The drift is fitted so the group's last card is past its wall by `capMs - baseMs`
 * (before the closing fade): a group whose trail would overrun plays its whole path faster
 * (`pace`: drift and launch speed x pace, gravity x pace²), the same arc in less time. SPEC F23:
 * the trail is `trail` px of arc behind the leader, so the leader must run the arc to the last
 * card's exit point plus `trail` (SPEC F22's fit on that arc).
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
    // The leading card travels `lead` in x to be wholly past its wall; the last card, `trail` px of
    // arc behind it, reaches that point later. A row wider than the band (A-D12 floor) can start
    // its leader at or past the wall: its drift then takes at least a card width per
    // EXIT_AFTER_CONTACTS first-contact times.
    const x = entry.x + (side * (rowW - w)) / 2;
    const lead = side === 1 ? walls.right + w / 2 - x : x + w / 2 - walls.left;
    const trail = (n - 1) * CARD_STEP * w;
    const natural =
      (Math.max(lead, w) / (EXIT_AFTER_CONTACTS * contactMs)) * (1 + SPEED_STEP * slot);
    const periodMs = (2 * rebound) / gravity;
    const unpaced: Path = {
      vx: side * natural,
      vy,
      gravity,
      contactMs,
      reboundVy: rebound,
      periodMs,
      firstArc: arcTable(natural, vy, gravity, contactMs),
      bounceArc: arcTable(natural, -rebound, gravity, periodMs),
    };
    const outMs = pathTime(unpaced, pathArc(unpaced, Math.max(lead, 0) / natural) + trail);
    const pace = Math.max(1, outMs / (capMs - baseMs - launchMs));
    return {
      cards: n,
      cardW: w,
      cardH: h,
      scale,
      gap: CARD_STEP * w,
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
      firstArc: unpaced.firstArc,
      bounceArc: unpaced.bounceArc,
      exited: false,
      opacity: 0,
    };
  });
  return { groups, floor, ceiling, walls, capMs, baseMs, elapsedMs: 0, finished: count === 0 };
}

/**
 * SPEC F21, F23: card `j`'s (letter order) time on the path, `behind` row steps of arc behind the
 * leader. On the row's line behind the launch point it is negative, that arc read at the drift
 * speed (so `x + vx t` places it on the line); the row stands still before launch.
 */
function pathMs(group: Group, j: number, elapsedMs: number): number {
  const behind = group.side === 1 ? group.cards - 1 - j : j;
  const leaderMs = Math.max(elapsedMs, group.launchMs) - group.launchMs;
  if (behind === 0) return leaderMs;
  const arc = pathArc(group, leaderMs) - behind * group.gap;
  return arc <= 0 ? arc / Math.abs(group.vx) : pathTime(group, arc);
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
