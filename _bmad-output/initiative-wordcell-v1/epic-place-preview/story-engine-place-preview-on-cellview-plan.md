---
title: 'Engine place preview on CellView'
type: 'feature'
ticket: '1'
created: '2026-10-28'
status: done
baseline_revision: '4528211309e40b507ce7af029c9aad6a8e1cd150'
route: 'full'
route_source: 'auto'
review: 'thorough'
review_source: 'auto'
lenses_ran: ['blind-hunter', 'edge-case-hunter', 'verification-gap', 'intent-alignment']
review_loop_iteration: 0
followup_review_recommended: false
context: ['{project-root}/_bmad-output/initiative-wordcell-v1/epic-place-preview/story-engine-place-preview-on-cellview.md']
warnings: ['oversized']
deferred: []
---

<intent-contract>

## Intent

**Problem:** In Place the engine gives the UI no committed-cell state, so the WordCell row cannot show each changed cell as it will be after Confirm (Q-49, epic E1).

**Approach:** `viewFrom` adds an optional `preview: { readonly top: CardId | null; readonly count: number }` to `CellView`, present exactly when phase = place and the cell is used or the target, taken from one `commitMove(position, placed(draft))` call on the committed-prefix position it already has.

## Boundaries & Constraints

**Always:** inline type on `CellView` (no new export from `src/engine/index.ts`, AD-2); key absent otherwise (as `kIfTapped`, AD-3); `count` = card count (array length), not R-85 letters; every other `CellView`/`GameView` field unchanged; engine purity (rule 1); test names start `Q-49 AD-3` (R-41 after the prefix: `Q-49 AD-3 R-41 …`).

**Never:** a second copy of the commit rule, a re-entrant `apply`/`view` inside `viewFrom`, any change to `rules.ts`, `commands.ts`, the Session, fixtures or the UI; no `undefined`-valued `preview` key.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Unused target | Place, target not used | target `preview` = {last of `placementOrder`, cards.length + placementOrder.length}, `used` false | none |
| Used target (R-41) | target is a free-letter cell | {last of `placementOrder`, cards.length − 1 + placementOrder.length}; only card used → count = placementOrder.length; `used` true | none |
| Used non-target | free-letter cell ≠ target | {card beneath, length − 1}; only card → {null, 0} | none |
| Unchanged cell / not Place | any other cell; Idle, Composing, won, gaveUp | `Object.hasOwn(cell, 'preview')` false | none |

</intent-contract>

## Code Map

- `src/engine/view.ts` — `CellView` (add field with doc comment citing AD-3, Q-49); `viewFrom` cells map: when `target !== undefined` (already implies phase = place and a draft), compute `const after = commitMove(position, placed(draft))` once before the map, and spread `preview: { top: after.cells[i].at(-1) ?? null, count: after.cells[i].length }` when `used || cell === target`. Import `commitMove` from `./rules`.
- `src/engine/rules.ts:307` `commitMove` — reuse, read-only.
- `src/engine/view.test.ts` — states at lines 68–112 (`FREE`, `PLACE_R41`, `COMPOSING_FROM_PLACE`, `COMMITTED`, `PLACE_FROM_IDLE`, `PLACE_L10`, `WON`, `GAVE_UP0/1`, `PENDING_TAIL`, `PENDING_COMMITTED`); `seam(start, commands, words)` line 32 with `viewFrom(start, session, LANG)` as in the R-86/AD-3 longest-word test (line 450); `cellOf`, `setTarget`, `CONFIRM`, `UNDO`, `REDO`; contract test line 995.
- `src/engine/test-helpers.ts` — `startOf(columns, cells)`, `play`, `drop`, `DICT`.
- `src/engine/serialize.test.ts:275` `parsed(fixture)` pattern — copy locally (`parseSession` from `./serialize`, `EN`), fixtures imported `with { type: 'json' }`.
- `fixtures/session-place*.json` — six Place fixtures; used/target: place (target 3, none used), compact (used 4, target 9, QU 35 in order), long (used 3, target 10), onto-committed (target 3, none used), free-letter-two-cards (used 4, target 5), free-letter-redo-tail (used 3 = target 3).

## Tasks & Acceptance

**Execution:**
- [x] `src/engine/view.ts` — add `preview` per Code Map — E1.
- [x] `src/engine/view.test.ts` — new `describe('GameView Q-49 place preview')` with the tests below; literal `top`/`count` numbers in every case test (read the pre-commit `cards` from the fixture/state, never from `commitMove`).
- [x] `src/engine/view.test.ts` — contract test (line 995): also loop each `gameView.cells` entry (and its `preview` when present) in the no-`undefined` check.

**Acceptance Criteria:**
- Given -onto-committed or -place (unused target), when viewed, then the target's `preview` has literal `top`/`count`, `used` false, `cards` the pre-commit list.
- Given -free-letter-redo-tail (used target with cards beneath) and a `startOf` position whose used target holds only its used card, when viewed, then `Q-49 AD-3 R-41` tests assert literal values, `used` true, `cards` pre-commit; only-card count = placementOrder length.
- Given -free-letter-two-cards (cell 4) and -compact, when viewed, then used non-target `preview` = {card beneath, length − 1} literally; given a `startOf` position with a used single-card non-target, when viewed, then {null, 0}; and two used cells, neither the target, each carry their preview.
- Given -compact, when viewed, then the target `count` is the card count, differing from the R-85 letter count of the same cards (QU 35 counts 2).
- Given -free-letter-two-cards, when `setTarget` to an unused legal cell, then the old target 5 loses `preview` and the new target's `top` = last of `placementOrder`; given -free-letter-redo-tail, when `setTarget` away from used cell 3, then 3 gets its used-cell preview (card beneath); given the `startOf` position, when `setTarget` away from a used target holding only its used card, then `top` null, count 0.
- Given any Place state, when `setPlacementOrder` reversed, then the target's `top` = the original first card of `placementOrder`, `count` unchanged, used cells' `preview` unchanged.
- Given unchanged cells in Place, `FRESH`, `FREE` (asserting cell 3 used without preview), `COMPOSING_FROM_PLACE` (same), `play(PLACE_R41, [UNDO, UNDO])` (Idle, reached = place), `PENDING_COMMITTED` and `PENDING_TAIL` (reached = committed), `WON`, `GAVE_UP0`, `GAVE_UP1`, when viewed, then `Object.hasOwn(cell, 'preview')` is false.
- Given each of the six fixtures parsed through `parseSession(JSON.stringify(fixture), EN)` asserted `ok`, plus `PLACE_R41`, `PLACE_FROM_IDLE`, `PLACE_L10` and `play(COMPOSING_FROM_PLACE, [REDO])`, and for each a variant per other legal target and a reversed `setPlacementOrder` (each applied separately to the base), when compared with `view()` after `confirm` (dictionary irrelevant: confirm needs none), then for every cell `preview` is present iff its `cards` differ, `top` = last card after (`?? null`), `count` = its length.
- Given the change, when `npm run test:all` runs, then it exits 0, including `src/architecture-ad2-ad12-ad17.test.ts` and `src/engine/index.test.ts` unchanged.

## Implementation Notes

- `viewFrom` computes `after = commitMove(position, placed(draft))` once when `target` is defined and spreads `preview` onto the cell entry only for `used || cell === target`; the key is otherwise absent.
- Tests: `describe('GameView Q-49 place preview')` in `src/engine/view.test.ts` (12 tests), placed after `GameView Place data`; fixtures imported `with { type: 'json' }` and parsed by a local `parsed` that asserts `ok`. The Design Notes only-card position (`startOf(['ABC'], { 3: 'D', 4: 'E' })`) spells `abcde`, placementOrder `[0, 3, 4, 6, 8]`, default target 5.
- Deviation (AC 5): -free-letter-redo-tail has L = 3, so 3 is its only legal target and `setTarget` away from used cell 3 is impossible. The setTarget-from-a-used-target-with-cards-beneath case uses -compact instead (`setTarget(4)` then `setTarget(5)`: cell 4 previews `{28, 2}`), the other cases as planned (-free-letter-two-cards unused target 5 → 3; only-card used target 3 → 5 gives `{null, 0}`).
- Mutation check: keying `preview` on the stored `targetCell` without the phase check fails the absence test (COMPOSING_FROM_PLACE).
- Verification: `npx vitest run src/engine/view.test.ts` 441 passed; `npm run test:all` exit 0 (3621 unit tests).

## Plan Change Log

## Review Triage Log

### 2026-10-28 — Review pass
- verdicts: 10 findings — high 0, medium 0, low 5, false 3, maybe-false 0
- findings:
  - `[low]` `[reject]` blind-hunter: the confirm property loop omits the `startOf` only-card position (the only `top: null` / only-card used target cases) — those cases are pinned by literal tests (AC 2, 3, 5); adding seam bases to the property adds test scaffolding for a path the literals already cover.
  - `[false]` `[reject]` blind-hunter: the property test checks `commitMove` against itself — true of the oracle by design (review-log minor "literal values"); every case test pins literal `top`/`count` read from pre-commit cards, so a `commitMove` defect fails them.
  - `[low]` `[patch]` blind-hunter: `onlyView` defaults a missing draft spelling to `''` — fixed: asserts `spelling` is `'abcde'` and throws when the draft is absent.
  - `[false]` `[reject]` blind-hunter: `placed(draft)` twice and a redundant `draft !== undefined` guard in `view.ts` — the guard is what narrows `draft` for TypeScript (`target !== undefined` does not), and `placed` is a type-narrowing cast with no cost.
  - `[low]` `[patch]` blind-hunter: `canAddFreeLetter` recomputes `hasFreeLetter` beside the new `used` local — fixed: `composing && !used && cellHasTop(position, cell)`.
  - `[low]` `[reject]` blind-hunter: plan change log / triage log empty, AC 5 deviation only in Implementation Notes — fix edits this build's plan; the change log is for bad_plan loopbacks and the triage log is this entry.
  - `[low]` `[patch]` blind-hunter: comment explaining the -compact choice and an unexplained `toHaveLength(8)` — the fixture comment is a test-setup reason, kept; fixed the assertion with a comment (cell 9 non-empty and unchanged, so cards alone give no preview).
  - `[false]` `[reject]` blind-hunter: `parsed` duplicates `serialize.test.ts`'s helper — the copies differ (`expect(ok)`, `deepFreeze`) and `test-helpers.ts` keeps only byte-identical, `expect`-free helpers (its header), so the local copy follows the rule.
  - `[low]` `[reject]` blind-hunter: the AD-3 contract loop never sees a `preview` with `top: null` — `null` is not `undefined` and survives `structuredClone`; covering it would add a seam state to `STATES`-based contract code for no reachable defect.
  - `[low]` `[reject]` edge-case-hunter: AC 5 names -free-letter-redo-tail but the test uses -compact — the AC is unreachable on that fixture (L = 3, one legal target); the deviation is recorded in Implementation Notes and the ticket only gives fixtures as examples; fix would edit this plan.
- verification-gap: no gaps. intent-alignment: descriptive only; implements the literal reading (used or target, cursor phase place, engine surface), with the present-iff-changed property covering the Q-49 reading; no divergence to triage.

## Design Notes

Only-card position: build with `startOf(columns, { 3: 'D', 4: 'E' })` (single-card cells), a whole-column self-drop `drop(1, n, 1)` (k = 0), `addFreeLetter` 3 and 4; read `viewFrom(start, seam(start, cmds), LANG).draft.word` once to learn the spelling, then `VALIDATE` with that word in the `seam` dictionary; view via `viewFrom(start, seam(start, …, [word]), LANG)`. Target 5 (if legal) gives two used non-target single-card cells ({null, 0}); `setTarget(3)` gives a used target holding only its used card; `setTarget` back away gives the old used target `top` null.

Review-log unapplied minors, resolved here: used-target wording (AC 1); every only-card case incl. setTarget from an only-card used target (AC 2, 5); `viewFrom(start, seam(…))` route (Design Notes); fixtures via `parseSession` (AC 8); used non-target `count` pinned (AC 3); Idle with reached = place via `play(PLACE_R41, [UNDO, UNDO])` (AC 7); `PLACE_FROM_IDLE`, `PLACE_L10`, redo from `COMPOSING_FROM_PLACE` (AC 8); reversed order assertions (AC 6); literal values (Tasks); contract loop over `cells` (Tasks); `Q-49 AD-3 R-41` naming (Boundaries). Not applied: "References add R-65" — the build never writes ticket files; R-65 is cited by Q-49 and covered via `cards` staying pre-commit (AC 1–2). The tickets.toml entry 1 sync is the caller's.

## Verification

**Commands:**
- `npm test -- src/engine/view.test.ts` — expected: all pass.
- `npm run test:all` — expected: exit 0.

## Auto Run Result

- **Change:** `CellView.preview?: { top: CardId | null; count: number }` (inline type, no new export), present exactly in Place on a used cell or the target, from one `commitMove(position, placed(draft))` in `viewFrom`; key absent otherwise (Q-49, AD-3, E1).
- **Files:** `src/engine/view.ts` — the field and its computation; `canAddFreeLetter` reads the `used` local. `src/engine/view.test.ts` — `GameView Q-49 place preview` (12 tests, literal values, the six Place fixtures via `parseSession`, the `startOf` only-card position via `viewFrom(start, seam(…))`, the present-iff-changed-on-confirm property) and the AD-3 contract no-`undefined` loop over each `cells` entry and `preview`.
- **Review:** thorough (4 lenses), 10 findings: 3 low patched (spelling pin in `onlyView`, `!used` in `canAddFreeLetter`, comment on the cell-9 assertion); 0 deferred; 7 rejected (3 false, 4 low) with reasons in the triage log.
- **Follow-up review recommended:** false — patched: high 0, medium 0, low 3.
- **Verification:** `npx vitest run src/engine/view.test.ts` 441 passed; `npm run test:all` exit 0 before and after the patches (unit, check, lint, build, dist, dev-server e2e 1097 passed, pwa 17 passed).
- **Review-log minors:** eleven resolved in the plan and tests (Design Notes list); "References add R-65" not applied — the build never writes ticket files; R-65 is covered by `cards` staying the pre-commit list. tickets.toml entry 1 sync (review-log pass-2 note) left to the caller.
- **Residual risk:** none known; no UI reads `preview` yet (entry 2).
