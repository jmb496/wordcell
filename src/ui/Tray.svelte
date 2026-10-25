<script lang="ts">
import type { CardId, GameView } from '../engine/index';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import { game } from '../shell/game.svelte';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import { act } from './act';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import { resultOf } from './end-sheet';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import { dropTarget } from './gestures/drop-target';
import { type TrayLayout, type TrayTile, trayTiles } from './layout/tray';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import { overlays } from './overlays.svelte';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import { text } from './text';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import ControlRow from './tray/ControlRow.svelte';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import TileRows from './tray/TileRows.svelte';
import { originCard } from './tray/tags';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import WordLine from './tray/WordLine.svelte';

// Epic 5 tray band (DESIGN.md Tray band, Placement strip): the reserved band (height from
// `bands()`) with the word line, the tile rows and the control row, switching on `view.place`,
// then `view.draft`, else empty (AD-3). Composing: the word line (or the R-38 invalid line while
// `feedback.rejectedWord` is set), tiles in R-30 tray order with the D-block mirrors at the
// `side` end and free-letter origin tags, the D-block controls (or the k = 0 caption) and the
// letter count. Place: the word line in word order (`draft.wordCards`, no D underline, R-51), the
// strip in `placementOrder` with origin tags and the `bottom`/`top` marks, and the meta (R-80),
// no controls. Idle and Game over: all three rows empty. The band is the tile drag's one drop target
// (AD-12 `use:dropTarget`, epic 5 SPEC CAP-5). `inert`: the Board's expanded-end-sheet inert
// (epic 6 SPEC F5).
let {
  view,
  sizing,
  height,
  hoverFine,
  inert = false,
}: {
  view: GameView;
  sizing: TrayLayout;
  height: number;
  hoverFine: boolean;
  inert?: boolean;
} = $props();

// The draft in Composing and Place (`view.draft` is set in both); `place` only in Place.
const draft = $derived(view.draft);
const place = $derived(view.place);
const NO_DESTINATION: readonly CardId[] = [];
const tiles: TrayTile[] = $derived(trayTiles(view));
// Free-letter origin tags, looked up per render from `cells` (AD-3; no stored map).
const tags: ReadonlyMap<CardId, number> = $derived(
  new Map(draft?.freeLetters.map((cell) => [originCard(view.cells, cell), cell]) ?? []),
);
</script>

<div
  class="tray"
  data-band="tray"
  style:height="{height}px"
  {inert}
  use:dropTarget={{ kind: 'tray' }}
>
  <div class="word-line">
    {#if draft !== undefined}
      <WordLine
        faces={view.faces}
        wordCards={draft.wordCards}
        destination={place === undefined ? draft.destination : NO_DESTINATION}
        rejectedWord={place === undefined ? game.feedback.rejectedWord : undefined}
      />
    {:else if view.pendingDraftWord !== undefined}
      {@const pending = text.pendingDraft(view.pendingDraftWord)}
      <!-- Idle with a redo tail (R-72, Q-41): what Redo brings back; static text, no live region. -->
      <p class="pending"><span class="pending-word">{pending.prefix}{pending.word}</span><span class="pending-suffix">{pending.suffix}</span></p>
    {/if}
  </div>
  <TileRows
    {tiles}
    faces={view.faces}
    strip={place !== undefined}
    {tags}
    {sizing}
  />
  <div class="controls">
    {#if draft !== undefined}
      <ControlRow
        {hoverFine}
        letterCount={draft.letterCount}
        meta={place === undefined ? undefined : { target: place.target, scoreDelta: place.scoreDelta }}
        controls={place === undefined
          ? { k: draft.k, canDecK: view.canDecK, canIncK: view.canIncK, canFlip: view.canFlip }
          : undefined}
      />
    {/if}
  </div>
  {#if overlays.endSheet === 'collapsed' && (view.status === 'won' || view.status === 'gaveUp')}
    {@const end = resultOf(view)}
    <!-- Epic 6 CAP-4 (6.6, DESIGN.md End screen): the collapsed end sheet's 56 px bar at the band's
         bottom edge, directly above the WordCell labels; no scrim, so the WordCells stay tappable. -->
    <button
      type="button"
      class="end-bar"
      aria-label={text.endBar(end.score, end.band)}
      onclick={act(() => overlays.expandEndSheet())}
    >
      <span class="end-score">{text.statNumber(end.score)}</span>
      <span class="end-band">{end.band}</span>
    </button>
  {/if}
</div>

<style>
  /* DESIGN.md Tray band: reserved height in every phase, padding 8, word line 24, tile area
     max(H, 92) clipping overflow (F2), control row 44. */
  .tray {
    flex: none; box-sizing: border-box; width: var(--wc-board); padding: 8px;
    position: relative; display: flex; flex-direction: column;
    background: var(--wc-surface); border-radius: 12px; touch-action: var(--wc-pan);
  }
  .word-line { flex: none; height: 24px; min-width: 0; }
  .pending {
    margin: 0; height: 24px; display: flex; align-items: center; justify-content: flex-start;
    font: 500 14px/20px system-ui, "Roboto", sans-serif; color: var(--wc-ink-secondary);
    white-space: nowrap; text-align: left;
  }
  .pending-word { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .pending-suffix { flex: none; white-space: pre; padding-inline-start: 0.25em; } /* pre keeps the suffix's leading space as a flex item; the padding makes the gap to the word visible */
  .controls { flex: none; height: 44px; }
  .end-bar {
    position: absolute; left: 0; right: 0; bottom: 0; z-index: 2; box-sizing: border-box; height: 56px;
    padding: 0 16px; display: flex; align-items: center; justify-content: space-between; gap: 16px;
    background: var(--wc-surface-raised); border: 1px solid var(--wc-outline); border-radius: 12px;
    color: var(--wc-ink-primary); touch-action: none;
  }
  .end-score { font: 700 18px/24px system-ui, "Roboto", sans-serif; font-variant-numeric: tabular-nums; }
  .end-band { font: 600 1.25rem/1.75rem system-ui, "Roboto", sans-serif; }
</style>
