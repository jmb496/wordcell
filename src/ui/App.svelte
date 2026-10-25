<script lang="ts">
import { tick, untrack } from 'svelte';
import { game, type RejectReason } from '../shell/game.svelte';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import { act } from './act';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import { region } from './announce';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import BlockingMessage from './BlockingMessage.svelte';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import Board from './Board.svelte';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import ConfirmDialogs from './ConfirmDialogs.svelte';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import Celebration from './celebration/Celebration.svelte';
import { celebration } from './celebration/celebration.svelte.ts';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import EndSheet from './EndSheet.svelte';
import { focusByPhase } from './focus-board';
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

// AD-19 (epic 10 entry 5): the active run's props; the mount below is keyed on them, so each run
// mounts once and registers its own group elements with the controller.
const run = $derived(celebration.props());

// Epic 6 CAP-1 (6.1, SPEC F5, F6): `main` (Board, top bar, action bar) is inert while any modal
// surface is on the stack. The expanded end sheet and the WordCell view are not in the list (their
// entries own their exceptions); `celebration` is, but leaves `main` usable (AD-13: the bars stay
// usable while it runs). HistoryNotice, rendered below, keeps its own markup.
const mainInert = $derived(SUSPENDING.some((id) => id !== 'celebration' && overlays.isOpen(id)));

// build-notes Per-surface behaviour (History notice: focus returns to the board): the notice
// unmounts at close (Not now, back, Delete history), so its Dialog has no opener to return to, and
// the phase focus (focus-follow.ts) yielded to it at boot. With no other surface on top (the
// relaunched expanded end sheet focuses its own first action), focus goes by the phase
// (focus-board.ts `focusByPhase`): the board, the first movable tile or the first strip card.
// A halt (Q-38, AD-15) or the rejected root owns the screen, so a close under it moves no focus.
let noticeWasOpen = false;
$effect(() => {
  const now = overlays.isOpen('historyNotice');
  untrack(() => {
    if (noticeWasOpen && !now) {
      void tick().then(() => {
        if (game.state.kind !== 'active' || overlays.top !== undefined) return;
        const view = game.view;
        if (view === undefined) throw new Error('AD-13 History notice closed with no GameView');
        focusByPhase(view);
      });
    }
    noticeWasOpen = now;
  });
});

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

<!-- Epic 6 CAP-11 (6.13): the one polite live region, mounted once here outside every branch and
     inert wrapper; only announce.ts sets it. -->
<div class="live" role="status" aria-live="polite" use:region></div>

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
  {#if run}
    {#key run}
      <Celebration
        groups={run.groups}
        band={run.band}
        cardW={run.cardW}
        register={celebration.register}
      />
    {/key}
  {/if}
  <PreferencesPanel />
  <StatisticsPanel />
  <HowToPlayPanel />
  <ConfirmDialogs view={board} />
  {#if overlays.isOpen('historyNotice')}
    <HistoryNotice />
  {/if}
{:else}
  <main class="booting">
    <h1>WordCell</h1>
  </main>
{/if}

<style>
  .live {
    position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; border: 0;
    overflow: hidden; clip-path: inset(50%); white-space: nowrap;
  }
  main:focus { outline: none; }
  .booting { padding: 16px; }
  h1 { margin: 0; font-size: 1.25rem; }
</style>
