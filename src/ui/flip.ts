// AD-14 FLIP (epic 5 SPEC CAP-8, F6, F7, F17, F22, F27; AD-10, AD-11): one module glides the
// `.face` inside each live element (`[data-card-id]`) from its previous to its next rect around a
// button-driven move; the wrapper (identity, hit rect) is never animated or classed, and mirrors
// (`[data-mirror-of]`) never take part. `capture()` (before `game.dispatch`) finishes every running
// glide, flushes Svelte (a selection cleared just before renders, so no lift is recorded), then
// records per CardId the face's viewport rect and its band (from `data-place`) and each band's
// `[data-band]` rect. `play(command, result)` flushes, measures again and plans per face (pure
// `planGlides`): a card that stays in its band inverts from the band-relative delta (a pure band
// shift gets no motion), a band changer from captured − next viewport rect, sizes ignored (card ↔
// compact by top-left), under 0.5 px on both axes none; under reduced motion a 0 → 1 opacity fade
// at the settled rect. The kind is the pure `motionKind` of (command, DispatchResult, resulting
// phase) (F7); `null` is the empty animated set, and `flyToCell` animates nothing here (its
// fly-to-cell is entry 11's). Durations only from the injected `duration` (motion.ts, AD-10). A
// translating face takes `wc-glide`, and a band-changing translate lifts the tile area's clip
// (`wc-drag-tiles`, F22), both removed at the last settle. Each animation holds one gate count
// (AD-11) until its idempotent settle: its `onfinish`, or `finishAll()` (finish, then settle
// synchronously); a `cancel` event throws (rule 6). Installed once from main.ts through `setFlip`
// (as act.ts's `setController`); the module-level `capture`, `play` and `finishAll` serve the
// act()-wrapped callers.
import { flushSync } from 'svelte';
import type { CardId, Command, Phase } from '../engine/index';
import type { DispatchResult } from '../shell/game.svelte';
import { DRAG_TILES, GLIDE } from './gestures/classes';
import { translate } from './gestures/fly-back';
import type { Gate } from './gestures/gate';
import { found } from './gestures/lookup';
import type { MotionKind } from './motion';

/**
 * The band a live card sits in: `data-place` column → columns, tray/strip → tray, cell →
 * wordcells.
 */
export type BandKey = 'columns' | 'tray' | 'wordcells';
export type Box = { left: number; top: number; width: number; height: number };
/** A face's band and viewport rect. */
export type Placed = { readonly band: BandKey; readonly rect: Box };
export type Glide = { id: CardId; keyframes: Keyframe[]; translate: boolean; bandChange: boolean };

const BANDS: readonly BandKey[] = ['columns', 'tray', 'wordcells'];

const BAND_OF_PLACE: ReadonlyMap<string | null, BandKey> = new Map([
  ['column', 'columns'],
  ['tray', 'tray'],
  ['strip', 'tray'],
  ['cell', 'wordcells'],
]);

/** Below this distance in px on both axes a face does not move (AD-14). */
const MIN_DELTA_PX = 0.5;

/**
 * F7: the animation kind of a move, from the command, its result and the phase after it; `null`
 * is the empty animated set (`setTarget`, `giveUp`, a `validate` that changed nothing).
 */
export function motionKind(
  command: Command,
  result: DispatchResult,
  phase: Phase,
): MotionKind | null {
  switch (command.type) {
    case 'setTarget':
    case 'giveUp':
      return null;
    case 'validate':
      return result.changed ? 'snap' : null;
    case 'undo':
      return 'undoRedo';
    case 'redo':
      return phase === 'idle' ? 'flyToCell' : 'undoRedo';
    case 'confirm':
      return 'flyToCell';
    case 'drop':
    case 'tapDestinationCard':
    case 'setDestinationCount':
    case 'flip':
    case 'addFreeLetter':
    case 'removeFreeLetter':
    case 'arrange':
    case 'setPlacementOrder':
      return 'snap';
    default: {
      const unknown: never = command;
      throw new Error(
        `AD-14 FLIP unknown command type ${String((unknown as { type: unknown }).type)}`,
      );
    }
  }
}

/**
 * AD-14 coordinate frame: the keyframes of every face whose band-relative position changed. Both
 * maps hold the same CardIds (play checks).
 */
export function planGlides(input: {
  readonly before: ReadonlyMap<CardId, Placed>;
  readonly after: ReadonlyMap<CardId, Placed>;
  readonly bandsBefore: Readonly<Record<BandKey, Box>>;
  readonly bandsAfter: Readonly<Record<BandKey, Box>>;
  readonly kind: MotionKind | null;
  readonly reduced: boolean;
}): Glide[] {
  const { before, after, bandsBefore, bandsAfter, kind, reduced } = input;
  if (kind === null || kind === 'flyToCell') return [];
  const glides: Glide[] = [];
  for (const [id, next] of after) {
    const previous = found(before.get(id), `AD-14 FLIP card ${id} missing from the capture`);
    const bandChange = previous.band !== next.band;
    let dx: number;
    let dy: number;
    if (bandChange) {
      dx = previous.rect.left - next.rect.left;
      dy = previous.rect.top - next.rect.top;
    } else {
      const from = bandsBefore[previous.band];
      const to = bandsAfter[next.band];
      dx = previous.rect.left - from.left - (next.rect.left - to.left);
      dy = previous.rect.top - from.top - (next.rect.top - to.top);
    }
    if (Math.abs(dx) < MIN_DELTA_PX && Math.abs(dy) < MIN_DELTA_PX) continue;
    if (reduced) {
      glides.push({
        id,
        keyframes: [{ opacity: 0 }, { opacity: 1 }],
        translate: false,
        bandChange,
      });
    } else {
      glides.push({
        id,
        keyframes: [{ transform: translate(dx, dy) }, { transform: translate(0, 0) }],
        translate: true,
        bandChange,
      });
    }
  }
  return glides;
}

export type FlipDeps = {
  readonly gate: Gate;
  /** App's `<main>` (mounted after main.ts builds the deps); null before the mount. */
  root(): HTMLElement | null;
  /** `prefs.motion.reduced`, read at each play. */
  reduced(): boolean;
  /** The current view's phase (read after the move); undefined without a view. */
  phase(): Phase | undefined;
  /** motion.ts `duration` (AD-10). */
  duration(kind: MotionKind): number;
};

export type Flip = {
  /** Finishes every glide, flushes, then records the faces' rects and bands. */
  capture(): void;
  /** Consumes the capture, flushes, measures again and starts every glide synchronously. */
  play(command: Command, result: DispatchResult): void;
  /** F6: completes every running glide; each settles synchronously. */
  finishAll(): void;
  /** True while a glide is unsettled. */
  running(): boolean;
};

type Measure = {
  readonly placed: ReadonlyMap<CardId, Placed>;
  readonly faces: ReadonlyMap<CardId, HTMLElement>;
  readonly bands: Readonly<Record<BandKey, Box>>;
};

type Running = { readonly animation: Animation; settled: boolean };

function boxOf(el: Element): Box {
  const r = el.getBoundingClientRect();
  return { left: r.left, top: r.top, width: r.width, height: r.height };
}

function measure(root: HTMLElement): Measure {
  const placed = new Map<CardId, Placed>();
  const faces = new Map<CardId, HTMLElement>();
  for (const wrapper of root.querySelectorAll<HTMLElement>('[data-card-id]')) {
    const raw = wrapper.getAttribute('data-card-id');
    const id = Number(raw) as CardId;
    if (raw === null || !/^\d+$/.test(raw) || id > 51) {
      throw new Error(`AD-14 FLIP data-card-id ${raw} is not a CardId 0–51`);
    }
    const place = wrapper.getAttribute('data-place');
    const band = found(BAND_OF_PLACE.get(place), `AD-14 FLIP card ${id} has data-place ${place}`);
    if (placed.has(id)) throw new Error(`AD-14 FLIP card ${id} is live twice`);
    const face = found(
      wrapper.querySelector<HTMLElement>(':scope > .face'),
      `AD-14 FLIP card ${id} has no face`,
    );
    placed.set(id, { band, rect: boxOf(face) });
    faces.set(id, face);
  }
  const bands = {} as Record<BandKey, Box>;
  for (const key of BANDS) {
    bands[key] = boxOf(
      found(root.querySelector(`[data-band="${key}"]`), `AD-14 FLIP band ${key} missing`),
    );
  }
  return { placed, faces, bands };
}

export function createFlip(deps: FlipDeps): Flip {
  const { gate } = deps;
  let pending: Measure | null = null;
  const animations = new Set<Running>();
  /** The faces carrying `GLIDE`, and the `.tiles` carrying `DRAG_TILES`, until the last settle. */
  const gliding = new Set<HTMLElement>();
  let tiles: HTMLElement | null = null;

  function rootFor(step: string): HTMLElement {
    return found(deps.root(), `AD-14 FLIP ${step}() with no root`);
  }

  function capture(): void {
    if (pending !== null) throw new Error('AD-14 FLIP capture() while a capture is pending');
    finishAll();
    flushSync();
    pending = measure(rootFor('capture'));
  }

  function play(command: Command, result: DispatchResult): void {
    const before = pending;
    if (before === null) throw new Error('AD-14 FLIP play() without a capture');
    pending = null;
    flushSync();
    const root = rootFor('play');
    const after = measure(root);
    for (const id of before.placed.keys()) {
      if (!after.placed.has(id)) throw new Error(`AD-14 FLIP card ${id} missing after the move`);
    }
    for (const id of after.placed.keys()) {
      if (!before.placed.has(id)) throw new Error(`AD-14 FLIP card ${id} missing from the capture`);
    }
    const phase = deps.phase();
    if (phase === undefined) throw new Error('AD-14 FLIP play() with no view');
    const kind = motionKind(command, result, phase);
    const glides = planGlides({
      before: before.placed,
      after: after.placed,
      bandsBefore: before.bands,
      bandsAfter: after.bands,
      kind,
      reduced: deps.reduced(),
    });
    if (kind === null || glides.length === 0) return;
    const ms = deps.duration(kind);
    for (const glide of glides) {
      const face = found(after.faces.get(glide.id), `AD-14 FLIP card ${glide.id} has no face`);
      gate.enter();
      const animation = face.animate(glide.keyframes, { duration: ms, easing: 'ease-out' });
      const entry: Running = { animation, settled: false };
      animations.add(entry);
      if (glide.translate) {
        face.classList.add(GLIDE);
        gliding.add(face);
        if (glide.bandChange && tiles === null) {
          tiles = found(
            root.querySelector<HTMLElement>('[data-band="tray"] .tiles'),
            'AD-14 FLIP tile area missing',
          );
          tiles.classList.add(DRAG_TILES);
        }
      }
      animation.onfinish = () => settle(entry);
      // Rule 6: a cancelled glide would never settle (gate held, classes on); finishAll's
      // finish() never cancels.
      animation.oncancel = () => {
        throw new Error('AD-14 FLIP animation cancelled');
      };
    }
  }

  // Idempotent: the animation's onfinish, or finishAll().
  function settle(entry: Running): void {
    if (entry.settled) return;
    entry.settled = true;
    animations.delete(entry);
    if (animations.size === 0) {
      for (const face of gliding) face.classList.remove(GLIDE);
      gliding.clear();
      tiles?.classList.remove(DRAG_TILES);
      tiles = null;
    }
    gate.leave();
  }

  function finishAll(): void {
    for (const entry of [...animations]) {
      entry.animation.finish();
      settle(entry);
    }
  }

  function running(): boolean {
    return animations.size > 0;
  }

  return { capture, play, finishAll, running };
}

let installed: Flip | undefined;

/** Installs the one FLIP instance (main.ts, after the gate and before the controller). */
export function setFlip(next: Flip): void {
  if (installed !== undefined) throw new Error('AD-14 setFlip() called twice');
  installed = next;
}

function current(step: string): Flip {
  if (installed === undefined) throw new Error(`AD-14 ${step}() before setFlip()`);
  return installed;
}

export function capture(): void {
  current('capture').capture();
}

export function play(command: Command, result: DispatchResult): void {
  current('play').play(command, result);
}

export function finishAll(): void {
  current('finishAll').finishAll();
}
