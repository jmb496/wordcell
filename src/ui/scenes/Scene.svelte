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
  CONFIRM_BOX,
  CONTROL_BOX,
  CONTROLS_H,
  CONTROLS_TOP,
  columnX,
  HAND_H,
  HAND_W,
  PLACE_CELL_TOP,
  PLACE_H,
  placeCellX,
  RICH_INSET,
  RICH_SLOT,
  RICH_TILE_W,
  RICH_TRAY_H,
  SCORE_H,
  SCORE_STACK_TOP,
  SCORE_TOTAL_BOX,
  SLOT,
  STAGE_W,
  STRIP,
  STRIP_TOP,
  scoreStackX,
  stripTileX,
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
// Epic 8 ticket 3: the place scene draws one layer per frame (WordCells 3 to 6, the placement
// strip, Confirm); the scoring scene draws WordCell stacks with per-cell figures and a total.
const placeMode = $derived(scene.frames.some((f) => f.lit !== undefined));
const scoreMode = $derived(scene.frames.some((f) => f.numbers !== undefined));
const trayHeight = $derived(
  placeMode ? PLACE_H : scoreMode ? SCORE_H : rich ? RICH_TRAY_H : TRAY_H,
);
const cell6Letter = $derived(
  scene.frames[0].cell6 === undefined ? undefined : scene.fixture.start.cells?.['6']?.at(-1),
);
const geo = $derived({
  stageW: STAGE_W,
  stageH: TRAY_TOP + trayHeight,
  rich,
  confirm: CONFIRM_BOX,
  placeCellTop: PLACE_CELL_TOP,
  stripTop: STRIP_TOP,
  stackTop: SCORE_STACK_TOP,
  totalBox: SCORE_TOTAL_BOX,
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
  placeCellX,
  scoreStackX,
  stripTileX,
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
  if (c === undefined)
    return {
      carried: false,
      columns: [],
      tail: [],
      destination: [],
      tailTop: 0,
      sourceColumn: 0,
      destColumn: 0,
      destTop: 0,
    };
  const all = fixture.start.columns;
  const source = all[c.sourceColumn - 1];
  // `landed`: the move is done, so the destination column is drawn whole and no tail or D block.
  const landed = c.landed === true;
  return {
    carried: !landed,
    columns: all.map((cards, i) => {
      if (i + 1 === c.sourceColumn) return cards.slice(0, cards.length - c.count);
      if (i + 1 === c.destinationColumn && !landed)
        return cards.slice(0, cards.length - c.destinationCount);
      return cards;
    }),
    tail: landed ? [] : source.slice(-c.count),
    destination: landed ? [] : all[c.destinationColumn - 1].slice(-c.destinationCount),
    tailTop: (source.length - c.count) * STRIP,
    sourceColumn: c.sourceColumn,
    destColumn: c.destinationColumn,
    destTop: (all[c.destinationColumn - 1].length - c.destinationCount) * STRIP,
  };
});
// A WordCell's cards (bottom to top) in frame `i`: the fixture start, or, in the last frame, the
// fixture `cells` entry that states them after the scene's commands (R-52).
const cellCards = (cell: number, i: number): readonly string[] =>
  (i === scene.frames.length - 1
    ? scene.fixture.cells?.findLast((entry) => entry.cell === cell)?.cards
    : undefined) ??
  scene.fixture.start.cells?.[String(cell)] ??
  [];
const PLACE_CELLS = [3, 4, 5, 6] as const;
const stackHeight = (n: number): number => (n - 1) * STRIP + CARD_H;
// The scoring scene's WordCells (fixture cells with a stated score), left to right.
const scoreCells = $derived(
  (scene.fixture.cellScores ?? []).map((entry) => {
    const cards = cellCards(entry.cell, 0);
    return {
      ...entry,
      cards,
      letters: cards.reduce((n, letter) => n + face(letter).letterCount, 0),
    };
  }),
);
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
      {#if drawn.carried}
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
      {/if}
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
      {#if placeMode}
        {#each scene.frames as frame, i (i)}
          <div
            class="layer"
            data-scene-el="place-{i}"
            style:top="{geo.trayTop}px"
            style:height="{geo.trayH}px"
            style:opacity={reduced ? (i === currentIndex ? 1 : 0) : i === 0 ? 1 : undefined}
            style:--wc-w="{geo.richTileW}px"
            style:--wc-slot="{geo.richSlot}px"
          >
            {#each PLACE_CELLS as cell (cell)}
              {@const cards = cellCards(cell, i)}
              {@const lit = frame.lit?.includes(cell) ?? false}
              {@const target = frame.placeTarget === cell}
              <div class="wcell" style:left="{geo.placeCellX(cell)}px" style:top="{geo.placeCellTop}px">
                <div class="stack" class:empty={cards.length === 0} class:lit={lit && !target} class:target>
                  {#each cards as letter, j (j)}
                    <Card id={0} face={face(letter)} place="column" mirror="static" full={j === cards.length - 1} />
                  {/each}
                  {#if target}
                    <span class="check" aria-hidden="true">
                      <svg viewBox="0 0 14 14" width="14" height="14"><path d="M3.5 7.2 L6 9.6 L10.5 4.6" /></svg>
                    </span>
                  {/if}
                </div>
                <span class="num">{cell}</span>
              </div>
            {/each}
            {#if frame.placeOrder !== undefined}
              <div class="tiles" data-scene-el="strip-{i}" style:left="{geo.inset}px" style:top="{geo.stripTop}px">
                {#each frame.placeOrder as letter, j (j)}
                  <Card id={0} face={face(letter)} place="tray" mirror="static" full />
                {/each}
              </div>
              <span
                class="ctl validate lit"
                style:left="{geo.confirm.x}px"
                style:width="{geo.confirm.w}px"
                style:top="{geo.confirm.y}px"
                style:height="{geo.confirm.h}px"
              >{text.confirm}</span>
            {:else if frame.lit === undefined}
              <span
                class="ctl validate {frame.validate ?? 'off'}"
                style:left="{geo.confirm.x}px"
                style:width="{geo.confirm.w}px"
                style:top="{geo.confirm.y}px"
                style:height="{geo.confirm.h}px"
              >{text.validate}</span>
            {/if}
          </div>
        {/each}
      {/if}
      {#if scoreMode}
        {#each scoreCells as entry, k (entry.cell)}
          <span class="wnum" style:left="{geo.scoreStackX(k)}px" style:top="4px">{entry.cell}</span>
          <div class="stack score" style:left="{geo.scoreStackX(k)}px" style:top="{geo.stackTop}px">
            {#each entry.cards as letter, j (j)}
              <Card id={0} face={face(letter)} place="column" mirror="static" full={j === entry.cards.length - 1} />
            {/each}
          </div>
          <span
            class="figure"
            data-scene-el="score-{k + 1}"
            style:left="{geo.scoreStackX(k) - 12}px"
            style:top="{geo.stackTop + stackHeight(entry.cards.length) + 4}px"
            style:opacity={reduced ? ((current.numbers ?? 0) > k ? 1 : 0) : undefined}
          >{text.howTo.scoreFigure(entry.letters, entry.cell, entry.score)}</span>
        {/each}
        <span
          class="ctl total"
          data-scene-el="total"
          style:left="{geo.totalBox.x}px"
          style:width="{geo.totalBox.w}px"
          style:top="{geo.totalBox.y}px"
          style:height="{geo.totalBox.h}px"
          style:opacity={reduced ? (current.total === undefined ? 0 : 1) : undefined}
        >{text.score(scene.frames[last].total ?? 0)}</span>
      {/if}
      {#if !geo.rich && !placeMode && !scoreMode && drawn.carried}
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
  .wcell { position: absolute; width: var(--wc-slot); }
  .stack { position: relative; width: var(--wc-slot); display: flex; flex-direction: column; }
  .stack.score { position: absolute; }
  .stack.empty { height: var(--wc-H); }
  .stack.empty::before, .stack.lit::after, .stack.target::after {
    content: ''; position: absolute; top: 0; left: 2px; box-sizing: border-box;
    width: var(--wc-w); height: var(--wc-H); border-radius: 6px; pointer-events: none;
  }
  .stack.empty::before { border: 2px solid var(--wc-outline); }
  .stack.lit::after { border: 2px solid var(--wc-accent-teal); }
  .stack.target::after { border: 3px solid var(--wc-accent-teal); }
  .stack.empty.lit::before, .stack.empty.target::before { border: none; }
  .check {
    position: absolute; top: 2px; left: 4px; width: 14px; height: 14px; border-radius: 50%;
    background: var(--wc-accent-teal); pointer-events: none;
  }
  .check svg {
    display: block; fill: none; stroke: var(--wc-ink-on-accent); stroke-width: 2;
    stroke-linecap: round; stroke-linejoin: round;
  }
  .wnum, .wcell .num {
    position: absolute; width: var(--wc-slot); text-align: center;
    font: 600 13px/16px system-ui, "Roboto", sans-serif; color: var(--wc-ink-secondary);
  }
  .wcell .num { position: static; display: block; width: auto; }
  .figure {
    position: absolute; width: calc(var(--wc-slot) + 24px); text-align: center; opacity: 0;
    font: 700 14px/20px system-ui, "Roboto", sans-serif; color: var(--wc-ink-primary);
  }
  .total { opacity: 0; font-weight: 700; }
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
