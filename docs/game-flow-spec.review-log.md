# Review log — docs/game-flow-spec.md

Loop: `/review-loop docs/game-flow-spec.md max=4 depth=thorough`. Pre-loop state: commit 6450522
(spec v0.3). Constraint from Jared: §9 answers Q-01…Q-25 are not to be changed.

## Pass 1 — 2026-09-26
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 10, minor 16, decision-needed 4  |  Dropped in triage: 3
### Applied
- [major] R-37 — dictionary length filter unbounded/ambiguous, would cap at 10 vs Q-05 → filter stated as letter count ≥ 3, ≤ 23 (longest reachable word); qu = 2 letters
- [major] R-72 vs R-71 — "discards the whole arrangement" contradicts Redo re-applying the draft → arrangement retained as redo data
- [major] §2/R-60/R-71 — redo tail defined only as later moves; Redo inside a draft's phases and "never-committed vs committed" indistinguishable → `reached` marker on Move, redo enabled while cursor < reached or later moves exist; commit via Confirm (not Redo) drops later moves
- [major] R-70/R-71 — stale targetCell/placementOrder after a Composing edit → edits clear later-phase fields and reset `reached`
- [major] §2/R-70/R-75 — give-up not derivable, Undo at index 0 contradiction, redo of give-up unstated → stored flag, Undo clears it without moving cursor, not redoable, Give up only while playing
- [major] R-84 — stats accumulation vs undo of a finished game → score history is the source; record appended on finish, removed on undo of the finish
- [major] R-51 — default placement order end unspecified → word left-to-right = bottom→top, last letter becomes free letter
- [major] R-03 — deal orientation unspecified → first dealt = top, last dealt = bottom; i-th card to column (i mod 8)+1
- [major] R-38/R-84/§2 — validation-failure counter not persisted → `validationFailures` added to Session
- [major] R-30/§2 — destinationSide undefined when k = 0 → stored 'left', flip inert
- [minor] ×16: CardId defined; Flip in vocabulary; Session.version meaning; cursor.index = undoIndex; R-83 ≥ inclusive on post-penalty score, lowest-band name delegated to UX; Destination column wording; save on hide; QU keeps internal order on reversal; word-string mapping; R-61 target-cell exception; §7.2 tap semantics; other columns inert in Composing; 44 px target + QU ×2 indicator in §7; "card moves" defined; status line v0.4; R-13 rationale flagged as under review
### Decision needed
- R-30/R-31 — initial draft state on drop (k, side, order of S; does drop position pick k) — proposed default: k = 1 (0 if empty), side left, S in top-to-bottom order, drop position does not set k (Q-26)
- R-13 rationale — "nothing is lost" is false under Q-12; does Q-11 stand? — proposed default: Q-11 stands, rationale corrected (Q-27)
- R-81/R-83 — negative give-up score — proposed default: not clamped, lowest band (Q-28)
- R-74/R-84 — abandoned game via New game / Replay in statistics — proposed default: not recorded (Q-29)
### Dropped
- R-02 name the PRNG/shuffle algorithm — architecture-spine concern, not a rule; deal stability covered by seed + Session.version
- Duplicate reports of R-37, R-72, redo-tail, give-up, deal orientation, initial draft state, R-13, abandoned games, negative score (kept the clearest wording of each)
- Max word length 22 vs 23 — reconciled to 23 (22 cards + 1 for QU)

## Pass 2 — 2026-09-26
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 4, minor 23, decision-needed 1  |  Dropped in triage: 4
### Applied
- [major] R-84 — game record lacks the committed moves the per-game statistics need → record holds `moves`; history persisted with its own version
- [major] §2/R-71/R-72 — "the draft" undefined in Idle, so Redo from Idle and a drop over a stale record were unspecified → pending draft defined; drop replaces `moves[cursor.index]` and truncates; invariant on `reached`
- [major] R-71/R-38/R-60 — player Validate on an unedited draft with `reached ≥ place`: keep or recompute target/order? → every player advance discards all redo data and recomputes defaults; only Redo reuses stored later-phase data
- [major] R-31 vs §7.2 — tap on the current top of D: no-op in R-31, k − 1 in §7.2 → full gesture stated in R-31, §7.2 refers to it
- [minor] ×23: `gaveUp: boolean` stored, `status` derived; R-37 closed range 3–23; "in progress" defined, Replay = fresh Session; undoable finish = most recent record; Replay in §7.6; WordCellNumber and 1-based columns; unknown-version outcome; R-83 exact fractions of 520; R-70 gaveUp precedence; "edit" defined; R-30 example k = 3; R-60 commit vs Confirm; `reached` comment; card moves / letters used; timer lives in app shell; activeMs flush points; §7.7 empty-column slot; `freeLetters` denormalised; R-39 drag-in-Composing and Place inertness; §7.1 same-column tap; R-65 gesture-neutral; non-drag alternative for M to UX; R-02 algorithm frozen, version bump
### Decision needed
- R-21/R-22/R-31 vs Q-12 — whole-column self-drop yields k = 0 without a column having been emptied first; legal? — proposed default: yes, R-21/R-31 as written; R-22 gains "including the source column when S is the whole column" (Q-30)
### Dropped
- R-13 "drop the rationale until Q-27 is answered" — Q-27 is pending with the owner; rationale already flagged in pass 1
- CLAUDE.md rule 2 shape mismatch — CLAUDE.md is not the target; reported to the owner instead
- R-02 name the PRNG (again) — architecture-spine concern; applied only "frozen once shipped, version bump"
- Duplicates of R-84, Idle draft, Validate-after-undo, R-31/§7.2, status stored/derived, version rejection, in-progress definition (kept the clearest wording of each)

## Pass 3 — 2026-09-26
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 6, minor 18, decision-needed 0  |  Dropped in triage: 3
### Applied
- [major] §2 replay / R-37 / R-38 — replay validation scope and dictionary-on-replay unspecified → replay checks every structural rule and aborts the load like an unknown version; dictionary consulted only at Validate; committed words trusted; dictionary changes never bump the version
- [major] §2 version — unreadable score history "kept when readable" → mirrored the Session rule: message, never overwritten silently, statistics unavailable until explicit reset
- [major] R-84 vs R-02 — history records replayed from seed + moves break after a PRNG change → records are self-contained (version, seed, word strings, score, outcome, duration, counters) and never replayed
- [major] R-83 vs R-80 — `max` undefined; thresholds readable as absolute BGA scores → max = Σ letterCount × 10 defined in R-80; integer test `finalScore × 520 ≥ threshold × max`; English thresholds listed
- [major] R-75 — tableau not declared inert after give-up/win → only Undo, New game, Replay, view WordCell available while status ≠ playing
- [major] R-39 vs R-65 — inert WordCells in Composing/Place forbade the view gesture → "and viewing (R-65)" carve-out
- [minor] ×18: validation failure added to save triggers; Session + history written in one task; "finalise the move" removed; "Pending draft" vocabulary; k defined at first use; plus/minus clamp; R-71 redundant clause removed; §8 col2 duplicate X fixed; zero-word record figures; tap on used WordCell no-op; R-14 tap-on-other-column = drop; `reached` comment; `freeLetters` check spelled out; seed generated by app shell; word length = letter count, tie-break; preferences stored separately; (UI) tags with test-layer rule; Session extends CLAUDE.md model sentence; card art deferred to UX
### Decision needed
- none new
### Dropped
- R-71 "Validate on an unchanged draft should act as Redo" — contradicts Q-09/Q-25(b) as written (any phase-advancing action discards the redo tail); already decided
- "Dictionary on replay is product intent" — resolved by R-38 (validation only at Validate); applied as the major above, noted for the owner
- Duplicates of the history-unreadable, R-39/R-65, plus/minus and word-length findings

## Pass 4 — 2026-09-26
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 5, minor 16, decision-needed 3  |  Dropped in triage: 2
### Applied
- [major] §2 replay — pass-3 validation list applied R-36/R-40/R-50 to a Composing draft, rejecting legal saves → draft validated only up to its `reached` phase
- [major] §2 replay / R-73 — redo tail not validated on load → every element of `moves` validated in sequence
- [major] R-71 / R-38 — failed Validate discarded redo data → only a successful Validate advances; failed Validate keeps redo data; Redo into Place trusts stored validation
- [major] R-33 — "no-op … returned from the tray" read as self-contradictory → remove-free-letter command from the tray only
- [major] (UI) tag convention — R-42 tagged UI although the engine stores the default target; R-83 band arithmetic under a trailing tag; R-74/R-32/R-33/R-39 mixed → convention defined (id tag = whole rule, trailing tag = sentence), R-42 split, sentences tagged
- [minor] ×16: R-14 four extra clauses and §7.9 amended; R-14/R-65 phrased by engine command; F, M, Move, committed move, move history vs score history in §1; k defined in R-31; `reached ≥ 'place'` comment; R-84 committed-words range, un-finishing write, empty-history Undo, language card table; same-letter swap is an edit; no-ops are UI-level, engine throws; dictionary passed to Validate as data; first launch deals immediately; in-progress condition simplified
### Decision needed
- R-33/R-34 — insertion point of an added free letter in `arrangement` — proposed default: append at the right end of M, optional insertion index (Q-31)
- §2 vs CLAUDE.md rule 2 — Session extends `{seed, moves, undoIndex}` with gaveUp/activeMs/validationFailures — proposed default: confirm as written, update CLAUDE.md (Q-32)
- §2 / R-84 — game finishes while the score history is unreadable — proposed default: finish, record not written, end screen offers Reset history (Q-33)
### Dropped
- Duplicates of the replay-scope, failed-Validate, R-33 wording and tag-convention findings
- "R-33 free-letter insertion is a major" — reclassified decision-needed (game-feel, sibling of Q-26)

## Result — capped at 4 passes
Majors per pass: 10 → 4 → 6 → 5. No major repeated across passes; passes 3 and 4 found
consequences of earlier fixes (replay validation scope, the (UI) tag convention, the score-history
record shape) rather than the original gaps. Eight decision-needed rows (Q-26 … Q-33) await Jared.
Pre-loop copy: scratchpad review-loop/game-flow-spec.pass0.md; per-pass copies pass1 … pass4.

## Post-loop — 2026-09-26
Jared answered Q-26 … Q-33 (all defaults accepted; statistics trimmed to six figures). Folded:
R-23 new (Q-26); R-13, R-22, R-33, R-74, R-81, R-84, §2 rewritten; `validationFailures` removed;
§9 rows converted to answered decisions; CLAUDE.md rule 2 now cites §2. Spec v0.5.
