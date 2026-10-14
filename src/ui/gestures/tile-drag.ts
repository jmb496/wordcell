// AD-12 tile drag (epic 5 SPEC CAP-5, F2, F4, F5, F18, F25; AD-10, AD-11, AD-12), split from
// controller.ts (epic 5 retrospective A1): the threshold-crossing start of a live tray or strip
// tile press, each move's transform, tray acceptance and gap pick, and the parted faces' return.
// The press machine, `end()` and `clearDrag` stay in controller.ts; the full description is in its
// header (Tile drag).

import type { CardId } from '../../engine/index';
import { game } from '../../shell/game.svelte';
import { prefs } from '../../shell/prefs.svelte';
import { gapRects, partingOffsets, slotRects, trayLayout } from '../layout/tray';
import { duration } from '../motion';
import { DRAG_LAYER, DRAG_TILES } from './classes';
import type { Offset, Press, TileDrag } from './drag-types';
import { REST } from './drag-types';
import { trayTarget } from './drop-target';
import { translate } from './fly-back';
import { faceIn, found } from './lookup';
import type { createParting } from './parting';
import { insertionIndex, pickTarget, type Rect } from './targeting';
import { tileRun } from './tile';
import { clip, type createVisibleBand } from './visible-band';

/** Epic 5 SPEC CAP-5: the tray band's id as `pickTarget`'s sole candidate. */
const TRAY = 0;

/**
 * Epic 5 SPEC CAP-5, F4: whether the dragged rect overlaps the tray band, clipped to the visible
 * band, by the targeting rule (≥ 25 %). Shared with the free-letter drag.
 */
export function overTray(dragged: Rect, band: ReturnType<typeof createVisibleBand>): boolean {
  const trayRect = clip(trayTarget().getBoundingClientRect(), band.visibleBand());
  return pickTarget(dragged, [{ id: TRAY, rect: trayRect }], TRAY, true).raw !== null;
}

export type TileDragDeps = {
  /** The card width and the tray's inner width, read once at a drag's start. */
  w(): number;
  trayInnerWidth(): number;
  parting: ReturnType<typeof createParting>;
  band: ReturnType<typeof createVisibleBand>;
  /** The controller's hover clearing at a threshold crossing. */
  clearHover(): void;
};

export function createTileDrag(deps: TileDragDeps) {
  const { parting, band, clearHover } = deps;

  // Epic 5 SPEC CAP-5: the threshold-crossing move of a live tile press, run before the F18 clear
  // so a selected face's lift is measured.
  function start<H>(p: Press<H>, card: CardId): TileDrag {
    const wrapper = found(p.captured, 'AD-12 tile press without a capture') as HTMLElement;
    const view = game.view;
    if (view === undefined) throw new Error('AD-12 tile drag without a GameView');
    const run = tileRun(view, card);
    const tiles = found(
      trayTarget().querySelector('.tiles') as HTMLElement | null,
      'AD-12 tray band without .tiles',
    );
    // `slotRects`' origin: tray position 0's wrapper top-left + 2 px x, measured once.
    const head = found(tiles.children[0], 'AD-12 .tiles without a tile').getBoundingClientRect();
    const sizing = trayLayout(run.tileCount, deps.w(), deps.trayInnerWidth());
    const slots = slotRects(sizing, { x: head.left + 2, y: head.top }, run.tileCount);
    const gaps = gapRects(slots, sizing.perRow, run.tileCount, run.first, run.count);
    const runFaces = run.order.map((id) =>
      faceIn(
        found(tiles.querySelector(`[data-card-id="${id}"]`), `AD-12 tile ${id} not in .tiles`),
      ),
    );
    const face = faceIn(wrapper);
    if (runFaces[run.from] !== face) throw new Error(`AD-12 tile ${card} pressed outside .tiles`);
    const slot = slots[run.first + run.from] as Rect;
    const lift = slot.top - face.getBoundingClientRect().top;
    clearHover();
    tiles.classList.add(DRAG_TILES);
    face.classList.add(DRAG_LAYER);
    return {
      kind: 'tile',
      wrappers: [wrapper],
      faces: [face],
      x: p.state.x,
      y: p.state.y,
      lift,
      dx: 0,
      dy: 0,
      tiles,
      run,
      runFaces,
      slots,
      gaps,
      accepted: false,
      gap: null,
    };
  }

  // Epic 5 SPEC CAP-5: the other run faces part to the gap (rest when unaccepted).
  function partRun(drag: TileDrag): void {
    const { run, slots, gap } = drag;
    const offsets =
      gap === null
        ? null
        : partingOffsets(slots, run.tileCount, run.first, run.count, gap, run.from);
    const ms = duration('parting');
    for (const [r, face] of drag.runFaces.entries()) {
      if (r === run.from) continue;
      const p = run.first + r;
      const o = offsets === null ? REST : (offsets[p] as Offset);
      parting.part(face, { dx: o.dx, dy: o.dy }, ms);
    }
  }

  // Epic 5 SPEC CAP-5: every parted face returns to rest beside the fly-back.
  function returnRun(drag: TileDrag): void {
    const ms = duration('flyBack');
    const reduced = prefs.motion.reduced;
    for (const [r, face] of drag.runFaces.entries()) {
      if (r === drag.run.from) continue;
      parting.home(face, ms, reduced);
    }
  }

  // Epic 5 SPEC CAP-5 one tile drag move: transform, accept the clipped tray band, pick the gap,
  // part on a change (DOM only).
  function move(drag: TileDrag, x: number, y: number): void {
    drag.dx = x - drag.x;
    drag.dy = y - drag.y;
    const face = drag.faces[0];
    face.style.transform = translate(drag.dx, drag.dy - drag.lift);
    const dragged = face.getBoundingClientRect();
    const accepted = overTray(dragged, band);
    const gap = accepted ? insertionIndex(dragged, drag.gaps).index : null;
    if (accepted === drag.accepted && gap === drag.gap) return;
    drag.accepted = accepted;
    drag.gap = gap;
    partRun(drag);
  }

  return { start, move, returnRun };
}
