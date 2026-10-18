<script lang="ts">
import { untrack } from 'svelte';
import { prefs } from '../../shell/prefs.svelte';
import { act } from '../act';
import { sceneFit } from '../layout/geometry';
import { overlays } from '../overlays.svelte';
import { text } from '../text';
import { scenes } from './index';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import Scene from './Scene.svelte';

// Epic 8 ticket 6 (HP-1, HP-2, HP-6; EXPERIENCE.md How to play panel): one scene at a time with
// previous and next arrows, dots that jump to a scene, and Left and Right keys. Only the current
// scene is mounted, and only while the howToPlay open flag is true (Panel keeps its children
// mounted while it animates out). The index is component state and resets when the flag goes
// false. The scene is keyed on (index, reduced motion, Animation speed, fitted card width), so a
// change of any re-enters it at step 1. The fit reads the panel content width and box height (the
// `.inner` box and its `.content` scroller), never the live game layout store (AD-11). All text is
// text.ts (AD-3); the scenes read no GameView.
const labels = text.howTo.carousel;
const open = $derived(overlays.isOpen('howToPlay'));
let index = $state(0);
let width = $state(0);
let boxHeight = $state(0);
let root: HTMLElement | undefined = $state();
let host: HTMLElement | undefined = $state();

const fit = $derived(width > 0 ? sceneFit(width, boxHeight, scenes[index].stage) : undefined);
// A scene starts only after the first non-zero width measurement.
const mounted = $derived(open && fit !== undefined);
const key = $derived(
  fit === undefined
    ? ''
    : `${index}|${prefs.motion.reduced}|${prefs.motion.baseMs}|${fit.cardWidth}`,
);
const atStart = $derived(index === 0);
const atEnd = $derived(index === scenes.length - 1);

$effect(() => {
  if (!open) index = 0;
});

function measure(node: HTMLElement): () => void {
  const content = node.closest<HTMLElement>('.content');
  if (content === null) throw new Error('the scene carousel must sit in a Panel .content');
  const read = (): void => {
    width = node.clientWidth;
    boxHeight = content.clientHeight;
  };
  read();
  const observer = new ResizeObserver(read);
  observer.observe(node);
  observer.observe(content);
  return () => observer.disconnect();
}

// Focus inside a scene that unmounts or re-enters (scene change, refit, reduced-motion toggle)
// moves to the carousel root, never body; a focused arrow or dot keeps its focus.
let refocus = false;
$effect.pre(() => {
  void key;
  untrack(() => {
    refocus = host?.contains(document.activeElement) ?? false;
  });
});
$effect(() => {
  void key;
  untrack(() => {
    if (refocus) {
      if (root === undefined) throw new Error('the carousel root is not bound');
      root.focus();
    }
    refocus = false;
  });
});

function go(target: number): void {
  if (target < 0 || target > scenes.length - 1 || target === index) return;
  index = target;
}
const previous = (): void => go(index - 1);
const next = (): void => go(index + 1);

function onkeydown(event: KeyboardEvent): void {
  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  event.preventDefault();
  event.stopPropagation();
  act(event.key === 'ArrowLeft' ? previous : next)();
}
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
  class="carousel"
  role="group"
  aria-label={labels.label}
  tabindex="-1"
  bind:this={root}
  {onkeydown}
  {@attach measure}
>
  <div class="controls">
    <button
      type="button"
      class="arrow"
      class:dim={atStart}
      aria-label={labels.previous}
      aria-disabled={atStart ? 'true' : undefined}
      onclick={act(previous)}
    >
      <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="M15 5 L8 12 L15 19" /></svg>
    </button>
    <div class="dots">
      {#each scenes as scene, i (scene.id)}
        <button
          type="button"
          class="dot"
          aria-label={labels.dot(i + 1, scenes.length)}
          aria-current={i === index ? 'true' : undefined}
          onclick={act(() => go(i))}
        >
          <span class="pip" class:current={i === index} aria-hidden="true"></span>
        </button>
      {/each}
    </div>
    <button
      type="button"
      class="arrow"
      class:dim={atEnd}
      aria-label={labels.next}
      aria-disabled={atEnd ? 'true' : undefined}
      onclick={act(next)}
    >
      <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="M9 5 L16 12 L9 19" /></svg>
    </button>
  </div>
  <div class="host" bind:this={host} style:min-height="{fit?.stageHeight ?? 0}px">
    {#if mounted && fit !== undefined}
      {#key key}
        <Scene scene={scenes[index]} cardWidth={fit.cardWidth} stageHeight={fit.stageHeight} />
      {/key}
    {/if}
  </div>
</div>

<style>
  .carousel { outline: none; }
  .controls { display: flex; align-items: center; gap: 0; margin: 0 0 8px; }
  .arrow, .dot {
    flex: none; display: grid; place-items: center; min-width: 44px; min-height: 44px; padding: 0;
    border: none; background: none; cursor: pointer; color: var(--wc-ink-primary);
  }
  .arrow {
    border-radius: 9999px; border: 1px solid var(--wc-outline); background: var(--wc-surface-raised);
  }
  .arrow svg { fill: none; stroke: currentColor; stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; }
  .arrow.dim { opacity: 0.4; cursor: default; }
  .arrow:focus-visible, .dot:focus-visible { outline: 2px solid var(--wc-accent-teal); outline-offset: -2px; }
  .dots { flex: 1 1 0; min-width: 0; display: flex; flex-wrap: wrap; justify-content: center; }
  .pip {
    display: block; width: 10px; height: 10px; border-radius: 50%; box-sizing: border-box;
    border: 2px solid var(--wc-ink-secondary);
  }
  .pip.current { background: var(--wc-ink-primary); border-color: var(--wc-ink-primary); }
</style>
