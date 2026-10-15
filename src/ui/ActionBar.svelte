<script lang="ts">
import { onMount } from 'svelte';
import type { GameView } from '../engine/index';
import { dictionary } from '../shell/dictionary.svelte';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import { game } from '../shell/game.svelte';
import { act } from './act';
import { confirm, validate } from './commands';
import type { TooltipCommand } from './key-labels';
import { fitSize } from './layout/fit';
import { measureWidth } from './layout/measure';
import { newGame } from './new-game';
import { text } from './text';

// DESIGN.md Action bar: sticky, 60 px of content plus the bottom safe-area inset (owner Option A),
// 4 px side padding, the 48 px primary action (epic 3's labels, enablement and New game). The
// label (button-label, 16 px) shrinks to the ui-label size (14 px) to fit the button's fractional
// content width before it ellipsizes (A9 4.2-m1), measured on the label span itself under a
// temporary inline font size, re-measured on mount, label change, button width change and
// `document.fonts.ready` (as WordLine). The button takes the fitted size too, so the ellipsis glyph
// (drawn in the block container's font) matches the label text (5-3 #1).
// Epic 6 CAP-10 (6.11): on a desktop (`hoverFine`) the button's `title` follows the primary action
// (`Label (Key)`: Validate, Confirm, New game); a reason label has none.
let { view, hoverFine }: { view: GameView; hoverFine: boolean } = $props();

const LABEL_MAX = 16;

let button: HTMLButtonElement | null | undefined;
let labelEl: HTMLSpanElement | null | undefined = $state();
let size = $state(LABEL_MAX);

// Label precedence (EXPERIENCE.md Validate): status ≠ playing → New game whatever the phase; Place
// → Confirm; otherwise `Word list unavailable` > `Loading words…` > `Need 3+ letters` (reason
// style) > Validate (AD-8). An undefined handler disables the button; every handler goes through
// act() (AD-12 F9).
const primary = $derived.by(
  (): {
    label: string;
    reason: boolean;
    onclick: (() => void) | undefined;
    tip?: TooltipCommand;
  } => {
    if (view.status !== 'playing')
      return { label: text.newGame, reason: false, onclick: act(newGame), tip: 'newGame' };
    if (view.phase === 'place') {
      return {
        label: text.confirm,
        reason: false,
        onclick: view.canConfirm ? act(confirm) : undefined,
        tip: 'confirm',
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
      onclick: view.canValidate ? act(validate) : undefined,
      tip: 'validate',
    };
  },
);

function refit(): void {
  const el = labelEl;
  if (button == null || el == null) return;
  const style = getComputedStyle(button);
  const box =
    button.getBoundingClientRect().width -
    Number.parseFloat(style.paddingLeft) -
    Number.parseFloat(style.paddingRight);
  size = fitSize((px) => measureWidth(el, px), box, LABEL_MAX);
}

// Label change (and the span's mount).
$effect(() => {
  void [primary.label, labelEl];
  refit();
});

onMount(() => {
  let mounted = true;
  const observer = new ResizeObserver(() => refit());
  if (button != null) observer.observe(button);
  void document.fonts.ready.then(() => {
    if (mounted) refit();
  });
  return () => {
    mounted = false;
    observer.disconnect();
  };
});
</script>

<div class="action-bar" data-band="actionBar">
  <button
    type="button"
    class="primary"
    class:reason={primary.reason}
    data-testid="primary-action"
    title={hoverFine && primary.tip !== undefined ? text.tooltip(primary.tip) : undefined}
    disabled={primary.onclick === undefined}
    onclick={primary.onclick}
    style:font-size="{size}px"
    bind:this={button}
  ><span class="primary-label" bind:this={labelEl} style:font-size="{size}px">{primary.label}</span></button>
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
