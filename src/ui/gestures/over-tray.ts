// AD-12 tray acceptance (epic 5 SPEC CAP-5, F4), shared by the tile drag and the free-letter drag.

import { trayTarget } from './drop-target';
import { pickTarget, type Rect } from './targeting';
import { clip, type createVisibleBand } from './visible-band';

/** Epic 5 SPEC CAP-5: the tray band's id as `pickTarget`'s sole candidate. */
const TRAY = 0;

/**
 * Epic 5 SPEC CAP-5, F4: whether the dragged rect overlaps the tray band, clipped to the visible
 * band, by the targeting rule (≥ 25 %).
 */
export function overTray(dragged: Rect, band: ReturnType<typeof createVisibleBand>): boolean {
  const trayRect = clip(trayTarget().getBoundingClientRect(), band.visibleBand());
  return pickTarget(dragged, [{ id: TRAY, rect: trayRect }], TRAY, true).raw !== null;
}
