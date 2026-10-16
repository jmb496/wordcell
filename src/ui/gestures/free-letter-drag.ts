// AD-12 free-letter drag (epic 5 SPEC CAP-6, F5, F16, F18; AD-10, AD-12, AD-14), split from
// controller.ts (epic 5 retrospective A1): the threshold-crossing start of an available Composing
// WordCell press, each move's transform, tray acceptance, gap pick, parting and caret, and the tray
// faces' return. The press machine, `end()` and `clearDrag` stay in controller.ts; the full
// description is in its header (Free letter).
import type { GameView } from '../../engine/index';
import { prefs } from '../../shell/prefs.svelte';
import {
  gapRects,
  type Parted,
  partingOffsets,
  segmentEnds,
  slotRects,
  trayLayout,
} from '../layout/tray';
import { duration } from '../motion';
import {
  CARET,
  CARET_SHOWN,
  DRAG_GHOST,
  DRAG_LAYER,
  DRAG_TILES,
  PART_END,
  PART_START,
  PARTED,
} from './classes';
import type { FreeLetterDrag, Press } from './drag-types';
import { REST } from './drag-types';
import { trayTarget } from './drop-target';
import { translate } from './fly-back';
import { faceIn, found } from './lookup';
import { overTray } from './over-tray';
import type { createParting } from './parting';
import { inStartFrame, insertionIndex, type Rect } from './targeting';
import { freeLetterRun } from './tile';
import type { createVisibleBand } from './visible-band';

export type FreeLetterDragDeps = {
  /** The card width and the tray's inner width, read once at a drag's start. */
  w(): number;
  trayInnerWidth(): number;
  parting: ReturnType<typeof createParting>;
  band: ReturnType<typeof createVisibleBand>;
  /** The controller's hover clearing at a threshold crossing. */
  clearHover(): void;
};

export function createFreeLetterDrag(deps: FreeLetterDragDeps) {
  const { parting, band, clearHover } = deps;

  // Epic 5 SPEC CAP-6: the threshold-crossing move of an available Composing WordCell press.
  function start<H>(p: Press<H>, view: GameView, cell: number): FreeLetterDrag {
    const run = freeLetterRun(view, cell);
    const captured = found(p.captured, 'AD-12 WordCell press without a capture');
    const cellEl = found(
      captured.closest('[data-wordcell]'),
      'AD-12 WordCell press outside [data-wordcell]',
    );
    const wrapper = found(
      cellEl.querySelector(`[data-card-id="${run.card}"]`) as HTMLElement | null,
      `AD-12 card ${run.card} not rendered in WordCell ${cell}`,
    );
    const face = faceIn(wrapper);
    const tiles = found(
      trayTarget().querySelector('.tiles') as HTMLElement | null,
      'AD-12 tray band without .tiles',
    );
    const caret = found(
      tiles.querySelector(`.${CARET}`) as HTMLElement | null,
      'AD-12 .tiles without the caret',
    );
    // `slotRects`' origin: tray position 0's wrapper top-left + 2 px x, measured once.
    const head = found(tiles.children[0], 'AD-12 .tiles without a tile').getBoundingClientRect();
    const sizing = trayLayout(run.tileCount, deps.w(), deps.trayInnerWidth());
    const full = run.tileCount + 1 > sizing.perRow * sizing.rows;
    const slots = slotRects(
      sizing,
      { x: head.left + 2, y: head.top },
      full ? run.tileCount : run.tileCount + 1,
    );
    const gaps = gapRects(slots, sizing.perRow, run.tileCount, run.first, run.count);
    const trayWrappers = run.tray.map(({ id, mirror }) =>
      found(
        tiles.querySelector(
          mirror ? `[data-mirror-of="${id}"]` : `[data-card-id="${id}"]`,
        ) as HTMLElement | null,
        `AD-12 tray ${mirror ? 'mirror' : 'tile'} ${id} not in .tiles`,
      ),
    );
    clearHover();
    cellEl.classList.add(DRAG_GHOST);
    tiles.classList.add(DRAG_TILES);
    face.classList.add(DRAG_LAYER);
    return {
      kind: 'freeLetter',
      cellEl,
      wrappers: [wrapper],
      faces: [face],
      x: p.state.x,
      y: p.state.y,
      lift: 0,
      dx: 0,
      dy: 0,
      scroll: null,
      tiles,
      caret,
      tilesRect: tiles.getBoundingClientRect(),
      run,
      trayWrappers,
      trayFaces: trayWrappers.map(faceIn),
      mirror: run.tray.map((t) => t.mirror),
      slots,
      gaps,
      full,
      perRow: sizing.perRow,
      accepted: false,
      gap: null,
      rect: null,
    };
  }

  // Epic 5 SPEC CAP-6, F16: the caret on the winning gap rect, 3 px centred in its 4 px.
  function showCaret(drag: FreeLetterDrag, rect: Rect): void {
    drag.caret.style.transform = translate(
      rect.left - drag.tilesRect.left + 0.5,
      rect.top - drag.tilesRect.top,
    );
    drag.caret.classList.add(CARET_SHOWN);
  }

  function hideCaret(drag: FreeLetterDrag): void {
    drag.caret.classList.remove(CARET_SHOWN);
    drag.caret.style.transform = '';
  }

  // Epic 5 SPEC CAP-6: each mirror's segment ends from the parted slots (`segmentEnds` over the
  // parted `mirrorBySlot`), under the parted marker.
  function markParted(drag: FreeLetterDrag, offsets: readonly Parted[]): void {
    const bySlot = drag.slots.map(() => false);
    for (const [p, o] of offsets.entries()) bySlot[o.slot] = drag.mirror[p] === true;
    for (const [p, wrapper] of drag.trayWrappers.entries()) {
      if (drag.mirror[p] !== true) continue;
      const { start, end } = segmentEnds((offsets[p] as Parted).slot, drag.perRow, bySlot);
      wrapper.classList.add(PARTED);
      if (start) wrapper.classList.add(PART_START);
      else wrapper.classList.remove(PART_START);
      if (end) wrapper.classList.add(PART_END);
      else wrapper.classList.remove(PART_END);
    }
  }

  function unpart(drag: FreeLetterDrag): void {
    for (const [p, wrapper] of drag.trayWrappers.entries()) {
      if (drag.mirror[p] === true) wrapper.classList.remove(PARTED, PART_START, PART_END);
    }
  }

  // Epic 5 SPEC CAP-6: with room, a gap that moves a tile parts every tray position from it on
  // (mirrors included); a full layout or a gap moving no tile shows the caret, every face at rest.
  function partTray(drag: FreeLetterDrag): void {
    const { run, gap } = drag;
    const moves = gap !== null && !drag.full && run.first + gap < run.tileCount;
    const offsets = moves
      ? partingOffsets(drag.slots, run.tileCount, run.first, run.count, gap)
      : null;
    const ms = duration('parting');
    for (const [p, face] of drag.trayFaces.entries()) {
      const o = offsets === null ? REST : (offsets[p] as Parted);
      parting.part(face, { dx: o.dx, dy: o.dy }, ms);
    }
    if (offsets === null) unpart(drag);
    else markParted(drag, offsets);
    if (drag.rect !== null && !moves) showCaret(drag, drag.rect);
    else hideCaret(drag);
  }

  // Epic 5 SPEC CAP-6: every tray face returns to rest beside the fly-back (mirrors snap under
  // reduced motion, AD-14).
  function returnTray(drag: FreeLetterDrag): void {
    const ms = duration('flyBack');
    const reduced = prefs.motion.reduced;
    for (const [p, face] of drag.trayFaces.entries()) {
      parting.home(face, ms, reduced, drag.mirror[p] === true);
    }
  }

  // Epic 5 SPEC CAP-6 one free-letter drag move: transform, accept the clipped tray band, pick the
  // gap, part or show the caret on a change (DOM only); a caret follows its gap's winning rect.
  function move(drag: FreeLetterDrag, x: number, y: number, scrolled: number): void {
    drag.dx = x - drag.x;
    drag.dy = y - drag.y + scrolled;
    const face = drag.faces[0];
    face.style.transform = translate(drag.dx, drag.dy);
    const dragged = face.getBoundingClientRect();
    const accepted = overTray(dragged, band);
    const pick = accepted ? insertionIndex(inStartFrame(dragged, scrolled), drag.gaps) : null;
    const gap = pick === null ? null : pick.index;
    const rect = pick === null ? null : pick.rect;
    if (accepted === drag.accepted && gap === drag.gap) {
      if (rect !== null && rect !== drag.rect && drag.caret.classList.contains(CARET_SHOWN)) {
        drag.rect = rect;
        showCaret(drag, rect);
      }
      return;
    }
    drag.accepted = accepted;
    drag.gap = gap;
    drag.rect = rect;
    partTray(drag);
  }

  return { start, move, hideCaret, unpart, returnTray };
}
