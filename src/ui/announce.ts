// Epic 6 CAP-11 (6.13, EXPERIENCE.md Accessibility Floor, A-E9): the one polite live region and the
// one module that sets it. `dispatchAnnounced` replaces `game.dispatch` at every UI call site; New
// game and Replay (AD-4, no `dispatch`) call `announceReset`, the end sheet calls `announceOutcome`.
// The region is mounted once at the App root (`region` action); each announce clears it at once and
// sets it in the next animation frame, so a repeated string is still announced; the latest wins,
// except the outcome, which queues behind a pending commit text. No `visibilitychange` listener
// here (AD-9): main.ts registers `cancelAnnounce` in the hide flush, and nothing is scheduled while
// the page is hidden.
import type { Command, GameView } from '../engine/index';
import { type DispatchResult, game } from '../shell/game.svelte';
import { text } from './text';

let element: HTMLElement | null = null;
let frame: number | null = null;
let pending: string | null = null;
let queued: string | null = null;

/** Svelte action: the App root's live region element. */
export function region(node: HTMLElement): { destroy: () => void } {
  element = node;
  return {
    destroy: () => {
      cancel();
      if (element === node) element = null;
    },
  };
}

function cancel(): void {
  if (frame !== null) cancelAnimationFrame(frame);
  frame = null;
  pending = null;
  queued = null;
}

/** AD-9 hide flush: drops the pending set (and a queued outcome), so none is spoken on return. */
export function cancelAnnounce(): void {
  cancel();
}

function live(): HTMLElement {
  if (element === null) throw new Error('AD-3 announce before the live region is mounted');
  return element;
}

function onFrame(): void {
  frame = null;
  const message = pending;
  pending = null;
  if (message === null) return;
  live().textContent = message;
  if (queued !== null) {
    pending = queued;
    queued = null;
    frame = requestAnimationFrame(onFrame);
  }
}

function say(message: string): void {
  const node = live();
  cancel();
  if (document.hidden) return;
  node.textContent = '';
  pending = message;
  frame = requestAnimationFrame(onFrame);
}

function required<T>(value: T | undefined, name: string): T {
  if (value === undefined) throw new Error(`AD-3 announce: the view has no ${name}`);
  return value;
}

/** The phase string Undo, Redo, a phase change and `announceReset` share. */
function phaseText(view: GameView): string {
  if (view.phase === 'idle') return text.phaseIdle;
  const draft = required(view.draft, 'draft');
  const word = required(draft.word, 'draft.word');
  const count = required(draft.letterCount, 'draft.letterCount');
  return view.phase === 'place' ? text.phasePlace(word, count) : text.phaseComposing(word, count);
}

function commitText(before: GameView): string {
  const draft = required(before.draft, 'draft');
  const place = required(before.place, 'place');
  return text.announceCommit(
    required(draft.word, 'draft.word'),
    required(place.target, 'place.target'),
    required(place.scoreDelta, 'place.scoreDelta'),
  );
}

function announcement(
  command: Command,
  before: GameView,
  after: GameView,
  result: DispatchResult,
): string | undefined {
  if (result.rejectedWord !== undefined) return text.invalidWord(result.rejectedWord);
  if (!result.changed) return undefined;
  if (result.finished === 'gaveUp') return undefined;
  const commit =
    (command.type === 'confirm' || command.type === 'redo') && after.wordCount > before.wordCount;
  if (commit) return commitText(before);
  if (command.type === 'undo') return text.announceUndo(phaseText(after));
  if (command.type === 'redo') return text.announceRedo(phaseText(after));
  if (after.phase !== before.phase) return phaseText(after);
  return undefined;
}

/** `game.dispatch` plus at most one announcement (the Announcer table of ticket 6.13). */
export function dispatchAnnounced(command: Command): DispatchResult {
  const before = required(game.view, 'before view');
  const result = game.dispatch(command);
  const message = announcement(command, before, required(game.view, 'after view'), result);
  if (message !== undefined) say(message);
  return result;
}

/** New game and Replay (AD-4): `prefix` is `text.announceNewGame` or `text.announceReplay`. */
export function announceReset(prefix: string): void {
  say(`${prefix}. ${text.phaseIdle}`);
}

/** The end sheet really opened: the outcome, a later frame than any commit text. */
export function announceOutcome(): void {
  const view = required(game.view, 'view');
  if (view.status !== 'won' && view.status !== 'gaveUp') {
    throw new Error(`AD-3 announceOutcome while ${view.status}`);
  }
  const message = text.srOutcome(
    view.status === 'won' ? text.endWinTitle : text.endGaveUpTitle,
    required(view.finalScore, 'finalScore'),
    text.bandName(required(view.band, 'band')),
  );
  const node = live();
  if (frame !== null) {
    queued = message;
    return;
  }
  cancel();
  if (document.hidden) return;
  node.textContent = '';
  pending = message;
  frame = requestAnimationFrame(onFrame);
}
