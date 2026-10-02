// AD-12 drop targeting by overlap (EXPERIENCE.md Drop targeting by overlap, steps 3–5; SPEC
// CAP-7), pure: the controller passes the grabbed face's rendered rect after its transform and every
// registered column hit rect (the source included). `raw` is the column with the largest overlap
// ratio (intersection area ÷ dragged area) of at least 25 % (inclusive); equal ratios go to the
// horizontally nearest centre, then the lower column number. `highlighted` suppresses the source
// until the drag has left it (Q-34); the controller owns `hasLeftSource` (set once `raw` is not the
// source, `null` included).

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
