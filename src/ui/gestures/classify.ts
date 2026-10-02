// AD-12 press classification (EXPERIENCE.md Pointer thresholds), pure: the controller feeds it the
// press target resolved at pointerdown (WordCell emptiness from `game.view`, AD-3), moves, the
// long-press timer firing and the release. Drag latches at the first move ≥ DRAG_PX from the down
// point, only while pending; the long-press fires only on WordCells, only while pending, and after
// it no drag; an empty WordCell's long-press releases as a tap.

export const DRAG_PX = 8;
export const LONG_PRESS_MS = 400;

export type PressTarget = 'column' | 'wordcell' | 'emptyWordcell' | 'other';

export type PressState = {
  readonly kind: 'pending' | 'drag' | 'longPress';
  readonly target: PressTarget;
  /** The pointerdown point. */
  readonly x: number;
  readonly y: number;
};

export type PressEvent =
  | { readonly type: 'move'; readonly x: number; readonly y: number }
  | { readonly type: 'timer' }
  | { readonly type: 'up' };

export type PressOutcome = 'tap' | 'drag' | 'longPress';

/** AD-12: only WordCell presses start the long-press timer. */
export function longPressTimed(target: PressTarget): boolean {
  return target === 'wordcell' || target === 'emptyWordcell';
}

export function start(target: PressTarget, x: number, y: number): PressState {
  return { kind: 'pending', target, x, y };
}

export function classify(state: PressState, event: PressEvent): PressState | PressOutcome {
  switch (event.type) {
    case 'move':
      if (state.kind !== 'pending') return state;
      return Math.hypot(event.x - state.x, event.y - state.y) >= DRAG_PX
        ? { ...state, kind: 'drag' }
        : state;
    case 'timer':
      if (state.kind !== 'pending' || !longPressTimed(state.target)) return state;
      return { ...state, kind: 'longPress' };
    case 'up':
      if (state.kind === 'pending') return 'tap';
      if (state.kind === 'longPress' && state.target === 'emptyWordcell') return 'tap';
      return state.kind;
  }
}
