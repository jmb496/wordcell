<script lang="ts">
import { tick, untrack } from 'svelte';
import type { GameView } from '../engine/index';
import { game } from '../shell/game.svelte';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import { act } from './act';
import { onDispatched } from './end-sheet';
import { requestNewGame, requestReplay } from './new-game';
import { openSurface } from './open-surface';
import { overlays } from './overlays.svelte';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import Sheet from './Sheet.svelte';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import { text } from './text';

// Epic 6 CAP-2 (ticket 6.2, SPEC F5, F6, F8; DESIGN.md Menu sheet; EXPERIENCE.md Menu sheet): the
// menu sheet, opened only through `openSurface('menu')` (the ☰ button). Rows: New game, Replay this
// deal, Give up; each closes the sheet first, then acts once (no push); New game and Replay go
// through the CAP-3 gates (a confirm while a game is in progress, else at once). Give up is `disabled` from `view.canGiveUp` only (AD-3, R-75). Every handler is
// wrapped in `act()`. After the menu closes by any path, focus goes to the board (build-notes
// Menu row); that return stays on `main` (tabindex -1), the 6.10 overlay focus return that ticket
// 6.11's phase-focus effect (focus-follow.ts) yields to.
// `Esc` closes it through the key handler (keys.ts, ticket 6.10).
// Epic 6 CAP-10 (6.11): on a desktop (`hoverFine`) New game and How to play carry `Label (Key)` titles.
let { view, hoverFine }: { view: GameView; hoverFine: boolean } = $props();

const open = $derived(overlays.isOpen('menu'));
let wasOpen = false;
// CAP-3: set only when a row's gate opened a confirm; the confirm's own effect owns that focus.
let skipFocus = false;

$effect(() => {
  const now = open;
  untrack(() => {
    if (wasOpen && !now) {
      if (skipFocus) skipFocus = false;
      else void tick().then(() => document.querySelector('main')?.focus());
    }
    wasOpen = now;
  });
});

function close(): void {
  overlays.close('menu');
}

function startNewGame(): void {
  close();
  skipFocus = requestNewGame(view, 'menu');
}

function replay(): void {
  close();
  skipFocus = requestReplay(view, 'menu');
}

// Ticket 6.6: Give up opens the end sheet at once, which owns the focus (its first action).
function giveUp(): void {
  close();
  overlays.clearTile();
  skipFocus = true;
  onDispatched(game.dispatch({ type: 'giveUp' }), (callback) => callback());
}

// Ticket 6.4: Preferences closes the menu, then opens the panel; Panel owns the focus, so Menu's
// close leaves it alone (skipFocus, as the confirm rows do).
function preferences(): void {
  close();
  skipFocus = true;
  openSurface('preferences');
}

// Ticket 6.5: Statistics closes the menu, then opens the panel, which owns the focus (as above).
function statistics(): void {
  close();
  skipFocus = true;
  openSurface('statistics');
}

// Ticket 6.9: How to play closes the menu, then opens the panel, which owns the focus (as above).
function howToPlay(): void {
  close();
  skipFocus = true;
  openSurface('howToPlay');
}
</script>

<Sheet title={text.menu} closeLabel={text.closeMenu} onclose={act(close)} onscrim={act(close)} {open}>
  <ul class="rows">
    <li>
      <button
        type="button"
        class="row"
        title={hoverFine ? text.tooltip('newGame') : undefined}
        onclick={act(startNewGame)}
      >
        <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
          <path d="M12 5 V19" />
          <path d="M5 12 H19" />
        </svg>
        <span>{text.newGame}</span>
      </button>
    </li>
    <li>
      <button type="button" class="row" onclick={act(replay)}>
        <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
          <path d="M5 12 A7 7 0 1 0 8 6.3" />
          <path d="M4 4 V8 H8" />
        </svg>
        <span>{text.replayDeal}</span>
      </button>
    </li>
    <li>
      <button type="button" class="row" disabled={!view.canGiveUp} onclick={act(giveUp)}>
        <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
          <path d="M6 21 V4" />
          <path d="M6 5 H18 L15 9 L18 13 H6" />
        </svg>
        <span>{text.giveUp}</span>
      </button>
    </li>
    <li>
      <button type="button" class="row" onclick={act(statistics)}>
        <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
          <path d="M6 20 V12" />
          <path d="M12 20 V5" />
          <path d="M18 20 V9" />
        </svg>
        <span>{text.statistics}</span>
      </button>
    </li>
    <li>
      <button type="button" class="row" onclick={act(preferences)}>
        <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
          <path d="M4 7 H20" />
          <path d="M4 17 H20" />
          <circle cx="9" cy="7" r="2" />
          <circle cx="15" cy="17" r="2" />
        </svg>
        <span>{text.preferences}</span>
      </button>
    </li>
    <li>
      <button
        type="button"
        class="row"
        title={hoverFine ? text.tooltip('howToPlay') : undefined}
        onclick={act(howToPlay)}
      >
        <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M9.5 9.5 a2.5 2.5 0 1 1 3.5 2.3 c-0.7 0.4 -1 0.9 -1 1.7" />
          <path d="M12 17 V17.01" />
        </svg>
        <span>{text.howToPlay}</span>
      </button>
    </li>
  </ul>
  <p class="version">{__APP_VERSION__}</p>
</Sheet>

<style>
  .rows { list-style: none; margin: 0; padding: 0; }
  .row {
    box-sizing: border-box; width: 100%; min-height: 52px; padding: 0 16px;
    display: flex; align-items: center; gap: 16px; text-align: left;
    background: none; border: none; color: var(--wc-ink-primary);
    font: 400 1rem/1.5rem system-ui, "Roboto", sans-serif;
  }
  .row:not(:disabled):active { background: var(--wc-surface-raised); }
  .row:disabled { color: var(--wc-ink-disabled); }
  .row svg { flex: none; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
  .version {
    margin: 0; padding: 12px 16px 16px;
    font: 400 0.875rem/1.25rem system-ui, "Roboto", sans-serif; color: var(--wc-ink-secondary);
  }
</style>
