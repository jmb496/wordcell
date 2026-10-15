<script lang="ts">
import { game, type RejectReason } from '../shell/game.svelte';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import { act } from './act';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import BlockingMessage from './BlockingMessage.svelte';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import Board from './Board.svelte';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import ConfirmDialogs from './ConfirmDialogs.svelte';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import EndSheet from './EndSheet.svelte';
import type { Controller } from './gestures/controller';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import Halted from './Halted.svelte';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import HistoryNotice from './HistoryNotice.svelte';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import HowToPlayPanel from './HowToPlayPanel.svelte';
import type { Layout } from './layout/layout.svelte';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import Menu from './Menu.svelte';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import { newGame } from './new-game';
import { overlays, SUSPENDING } from './overlays.svelte';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import PreferencesPanel from './PreferencesPanel.svelte';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import StatisticsPanel from './StatisticsPanel.svelte';
import { text } from './text';

// Roots: halted, Session rejected, the Board (AD-11) with the dialogs beside it. Script-side uses
// of `game` keep Biome from flagging the import (it misses markup). `layout` is the one live
// layout main.ts creates (AD-11), passed to the Board. `controller` is the one pointer controller
// (AD-12): the active branch's root attaches it on every mount and detaches it on unmount (F8).
let { layout, controller }: { layout: Layout; controller: Controller } = $props();

function pointerRoot(node: HTMLElement): { destroy: () => void } {
  return { destroy: controller.attach(node) };
}

const board = $derived(game.view);

// Epic 6 CAP-1 (6.1, SPEC F5, F6): `main` (Board, top bar, action bar) is inert while any modal
// surface is on the stack. The expanded end sheet and the WordCell view are not in the list (their
// entries own their exceptions). HistoryNotice, rendered below, keeps its own markup.
const mainInert = $derived(SUSPENDING.some((id) => overlays.isOpen(id)));

// Epic 4 SPEC CAP-6: one reaction recomputes the desktop hover classes at the last pointer
// point whenever the selection or the GameView changes (tap, drop, Undo, Redo, Reload, back).
$effect(() => {
  void overlays.selection;
  void game.view;
  controller.refreshHover();
});

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
    onaction={act(newGame)}
  />
{:else if game.state.kind === 'active' && board}
  <!-- AD-13: dialogs render beside the board; while the notice is rendered the board is inert. -->
  <main use:pointerRoot inert={mainInert} tabindex="-1">
    <Board view={board} {layout} />
  </main>
  <Menu view={board} hoverFine={layout.hoverFine} />
  <EndSheet view={board} />
  <PreferencesPanel />
  <StatisticsPanel />
  <HowToPlayPanel />
  <ConfirmDialogs />
  {#if overlays.isOpen('historyNotice')}
    <HistoryNotice />
  {/if}
{:else}
  <main class="booting">
    <h1>WordCell</h1>
  </main>
{/if}

<style>
  main:focus { outline: none; }
  .booting { padding: 16px; }
  h1 { margin: 0; font-size: 1.25rem; }
</style>
