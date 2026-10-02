---
title: 'Board render in Idle and Game over with bars (tracer bullet)'
type: 'feature'
ticket: '2'
created: '2026-10-02'
status: 'built'
baseline_revision: '17cfcad2819b899ee52e43e5ac17b3314f038f2c'
route: 'full'
route_source: 'auto'
review: 'thorough'
review_source: 'auto'
lenses_ran: ['blind-hunter', 'edge-case-hunter', 'verification-gap', 'intent-alignment']
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-board-and-gestures/story-board-render-in-idle-and-game-over-with-bars.md'
  - '{project-root}/_bmad-output/specs/spec-epic-4-board/build-notes.md'
  - '{project-root}/_bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/DESIGN.md'
warnings: ['oversized']
deferred:
  - summary: 'Review-log minor: count badge 1/2 boundary. No fixture has a WordCell with exactly 1 or 2 cards (every committed word puts 3+ cards in a cell; session-won cells hold 24/21/7, redo-tail 3). Covering it needs a new scripted fixture, so it goes to entry 3, which already scripts fixtures and owns the used/target tests. Here the badge is asserted at 3+ and as absent on an empty cell.'
    severity: minor
  - summary: 'Review-log minor (entry 4): the banner sticky offset `top: calc(44px + env(safe-area-inset-top))` names the top bar''s height, a DESIGN-prescribed exception to F22 (no component names a neighbour band). Entry 4''s live layout should derive it from the bands() result or record the exception.'
    severity: minor
  - summary: 'Ticket wording (not written by builds): the Placeholder paragraph''s foot column-number sentence belongs with the foot-<n> clause in Bands. The WordCellRow sentence about card-0 waits switched to toBeAttached on session-place-free-letter-redo-tail matches no existing wait (audited: no card-0 visibility wait runs on that fixture), so no wait is switched.'
    severity: minor
---

<intent-contract>

## Intent

**Problem:** The epic 3 minimal board in `src/ui/App.svelte` must give way to the real Board laid out by AD-11 geometry, the tracer bullet from `GameView` → `geometry.ts` → `Board.svelte` over `BAND_ORDER` → DOM, with the bars, F26 card structure and F4 locator moves the later gesture entries build on.

**Approach:** Add `Board`, `Column`, `Card`, `WordCellRow`, `TopBar`, `ActionBar` (plus `text.score`, a shared New game function) exactly as the ticket Description and ACs specify; App's active branch renders Board; move epic 3's locators per F4/WordCellRow; add the ticket's Playwright tests; delete the placeholder screenshot spec.

## Boundaries & Constraints

**Always:** The ticket (Description, Interface, Mount inputs, App, Composing and Place, Bands, Board, Placeholder, Card, WordCellRow, TopBar, h1, F4, Screens, ACs) is the contract; this plan only adds what it leaves open. Components read `game.view` and dispatch via `game.dispatch` (AD-3, AD-4); UI imports from `src/engine/index.ts` are `import type` only; no component re-derives legality, score or enablement. Geometry only from `src/ui/layout/geometry.ts` (`cardWidth`, `cardMetrics`, `bands`) and `bands.ts` (`BAND_ORDER`), read once at mount. Messages only via `text.ts`. `data-testid` only for `column-<n>`, `foot-<n>`, `wordcell-<n>`, `card-<id>`, `primary-action`, `undo`, `redo`. Test names start with the id (R-03, R-82, R-70/R-71, AD-14, AD-17, AD-11). Expected values are the literals below (computed from the engine at planning); a mismatch is rechecked, then reported, never edited to pass. R-02 golden deal untouched.

**Never:** No engine, shell, `main.ts` or fixture change. No tray tiles, ghosts, mirrors, used/target Playwright tests or `board.screens.spec.ts` (entry 3); no live layout, insets probe, gate, `?bands=`, `pan-y` regions (entry 4); no menu (epic 6). No fallback/defensive code (rule 6). No commits beyond the workflow's own.

## I/O & Edge-Case Matrix

Fixture facts (engine, `view(parseSession(...))`): `session-idle-fresh` columns top→bottom: 1 `L D X O M I W`, 2 `T N P D V I M`, 3 `L QU E J A T A`, 4 `E K G H H I O`, 5 `T S C F S Z`, 6 `O P N A E N`, 7 `Y E U R H F`, 8 `S B R R C U`; all cells empty; score 0; Undo/Redo disabled. `session-won`: all columns empty; cells 6/7/8 hold 24/21/7; score 355; Undo on, Redo off. `session-gave-up`: idle-fresh columns, cells empty, score −530, Undo on, Redo off. `session-place`: score 0. `session-place-free-letter-redo-tail`: Place, score 9, cell 3 = [42, 0, 28] bottom→top, Undo and Redo on.

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| R-03 letters | idle-fresh, android | each column's `.glyph` texts uppercased equal the lists above (`Qu` → `QU`) | — |
| F11 geometry | idle-fresh, android 412 × 839 | `.face` 46 × 61; column-<n> width 50; column-8 right − column-1 left 400; adjacent card-wrapper top distance 44; Σ [data-band] heights = 839 and `scrollHeight` = `innerHeight` | — |
| Placeholder | idle-fresh / session-won | 0 visible placeholders / all 8 visible | — |
| Count badge | session-won | `.count` in wordcell-6/7/8 reads 24/21/7; none in wordcell-3 | — |
| Score | idle-fresh, place, won, gave-up | `Score 0`, `Score 0`, `Score 355`, `Score −530` (U+2212) | — |
| Redo across commit | redo-tail | `Score 9`; Redo ×4 → 15, 15, 15, 24 | — |
| Enablement | idle-fresh; redo-tail; won; gave-up | off/off; on/on then Redo off after Redo to the tail's end; on/off; on/off | — |
| Non-top cell cards | redo-tail | card-28 visible, card-42 and card-0 hidden (attached, `data-place="cell"`) | — |

</intent-contract>

## Code Map

- `src/ui/App.svelte` -- keep halted/rejected roots and HistoryNotice beside the board; active branch renders `<Board />` inside the `inert={overlays.isOpen('historyNotice')}` root; primary-action logic, undo/redo/validate/confirm handlers move out; rejected root's New game calls the shared function.
- `src/ui/layout/bands.ts`, `geometry.ts` -- read-only; `cardWidth(clientWidth, innerHeight, insets, hoverFine)`, `cardMetrics(w)` → `{H, strip, slot, board}`, `bands(w, BAND_ORDER, 1, false, innerHeight, {top:0,bottom:0}).heights`.
- `src/ui/DictionaryBanner.svelte` -- reuse inside the banner band; drop its `margin` so it is exactly 44 px; sticky offset per ticket.
- `src/ui/text.ts`, `text.test.ts` -- add `score(n)`; existing strings `undo`, `redo`, `newGame`, `invalidWord`.
- `src/ui/overlays.svelte.ts`, `history-notice.svelte.ts` -- read-only; New game sequence `wasRejected → game.newGame() → overlays.resetForNewSession() → if wasRejected openHistoryNotice()`.
- `src/ui/app.css` -- tokens; add `.sr-only` here or in Board.
- `e2e/smoke.spec.ts` -- `:34` Seed read → `current().session.seed`; `:27` column-1 `toHaveText` dropped (R-03 covers letters); 'AD-17 minimal board …' renamed (drop 'minimal'); 'AD-17 WordCell cards render bottom → top' y-order (`:49–65`) becomes the visible/hidden check.
- `e2e/blocking.spec.ts:328` -- Seed read → `current().session.seed` (test hook in `e2e/globals.d.ts`).
- `e2e/app-shell.spec.ts:98–103` -- background on `.face`, colour on `.glyph`, same values.
- `e2e/pwa/font.spec.ts:86–102` -- family/weight on `.glyph`; `/^Seed \d+/` sample → the top-bar Score text; title drops 'placeholder'.
- `e2e/dictionary.spec.ts:91–97` -- locates the invalid line by text, needs the aria-hidden svg as the span's preceding sibling and `--wc-error` colour: keep that markup.
- `e2e/placeholder.screens.spec.ts` + `e2e/placeholder.screens.spec.ts-snapshots/` -- delete; `package.json` `test:screens:run` gains `--pass-with-no-tests`.
- Heading waits (`smoke:9`, `test-hook:7`, `game-store:252`, `helpers/restore.ts:58`, `pwa/dist-smoke:17`, `pwa/test-hook:7`) and the 37 card-0 `toBeVisible` waits stay unchanged: audited, card 0 is never a non-top cell card on their fixtures.

## Tasks & Acceptance

**Execution:**
- [x] `src/ui/text.ts`, `src/ui/text.test.ts` -- `score(n)`: `Score <n>`, negatives with U+2212; `AD-…` Vitest cases for 0, 355, −530.
- [x] `src/ui/new-game.ts` -- the shared New game sequence (review-log minor) used by App's rejected root and ActionBar.
- [x] `src/ui/Board.svelte` -- mount inputs per ticket read once in script; iterate `BAND_ORDER`: units `['columns','footRow']` and `['labels','wordcells']` each one CSS grid wrapper with `grid-template-columns: repeat(8, <slot>px)` (review-log minor), rows from `heights`, its empty `[data-band]` row elements first, spanning `1 / -1`, `pointer-events: none`; column-<n> at grid column n spanning both rows; wordcell-<n> and its label at grid column n − 2; every other band a direct root child with `data-band`. Root full viewport width, `min-height: 100dvh`; board width `board` px centred; bars, banner and tray band at board width. Tray band (reserved height) holds the invalid-word line in its word-line position. Visually hidden h1 `WordCell` (1 × 1 px clipped).
- [x] `src/ui/Column.svelte` -- column-<n> (`data-column`), card wrappers top→bottom at strip pitch, placeholder (absolute in the top slot, DESIGN dashed outline, `visibility: hidden` unless the column is empty, no `data-card-id`), foot-<n> (`data-foot`) in the footRow track with the desktop column-number span (`display: none` outside `@media (hover: hover) and (pointer: fine)`).
- [x] `src/ui/Card.svelte` -- wrapper (slot wide; strip tall or H tall when `full`) with `data-card-id`, `data-testid`, `data-place`, `touch-action: none`, `user-select: none`; `.face` w × H, `pointer-events: none`, face/edge/radius; `.glyph` in the top 72 %, `QU` → `Qu`, font 0.56 w; flourish; QU ×2 badge (18 × 12, top-right of letter band) outside `.glyph`.
- [x] `src/ui/WordCellRow.svelte` -- labels 3–10; wordcell-<n> `role="group"`, `aria-label="WordCell <n>"`, `data-wordcell`, slot × H; every cell card a live `Card` (`place="cell"`, full) in DOM order bottom→top, stacked, non-top `visibility: hidden`; empty outline when empty; `.count` (inside wordcell-<n>, `pointer-events: none`, review-log minor) at 2+; used/legal/target/not-legal classes from `CellView` and `view.place` per DESIGN WordCell.
- [x] `src/ui/TopBar.svelte` -- sticky top, `padding-top: env(safe-area-inset-top)`, 44 px content: empty 44 px menu slot, Score (`text.score(view.displayScore)`, typography.score, `tabular-nums`), Undo/Redo icon buttons (epic 3 markup, `title` = `text.undo`/`text.redo`).
- [x] `src/ui/ActionBar.svelte` -- sticky bottom, `padding-bottom: env(safe-area-inset-bottom)`, 60 px content, 4 px side padding, 48 px primary-action; epic 3's label/enablement logic moved verbatim.
- [x] `src/ui/App.svelte` -- per Code Map.
- [x] `e2e/smoke.spec.ts`, `blocking.spec.ts`, `app-shell.spec.ts`, `pwa/font.spec.ts` -- locator moves per Code Map.
- [x] `e2e/board.spec.ts` (new) -- `R-03 …` (letters, matrix row 1, android); `AD-17 …` F11 geometry (android); `R-82 (UI) …` score literals and redo flow (no 'Redo disabled' here: R-70/R-71 owns it, review-log minor); `R-70/R-71 …` enablement; `AD-14 …` on idle-fresh, won, gave-up: 52 `[data-card-id]`, ids 0–51 once, column-<n> descendants all `data-place="column"` and wordcell-<n> descendants all `"cell"` (per-container, review-log minor), zero `[data-mirror-of]`; `AD-17 …` render rules (count badges, placeholders matrix row, foot-<n> innerText '1'..'8' desktop / '' android, title on desktop, Score `tabular-nums`, foot tops = `[data-band=footRow]` top on idle-fresh and won); `AD-11 bands render in BAND_ORDER (default)` against the literal flattened list.
- [x] delete `e2e/placeholder.screens.spec.ts` and its snapshot dir; `package.json` `test:screens:run` adds `--pass-with-no-tests`.

**Acceptance Criteria:**
- Given the change, when `npm run test:all` runs, then lint, check, unit (architecture scan included), build within budget, dist-smoke, e2e and pwa all pass.
- Given every matrix row, when its named Playwright test runs on the stated project, then it passes with the literal unchanged.
- Given session-idle-fresh on android, when the page loads, then the document does not scroll (`scrollHeight === innerHeight`).

## Implementation Notes

Review patch: the R-03 test moved from board.spec.ts into smoke.spec.ts as the ticket Description names; the Code Map/Tasks line placing it in board.spec.ts was a plan slip.

Review-log minors: WordCellRow card-0 waits (none switched; audit), Placeholder heading (ticket wording, deferred), placeholder show/hide (matrix + render-rules test), per-container `data-place` (AD-14 test), count 1/2 boundary (deferred to entry 3: no fixture), grid tracks (Board task), `.count` placement (WordCellRow task), banner offset (deferred to entry 4), shared `newGame` (`new-game.ts`), Score 'then Redo disabled' (cut from R-82, kept in R-70/R-71).

## Plan Change Log

## Review Triage Log

### 2026-10-02 — Review pass
- verdicts: 30 findings — high 0, medium 2, low 17, false 11, maybe-false 0
- findings:
  - `[low]` `[reject]` blind: `--pass-with-no-tests` leaves screenshots vacuous — the ticket prescribes the deletion and the flag (Screens: entry 3 drops it and adds board.screens.spec.ts).
  - `[false]` `[reject]` blind: Board `row()`/`gridUnit` silently mis-handle reshaped units — units are the `BAND_ORDER` objects themselves (`parseBandsParam` only reorders them), so every grid unit is exactly columns/footRow or labels/wordcells.
  - `[false]` `[reject]` blind: `faces[id] as Face` masks undefined — an undefined face throws on `face.letter` in Card, so nothing is hidden.
  - `[medium]` `[patch]` blind: QU card ×2 badge and `Qu` glyph untested — added assertions (badge `×2`, glyph `Qu`, one badge on the board) to the idle-fresh render-rules test.
  - `[low]` `[reject]` blind: WordCell used/legal/target/not-legal states untested — the ticket assigns their tests and look to entry 3 (WordCellRow paragraph).
  - `[low]` `[reject]` blind: F11 geometry and no-scroll only on android — the ticket AC scopes them to android (desktop 1280 × 720 scrolls 2 px by design).
  - `[low]` `[reject]` blind: banner adds 44 px over a full stack, document scrolls — the ticket's Mount inputs fix `bannerShown` false and leave leftover-first re-layout to entry 4.
  - `[low]` `[reject]` blind: invalid-word line position in the tray band unasserted — dictionary.spec.ts keeps its text/colour/svg checks; entry 3 moves the line into Tray.svelte and owns its placement.
  - `[low]` `[reject]` blind: plan triage log/change log empty while in-review — fix edits this build's plan; this entry fills it.
  - `[low]` `[reject]` blind: seed reads report `false` rather than the non-active state — diagnostic wording only; the read follows a board-ready wait, so the session is active.
  - `[low]` `[reject]` blind: ×2 badge read as part of the card's accessible text; `WordCell <n>` aria-label outside text.ts — no rule or catalogue row decides the badge's accessible text; the aria-label is epic 3's, carried unchanged (pre-existing).
  - `[low]` `[reject]` blind: `new-game.ts` has no unit test — the sequence moved verbatim and stays covered by blocking.spec.ts (rejected root New game) and the action-bar New game flows.
  - `[false]` `[reject]` blind: AD-14 test omits testid = `card-<data-card-id>` — smoke.spec.ts 'AD-17 board renders 52 live card elements' asserts exactly that per card.
  - `[low]` `[reject]` edge: banner shown with `bannerShown=false` overflows — same as the banner row above; ticket defers to entry 4.
  - `[low]` `[reject]` edge: zero insets on inset devices overflow — ticket Board/Notes (owner Option A): entry 4's probe feeds insets.
  - `[false]` `[reject]` edge: a column with more than 7 cards spills over the foot row — columns never gain cards (R-60, DESIGN Columns), so 7 is the maximum.
  - `[low]` `[reject]` edge: geometry stale after resize/rotation — ticket Mount inputs: read once, entry 4's live layout replaces them.
  - `[low]` `[reject]` edge (deletion): placeholder screenshot spec deleted — prescribed by the ticket; entry 3 creates board.screens.spec.ts.
  - `[low]` `[reject]` edge (deletion): desktop column-1 letters check removed — the ticket AC drops the wrapper toHaveText and scopes R-03 to android.
  - `[medium]` `[patch]` verification-gap: QU ×2 badge untested — same root cause as the blind QU row; same patch.
  - `[low]` `[patch]` verification-gap: card wrapper `touch-action: none`/`user-select: none` untested — added `toHaveCSS` checks on a column card (idle-fresh) and a cell card (session-won).
  - `[low]` `[patch]` verification-gap (other): R-03 test in board.spec.ts, ticket says smoke.spec.ts — moved unchanged into smoke.spec.ts.
  - `[low]` `[patch]` intent: R-03 file location diverges from the ticket — same as the row above; same patch.
  - `[false]` `[reject]` intent: card-0 waits not switched — audited: no card-0 visibility wait runs on session-place-free-letter-redo-tail (plan `deferred`, ticket wording).
  - `[false]` `[reject]` intent: 'then Redo disabled' moved out of the score flow — the review-log minor asked for that; R-70/R-71 asserts it.
  - `[false]` `[reject]` intent: used + not-legal opacities stack (≈14 %) — DESIGN WordCell: the card at 40 % with the hatch "and the whole cell … additionally drawn at 35 %"; stacking is the specified look.
  - `[false]` `[reject]` intent: band-stack sum reads the computed layout back — the same test asserts `scrollHeight === innerHeight === 839`, the rendered fit.
  - `[false]` `[reject]` intent: title check runs on both projects — a superset of the desktop requirement; the title is always present per the ticket's TopBar paragraph.
  - `[false]` `[reject]` intent: Composing board untested — the ticket asks for no Composing test here; entry 3 covers Composing/Place.
  - `[false]` `[reject]` intent: Place rendering exercised only through Place fixtures — that is the coverage the ticket names (session-place, redo tail).

## Design Notes

Hits must resolve to card or WordCell wrappers (build-notes CAP-4): the empty grid-track band elements sit first in the unit's DOM with `pointer-events: none`; the `.face` is `pointer-events: none` so the wrapper is the hit. The bars' 44/60 px are content heights plus env() padding (owner Option A); with Playwright's zero insets they equal `bands()` heights, so the stack sums to `innerHeight`.

## Verification

**Commands:**
- `npm run check && npm test` -- expected: green
- `npx playwright test e2e/board.spec.ts e2e/smoke.spec.ts` -- expected: green on android and desktop
- `npm run test:all` -- expected: exit 0

## Auto Run Result

- **Summary:** the epic 3 minimal board is replaced by `Board.svelte` iterating `BAND_ORDER` with mount-time AD-11 geometry (w from `cardWidth`, band heights from `bands()`), grid units for columns/footRow and labels/wordcells (8 slot tracks), F26 card wrappers with `.face`/`.glyph`/QU ×2 badge, WordCell stacks (non-top cards `visibility: hidden`, `.count` at 2+, used/legal/target/not-legal states), sticky TopBar (Score via `text.score`, Undo/Redo with `title`) and ActionBar (epic 3 primary logic), banner and tray bands; F4 locator moves; placeholder screenshot spec deleted with `--pass-with-no-tests`.
- **Files:** `src/ui/Board.svelte`, `Column.svelte`, `Card.svelte`, `WordCellRow.svelte`, `TopBar.svelte`, `ActionBar.svelte` (new components); `src/ui/new-game.ts` (shared New game sequence); `src/ui/App.svelte` (active root renders Board); `src/ui/text.ts`, `text.test.ts` (`score`, `quBadge`); `src/ui/DictionaryBanner.svelte` (44 px, no margin); `e2e/board.spec.ts` (new: geometry, R-82, R-70/R-71, AD-14, render rules, AD-11 order); `e2e/smoke.spec.ts` (R-03, seed via hook, visible/hidden cell cards); `e2e/blocking.spec.ts`, `app-shell.spec.ts`, `pwa/font.spec.ts` (locator moves); `package.json` (`--pass-with-no-tests`); placeholder screens spec and baselines deleted.
- **Review-log minors:** all ten resolved (Implementation Notes): six in code/tests, count-badge 1/2 boundary deferred to entry 3 (no fixture), banner offset deferred to entry 4, two ticket-wording items recorded in `deferred` (no card-0 wait runs on the redo-tail fixture, so none switched).
- **Review:** 30 findings; patched 3 entries (1 medium: QU badge test; 2 low: touch-action/user-select test, R-03 moved into smoke.spec.ts); 0 deferred from review; 26 rejected with reasons in the triage log (11 false).
- **Follow-up review:** false — patched entries: medium 1, low 2, high 0; all are test additions or a test move, verified green.
- **Verification:** `npm run test:all` exit 0 before and after the patches (1702 unit tests, build within budget, dist-smoke 13, e2e 214 passed, pwa 12).
- **Residual risks:** the `deferred` items; Board geometry is read once at mount (no resize, zero insets, banner adds 44 px over a full stack) until entry 4; `test:screens` runs no tests until entry 3 adds `board.screens.spec.ts`.
