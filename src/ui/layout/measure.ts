// Fit measuring (epic 5 SPEC CAP-1; ActionBar label, tray WordLine): the fractional nowrap width of
// `el` at `px`, read for `fitSize` (./fit.ts). The inline font size, and `measuringClass` when
// given, are on the element only for the read and restored after.

export function measureWidth(el: HTMLElement, px: number, measuringClass?: string): number {
  const previous = el.style.fontSize;
  if (measuringClass !== undefined) el.classList.add(measuringClass);
  el.style.fontSize = `${px}px`;
  try {
    return el.getBoundingClientRect().width;
  } finally {
    if (measuringClass !== undefined) el.classList.remove(measuringClass);
    el.style.fontSize = previous;
  }
}
