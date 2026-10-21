// AD-19 (R-87): the win celebration's pure physics. `step(state, dtMs)` moves groups of card faces
// (one per word-list entry) over plain data: no DOM, no clock, no `Math.random`. Launch time, side
// and speed derive from the entry index and the band size. The constants are initial values, tuned
// at epic 10's checkpoint; each is a fraction of the cap so the run scales with the speed pref.
// Coordinates are band-relative px (the band is the area between the top bar and the action bar),
// y grows downward, velocities are px per ms; a group's position is the centre of its box.

/** AD-19: one `step` never advances more than this. */
export const DT_MAX_MS = 50;
/** DESIGN.md Win celebration: consecutive cards overlap by half a card width. */
const OVERLAP = 0.5;
/** DESIGN.md Win celebration: a row wider than this share of the band scales down. */
const FIT_SHARE = 0.9;
/** A-D12: the smallest scale of a row. */
const MIN_SCALE = 0.4;
/** Groups per wave; later waves launch later, in list order. */
const WAVE_SIZE = 3;
/** Cap fraction between two waves, shrunk so the last launch is within LAUNCH_SPAN_FRAC. */
const WAVE_GAP_FRAC = 0.08;
const LAUNCH_SPAN_FRAC = 0.5;
/** Cap fractions: a full-band fall, and the horizontal crossing of the band, for gravity and speed. */
const FALL_FRAC = 0.2;
const CROSS_FRAC = 0.4;
/** Share of the room above the origin the launch rises through. */
const RISE_SHARE = 0.5;
/** Per wave-slot speed variety. */
const SPEED_STEP = 0.15;

export type Group = {
  /** Box centre. */
  readonly x: number;
  readonly y: number;
  readonly vx: number;
  readonly vy: number;
  /** Box size (row width and card height, both times `scale`). */
  readonly w: number;
  readonly h: number;
  readonly scale: number;
  /** The wall the group drifts toward: -1 left, 1 right. */
  readonly side: -1 | 1;
  readonly launchMs: number;
  /** Floor contacts; informational, not part of `finished`. */
  readonly bounces: number;
  readonly exited: boolean;
  /** 0 before launch and once exited; fades over the last `baseMs` of the cap. */
  readonly opacity: number;
};

export type StepState = {
  readonly groups: readonly Group[];
  readonly floor: number;
  readonly ceiling: number;
  readonly walls: { readonly left: number; readonly right: number };
  readonly gravity: number;
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

/** A-D12, DESIGN.md Win celebration: the uniform scale of an `n`-letter row, never enlarging. */
export function rowScale(n: number, cardW: number, bandW: number): number {
  const raw = (FIT_SHARE * bandW) / (cardW * (1 + OVERLAP * (n - 1)));
  return Math.min(1, Math.max(MIN_SCALE, raw));
}

/** The unscaled width of an `n`-letter row at card width `cardW`. */
export function rowWidth(n: number, cardW: number): number {
  return cardW * (1 + OVERLAP * (n - 1));
}

/** The initial state: every group waiting at its origin, hidden, launching by entry index. */
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
    const scale = rowScale(entry.letters, input.cardW, bandW);
    const w = rowWidth(entry.letters, input.cardW) * scale;
    const h = input.cardH * scale;
    const side: -1 | 1 = entry.x - walls.left < walls.right - entry.x ? -1 : 1;
    const slot = i % WAVE_SIZE;
    const speed = (bandW / (CROSS_FRAC * capMs)) * (1 + SPEED_STEP * slot);
    const rise = RISE_SHARE * Math.max(0, entry.y - h / 2 - ceiling);
    return {
      x: entry.x,
      y: entry.y,
      vx: side * speed,
      vy: -Math.sqrt(2 * gravity * rise),
      w,
      h,
      scale,
      side,
      launchMs: Math.floor(i / WAVE_SIZE) * waveGap + (slot * waveGap) / WAVE_SIZE,
      bounces: 0,
      exited: false,
      opacity: 0,
    };
  });
  return {
    groups,
    floor,
    ceiling,
    walls,
    gravity,
    capMs,
    baseMs,
    elapsedMs: 0,
    finished: count === 0,
  };
}

function advance(group: Group, state: StepState, from: number, to: number): Group {
  if (group.exited) return group;
  if (to < group.launchMs) return group;
  const dt = to - Math.max(from, group.launchMs);
  let { x, y, vy, bounces } = group;
  vy += state.gravity * dt;
  x += group.vx * dt;
  y += vy * dt;
  if (y + group.h / 2 >= state.floor && vy > 0) {
    y = state.floor - group.h / 2;
    vy = -vy;
    bounces += 1;
  } else if (y - group.h / 2 <= state.ceiling && vy < 0) {
    y = state.ceiling + group.h / 2;
    vy = -vy;
  }
  const exited =
    group.side === 1 ? x - group.w / 2 >= state.walls.right : x + group.w / 2 <= state.walls.left;
  const fade = Math.min(1, Math.max(0, (state.capMs - to) / state.baseMs));
  return { ...group, x, y, vy, bounces, exited, opacity: exited ? 0 : fade };
}

/** AD-19: advances `state` by `dtMs`, clamped to [0, 50] ms; returns a new state. */
export function step(state: StepState, dtMs: number): StepState {
  const dt = Math.min(Math.max(dtMs, 0), DT_MAX_MS);
  const elapsedMs = state.elapsedMs + dt;
  const groups = state.groups.map((group) => advance(group, state, state.elapsedMs, elapsedMs));
  const finished = groups.every((group) => group.exited) || elapsedMs >= state.capMs;
  return { ...state, groups, elapsedMs, finished };
}
