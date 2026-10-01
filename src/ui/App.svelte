<script lang="ts">
import { game, type RejectReason } from '../shell/game.svelte';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import BlockingMessage from './BlockingMessage.svelte';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import Halted from './Halted.svelte';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import HistoryNotice from './HistoryNotice.svelte';
import { openHistoryNotice } from './history-notice.svelte';
import { overlays } from './overlays.svelte';
import { text } from './text';

// Minimal board (epic 3 SPEC E1): columns, WordCells, Undo/Redo, the Seed line and the primary
// action (Validate stays disabled until entry 9). Replaced by the board UI epic. Script-side uses
// of `game` keep Biome from flagging the import (it misses markup).
const board = $derived(game.view);

function undo(): void {
  game.dispatch({ type: 'undo' });
}

function redo(): void {
  game.dispatch({ type: 'redo' });
}

function confirm(): void {
  game.dispatch({ type: 'confirm' });
}

// AD-4/AD-13: New game from either root closes every entry; after New game from the rejected
// root the deferred History notice is pushed (AD-16).
function newGame(): void {
  const wasRejected = game.state.kind === 'rejected';
  game.newGame();
  overlays.resetForNewSession();
  if (wasRejected) openHistoryNotice();
}

// §2 Session rejected: the catalogue body for the parse reason (EXPERIENCE.md message catalogue).
function rejectedBody(reason: RejectReason): string {
  switch (reason.reason) {
    case 'version-unknown':
      return text.rejectedVersionUnknown(reason.version);
    case 'version-unreadable':
      return text.rejectedVersionUnreadable;
    case 'replay-failed':
      return text.rejectedReplayFailed(reason.version);
  }
}

// Label precedence: status ≠ playing → New game whatever the phase; otherwise by phase. Validate
// stays disabled until entry 9; an undefined handler disables the button.
const primary = $derived.by(
  (): { label: string; reason: boolean; onclick: (() => void) | undefined } => {
    if (board === undefined) throw new Error('AD-3 primary action without a view');
    if (board.status !== 'playing') return { label: text.newGame, reason: false, onclick: newGame };
    if (board.phase === 'place') {
      return {
        label: text.confirm,
        reason: false,
        onclick: board.canConfirm ? confirm : undefined,
      };
    }
    const structural = board.draft?.structural;
    if (
      board.phase === 'composing' &&
      structural?.ok === false &&
      structural.reason === 'too-short'
    ) {
      return { label: text.needLetters, reason: true, onclick: undefined };
    }
    return { label: text.validate, reason: false, onclick: undefined };
  },
);
</script>

{#if game.state.kind === 'halted'}
  <Halted />
{:else if game.state.kind === 'rejected'}
  <BlockingMessage
    title={text.rejectedTitle}
    body={rejectedBody(game.state.reason)}
    action={text.newGame}
    onaction={newGame}
  />
{:else if game.state.kind === 'active' && board}
  <!-- AD-13: dialogs render beside the board; while the notice is rendered the board is inert. -->
  <main inert={overlays.isOpen('historyNotice')}>
    <div class="top">
      <h1>WordCell</h1>
      <div class="undo-redo">
        <button
          type="button"
          class="icon"
          aria-label={text.undo}
          data-testid="undo"
          disabled={!board.canUndo}
          onclick={undo}
        >
          <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
            <path d="M7 16 A6 6 0 1 1 17 16" />
            <path d="M4 13 L7 16 L10 13" />
          </svg>
        </button>
        <button
          type="button"
          class="icon"
          aria-label={text.redo}
          data-testid="redo"
          disabled={!board.canRedo}
          onclick={redo}
        >
          <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
            <path d="M17 16 A6 6 0 1 0 7 16" />
            <path d="M14 13 L17 16 L20 13" />
          </svg>
        </button>
      </div>
    </div>
    <p class="seed">Seed {game.state.session.seed}</p>
    <section class="columns" aria-label="columns">
      {#each board.columns as column (column.column)}
        <ol class="column" data-testid="column-{column.column}">
          {#each column.cards as id (id)}
            <li
              class="card"
              data-testid="card-{id}"
              data-card-id={id}
              data-place="column"
            >{board.faces[id].letter}</li>
          {/each}
        </ol>
      {/each}
    </section>
    <section class="cells" aria-label="WordCells">
      {#each board.cells as cell (cell.cell)}
        <div class="wordcell">
          <span class="cell-number" aria-hidden="true">{cell.cell}</span>
          <ol class="stack" class:empty={cell.cards.length === 0} data-testid="wordcell-{cell.cell}" aria-label="WordCell {cell.cell}">
            {#each cell.cards as id (id)}
              <li
                class="card"
                data-testid="card-{id}"
                data-card-id={id}
                data-place="cell"
              >{board.faces[id].letter}</li>
            {/each}
          </ol>
        </div>
      {/each}
    </section>
    <button
      type="button"
      class="primary"
      class:reason={primary.reason}
      data-testid="primary-action"
      disabled={primary.onclick === undefined}
      onclick={primary.onclick}
    >{primary.label}</button>
  </main>
  {#if overlays.isOpen('historyNotice')}
    <HistoryNotice />
  {/if}
{:else}
  <main>
    <h1>WordCell</h1>
  </main>
{/if}

<style>
  main { padding: 16px; }
  h1 { margin: 0; font-size: 1.25rem; }
  .top { display: flex; align-items: center; justify-content: space-between; margin: 0 0 4px; }
  .undo-redo { display: flex; gap: 4px; }
  .icon {
    width: 44px; height: 44px; padding: 0; border-radius: 9999px;
    display: grid; place-items: center;
    background: var(--wc-surface-raised); border: 1px solid var(--wc-outline);
    color: var(--wc-ink-primary);
  }
  .icon:disabled { color: var(--wc-ink-disabled); }
  .icon svg { fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
  .seed { margin: 0 0 12px; color: var(--wc-ink-secondary); font-size: 0.85rem; }
  .columns, .cells { display: grid; grid-template-columns: repeat(8, 1fr); gap: 6px; }
  .cells { margin-top: 16px; }
  .column, .stack { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 4px; }
  .stack { flex-direction: column-reverse; }
  .wordcell { display: flex; flex-direction: column; gap: 2px; }
  .cell-number {
    font: 600 13px/16px system-ui, "Roboto", sans-serif; color: var(--wc-ink-secondary);
    text-align: center;
  }
  .stack.empty { aspect-ratio: 3 / 4; border: 2px solid var(--wc-outline); border-radius: 6px; box-sizing: border-box; }
  .primary {
    display: block; width: 100%; height: 48px; margin-top: 16px; padding: 0 16px;
    border: none; border-radius: 9999px;
    background: var(--wc-accent-orange); color: var(--wc-ink-on-accent);
    font: 600 16px/24px system-ui, "Roboto", sans-serif;
  }
  .primary:disabled { background: var(--wc-surface-raised); color: var(--wc-ink-disabled); }
  .primary.reason:disabled { color: var(--wc-ink-secondary); }
  .card {
    aspect-ratio: 3 / 4; display: grid; place-items: center;
    background: var(--wc-card-face); color: var(--wc-card-ink); border-radius: 6px;
    font-family: "WordCell Serif", serif; font-weight: 600;
    touch-action: none; user-select: none;
  }
</style>
