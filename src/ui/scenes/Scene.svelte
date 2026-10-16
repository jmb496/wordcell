<script lang="ts">
import { untrack } from 'svelte';
import { prefs } from '../../shell/prefs.svelte';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import { act } from '../act';
// biome-ignore lint/correctness/noUnusedImports: used in markup, which Biome does not read.
import Card from '../Card.svelte';
import { duration } from '../motion';
import { text } from '../text';
import { frameTail, ghostStart } from './effects';
import {
  CARD_H,
  CARD_W,
  CELL6,
  COLUMN_AREA_H,
  CONTROL_BOX,
  CONTROLS_H,
  CONTROLS_TOP,
  columnX,
  HAND_H,
  HAND_W,
  RICH_INSET,
  RICH_SLOT,
  RICH_TILE_W,
  RICH_TRAY_H,
  SLOT,
  STAGE_W,
  STRIP,
  TRAY_H,
  TRAY_TOP,
} from './geometry';
import { type RunState, ScenePlayer } from './player';
import type { Frame, Scene } from './types';

// Epic 8 ticket 1 (HP-1, HP-2, HP-6; EXPERIENCE.md How to play panel): one scene as a <figure>
// with a visible description and an aria-hidden stage drawn with static cards (AD-14: no card id,
// test id or mirror-of). The player moves scene-local wrappers with WAAPI; under reduced motion
// nothing animates and Next steps through the frames. Controls are real act()-wrapped buttons
// outside the aria-hidden node. All text is text.ts (AD-3); the visible state is local to this
// component, never game state.
let { scene }: { scene: Scene } = $props();

const id = $props.id();
// The stage geometry for the markup (Biome reads script usage only).
// A scene whose frames list tray tiles draws the open tray as one layer per frame (tiles, k and
// side, the controls row, WordCell 6's state): a step's reveal fades the next layer in.
const rich = $derived(scene.frames.some((f) => f.order !== undefined));
const trayHeight = $derived(rich ? RICH_TRAY_H : TRAY_H);
const cell6Letter = $derived(
  scene.frames[0].cell6 === undefined ? undefined : scene.fixture.start.cells?.['6']?.at(-1),
);
const geo = $derived({
  stageW: STAGE_W,
  stageH: TRAY_TOP + trayHeight,
  rich,
  richSlot: RICH_SLOT,
  richTileW: RICH_TILE_W,
  inset: RICH_INSET,
  controlsTop: CONTROLS_TOP,
  controlsH: CONTROLS_H,
  box: CONTROL_BOX,
  cell: CELL6,
  cardW: CARD_W,
  slot: SLOT,
  cardH: CARD_H,
  strip: STRIP,
  columnH: COLUMN_AREA_H,
  trayTop: TRAY_TOP,
  trayH: trayHeight,
  handW: HAND_W,
  handH: HAND_H,
  columnX,
});
const ghostFrom = $derived(ghostStart(scene));
const controls = text.howTo.sceneControls;
const reduced = $derived(prefs.motion.reduced);
let running = $state<RunState>('playing');
let frame = $state(0);
let figure: HTMLElement | undefined = $state();
let player: ScenePlayer | undefined;

const face = (letter: string) => ({ letter, letterCount: letter === 'QU' ? 2 : 1 });
// The cards drawn, from the fixture start and the script's carry (the source column without the
// tail, the tail, the D cards that join, and the tail's top in its column).
const drawn = $derived.by(() => {
  const { carry: c, fixture } = scene;
  const all = fixture.start.columns;
  const source = all[c.sourceColumn - 1];
  return {
    columns: all.map((cards, i) => {
      if (i + 1 === c.sourceColumn) return cards.slice(0, cards.length - c.count);
      if (i + 1 === c.destinationColumn) return cards.slice(0, cards.length - c.destinationCount);
      return cards;
    }),
    tail: source.slice(-c.count),
    destination: all[c.destinationColumn - 1].slice(-c.destinationCount),
    tailTop: (source.length - c.count) * STRIP,
    sourceColumn: c.sourceColumn,
    destColumn: c.destinationColumn,
    destTop: (all[c.destinationColumn - 1].length - c.destinationCount) * STRIP,
  };
});
const last = $derived(scene.frames.length - 1);
const current = $derived(scene.frames[frame]);
const currentIndex = $derived(frame);
// Whether tile `j` of a frame's `order` is in the destination block (R-31, R-32).
const inBlock = (frame: Frame, j: number): boolean =>
  frame.side === 'left' ? j < (frame.k ?? 0) : j >= (frame.order?.length ?? 0) - (frame.k ?? 0);
const tailStyle = $derived(reduced ? frameTail(scene, current) : undefined);

function element(node: HTMLElement, key: string): HTMLElement {
  const found = node.querySelector<HTMLElement>(`[data-scene-el="${key}"]`);
  if (found === null) throw new Error(`scene ${scene.id}: no element ${key}`);
  return found;
}

$effect(() => {
  const node = figure;
  if (reduced || node === undefined) return;
  const next = new ScenePlayer(
    scene,
    {
      animate: (key, keyframes, ms, animationId) => {
        const animation = element(node, key).animate(keyframes, {
          duration: ms,
          fill: 'forwards',
          easing: 'ease-in-out',
        });
        animation.id = animationId;
        return animation;
      },
      duration,
      hidden: () => document.hidden,
      // AD-9: the game store owns the visibility listeners; loaded lazily (it needs a window).
      whenVisible: async () => (await import('../../shell/game.svelte')).game.whenVisible(),
    },
    (state) => {
      running = state;
    },
  );
  player = next;
  untrack(() => next.start());
  return () => {
    next.destroy();
    player = undefined;
  };
});

$effect(() => {
  if (reduced) frame = 0;
});

function tap(): void {
  player?.toggle();
}
const showNext = (): void => {
  frame = Math.min(frame + 1, last);
};
const replay = (): void => {
  frame = 0;
};
</script>

<figure class="scene" aria-labelledby="{id}-caption" bind:this={figure}>
  <div class="area">
    <div
      class="stage"
      aria-hidden="true"
      data-scene-el="stage"
      style:width="{geo.stageW}px"
      style:height="{geo.stageH}px"
      style:--wc-w="{geo.cardW}px"
      style:--wc-slot="{geo.slot}px"
      style:--wc-H="{geo.cardH}px"
      style:--wc-strip="{geo.strip}px"
    >
      {#each drawn.columns as cards, i (i)}
        <div class="column" style:left="{geo.columnX(i + 1)}px" style:height="{geo.columnH}px">
          {#each cards as letter, j (j)}
            <Card id={0} face={face(letter)} place="column" mirror="static" full={j === cards.length - 1} />
          {/each}
        </div>
      {/each}
      <div
        class="tail"
        data-scene-el="dest"
        style:left="{geo.columnX(drawn.destColumn)}px"
        style:top="{drawn.destTop}px"
      >
        {#each drawn.destination as letter, j (j)}
          <Card id={0} face={face(letter)} place="column" mirror="static" full={j === drawn.destination.length - 1} />
        {/each}
      </div>
      <div
        class="tail"
        data-scene-el="tail"
        style:left="{geo.columnX(drawn.sourceColumn)}px"
        style:top="{drawn.tailTop}px"
        style:transform={tailStyle}
        style:visibility={reduced && tailStyle === undefined ? 'hidden' : undefined}
      >
        {#each drawn.tail as letter, j (j)}
          <div data-scene-el="tail-{j}">
            <Card id={0} face={face(letter)} place="column" mirror="static" full={j === drawn.tail.length - 1} />
          </div>
        {/each}
      </div>
      {#if cell6Letter !== undefined}
        <div class="cell6" style:left="{geo.cell.x}px" style:top="{geo.cell.y}px">
          <Card id={0} face={face(cell6Letter)} place="cell" mirror="static" full />
          <span class="num">6</span>
        </div>
      {/if}
      {#each scene.frames as frame, i (i)}
        {#if geo.rich && frame.tray && frame.order !== undefined}
          <div
            class="layer"
            data-scene-el="tray-{i}"
            style:top="{geo.trayTop}px"
            style:height="{geo.trayH}px"
            style:opacity={reduced ? (i === currentIndex ? 1 : 0) : undefined}
            style:--wc-w="{geo.richTileW}px"
            style:--wc-slot="{geo.richSlot}px"
          >
            {#if frame.cell6 === 'used' && cell6Letter !== undefined}
              <div class="cell6 used" style:left="{geo.cell.x}px" style:top="{geo.cell.y - geo.trayTop}px">
                <Card id={0} face={face(cell6Letter)} place="cell" mirror="static" full />
                <span class="num">6</span>
              </div>
            {/if}
            <div class="tiles" style:left="{geo.inset}px">
              {#each frame.order as letter, j (j)}
                <Card id={0} face={face(letter)} place="tray" mirror="static" full destination={inBlock(frame, j)} />
              {/each}
            </div>
            <span class="ctl round" style:left="{geo.box.minus.x}px" style:width="{geo.box.minus.w}px" style:top="{geo.controlsTop}px" style:height="{geo.controlsH}px">{text.minus}</span>
            <span class="ctl round" style:left="{geo.box.plus.x}px" style:width="{geo.box.plus.w}px" style:top="{geo.controlsTop}px" style:height="{geo.controlsH}px">{text.plus}</span>
            <span class="ctl" style:left="{geo.box.flip.x}px" style:width="{geo.box.flip.w}px" style:top="{geo.controlsTop}px" style:height="{geo.controlsH}px">{text.flipGlyph} {text.flip}</span>
            <span
              class="ctl validate {frame.validate ?? 'off'}"
              style:left="{geo.box.validate.x}px"
              style:width="{geo.box.validate.w}px"
              style:top="{geo.controlsTop}px"
              style:height="{geo.controlsH}px"
            >{text.validate}</span>
          </div>
        {/if}
      {/each}
      {#if !geo.rich}
      <div
        class="tray"
        data-scene-el="tray"
        style:top="{geo.trayTop}px"
        style:height="{geo.trayH}px"
        style:opacity={reduced ? (current.tray ? 1 : 0) : undefined}
      >
        {#each drawn.destination as letter, j (j)}
          <Card id={0} face={face(letter)} place="tray" mirror="static" full destination />
        {/each}
        {#each drawn.tail as letter, j (j)}
          <Card id={0} face={face(letter)} place="tray" mirror="static" full />
        {/each}
      </div>
      {/if}
      <svg
        class="ghost"
        data-scene-el="ghost"
        viewBox="0 0 28 32"
        width={geo.handW}
        height={geo.handH}
        style:transform={ghostFrom}
        aria-hidden="true"
      >
        <path
          d="M9 1.5c1.4 0 2.5 1.1 2.5 2.5v9l1.2-.4c1.2-.4 2.5.3 2.8 1.5l.3-.1c1.2-.4 2.5.3 2.8 1.5l.2-.1c1.3-.4 2.8.4 3 1.8l.7 6.2c.3 2.8-.9 5.6-3.2 7.2H12.5c-1.5 0-2.9-.7-3.8-1.9L3.4 20.3c-.8-1.1-.5-2.6.6-3.3 1-.6 2.2-.4 3 .4l.5.6V4c0-1.4 1.1-2.5 2.5-2.5z"
          fill="#fff"
          stroke="#1a1a1a"
          stroke-width="1.6"
          stroke-linejoin="round"
        />
      </svg>
    </div>
    {#if !reduced}
      <button type="button" class="tap" aria-label={running === 'playing' ? controls.pause : controls.restart} onclick={act(tap)}>
        <span class="icon" class:paused={running === 'paused'} aria-hidden="true"></span>
      </button>
    {/if}
  </div>
  {#if reduced}
    <div class="controls">
      {#if frame < last}
        <button type="button" onclick={act(showNext)}>{controls.next}</button>
      {:else}
        <button type="button" onclick={act(replay)}>{controls.replay}</button>
      {/if}
    </div>
  {/if}
  <figcaption id="{id}-caption">{scene.caption}</figcaption>
</figure>

<style>
  .scene { margin: 0 0 16px; }
  .area { position: relative; width: fit-content; max-width: 100%; margin: 0 auto 8px; }
  .stage {
    position: relative; overflow: hidden; border-radius: 8px;
    background: var(--wc-surface-raised); max-width: 100%;
  }
  .column { position: absolute; top: 0; width: var(--wc-slot); display: flex; flex-direction: column; }
  .tail { position: absolute; width: var(--wc-slot); display: flex; flex-direction: column; }
  .tray {
    position: absolute; left: 0; right: 0; box-sizing: border-box; padding: 2px 16px;
    display: flex; align-items: center; opacity: 0; border-top: 1px solid var(--wc-outline);
  }
  .layer {
    position: absolute; left: 0; right: 0; box-sizing: border-box; opacity: 0;
    background: var(--wc-surface-raised); border-top: 1px solid var(--wc-outline);
  }
  .tiles { position: absolute; top: 3px; display: flex; }
  .cell6 { position: absolute; width: var(--wc-slot); }
  .cell6 .num {
    display: block; text-align: center; font: 500 12px/16px system-ui, "Roboto", sans-serif;
    color: var(--wc-ink-secondary);
  }
  .cell6.used { background: var(--wc-surface-raised); }
  .cell6.used :global(.card) { opacity: 0.4; }
  .ctl {
    position: absolute; box-sizing: border-box; display: grid; place-items: center;
    border-radius: 9999px; background: var(--wc-surface-raised); border: 1px solid var(--wc-outline);
    color: var(--wc-ink-primary); white-space: nowrap;
    font: 600 14px/20px system-ui, "Roboto", sans-serif;
  }
  .ctl.validate { border: none; }
  .validate.lit { background: var(--wc-accent-orange); color: var(--wc-ink-on-accent); }
  .validate.pressed {
    background: var(--wc-accent-orange); color: var(--wc-ink-on-accent);
    filter: brightness(0.8); transform: scale(0.94);
  }
  .validate.off { color: var(--wc-ink-disabled); }
  .ghost {
    position: absolute; top: 0; left: 0; opacity: 0; pointer-events: none;
    filter: drop-shadow(0 1px 2px rgb(0 0 0 / 0.45));
  }
  .tap {
    position: absolute; inset: 0; padding: 0; border: 0; border-radius: 8px;
    background: transparent; cursor: pointer;
  }
  .tap:focus-visible { outline: 2px solid var(--wc-accent-teal); outline-offset: -2px; }
  .icon {
    position: absolute; right: 8px; top: 8px; width: 24px; height: 24px; border-radius: 50%;
    background: var(--wc-table); opacity: 0.85;
  }
  .icon::before, .icon::after {
    content: ''; position: absolute; top: 6px; width: 3px; height: 12px; background: var(--wc-ink-primary);
  }
  .icon::before { left: 7px; }
  .icon::after { right: 7px; }
  .icon.paused::before {
    left: 8px; top: 6px; width: 0; height: 0; background: none;
    border-left: 10px solid var(--wc-ink-primary); border-top: 6px solid transparent;
    border-bottom: 6px solid transparent;
  }
  .icon.paused::after { content: none; }
  .controls { display: flex; justify-content: center; margin: 0 0 8px; }
  .controls button {
    min-height: 44px; padding: 0 16px; border-radius: 8px; cursor: pointer;
    border: 1px solid var(--wc-outline); background: var(--wc-surface-raised);
    color: var(--wc-ink-primary); font: 600 1rem/1.5rem system-ui, "Roboto", sans-serif;
  }
  figcaption {
    font: 400 1rem/1.5rem system-ui, "Roboto", sans-serif; color: var(--wc-ink-secondary);
  }
</style>
