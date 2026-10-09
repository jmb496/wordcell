<script lang="ts">
import type { CardId, Face } from '../engine/index';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import { text } from './text';

// F26 card: the element is a slot-wide wrapper, strip tall, or H tall when `full` (a column's last
// card, a WordCell card), so hits resolve to the wrapper; the face is centred inside it with
// `pointer-events: none`. Geometry comes from the Board's CSS variables; a tray or strip tile is
// one tile pitch (tileWidth + 4) wide and card (H) or compact (44 px) tall (DESIGN.md Tile).
// AD-14: a live card carries data-card-id, data-testid and data-place; a `mirror` (ghost, used
// WordCell face, D-block tray copy, WordCell view copy) carries only data-mirror-of.
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
}: {
  id: CardId;
  face: Face;
  /** Where the element sits; a live card also exposes it as data-place. */
  place: 'column' | 'cell' | 'tray' | 'strip' | 'view';
  mirror?: 'ghost' | 'used' | 'block' | 'view';
  full?: boolean;
  hidden?: boolean;
  /** A live D card in its column in Composing (DESIGN.md Card, in destination block). */
  destination?: boolean;
  tile?: { mode: 'card' | 'compact'; width: number };
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
} = $props();

// DESIGN.md Card: `QU` is set as `Qu` with the ×2 badge (Q-06).
const qu = $derived(face.letter === 'QU');
const glyph = $derived(qu ? 'Qu' : face.letter);
const ghost = $derived(mirror === 'ghost');
const block = $derived(mirror === 'block');
const lock = $derived(destination || (block && segment?.start === true));
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

<div
  class="card"
  class:full
  class:cell={place === 'cell'}
  class:tile={tile !== undefined}
  class:compact={tile?.mode === 'compact'}
  class:hidden
  class:destination
  class:ghost
  class:used={mirror === 'used'}
  class:block
  class:start={segment?.start}
  class:end={segment?.end}
  class:lifted
  class:remainder-top={remainderTop}
  class:view={inView}
  class:band-marked={bandMark}
  style:--tile-w={tile ? `${tile.width}px` : undefined}
  data-card-id={mirror ? undefined : id}
  data-testid={mirror ? undefined : `card-${id}`}
  data-place={mirror ? undefined : place}
  data-mirror-of={mirror ? id : undefined}
  aria-hidden={mirror ? 'true' : undefined}
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
</div>

<style>
  .card {
    width: var(--wc-slot); height: var(--wc-strip); flex: none;
    touch-action: none; user-select: none; -webkit-user-select: none; -webkit-touch-callout: none;
  }
  .card.full { height: var(--wc-H); }
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
  .face {
    position: relative; box-sizing: border-box; width: var(--wc-w); height: var(--wc-H); margin: 0 2px;
    background: var(--wc-card-face); border: 1px solid var(--wc-card-edge); border-radius: 6px;
    color: var(--wc-card-ink); pointer-events: none;
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
  .mark.band-l, .mark.band-r { top: 72%; height: 28%; }
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
  .compact .glyph { top: 0; height: 100%; font-size: 22px; }
  .compact .glyph.qu { top: 0; height: 100%; font-size: 18px; }

  /* DESIGN.md Card ghost: 1 px dashed outline, no face fill, no glyph, no flourish. */
  .ghost .face { background: none; border: 1px dashed var(--wc-outline); }
  .ghost .face::after { content: none; }

  /* DESIGN.md Card, in destination block: destination fill, 2 px blue outline, lock top-left. */
  .destination .face,
  .block .face { background: var(--wc-destination-fill); border: 2px solid var(--wc-destination); }
  .lock { position: absolute; top: 0; left: 0; z-index: 1; }
  .lock rect { fill: var(--wc-destination); }
  .lock .shackle { fill: none; stroke: var(--wc-destination); stroke-width: 1.5; }
  .destination .badge,
  .block .badge { top: 0; right: 0; }
  /* A9 4.3-m4: a block face that is not a segment end is widened past its tile (overlap, no right
     border), so its badge sits 5 px in from the face edge: right edge at wrapper x + tileWidth on
     every block tile, as on the end tile (face to x + tileWidth + 2, 2 px border). */
  .block:not(.end) .badge { right: 5px; }
  /* DESIGN.md Destination block: the D tiles joined over the 4 px gap, one outline per row
     segment; inner edges drop their side border and radius. */
  .block .face { width: calc(var(--tile-w) + 4px); margin: 0; border-radius: 0; }
  .block.start .face {
    width: calc(var(--tile-w) + 2px); margin-left: 2px; border-top-left-radius: 6px;
    border-bottom-left-radius: 6px;
  }
  .block.end .face {
    width: calc(var(--tile-w) + 2px); margin-right: 2px; border-top-right-radius: 6px;
    border-bottom-right-radius: 6px;
  }
  .block.start.end .face { width: var(--tile-w); }
  .block:not(.start) .face { border-left: none; }
  .block:not(.end) .face { border-right: none; }
  /* Overlap the next block tile by 1 px so fractional device pixels leave no seam. */
  .block:not(.start):not(.end) .face { width: calc(var(--tile-w) + 5px); }
  .block.start:not(.end) .face { width: calc(var(--tile-w) + 3px); }

  /* DESIGN.md Elevation & Depth: a tap-selected card's face rises `--wc-select-lift` (Board, from
     SELECTION_LIFT_PX) with the soft shadow, above the sticky bars (z-index 2); the wrapper (hit
     rect) never moves (F26). */
  .lifted .face { transform: translateY(calc(-1 * var(--wc-select-lift))); box-shadow: 0 6px 16px #0008; z-index: 3; }

  /* DESIGN.md WordCell used this word (R-33): the top card at 40 % with a 45° hatch. */
  .used .face {
    opacity: 0.4;
    background-image: repeating-linear-gradient(
      45deg, var(--wc-outline) 0 1px, transparent 1px 6px
    );
  }
</style>
