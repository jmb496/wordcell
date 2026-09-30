<script lang="ts">
import { game } from '../shell/game.svelte';

// Minimal board (epic 3 SPEC E1): columns, WordCells, Undo/Redo and the Seed line. Replaced by the
// board UI epic. Script-side uses of `game` keep Biome from flagging the import (it misses markup).
const board = $derived(game.view);

function undo(): void {
  game.dispatch({ type: 'undo' });
}

function redo(): void {
  game.dispatch({ type: 'redo' });
}
</script>

{#if game.state.kind === 'active' && board}
  <main>
    <div class="top">
      <h1>WordCell</h1>
      <div class="undo-redo">
        <button
          type="button"
          class="icon"
          aria-label="Undo"
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
          aria-label="Redo"
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
  </main>
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
  .card {
    aspect-ratio: 3 / 4; display: grid; place-items: center;
    background: var(--wc-card-face); color: var(--wc-card-ink); border-radius: 6px;
    font-family: "WordCell Serif", serif; font-weight: 600;
    touch-action: none; user-select: none;
  }
</style>
