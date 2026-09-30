/**
 * The one engine error class. `check` is a kebab-case code unique per check, so tests assert
 * exactly which check threw. Codes in use:
 * - LangData: `card-id-domain`, `lang-deck-size`, `lang-unknown-letter`.
 * - Start seam (D2): `start-duplicate-card`, `start-no-column-card` (plus `card-id-domain`).
 * - §2 schema stage (`checkSchema` in serialize.ts, `parseSession` only; each code carries the
 *   `schema.` prefix, e.g. `schema.required-session`): `required-session`, `required-cursor`,
 *   `required-move`, `object-cursor`, `object-move`, `type-moves`, `type-cursor-index`,
 *   `enum-cursor-phase`, `type-source-column`, `type-source-count`, `type-destination-column`,
 *   `type-destination-count`, `type-free-letters`, `type-arrangement`, `type-target-cell`,
 *   `type-placement-order`, `enum-destination-side`, `enum-reached`, `domain-column`,
 *   `domain-count`, `domain-cell`, `domain-card`.
 * - History (`checkContainer` then `checkRecord` in serialize.ts, `parseHistory` only, in this
 *   order; each code carries the `history.` prefix, e.g. `history.record-version`):
 *   `container-field-set`, `records-not-array`, `record-not-object`, `record-field-set`,
 *   `record-version`, `seed-uint32`, `outcome`, `final-score`, `active-ms`,
 *   `longest-word-not-object` (null, an array, a non-object, or an object whose key set is not
 *   exactly `{ spelling, letterCount }`), `longest-word-spelling`, `longest-word-letter-count`,
 *   `longest-word-letter-count-short`, `longest-word-letter-count-mismatch`, `won-final-score`.
 * - AD-7 pre-replay (`checkSession`, in this order): `seed-uint32`, `ad7-active-ms`,
 *   `ad7-gave-up-type`, `ad7-cursor-index`, `ad7-cursor-phase`, `ad7-gave-up-idle`,
 *   `ad7-place-fields`, `ad7-k0-side`, `s2-committed-prefix`, `s2-last-only`,
 *   `ad7-unknown-session-field`, `ad7-unknown-cursor-field`, `ad7-unknown-move-field`.
 * - Per move (§2 replay, in this order): `r13-source-count`, `r31-destination-count`,
 *   `r33-free-letter-duplicate`, `r33-free-letter-empty`, `s2-free-letters-set`,
 *   `r35-arrangement`, `r36-letter-count`, `r40-target-cell`, `r50-placement-order`.
 * - AD-7 post-replay: `ad7-gave-up-won`.
 * - AD-7 headroom (`checkActiveMsHeadroom`, parseSession only, after replay returns):
 *   `ad7-active-ms-headroom`.
 * - Commands (`apply`, in AD-2 command TABLE order): `command-type`, `command-status`,
 *   `command-phase`, `command-dictionary`, `command-domain`, `r31-tap-not-in-destination`,
 *   `r31-set-count-empty-destination`, `r33-free-letter-absent`, `r33-free-letter-index`,
 *   `r70-nothing-to-undo`, `r71-no-redo-data` (reused: `card-id-domain`, `r13-source-count`,
 *   `r31-destination-count`, `r33-free-letter-duplicate`, `r33-free-letter-empty`,
 *   `r35-arrangement`, `r36-letter-count`, `r40-target-cell`, `r50-placement-order`); undo
 *   skips status and phase.
 * - accrue: `r76-elapsed-ms`, `r76-active-ms-overflow`.
 */
export class EngineError extends Error {
  readonly check: string;

  constructor(check: string, message?: string) {
    super(message ?? check);
    this.name = 'EngineError';
    this.check = check;
  }
}
