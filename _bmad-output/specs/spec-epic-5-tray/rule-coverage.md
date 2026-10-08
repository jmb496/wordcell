# Rule coverage — epic 5

Every `(UI)` sentence of `docs/game-flow-spec.md` the tray and Place screen can prove, the engine
rules whose UI surface lands here, and the spine behaviour the epic owns, with the capability that
proves them and where the rest are covered. A ticket plan expands its rows into the sentence →
test mapping; "exempt" sentences assign ownership, record provenance or describe versioning
process.

Test kinds: **P5** = Playwright in this epic on the `android` project (`desktop` too where the
row says so), named with the id; **V** = engine Vitest (epic 2); **S** = UI Vitest named `AD-n`,
supplementary, never R-id coverage; **P4** = already covered in epic 4 (kept green); **P6** /
**P7** = Playwright in epics 6 / 7; **P5 supp.** = a Playwright test in this epic that exercises
an engine-covered sentence through the UI (named with the id, supplementary to V); **—** = none.

Naming: an R-id where the sentence has one; `Q-nn …` for a §9 answer with no R-id sentence;
`AD-n …` for spine behaviour with no rule id (AGENTS.md Conventions). Every P5 test seeds a
fixture through `seedStorage` (`session-composing`, `session-composing-draft-2-letters`,
`session-place`, `session-place-free-letter-redo-tail`, `session-idle-empty-column`,
`session-won`, plus the scripted `session-place-compact` (CAP-1), CAP-7's free-letter fixture and CAP-9's two long-word fixtures) and asserts the
outcome by `current()` and the stored `wordcell:session`, not by pixels alone.

## §4 Phase C — Composing the word

| Sentence | CAP | Kind | Notes |
| --- | --- | --- | --- |
| R-30 word = D_left + M + D_right; side left/right, D reversed by card on the right | 1, 2 | V + P5 supp. | Word line and tile order on `session-composing` (side right) and after `⇄ Flip`; a `QU` card keeps its letter order. |
| R-30 Flip toggles the side | 2 | V + P5 supp. | `flip` dispatched once; stored `destinationSide` changes; on k = 0 no Flip is rendered. |
| R-31 plus/minus change k within 1 … n; a press at a bound is a no-op and not an edit | 2 | V + P5 supp. | `−` disabled at k = 1, `+` at the column's size; stored `wordcell:session` byte-identical at a bound. |
| R-31 on an empty column both controls are inert; flip inert | 2 | V + P5 supp. | k = 0 (drop on column 1 of `session-idle-empty-column`): caption `Empty column: no cards join the word`, no `−`/`+`/Flip buttons. |
| R-32 (UI) destination cards shown as a fixed block with a cannot-rearrange indication | 1, 4, 5 | P5 | Blue outline and lock per row segment (CAP-1 P5: two outlined segments with two locks where `session-place-compact`'s D block crosses the row break in its Composing after one Undo); a tap on a block tile dispatches nothing and keeps a tile selection; a drag from it moves nothing; tile drags never offer a gap inside or beyond it. |
| R-32 destination cards are never reordered or interleaved with M | 5, 6 | V + P5 supp. | `insertionIndex` S cases; P5 drag past the block lands at the M end. |
| R-33 (UI) choosing a WordCell marks it used (visual deactivation) | 1, 6 | P5 | After tap-add and after drag-insert: the cell's face is a mirror with the used hatch; during a drag the cell shows the dashed ghost and takes the used state only on a successful drop. |
| R-33 a tap on a used or empty WordCell in Composing is a no-op | 6 | V + P5 supp. | Stored Session byte-identical; a tile selection kept. |
| R-33 a free letter is removed only by the remove-free-letter command from its tile | 4, 5 | V + P5 | Second tap on a selected free-letter tile (`↩` shown) removes it; a free-letter tile (not a source tile) dragged out of the tray and released there is not removed and its WordCell stays used (CAP-5 P5). |
| R-33 add-free-letter takes an optional insertion index, default append; removal keeps the rest of M in order (Q-31) | 4, 6 | V + P5 supp. | Tap appends at the right end of M; drag inserts at the gap; removal from the middle keeps the order. |
| R-34 M may be arranged in any order and interleave freely (Q-03) | 4, 5 | V + P5 supp. | Tap-swap and drag-reorder of S and free-letter tiles. |
| R-35 all of S must be in the word | 4 | V + P5 supp. | A second tap on a selected source tile only deselects; no source tile has `↩`. |
| R-36 letter count ≥ 3, `QU` = 2 (Q-06) | 1, 2 | V + P5 supp. | Control-row `n letters`; Validate label `Need 3+ letters` on `session-composing-draft-2-letters`. |
| R-37 word string, `QU` → "qu" | 1 | V + P5 supp. | Word line shows `QU` uppercase (catalogue rule). |
| R-38 Validate only on tap; inactive until structural checks pass; invalid word shows a message and stays; a failed Validate changes nothing and keeps redo data | 2 | V + P5 | Labels per precedence; invalid line text `… isn't in the word list.` cleared by the next edit, Undo, Redo or a successful Validate; each click at most one `validate` dispatch (F15); a double tap's outcome per F21 (CAP-2's P5 on `session-composing`). Epic 3's dictionary-state rows stay green; load sentence: epic 3 Playwright, kept green. |
| R-39 (UI) in Composing, cards in columns other than the destination column are inert | — | P4 | Kept green; tile gestures add no column behaviour. |

## §4 Phase D–E and Commit — Place

| Sentence | CAP | Kind | Notes |
| --- | --- | --- | --- |
| R-39 (UI) in Place all columns and WordCells are inert except target selection (R-40) and viewing (R-65) | 7 | P5 | Column inertness P4; P5 adds the WordCell target tap and proves a WordCell drag and a not-legal tap dispatch nothing. |
| R-40 legal targets are WordCells numbered ≤ L | 7 | V + P5 supp. | Legal cells ringed, others faded; a not-legal tap is a no-op. |
| R-41 a cell whose top was used as a free letter is still a legal target (Q-02) | 7 | V + P5 supp. | CAP-7's scripted fixture (free letter from a cell ≤ L that is not the stored target): tap the used cell → target set (a test of its own; R-61 is a second test on the same fixture). |
| R-42 (UI) the Place screen pre-selects the stored target | 7 | P4 + P5 | P4 renders the ring and check chip; P5 re-proves it after Validate, after a retarget on `session-won` + one Undo (legal 3–6, target 6), and after a retarget plus reload on CAP-7's scripted free-letter fixture. |
| R-50 (UI) the UI shows which card lands on the bottom and which becomes the new top | 1 | P5 | `bottom` tag on the first strip tile, `top` tag and `★` on the last, the compact corner map (`▼`/`★`, ×2, origin tag) on `session-place-compact` (two compact rows). |
| R-51 default order is word order; reorder before confirming; changing the target does not reset the order | 4, 5, 7 | V + P5 supp. | Strip tap-swap and drag; retarget on `session-won` + one Undo keeps `placementOrder`. |
| R-52 the new top card becomes that cell's free letter | 7 | V + P5 supp. | After Confirm the target cell's top is the strip's last card, also when the target is the free letter's cell (`session-place-free-letter-redo-tail`); in the next move it can be tap-added. |
| R-60 confirm commits atomically | 7 | V + P5 supp. | One `confirm` dispatch; columns, cells and cursor per R-60 in `current().session` and storage. |
| R-61 a free letter's cell exposes its next card after commit | 7 | V + P5 supp. | CAP-7's scripted fixture (free letter's cell ≠ target), a test separate from R-41's: Confirm into another cell; the used cell shows the card beneath only after Confirm. |
| R-62 every column empty → won | 7, 10 | V + P5 supp. | From `session-won` + one Undo, Confirm → Game over (`New game` primary); the end sheet is P6. |
| R-80 (A-E14 Place points preview) net score change previewed in Place | 1, 7 | V + P5 supp. | CAP-1 meta; CAP-7 score change equals the preview. |

## §5 Undo, redo, session

| Sentence | CAP | Kind | Notes |
| --- | --- | --- | --- |
| R-70 Undo from Place → Composing keeps the arrangement; from Composing → Idle returns the cards | 8 | V + P5 supp. | The cards animate back (`undoRedo`); tray and strip contents after each step. |
| R-71 every draft edit discards redo data; a swap of identical letters is an edit; a no-change drag or swap is not | 4, 5 | V + P5 supp. | Redo disabled after an edit at Composing (incl. a swap of the two `R` cards on `session-won` + two Undos) and at Place (`session-won` + one Undo, tap-swap strip cards 38 and 37 → Redo disabled, stored `reached` `place`); enabled after a no-change drag (`session-won` + one Undo (Place), then a strip drag released over its own gap: Redo stays enabled). |
| R-72 actions within a phase are not undo steps | 4 | V + P5 supp. | After three tile edits one Undo returns to Idle. |
| R-73 (UI) saved after every change: each draft edit (arrange, add/remove free letter, k, flip), Validate, retarget, reorder, Confirm | 2, 4–7 | P5 | Stored Session equals `current().session` before the next action, per command kind. |
| R-73 (UI) the player returns to the exact phase they left | 4, 7 | P5 | Reload in Composing with a free letter after a tap-swap (CAP-4), and in Place on CAP-7's scripted free-letter fixture with a retarget and a non-default order (CAP-7; the free letter's cell still shows the used-hatch mirror): the same tray, strip, tags and target (EXPERIENCE.md Flow 5); a tile selected before the reload is not selected after (EXPERIENCE.md State Patterns). |
| R-75 while status ≠ playing no free letter can be chosen | 6 | V + P4 | `session-won`: WordCell tap opens the view (P4), never adds. |

## §4 Any phase — R-65

| Sentence | CAP | Kind | Notes |
| --- | --- | --- | --- |
| R-65 (UI) viewing in Composing and Place | 6, 7 | P4 + P5 | Long-press peek stays available on cells that also take free-letter and target taps; a peek in Composing dispatches nothing and keeps a tile selection (F13; CAP-6 P5: a long-press peek with a tile selected). |

## Spine behaviour without a rule id (named `AD-n`)

| Behaviour | CAP | Kind |
| --- | --- | --- |
| AD-3 tray, strip and controls read only `GameView` flags and data (no derived k bounds, word or delta) | 1, 2 | S (architecture scan unchanged) + code review |
| AD-4 tile selection ends on a `changed` dispatch and on any enabled-control press before its dispatch (a failed Validate included); a tap on a disabled control (`−` at k = 1) clears it through the controller tap path | 4 | S + P5 |
| AD-11 tray rows from the tile count after completed edits, never mid-drag; WordCell row bounding box unchanged after growth to three compact rows (`+`) and back (`−`); every move's row change (a commit by Confirm or Redo included) in the same update as the move, its FLIP after it; with leftover exhausted the document grows at the top with a matching `scrollTop` delta; a move dispatched while page scroll is busy clears it and re-lays out and glides at once (F24) | 9 | S + P5 |
| AD-12 tile press resolution (`tray`/`strip`, block mirror), full-pitch tile hit rect with the lift on the face only; a drag from an inert target ending in `pointerup` acts on the tile selection as its tap; one ended by `pointercancel` keeps it (F1, S) | 4 | S + P5 |
| AD-12 tray band single target at ≥ 25 %, clipped to the visible band (F4); `insertionIndex` nearest gap, wrapped rows by distance, never inside or beyond the block | 5, 6 | S + P5 |
| AD-12 tile and free-letter drag cancel paths (F5): `hidePage`, back (`page.goBack()` leaving the app, stored Session equal to the pre-drag one apart from `activeMs`, read after a `page.goForward()` that restores the app (default), or through `page.context().storageState()` (alternative, `unverified` on Playwright 1.63)), `pointercancel`, `act()` mid-drag dispatch nothing | 5, 6 | S + P5 |
| AD-12 `cancel()` first in `−`, `+`, Flip, Validate and Confirm (`act()`) | 2 | S |
| AD-13 tile selection pushes no entry; back with a tile selected follows the bare-Board rule; `resetForNewSession` clears it | 4 | S + P5 |
| AD-14 one live element per card in every phase and during every animation (CAP-8 P5: exactly 52 `[data-card-id]` during a Validate glide and a Confirm fly-to-cell); faces animate; wrappers never; mirrors take no part in the FLIP glide (the D-block parting shift excepted, AD-14) | 1, 8 | P5 |
| AD-14 FLIP kinds from the dispatching command and its `DispatchResult`: snap on drop, the F17 moves (Validate, Flip, k change, tap-add, removal, tap-swap, a release with an edit gliding from its released point, `flyBack` for a tile or free letter released with no edit), `undoRedo`, `flyToCell` with 30 ms stagger bottom first, each flying card visible; every card whose band-relative position changed, none on a pure band shift; durations from `motion.ts`; reduced motion 120 ms fade (fly-to-cell: all at once, no stagger) | 8 | S + P5 (`getAnimations()` on faces with Animation speed Slow seeded, read as CAP-8's P5 states: in the triggering `page.evaluate` for `act()` buttons, right after the touch end/`mouse.up` for every controller-classified press (taps and drags); one Confirm under `page.emulateMedia({ reducedMotion: 'reduce' })`) |
| AD-14 input during an animation completes it and acts on the settled state | 8 | S + P5 |
| AD-14 winning guard (F8): a tap on the target cell 6 → no view, the same tap after settle opens it (win by Confirm and by Redo); double-tap Confirm → same seed, no New-game Session written, also under reduced motion and at Fast (F23: guard ≥ 300 ms after the win) (`desktop`: Enter twice, Enter held at Slow and Normal speed); an untouched win settles and New game starts a new game; Undo completes then undoes; the guard always uninstalls (long press, `pointercancel`, natural settle, a `pointerdown` or `keydown` after settle in the backstop window, backstop expiry, a key held through a hide or a window `blur` (including one held before the win)), under both motion settings; no hover-peek timer starts while installed (S, injected timer) | 10 | P5 + S (the menu tap and end-sheet expanded halves P6) |
| AD-10 parting 0.5 × base, snaps under reduced motion | 5 | S |
| AD-17 unit budget re-measured on the Linux filesystem at the sweep | 12 | recorded in the plan |

## Exempt

- §7 Interaction model sentences: proposals superseded by EXPERIENCE.md, which these rows bind to.
