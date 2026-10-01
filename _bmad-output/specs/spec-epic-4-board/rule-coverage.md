# Rule coverage — epic 4

Every `(UI)` sentence of `docs/game-flow-spec.md` this epic's Board and gestures can prove, the
engine rules whose UI surface lands here, and the spine behaviour the epic owns, with the
capability that proves them and where the rest are covered. A ticket plan expands its rows into
the sentence → test mapping; "exempt" sentences assign ownership, record provenance or describe
versioning process.

Test kinds: **P4** = Playwright in this epic on the `android` project (`desktop` too for hover
and mouse, named the same), named with the id; **V** = engine Vitest (epic 2); **S** = UI or
shell Vitest named `AD-n`, supplementary, never R-id coverage; **P5** / **P6** / **P7** =
Playwright in epics 5 / 6 / 7; **P4 supp.** = a Playwright test in this epic that exercises an
engine-covered sentence through the UI (named with the id, supplementary to V); **—** = none.

Naming: an R-id where the sentence has one; `Q-nn …` for a §9 answer with no R-id sentence;
`AD-n …` for spine behaviour with no rule id (AGENTS.md Conventions). Every P4 test seeds a
fixture through `seedStorage` (the epic 3 fixtures: `session-idle-fresh`, `session-composing`,
`session-place`, `session-place-free-letter-redo-tail`, `session-won`, `session-gave-up`, …, plus
epic 4's scripted `session-idle-empty-column` and `session-gave-up-after-commit`, SPEC CAP-9) and
asserts the outcome by `current()` and the stored `wordcell:session`, not by pixels alone.

## §3 Setup and §4 Phase A–B (the pick-up and the drop)

| Sentence | CAP | Kind | Notes |
| --- | --- | --- | --- |
| R-03 dealt layout rendered top→bottom per column | 2 | V + P4 supp. | Named `R-03 …` (C-E4a): `session-idle-fresh` column letters read from the DOM equal a literal list per column; 7/7/7/7/6/6/6/6. |
| R-10 a tail is the selected card and every card below it | 6, 7 | V + P4 supp. | Tap and drag select or lift from any strip; `drop.sourceCount` equals the cards from the pressed card to the bottom; a re-select above the top grows the tail, inside it shrinks it, and the next tap-drop's `sourceCount` matches. |
| R-11 a tail may be the whole column | 6, 7 | V + P4 supp. | Tap or drag on the top card of a column lifts all of it. |
| R-12 WordCell cards cannot be a source tail | 9 | V + P4 supp. | A WordCell drag in Idle is inert; WordCells never lift a tail. |
| R-14 (UI) tap-to-select is transient UI state, not a phase | 6 | P4 | Selecting dispatches nothing; `current().session` reference and storage unchanged. |
| R-14 (UI) a tap on any card or placeholder slot of another column is a drop | 6 | P4 | Card, placeholder, empty space and foot of another column. |
| R-14 (UI) a drop on the source column (the gesture UX confirms: `Here` pad or empty space) | 6 | P4 | Partial tail → k = 1 from the remainder; whole column → k = 0 (Q-30). |
| R-14 (UI) a tap on another card of the source column re-selects from that card | 6 | P4 | No new history entry (`history.state.wc` unchanged). |
| R-14 (UI) a tap on the selected card itself is a no-op | 6 | P4 | Selection and entry kept. |
| R-14 (UI) a tap on a WordCell deselects and does not open the view | 6, 9 | P4 | Empty and non-empty cells. |
| R-14 (UI) taps outside all columns deselect | 6 | P4 | Completed taps on the top bar background, tray band, labels, gap, action bar background, leftover band, banner background, `desktop` side margins, a disabled control; a long-press on a WordCell and a pan from a `pan-y` region at a scrolling viewport keep the selection (F25). |
| R-14 (UI) a drag released over no column returns the tail with no command and no move-history change | 7 | P4 | Released over the WordCell row; stored Session byte-identical. |
| R-14 (UI) a drag whose drop target never left the source column returns the tail (Q-34) | 7 | P4 | 20 px drag staying over its own column (EXPERIENCE.md Flow 1 variant); also a sub-25 % drag over the source only. |
| R-14 (UI) a drag that leaves the source column and returns drops on the source column | 7 | P4 | Highlight appears on the source only after leaving. |
| R-14 (UI) the selection is not persisted or undoable | 6 | P4 | Reload → nothing selected; Undo with a selection clears it, then undoes the previous move. |
| Q-18 tap-to-select in addition to drag | 6 | P4 | Covered by the R-14 tap rows; no separate test. |
| Q-34 short drag never leaving the source column cancels | 7 | P4 | Under the R-14 row; `pickTarget` S cases for `hasLeftSource`. |
| R-20 any column, the source included, is a destination | 6, 7 | V + P4 supp. | |
| R-21 self-drop draws D from the remainder | 7 | V + P4 supp. | Partial self-drop highlights the lowest non-tail card. |
| R-22 an empty column is a legal destination, including the emptied source | 6, 7 | V + P4 supp. | Placeholder hit rect on column 1 of `session-idle-empty-column`; whole-column self-drop from `session-idle-fresh`. |
| R-23 the draft starts with k = 1 (0 on an empty column), side left, S in column order; drop position never chooses k (Q-26) | 7 | V + P4 supp. | Drops at the top and at the bottom of a target column give the same draft; k = 0 on column 1 of `session-idle-empty-column`. |

## §4 Phase C–E (the column side of Composing and Place)

| Sentence | CAP | Kind | Notes |
| --- | --- | --- | --- |
| R-31 tapping a destination card sets k so it is the top of D; tapping the top of D sets k − 1 (no-op at k = 1) | 8 | V + P4 supp. | The UI dispatches `tapDestinationCard` iff `kIfTapped` maps the card to a number. |
| R-32 (UI) destination cards shown as a fixed block with a cannot-rearrange indication | 2 | P5 | The static tray draws the D mirrors in destination style (S here); the interactive block is epic 5. |
| R-33 (UI) chosen WordCell shown as used (visual deactivation) | 2 | P4 + P5 | P4: `session-place-free-letter-redo-tail` (and Undo into its Composing) shows the cell's top as a mirror with the used state; the tap that chooses it is P5. |
| R-33 (UI) a tap on a used or empty WordCell in Composing is a no-op | — | P5 | Epic 5 adds the Composing WordCell tap; in epic 4 every Composing WordCell tap or drag dispatches nothing (CAP-9, P4: Session reference unchanged). |
| R-39 (UI) in Composing, cards in columns other than the destination column are inert (no drag, no selection) | 8 | P4 | S ghosts included; viewing unaffected (CAP-9). |
| R-39 (UI) a drag started on a destination-column card is treated as a tap on that card (R-31) | 8 | P4 | The card does not move; one `tapDestinationCard` at `pointerup`. |
| R-39 (UI) to change source or destination, Undo | 8 | P4 | Undo from Composing returns the tail; a new drag then works. |
| R-39 (UI) in Place all columns and WordCells are inert except target selection (R-40) and viewing (R-65) | 8, 9 | P4 + P5 | Columns inert and WordCell view in P4; target selection P5; in epic 4 a Place WordCell tap or drag dispatches nothing and opens no view (CAP-9). |
| R-42 (UI) the Place screen pre-selects the stored target | 2 | P4 + P5 | The selected-target state (teal ring, check chip) on `session-place`; strip tags P5. |
| R-50 (UI) the UI shows the bottom card and the new top | — | P5 | Placement strip tags. |

## §5 Undo, redo, session

| Sentence | CAP | Kind | Notes |
| --- | --- | --- | --- |
| R-70/R-71 Undo and Redo enablement | 3 | V + P4 supp. | The top-bar buttons keep epic 3's `canUndo`/`canRedo` binding; Redo into Composing with a free letter re-renders the used state. |
| R-73 (UI) saved after every change: the drop and a k change from the column | 7, 8 | P4 | Extends epic 3's per-dispatch test: the stored Session equals `current().session` before the next action. Other draft edits are P5, give-up and New game/Replay from the menu P6. |
| R-73 (UI) the player returns to the exact phase they left | 2 | P4 + P5 | A reload of `session-composing` and of `session-place-free-letter-redo-tail` re-renders the same ghosts, destination style, used cell, static tray order and target; the full tray is P5. |
| R-75 while status ≠ playing no card can be selected or dropped; viewing a WordCell stays available | 8, 9 | V + P4 supp. | Column taps and drags change nothing on `session-gave-up` and `session-won`; a WordCell tap opens the sticky view on `session-won` and `session-gave-up-after-commit` (`session-gave-up` has every WordCell empty). |
| R-76 (UI) Show timer display | — | P6 | Timer box absent in epic 4 (default off). |

## §6 Scoring

| Sentence | CAP | Kind | Notes |
| --- | --- | --- | --- |
| R-82 (UI) score shown live during play | 3 | P4 | `Score <n>` from `displayScore`: committed score on `session-place`'s position, final score (U+2212 when negative) on `session-gave-up`; a Redo across a commit updates it. |
| R-82 (UI) and on the end screen | — | P6 | |
| R-83 (UI), R-84 surfaces | — | P6 | |

## §4 Any phase — R-65 viewing

| Sentence | CAP | Kind | Notes |
| --- | --- | --- | --- |
| R-65 (UI) every card of any WordCell may be viewed at any time | 9 | P4 | Long-press peek in Idle and Idle with a tail selected (selection kept) on `session-idle-empty-column`, Place on `session-place-free-letter-redo-tail`, Composing after one Undo from it, Game over on `session-won`; tap → sticky view in Idle (nothing selected, `session-idle-empty-column`) and Game over (`session-won`); a swipe inside an overflowing sticky view scrolls it and keeps it open, then a tap closes it; hover peek on `desktop`. `Space` is P6. |
| R-65 (UI) viewing changes nothing; only the top card is usable | 9 | P4 | `current().session` reference and storage unchanged after each view. |
| R-65 (UI) the view does not enter the move history | 9 | P4 | Undo/Redo enablement unchanged; the peek pushes no entry, the sticky view one. |
| Q-21 view cards beneath the top, long-press preferred | 9 | P4 | Under R-65. |

## Spine behaviour without a rule id (named `AD-n`)

| Behaviour | CAP | Kind |
| --- | --- | --- |
| AD-11 `BAND_ORDER` units, anchor and slack bands; `?bands=` non-permutation throws; `cardWidth` and `bands` reference numbers, insets, H > 92, floor, height rule above innerHeight (leftover 0), banner and tray growth in the default and one fallback order; w-recompute predicate (80 px rule, two 60 px shrinks); innerHeight-only change under 80 px (F21) | 1 | S |
| AD-11 `Board.svelte` iterates `BAND_ORDER`; `?bands=` reorders in dev and is ignored in `dist/` | 2, 3 | P4 (dev) + `dist-smoke` (the Constraints exception) |
| AD-11 banner takes leftover first; WordCell row bounding box unchanged when the banner shows with leftover < 44 px; banner shown during a scroll applied after it ends | 3 | P4 |
| AD-11 WordCell row bounding box unchanged after tray growth | — | P5 |
| AD-11 `touch-action` none on cards and WordCells, `pan-y` on non-card regions (`pan-x pan-y` when the board is wider than the available width) | 3 | P4 (computed style) |
| AD-11 gate: pending work runs in the next idle frame; scroll busy until `scrollend`, hide or 150 ms | 3, 4 | S (`createGate` with injected `raf`/timers) + P4 (DOM wiring) |
| AD-12 tap / drag / long-press classification, one pointer, `button !== 0` ignored, `pointercancel`/`lostpointercapture`/`cancel()` end any press with no command and the rest of that `pointerId` is ignored, gate increment before completing an animation | 4 | S (pure `classify`) + P4 (DOM wiring) |
| AD-12 press resolved by `data-place`; tapping and dragging a static tray tile changes nothing | 4 | P4 |
| AD-12 a drag from the source column of a tap-selected tail replaces it; only one tail lifted mid-drag | 7 | P4 |
| AD-12 a press during fly-back acts on the settled layout (`elementFromPoint` after `finish()`) | 7 | P4 |
| AD-12 `pickTarget` raw/highlighted, 25 %, tie-break, `hasLeftSource` from `raw` including `null`, sub-25 % on the source only | 7 | S |
| AD-12 transform written directly, no Svelte state until release; at most one command per gesture | 7 | S + P4 (dispatch count via `current()` reference changes) |
| AD-12 `cancel()` first in Undo, Redo and every dialog, notice, banner and Blocking-message action mounted after the controller (standalone Halted Reload exempt, F9) | 4 | S (spy on the helper) + P4 (during a held `touchHold` drag, Undo triggered by `locator.dispatchEvent('click')`, on `desktop` the same while a `page.mouse` drag is held: tail returned, then Undo acted) |
| AD-9 / AD-17 `hidePage` alone: one `wordcell:session` write, the gesture cancel, resume only when visible; `hidePage` mid-`touchDrag` returns the tail and dispatches nothing, and a move after `hidePage` then `end()` changes nothing; a held destination-card press in Composing + `hidePage` → no `tapDestinationCard` | 4 | P4 |
| AD-13 before-back hook: registered separately, runs before the Forward check and close callback, not on own pops or stale launches, throws on a second registration | 4 | S |
| AD-13 `cancel({ byBack: true })` skips `overlays.deselect()`; the hide and Undo `cancel` deselect | 4 | S (one case per path) |
| AD-13 one entry per tail selection; re-select pushes none; popped on drop, deselect, Undo, Redo; back clears it (`wc: 0`, app open) | 5, 6 | S + P4 |
| AD-13 select, start a drag from another column, back → nothing selected, app open, `history.state.wc = 0` | 7 | P4 |
| AD-13 open an overlay (tail selection; sticky view), reload, back → the app is left | 6, 9 | P4 (the two-overlay case is P6, F16) |
| AD-13 peek pushes none; sticky view one; peek turned sticky pushes one above a kept selection; `openPeek`/`closePeek`/hover-peek state push none, `peekToSticky` one | 5, 9 | P4 + S |
| AD-13 end-sheet `hidden`/`collapsed`/`expanded`, `closedByBack` collapses, `unfinished` transitions, deferred-open cancel, `resetForNewSession` | 5 | S (Playwright P6) |
| AD-14 exactly one live element per card in Idle, Composing, Place and Game over; mirrors with `data-mirror-of` only | 2 | P4 |
| AD-10 fly-back duration from `motion.ts`; reduced motion → 120 ms fade | 7 | S |
| AD-16 the pointer controller exists before the lifecycle listeners, on the rejected root too | 4 | P4 (hide mid-drag on the Board cancels via the registered before-hide hook; `hidePage` on the rejected root writes nothing and throws nothing; the rejected-root controller is otherwise unobservable) |

## Exempt

- §7 Interaction model sentences: proposals superseded by EXPERIENCE.md, which these rows bind to.
- R-14 "the gesture is a UX deliverable, §7.1": provenance.
