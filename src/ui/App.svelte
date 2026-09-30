<script lang="ts">
import { game } from '../shell/game.svelte';

// Placeholder board so the toolchain and e2e smoke test have something real to render.
// Replaced by the board UI epic (CAP-3 replaces the seed line and card count, E7).
const cardCount = $derived(
  game.view === undefined
    ? undefined
    : game.view.columns.reduce((sum, column) => sum + column.cards.length, 0),
);
</script>

{#if game.state.kind === 'active' && game.view}
  <main>
    <h1>WordCell</h1>
    <p class="meta">Seed {game.state.session.seed} · placeholder board · {cardCount} cards</p>
    <section class="columns" aria-label="columns">
      {#each game.view.columns as column (column.column)}
        <ol class="column" data-testid="column-{column.column}">
          {#each column.cards as id (id)}
            <li
              class="card"
              data-testid="card-{id}"
              data-card-id={id}
              data-place="column"
            >{game.view.faces[id].letter}</li>
          {/each}
        </ol>
      {/each}
    </section>
  </main>
{/if}

<style>
  main { padding: 16px; }
  h1 { margin: 0 0 4px; font-size: 1.25rem; }
  .meta { margin: 0 0 12px; opacity: 0.7; font-size: 0.85rem; }
  .columns { display: grid; grid-template-columns: repeat(8, 1fr); gap: 6px; }
  .column { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 4px; }
  .card {
    aspect-ratio: 3 / 4; display: grid; place-items: center;
    background: var(--wc-card-face); color: var(--wc-card-ink); border-radius: 6px;
    font-family: "WordCell Serif", serif; font-weight: 600;
    touch-action: none; user-select: none;
  }
</style>
