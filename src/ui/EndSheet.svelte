<script lang="ts">
import { tick, untrack } from 'svelte';
import type { GameView } from '../engine/index';
import { act } from './act';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import { field, resultOf } from './end-sheet';
import { focusBoard } from './focus-board';
import { requestReplay } from './new-game';
import { openSurface } from './open-surface';
import { type EndSheetState, overlays } from './overlays.svelte';
import { createPresence } from './presence.svelte';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import { text } from './text';

// Epic 6 CAP-4 (ticket 6.6, R-62, R-75, R-81, R-83, R-84; DESIGN.md End screen; EXPERIENCE.md End
// sheet): the expanded end sheet, rendered from `overlays.endSheet` and the finished `GameView`
// (AD-3: n, p, score, band, longest word, words placed come from the view). It has no close button
// and no full-viewport layer: the layer spans the viewport between the sticky bars (top bar 44 px +
// inset, action bar 60 px + inset), so both bars stay live; the scrim covers the board between them
// and consumes its tap (collapse). The grab handle, the scrim tap and Esc collapse it (back is
// nav's); the 56 px collapsed bar lives in the Tray band. Open and close are a CSS transition on
// `--wc-base-ms` (`--wc-fade-ms` under reduced motion), none when it is open at mount (R-73
// relaunch: no animation, final state at first paint). The content is a snapshot of the last
// finished view, so the exit keeps its text after Undo. Focus: Replay this deal on open; the board
// on collapse, Undo, New game and Replay (EXPERIENCE.md Focus).
let { view }: { view: GameView } = $props();

const finishedStatus = (v: GameView): boolean => v.status === 'won' || v.status === 'gaveUp';

const open = $derived(overlays.endSheet === 'expanded');
const presence = createPresence(() => open);
// R-73: open at mount means a relaunch; its transitions are off until the sheet first closes.
let instant = $state(untrack(() => open));
let shown = $state.raw<GameView | null>(null);
$effect.pre(() => {
  if (!open) untrack(() => (instant = false));
});
$effect.pre(() => {
  if (open && finishedStatus(view)) shown = view;
});
const result = $derived(open && finishedStatus(view) ? view : shown);

// Collapse (handle, scrim, Esc, back): focus goes to the board. Undo does the same (end-sheet.ts);
// New game and Replay leave focus to their own paths.
let previous: EndSheetState = untrack(() => overlays.endSheet);
$effect(() => {
  const now = overlays.endSheet;
  untrack(() => {
    if (previous === 'expanded' && now === 'collapsed') void tick().then(focusBoard);
    previous = now;
  });
});

// No part of the sheet acts on the second click of a multi-click (presence.ts `firstClick`).
const first = (event: MouseEvent): boolean => event.detail <= 1;

const collapse = (event: MouseEvent): void => {
  if (first(event)) overlays.collapseEndSheet();
};
const replay = (event: MouseEvent): void => {
  if (first(event)) requestReplay(view);
};
const statistics = (event: MouseEvent): void => {
  if (first(event)) openSurface('statistics');
};

const closeOnEsc = act((): void => {
  if (overlays.top === 'endSheet') overlays.collapseEndSheet();
});

function onkeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape' && !event.repeat && overlays.top === 'endSheet') closeOnEsc();
}

function focusOnMount(button: HTMLButtonElement): void {
  if (overlays.top === 'endSheet') button.focus();
}
</script>

<svelte:window {onkeydown} />

{#if presence.present && result !== null}
  <div
    class="layer"
    class:shown={presence.shown || (instant && open)}
    class:instant
    inert={!open || overlays.top !== 'endSheet'}
    {@attach presence.attach}
    ontransitionend={presence.onend}
    ontransitioncancel={presence.oncancel}
  >
    <!-- The scrim is pointer-only: keyboard and screen-reader users collapse with the handle or Esc. -->
    <div class="scrim" data-presence-target aria-hidden="true" onclick={act(collapse)}></div>
    <div class="sheet" data-presence-target role="dialog" aria-labelledby="end-title">
      <button type="button" class="handle" aria-label={text.endCollapse} onclick={act(collapse)}>
        <span aria-hidden="true"></span>
      </button>
      <div class="content">
        <h2 id="end-title">{result.status === 'won' ? text.endWinTitle : text.endGaveUpTitle}</h2>
        <p class="score">{text.statNumber(resultOf(result).score)}</p>
        <p class="band">{resultOf(result).band}</p>
        <p class="message">{resultOf(result).message}</p>
        <dl>
          <div>
            <dt>{text.endLongestWord}</dt>
            <dd>{result.longestWord === undefined ? text.endNone : result.longestWord.spelling.toUpperCase()}</dd>
          </div>
          <div>
            <dt>{text.endWordsPlaced}</dt>
            <dd>{result.wordCount}</dd>
          </div>
        </dl>
        {#if result.status === 'gaveUp'}
          <p class="penalty">{text.endPenalty(field(result.lettersLeft, 'lettersLeft'), field(result.penalty, 'penalty'))}</p>
        {/if}
        <div class="actions">
          <button type="button" class="secondary" onclick={act(replay)} {@attach focusOnMount}
            >{text.replayDeal}</button
          >
          <button type="button" class="secondary" onclick={act(statistics)}>{text.statistics}</button>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  /* Between the sticky bars (DESIGN.md End screen): both bars (z-index 2) stay live above the scrim. */
  .layer {
    position: fixed; left: 0; right: 0; z-index: 3;
    top: calc(44px + env(safe-area-inset-top)); bottom: calc(60px + env(safe-area-inset-bottom));
  }
  .scrim {
    position: absolute; inset: 0; background: var(--wc-scrim); opacity: 0; touch-action: none;
    transition: opacity var(--wc-base-ms);
  }
  .sheet {
    position: absolute; left: 0; right: 0; bottom: 0; box-sizing: border-box;
    display: flex; flex-direction: column; max-height: min(80dvh, 100%); margin: 0 auto; max-width: 560px;
    background: var(--wc-surface); border-radius: 20px 20px 0 0;
    opacity: 0; transform: translateY(24px);
    transition: opacity var(--wc-base-ms), transform var(--wc-base-ms);
  }
  .shown .scrim, .shown .sheet { opacity: 1; }
  .shown .sheet { transform: none; }
  .handle {
    flex: none; display: grid; place-items: center; width: 100%; height: 44px; padding: 0;
    background: none; border: none; touch-action: none;
  }
  .handle span { width: 40px; height: 4px; border-radius: 9999px; background: var(--wc-outline); }
  .content {
    flex: 1 1 auto; min-height: 0; overflow-y: auto; overscroll-behavior: contain;
    padding: 0 16px 16px; text-align: center;
    font: 400 1rem/1.5rem system-ui, "Roboto", sans-serif; color: var(--wc-ink-primary);
  }
  h2 { margin: 0; font: 600 1.25rem/1.75rem system-ui, "Roboto", sans-serif; }
  .score {
    margin: 8px 0 0; font: 700 56px/64px system-ui, "Roboto", sans-serif;
    font-variant-numeric: tabular-nums;
  }
  .band { margin: 0; font: 600 1.25rem/1.75rem system-ui, "Roboto", sans-serif; }
  .message { margin: 4px 0 16px; }
  dl { margin: 0; }
  dl div { display: flex; justify-content: space-between; gap: 16px; padding: 4px 0; text-align: left; }
  dt { color: var(--wc-ink-secondary); font: 500 0.875rem/1.25rem system-ui, "Roboto", sans-serif; }
  dd { margin: 0; overflow-wrap: anywhere; text-align: right; }
  .penalty { margin: 4px 0 0; text-align: left; color: var(--wc-ink-secondary); }
  .actions { display: flex; gap: 8px; margin-top: 16px; }
  .secondary {
    flex: 1; min-height: 44px; padding: 0 16px; border-radius: 9999px;
    background: var(--wc-surface-raised); border: 1px solid var(--wc-outline);
    color: var(--wc-ink-primary); font: 600 1rem/1.5rem system-ui, "Roboto", sans-serif;
  }
  @container style(--wc-reduced: 1) {
    .scrim, .sheet { transition: opacity var(--wc-fade-ms); }
    .sheet { transform: none; }
  }
  .layer.instant .scrim, .layer.instant .sheet { transition: none; }
</style>
