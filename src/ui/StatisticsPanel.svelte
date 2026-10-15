<script lang="ts">
import { tick, untrack } from 'svelte';
import { scoreHistory } from '../shell/history.svelte';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import { act } from './act';
import { openSurface } from './open-surface';
import { overlays } from './overlays.svelte';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import Panel from './Panel.svelte';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import ResetConfirm from './ResetConfirm.svelte';
import { text } from './text';

// Epic 6 CAP-6 (ticket 6.5, R-84, Q-33, Q-35, Q-44; DESIGN.md Panels): the Statistics panel,
// opened only through `openSurface('statistics')` (the Menu row). It formats `scoreHistory`'s
// `statistics` unchanged (AD-3): six tiles in a 2 x 3 grid, `—` where no value exists, the empty
// line under them only with no games played. While the history is unreadable it shows the History
// message (the shared reason-to-sentence mapping over the live `scoreHistory.historyState.reason`) and
// Reset history instead. Reset history opens the shared ResetConfirm: Delete history leaves the
// panel open showing the fresh view, Keep it leaves the message. Esc closes the topmost
// overlay through the key handler (keys.ts, ticket 6.10). Focus after the confirm closes
// goes to Reset history, or the heading when Delete removed it; at panel close to the ☰ button
// after `tick()` (as PreferencesPanel does).
const open = $derived(overlays.isOpen('statistics'));
const historyState = $derived(scoreHistory.state);
// AD-3: the readable branch needs `statistics`; undefined there is a store bug (rule 6), so fail fast.
function readable() {
  const s = scoreHistory.statistics;
  if (s === undefined)
    throw new Error('scoreHistory.statistics is undefined while the history is readable');
  return s;
}
let wasOpen = false;
let confirmWasOpen = false;
let content: HTMLElement | undefined = $state();
let resetButton: HTMLButtonElement | undefined = $state();

$effect(() => {
  const now = open;
  untrack(() => {
    if (wasOpen && !now) {
      void tick().then(() => {
        if (overlays.isOpen('menu')) return;
        document.querySelector<HTMLElement>(`button[aria-label="${text.menu}"]`)?.focus();
      });
    }
    wasOpen = now;
  });
});

$effect(() => {
  const now = open && overlays.isOpen('resetConfirm');
  untrack(() => {
    if (confirmWasOpen && !now && open) {
      void tick().then(() => {
        if (!open || overlays.top !== 'statistics') return;
        const target =
          resetButton ?? content?.closest('[role="dialog"]')?.querySelector<HTMLElement>('h2');
        target?.focus();
      });
    }
    confirmWasOpen = now;
  });
});

function close(): void {
  overlays.close('statistics');
}

function openConfirm(): void {
  openSurface('resetConfirm');
}

const none = text.statNone;
const tiles = $derived.by(() => {
  if (historyState.status === 'unreadable') return [];
  const stats = readable();
  return [
    [text.statGamesPlayed, String(stats.gamesPlayed)],
    [text.statGamesWon, String(stats.gamesWon)],
    [text.statGamesGivenUp, String(stats.gamesGivenUp)],
    [text.statBestScore, stats.bestScore === undefined ? none : text.statNumber(stats.bestScore)],
    [
      text.statAverageScore,
      stats.averageScore === undefined ? none : text.statNumber(stats.averageScore),
    ],
  ] as const;
});
</script>

<Panel title={text.statistics} closeLabel={text.closeStatistics} onclose={act(close)}
  {open}
  covered={overlays.top === 'resetConfirm'}
>
  <div bind:this={content}>
    {#if historyState.status === 'unreadable'}
      <p class="message">{text.historySentence(historyState.reason)} {text.historyResetHint}</p>
      <button type="button" class="reset" bind:this={resetButton} onclick={act(openConfirm)}
        >{text.resetHistory}</button
      >
    {:else}
      {@const stats = readable()}
      <div class="tiles">
        {#each tiles as [label, value] (label)}
          <div class="tile">
            <p class="label">{label}</p>
            <p class="value">{value}</p>
          </div>
        {/each}
        <div class="tile">
          <p class="label">{text.statLongestWord}</p>
          <p class="value word">{stats.longestWord?.spelling.toUpperCase() ?? none}</p>
          {#if stats.longestWord !== undefined}
            <p class="caption">{text.statLetters(stats.longestWord.letterCount)}</p>
          {/if}
        </div>
      </div>
      {#if stats.gamesPlayed === 0}
        <p class="empty">{text.statisticsEmpty}</p>
      {/if}
    {/if}
  </div>
</Panel>

{#if open && overlays.isOpen('resetConfirm')}
  <ResetConfirm />
{/if}

<style>
  .tiles { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; padding-top: 8px; }
  .tile {
    box-sizing: border-box; min-height: 88px; padding: 12px 16px;
    background: var(--wc-surface); border: 1px solid var(--wc-outline); border-radius: 12px;
  }
  .tile p { margin: 0; }
  .label, .caption, .empty {
    font: 400 0.875rem/1.25rem system-ui, "Roboto", sans-serif; color: var(--wc-ink-secondary);
  }
  .value {
    font: 700 1.5rem/2rem system-ui, "Roboto", sans-serif; font-variant-numeric: tabular-nums;
    color: var(--wc-ink-primary);
  }
  .word { overflow-wrap: anywhere; }
  .empty { margin-top: 16px; }
  .message {
    margin: 8px 0 16px; font: 400 1rem/1.5rem system-ui, "Roboto", sans-serif;
    color: var(--wc-ink-primary);
  }
  .reset {
    min-height: 44px; padding: 0 16px; border: none; border-radius: 9999px;
    background: var(--wc-error); color: var(--wc-ink-on-accent);
    font: 600 1rem/1.5rem system-ui, "Roboto", sans-serif;
  }
</style>
