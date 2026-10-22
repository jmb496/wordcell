// AD-10: the only source of WAAPI animation durations, after EXPERIENCE.md Motion: each kind is a
// multiple of `prefs.motion.baseMs`; under reduced motion every kind is the 120 ms fade except
// parting, which snaps (0), and there is no stagger.
import { BASE_MS, prefs } from '../shell/prefs.svelte';

export type MotionKind = 'snap' | 'flyBack' | 'parting' | 'undoRedo' | 'flyToCell' | 'overlay';

const FACTOR: Record<MotionKind, number> = {
  snap: 1,
  flyBack: 1,
  parting: 0.5,
  undoRedo: 1,
  flyToCell: 2,
  overlay: 1,
};
/** AD-10: the reduced-motion fade, also written to `--wc-fade-ms` by `initMotion`. */
export const REDUCED_FADE_MS = 120;
const STAGGER_MS = 30;

/** AD-10: the duration in ms of one animation of `kind`. */
export function duration(kind: MotionKind): number {
  const { baseMs, reduced } = prefs.motion;
  if (reduced) return kind === 'parting' ? 0 : REDUCED_FADE_MS;
  return baseMs * FACTOR[kind];
}

/**
 * Epic 6 SPEC F7: writes `--wc-fade-ms` on the root so surface CSS (a CSS transition, never WAAPI)
 * can read the reduced-motion fade under `@container style(--wc-reduced: 1)`; main.ts calls it
 * right after `prefs.load()`. The shell's `motion.reduced` stays an on/off flag.
 */
export function initMotion(): void {
  document.documentElement.style.setProperty('--wc-fade-ms', `${REDUCED_FADE_MS}ms`);
}

/** AD-10: the delay in ms between staggered animations. */
export function stagger(): number {
  return prefs.motion.reduced ? 0 : STAGGER_MS;
}

/** AD-19: the win celebration's cap in ms, 6000 × baseMs / the Normal base (3 s, 6 s, 10.7 s). */
export function celebrationCapMs(): number {
  return (6000 * prefs.motion.baseMs) / BASE_MS.normal;
}

// AD-14 winning guard (epic 5 SPEC F8, F23). The tracker, started once from main.ts, owns the open
// gestures (pointerIds, keys by `code`) and the consumed flags and outlives the guard; the guard is
// a flag plus deadline logic layered on it. All clocks use the injected `now` and timers, never
// `event.timeStamp`. No listener exists at module load.
const MIN_GUARD_MS = 300;
/**
 * Ticket 6.12 review default: how long a touch or pen pointerup on Undo holds for its later click,
 * and the bound of a bare-modifier hold from its latest modifier keydown.
 */
const CLICK_GRACE_MS = 300;
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
  /** Open keys left unconfirmed by a Meta keyup (their keyup may be lost); see `onEvent`. */
  readonly unconfirmed: Set<string>;
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
  /** Ticket 6.12: the injected Undo-enabled predicate (the `GameView` `canUndo` flag, AD-3). */
  readonly canUndo: () => boolean;
  /** Open callbacks waiting for the floor (and the hold) in `whenOpenAllowed`. */
  pending: (() => void)[];
  /** An accepted Undo gesture holds the open back until its dispatch or its end. */
  hold: boolean;
  /** The gesture id whose end releases the hold (null: a click or a modifier hold). */
  holdId: string | null;
  holdTimer: unknown;
  /** The hold is a bare-modifier hold; `mods` are its modifier keys not yet up. */
  modHold: boolean;
  readonly mods: Set<string>;
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
  t.hold = false;
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

/**
 * Ticket 6.12: finishes the winning animation; no-op when no guard is installed. Called from the
 * hide flush (before `hideClear`) and the back callback (after `controller.cancel`).
 */
export function finishGuard(): void {
  const t = live('finishGuard');
  if (t.installed) finish(t);
}

/**
 * Ticket 6.12 (AD-14, R-62): runs `callback` at once with no guard installed; otherwise once the
 * floor (install + 300 ms on the injected clock) has passed and no Undo hold is pending, after
 * uninstalling the guard so it never consumes input on the sheet.
 */
export function whenOpenAllowed(callback: () => void): void {
  // No tracker (unit tests of other modules) means no guard installed.
  const t = tracker;
  if (t === null || !t.installed) {
    callback();
    return;
  }
  t.pending.push(callback);
  evaluate(t);
}

/**
 * Ticket 6.12: a dispatch returned `unfinished`: drops the hold and any pending open and
 * uninstalls at once (the Undo cancelled the open).
 */
export function releaseHold(): void {
  const t = tracker;
  if (t === null || !t.installed) return;
  t.pending = [];
  uninstall(t);
}

function clearHold(t: Tracker): void {
  t.hold = false;
  t.holdId = null;
  t.modHold = false;
  t.mods.clear();
  if (t.holdTimer !== null) t.timers.clearTimer(t.holdTimer);
  t.holdTimer = null;
}

// The hold ends one tick (or `ms`) after its gesture's end/click unless a dispatch got there first.
function scheduleRelease(t: Tracker, ms = 0): void {
  if (!t.hold || t.holdTimer !== null) return;
  t.holdTimer = t.timers.setTimer(() => {
    t.holdTimer = null;
    clearHold(t);
    evaluate(t);
  }, ms);
}

// Ticket 6.12 review default (bounded modifier hold): a bare modifier keydown holds the open for at
// most CLICK_GRACE_MS from the latest one, so a following Z (the Undo chord) claims it; a further
// bare modifier keydown restarts the bound and joins the hold. Before the floor the bound is the
// floor, so the open still fires at 300 ms (build-notes CAP-5).
function holdModifier(t: Tracker, id: string): void {
  if (t.holdTimer !== null) t.timers.clearTimer(t.holdTimer);
  t.holdTimer = null;
  t.hold = true;
  t.holdId = null;
  t.modHold = true;
  t.mods.add(id);
  const floor = t.installAt + MIN_GUARD_MS - t.now();
  scheduleRelease(t, floor > 0 ? floor : CLICK_GRACE_MS);
}

// The modifier hold ends one tick later: every held modifier is up, or a start that is not an Undo
// alias arrived.
function endModifierHold(t: Tracker): void {
  if (t.holdTimer !== null) t.timers.clearTimer(t.holdTimer);
  t.holdTimer = null;
  scheduleRelease(t);
}

function clearOpen(t: Tracker, hide: boolean): void {
  const consumed = [...t.open.values()].some((c) => c);
  t.open.clear();
  t.unconfirmed.clear();
  clearHold(t);
  if (!t.installed) return;
  if (consumed) t.lastEnd = t.now();
  if (hide && !t.settled) {
    t.settled = true;
    t.settledAt = t.now();
  }
  evaluate(t);
}

function consumedOpen(t: Tracker): boolean {
  for (const [id, consumed] of t.open) if (consumed && !t.unconfirmed.has(id)) return true;
  return false;
}

function uninstall(t: Tracker): void {
  t.installed = false;
  t.complete = null;
  clearHold(t);
  if (t.timer !== null) t.timers.clearTimer(t.timer);
  t.timer = null;
}

// Uninstalls once settled, 300 ms after install and the backstop after the last consumed end have
// all passed with no consumed gesture open; otherwise waits for the missing event or timer.
function evaluate(t: Tracker): void {
  if (!t.installed) return;
  if (t.timer !== null) t.timers.clearTimer(t.timer);
  t.timer = null;
  if (t.hold) return;
  if (t.pending.length > 0) {
    const wait = t.installAt + MIN_GUARD_MS - t.now();
    if (wait > 0) {
      t.timer = t.timers.setTimer(() => evaluate(t), wait);
      return;
    }
    const callbacks = t.pending;
    t.pending = [];
    uninstall(t);
    for (const callback of callbacks) callback();
    return;
  }
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
  const target = event.target as Element | null;
  return target !== null && target.closest(UNDO) !== null;
}

// keys.ts `match`: Ctrl/Meta+Shift+Z is Redo (no alias), Alt+Z matches nothing; plain Shift+Z,
// bare Z and Ctrl/Meta+Z are Undo, Caps Lock included.
function undoKey(event: Event): boolean {
  const e = event as KeyboardEvent;
  if (!event.type.startsWith('key') || e.key.toLowerCase() !== 'z' || e.altKey) return false;
  return !((e.ctrlKey || e.metaKey) && e.shiftKey);
}

// Ticket 6.12 review default: a bare Ctrl, Meta or Shift keydown may be the start of an Undo chord.
function modifierKey(event: Event): boolean {
  const k = (event as KeyboardEvent).key;
  return event.type === 'keydown' && (k === 'Control' || k === 'Meta' || k === 'Shift');
}

// Ticket 6.12 review default: a touch or pen tap's click is a separate, later input than its
// pointerup, so a pointerup inside Undo holds for it (up to CLICK_GRACE_MS).
function clickFollows(event: Event): boolean {
  const type = (event as PointerEvent).pointerType;
  return event.type === 'pointerup' && (type === 'touch' || type === 'pen') && inUndo(event);
}

function gestureId(event: Event): string | null {
  if (event.type.startsWith('pointer')) return `p${(event as PointerEvent).pointerId}`;
  if (event.type.startsWith('key')) return `k${(event as KeyboardEvent).code}`;
  return null;
}

// F8: one open gesture's end bookkeeping (its end event, or an end the browser never sent).
function endOpen(t: Tracker, id: string, consumed: boolean, pointerup: boolean, ms = 0): void {
  if (t.hold && t.holdId === id) scheduleRelease(t, ms);
  if (t.modHold && t.mods.delete(id) && t.mods.size === 0) endModifierHold(t);
  t.open.delete(id);
  t.unconfirmed.delete(id);
  if (consumed) {
    t.lastEnd = t.now();
    if (pointerup) t.owedClick = true;
  }
}

function onEvent(t: Tracker, event: Event): void {
  evaluate(t);
  const type = event.type;
  const id = gestureId(event);
  const isEnd = type === 'pointerup' || type === 'pointercancel' || type === 'keyup';
  const isStart = type === 'pointerdown' || type === 'keydown';
  const key = event as KeyboardEvent;
  if (
    type === 'keyup' &&
    (key.key === 'Meta' || key.code === 'MetaLeft' || key.code === 'MetaRight')
  ) {
    // Review default under AD-14 (F8 tracker), not an F8 sentence: macOS sends no keyup for a key
    // released while Meta is held, so Meta's keyup leaves every other open key unconfirmed. It stays
    // open (its repeats, keyup and a fresh keydown still follow its consumed flag; its keyup or that
    // keydown ends it), but neither the guard nor an Undo hold waits on it and it sets no backstop
    // until that real end. Install marks it consumed and it stays unconfirmed; nothing re-confirms
    // it (uninstall keeps the set: a later install must not wait on a lost keyup either).
    for (const other of t.open.keys()) {
      if (other === id || !other.startsWith('k')) continue;
      t.unconfirmed.add(other);
      if (t.hold && t.holdId === other) scheduleRelease(t);
    }
    evaluate(t);
  }
  if (id !== null) {
    const consumed = t.open.get(id);
    // Review default under AD-14 (F8 tracker), not an F8 sentence: a fresh (non-repeat) keydown or
    // a pointerdown of an open gesture means its end was lost: the stale entry ends here and the
    // down starts a new gesture below.
    const lost =
      consumed !== undefined && (type === 'pointerdown' || (type === 'keydown' && !key.repeat));
    if (lost) endOpen(t, id, consumed, false);
    if (consumed !== undefined && !lost) {
      // A tracked gesture: its events (repeats, end) follow its consumed flag.
      if (isEnd) {
        endOpen(t, id, consumed, type === 'pointerup', clickFollows(event) ? CLICK_GRACE_MS : 0);
      }
      if (consumed) consume(event);
      evaluate(t);
      return;
    }
  }
  // Ticket 6.12 review default: only a primary-button press is an Undo press.
  const primary = type !== 'pointerdown' || (event as PointerEvent).button === 0;
  const undo = (inUndo(event) || undoKey(event)) && primary && t.canUndo();
  if (t.installed && undo && (isStart || type === 'click')) {
    // Untracked ends (pointerup/pointercancel/keyup) inside Undo pass through with no side effect.
    // The hold is set before finish drains the open callbacks; the dispatch (releaseHold) or the
    // gesture's end ends it. A hold already being released is taken over by this press.
    if (!t.hold || t.holdTimer !== null) {
      clearHold(t);
      t.hold = true;
      t.holdId = isStart ? id : null;
    }
    finish(t);
    if (isStart && id !== null) t.open.set(id, false);
    if (type === 'click') scheduleRelease(t);
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
  const modifier = modifierKey(event) && t.canUndo();
  if (t.modHold && !modifier) endModifierHold(t);
  const windowPassed = t.settled && t.now() >= t.installAt + MIN_GUARD_MS;
  if (windowPassed && !consumedOpen(t) && !t.hold) {
    // First start in the backstop window: the guard ends and the event passes through.
    uninstall(t);
    t.open.set(id, false);
    return;
  }
  t.open.set(id, true);
  // Ticket 6.12 review default: the bounded modifier hold (holdModifier); the dispatch
  // (releaseHold) ends it too. An Undo press's hold is left as it is.
  if (modifier && (!t.hold || t.modHold)) holdModifier(t, id);
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
  canUndo: () => boolean,
): () => void {
  if (tracker !== null) throw new Error('AD-14 startTracker() called twice');
  const t: Tracker = {
    now,
    timers,
    open: new Map(),
    unconfirmed: new Set(),
    installed: false,
    complete: null,
    completed: false,
    installAt: 0,
    settled: false,
    settledAt: 0,
    lastEnd: 0,
    owedClick: false,
    timer: null,
    canUndo,
    pending: [],
    hold: false,
    holdId: null,
    holdTimer: null,
    modHold: false,
    mods: new Set(),
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
    clearHold(t);
    tracker = null;
    hoverClear = null;
  };
}
