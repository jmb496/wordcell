<script lang="ts">
import type { Card } from '../engine';

// Placeholder board so the toolchain and e2e smoke test have something real to render.
// Replaced by the board UI epic.
const { seed, columns }: { seed: number; columns: readonly (readonly Card[])[] } = $props();
const cardCount = $derived(columns.flat().length);
</script>

<main>
  <h1>WordCell</h1>
  <p class="meta">Seed {seed} · placeholder board · {cardCount} cards</p>
  <section class="columns" aria-label="columns">
    {#each columns as column, i (i)}
      <ol class="column" data-testid="column-{i + 1}">
        {#each column as card (card.id)}
          <li
            class="card"
            data-testid="card-{card.id}"
            data-card-id={card.id}
            data-place="column"
          >{card.letter}</li>
        {/each}
      </ol>
    {/each}
  </section>
</main>

<style>
  main { padding: 16px; }
  h1 { margin: 0 0 4px; font-size: 1.25rem; }
  .meta { margin: 0 0 12px; opacity: 0.7; font-size: 0.85rem; }
  .columns { display: grid; grid-template-columns: repeat(8, 1fr); gap: 6px; }
  .column { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 4px; }
  .card {
    aspect-ratio: 3 / 4; display: grid; place-items: center;
    background: #f7f3e8; color: #1c2331; border-radius: 6px; font-weight: 700;
    touch-action: none; user-select: none;
  }
</style>
