// AD-19 (R-87): the win celebration's run controller, the only owner of the run data. Unmounted and
// untriggered until entries 4-8 wire it (overlay entry, end sheet, skip). `start` measures once;
// frames then step the pure `step.ts` state and write `transform`/opacity straight to the group
// elements Celebration.svelte registered (rule 3, no reactive per-frame state); only the active
// run's props are reactive, so a mount can follow the run. Two drivers: real rAF, and a manual
// clock (`setManual`, `advance`) for Playwright (AD-17).
// Entry 4 (AD-13 celebration bullet): `attachOverlays()` registers the exported singleton's removal
// callback with `overlays` (this module imports `overlays`, never the reverse). While attached the
// callback is the only caller of `done`, once, in a microtask after the removal: a run-driven end
// (finish, cap, `end()`, the empty-list `start()`) parks `done`, runs `onEnd` and closes the entry;
// back and Esc remove the entry first, so the callback takes the live run's `done`; Undo and New
// game (`cancelled`) drop it. Every removal stops the run internally, without `onEnd`. Unattached
// `createCelebration()` instances call `done` synchronously.
import type { Face, GameView } from '../../engine/index';
import { createVisibleBand } from '../gestures/visible-band';
import { cardMetrics } from '../layout/geometry';
import { celebrationCapMs, celebrationFadeMs } from '../motion';
import { type CelebrationRemoval, overlays } from '../overlays.svelte';
import { launch, type StepState, step } from './step';

/** The manual clock's sub-step. */
const MANUAL_STEP_MS = 16;

export type RunProps = {
  readonly groups: readonly (readonly Face[])[];
  readonly band: { left: number; top: number; width: number; height: number };
  readonly cardW: number;
};

type Run = {
  state: StepState;
  readonly props: RunProps;
  readonly manual: boolean;
  readonly done: () => void;
  last: number | null;
  /** Per group: opacity 0 was written and nothing since. */
  readonly hidden: boolean[];
  frame: number | null;
};

function find(selector: string): Element {
  const el = document.querySelector(selector);
  if (el === null) throw new Error(`AD-19 celebration: ${selector} missing`);
  return el;
}

/** The singleton's link to `overlays`: its removal callback, and whether `attachOverlays()` ran. */
type Attachment = {
  attached: boolean;
  removed: ((reason: CelebrationRemoval) => void) | null;
};

function build(attachment: Attachment | null) {
  let run: Run | null = null;
  /** Attached only: the `done` a run-driven end parked for the removal callback. */
  let pending: (() => void) | null = null;
  /** The active run's props: reactive, set and cleared with `run` (the step state stays plain). */
  let active = $state.raw<RunProps | null>(null);
  let handler: (() => void) | null = null;
  let manualNext = false;
  let remainder = 0;
  let elements: readonly HTMLElement[] = [];

  function clear(): Run | null {
    const current = run;
    run = null;
    active = null;
    remainder = 0;
    if (current !== null && current.frame !== null) cancelAnimationFrame(current.frame);
    return current;
  }

  function render(current: Run): void {
    if (elements.length === 0) return;
    const { groups } = current.state;
    if (elements.length !== groups.length) {
      throw new Error(`AD-19 celebration: ${elements.length} elements for ${groups.length} groups`);
    }
    for (const [i, group] of groups.entries()) {
      const el = elements[i] as HTMLElement;
      if (group.exited || group.opacity === 0) {
        // Hidden once, then no longer written (AD-19); a launch shows it again.
        if (!current.hidden[i]) {
          el.style.opacity = '0';
          current.hidden[i] = true;
        }
        continue;
      }
      current.hidden[i] = false;
      const x = group.x - group.w / 2;
      const y = group.y - group.h / 2;
      el.style.transform = `translate(${x}px, ${y}px) scale(${group.scale})`;
      el.style.opacity = String(group.opacity);
    }
  }

  function attached(): boolean {
    return attachment?.attached === true;
  }

  function finish(done: () => void): void {
    if (!attached()) {
      handler?.();
      done();
      return;
    }
    pending = done;
    handler?.();
    overlays.close('celebration');
  }

  // AD-13: the removal callback; the entry is already off the stack.
  function removed(reason: CelebrationRemoval): void {
    const live = clear();
    const done = pending ?? live?.done ?? null;
    pending = null;
    if (reason === 'cancelled') return;
    if (done === null) throw new Error('AD-19 celebration: ended removal with no done');
    queueMicrotask(done);
  }
  if (attachment !== null) attachment.removed = removed;

  function end(): void {
    const current = clear();
    if (current === null) return;
    finish(current.done);
  }

  function frame(current: Run, timestamp: number): void {
    if (run !== current) return;
    current.frame = null;
    const dt = current.last === null ? 0 : timestamp - current.last;
    current.last = timestamp;
    current.state = step(current.state, dt);
    render(current);
    if (current.state.finished) end();
    else current.frame = requestAnimationFrame((t) => frame(current, t));
  }

  return {
    /** The Celebration.svelte props of the active run, else `null`. */
    props(): RunProps | null {
      return active;
    },
    /** Celebration.svelte on mount (the group elements) and on destroy (`[]`). */
    register(next: readonly HTMLElement[]): void {
      elements = next;
    },
    start(view: GameView, done: () => void): void {
      if (run !== null) throw new Error('AD-19 celebration: start() while a run is active');
      if (attached() && overlays.top !== 'celebration') {
        throw new Error(`AD-19 celebration: start() while the top is ${overlays.top ?? 'nothing'}`);
      }
      const list = view.wordList;
      if (list === undefined) {
        throw new Error(
          'AD-19 celebration: start() needs a finished GameView (AD-3 wordList absent)',
        );
      }
      if (list.length === 0) {
        finish(done);
        return;
      }
      // AD-12 visible band: below the top bar and a shown dictionary banner, above the action bar.
      const { top: bandTop, bottom: bandBottom } = createVisibleBand(
        () => document.body,
      ).visibleBand();
      const width = document.documentElement.clientWidth;
      const cardW = Number.parseFloat(
        getComputedStyle(find('.board-root')).getPropertyValue('--wc-w'),
      );
      if (!(cardW > 0)) throw new Error('AD-19 celebration: --wc-w missing on .board-root');
      const origins = list.map((entry) => {
        find(`[data-testid="wordcell-${entry.cell}"]`);
        const rect = find(`[data-wordcell-label="${entry.cell}"]`).getBoundingClientRect();
        return {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2 - bandTop,
          letters: entry.cards.length,
        };
      });
      const state = launch({
        groups: origins,
        cardW,
        cardH: cardMetrics(cardW).H,
        floor: bandBottom - bandTop,
        ceiling: 0,
        walls: { left: 0, right: width },
        capMs: celebrationCapMs(),
        baseMs: celebrationFadeMs(),
      });
      const current: Run = {
        state,
        props: {
          groups: list.map((entry) => entry.cards.map((id) => view.faces[id] as Face)),
          band: { left: 0, top: bandTop, width, height: bandBottom - bandTop },
          cardW,
        },
        manual: manualNext,
        done,
        last: null,
        hidden: [],
        frame: null,
      };
      run = current;
      active = current.props;
      remainder = 0;
      if (!current.manual) current.frame = requestAnimationFrame((t) => frame(current, t));
    },
    end,
    /**
     * Clears the run and its pending frame; calls neither `onEnd` nor `done` (AD-19). Attached, it
     * throws while the entry is open: Undo and New game cancel through the entry's removal.
     */
    cancel(): void {
      if (attached() && overlays.isOpen('celebration')) {
        throw new Error('AD-19 celebration: cancel() while the celebration entry is open');
      }
      clear();
    },
    /** One handler, replaced by a later call, kept across runs. */
    onEnd(fn: () => void): void {
      handler = fn;
    },
    running(): boolean {
      return active !== null;
    },
    /** Read at `start`; throws while a run is active. */
    setManual(on: boolean): void {
      if (run !== null) throw new Error('AD-19 celebration: setManual() while a run is active');
      manualNext = on;
    },
    /** Manual clock: whole 16 ms steps, the remainder carried; one render; `end()` when finished. */
    advance(ms: number): void {
      if (!Number.isFinite(ms)) throw new Error(`AD-19 celebration: advance(${ms}) is not finite`);
      const current = run;
      if (current === null || !current.manual || ms <= 0) return;
      const total = remainder + ms;
      const steps = Math.floor(total / MANUAL_STEP_MS);
      remainder = total - steps * MANUAL_STEP_MS;
      for (let i = 0; i < steps; i++) {
        current.state = step(current.state, MANUAL_STEP_MS);
        if (current.state.finished) break;
      }
      render(current);
      if (current.state.finished) end();
    },
  };
}

export function createCelebration() {
  return build(null);
}

const attachment: Attachment = { attached: false, removed: null };

export const celebration = build(attachment);

/**
 * AD-13, AD-19: registers the singleton's removal callback with `overlays` (main.ts at boot). It
 * must be the app's only `onCelebrationRemoved` registration (main.ts at boot, entry 5): a later one
 * replaces this callback while the singleton stays attached. Tests register stubs only on a fresh
 * module.
 */
export function attachOverlays(): void {
  const removed = attachment.removed;
  if (removed === null) throw new Error('AD-19 celebration: attachOverlays() before the singleton');
  overlays.onCelebrationRemoved(removed);
  attachment.attached = true;
}
