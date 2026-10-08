<script lang="ts">
import { onMount } from 'svelte';
import type { CardId, Face } from '../../engine/index';
import { fitSize } from '../layout/fit';
import { text } from '../text';

// Epic 5 entry 1 word line (DESIGN.md Typography word line, Tray band, Invalid-word message):
// in Composing the R-30 word from `draft.wordCards` through `faces` (AD-3: never tray order),
// uppercase, letter-spaced serif, D letters underlined in destination blue, a `QU` card one unit;
// while `rejectedWord` is set the R-38 invalid line replaces it. Fit: the line's font size is the
// largest of max…14 px (word 20, invalid 16) whose nowrap width fits the line, measured on the
// text element itself under a temporary class (never a DOM clone), re-measured on mount, text
// change, line width change and `document.fonts.ready`. At 14 px the word line clips and the
// invalid line ellipsizes only its word part.
let {
  faces,
  wordCards,
  destination,
  rejectedWord,
}: {
  faces: readonly Face[];
  wordCards: readonly CardId[];
  destination: readonly CardId[];
  rejectedWord: string | undefined;
} = $props();

const WORD_MAX = 20;
const INVALID_MAX = 16;
/** The ✕ glyph (16 px) plus the gap before the text (6 px). */
const GLYPH_AND_GAP = 22;
const MEASURING = 'wc-measuring';

let line: HTMLDivElement | null | undefined;
let textEl: HTMLElement | null | undefined = $state();
const invalid = $derived(rejectedWord !== undefined);
const parts = $derived(
  rejectedWord === undefined ? undefined : text.invalidWordParts(rejectedWord),
);
const max = $derived(invalid ? INVALID_MAX : WORD_MAX);
/** The rendered word's cards as a string: `view()` rebuilds `wordCards` on every dispatch. */
const wordKey = $derived(wordCards.join(','));
let size = $state(WORD_MAX);

/** The text element's nowrap, unclipped width at `px`; restores its class and size after. */
function measure(el: HTMLElement, px: number): number {
  const previous = el.style.fontSize;
  el.classList.add(MEASURING);
  el.style.fontSize = `${px}px`;
  try {
    return el.getBoundingClientRect().width;
  } finally {
    el.classList.remove(MEASURING);
    el.style.fontSize = previous;
  }
}

function refit(): void {
  const el = textEl;
  if (line == null || el == null) return;
  const box = line.clientWidth - (invalid ? GLYPH_AND_GAP : 0);
  size = fitSize((px) => measure(el, px), box, max);
}

// Text change: the word, the rejected word (and with it the max) or the text element.
$effect(() => {
  void [wordKey, rejectedWord, max, textEl];
  refit();
});

onMount(() => {
  let mounted = true;
  const observer = new ResizeObserver(() => refit());
  if (line != null) observer.observe(line);
  void document.fonts.ready.then(() => {
    if (mounted) refit();
  });
  return () => {
    mounted = false;
    observer.disconnect();
  };
});
</script>

<div class="line" bind:this={line}>
  {#if parts !== undefined}
    <p class="invalid"><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M6 6 L18 18 M18 6 L6 18" /></svg><span class="text" bind:this={textEl} style:font-size="{size}px"><span class="word">{parts[0]}</span><span class="space">{' '}</span><span class="suffix">{parts[1]}</span></span></p>
  {:else}
    <p class="text word-text" bind:this={textEl} style:font-size="{size}px">{#each wordCards as id (id)}<span class="letter" class:d={destination.includes(id)} data-word-card={id}>{(faces[id] as Face).letter}</span>{/each}</p>
  {/if}
</div>

<style>
  .line { height: 24px; width: 100%; min-width: 0; overflow: hidden; }
  p { margin: 0; }
  /* DESIGN.md word line: serif 600, 20 → 14 px, line 24 px, 0.08 em letter spacing. */
  .word-text {
    font-family: "WordCell Serif", serif; font-weight: 600; line-height: 24px;
    letter-spacing: 0.08em; color: var(--wc-card-ink);
    white-space: nowrap; overflow: hidden; text-overflow: clip;
  }
  .d {
    text-decoration: underline; text-decoration-color: var(--wc-destination);
    text-decoration-thickness: 2px; text-underline-offset: 2px;
  }
  /* DESIGN.md Invalid-word message: ui-body in error red after a ✕ glyph, 16 → 14 px. */
  .invalid {
    display: flex; align-items: center; gap: 6px; height: 24px;
    font-family: system-ui, "Roboto", sans-serif; font-weight: 400; line-height: 24px;
    color: var(--wc-error);
  }
  .invalid svg { flex: none; fill: none; stroke: var(--wc-error); stroke-width: 2.5; stroke-linecap: round; }
  .invalid .text { display: flex; min-width: 0; white-space: nowrap; }
  .invalid .word { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
  .invalid .space { flex: none; white-space: pre; }
  .invalid .suffix { flex: none; }
  /* Fit measurement (temporary): the text's natural nowrap width, nothing clipped. */
  .text:global(.wc-measuring) { flex: none; width: max-content; overflow: visible; }
  .text:global(.wc-measuring) .word { overflow: visible; text-overflow: clip; min-width: auto; }
</style>
