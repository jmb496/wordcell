---
title: 'Draft wordCards and the Composing tray'
type: 'feature'
ticket: '1'
created: '2026-10-08'
status: 'built'
route: 'full'
route_source: 'auto'
baseline_revision: '64ea5a4dd3cfb482d24156ef0909ba61d8acb6ac'
review: 'thorough'
review_source: 'auto'
lenses_ran: ['blind-hunter', 'edge-case-hunter', 'verification-gap', 'intent-alignment']
review_loop_iteration: 0
followup_review_recommended: true
context:
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-tray-and-place/story-draft-wordcards-and-the-composing-tray.md'
  - '{project-root}/_bmad-output/specs/spec-epic-5-tray/build-notes.md'
  - '{project-root}/_bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/DESIGN.md'
warnings: ['oversized']
deferred:
  - summary: 'Ticket Notes hand-off edits to tickets.toml entries 2 and 3 not made: the build workflow never writes ticket files. Append to entry 2 `tests`: "R-36 QU = 2, R-37 QU uppercase word line and R-30 QU letter order (P5 supp.) on session-place-compact after one Undo"; to entry 3 `tests`: "R-30 side-left word line and tile order after ⇄ Flip (P5 supp.)".'
    evidence: 'story Notes bullet 2; bmad-build-auto step-01 "Never write to a ticket file"'
    severity: 'minor'
---

<intent-contract>

## Intent

**Problem:** The tray is still epic 4's static F2 tray: no word line, no origin tags, no letter count, and the engine view gives no word-ordered card list to draw the word from (AD-3).

**Approach:** Add `draft.wordCards` to the engine view, then split `Tray.svelte` into a phase switch over `tray/WordLine.svelte`, `tray/TileRows.svelte` and `tray/ControlRow.svelte`, with pure helpers `layout/fit.ts` (font fit) and `tray/tags.ts` (origin-tag lookup), plus the A9 4.3-m3 keys and the 4.3-m4 badge fix. The story file (context) is the full contract; this plan resolves its open review items.

## Boundaries & Constraints

**Always:** Engine change only `wordCards` in `DraftView` (`view.ts` `draftData` from `word()`'s `cards`); no new export from `src/engine/index.ts`; `deal.ts` and R-02 literals untouched. UI reads only `GameView` plus `game.feedback` (AD-3); the word line iterates `draft.wordCards` through `faces`, never tray order. Every catalogue string in `text.ts`. Tests named by id (R-/AD-) per AGENTS.md. Mirrors carry `data-mirror-of` only; 52 live `[data-card-id]` in every phase (AD-14). Fail fast: the tag lookup throws a plain `Error` (rule 6).

**Never:** Place word line, strip tags, meta, compact marks (entry 2); D-block controls or Validate states (entry 3); tile interaction; a DOM clone for measuring; asserting a text-dependent px size in e2e (epic 4 F11); editing tickets.toml or the story file; pushing.

## I/O & Edge-Case Matrix

Seed 1 literals (card → letter from `src/engine/lang/en.ts` deck order).

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|---|---|---|---|
| Composing right k=1 | `session-composing` | word line `TAN`, N (28) underlined; tray ids `42, 0, 28m`; `3 letters`; no tag; control-row left slot empty | — |
| Free letter | `session-place-free-letter-redo-tail` + Undo | word `ONE`, E (9) underlined; tray `32, 28, 9m`; tag `3` on tile `card-28` only; cell 3 top a `used` mirror; `3 letters` | — |
| k=2 block | same fixture + Redo, Redo | word `MAN`, A (1) and N (27) underlined; tray `26, 1m, 27m`; one `.block.start` (1m), one `.block.end` (27m), both faces' border colour `--wc-destination`; exactly one `.lock` in the tray band | — |
| Place | `session-place`; the redo-tail fixture as seeded | strip as F2 (`42, 0, 28` / `9, 32, 28`), no word line, tag, count | — |
| Invalid word | `session-composing`, word list stubbed `cat\ndog\n`, Validate | invalid line replaces word line; text element textContent exactly `TAN isn't in the word list.` | — |
| Idle / Game over | `session-idle-pending-draft`, `session-won`, `session-gave-up` | word line, tiles and control row empty | — |
| Tag miss | `cells` lacks the cell, or its `cards` empty | throws `Error` naming the cell | fail fast |
| wordCards k=0 | draft with destinationCount 0 | `wordCards` = arrangement | — |

</intent-contract>

## Code Map

- `src/engine/view.ts` -- `DraftView` (add `wordCards`, doc: R-30 word order); `draftData` already calls `word()`; set `wordCards: [...cards]` in `view.draft`.
- `src/engine/view.test.ts` -- AD-3 `toStrictEqual` draft literals at ~220/233 gain `wordCards`; existing R-30 test ~250; `QU_TOP`, `play`, `drop` helpers (`test-helpers.ts`, `drop(sourceColumn, sourceCount, destinationColumn)`).
- `src/ui/Tray.svelte` -- F2 static tray to rewrite as the switch (`view.place`, then `view.draft`, else empty); keep `data-band="tray"`, `.word-line` wrapper, height prop, `trayLayout`/`trayOrder` (`src/ui/layout/tray.ts`), the `${tile.id}-${tile.mirror}` key and `segment()`.
- `src/ui/Card.svelte` -- add an origin `tag?: number` prop (card-mode bottom band, left, 11 px card-badge); fix `.block .badge` so its right edge sits at wrapper x + tileWidth on every block tile (as built only `.block.end` does; start/middle are at + 5).
- `src/ui/Column.svelte:82`, `src/ui/WordCellRow.svelte:53` -- `{#each}` keyed by `CardId` alone; key `${id}-${kind}` with kind `ghost`/`used` or `live`.
- `src/ui/text.ts` -- `invalidWord`; add `letters(n)`, `invalidWordSuffix`, `invalidWordParts(w)`.
- `src/architecture-ad1.test.ts:1277` -- `LAYOUT_PURE` list (add `src/ui/layout/fit.ts`) and its test name.
- `e2e/board-phases.spec.ts` -- private `trayOrder()` reader, `STATES` literals (must stay green), F2 header comment.
- `e2e/dictionary.spec.ts:79-110` -- R-38 locator: exact text, `.word-line` scope, error colour, `✕` as preceding sibling.
- `e2e/board.screens.spec.ts` -- baselines for idle/composing/place/game-over on android and desktop.
- Consumers of `data-card-id`/`data-mirror-of` (remount check): `src/ui/gestures/controller.ts` (drop, fly-back element refs), `e2e/{blocking,board-phases,board.screens,board,column-phases,drag-interruptions,drag,helpers,layout,smoke,tap,wordcell-view}.spec.ts`, `e2e/pwa/dist-smoke.spec.ts`, `e2e/helpers/board.ts`. FLIP (AD-14) does not exist yet (entry 10).

## Tasks & Acceptance

**Execution:**
- [x] `src/engine/view.ts`, `view.test.ts` -- add `wordCards`; `R-30` cases: side left, side right (D reversed), a `QU` card (35) with `qu` spelling and `QU` = 2, Place keeps word order after `setPlacementOrder` to a non-word order, k = 0; update the AD-3 literals.
- [x] `src/ui/text.ts`, `text.test.ts` -- `letters(n)` (`1 letter`, `n letters`); `invalidWordSuffix` (no leading space); `invalidWordParts(w)` → `[W, suffix]` (uppercasing stays here); `invalidWord(w)` = `${W} ${suffix}`. `AD-3` tests: n = 1, n = 5, `W + ' ' + suffix === invalidWord(w)`.
- [x] `src/ui/layout/fit.ts` (+ `fit.test.ts`) -- `fitSize(measure, box, max, min = 14)` per story **Fit**; `AD-11` tests with a fake measure: fits at max, shrinks, floors at min, a max-16 case. Add to `LAYOUT_PURE`.
- [x] `src/ui/tray/tags.ts` (+ `tags.test.ts`) -- `originCard(cells, cell): CardId` by the `cell` field, `cards.at(-1)`, throws `Error(\`origin tag: no top card in WordCell ${cell}\`)` style fixed template on miss/empty; tests with a cell other than 3 and both throws (`AD-3`).
- [x] `src/ui/tray/WordLine.svelte` -- Composing word (letter-spaced serif, D ids underlined in `--wc-destination`, `QU` one unit) or the invalid line; Fit re-measure on mount, text change, band width change (ResizeObserver) and `document.fonts.ready`; `measure` sets a temporary class and inline size and restores both in `finally`.
- [x] `src/ui/tray/TileRows.svelte`, `ControlRow.svelte`, `Tray.svelte` -- tile grid moved from Tray (origin `tag` on free-letter tiles via `tags.ts`, Composing card mode only); control row: empty left slot, ui-label letter count right; Tray as the phase switch.
- [x] `src/ui/Card.svelte`, `Column.svelte`, `WordCellRow.svelte` -- tag prop, badge fix, keys.
- [x] `e2e/helpers/board.ts`, `e2e/helpers.spec.ts`, `e2e/board-phases.spec.ts` -- move `trayOrder` to helpers as `trayIds` with a helpers.spec case; board-phases imports it; header comment no longer says static tray.
- [x] `e2e/tray.spec.ts` (new, android) -- the matrix rows above, as literal sequences in DOM order; 52 `[data-card-id]` in each state, the two-Redo state included; tag locator scoped to `card-28`; word line has no overflow (`scrollWidth <= clientWidth`) and computed font-size within 14…20; `AD-14` remount: a handle to column 3's `[data-mirror-of="0"]` on session-composing is detached after Undo and `card-0` is live in column 3.
- [x] `e2e/dictionary.spec.ts` -- keep the R-38 locator passing (exact text, scope, colour, ✕ sibling); adjust only if markup forces it.
- [x] Screenshots -- `npm run test:screens -- --update-snapshots` once in the container, name each changed baseline in Implementation Notes, then plain `npm run test:screens`.

**Acceptance Criteria:**
- Given any matrix state, when the page settles, then the tray shows exactly the listed word, underline, ids, tag and count, and 52 live card elements.
- Given a failed Validate, when the invalid line renders, then a visible space separates word and suffix and the text element's textContent equals `invalidWord('tan')`.
- Given the ×2 badge scratch Session (Design Notes), when rendered on android, then the `35` mirror's badge right edge equals its wrapper x + tileWidth and `QU` is underlined as one unit; values recorded in Implementation Notes.
- Given `npm run test:all` and `npm run test:screens`, when run, then both pass.

## Design Notes

**Invalid line (review-log open major).** Svelte 5 trims a literal space at tag edges, so the space span must hold `{' '}` and the three spans must touch with no markup whitespace:
```svelte
<p class="invalid"><svg aria-hidden="true">…</svg><span class="text"><span class="word">{parts[0]}</span><span class="space">{' '}</span><span class="suffix">{parts[1]}</span></span></p>
```
`.text` is flex, `.word` min-width 0 + ellipsis, `.space` `white-space: pre`, `.suffix` flex none. Verify by textContent in e2e.

**×2 badge scratch Session** (not a fixture, seeded in the browser check only): seed 1, column 3 is `23 L, 35 QU, 8 E, 21 J, 2 A, 42 T, 0 A`; one move `{sourceColumn 3, sourceCount 4, destinationColumn 3, destinationCount 3, destinationSide 'left', freeLetters [], arrangement [21,2,42,0], reached 'composing'}`, cursor `{index 0, phase 'composing'}`. Block `23m 35m 8m` puts QU on a non-end tile; word line `LQUEJATA` with `LQUE` underlined.

**Review-log minors** all land here: badge non-end tile and underline (scratch Session), remount case, `LAYOUT_PURE`, border colour, `invalidWordParts`, k = 0 case, Code Map interface list, `finally` restore, consumers list, literal sequences, dictionary locator kept, k = 2 52-count, scoped tag locator, AD-3 literals, trayIds = `wordCards` (e2e: tray order equals word line letters). The 20 px claim: record the computed word-line font-size on android and desktop.

## Verification

**Commands:**
- `npm run test:all` -- expected: all green.
- `npm run test:screens` (Docker) -- expected: green after a single `-- --update-snapshots` run.

## Implementation Notes

- Engine: `DraftView.wordCards` from `draftData`'s `word()` cards; R-30 tests in `view.test.ts` (left with QU 35, `qu` spelling and letterCount 8; right reversed; k = 0 on K0_SELF and K0_EMPTY; Place after `setPlacementOrder [8,21,2,42,0,35]` keeps `[35,8,21,2,42,0]`); AD-3 literals gained `wordCards`.
- UI: `src/ui/Tray.svelte` (phase switch, tag map per render via `tray/tags.ts`), `src/ui/tray/{WordLine,TileRows,ControlRow}.svelte`, `src/ui/tray/tags.ts`, `src/ui/layout/fit.ts` (added to `LAYOUT_PURE`). WordLine letters carry `data-word-card` (not `data-card-id`), class `d` for D underline. The Fit routine is named `refit` (Biome's noFocusedTests flags a call named `fit`). Fit's invalid-line box subtracts 22 px (16 px ✕ + 6 px gap).
- Keys (A9 4.3-m3): Column `${id}-${ghost|live}`, WordCellRow `${id}-${used|live}`; the e2e AD-14 remount case proves a ghost handle detaches after Undo.
- Badge (A9 4.3-m4): `.block:not(.end) .badge { right: 5px }`.
- e2e: `trayIds` in `e2e/helpers/board.ts` (+ helpers.spec case), board-phases imports it (header comment and the AD-11 (F2) test name no longer say "static"); new `e2e/tray.spec.ts`; `e2e/dictionary.spec.ts` unchanged and green.
- ×2 badge scratch Session (Design Notes), browser check: android tileWidth 46, `35` mirror (class `block`, a middle tile) wrapper x 64, badge right 110 = 64 + 46, badge 18 × 12; desktop tileWidth 44, wrapper x 512.5, badge right 556.5 = 512.5 + 44. Word line `LQUEJATA`, `L`, `QU` (one span), `E` underlined.
- Word-line computed font size on session-composing (`TAN`) and the scratch Session: 20px on android and on desktop.
- Screenshots: the first `--update-snapshots` run rewrote nothing (the composing change is under `maxDiffPixelRatio: 0.01`), so `--update-snapshots=all -g composing` regenerated `board-composing-android-linux.png` and `board-composing-desktop-linux.png` (the only renders that changed); idle, place and game-over unchanged. Then plain `npm run test:screens`: 8 passed.
- Verification: `npm run test:all` green (unit 2075, e2e dev 384 passed / 340 skipped, dist-smoke 14, pwa 12); `npm run test:screens` green.

## Plan Change Log

## Review Triage Log

### 2026-10-08 — Review pass
- verdicts: 25 findings — high 0, medium 7, low 7, false 9, maybe-false 2
- findings:
  - `[medium]` `[patch]` blind: invalid line never shrinks below 16 px (measured `.text` is a shrinkable flex item) — confirmed by reading `.invalid .text` (min-width 0, flex-shrink 1) and the measuring rule; fixed: `flex: none` in `.text:global(.wc-measuring)`.
  - `[medium]` `[patch]` blind: no e2e makes Fit shrink — TAN fits at 20; fixed: two AD-11 android cases narrowing `.word-line` (word < 20 ≥ 14; invalid < 16 ≥ 14, suffix whole, textContent kept).
  - `[medium]` `[patch]` blind: WordCellRow live ↔ used key has no remount test — fixed: AD-14 handle-detached case on cell 3 (redo-tail + Undo, Undo).
  - `[low]` `[patch]` blind: badge fix and QU underline only checked by hand — fixed: android case seeding the Design Notes scratch Session inline via `seedStorage`, badge right = wrapper left + tileWidth, one `QU` span with `d`.
  - `[false]` `[reject]` blind: plan lacks a sentence → test mapping — fix is editing this build's plan; the story's Tests line and test names carry the mapping.
  - `[false]` `[reject]` blind: deferred hand-off and empty logs — logs are filled at review by design; the tickets.toml hand-off is deferred because the workflow forbids writing ticket files.
  - `[low]` `[reject]` blind: screenshot tolerance (1 %) cannot see the word line — pre-existing `maxDiffPixelRatio`; the composing baselines were regenerated and the e2e asserts the content.
  - `[false]` `[reject]` blind: Idle pending-word line pinned empty — the intent says Idle tray rows are empty (pending-draft line is epic 6, epic Boundaries).
  - `[low]` `[reject]` blind: tag placement and flourish suppression untested — cosmetic; adding geometry assertions is new test surface for a static CSS rule.
  - `[low]` `[patch]` blind: Place test opens a second page sharing localStorage — fixed: one test per fixture, no second live page.
  - `[medium]` `[patch]` edge: invalid-line measure capped (duplicate of the first row) — same fix.
  - `[low]` `[patch]` edge: `bind:this` resets to null, `=== undefined` guard misses it — fixed: typed `| null` and `== null`.
  - `[false]` `[reject]` edge: `fitSize` with max < min — both callers pass constants 20/16 ≥ 14; unreachable.
  - `[false]` `[reject]` edge: invalid line lost outside Composing — `rejectedWord` is set only by a Composing validate and clears on any changed dispatch (AD-4, `game.svelte.ts:169`).
  - `[medium]` `[patch]` edge: comment claims a 16 → 14 shrink the code could not do (duplicate of the first row) — same fix.
  - `[medium]` `[patch]` verification-gap: WordCellRow remount not verified (duplicate) — same fix as row 3.
  - `[low]` `[patch]` verification-gap: badge position on non-end block tiles manual only (duplicate) — same fix as row 4.
  - `[medium]` `[patch]` verification-gap: Fit shrink never exercised end to end (duplicate) — same fix as row 2.
  - `[maybe-false]` `[patch]` intent: invalid line cannot shrink 16 → 14 (unconfirmed in browser by the lens; confirmed by the duplicate rows) — same fix as row 1.
  - `[low]` `[patch]` intent: R-36/R-37 V coverage under an R-30-only test name — fixed: test renamed `R-30 R-36 R-37 wordCards: …`.
  - `[false]` `[reject]` intent: R-32 per-row segments exercised on one row only — the intent names the k = 2 single-row fixture; the row break is entry 2's (story Tests, epic tickets.toml entry 2).
  - `[false]` `[reject]` intent: ×2 badge and 20 px record not automated — badge now automated (row 4); the 20 px record is a sanctioned plan note (story Notes).
  - `[false]` `[reject]` intent: tickets.toml hand-off not done — already deferred in frontmatter with the exact text.
  - `[false]` `[reject]` intent: invalid line only in Composing — matches the intent ("replacing it while…").
  - `[maybe-false]` `[reject]` intent: ResizeObserver watches the line, not the band — the line is the band's full inner width (`width: 100%`), so they change together; only `low` if true.

## Auto Run Result

- **Summary:** `DraftView.wordCards` (R-30 word order) added in the engine view; the F2 static tray replaced by `Tray.svelte` switching on `place`, then `draft`, else empty, over `tray/WordLine.svelte` (word line with D underline and `QU` as one unit, measured Fit 20 → 14, the R-38 invalid line as word / `{' '}` / suffix spans per the review log's open major), `tray/TileRows.svelte` (tiles, D-block segments, card-mode origin tags) and `tray/ControlRow.svelte` (empty left slot, `letters(n)` count); pure `layout/fit.ts` and `tray/tags.ts`; A9 4.3-m3 keys in Column and WordCellRow; A9 4.3-m4 badge fix. Every review-log unapplied minor is resolved in Design Notes and the code/tests (see Implementation Notes).
- **Files:** `src/engine/view.ts` (wordCards), `src/engine/view.test.ts` (R-30/R-36/R-37 cases, AD-3 literals), `src/ui/text.ts`/`text.test.ts` (letters, invalid-word split), `src/ui/layout/fit.ts`/`fit.test.ts` (fitSize), `src/ui/tray/tags.ts`/`tags.test.ts` (originCard), `src/ui/tray/WordLine.svelte`, `TileRows.svelte`, `ControlRow.svelte` (new parts), `src/ui/Tray.svelte` (phase switch), `src/ui/Card.svelte` (tag prop, badge fix), `src/ui/Column.svelte`, `src/ui/WordCellRow.svelte` (keys), `src/architecture-ad1.test.ts` (LAYOUT_PURE), `e2e/tray.spec.ts` (new), `e2e/helpers/board.ts`, `e2e/helpers.spec.ts` (trayIds), `e2e/board-phases.spec.ts` (uses trayIds), two composing screenshot baselines.
- **Review:** 25 findings; 7 entries patched (medium 3: invalid-line measure, Fit e2e, WordCellRow remount; low 4: badge e2e, second page, null bind guard, R-36/R-37 test name); 0 deferred from review (the pre-existing `deferred` item is the tickets.toml hand-off); rejected: plan sentence map (plan edit), logs/hand-off (by design), screenshot tolerance (pre-existing), Idle line (intent), tag geometry (cosmetic), fitSize max < min (unreachable), invalid line outside Composing (unreachable), R-32 row break (entry 2), automation of the 20 px record (sanctioned note), Composing-only invalid line (matches intent), ResizeObserver target (equivalent).
- **Follow-up review recommended: true** — three medium entries were patched after the first pass; the specific unverified risk is the WordLine refit lifecycle (invalid ↔ word branch switch with `bind:this` null, `document.fonts.ready`, real band-width changes) which e2e reaches only by narrowing `.word-line` inline, not by a real long word or viewport change.
- **Verification:** `npm run test:all` green before and after the patches (lint, check, unit, build with size budget, e2e dev, dist-smoke, pwa); `npm run test:screens` green (8 passed) after the patches; ×2 badge and 20 px word-line size recorded in Implementation Notes.
- **Residual risks:** tickets.toml hand-off (entries 2 and 3 tests lines) still to apply by the orchestrator/owner (frontmatter `deferred`); screenshot `maxDiffPixelRatio` 1 % hides small tray changes; unit suite measured 6.2 s on `/mnt/d` only (the 5 s budget is for a Linux-filesystem checkout, not measured).
