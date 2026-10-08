// Epic 5 entry 1 Fit (DESIGN.md Typography word line, Invalid-word message): the tray's word line
// shrinks from `max` to `min` px to fit its box, never wrapping. Pure: the caller injects
// `measure`, the line's text width at a given font size.

/** The largest integer px in min…max whose measured width is ≤ `box`, else `min`. */
export function fitSize(
  measure: (px: number) => number,
  box: number,
  max: number,
  min = 14,
): number {
  for (let px = max; px > min; px--) if (measure(px) <= box) return px;
  return min;
}
