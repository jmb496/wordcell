// Epic 6 CAP-10 (6.10): the dispatching player intents a button and a key share, so both reach the
// engine through one function (AD-4 `dispatch`). Each is wrapped in FLIP capture/play (epic 5 SPEC
// CAP-8, F6, F7). Callers wrap them in act() (AD-12); the key handler's rows are in keys.ts.
import { flushSync } from 'svelte';
import type { Command } from '../engine/index';
import { game } from '../shell/game.svelte';
import { capture, play } from './flip';
import { overlays } from './overlays.svelte';

/**
 * F39: closes the sticky WordCell view and any peek, so a command that changes the phase or the
 * word data never meets an open view; a tail selection pops its entry next (`overlays.deselect()`,
 * which throws only with a modal on top).
 */
function closeTransient(): void {
  if (overlays.viewCell !== null) overlays.close('wordcellView');
  if (overlays.peek !== null) overlays.closePeek();
  overlays.closeHoverPeek();
  overlays.deselect();
}

export function undo(): void {
  closeTransient();
  const command = { type: 'undo' } as const;
  capture();
  play(command, game.dispatch(command));
}

export function redo(): void {
  closeTransient();
  const command = { type: 'redo' } as const;
  capture();
  play(command, game.dispatch(command));
}

// F15/F21: each call dispatches one `validate`; flushSync renders the result (Place, Confirm)
// before it returns, so a second tap lands on Confirm. No re-entrancy flag.
export function validate(): void {
  closeTransient();
  const command = { type: 'validate' } as const;
  capture();
  const result = game.dispatch(command);
  flushSync();
  play(command, result);
}

// Epic 5 SPEC CAP-8: kind `flyToCell`, played by flip.ts (F28).
export function confirm(): void {
  closeTransient();
  const command = { type: 'confirm' } as const;
  capture();
  play(command, game.dispatch(command));
}

export function flip(): void {
  closeTransient();
  const command = { type: 'flip' } as const;
  capture();
  play(command, game.dispatch(command));
}

/**
 * Epic 6 CAP-10 (6.11): one word-editing command (a key's `addFreeLetter`, `setTarget`, `arrange`,
 * `setPlacementOrder`), bracketed like the others; it changes the word data, so a view and peeks
 * close first.
 */
export function edit(command: Command): void {
  closeTransient();
  capture();
  play(command, game.dispatch(command));
}

// R-31: `−` and `+` (the buttons and the `-`/`+` keys) dispatch k ∓ 1 from the k they show.
export function setK(k: number): void {
  edit({ type: 'setDestinationCount', k });
}
