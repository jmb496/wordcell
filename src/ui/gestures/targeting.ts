// AD-12 drop targeting by overlap (EXPERIENCE.md Drop targeting by overlap, steps 3–5; SPEC
// CAP-7), pure: the controller passes the grabbed face's rendered rect after its transform and every
// registered column hit rect (the source included). `raw` is the column with the largest overlap
// ratio (intersection area ÷ dragged area) of at least 25 % (inclusive); equal ratios go to the
// horizontally nearest centre, then the lower column number. `highlighted` suppresses the source
// until the drag has left it (Q-34); the controller owns `hasLeftSource` (set once `raw` is another
// column, or `null` while the face also misses the source's unclipped hit rect, F37).
//
// F3 (build-notes CAP-5): `insertionIndex` picks the tray insertion gap whose resting gap rect
// (`layout/tray.ts` `gapRects`) has its centre nearest the dragged face's centre (Euclidean, ties
// to the lower index, then the earlier rect; no hysteresis), and `reorder` applies a tile drag from
// run index j to gap i over M or `placementOrder`.
import type { CardId } from '../../engine/index';

export type Rect = {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
};

export type Candidate = { readonly id: number; readonly rect: Rect };

export type Pick = { readonly raw: number | null; readonly highlighted: number | null };

/** EXPERIENCE.md Drop targeting step 3 [A-E6]: the minimum overlap ratio, inclusive. */
export const MIN_RATIO = 0.25;

function area(r: Rect): number {
  return Math.max(0, r.right - r.left) * Math.max(0, r.bottom - r.top);
}

function intersection(a: Rect, b: Rect): number {
  const w = Math.min(a.right, b.right) - Math.max(a.left, b.left);
  const h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
  return w > 0 && h > 0 ? w * h : 0;
}

const centreX = (r: Rect): number => (r.left + r.right) / 2;
const centreY = (r: Rect): number => (r.top + r.bottom) / 2;

/** F3: one hit rect of insertion gap `index` (a row-break index has two). */
export type GapRect = { readonly index: number; readonly rect: Rect };

export function pickTarget(
  dragged: Rect,
  candidates: readonly Candidate[],
  sourceId: number,
  hasLeftSource: boolean,
): Pick {
  const draggedArea = area(dragged);
  if (draggedArea === 0) throw new Error('AD-12 pickTarget with a zero-area dragged rect');
  const cx = centreX(dragged);
  let best: { id: number; ratio: number; distance: number } | null = null;
  for (const { id, rect } of candidates) {
    const ratio = intersection(dragged, rect) / draggedArea;
    if (ratio < MIN_RATIO) continue;
    const distance = Math.abs(centreX(rect) - cx);
    if (
      best === null ||
      ratio > best.ratio ||
      (ratio === best.ratio &&
        (distance < best.distance || (distance === best.distance && id < best.id)))
    ) {
      best = { id, ratio, distance };
    }
  }
  const raw = best === null ? null : best.id;
  return { raw, highlighted: raw === sourceId && !hasLeftSource ? null : raw };
}

/** F3, build-notes CAP-5: the gap rect nearest the dragged face's centre (the element itself). */
export function insertionIndex(dragged: Rect, gapRects: readonly GapRect[]): GapRect {
  const head = gapRects[0];
  if (head === undefined) throw new Error('AD-12 insertionIndex with no gap rects');
  if (area(dragged) === 0) throw new Error('AD-12 insertionIndex with a zero-area dragged rect');
  const cx = centreX(dragged);
  const cy = centreY(dragged);
  const distance = (e: GapRect): number => Math.hypot(centreX(e.rect) - cx, centreY(e.rect) - cy);
  let best = { e: head, d: distance(head) };
  for (const e of gapRects.slice(1)) {
    const d = distance(e);
    if (d < best.d || (d === best.d && e.index < best.e.index)) best = { e, d };
  }
  return best.e;
}

/**
 * Build-notes CAP-5 reorder result: move the tile at j to gap i (counted over the sequence
 * including it); the input reference when gap j or j + 1 leaves the order unchanged.
 */
export function reorder(order: readonly CardId[], j: number, i: number): readonly CardId[] {
  const n = order.length;
  if (!Number.isInteger(j) || j < 0 || j >= n) {
    throw new Error(`AD-12 reorder with j ${j} outside 0…${n - 1}`);
  }
  if (!Number.isInteger(i) || i < 0 || i > n) {
    throw new Error(`AD-12 reorder with i ${i} outside 0…${n}`);
  }
  if (i === j || i === j + 1) return order;
  const out = order.filter((_, k) => k !== j);
  out.splice(i <= j ? i : i - 1, 0, order[j] as CardId);
  return out;
}
