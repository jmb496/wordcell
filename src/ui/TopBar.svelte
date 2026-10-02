<script lang="ts">
import type { GameView } from '../engine/index';
import { game } from '../shell/game.svelte';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import { text } from './text';

// DESIGN.md Top bar: sticky, 44 px of content plus the top safe-area inset (owner Option A),
// menu slot (epic 6), live score (R-82), Undo/Redo with desktop tooltips (F3).
let { view }: { view: GameView } = $props();

function undo(): void {
  game.dispatch({ type: 'undo' });
}

function redo(): void {
  game.dispatch({ type: 'redo' });
}
</script>

<div class="top-bar" data-band="topBar">
  <div class="menu-slot"></div>
  <p class="score">{text.score(view.displayScore)}</p>
  <div class="undo-redo">
    <button
      type="button"
      class="icon"
      aria-label={text.undo}
      title={text.undo}
      data-testid="undo"
      disabled={!view.canUndo}
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
      title={text.redo}
      data-testid="redo"
      disabled={!view.canRedo}
      onclick={redo}
    >
      <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
        <path d="M17 16 A6 6 0 1 0 7 16" />
        <path d="M14 13 L17 16 L20 13" />
      </svg>
    </button>
  </div>
</div>

<style>
  .top-bar {
    position: sticky; top: 0; z-index: 2; flex: none;
    box-sizing: content-box; width: var(--wc-board); height: 44px;
    padding-top: env(safe-area-inset-top);
    display: flex; align-items: center; background: var(--wc-table);
    touch-action: var(--wc-pan);
  }
  .menu-slot { flex: none; width: 44px; height: 44px; }
  .score {
    flex: 1; min-width: 0; margin: 0; text-align: center; white-space: nowrap;
    font: 700 18px/24px system-ui, "Roboto", sans-serif; font-variant-numeric: tabular-nums;
    color: var(--wc-ink-primary);
  }
  .undo-redo { flex: none; display: flex; gap: 4px; }
  .icon {
    width: 44px; height: 44px; padding: 0; border-radius: 9999px;
    display: grid; place-items: center;
    background: var(--wc-surface-raised); border: 1px solid var(--wc-outline);
    color: var(--wc-ink-primary); touch-action: none;
  }
  .icon:disabled { color: var(--wc-ink-disabled); }
  .icon svg { fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
</style>
