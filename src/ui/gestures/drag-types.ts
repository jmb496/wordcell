// AD-12 controller state types (epic 4 SPEC CAP-4, CAP-7; epic 5 SPEC CAP-5, CAP-6): the press, its
// drag (column, tile or free letter), an end's reason and the parting offsets, shared by
// controller.ts and the drag modules beside it. Types and two pure helpers only.
import type { PressState, PressTarget } from './classify';
import type { Hit } from './intent';
import type { GapRect, Rect } from './targeting';
import type { freeLetterRun, tileRun } from './tile';

export type EndReason =
  | { readonly kind: 'up' | 'pointercancel' | 'lostCapture' | 'sameId' }
  // `byBack`: a drag flies back (F13) instead of snapping.
  | { readonly kind: 'cancel'; readonly byBack: boolean };

/**
 * Ticket 6.14 (F3): a mouse drag's page-scroll state: `base` is `scrollY` read at the drag start,
 * `delta` the live `scrollY` minus `base` as last applied to the faces (null on a touch or pen
 * drag, whose page never scrolls under it).
 */
export type DragScroll = { readonly base: number; delta: number };

/**
 * Epic 4 SPEC CAP-7: a press that crossed the threshold on a column card whose column
 * `canPickUp`.
 */
export type ColumnDrag = {
  readonly kind: 'column';
  readonly source: number;
  /** The source `[data-column]` element. */
  readonly sourceEl: Element;
  readonly count: number;
  /** The source column's card above the tail (the partial self-drop target, R-21). */
  readonly remainderTop: number | null;
  readonly wrappers: readonly HTMLElement[];
  /** The tail's faces; `faces[0]` is the grabbed card's (the dragged rect, AD-12). */
  readonly faces: readonly HTMLElement[];
  /** The pointerdown point. */
  readonly x: number;
  readonly y: number;
  /** F32/F33: the faces' selection lift in px (0 unless the stack lies inside the selection). */
  readonly lift: number;
  /** The last pointer offset from the press point written on the faces. */
  dx: number;
  dy: number;
  scroll: DragScroll | null;
  hasLeftSource: boolean;
  highlighted: number | null;
  /** The element carrying `wc-drag-target`. */
  target: Element | null;
  /**
   * Epic 4 SPEC F24, epic 4 SPEC F28: started with a selection open; the root carries `SUPPRESSED`
   * until its end.
   */
  readonly replacing: boolean;
};

/** Epic 5 SPEC CAP-5: a live tray or strip tile press that crossed the threshold. */
export type TileDrag = {
  readonly kind: 'tile';
  /** The dragged tile's wrapper (never moved) and face (the fly-back's fields). */
  readonly wrappers: readonly [HTMLElement];
  readonly faces: readonly [HTMLElement];
  /** The pointerdown point. */
  readonly x: number;
  readonly y: number;
  /** F2: the face's lift at the start (resting slot top − face top: 4 when selected, else 0). */
  readonly lift: number;
  /** The last pointer offset from the press point written on the face. */
  dx: number;
  dy: number;
  scroll: DragScroll | null;
  /** The `.tiles` element carrying `DRAG_TILES`. */
  readonly tiles: HTMLElement;
  readonly run: ReturnType<typeof tileRun>;
  /** The run's faces in run order (`runFaces[run.from]` is the dragged one). */
  readonly runFaces: readonly HTMLElement[];
  /** The resting slot rects of every tray position. */
  readonly slots: readonly Rect[];
  readonly gaps: readonly GapRect[];
  /** The last move's tray acceptance (≥ 25 % of the clipped band) and gap (null unaccepted). */
  accepted: boolean;
  gap: number | null;
};

/**
 * Epic 5 SPEC CAP-6: an available Composing WordCell press that crossed the threshold before the
 * long-press.
 */
export type FreeLetterDrag = {
  readonly kind: 'freeLetter';
  /** The `[data-wordcell]` carrying `DRAG_GHOST`. */
  readonly cellEl: Element;
  /** The top card's wrapper (never moved) and face (the fly-back's fields). */
  readonly wrappers: readonly [HTMLElement];
  readonly faces: readonly [HTMLElement];
  /** The pointerdown point. */
  readonly x: number;
  readonly y: number;
  /** A cell card has no lift. */
  readonly lift: number;
  /** The last pointer offset from the press point written on the face. */
  dx: number;
  dy: number;
  scroll: DragScroll | null;
  /** The `.tiles` element carrying `DRAG_TILES`, and its caret. */
  readonly tiles: HTMLElement;
  readonly caret: HTMLElement;
  /** `.tiles`' rect at the start (the caret's coordinate origin). */
  readonly tilesRect: Rect;
  readonly run: ReturnType<typeof freeLetterRun>;
  /** Every tray position's wrapper and face in tray order, mirrors included. */
  readonly trayWrappers: readonly HTMLElement[];
  readonly trayFaces: readonly HTMLElement[];
  readonly mirror: readonly boolean[];
  /** The resting slot rects: tile count + 1 with room, else the tile count. */
  readonly slots: readonly Rect[];
  readonly gaps: readonly GapRect[];
  /** Tile count + 1 > perRow × the rendered rows (the caret replaces the parting). */
  readonly full: boolean;
  readonly perRow: number;
  /** The last move's tray acceptance, gap (null unaccepted) and winning gap rect. */
  accepted: boolean;
  gap: number | null;
  rect: Rect | null;
};

export type Drag = ColumnDrag | TileDrag | FreeLetterDrag;

export type Offset = { readonly dx: number; readonly dy: number };

export const REST: Offset = { dx: 0, dy: 0 };

// Sub-pixel layout rounding is not an offset.
export function near(a: Offset, b: Offset): boolean {
  return Math.abs(a.dx - b.dx) < 0.5 && Math.abs(a.dy - b.dy) < 0.5;
}

export type Press<H> = {
  readonly pointerId: number;
  /** The element holding this press's capture; null for an uncaptured press. */
  readonly captured: Element | null;
  readonly hit: Hit;
  state: PressState;
  timer: { readonly handle: H } | null;
  drag: Drag | null;
  /** Epic 4 SPEC F19: `pointerType === 'mouse'` (a mouse press end sets the suppression). */
  readonly mouse: boolean;
  /** Ticket 6.14 (F3): the last own pointer point, the origin of a scroll-driven recompute. */
  lastX: number;
  lastY: number;
};

export type Resolved = {
  readonly target: PressTarget;
  readonly capture: Element | null;
  readonly hit: Hit;
};
