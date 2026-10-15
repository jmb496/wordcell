// Epic 6 CAP-10 (6.11, EXPERIENCE.md Keyboard, Focus): focus follows the phase and survives edits.
// One UI effect (Board.svelte) calls `sync(view)` after every DOM update; it is the only place the
// phase decides where focus goes, whatever the cause (a tap, a key, Undo, Redo, a restore):
//   Composing -> the first movable tile; Place -> the first strip card; Idle (a non-winning commit,
//   a return) -> the board; a Game over -> nothing here (the end sheet moves focus to its first
//   action when it opens, ticket 6.6). The first sync only records the phase (the first Idle paint
//   moves no focus). It yields while a surface owns focus (the 6.10 overlay focus return).
// Without a phase change, a focused card or tile that left the DOM (Undo/Redo inside Composing or
// Place, a pointer edit, `+`/`-`, Flip) hands focus to its next sibling in its region, else the
// region's first item, else the board (focus-board.ts `afterLoss`).
import type { CardId, GameView } from '../engine/index';
import { afterLoss, focusBoard, focusCard, focusFirstStrip, focusFirstTile } from './focus-board';
import { overlays, SUSPENDING } from './overlays.svelte';

type Tracked = {
  readonly el: HTMLElement;
  readonly id: CardId;
  /** The region's live items (document order) when the element last held focus. */
  readonly order: readonly CardId[];
  readonly items: () => CardId[];
};

function ids(selector: string): CardId[] {
  return [...document.querySelectorAll<HTMLElement>(selector)].map((el) =>
    Number(el.dataset.cardId),
  );
}

function snapshot(el: Element | null): Tracked | null {
  if (!(el instanceof HTMLElement) || el.dataset.cardId === undefined) return null;
  const place = el.dataset.place;
  let items: () => CardId[];
  if (place === 'column') {
    const column = el.closest<HTMLElement>('[data-column]')?.dataset.column;
    items = () => ids(`[data-column="${column}"] [data-card-id][data-place="column"]`);
  } else if (place === 'tray' || place === 'strip') {
    items = () => ids(`[data-card-id][data-place="${place}"]`);
  } else {
    return null;
  }
  return { el, id: Number(el.dataset.cardId), order: items(), items };
}

function surfaceOwnsFocus(): boolean {
  const top = overlays.top;
  if (top !== undefined && (SUSPENDING.includes(top) || top === 'endSheet')) return true;
  return document.activeElement?.closest('[role="dialog"], [aria-modal="true"]') != null;
}

export function createFocusFollow() {
  let previous: string | null = null;
  let tracked: Tracked | null = null;

  function followPhase(view: GameView): void {
    if (view.status !== 'playing') return;
    if (view.phase === 'composing') focusFirstTile();
    else if (view.phase === 'place') focusFirstStrip();
    else focusBoard();
  }

  function recover(lost: Tracked): void {
    const now = lost.items();
    const next = now.includes(lost.id) ? lost.id : afterLoss(lost.id, lost.order, now);
    if (next === null) focusBoard();
    else focusCard(next);
  }

  return {
    /**
     * Tracks the focused board item as focus moves (a key, a pointer press, a programmatic move);
     * returns the detach. `sync` alone would miss a focus that moved after its last run.
     */
    attach(): () => void {
      const onFocusIn = (event: FocusEvent): void => {
        tracked = snapshot(event.target as Element | null);
      };
      document.addEventListener('focusin', onFocusIn);
      return () => document.removeEventListener('focusin', onFocusIn);
    },
    sync(view: GameView): void {
      const key = `${view.status}/${view.phase}`;
      const changed = previous !== null && key !== previous;
      previous = key;
      const active = document.activeElement;
      const lostFocus = active === null || active === document.body;
      if (changed) {
        if (!surfaceOwnsFocus()) followPhase(view);
      } else if (tracked !== null && !tracked.el.isConnected && lostFocus && !surfaceOwnsFocus()) {
        recover(tracked);
      }
      tracked = snapshot(document.activeElement);
    },
  };
}
