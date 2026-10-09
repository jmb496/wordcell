// AD-12 visible band (epic 4 SPEC F34): drop targeting measures each registered column rect clipped
// vertically to the band between the sticky bars, from the lower of the top bar's and a shown
// banner's bottom to the action bar's top, read once per drag move from the attach root's
// `[data-band]` elements. The banner wrapper is always rendered and counts only while it has
// height; a column wholly under a bar clips to a zero-area candidate, so a tail held over a bar
// lights nothing and its release flies back.
import type { Rect } from './targeting';

export type Band = { readonly top: number; readonly bottom: number };

// A column rect clipped vertically to the visible band; an empty clip is zero-area.
export function clip(r: Rect, band: Band): Rect {
  const top = Math.max(r.top, band.top);
  const bottom = Math.max(top, Math.min(r.bottom, band.bottom));
  return { left: r.left, top, right: r.right, bottom };
}

export type VisibleBand = {
  /** The band under the attach root `root()` at the time of the call. */
  visibleBand(): Band;
};

export function createVisibleBand(root: () => HTMLElement | null): VisibleBand {
  function barRect(band: 'topBar' | 'banner' | 'actionBar'): Rect {
    const rootEl = root();
    if (rootEl === null) throw new Error('AD-12 drag without a root');
    const el = rootEl.querySelector(`[data-band="${band}"]`);
    if (el === null) throw new Error(`AD-12 drag without [data-band="${band}"]`);
    return el.getBoundingClientRect();
  }

  // The banner wrapper is always rendered and counts only while it has height (shown).
  function visibleBand(): Band {
    const topBar = barRect('topBar');
    const banner = barRect('banner');
    const top = banner.bottom > banner.top ? Math.max(topBar.bottom, banner.bottom) : topBar.bottom;
    return { top, bottom: barRect('actionBar').top };
  }

  return { visibleBand };
}
