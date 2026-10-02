// AD-11: the single band-order definition (F22). Every vertical band the DESIGN.md height rule
// counts, grouped into units: the foot row with its columns, each gap with its lower neighbour,
// the cell-number labels with the WordCell row. Geometry, growth and anchoring work from positions
// in the order, never from named neighbours. Pure: no DOM, `window` or `import.meta.env`.

export type BandId =
  | 'topBar'
  | 'banner'
  | 'leftover'
  | 'columns'
  | 'footRow'
  | 'trayGap'
  | 'tray'
  | 'labels'
  | 'wordcells'
  | 'actionGap'
  | 'actionBar';

export type Unit = readonly BandId[];

export const BAND_ORDER: readonly Unit[] = [
  ['topBar'],
  ['banner'],
  ['leftover'],
  ['columns', 'footRow'],
  ['trayGap', 'tray'],
  ['labels', 'wordcells'],
  ['actionGap', 'actionBar'],
];

/** AD-11: the band that keeps its screen position. */
export const ANCHOR_BAND: BandId = 'wordcells';
/** AD-11: the band that absorbs growth on its side of the anchor first. */
export const SLACK_BAND: BandId = 'leftover';

const NON_ID_BANDS: readonly BandId[] = ['trayGap', 'actionGap', 'labels'];

/** A unit's `?bands=` id: its first band that is not a gap or the labels. */
function unitId(unit: Unit): BandId {
  return unit.find((band) => !NON_ID_BANDS.includes(band)) as BandId;
}

const UNIT_BY_ID = new Map<string, Unit>(BAND_ORDER.map((unit) => [unitId(unit), unit]));

/**
 * AD-11: the `?bands=<comma list>` override (build-notes CAP-1). Reads the first `bands` value;
 * absent or empty gives `BAND_ORDER`; anything other than a permutation of the unit ids throws to
 * the AD-15 surface. Callers apply it only in dev builds.
 */
export function parseBandsParam(search: URLSearchParams): readonly Unit[] {
  const list = search.get('bands');
  if (list === null || list === '') return BAND_ORDER;
  const tokens = list.split(',');
  const units: Unit[] = [];
  for (const token of tokens) {
    const unit = UNIT_BY_ID.get(token);
    if (unit === undefined || units.includes(unit)) break;
    units.push(unit);
  }
  if (units.length !== tokens.length || units.length !== BAND_ORDER.length) {
    throw new Error(`AD-11: ?bands=${list} is not a permutation of the band units`);
  }
  return units;
}
