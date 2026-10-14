// AD-10: the only source of WAAPI animation durations, after EXPERIENCE.md Motion: each kind is a
// multiple of `prefs.motion.baseMs`; under reduced motion every kind is the 120 ms fade except
// parting, which snaps (0), and there is no stagger.
import { prefs } from '../shell/prefs.svelte';

export type MotionKind = 'snap' | 'flyBack' | 'parting' | 'undoRedo' | 'flyToCell' | 'overlay';

const FACTOR: Record<MotionKind, number> = {
  snap: 1,
  flyBack: 1,
  parting: 0.5,
  undoRedo: 1,
  flyToCell: 2,
  overlay: 1,
};
const REDUCED_FADE_MS = 120;
const STAGGER_MS = 30;

/** AD-10: the duration in ms of one animation of `kind`. */
export function duration(kind: MotionKind): number {
  const { baseMs, reduced } = prefs.motion;
  if (reduced) return kind === 'parting' ? 0 : REDUCED_FADE_MS;
  return baseMs * FACTOR[kind];
}

/** AD-10: the delay in ms between staggered animations. */
export function stagger(): number {
  return prefs.motion.reduced ? 0 : STAGGER_MS;
}

// AD-14 winning guard (epic 5 SPEC F8, F23). The tracker, started once from main.ts, owns the open
// gestures (pointerIds, keys by `code`) and the consumed flags and outlives the guard; the guard is
// a flag plus deadline logic layered on it. All clocks use the injected `now` and timers, never
// `event.timeStamp`. No listener exists at module load.
const MIN_GUARD_MS = 300;
const UNDO = '[data-testid="undo"]';

export type GuardTimers = {
  setTimer(callback: () => void, ms: number): unknown;
  clearTimer(handle: unknown): void;
};

type Tracker = {
  readonly now: () => number;
  readonly timers: GuardTimers;
  /** Open gestures: `p<pointerId>` / `k<code>` → consumed. */
  readonly open: Map<string, boolean>;
  installed: boolean;
  complete: (() => void) | null;
  completed: boolean;
  installAt: number;
  settled: boolean;
  settledAt: number;
  /** The last consumed gesture's end (or the install) the backstop counts from. */
  lastEnd: number;
  /** A consumed pointerup's click is still owed (consumed once, cleared by the next down). */
  owedClick: boolean;
  timer: unknown;
};

let tracker: Tracker | null = null;
let hoverClear: (() => void) | null = null;

function live(step: string): Tracker {
  if (tracker === null) throw new Error(`AD-14 motion ${step}() before startTracker()`);
  return tracker;
}

/** F8: the hover-peek timer's stop, called at install (the guard clears a pending timer). */
export function setHoverClear(callback: () => void): void {
  hoverClear = callback;
}

/** F8: true while the winning guard is installed (no hover-peek timer starts). */
export function guardInstalled(): boolean {
  return tracker?.installed === true;
}

/**
 * F8: installs the guard when `won` (a Confirm or Redo dispatch returned `finished` `won`):
 * every open gesture becomes consumed, a pending hover timer is cleared; `complete` finishes the
 * animation on the first consumed gesture or Undo. No-op while installed.
 */
export function install(won: boolean, complete: () => void): void {
  if (!won) return;
  const t = live('install');
  if (t.installed) return;
  t.installed = true;
  t.complete = complete;
  t.completed = false;
  t.installAt = t.now();
  t.settled = false;
  t.settledAt = 0;
  t.lastEnd = t.installAt;
  for (const id of t.open.keys()) t.open.set(id, true);
  hoverClear?.();
  evaluate(t);
}

/** F8: the winning animation settled by any path (a no-op unless installed and not yet settled). */
export function notifySettled(): void {
  // No tracker (unit tests of other modules) means no guard installed.
  const t = tracker;
  if (t === null || !t.installed || t.settled) return;
  t.settled = true;
  t.settledAt = t.now();
  evaluate(t);
}

/** F8/AD-9: hide clears every open gesture and counts as settle; wired through registerBeforeHide. */
export function hideClear(): void {
  clearOpen(live('hideClear'), true);
}

function clearOpen(t: Tracker, hide: boolean): void {
  const consumed = [...t.open.values()].some((c) => c);
  t.open.clear();
  if (!t.installed) return;
  if (consumed) t.lastEnd = t.now();
  if (hide && !t.settled) {
    t.settled = true;
    t.settledAt = t.now();
  }
  evaluate(t);
}

function consumedOpen(t: Tracker): boolean {
  for (const consumed of t.open.values()) if (consumed) return true;
  return false;
}

function uninstall(t: Tracker): void {
  t.installed = false;
  t.complete = null;
  if (t.timer !== null) t.timers.clearTimer(t.timer);
  t.timer = null;
}

// Uninstalls once settled, 300 ms after install and the backstop after the last consumed end have
// all passed with no consumed gesture open; otherwise waits for the missing event or timer.
function evaluate(t: Tracker): void {
  if (!t.installed) return;
  if (t.timer !== null) t.timers.clearTimer(t.timer);
  t.timer = null;
  if (!t.settled || consumedOpen(t)) return;
  const at = Math.max(t.settledAt, t.installAt + MIN_GUARD_MS, t.lastEnd + duration('snap'));
  const wait = at - t.now();
  if (wait <= 0) uninstall(t);
  else t.timer = t.timers.setTimer(() => evaluate(t), wait);
}

function finish(t: Tracker): void {
  if (t.completed || t.complete === null) return;
  t.completed = true;
  t.complete();
}

function consume(event: Event): void {
  event.preventDefault();
  event.stopPropagation();
}

function inUndo(event: Event): boolean {
  const target = event.target as { closest?: (selector: string) => unknown } | null;
  return target !== null && typeof target.closest === 'function' && target.closest(UNDO) !== null;
}

function gestureId(event: Event): string | null {
  if (event.type.startsWith('pointer')) return `p${(event as PointerEvent).pointerId}`;
  if (event.type.startsWith('key')) return `k${(event as KeyboardEvent).code}`;
  return null;
}

function onEvent(t: Tracker, event: Event): void {
  evaluate(t);
  const type = event.type;
  const id = gestureId(event);
  const isEnd = type === 'pointerup' || type === 'pointercancel' || type === 'keyup';
  const isStart = type === 'pointerdown' || type === 'keydown';
  if (id !== null) {
    const consumed = t.open.get(id);
    if (consumed !== undefined) {
      // A tracked gesture: its events (duplicate down, repeats, end) follow its consumed flag.
      if (isEnd) {
        t.open.delete(id);
        if (consumed) {
          t.lastEnd = t.now();
          if (type === 'pointerup') t.owedClick = true;
        }
      }
      if (consumed) consume(event);
      evaluate(t);
      return;
    }
  }
  const undo = inUndo(event);
  if (t.installed && undo) {
    finish(t);
    uninstall(t);
    if (isStart && id !== null) t.open.set(id, false);
    return;
  }
  if (type === 'click') {
    if (undo) return;
    if (t.installed || t.owedClick) {
      t.owedClick = false;
      consume(event);
    }
    return;
  }
  if (!isStart || id === null) return;
  const repeat = type === 'keydown' && (event as KeyboardEvent).repeat;
  if (t.installed && repeat) {
    // A key held through a clear: consumed, no uninstall, no backstop change.
    consume(event);
    return;
  }
  if (repeat) return;
  if (!undo) t.owedClick = false;
  if (!t.installed) {
    t.open.set(id, false);
    return;
  }
  const windowPassed = t.settled && t.now() >= t.installAt + MIN_GUARD_MS;
  if (windowPassed && !consumedOpen(t)) {
    // First start in the backstop window: the guard ends and the event passes through.
    uninstall(t);
    t.open.set(id, false);
    return;
  }
  t.open.set(id, true);
  if (!windowPassed) finish(t);
  consume(event);
  evaluate(t);
}

type ListenTarget = Pick<EventTarget, 'addEventListener' | 'removeEventListener'>;
const DOC_EVENTS = ['pointerdown', 'pointerup', 'pointercancel', 'click', 'keydown', 'keyup'];

/**
 * F8: starts the always-on capture-phase tracker once (main.ts, AD-16 boot, before the controller)
 * with the document, window, clock and timers injected. Returns a stop that removes the listeners
 * and resets the module (tests).
 */
export function startTracker(
  doc: ListenTarget,
  win: ListenTarget,
  now: () => number,
  timers: GuardTimers,
): () => void {
  if (tracker !== null) throw new Error('AD-14 startTracker() called twice');
  const t: Tracker = {
    now,
    timers,
    open: new Map(),
    installed: false,
    complete: null,
    completed: false,
    installAt: 0,
    settled: false,
    settledAt: 0,
    lastEnd: 0,
    owedClick: false,
    timer: null,
  };
  tracker = t;
  const onDoc = (event: Event) => onEvent(t, event);
  const onBlur = () => clearOpen(t, false);
  for (const type of DOC_EVENTS) doc.addEventListener(type, onDoc, true);
  win.addEventListener('blur', onBlur);
  return () => {
    for (const type of DOC_EVENTS) doc.removeEventListener(type, onDoc, true);
    win.removeEventListener('blur', onBlur);
    if (t.timer !== null) timers.clearTimer(t.timer);
    tracker = null;
    hoverClear = null;
  };
}
