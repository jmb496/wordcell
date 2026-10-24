<script lang="ts">
import { onMount } from 'svelte';
import type { Face } from '../../engine/index';
import { cardMetrics } from '../layout/geometry';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import { text } from '../text';

// AD-19 (R-87; DESIGN.md Win celebration): one container clipped to the band between the bars, one
// group element per word-list entry, each holding its row's card face copies (and nothing else) in
// the live theme's normal card at the board's card size. Every group renders hidden; the run
// controller registers the group elements on mount and writes opacity to them and a `transform` to
// each copy directly each frame (rule 3), so nothing here is reactive per frame: the row's layout
// (SPEC F20's 35 % overlap) and each card's place on the path (SPEC F21) are `step.ts`'s, every copy
// sits at the container's top left until then. The copies are neither live cards nor mirrors
// (AD-14): each copy carries `data-celebration` and `aria-hidden`, never `data-card-id`,
// `data-testid` or `data-mirror-of`; a group element carries `data-celebration-group`. The look
// follows Card.svelte's `.face`/`.glyph`/`.badge`.
let {
  groups,
  band,
  cardW,
  register,
}: {
  /** Per entry, the faces of its `cards` (`view.faces`), in order. */
  groups: readonly (readonly Face[])[];
  /** The band between the top bar and the action bar, in viewport px. */
  band: { left: number; top: number; width: number; height: number };
  cardW: number;
  register: (elements: readonly HTMLElement[]) => void;
} = $props();

const cardH = $derived(cardMetrics(cardW).H);
const elements: HTMLElement[] = [];

onMount(() => {
  register([...elements]);
  return () => register([]);
});
</script>

<div
  class="celebration"
  data-celebration-root
  aria-hidden="true"
  style:left="{band.left}px"
  style:top="{band.top}px"
  style:width="{band.width}px"
  style:height="{band.height}px"
  style:--wc-w="{cardW}px"
  style:--wc-H="{cardH}px"
>
  {#each groups as faces, g (g)}
    <div
      class="group"
      data-celebration-group
      bind:this={elements[g]}
      style:opacity="0"
    >
      {#each faces as face, i (i)}
        {@const qu = face.letter === 'QU'}
        <div class="face" data-celebration aria-hidden="true">
          <span class="glyph" class:qu>{qu ? 'Qu' : face.letter}</span>
          {#if qu}<span class="badge">{text.quBadge}</span>{/if}
        </div>
      {/each}
    </div>
  {/each}
</div>

<style>
  .celebration {
    /* DESIGN.md Layer order: above the drag layer (5), below the scrim and overlays (10+). */
    position: fixed; overflow: hidden; pointer-events: none; z-index: 6;
  }
  .group { position: absolute; left: 0; top: 0; will-change: opacity; }
  .face {
    position: absolute; left: 0; top: 0; transform-origin: 0 0; will-change: transform;
    box-sizing: border-box; width: var(--wc-w); height: var(--wc-H);
    background-color: var(--wc-card-face); background-image: var(--wc-card-texture);
    border: 1px solid var(--wc-card-edge); border-radius: 6px;
    color: var(--wc-card-ink); box-shadow: 0 6px 16px var(--wc-shadow-drag); isolation: isolate;
  }
  .face::after {
    content: ''; position: absolute; left: 20%; width: 60%; top: calc(86% - 3px); height: 3px;
    border-bottom: 1px solid var(--wc-card-edge); border-radius: 0 0 50% 50%;
  }
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
</style>
