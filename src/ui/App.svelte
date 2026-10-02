<script lang="ts">
import { game, type RejectReason } from '../shell/game.svelte';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import BlockingMessage from './BlockingMessage.svelte';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import Board from './Board.svelte';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import Halted from './Halted.svelte';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import HistoryNotice from './HistoryNotice.svelte';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import { newGame } from './new-game';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import { overlays } from './overlays.svelte';
import { text } from './text';

// Roots: halted, Session rejected, the Board (AD-11) with the dialogs beside it. Script-side uses
// of `game` keep Biome from flagging the import (it misses markup).
const board = $derived(game.view);

// §2 Session rejected: the catalogue body for the parse reason (EXPERIENCE.md message catalogue).
function rejectedBody(reason: RejectReason): string {
  switch (reason.reason) {
    case 'version-unknown':
      return text.rejectedVersionUnknown(reason.version);
    case 'version-unreadable':
      return text.rejectedVersionUnreadable;
    case 'replay-failed':
      return text.rejectedReplayFailed(reason.version);
  }
}
</script>

{#if game.state.kind === 'halted'}
  <Halted />
{:else if game.state.kind === 'rejected'}
  <BlockingMessage
    title={text.rejectedTitle}
    body={rejectedBody(game.state.reason)}
    action={text.newGame}
    onaction={newGame}
  />
{:else if game.state.kind === 'active' && board}
  <!-- AD-13: dialogs render beside the board; while the notice is rendered the board is inert. -->
  <main inert={overlays.isOpen('historyNotice')}>
    <Board view={board} />
  </main>
  {#if overlays.isOpen('historyNotice')}
    <HistoryNotice />
  {/if}
{:else}
  <main class="booting">
    <h1>WordCell</h1>
  </main>
{/if}

<style>
  .booting { padding: 16px; }
  h1 { margin: 0; font-size: 1.25rem; }
</style>
