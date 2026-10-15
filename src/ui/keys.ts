// Epic 6 CAP-10 (6.10, 6.11, Q-24, A-E7, F39; EXPERIENCE.md Keyboard): the one key handler, mounted
// from main.ts. 6.10 owns the overlay and undo keys (`M`, `N`, `?`, `Esc`, `Z`, `Y` and the Ctrl/Cmd
// aliases) and the enablement gate; 6.11 adds the board keys to the same `ROWS`, gate and
// `attempt()`: `1`-`8` (Idle), `↑`/`↓`, `3`-`9`/`0` (Composing, Place), `←`/`→`, `Shift`+`←`/`→`,
// `Space`, `Enter`, `+`/`=`/`-` and `F`. Parametric and focus-dependent keys carry a `KeyContext`
// (the digit, the direction, what holds focus: focus-target.ts) into their gate and run.
// A key that does not act does nothing at all: no act(), no view or peek close, no selection change,
// no preventDefault. A key that acts runs inside act() (AD-12) when its row `changesPhase`: it
// cancels a drag and clears a tile selection before its row runs, and the row closes a sticky view
// first (commands.ts, openSurface). The other rows (`1`-`8`, `↑`/`↓`, tile and card activation, the
// focus moves) keep a tile selection that select, swap and return need, so they cancel a drag
// themselves (the controller's key-activation entry or `cancelGesture()`), never `clearTile()`.
// Acting keys that touch history (Undo, Redo, M, N, ?, `1`-`8`, `↑`/`↓`, the view-opening and
// selecting `Space`/`Enter`) that arrive while a pop is pending wait for it and are then
// evaluated, on the then-current GameView, overlay state and focus; every other key, Esc included,
// is dropped. Matching is on `event.key`, letters case-insensitive; only the Z/Y aliases take
// Ctrl/Cmd, Ctrl/Cmd+Shift+Z is Redo before plain Z. Shift is ignored for `+`/`=` and allowed for
// letters; a Shift chord with no row is a no-op. `Enter` and `Space` with a native control focused
// (a button) belong to that control.
import { tick } from 'svelte';
import type { CardId, Command, GameView } from '../engine/index';
import { dictionary } from '../shell/dictionary.svelte';
import { game } from '../shell/game.svelte';
import { nav } from '../shell/nav';
import { act, activateHit, cancelGesture } from './act';
import { confirm, edit, flip, redo, setK, undo, validate } from './commands';
import { afterRemoval, focusBoard, focusCard } from './focus-board';
import { type FocusTarget, liveTiles, readFocus } from './focus-target';
import { type Hit, tapAction } from './gestures/intent';
import { KEY_LABELS } from './key-labels';
import { newGame, requestNewGame } from './new-game';
import { openSurface } from './open-surface';
import { overlays, SUSPENDING } from './overlays.svelte';

export type CommandId =
  | 'undo'
  | 'redo'
  | 'validate'
  | 'confirm'
  | 'flip'
  | 'k+'
  | 'k-'
  | 'menu'
  | 'newGame'
  | 'howToPlay'
  | 'column'
  | 'tailUp'
  | 'tailDown'
  | 'cell'
  | 'focusMove'
  | 'tileMove'
  | 'tap'
  | 'view';

/** What a parametric or focus-dependent key carries into its gate and run. */
export type KeyContext = {
  /** `1`-`8` (a column) or `3`-`9`, `0` = 10 (a WordCell); 0 for the other keys. */
  readonly digit: number;
  /** -1 for `←`, 1 for `→`; 0 for the other keys. */
  readonly dir: -1 | 0 | 1;
  /** What holds keyboard focus when the key is pressed. */
  readonly focus: FocusTarget;
};

type Row = {
  /** The control's enablement (Undo, Redo, Validate, Confirm, Flip, `−`, `+`) or the phase column. */
  readonly gate: (view: GameView, ctx: KeyContext) => boolean;
  /** Ignores `event.repeat`; Undo and Redo repeat while held. */
  readonly single: boolean;
  readonly run: (view: GameView, ctx: KeyContext) => void;
  /** The key as the EXPERIENCE.md Keyboard table (and a tooltip, key-labels.ts) names it. */
  readonly label: string;
  /**
   * True: the row runs inside act() (cancel, clearTile, then the row). False: the row keeps the
   * tile selection and the tail selection and cancels a drag itself.
   */
  readonly changesPhase: boolean;
  /** Narrows `WAITS`: whether this press touches history, so it waits for a pending pop. */
  readonly touchesHistory?: (view: GameView, ctx: KeyContext) => boolean;
};

const playing = (view: GameView): boolean => view.status === 'playing';
const composing = (view: GameView): boolean => playing(view) && view.phase === 'composing';
const place = (view: GameView): boolean => playing(view) && view.phase === 'place';
const idle = (view: GameView): boolean => playing(view) && view.phase === 'idle';

function required<T>(value: T | undefined, what: string): T {
  if (value === undefined) throw new Error(`AD-3 ${what} missing from the GameView`);
  return value;
}

/** A card, tile or WordCell hit for the focused element, or undefined when it has none. */
function focusHit(focus: FocusTarget): Hit | undefined {
  switch (focus.kind) {
    case 'column':
      return { kind: 'card', column: focus.column, card: focus.card };
    case 'tile':
      return { kind: 'tile', card: focus.card };
    case 'cell':
      return { kind: 'wordcell', cell: focus.cell };
    default:
      return undefined;
  }
}

/** The hit `1`-`8` stands for: the column's bottom card, or its foot while a tail is selected. */
function columnHit(view: GameView, n: number): Hit | undefined {
  const entry = view.columns.find((column) => column.column === n);
  if (entry === undefined) return undefined;
  if (overlays.selection !== null) return { kind: 'space', column: n, foot: true };
  const bottom = entry.cards.at(-1);
  return bottom === undefined ? undefined : { kind: 'card', column: n, card: bottom };
}

/** The card `↑` (-1) or `↓` (+1) re-selects the tail from, by the tap on it. */
function tailHit(view: GameView, step: -1 | 1): Hit | undefined {
  const selection = overlays.selection;
  if (selection === null || !idle(view)) return undefined;
  if (step === 1 && selection.count <= 1) return undefined;
  const entry = view.columns.find((column) => column.column === selection.column);
  const card = entry?.cards[entry.cards.length - selection.count + step];
  return card === undefined ? undefined : { kind: 'card', column: selection.column, card };
}

/** Whether the tap on `hit` acts (the `GameView` flags behind `tapAction`); never throws. */
function tapActs(view: GameView, hit: Hit | undefined): boolean {
  if (hit === undefined || overlays.top === 'endSheet') return false;
  return tapAction(hit, view, overlays.selection, overlays.top).kind !== 'none';
}

/** After the DOM update: focus the selected tail's top card (EXPERIENCE.md Keyboard). */
function focusTailTop(): void {
  void tick().then(() => {
    const selection = overlays.selection;
    const view = game.view;
    if (selection === null || view === undefined) return;
    const entry = view.columns.find((column) => column.column === selection.column);
    const top = entry?.cards[entry.cards.length - selection.count];
    if (top !== undefined) focusCard(top);
  });
}

/**
 * The focus move to run after the DOM update of a tile tap: stay on `card`, or on its replacement
 * when the tap removed it (the next tile, the previous one if it was last, else the board).
 */
function tileFocusPlan(card: CardId, place: 'tray' | 'strip'): () => void {
  const before = liveTiles(place);
  return () => {
    const next = afterRemoval(card, before, liveTiles(place));
    if (next === null) focusBoard();
    else focusCard(next);
  };
}

function stepOrder(order: readonly CardId[], card: CardId, dir: number): CardId[] | undefined {
  const at = order.indexOf(card);
  const to = at + dir;
  if (at < 0 || to < 0 || to >= order.length) return undefined;
  const next = [...order];
  next[at] = order[to] as CardId;
  next[to] = card;
  return next;
}

/** The reorder command `Shift`+`←`/`→` stands for on the focused tile, or undefined at an end. */
function moveCommand(view: GameView, ctx: KeyContext): Command | undefined {
  if (ctx.focus.kind !== 'tile') return undefined;
  if (composing(view)) {
    const next = stepOrder(required(view.draft, 'draft').arrangement, ctx.focus.card, ctx.dir);
    return next === undefined ? undefined : { type: 'arrange', arrangement: next };
  }
  if (place(view)) {
    const next = stepOrder(required(view.place, 'place').placementOrder, ctx.focus.card, ctx.dir);
    return next === undefined ? undefined : { type: 'setPlacementOrder', order: next };
  }
  return undefined;
}

/** The live tiles of the phase: `draft.arrangement` in Composing, `placementOrder` in Place. */
function liveOrder(view: GameView): readonly CardId[] {
  if (composing(view)) return required(view.draft, 'draft').arrangement;
  return place(view) ? required(view.place, 'place').placementOrder : [];
}

function cellOf(view: GameView, n: number) {
  return view.cells.find((cell) => cell.cell === n);
}

/** AD-3: the gates read `GameView` flags, combined only with the dictionary state (AD-8). */
export const ROWS: Readonly<Record<CommandId, Row>> = {
  undo: {
    gate: (view) => view.canUndo,
    single: false,
    run: undo,
    label: KEY_LABELS.undo,
    changesPhase: true,
  },
  redo: {
    gate: (view) => view.canRedo,
    single: false,
    run: redo,
    label: KEY_LABELS.redo,
    changesPhase: true,
  },
  validate: {
    gate: (view) => view.canValidate && dictionary.state === 'ready',
    single: true,
    run: validate,
    label: KEY_LABELS.validate,
    changesPhase: true,
  },
  confirm: {
    gate: (view) => view.canConfirm,
    single: true,
    run: confirm,
    label: KEY_LABELS.confirm,
    changesPhase: true,
  },
  flip: {
    gate: (view) => view.canFlip,
    single: true,
    run: flip,
    label: KEY_LABELS.flip,
    changesPhase: true,
  },
  // R-31: `+` and `-` mirror the D-block buttons; an empty destination column leaves both false.
  'k+': {
    gate: (view) => view.canIncK,
    single: true,
    run: (view) => setK(required(view.draft, 'draft').k + 1),
    label: KEY_LABELS['k+'],
    changesPhase: true,
  },
  'k-': {
    gate: (view) => view.canDecK,
    single: true,
    run: (view) => setK(required(view.draft, 'draft').k - 1),
    label: KEY_LABELS['k-'],
    changesPhase: true,
  },
  menu: {
    gate: () => true,
    single: true,
    run: () => openSurface('menu'),
    label: KEY_LABELS.menu,
    changesPhase: true,
  },
  // CAP-3: a confirm while a game is in progress, else New game acts at once.
  newGame: {
    gate: () => true,
    single: true,
    run: (view) => void requestNewGame(view),
    label: KEY_LABELS.newGame,
    changesPhase: true,
  },
  howToPlay: {
    gate: () => true,
    single: true,
    run: () => openSurface('howToPlay'),
    label: KEY_LABELS.howToPlay,
    changesPhase: true,
  },
  // Idle: select the bottom card of column n, or drop the selected tail on it (n = its source column
  // is the `Here` drop); an empty column with nothing selected is a no-op (R-14 via the flags).
  column: {
    gate: (view, ctx) => idle(view) && tapActs(view, columnHit(view, ctx.digit)),
    single: true,
    run: (view, ctx) => {
      activateHit(required(columnHit(view, ctx.digit), 'column hit'));
      focusTailTop();
    },
    label: '1-8',
    changesPhase: false,
    touchesHistory: () => true,
  },
  tailUp: {
    gate: (view) => tapActs(view, tailHit(view, -1)),
    single: true,
    run: (view) => {
      activateHit(required(tailHit(view, -1), 'tail hit'));
      focusTailTop();
    },
    label: '\u2191',
    changesPhase: false,
    touchesHistory: () => true,
  },
  tailDown: {
    gate: (view) => tapActs(view, tailHit(view, 1)),
    single: true,
    run: (view) => {
      activateHit(required(tailHit(view, 1), 'tail hit'));
      focusTailTop();
    },
    label: '\u2193',
    changesPhase: false,
    touchesHistory: () => true,
  },
  // Composing: add the cell's top card as a free letter (focus follows the new tile); Place: set
  // the cell as the target. Used, empty and illegal cells, and the current target, are no-ops.
  cell: {
    gate: (view, ctx) => {
      const cell = cellOf(view, ctx.digit);
      if (cell === undefined) return false;
      if (composing(view)) return cell.canAddFreeLetter;
      return place(view) && cell.canSetTarget;
    },
    single: true,
    run: (view, ctx) => {
      const cell = required(cellOf(view, ctx.digit), 'cell');
      if (view.phase === 'place') {
        edit({ type: 'setTarget', cell: cell.cell });
        return;
      }
      const card = required(cell.cards.at(-1), 'cell top card');
      edit({ type: 'addFreeLetter', cell: cell.cell });
      void tick().then(() => focusCard(card));
    },
    label: '3-9, 0',
    changesPhase: true,
  },
  // `←`/`→` move focus along the tray or the strip (no wrap, a tile selection stays).
  focusMove: {
    gate: (_view, ctx) =>
      ctx.focus.kind === 'tile' && (ctx.dir < 0 ? ctx.focus.left : ctx.focus.right) !== null,
    single: true,
    run: (_view, ctx) => {
      if (ctx.focus.kind !== 'tile') throw new Error('AD-12 focusMove without a focused tile');
      cancelGesture();
      const next = ctx.dir < 0 ? ctx.focus.left : ctx.focus.right;
      focusCard(required(next ?? undefined, 'neighbour'));
    },
    label: '\u2190 \u2192',
    changesPhase: false,
  },
  // `Shift`+`←`/`→` move the focused tile (or strip card) one place; focus stays on it.
  tileMove: {
    gate: (view, ctx) => moveCommand(view, ctx) !== undefined,
    single: true,
    run: (view, ctx) => {
      if (ctx.focus.kind !== 'tile') throw new Error('AD-12 tileMove without a focused tile');
      const card = ctx.focus.card;
      edit(required(moveCommand(view, ctx), 'move command'));
      void tick().then(() => focusCard(card));
    },
    label: 'Shift+\u2190 \u2192',
    changesPhase: true,
  },
  // `Space` on a tile or card, `Space`/`Enter` on a column card, `Enter` on a WordCell: the tap on
  // the focused element through the controller's key-activation entry.
  tap: {
    gate: (view, ctx) => {
      const hit = focusHit(ctx.focus);
      if (hit?.kind === 'tile') {
        return overlays.top !== 'endSheet' && liveOrder(view).includes(hit.card);
      }
      return tapActs(view, hit);
    },
    single: true,
    run: (view, ctx) => {
      const hit = required(focusHit(ctx.focus), 'focus hit');
      let after: (() => void) | undefined;
      if (hit.kind === 'tile' && ctx.focus.kind === 'tile') {
        after = tileFocusPlan(ctx.focus.card, ctx.focus.place);
      } else if (hit.kind === 'wordcell' && composing(view)) {
        const card = cellOf(view, hit.cell)?.cards.at(-1);
        if (card !== undefined) after = () => void focusCard(card);
      }
      activateHit(hit);
      if (after !== undefined) void tick().then(after);
    },
    label: 'Space / Enter',
    changesPhase: false,
    touchesHistory: (view, ctx) => ctx.focus.kind !== 'tile' && view.phase === 'idle',
  },
  // `Space` on a WordCell opens the sticky view in every phase (a tail selection is popped first);
  // with a tail selected and the cell empty it only deselects.
  // The close-view, deselect, closePeek, openView sequence mirrors Controller.activate
  // (gestures/controller.ts) and must change with it.
  view: {
    gate: (view, ctx) => {
      if (ctx.focus.kind !== 'cell' || overlays.top === 'endSheet') return false;
      const cell = cellOf(view, ctx.focus.cell);
      return cell !== undefined && (cell.cards.length > 0 || overlays.selection !== null);
    },
    single: true,
    run: (view, ctx) => {
      if (ctx.focus.kind !== 'cell') throw new Error('AD-12 view key without a focused cell');
      const cell = required(cellOf(view, ctx.focus.cell), 'cell');
      // An open sticky view sits above a tail selection (AD-13): close it before deselecting.
      if (overlays.viewCell !== null) overlays.close('wordcellView');
      overlays.deselect();
      if (cell.cards.length === 0) return;
      if (overlays.peek !== null) overlays.closePeek();
      overlays.closeHoverPeek();
      overlays.openView(cell.cell);
    },
    label: 'Space',
    changesPhase: true,
  },
};

/** The commands a key waits for a pending pop to run (they touch history). */
const WAITS: readonly CommandId[] = [
  'undo',
  'redo',
  'menu',
  'newGame',
  'howToPlay',
  'column',
  'tailUp',
  'tailDown',
  'tap',
  'view',
];

function waits(id: CommandId, ctx: KeyContext): boolean {
  if (!WAITS.includes(id)) return false;
  const view = game.view;
  const narrow = ROWS[id].touchesHistory;
  return narrow === undefined || view === undefined || narrow(view, ctx);
}

type Key = CommandId | 'escape';
type Resolved = { readonly id: Key; readonly ctx: KeyContext };

const NO_FOCUS: FocusTarget = { kind: 'board' };
const plain = (id: Key): Resolved => ({ id, ctx: { digit: 0, dir: 0, focus: NO_FOCUS } });

/** `1`-`8` select in Idle, `3`-`9`/`0` act on a WordCell in Composing and Place. */
function digitKey(key: string): Resolved | undefined {
  const view = game.view;
  if (view === undefined) return undefined;
  const digit = Number(key);
  const ctx = (n: number): KeyContext => ({ digit: n, dir: 0, focus: NO_FOCUS });
  if (view.phase === 'idle')
    return digit >= 1 && digit <= 8 ? { id: 'column', ctx: ctx(digit) } : undefined;
  const n = digit === 0 ? 10 : digit;
  return n >= 3 ? { id: 'cell', ctx: ctx(n) } : undefined;
}

function match(event: KeyboardEvent): Resolved | undefined {
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  const mod = event.ctrlKey || event.metaKey;
  if (key === 'z' || key === 'y') {
    if (event.altKey) return undefined;
    if (key === 'y') return plain('redo');
    return plain(mod && event.shiftKey ? 'redo' : 'undo');
  }
  if (mod || event.altKey) return undefined;
  if (key >= '0' && key <= '9') return digitKey(key);
  switch (key) {
    case 'm':
      return plain('menu');
    case 'n':
      return plain('newGame');
    case '?':
      return plain('howToPlay');
    case 'f':
      return plain('flip');
    case '+':
    case '=':
      return plain('k+');
    case '-':
      return plain('k-');
    case 'Escape':
      return plain('escape');
    case 'ArrowUp':
    case 'ArrowDown':
      return event.shiftKey ? undefined : plain(key === 'ArrowUp' ? 'tailUp' : 'tailDown');
    case 'ArrowLeft':
    case 'ArrowRight': {
      const dir = key === 'ArrowLeft' ? -1 : 1;
      return {
        id: event.shiftKey ? 'tileMove' : 'focusMove',
        ctx: { digit: 0, dir, focus: readFocus() },
      };
    }
    case ' ':
    case 'Enter': {
      if (event.shiftKey) return undefined;
      const focus = readFocus();
      const ctx: KeyContext = { digit: 0, dir: 0, focus };
      if (focus.kind === 'control') return undefined;
      if (key === ' ') {
        if (focus.kind === 'column' || focus.kind === 'tile') return { id: 'tap', ctx };
        return focus.kind === 'cell' ? { id: 'view', ctx } : undefined;
      }
      if (focus.kind === 'column' || focus.kind === 'cell') return { id: 'tap', ctx };
      const view = game.view;
      if (view === undefined) return undefined;
      if (composing(view)) return { id: 'validate', ctx };
      return place(view) ? { id: 'confirm', ctx } : undefined;
    }
    default:
      return undefined;
  }
}

/** Runs one command now if it acts; returns whether it did. */
function attempt(id: CommandId, ctx: KeyContext): boolean {
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
  if (!row.gate(view, ctx)) return false;
  if (row.changesPhase) act(() => row.run(view, ctx))();
  else row.run(view, ctx);
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
  const resolved = match(event);
  if (resolved === undefined) return;
  const { id, ctx } = resolved;
  if (id === 'escape') {
    if (!event.repeat && nav.settled() && pressEscape()) event.preventDefault();
    return;
  }
  if (ROWS[id].single && event.repeat) return;
  if (nav.settled()) {
    if (attempt(id, ctx)) event.preventDefault();
    return;
  }
  // Pending pop: a repeat is dropped (a held Z queues one undo, not a burst); the waiter is
  // evaluated at settle, on the then-current focus too, so nothing is default-prevented for a key
  // that may not act.
  if (event.repeat || !waits(id, ctx)) return;
  nav.whenSettled(() => {
    const again = match(event);
    if (again !== undefined && again.id === id) void attempt(id, again.ctx);
  });
}

/** Mounts the handler on `target` (the window); returns the unmount. */
export function installKeys(target: Pick<Window, 'addEventListener' | 'removeEventListener'>) {
  target.addEventListener('keydown', onKeyDown);
  return () => target.removeEventListener('keydown', onKeyDown);
}
