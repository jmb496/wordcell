<script lang="ts">
import type { GameView } from '../engine/index';
import { game } from '../shell/game.svelte';
import { prefs } from '../shell/prefs.svelte';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import { act } from './act';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import { redo, undo } from './commands';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import { historyUnreadable } from './history-notice.svelte';
import { openSurface } from './open-surface';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import { overlays } from './overlays.svelte';
import { text } from './text';

// DESIGN.md Top bar: sticky, 44 px of content plus the top safe-area inset (owner Option A),
// menu slot (epic 6), live score (R-82), Undo/Redo with desktop tooltips (F3). Undo and Redo are
// `commands.ts` (shared with the keys): they clear a tail selection first, after act()'s cancel()
// (AD-13, SPEC CAP-6), then FLIP captures (its flush renders the deselect, so no lift is recorded)
// and plays after the dispatch (epic 5 SPEC CAP-8, F6, F7).
// Epic 6 CAP-10 (6.11): on a desktop (`hoverFine`) each button's `title` is `Label (Key)`
// (`text.tooltip`), undefined on touch; the accessible name is unchanged.
let { view, hoverFine }: { view: GameView; hoverFine: boolean } = $props();

// Epic 6 CAP-2: the ☰ button opens the menu only through openSurface (SPEC F8). The top bar is
// `inert` while the menu is open because App makes `main` inert (SPEC F6).
function openMenu(): void {
  openSurface('menu');
}

// Epic 6 CAP-7 (ticket 6.4, R-76, AD-9): the timer. The text always comes from a fresh
// `game.elapsedMs(performance.now())` (never a stored `now`); `refresh` is only a re-read trigger,
// bumped by a 1000 ms interval that runs while Show timer is on and the game is playing. Every
// dispatch and leaving playing re-derive through the store state the call reads. The interval
// neither dispatches nor writes, and the UI holds no visibility listener (AD-9).
let refresh = $state(0);

$effect(() => {
  if (!prefs.value.showTimer || view.status !== 'playing') return;
  const id = setInterval(() => {
    refresh += 1;
  }, 1000);
  return () => clearInterval(id);
});

function timerText(): string {
  void refresh;
  return text.timer(game.elapsedMs(performance.now()));
}
</script>

<div class="top-bar" data-band="topBar">
  <button
    type="button"
    class="icon menu-button"
    aria-label={text.menu}
    title={hoverFine ? text.tooltip('menu') : undefined}
    aria-describedby={historyUnreadable() ? 'menu-history-flag' : undefined}
    onclick={act(openMenu)}
  >
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
      <path d="M4 7 H20" />
      <path d="M4 12 H20" />
      <path d="M4 17 H20" />
    </svg>
    {#if historyUnreadable()}<span class="dot" aria-hidden="true"></span>{/if}
  </button>
  {#if historyUnreadable()}<span id="menu-history-flag" class="sr-only">{text.historyTitle}</span>{/if}
  <p class="score">{text.score(view.displayScore)}</p>
  {#if prefs.value.showTimer}
    {@const timer = timerText()}
    <p class="timer" class:long={timer.length > 5}>{timer}</p>
  {/if}
  <div class="undo-redo">
    <button
      type="button"
      class="icon"
      aria-label={text.undo}
      title={hoverFine ? text.tooltip('undo') : undefined}
      data-testid="undo"
      disabled={!view.canUndo}
      onclick={act(undo)}
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
      title={hoverFine ? text.tooltip('redo') : undefined}
      data-testid="redo"
      disabled={!view.canRedo}
      onclick={act(redo)}
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
  .score {
    flex: 1; min-width: 0; margin: 0; text-align: center; white-space: nowrap;
    font: 700 18px/24px system-ui, "Roboto", sans-serif; font-variant-numeric: tabular-nums;
    color: var(--wc-ink-primary);
  }
  .timer {
    flex: none; box-sizing: border-box; width: 64px; margin: 0 4px; text-align: right;
    white-space: nowrap; overflow: hidden;
    font: 700 18px/24px system-ui, "Roboto", sans-serif; font-variant-numeric: tabular-nums;
    color: var(--wc-ink-primary);
  }
  /* h:mm:ss would overflow 64 px at the score's size, so only it shrinks (DESIGN.md Top bar). */
  .timer.long { font-size: 13px; }
  .undo-redo { flex: none; display: flex; gap: 4px; }
  .icon {
    width: 44px; height: 44px; padding: 0; border-radius: 9999px;
    display: grid; place-items: center;
    background: var(--wc-surface-raised); border: 1px solid var(--wc-outline);
    color: var(--wc-ink-primary); touch-action: none;
  }
  .menu-button { position: relative; }
  .dot {
    position: absolute; top: 8px; right: 8px; width: 10px; height: 10px; border-radius: 9999px;
    background: var(--wc-error); border: 2px solid var(--wc-surface-raised); box-sizing: content-box;
  }
  .sr-only {
    position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden;
    clip-path: inset(50%); white-space: nowrap;
  }
  .icon:disabled { color: var(--wc-ink-disabled); }
  .icon svg { fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
</style>
