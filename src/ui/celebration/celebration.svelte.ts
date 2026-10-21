// AD-19 (R-87): the win celebration's run controller, the only owner of the run data. Unmounted and
// untriggered until entries 4-8 wire it (overlay entry, end sheet, skip). `start` measures once;
// frames then step the pure `step.ts` state and write `transform`/opacity straight to the group
// elements Celebration.svelte registered (rule 3, no reactive per-frame state). Two drivers: real
// rAF, and a manual clock (`setManual`, `advance`) for Playwright (AD-17).
import type { Face, GameView } from '../../engine/index';
import { prefs } from '../../shell/prefs.svelte';
import { cardMetrics } from '../layout/geometry';
import { celebrationCapMs } from '../motion';
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

export function createCelebration() {
  let run: Run | null = null;
  let handler: (() => void) | null = null;
  let manualNext = false;
  let remainder = 0;
  let elements: readonly HTMLElement[] = [];

  function clear(): Run | null {
    const current = run;
    run = null;
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

  function finish(done: () => void): void {
    handler?.();
    done();
  }

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
      return run === null ? null : run.props;
    },
    /** Celebration.svelte on mount (the group elements) and on destroy (`[]`). */
    register(next: readonly HTMLElement[]): void {
      elements = next;
    },
    start(view: GameView, done: () => void): void {
      if (run !== null) throw new Error('AD-19 celebration: start() while a run is active');
      const list = view.wordList;
      if (list === undefined || list.length === 0) {
        finish(done);
        return;
      }
      const bandTop = find('[data-band="topBar"]').getBoundingClientRect().bottom;
      const bandBottom = find('[data-band="actionBar"]').getBoundingClientRect().top;
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
        baseMs: prefs.motion.baseMs,
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
      remainder = 0;
      if (!current.manual) current.frame = requestAnimationFrame((t) => frame(current, t));
    },
    end,
    /** Clears the run and its pending frame; calls neither `onEnd` nor `done` (AD-19). */
    cancel(): void {
      clear();
    },
    /** One handler, replaced by a later call, kept across runs. */
    onEnd(fn: () => void): void {
      handler = fn;
    },
    running(): boolean {
      return run !== null;
    },
    /** Read at `start`; throws while a run is active. */
    setManual(on: boolean): void {
      if (run !== null) throw new Error('AD-19 celebration: setManual() while a run is active');
      manualNext = on;
    },
    /** Manual clock: whole 16 ms steps, the remainder carried; one render; `end()` when finished. */
    advance(ms: number): void {
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

export const celebration = createCelebration();
