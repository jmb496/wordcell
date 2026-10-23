// AD-13 overlays store (SPEC E3, epic 4 CAP-5): the single owner of the ordered stack of open
// entries (surfaces, the tail selection, the sticky WordCell view and the expanded end sheet), of
// the end sheet's `hidden | collapsed | expanded`, and of the entry-less peek and hover peek.
// Entry pushes and pops go through nav; `close` is top-down only and pops one; `closedByBack`
// (nav's close callback) removes every entry deeper than the back's depth, topmost first, and
// never calls nav. Removing an entry by any path applies its effect: `tailSelection` clears the
// selection, `wordcellView` clears the view cell, `endSheet` collapses the sheet.
// `resetForNewSession()` (New game, AD-4) kills the deferred end-sheet token, closes every entry
// top-down and clears the rest. Invalid-state calls throw `AD-13 …` (rule 6); only CAP-5's named
// no-ops are no-ops. DispatchResult finished/unfinished is wired in src/ui/end-sheet.ts (ticket 6.6).
// Tile selection (epic 5 SPEC CAP-4, F1): one tray or strip tile `CardId` beside the tail selection,
// with no entry (back ignores it, nav is never called); `selectTile` throws while a tile or tail
// selection is set, `clearTile` is a no-op with none; `resetForNewSession()` clears it.
// Win celebration (AD-13 celebration bullet, AD-19): `startCelebration()` pushes the `celebration`
// entry; its removal records why (`ended` by `close`, `closedByBack` and Esc; `cancelled` by
// `onUnfinished()` and `resetForNewSession()`) and calls the one callback registered through
// `onCelebrationRemoved` (celebration.svelte.ts, which imports this module, never the reverse).
import type { CardId } from '../engine/index';
import { nav } from '../shell/nav';

export type OverlayId =
  | 'historyNotice'
  | 'resetConfirm'
  | 'menu'
  | 'statistics'
  | 'preferences'
  | 'howToPlay'
  | 'newGameConfirm'
  | 'replayConfirm'
  | 'tailSelection'
  | 'wordcellView'
  | 'endSheet'
  | 'celebration';
/** AD-13: why the `celebration` entry was removed, set by the calling path. */
export type CelebrationRemoval = 'ended' | 'cancelled';
export type EndSheetState = 'hidden' | 'collapsed' | 'expanded';
export type TailSelection = { readonly column: number; readonly count: number };

const OWN_OPERATION: readonly OverlayId[] = [
  'tailSelection',
  'wordcellView',
  'endSheet',
  'celebration',
];
const MODAL_TOP: readonly OverlayId[] = [
  'celebration',
  'historyNotice',
  'resetConfirm',
  'endSheet',
  'menu',
  'statistics',
  'preferences',
  'howToPlay',
  'newGameConfirm',
  'replayConfirm',
];

// Epic 6 CAP-1 (6.1): the legal top entries (`undefined` = an empty stack) under which each of
// the six new ids, and resetConfirm, may open. A confirm opens only after the menu closed, never
// over it; only resetConfirm stacks on historyNotice (SPEC F8). tailSelection, wordcellView and a
// peek are never legal tops.
const PANELS: readonly OverlayId[] = ['statistics', 'preferences', 'howToPlay'];
const LEGAL_TOPS: Partial<Record<OverlayId, readonly (OverlayId | undefined)[]>> = {
  menu: [undefined, 'endSheet'],
  statistics: [undefined, 'endSheet'],
  preferences: [undefined, 'endSheet'],
  howToPlay: [undefined, 'endSheet'],
  newGameConfirm: [undefined, 'endSheet', ...PANELS],
  replayConfirm: [undefined, 'endSheet', ...PANELS],
  resetConfirm: ['historyNotice', 'statistics', 'endSheet'],
};
// Epic 6 CAP-10: the entries under which `main` is inert and the game keys are suspended (only
// Tab, Enter, Space and Esc act), and focus-follow yields. The expanded end sheet and the WordCell
// view are not in the list. `celebration` (AD-13) has two exceptions: `main` is not inert under it
// (App.svelte `mainInert`), and keys.ts `attempt()` still runs the `undo` and `newGame` rows
// (EXPERIENCE.md Win celebration, "Keys while it runs").
export const SUSPENDING: readonly OverlayId[] = [
  'celebration',
  'historyNotice',
  'resetConfirm',
  'menu',
  'statistics',
  'preferences',
  'howToPlay',
  'newGameConfirm',
  'replayConfirm',
];
const NEW_SURFACES: readonly OverlayId[] = [
  'menu',
  'statistics',
  'preferences',
  'howToPlay',
  'newGameConfirm',
  'replayConfirm',
];

let stack = $state.raw<readonly OverlayId[]>([]);
let selection = $state.raw<TailSelection | null>(null);
let endSheet = $state<EndSheetState>('hidden');
let peek = $state<number | null>(null);
let viewCell = $state<number | null>(null);
let hoverPeek = $state<number | null>(null);
let tileSelection = $state<CardId | null>(null);
// Epic 6 CAP-4 (6.7, owner 2026-10-15): the finished game's score was not recorded because the
// history was reset while its end sheet was open. UI-only: cleared by Undo and a new session,
// never stored, so a reload drops it.
let unrecordedFinish = $state(false);
let liveToken: number | null = null;
let lastToken = 0;
let celebrationRemoved: ((reason: CelebrationRemoval) => void) | null = null;

function isInt(value: number, min: number, max: number): boolean {
  return Number.isInteger(value) && value >= min && value <= max;
}

function checkCell(op: string, cell: number): void {
  if (!isInt(cell, 3, 10)) throw new Error(`AD-13 ${op}(${cell}): cell out of range`);
}

function checkNoModalTop(op: string): void {
  const top = stack.at(-1);
  if (top !== undefined && MODAL_TOP.includes(top))
    throw new Error(`AD-13 ${op} while ${top} is the top entry`);
}

function push(id: OverlayId): void {
  stack = [...stack, id];
  nav.push();
}

function removeTop(reason: CelebrationRemoval): void {
  const top = stack.at(-1);
  const removed = celebrationRemoved;
  if (top === 'celebration' && removed === null) {
    throw new Error('AD-13 celebration removed with no removal callback');
  }
  stack = stack.slice(0, -1);
  if (top === 'tailSelection') selection = null;
  else if (top === 'wordcellView') viewCell = null;
  else if (top === 'endSheet') endSheet = 'collapsed';
  else if (top === 'celebration') removed?.(reason);
}

function open(id: OverlayId): void {
  if (OWN_OPERATION.includes(id))
    throw new Error(`AD-13 open(${id}) while it has its own operation`);
  if (stack.includes(id)) throw new Error(`AD-13 open(${id}) while it is open`);
  const legal = LEGAL_TOPS[id];
  if (legal !== undefined) {
    const top = stack.at(-1);
    if (!legal.includes(top)) {
      throw new Error(
        top === undefined
          ? `AD-13 open(${id}) on an empty stack`
          : `AD-13 open(${id}) while ${top} is the top entry`,
      );
    }
    if (NEW_SURFACES.includes(id)) {
      if (peek !== null) throw new Error(`AD-13 open(${id}) while a peek is open`);
      hoverPeek = null;
    }
  }
  push(id);
}

function closeWith(id: OverlayId, reason: CelebrationRemoval): void {
  const top = stack.at(-1);
  if (top !== id) throw new Error(`AD-13 close(${id}) while the top is ${top ?? 'nothing'}`);
  removeTop(reason);
  nav.pop();
}

/** An external close: for `celebration` an end (`ended`). */
function close(id: OverlayId): void {
  closeWith(id, 'ended');
}

function closedByBack(depth: number): void {
  while (stack.length > depth) removeTop('ended');
}

function select(column: number, count: number): void {
  if (!isInt(column, 1, 8))
    throw new Error(`AD-13 select(${column}, ${count}): column out of range`);
  if (!Number.isInteger(count) || count < 1) {
    throw new Error(`AD-13 select(${column}, ${count}): count out of range`);
  }
  if (selection !== null) {
    if (selection.column !== column) {
      throw new Error(
        `AD-13 select(${column}, ${count}) while column ${selection.column} is selected`,
      );
    }
    selection = { column, count };
    return;
  }
  if (stack.length > 0)
    throw new Error(`AD-13 select(${column}, ${count}) while ${stack.at(-1)} is open`);
  if (peek !== null) throw new Error(`AD-13 select(${column}, ${count}) while a peek is open`);
  selection = { column, count };
  push('tailSelection');
}

function deselect(): void {
  if (selection === null) return;
  if (stack.at(-1) !== 'tailSelection')
    throw new Error(`AD-13 deselect() while ${stack.at(-1)} is the top entry`);
  close('tailSelection');
}

function openView(cell: number): void {
  checkCell('openView', cell);
  checkNoModalTop('openView');
  if (peek !== null) throw new Error('AD-13 openView while a peek is open');
  if (viewCell !== null) throw new Error('AD-13 openView while the view is open');
  hoverPeek = null;
  viewCell = cell;
  push('wordcellView');
}

function openPeek(cell: number): void {
  checkCell('openPeek', cell);
  checkNoModalTop('openPeek');
  if (peek !== null) throw new Error('AD-13 openPeek while a peek is open');
  if (viewCell !== null) throw new Error('AD-13 openPeek while the view is open');
  hoverPeek = null;
  peek = cell;
}

function closePeek(): void {
  if (peek === null) throw new Error('AD-13 closePeek while no peek is open');
  peek = null;
}

function peekToSticky(): void {
  if (peek === null) throw new Error('AD-13 peekToSticky while no peek is open');
  checkNoModalTop('peekToSticky');
  hoverPeek = null;
  viewCell = peek;
  peek = null;
  push('wordcellView');
}

function openHoverPeek(cell: number): void {
  checkCell('openHoverPeek', cell);
  if (peek !== null || viewCell !== null) return;
  const top = stack.at(-1);
  if (top !== undefined && MODAL_TOP.includes(top)) return;
  if (hoverPeek !== null) throw new Error('AD-13 openHoverPeek while a hover peek is open');
  hoverPeek = cell;
}

function closeHoverPeek(): void {
  hoverPeek = null;
}

function expandEndSheet(): void {
  if (endSheet !== 'collapsed') throw new Error(`AD-13 expandEndSheet while ${endSheet}`);
  if (stack.length > 0) throw new Error(`AD-13 expandEndSheet while ${stack.at(-1)} is open`);
  endSheet = 'expanded';
  push('endSheet');
}

function collapseEndSheet(): void {
  if (endSheet !== 'expanded') throw new Error(`AD-13 collapseEndSheet while ${endSheet}`);
  close('endSheet');
}

function cancelEndSheetOpen(): void {
  liveToken = null;
}

function markFinishUnrecorded(): void {
  unrecordedFinish = true;
}

function onUnfinished(): void {
  unrecordedFinish = false;
  if (endSheet === 'expanded') {
    close('endSheet');
    endSheet = 'hidden';
  } else if (endSheet === 'collapsed') {
    endSheet = 'hidden';
  } else {
    // AD-13: the sheet stays hidden while the celebration runs; Undo cancels the deferred open
    // first, then the run (a non-top entry is `close`'s AD-13 throw).
    cancelEndSheetOpen();
    if (stack.includes('celebration')) closeWith('celebration', 'cancelled');
  }
}

function deferEndSheetOpen(): number {
  if (endSheet !== 'hidden') throw new Error(`AD-13 deferEndSheetOpen while ${endSheet}`);
  lastToken += 1;
  liveToken = lastToken;
  return lastToken;
}

/** Returns whether the sheet opened (false on a dead token, e.g. Undo between settle and open). */
function openDeferred(token: number): boolean {
  if (liveToken === null || token !== liveToken) return false;
  if (endSheet !== 'hidden') throw new Error(`AD-13 openDeferred while ${endSheet}`);
  if (peek !== null) throw new Error('AD-13 openDeferred while a peek is open');
  const viewOnTop = stack.at(-1) === 'wordcellView';
  if (stack.length > (viewOnTop ? 1 : 0)) {
    throw new Error(`AD-13 openDeferred while ${stack.at(-1)} is open`);
  }
  liveToken = null;
  hoverPeek = null;
  if (viewOnTop) close('wordcellView');
  endSheet = 'expanded';
  push('endSheet');
  return true;
}

/** AD-13: one removal callback; a later registration replaces the earlier. */
function onCelebrationRemoved(fn: (reason: CelebrationRemoval) => void): void {
  celebrationRemoved = fn;
}

/**
 * AD-13, AD-19: pushes the `celebration` entry, as `openDeferred` (every check first, then a sticky
 * view on top closes); legal only with no other entry, no peek, the end sheet hidden and a
 * registered removal callback.
 */
function startCelebration(): void {
  if (celebrationRemoved === null)
    throw new Error('AD-13 startCelebration with no removal callback');
  if (endSheet !== 'hidden') throw new Error(`AD-13 startCelebration while ${endSheet}`);
  if (peek !== null) throw new Error('AD-13 startCelebration while a peek is open');
  const viewOnTop = stack.at(-1) === 'wordcellView';
  if (stack.length > (viewOnTop ? 1 : 0)) {
    throw new Error(`AD-13 startCelebration while ${stack.at(-1)} is open`);
  }
  hoverPeek = null;
  if (viewOnTop) close('wordcellView');
  push('celebration');
}

function selectTile(card: CardId): void {
  if (!isInt(card, 0, 51)) throw new Error(`AD-13 selectTile(${card}): card out of range`);
  if (tileSelection !== null)
    throw new Error(`AD-13 selectTile(${card}) while tile ${tileSelection} is selected`);
  if (selection !== null) throw new Error(`AD-13 selectTile(${card}) while a tail is selected`);
  tileSelection = card;
}

function clearTile(): void {
  tileSelection = null;
}

function resetForNewSession(): void {
  cancelEndSheetOpen();
  for (let top = stack.at(-1); top !== undefined; top = stack.at(-1)) closeWith(top, 'cancelled');
  endSheet = 'hidden';
  unrecordedFinish = false;
  selection = null;
  viewCell = null;
  peek = null;
  hoverPeek = null;
  tileSelection = null;
}

export const overlays = {
  get depth(): number {
    return stack.length;
  },
  get top(): OverlayId | undefined {
    return stack.at(-1);
  },
  isOpen(id: OverlayId): boolean {
    return stack.includes(id);
  },
  get selection(): TailSelection | null {
    return selection;
  },
  get endSheet(): EndSheetState {
    return endSheet;
  },
  get unrecordedFinish(): boolean {
    return unrecordedFinish;
  },
  get peek(): number | null {
    return peek;
  },
  get viewCell(): number | null {
    return viewCell;
  },
  get hoverPeek(): number | null {
    return hoverPeek;
  },
  get tileSelection(): CardId | null {
    return tileSelection;
  },
  open,
  close,
  closedByBack,
  resetForNewSession,
  select,
  deselect,
  openView,
  openPeek,
  closePeek,
  peekToSticky,
  openHoverPeek,
  closeHoverPeek,
  expandEndSheet,
  collapseEndSheet,
  markFinishUnrecorded,
  onUnfinished,
  deferEndSheetOpen,
  openDeferred,
  cancelEndSheetOpen,
  startCelebration,
  onCelebrationRemoved,
  selectTile,
  clearTile,
};
