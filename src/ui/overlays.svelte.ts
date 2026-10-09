// AD-13 overlays store (SPEC E3, epic 4 CAP-5): the single owner of the ordered stack of open
// entries (surfaces, the tail selection, the sticky WordCell view and the expanded end sheet), of
// the end sheet's `hidden | collapsed | expanded`, and of the entry-less peek and hover peek.
// Entry pushes and pops go through nav; `close` is top-down only and pops one; `closedByBack`
// (nav's close callback) removes every entry deeper than the back's depth, topmost first, and
// never calls nav. Removing an entry by any path applies its effect: `tailSelection` clears the
// selection, `wordcellView` clears the view cell, `endSheet` collapses the sheet.
// `resetForNewSession()` (New game, AD-4) kills the deferred end-sheet token, closes every entry
// top-down and clears the rest. Invalid-state calls throw `AD-13 …` (rule 6); only CAP-5's named
// no-ops are no-ops. DispatchResult finished/unfinished stays unwired until epic 6 (CAP-5).
// Tile selection (epic 5 SPEC CAP-4, F1): one tray or strip tile `CardId` beside the tail selection,
// with no entry (back ignores it, nav is never called); `selectTile` throws while a tile or tail
// selection is set, `clearTile` is a no-op with none; `resetForNewSession()` clears it.
import type { CardId } from '../engine/index';
import { nav } from '../shell/nav';

export type OverlayId =
  | 'historyNotice'
  | 'resetConfirm'
  | 'tailSelection'
  | 'wordcellView'
  | 'endSheet';
export type EndSheetState = 'hidden' | 'collapsed' | 'expanded';
export type TailSelection = { readonly column: number; readonly count: number };

const OWN_OPERATION: readonly OverlayId[] = ['tailSelection', 'wordcellView', 'endSheet'];
const MODAL_TOP: readonly OverlayId[] = ['historyNotice', 'resetConfirm', 'endSheet'];

let stack = $state.raw<readonly OverlayId[]>([]);
let selection = $state.raw<TailSelection | null>(null);
let endSheet = $state<EndSheetState>('hidden');
let peek = $state<number | null>(null);
let viewCell = $state<number | null>(null);
let hoverPeek = $state<number | null>(null);
let tileSelection = $state<CardId | null>(null);
let liveToken: number | null = null;
let lastToken = 0;

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

function removeTop(): void {
  const top = stack.at(-1);
  stack = stack.slice(0, -1);
  if (top === 'tailSelection') selection = null;
  else if (top === 'wordcellView') viewCell = null;
  else if (top === 'endSheet') endSheet = 'collapsed';
}

function open(id: OverlayId): void {
  if (OWN_OPERATION.includes(id))
    throw new Error(`AD-13 open(${id}) while it has its own operation`);
  if (stack.includes(id)) throw new Error(`AD-13 open(${id}) while it is open`);
  push(id);
}

function close(id: OverlayId): void {
  const top = stack.at(-1);
  if (top !== id) throw new Error(`AD-13 close(${id}) while the top is ${top ?? 'nothing'}`);
  removeTop();
  nav.pop();
}

function closedByBack(depth: number): void {
  while (stack.length > depth) removeTop();
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

function onUnfinished(): void {
  if (endSheet === 'expanded') {
    close('endSheet');
    endSheet = 'hidden';
  } else if (endSheet === 'collapsed') {
    endSheet = 'hidden';
  } else {
    cancelEndSheetOpen();
  }
}

function deferEndSheetOpen(): number {
  if (endSheet !== 'hidden') throw new Error(`AD-13 deferEndSheetOpen while ${endSheet}`);
  lastToken += 1;
  liveToken = lastToken;
  return lastToken;
}

function openDeferred(token: number): void {
  if (liveToken === null || token !== liveToken) return;
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
  for (let top = stack.at(-1); top !== undefined; top = stack.at(-1)) close(top);
  endSheet = 'hidden';
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
  onUnfinished,
  deferEndSheetOpen,
  openDeferred,
  cancelEndSheetOpen,
  selectTile,
  clearTile,
};
