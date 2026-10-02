<script lang="ts">
import type { GameView } from '../engine/index';
import { dictionary } from '../shell/dictionary.svelte';
import { game } from '../shell/game.svelte';
import { newGame } from './new-game';
import { text } from './text';

// DESIGN.md Action bar: sticky, 60 px of content plus the bottom safe-area inset (owner Option A),
// 4 px side padding, the 48 px primary action (epic 3's labels, enablement and New game).
let { view }: { view: GameView } = $props();

function validate(): void {
  game.dispatch({ type: 'validate' });
}

function confirm(): void {
  game.dispatch({ type: 'confirm' });
}

// Label precedence (EXPERIENCE.md Validate): status ≠ playing → New game whatever the phase; Place
// → Confirm; otherwise `Word list unavailable` > `Loading words…` > `Need 3+ letters` (reason
// style) > Validate (AD-8). An undefined handler disables the button.
const primary = $derived.by(
  (): { label: string; reason: boolean; onclick: (() => void) | undefined } => {
    if (view.status !== 'playing') return { label: text.newGame, reason: false, onclick: newGame };
    if (view.phase === 'place') {
      return {
        label: text.confirm,
        reason: false,
        onclick: view.canConfirm ? confirm : undefined,
      };
    }
    if (dictionary.state === 'failed') {
      return { label: text.wordListUnavailable, reason: true, onclick: undefined };
    }
    if (dictionary.state === 'loading') {
      return { label: text.loadingWords, reason: true, onclick: undefined };
    }
    const structural = view.draft?.structural;
    if (
      view.phase === 'composing' &&
      structural?.ok === false &&
      structural.reason === 'too-short'
    ) {
      return { label: text.needLetters, reason: true, onclick: undefined };
    }
    return {
      label: text.validate,
      reason: false,
      onclick: view.canValidate ? validate : undefined,
    };
  },
);
</script>

<div class="action-bar" data-band="actionBar">
  <button
    type="button"
    class="primary"
    class:reason={primary.reason}
    data-testid="primary-action"
    disabled={primary.onclick === undefined}
    onclick={primary.onclick}
  >{primary.label}</button>
</div>

<style>
  .action-bar {
    position: sticky; bottom: 0; z-index: 2; flex: none;
    box-sizing: border-box; width: var(--wc-board); height: calc(60px + env(safe-area-inset-bottom));
    padding: 0 4px env(safe-area-inset-bottom);
    display: flex; align-items: center; background: var(--wc-surface);
    touch-action: var(--wc-pan);
  }
  .primary {
    display: block; width: 100%; height: 48px; padding: 0 16px;
    border: none; border-radius: 9999px;
    background: var(--wc-accent-orange); color: var(--wc-ink-on-accent);
    font: 600 16px/24px system-ui, "Roboto", sans-serif;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis; touch-action: none;
  }
  .primary:disabled { background: var(--wc-surface-raised); color: var(--wc-ink-disabled); }
  .primary.reason:disabled { color: var(--wc-ink-secondary); }
</style>
