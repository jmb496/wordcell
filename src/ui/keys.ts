// Epic 6 CAP-10 (6.10, Q-24, A-E7, F39; EXPERIENCE.md Keyboard): the one key handler, mounted from
// main.ts. This ticket owns the overlay and undo keys (`M`, `N`, `?`, `Esc`, `Z`, `Y` and the
// Ctrl/Cmd aliases) and the enablement gate; the board keys (1-8, arrows, 3-9/0, +/-, F, Space,
// Enter) plug into the same `ROWS` and gate in ticket 6.11. Validate, Confirm and Flip have their
// rows here (gate, run) but no key yet.
// A key that does not act does nothing at all: no act(), no view or peek close, no selection change,
// no preventDefault. A key that acts runs inside act() (AD-12): it cancels a drag and clears a tile
// selection (the phase-changing rows' clearTile call site, epic 5 CAP-4) before its row runs, and
// the row closes a sticky view first (commands.ts, openSurface). Acting keys (Undo, Redo, M, N, ?)
// that arrive while a pop is pending wait for it and are then evaluated, on the then-current
// GameView and overlay state; every other key, Esc included, is dropped. Matching is on
// `event.key`, letters case-insensitive; only the Z/Y aliases take Ctrl/Cmd, Ctrl/Cmd+Shift+Z is
// Redo before plain Z.
import type { GameView } from '../engine/index';
import { dictionary } from '../shell/dictionary.svelte';
import { game } from '../shell/game.svelte';
import { nav } from '../shell/nav';
import { act } from './act';
import { confirm, flip, redo, undo, validate } from './commands';
import { newGame, requestNewGame } from './new-game';
import { openSurface } from './open-surface';
import { overlays, SUSPENDING } from './overlays.svelte';

export type CommandId =
  | 'undo'
  | 'redo'
  | 'validate'
  | 'confirm'
  | 'flip'
  | 'menu'
  | 'newGame'
  | 'howToPlay';

type Row = {
  /** The control's enablement (Undo, Redo, Validate, Confirm, Flip) or `true` (a surface key). */
  readonly gate: (view: GameView) => boolean;
  /** Ignores `event.repeat`; Undo and Redo repeat while held. */
  readonly single: boolean;
  readonly run: (view: GameView) => void;
};

/** AD-3: the gates read `GameView` flags, combined only with the dictionary state (AD-8). */
export const ROWS: Readonly<Record<CommandId, Row>> = {
  undo: { gate: (view) => view.canUndo, single: false, run: undo },
  redo: { gate: (view) => view.canRedo, single: false, run: redo },
  validate: {
    gate: (view) => view.canValidate && dictionary.state === 'ready',
    single: true,
    run: validate,
  },
  confirm: { gate: (view) => view.canConfirm, single: true, run: confirm },
  flip: { gate: (view) => view.canFlip, single: true, run: flip },
  menu: { gate: () => true, single: true, run: () => openSurface('menu') },
  // CAP-3: a confirm while a game is in progress, else New game acts at once.
  newGame: { gate: () => true, single: true, run: (view) => void requestNewGame(view) },
  howToPlay: { gate: () => true, single: true, run: () => openSurface('howToPlay') },
};

/** The commands a key waits for a pending pop to run (they touch history). */
const WAITS: readonly CommandId[] = ['undo', 'redo', 'menu', 'newGame', 'howToPlay'];

type Key = CommandId | 'escape';

function match(event: KeyboardEvent): Key | undefined {
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  const mod = event.ctrlKey || event.metaKey;
  if (key === 'z' || key === 'y') {
    if (event.altKey) return undefined;
    if (key === 'y') return 'redo';
    return mod && event.shiftKey ? 'redo' : 'undo';
  }
  if (mod || event.altKey) return undefined;
  switch (key) {
    case 'm':
      return 'menu';
    case 'n':
      return 'newGame';
    case '?':
      return 'howToPlay';
    case 'Escape':
      return 'escape';
    default:
      return undefined;
  }
}

/** Runs one command now if it acts; returns whether it did. */
function attempt(id: CommandId): boolean {
  const kind = game.state.kind;
  if (SUSPENDING.some((entry) => overlays.isOpen(entry))) return false;
  if (kind === 'rejected') {
    if (id !== 'newGame') return false;
    act(newGame)();
    return true;
  }
  const view = game.view;
  if (kind !== 'active' || view === undefined) return false;
  const row = ROWS[id];
  if (!row.gate(view)) return false;
  act(() => row.run(view))();
  return true;
}

/** Esc: the topmost overlay entry, else a tile selection, else nothing. Returns whether it acted. */
function pressEscape(): boolean {
  if (game.state.kind === 'halted') return false;
  const top = overlays.top;
  if (top === undefined) {
    if (overlays.tileSelection === null) return false;
    act(() => overlays.clearTile())();
    return true;
  }
  act(() => {
    if (top === 'tailSelection') overlays.deselect();
    else if (top === 'endSheet') overlays.collapseEndSheet();
    else overlays.close(top);
  })();
  return true;
}

export function onKeyDown(event: KeyboardEvent): void {
  if (event.defaultPrevented) return;
  const key = match(event);
  if (key === undefined) return;
  if (key === 'escape') {
    if (!event.repeat && nav.settled() && pressEscape()) event.preventDefault();
    return;
  }
  if (ROWS[key].single && event.repeat) return;
  if (nav.settled()) {
    if (attempt(key)) event.preventDefault();
    return;
  }
  // Pending pop: a repeat is dropped (a held Z queues one undo, not a burst); the waiter is
  // evaluated at settle, so nothing is default-prevented for a key that may not act.
  if (!WAITS.includes(key) || event.repeat) return;
  nav.whenSettled(() => void attempt(key));
}

/** Mounts the handler on `target` (the window); returns the unmount. */
export function installKeys(target: Pick<Window, 'addEventListener' | 'removeEventListener'>) {
  target.addEventListener('keydown', onKeyDown);
  return () => target.removeEventListener('keydown', onKeyDown);
}
