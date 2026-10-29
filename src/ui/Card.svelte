<script lang="ts">
import type { CardId, Face } from '../engine/index';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import { text } from './text';

// F26 card: the element is a slot-wide wrapper, strip tall, or H tall when `full` (a column's last
// card, a WordCell card), so hits resolve to the wrapper; the face is centred inside it with
// `pointer-events: none`. Geometry comes from the Board's CSS variables; a tray or strip tile is
// one tile pitch (tileWidth + 4) wide and card (H) or compact (44 px) tall (DESIGN.md Tile).
// AD-14: a live card carries data-card-id, data-testid and data-place; a `mirror` (ghost, used
// WordCell face, D-block tray copy, WordCell view copy, Place preview top) carries only
// data-mirror-of. A `preview` mirror (Q-49, DESIGN.md WordCell *place preview*) is the target's
// top after the commit, a copy of the strip's last tile at full opacity; it is also the fly-in
// hold's copy of the cell's new top (WordCellRow, flip.ts `inFlight`, F28, E6), drawn without
// `previewMark`. Like every mirror it never takes part in a FLIP glide (flip.ts reads only live
// elements).
// A `view` mirror (place `view`, epic 4 SPEC CAP-9, R-65; DESIGN.md WordCell view, AD-14) is a
// full-height card in the sheet's flow, `pan-y` so a swipe scrolls the sheet, never hatched or
// dimmed (a used cell's top is a normal card there); `topTag` adds the `top` pill. Tile corner
// marks (epic 5 SPEC CAP-1; DESIGN.md Tile, Placement strip) go by mode (card, compact) and place
// (`tray`, `strip`): the origin `tag`, the strip `position` mark (`bottom`/`top` + `★` in the
// card-mode bottom band; `▼`/`★` top-left on compact) and the `↩` `returnSlot` (Composing only).
let {
  id,
  face,
  place,
  mirror,
  full = false,
  hidden = false,
  destination = false,
  tile,
  segment,
  lifted = false,
  remainderTop = false,
  topTag = false,
  tag,
  position,
  returnSlot = false,
  selected = false,
  stop = false,
  onfocus,
  name,
  silent = false,
  used = false,
  previewMark = false,
  markEl,
}: {
  id: CardId;
  face: Face;
  /** Where the element sits; a live card also exposes it as data-place. */
  place: 'column' | 'cell' | 'tray' | 'strip' | 'view';
  mirror?: 'ghost' | 'used' | 'block' | 'view' | 'static' | 'preview';
  full?: boolean;
  hidden?: boolean;
  /** A live D card in its column in Composing (DESIGN.md Card, in destination block). */
  destination?: boolean;
  /** `gapAbove`/`gapBelow`: a compact row gap faces that side (epic 5 SPEC F2 hit rect). */
  tile?: { mode: 'card' | 'compact'; width: number; gapAbove: boolean; gapBelow: boolean };
  /** A `block` mirror's place in its row segment: outline ends and the lock at the start. */
  segment?: { start: boolean; end: boolean };
  /** In the tap-selected tail; only the face rises (epic 4 SPEC F26). */
  lifted?: boolean;
  /** The source column's lowest card outside the selected tail (R-21 drop-self hover). */
  remainderTop?: boolean;
  /** R-65: the view's top card, tagged `top` (DESIGN.md WordCell view). */
  topTag?: boolean;
  /**
   * Epic 5 SPEC CAP-1: a free-letter tile's origin WordCell (corner per mode and place, DESIGN.md
   * Tile).
   */
  tag?: number;
  /** Epic 5 SPEC CAP-1: a strip tile's position mark, first (`bottom`) or last (`top`, R-50). */
  position?: 'bottom' | 'top';
  /**
   * Epic 5 SPEC CAP-1: the `↩` return glyph of a selected free-letter tile (Composing; epic 5 SPEC
   * CAP-4).
   */
  returnSlot?: boolean;
  /**
   * Epic 5 SPEC CAP-4: the tap-selected live tile (DESIGN.md Tile: teal 2 px outline, face lifted
   * 4 px, slot unchanged; distinct from the column `lifted` look, no shadow).
   */
  selected?: boolean;
  /** Epic 6 CAP-10 (6.11): this live card is its region's one Tab stop (`tabindex` 0, else -1). */
  stop?: boolean;
  /** Epic 6 CAP-10 (6.11): reports focus to the roving memory (roving.svelte.ts). */
  onfocus?: () => void;
  /**
   * Epic 6 CAP-11 (6.13): the screen-reader name, built by the parent from `GameView` and the
   * selection (`text.ts`); a live card with a name is a `role="button"`, a mirror never has one.
   */
  name?: string;
  /** Epic 6 CAP-11 (6.13): a buried WordCell card, hidden from screen readers (no role). */
  silent?: boolean;
  /**
   * A `static` card drawn in the WordCell used look (R-33) without being a `used` mirror (the How
   * to play scenes carry no data-mirror-of, AD-14; owner decision D11).
   */
  used?: boolean;
  /**
   * Q-49 (DESIGN.md WordCell *place preview*): the orange `★` pill at the card rect's bottom-left,
   * inset 2 px as the count badge, on the shown top of a non-empty Place preview (WordCellRow) and
   * reused by the How to play scenes on a `static` card (epic place-preview entry 4). It sits over
   * the flourish without suppressing it (`bandMark` is unchanged).
   */
  previewMark?: boolean;
  /**
   * How to play only (epic place-preview entry 4): the `data-scene-el` of the `previewMark` pill,
   * so a scene step can fade the `★` (Scene.svelte passes `mark-<i>`; WordCellRow never does).
   */
  markEl?: string;
} = $props();

// Epic 6 CAP-10 (6.11): only a live column, tray or strip card takes focus (a Tab stop, or -1 for
// the rest of its region); mirrors and the cards stacked in a WordCell never do (AD-14).
const focusable = $derived(
  mirror === undefined && (place === 'column' || place === 'tray' || place === 'strip'),
);

// Epic 6 CAP-11 (6.13): only a live, audible card carries its name.
const named = $derived(name !== undefined && mirror === undefined && !silent);

// DESIGN.md Card: `QU` is set as `Qu` with the ×2 badge (Q-06).
const qu = $derived(face.letter === 'QU');
const glyph = $derived(qu ? 'Qu' : face.letter);
const ghost = $derived(mirror === 'ghost');
const block = $derived(mirror === 'block');
// Epic 5 SPEC CAP-6: every block mirror renders the lock; CSS shows it on a segment start only.
const lock = $derived(destination || block);
// DESIGN.md Tile corner map (`.face`-relative): card-mode tray marks sit in the bottom band; a
// strip moves the origin tag top-left (A-D10); compact tiles have no band and use the corners.
const compact = $derived(tile?.mode === 'compact');
const inStrip = $derived(place === 'strip');
const tagCorner = $derived(compact ? (inStrip ? 'bl' : 'tl') : inStrip ? 'tl' : 'band-l');
const returnCorner = $derived(compact ? (qu ? 'br' : 'tr') : 'band-r');
const showReturn = $derived(returnSlot && !inStrip);
const strippedPosition = $derived(inStrip ? position : undefined);
// The flourish yields only to a bottom-band mark (card mode).
const bandMark = $derived(
  !compact && (inStrip ? strippedPosition !== undefined : tag !== undefined || showReturn),
);
// AD-14: only the WordCell view's copies sit in the view, and they are always mirrors.
const inView = $derived.by(() => {
  if ((place === 'view') !== (mirror === 'view')) {
    throw new Error(`AD-14 card ${id}: place ${place} with mirror ${mirror ?? 'none'}`);
  }
  return place === 'view';
});
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
  class="card"
  class:full
  class:cell={place === 'cell'}
  class:tile={tile !== undefined}
  class:compact={tile?.mode === 'compact'}
  class:gap-above={tile?.gapAbove}
  class:gap-below={tile?.gapBelow}
  class:hidden
  class:destination
  class:ghost
  class:used={mirror === 'used' || (mirror === 'static' && used)}
  class:static={mirror === 'static'}
  class:preview={mirror === 'preview'}
  class:block
  class:start={segment?.start}
  class:end={segment?.end}
  class:lifted
  class:selected
  class:remainder-top={remainderTop}
  class:view={inView}
  class:band-marked={bandMark}
  style:--tile-w={tile ? `${tile.width}px` : undefined}
  data-card-id={mirror ? undefined : id}
  data-testid={mirror ? undefined : `card-${id}`}
  data-place={mirror ? undefined : place}
  data-mirror-of={mirror && mirror !== 'static' ? id : undefined}
  role={named ? 'button' : undefined}
  aria-label={named ? name : undefined}
  aria-hidden={mirror || silent ? 'true' : undefined}
  tabindex={focusable ? (stop ? 0 : -1) : undefined}
  onfocus={focusable ? onfocus : undefined}
>
  <div class="face">
    {#if !ghost}
      {#if lock}
        <svg class="lock" viewBox="0 0 10 12" width="10" height="12" aria-hidden="true">
          <path class="shackle" d="M2.75 5.5 V3.75 a2.25 2.25 0 0 1 4.5 0 V5.5" />
          <rect x="1" y="5.5" width="8" height="6" rx="1" />
        </svg>
      {/if}
      <span class="glyph" class:qu>{glyph}</span>
      {#if qu}<span class="badge">{text.quBadge}</span>{/if}
      {#if tag !== undefined}<span class="tag mark {tagCorner}">{tag}</span>{/if}
      {#if strippedPosition !== undefined}
        {#if compact}
          {#if strippedPosition === 'top'}<span class="star mark tl">{text.star}</span>{:else}<span class="bottom-mark mark tl">{text.stripBottomMark}</span>{/if}
        {:else}
          <span class="position mark band-l">{strippedPosition === 'top' ? text.stripTop : text.stripBottom}</span>
          {#if strippedPosition === 'top'}<span class="star mark band-r">{text.star}</span>{/if}
        {/if}
      {/if}
      {#if showReturn}<span class="return mark {returnCorner}">{text.returnGlyph}</span>{/if}
    {/if}
  </div>
  {#if topTag}<span class="top-tag">{text.viewTop}</span>{/if}
  {#if previewMark}<span class="preview-mark" data-scene-el={markEl} aria-hidden="true">{text.star}</span>{/if}
</div>

<style>
  .card {
    width: var(--wc-slot); height: var(--wc-strip); flex: none;
    touch-action: none; user-select: none; -webkit-user-select: none; -webkit-touch-callout: none;
  }
  .card.full { height: var(--wc-H); }
  /* DESIGN.md Focus ring (epic 6 CAP-10): 2 px accent-teal, `:focus-visible` only, enclosing the
     card's visible strip (the wrapper), drawn inside it so the next card never covers it; it is
     distinct from the selection outline on the face, and both draw when both apply. */
  .card:focus-visible { outline: 2px solid var(--wc-accent-teal); outline-offset: -2px; }
  /* Ticket 6.9: a static How to play example card takes no gestures; the panel must scroll. */
  .card.static { touch-action: pan-y; }
  .card.cell { position: absolute; top: 0; left: 0; }
  .card.hidden { visibility: hidden; }
  /* R-65: a WordCell view mirror, in the sheet's flow; the sheet pans under it. */
  .card.view { position: relative; touch-action: pan-y; }
  /* DESIGN.md WordCell view `top` tag: an 11 px pill at the face's foot. */
  .top-tag {
    position: absolute; left: 50%; bottom: 3px; transform: translateX(-50%);
    box-sizing: border-box; height: 14px; padding: 0 6px; border-radius: 9999px;
    display: grid; place-items: center;
    background: var(--wc-surface-raised); color: var(--wc-ink-primary);
    font: 700 11px/1 system-ui, "Roboto", sans-serif; pointer-events: none;
  }
  /* DESIGN.md WordCell *place preview* (Q-49): the `★` on a 16 px surface-raised pill inside the
     card rect, bottom-left, inset 2 px (the face starts 2 px into the wrapper); a later sibling
     such as the WordCell count badge draws above it where they meet (owner decision 2026-10-28). */
  .preview-mark {
    position: absolute; left: 4px; bottom: 2px; box-sizing: border-box;
    width: 16px; height: 16px; border-radius: 9999px; display: grid; place-items: center;
    background: var(--wc-surface-raised); color: var(--wc-accent-orange);
    font: 700 11px/1 system-ui, "Roboto", sans-serif; pointer-events: none;
  }
  .face {
    position: relative; box-sizing: border-box; width: var(--wc-w); height: var(--wc-H); margin: 0 2px;
    background-color: var(--wc-card-face); background-image: var(--wc-card-texture);
    border: 1px solid var(--wc-card-edge); border-radius: 6px;
    color: var(--wc-card-ink); pointer-events: none;
    /* Epic 5 SPEC CAP-8: the marks' and lock's z-index 1 stay inside their face, so a gliding
       face (z-index 1, flip.ts) layers as one. */
    isolation: isolate;
  }
  /* DESIGN.md Card flourish: a centred 1 px curve, 60 % of the width, at 86 % of the height. */
  .face::after {
    content: ''; position: absolute; left: 20%; width: 60%; top: calc(86% - 3px); height: 3px;
    border-bottom: 1px solid var(--wc-card-edge); border-radius: 0 0 50% 50%;
  }
  /* DESIGN.md Card: glyph centred in the letter band (top 72 %); `Qu` from 12 px below the top. */
  .glyph {
    position: absolute; left: 0; right: 0; top: 0; height: 72%;
    display: flex; align-items: center; justify-content: center;
    font-family: "WordCell Serif", serif; font-weight: 600; line-height: 1;
    font-size: calc(var(--wc-w) * 0.56);
  }
  .glyph.qu { top: 12px; height: calc(72% - 12px); font-size: calc(var(--wc-w) * 0.44); }
  .badge {
    position: absolute; top: 1px; right: 1px; box-sizing: border-box; width: 18px; height: 12px;
    display: grid; place-items: center; border-radius: 9999px;
    background: var(--wc-accent-orange); color: var(--wc-ink-on-accent);
    font: 700 11px/1 system-ui, "Roboto", sans-serif;
  }

  /* DESIGN.md Tile, Placement strip: tile marks (card-badge, 11 px 700) at a corner of the face
     or in the card-mode bottom band (left or right); the flourish is omitted when the bottom band
     holds a mark. The ★ is orange. */
  .mark {
    position: absolute; z-index: 1; display: flex; align-items: center; height: 12px;
    font: 700 11px/1 system-ui, "Roboto", sans-serif; color: var(--wc-card-ink);
  }
  .mark.band-l, .mark.band-r { top: 72%; height: 28%; max-width: calc(100% - 8px); overflow: hidden; }
  .mark.band-l { left: 4px; }
  .mark.band-r { right: 4px; }
  .mark.tl { top: 2px; left: 3px; }
  .mark.tr { top: 1px; right: 3px; }
  .mark.bl { bottom: 2px; left: 3px; }
  .mark.br { bottom: 2px; right: 3px; }
  .star { color: var(--wc-accent-orange); }
  .band-marked .face::after { content: none; }

  /* DESIGN.md Tile: a card face tileWidth wide in a tile-pitch wrapper (F26 hit rect). */
  .card.tile { width: calc(var(--tile-w) + 4px); height: var(--wc-H); }
  .tile .face { width: var(--tile-w); }
  /* Compact tiles: 44 px, no flourish, glyph 22 px (`Qu` 18 px) centred on the full height. */
  .card.tile.compact { height: 44px; }
  .compact .face { height: 44px; }
  .compact .face::after { content: none; }
  /* Epic 5 SPEC F2: a compact tile's hit rect owns half of each 4 px row gap it faces (2 px above
     a row after the first, 2 px below a row before the last; never past the tile area's outer
     rows); the horizontal half-gaps are already inside the pitch-wide wrapper. */
  .card.tile.compact { position: relative; }
  .card.tile.compact::before { content: ''; position: absolute; inset: 0; }
  .card.tile.compact.gap-above::before { top: -2px; }
  .card.tile.compact.gap-below::before { bottom: -2px; }
  .compact .glyph { top: 0; height: 100%; font-size: 22px; }
  .compact .glyph.qu { top: 0; height: 100%; font-size: 18px; }

  /* DESIGN.md Card ghost: 1 px dashed outline, no face fill, no glyph, no flourish. */
  .ghost .face { background: none; background-image: none; border: 1px dashed var(--wc-outline); }
  .ghost .face::after { content: none; }

  /* DESIGN.md Card, in destination block: destination fill, 2 px blue outline, lock top-left. */
  .destination .face,
  .block .face { background-color: var(--wc-destination-fill); border: 2px solid var(--wc-destination); }
  .lock { position: absolute; top: 0; left: 0; z-index: 1; }
  /* Epic 5 SPEC CAP-6: a block mirror's lock shows on its row segment's start: `.start` at rest,
     `wc-part-start` while the controller marks it `wc-parted` (a free-letter parting moves the
     segment ends; gestures/classes.ts). */
  .block:not(:global(.wc-parted)):not(.start) .lock,
  .block:global(.wc-parted):not(:global(.wc-part-start)) .lock { display: none; }
  .lock rect { fill: var(--wc-destination); }
  .lock .shackle { fill: none; stroke: var(--wc-destination); stroke-width: 1.5; }
  .destination .badge,
  .block .badge { top: 0; right: 0; }
  /* Epic 5 SPEC CAP-6: every segment-end rule below reads `.start`/`.end` at rest and only
     `wc-part-start`/`wc-part-end` under the controller's `wc-parted` (gestures/classes.ts); each
     :is() pair is one end test (start, not start, end, not end), so the resting look is unchanged. */
  /* A9 4.3-m4: a block face that is not a segment end is widened past its tile (overlap, no right
     border), so its badge sits 5 px in from the face edge: right edge at wrapper x + tileWidth on
     every block tile, as on the end tile (face to x + tileWidth + 2, 2 px border). */
  .block:is(
      :not(:global(.wc-parted)):not(.end),
      :global(.wc-parted):not(:global(.wc-part-end))
    )
    .badge { right: 5px; }
  /* DESIGN.md Destination block: the D tiles joined over the 4 px gap, one outline per row
     segment; inner edges drop their side border and radius. */
  .block .face { width: calc(var(--tile-w) + 4px); margin: 0; border-radius: 0; }
  .block:is(.start:not(:global(.wc-parted)), :global(.wc-parted.wc-part-start)) .face {
    width: calc(var(--tile-w) + 2px); margin-left: 2px; border-top-left-radius: 6px;
    border-bottom-left-radius: 6px;
  }
  .block:is(.end:not(:global(.wc-parted)), :global(.wc-parted.wc-part-end)) .face {
    width: calc(var(--tile-w) + 2px); margin-right: 2px; border-top-right-radius: 6px;
    border-bottom-right-radius: 6px;
  }
  .block:is(.start:not(:global(.wc-parted)), :global(.wc-parted.wc-part-start)):is(
      .end:not(:global(.wc-parted)),
      :global(.wc-parted.wc-part-end)
    )
    .face { width: var(--tile-w); }
  .block:is(
      :not(:global(.wc-parted)):not(.start),
      :global(.wc-parted):not(:global(.wc-part-start))
    )
    .face { border-left: none; }
  .block:is(
      :not(:global(.wc-parted)):not(.end),
      :global(.wc-parted):not(:global(.wc-part-end))
    )
    .face { border-right: none; }
  /* Overlap the next block tile by 1 px so fractional device pixels leave no seam. */
  .block:is(
      :not(:global(.wc-parted)):not(.start),
      :global(.wc-parted):not(:global(.wc-part-start))
    ):is(
      :not(:global(.wc-parted)):not(.end),
      :global(.wc-parted):not(:global(.wc-part-end))
    )
    .face { width: calc(var(--tile-w) + 5px); }
  .block:is(.start:not(:global(.wc-parted)), :global(.wc-parted.wc-part-start)):is(
      :not(:global(.wc-parted)):not(.end),
      :global(.wc-parted):not(:global(.wc-part-end))
    )
    .face { width: calc(var(--tile-w) + 3px); }

  /* DESIGN.md WordCell used this word (R-33): `.card.used .face` is the shared rule in app.css. */

  /* DESIGN.md Elevation & Depth: a tap-selected card's face rises `--wc-select-lift` (Board, from
     SELECTION_LIFT_PX) with the soft shadow, above the sticky bars (z-index 2); the wrapper (hit
     rect) never moves (F26). */
  .lifted .face { transform: translateY(calc(-1 * var(--wc-select-lift))); box-shadow: 0 6px 16px var(--wc-shadow-drag); z-index: 3; }

  /* DESIGN.md Tile, tap-selected tile (epic 5 SPEC CAP-4, F2): the face rises 4 px with a 2 px teal
     outline and no shadow; the wrapper (hit rect, slot) never moves. */
  .card.tile.selected .face {
    transform: translateY(-4px); outline: 2px solid var(--wc-accent-teal); z-index: 3;
  }

</style>
