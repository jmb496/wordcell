<script lang="ts">
import type { CardId, Face } from '../engine/index';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import { text } from './text';

// F26 card: the live element (AD-14) is a slot-wide wrapper, strip tall, or H tall when `full`
// (a column's last card, a WordCell card), so hits resolve to the wrapper; the face is centred
// inside it with `pointer-events: none`. Geometry comes from the Board's CSS variables.
let {
  id,
  face,
  place,
  full = false,
  hidden = false,
  used = false,
}: {
  id: CardId;
  face: Face;
  place: 'column' | 'cell';
  full?: boolean;
  hidden?: boolean;
  used?: boolean;
} = $props();

// DESIGN.md Card: `QU` is set as `Qu` with the ×2 badge (Q-06).
const qu = $derived(face.letter === 'QU');
const glyph = $derived(qu ? 'Qu' : face.letter);
</script>

<div
  class="card"
  class:full
  class:cell={place === 'cell'}
  class:hidden
  class:used
  data-card-id={id}
  data-testid="card-{id}"
  data-place={place}
>
  <div class="face">
    <span class="glyph" class:qu>{glyph}</span>
    {#if qu}<span class="badge">{text.quBadge}</span>{/if}
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
  /* DESIGN.md WordCell used this word (R-33): the top card at 40 % with a 45° hatch. */
  .used .face {
    opacity: 0.4;
    background-image: repeating-linear-gradient(
      45deg, var(--wc-outline) 0 1px, transparent 1px 6px
    );
  }
</style>
