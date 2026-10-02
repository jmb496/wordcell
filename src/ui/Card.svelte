<script lang="ts">
import type { CardId, Face } from '../engine/index';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import { text } from './text';

// F26 card: the element is a slot-wide wrapper, strip tall, or H tall when `full` (a column's last
// card, a WordCell card), so hits resolve to the wrapper; the face is centred inside it with
// `pointer-events: none`. Geometry comes from the Board's CSS variables; a tray or strip tile is
// one tile pitch (tileWidth + 4) wide and card (H) or compact (44 px) tall (DESIGN.md Tile).
// AD-14: a live card carries data-card-id, data-testid and data-place; a `mirror` (ghost, used
// WordCell face, D-block tray copy) carries only data-mirror-of.
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
}: {
  id: CardId;
  face: Face;
  /** Where the element sits; a live card also exposes it as data-place. */
  place: 'column' | 'cell' | 'tray' | 'strip';
  mirror?: 'ghost' | 'used' | 'block';
  full?: boolean;
  hidden?: boolean;
  /** A live D card in its column in Composing (DESIGN.md Card, in destination block). */
  destination?: boolean;
  tile?: { mode: 'card' | 'compact'; width: number };
  /** A `block` mirror's place in its row segment: outline ends and the lock at the start. */
  segment?: { start: boolean; end: boolean };
} = $props();

// DESIGN.md Card: `QU` is set as `Qu` with the ×2 badge (Q-06).
const qu = $derived(face.letter === 'QU');
const glyph = $derived(qu ? 'Qu' : face.letter);
const ghost = $derived(mirror === 'ghost');
const block = $derived(mirror === 'block');
const lock = $derived(destination || (block && segment?.start === true));
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
    {/if}
  </div>
</div>

<style>
  .card {
    width: var(--wc-slot); height: var(--wc-strip); flex: none;
    touch-action: none; user-select: none; -webkit-user-select: none;
  }
  .card.full { height: var(--wc-H); }
  .card.cell { position: absolute; top: 0; left: 0; }
  .card.hidden { visibility: hidden; }
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

  /* DESIGN.md WordCell used this word (R-33): the top card at 40 % with a 45° hatch. */
  .used .face {
    opacity: 0.4;
    background-image: repeating-linear-gradient(
      45deg, var(--wc-outline) 0 1px, transparent 1px 6px
    );
  }
</style>
