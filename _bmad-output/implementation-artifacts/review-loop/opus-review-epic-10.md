# Review loop — Opus re-review of Epic 10 end-of-game words, tickets 10.1–10.3 (code mode)
State: pass 5: done (result written)

Target: code at HEAD 0cc58ac for the 23 files `git diff --name-only 19acd17..91e03d7` touched (minus `_bmad-output/`, `.claude/`, `docs/`, `*.png`; list in `opus-review-epic-10.passes/files.txt`). Staged diff: `opus-review-epic-10.passes/pass0.diff` (`git diff 19acd17 91e03d7 -- <files>`, 2156 lines). Findings only against code that still exists at HEAD; code replaced by the later epic 8/9 Opus review and owner-decision commits (after 91e03d7) is out of scope, as are epic 5 tail, 6, 8 and 9 findings. Tickets 10.4–10.10 not built; behaviour they own is not a finding, but each 10.1–10.3 deferral must name a ticket that carries it.
Mode: code, thorough, max 7. Pre-loop: HEAD 0cc58ac, tree 0 fbd91355e33855bef6622f222a892fa3341e7cd7.
Owner rules: only majors fixed; minors listed, never sent to the fixer; changes to UX, visuals (layout, colours, motion feel, noticeable timing) or gameplay are decision-needed; no screenshot baselines; no commits.
Intent: epic-end-of-game-words.md (with Notes), tickets.toml, tickets + plans + review logs 10.1–10.3, specs/spec-epic-10-end-of-game-words/SPEC.md and rule-coverage.md.

## Pass 1 — 2026-10-23
Reviewers: correctness, edge cases, verification gap, intent alignment  |  Findings: major 12, minor 6, decision-needed 1  |  Dropped in triage: 0 (merged: drift direction ×2; overlap constant ×3; card-face CSS copy ×3; wave order/overlap test ×3; mount/register deferral ×3). Reclassified: Words row separator token (reviewers: major) → decision-needed (visible on the end sheet at HEAD in every theme); celebration fade read from prefs (reviewer minor) → major (AD-19 Duration "No other module holds a duration"); tsconfig.app.json Scaffold deltas and explicit-extension importers (reviewer major) → minor (entry 9 "brings … the spine … in line with the build" owns the spine record; a wrong importer fails loudly at `npm run check`).
### Applied
- [major] src/ui/celebration/step.ts:131 `side` with step.test.ts 'drifts toward the side with more room' and the controller test relying on cell 3 drifting left — groups drift toward the NEARER wall (less room), the opposite of EXPERIENCE.md Win celebration and ticket 10.3 ("toward the side with more room, right on a tie"); the test pins the inverted direction → fixer item 1 (unmounted at HEAD, so no visible change today)
- [major] src/ui/celebration/Celebration.svelte:55,61 vs step.ts `OVERLAP`/`rowWidth` — the renderer hard-codes the 50 % overlap twice beside step.ts's private copy that sizes the physics box; entry 6 retunes the copy scale/A-D12 → fixer item 2 (default applied: export and use `rowWidth`/`OVERLAP`, render test with n ≠ 3)
- [major] src/ui/celebration/Celebration.svelte:76-99 vs src/ui/Card.svelte:214-242 — the copies' `.face`/`.face::after`/`.glyph`/`.glyph.qu`/`.badge` CSS is a hand copy of the live card's with no check that they agree (risk area 9) → fixer item 3 (default applied: a structural Vitest parity test over both `<style>` blocks, positive and negative control)
- [major] src/ui/celebration/step.test.ts — no test pins SPEC F6 "overlapping waves, in word-list order": launch order reversal within a wave and sequential (non-overlapping) waves pass every test → fixer item 4
- [major] src/ui/celebration/step.test.ts — no arc test: a group launched downward (vy sign flipped) passes all 45 tests; no test that vx survives a floor bounce (R-87 arcing, falling-and-rebounding; CAP-2 constant drift) → fixer item 5
- [major] src/ui/celebration/step.test.ts — no test that gravity, speed and launch times scale with the cap (F7, AD-19 Duration); absolute-ms physics passes all tests → fixer item 6
- [major] src/engine/view.test.ts:1057 'R-86 a duplicate word gives equal entries in move order…' — move order coincides with descending cell and ascending card ids, so a comparator breaking ties by cell or card id passes (rule-coverage R-86 "equal entries in move order") → fixer item 7
- [major] src/ui/EndSheet.svelte:188-189 with e2e/end-sheet.spec.ts `rows()` and end-sheet.test.ts — every assertion reads the li `aria-label`; the visible aria-hidden word/count spans (R-88 "Each entry shows the word and its letter count", EXPERIENCE.md capitals + `5 letters`) are untested (lowercase or wrong count passes) → fixer item 8
- [major] src/ui/celebration/celebration.svelte.ts:115-116 — `start` measures the band from the top bar's bottom, ignoring a shown dictionary banner; AD-19 clips to AD-12's visible band (`src/ui/gestures/visible-band.ts`, the single owner) → fixer item 9 (default applied: reuse `createVisibleBand`)
- [major] src/ui/celebration/celebration.svelte.ts:110-114 — an absent `wordList` (a playing view) silently ends the run and calls `done` (rule 6 fallback; AD-3 present exactly when status ≠ playing; EndSheet throws for the same condition) → fixer item 10 (default applied: throw for absent, keep empty as the specified immediate end)
- [major] celebration.svelte.ts:39 (`run` plain `let`), Celebration.svelte:32-35 (register in onMount only), 10.3 plan triage ("mounted fresh per run (entry 4)", "entry 4 closes it", resize "entry 4", reduced motion "entry 4") vs tickets.toml entries 4/5/7 — the mount/register contract and its proof were deferred to entry 4, which mounts nothing; entry 5 (which mounts) carries neither a mount-per-run requirement nor a check that copies become visible; `props()`/`running()` are not reactive so a mount cannot follow a run; reduced motion and resize belong to entries 5 and 7 → fixer item 11
- [major] src/ui/celebration/celebration.svelte.ts:139 `baseMs: prefs.motion.baseMs` — the closing fade duration is read outside src/ui/motion.ts (AD-19 Duration "No other module holds a duration"; AGENTS single owner) → fixer item 12
### Decision needed (functionality / UX / gameplay)
- src/ui/EndSheet.svelte:266 `.words li { border-top: 1px solid var(--wc-outline) }` vs DESIGN.md Words section "separated by `{colors.hairline}` lines" — the Words rows show dividers in the stronger outline colour (Charcoal #6E7480 instead of #363B45; Paper #6D6757 instead of #D6CEBB); the 10.2 baselines pin the outline colour — proposed default: use `--wc-hairline` as DESIGN.md says and regenerate the end-sheet Words baselines.
### Minors (listed, not sent to the fixer — owner rule)
- src/ui/celebration/step.ts:136 — `floor(i/3)·g + (i%3)·g/3` equals `i·g/3`: the "waves" are an even stagger with per-slot speed variety; tuning is entry 6's (state it in the comment or give waves real structure then).
- tsconfig.app.json:9 `allowImportingTsExtensions` (the celebration.svelte.ts / Celebration.svelte case clash on drvfs) — not in the spine Scaffold deltas; entry 9's close-out should record it; later importers must use the explicit `.svelte.ts` path (a wrong import fails `npm run check`).
- rule-coverage.md R-88 `1 letter` — 10.2 plan says exempt from P6 (min word 3) and covered by the AD-3 Vitest stub, but the Exempt list does not carry it (entry 9 close-out).
- e2e/end-sheet.spec.ts:897-913 — after Undo then Give up it asserts only `not.toEqual(WON_ROWS)` and length 9, not `toEqual(GAVE_ROWS)`.
- celebration.svelte.test.ts `viewOf` — entries always have `letterCount === cards.length`; no QU case pins that the controller sizes rows by `cards.length`.
- 10.3 plan triage log — entry-number misattributions beyond those fixed under item 11, if any remain.
### Fixer outcome
1. step.ts `side` flipped (more room; tie right); step test expects side(100)=1, side(260)=−1, centre 1.
2. step.ts exports `OVERLAP`; Celebration.svelte uses `rowWidth`/`OVERLAP`; render test with 4 letters.
3. Celebration.test.ts 'AD-19 the copy face rules match Card.svelte normal state, except the listed differences' (style-block parity, allow-list `.face` position/top/box-shadow/margin/pointer-events, built-in negative control).
4. step.test.ts: launchMs strictly increasing (7 groups); each later group launches while an earlier one is shown at Fast/Normal/Slow; first launchMs pinned 0/160/320/480.
5. `RISE_SHARE` exported; arc test (vy < 0 at launch, apex within 5 px of origin − RISE_SHARE × room) and vx unchanged through a floor bounce.
6. Cap-scaling test (3000 vs 6000: gravity 4×, |vx|,|vy| 2×, launchMs halved).
7. view.test.ts duplicate scenario reworked (ONES ×3 + BAKED; move order ≠ cell order either way ≠ card-id order); four comparator mutations fail it.
8. end-sheet.test.ts asserts span markup (`>BAKED<`, `>5 letters<`, `>1 letter<`); e2e 'R-88 a won sheet lists the ten words in order' reads `.word`/`.count` text (QU row `JDAQUYE`, `7 letters`); targeted android run passed.
9. `start` uses `createVisibleBand(() => document.body)`; tests for a shown 40 px banner (top 96) and a zero-height banner (top 56).
10. Absent `wordList` throws (AD-19/AD-3); ticket 10.3 sentence updated.
11. `active = $state.raw<RunProps | null>` backs `props()`/`running()`; test via `$derived` plus a client-compile check that both read through a signal (svelte compiler loaded through `process.getBuiltinModule`); tickets.toml entry 5 description/verify gain the keyed mount-per-run and visible-group checks; 10.3 plan triage references corrected (mount/register, reduced motion → entry 5; resize → entry 7).
12. motion.ts `celebrationFadeMs()` (1 × base) beside `celebrationCapMs()`; motion.test.ts test 90/180/320.
Positive controls run for every new/strengthened test (fixer report). Fixer ran: npm test 86 files / 3362 passed; lint pass (1 pre-existing warning); check 0 errors.
Orchestrator verify: npm test 86 files / 3362 passed; lint pass (1 pre-existing warning); check 0 errors. Snapshot: tree 1 5b14177999f4d8558f0c3e4e9897562c3661d73f; pass1.fix.diff 692 lines; pass1.diff restaged (19acd17 → working tree, 3305 lines).

## Pass 2 — 2026-10-23
Reviewers: fix diff, edge cases, verification gap, intent alignment  |  Findings: major 7, minor 3, decision-needed 0  |  Dropped in triage: 0 (merged: data-celebration on groups ×2; entry 5 wording ×2, folded into item 2). Physics bounce-before-exit kept major (stated EXPERIENCE.md rule; unmounted at HEAD, so no visible change today; entry 6's tuning is an Android portrait read and would not see desktop/landscape).
### Applied
- [major] src/ui/celebration/celebration.svelte.test.ts:344-388 'AD-19 props() and running() are reactive' — pass-1 fix 11's only real gate greps Svelte's generated client JS for `$.get(` (internal runtime name, printer formatting, `[^}]*` body); the `$derived` half passes on the broken implementation under the server compile → fixer item 1 (default applied: a source-structure check with the existing parse pattern)
- [major] src/ui/celebration/Celebration.svelte:52-66, Celebration.test.ts:23-35, tickets.toml entry 5 — `data-celebration` sits on the group elements, not on each card-face copy (ticket 10.3 "Each copy has `data-celebration` and `aria-hidden`", SPEC Constraints), so entry 5's copy-count verify (sum of card counts, > 52) cannot pass, and the pass-1 entry 5 edit calls groups `[data-celebration]`, keys on a "run token" the controller does not have and tests a second run "with the component still mounted" against its own keyed mount → fixer item 2
- [major] src/ui/celebration/step.ts:153 fade, celebration.svelte.ts `baseMs: celebrationFadeMs()` — the 1 × base closing fade is checked mid-fade only at base 180; a fade fixed at 180 ms passes all tests (ticket 10.3 verify: the cap and fade at Fast and Slow) → fixer item 3
- [major] celebration.svelte.ts:76 `scale(${group.scale})`, Celebration.svelte container (`overflow: hidden`, band position, `transform-origin: 0 0`) — every controller transform check uses 3-letter rows (scale 1), so a hard-coded `scale(1)` or a changed origin passes; no test pins the band clip (ticket 10.3 "a 23-letter row scaled to fit a 360 px band"; AD-19 clipped to the visible band) → fixer item 4
- [major] celebration.svelte.ts:133-141 origins — only `els[0]` (cell 3) is ever checked; reading every origin from `list[0].cell`, or measuring the cell box instead of the label, passes (SPEC F8 launch from the placement WordCell; group i ↔ element i) → fixer item 5
- [major] src/ui/celebration/step.ts:97-106 (speed from band width, gravity/rise from band height) — on wide or short bands most groups leave past a side edge without ever touching the floor (simulated: 10/12 at 1280×720, 9/12 at 839×412, 1/12 at 360×740), against EXPERIENCE.md "bounces on the bottom of the visible band … and leaves past a side edge" and R-87 "falling-and-rebounding"; every bounce test injects the contact by hand → fixer item 6
- [major] src/ui/EndSheet.svelte:273-275 `.word` clamp, e2e/end-sheet.spec.ts:834 — DESIGN.md "the two on one line at 360 px (the word shrinks to 14 px before it wraps)" is never exercised: the longest tested word (10 letters) clamps to 16 px, so the shrink could be removed and the `>= 14` assertion still passes → fixer item 7
### Minors (listed, not sent to the fixer — owner rule)
- story-celebration-step-renderer-and-run-controller-plan.md:75 — still says the ticket lets an absent `wordList` end at once (superseded by pass-1 fix 10).
- story-celebration-step-renderer-and-run-controller.review-log.md:80,92 — resize mid-run still attributed to entry 4 (entry 7 owns it).
- (folded into item 2) tickets.toml entry 5 key wording.
### Dropped
- none
### Fixer outcome
1. Reactivity test now parses the controller with the TypeScript compiler API: `active` is a `let` initialised with `$state.raw`/`$state`, and `props()`/`running()` read `active`, not `run`; the compiled-output grep and `process.getBuiltinModule` are gone; the `$derived` half is a value-sequence check only.
2. Every `.face` copy carries `data-celebration` and `aria-hidden`; groups carry `data-celebration-group`; render test counts copies (5) and groups (2); tickets.toml entry 5 keys on `celebration.props()`, checks `[data-celebration-group]`, second run "Undo then Redo of the win, no reload) mounts a fresh `Celebration`".
3. Step fade tests at Fast and Slow (1 just before cap − base; ≈ 0.5 at cap − base/2); controller Slow test (31 entries, written opacity matches (cap − t)/320).
4. Controller 23-letter test (`scale(rowScale(23, 40, 360))` < 1, translate from the scaled box); render test for container band style, `.celebration` `position: fixed`/`overflow: hidden`, `.group` `transform-origin: 0 0`.
5. Fake DOM returns distinct rects for the WordCell box and its label; cells [6, 3, 5] test compares each element with a pure launch/step from its own label centre.
6. step.ts: `CROSS_FRAC` removed; |vx| from each group's distance to its exit wall and its first-floor-contact time (`EXIT_AFTER_CONTACTS = 2`; `SPEED_STEP` kept, fastest slot exits ≈ 1.5 contact times); new test over 360×740, 1280×720, 839×412 at Fast/Normal/Slow: every exited group bounced ≥ 1 (all 12 exit in all 9 cases); pinned launchMs unchanged.
7. `SESSIONS.longWord` in e2e/helpers/sessions.ts (engine-built seed-1 win ending in the 20-letter TNPDVIMLDXOMIWRNZOAF, pinned in e2e/helpers.spec.ts); android test 'R-88 a 20-letter word shrinks below 16 px but not under 14 px and stays on one line beside its count at 360 px'; the DESIGN.md rule holds; EndSheet.svelte unchanged; 11 android R-88 tests pass.
Positive controls run for each (fixer report). Fixer ran: npm test 86 files / 3377 passed; lint pass (1 pre-existing warning); check 0 errors.
Orchestrator verify: npm test 86 files / 3377 passed; lint pass (1 pre-existing warning); check 0 errors. Snapshot: tree 2 76c8eb989d16a7d8b66b5609dc9b982cbd5f7f49; pass2.fix.diff 600 lines; files.txt gains e2e/helpers/sessions.ts, e2e/helpers.spec.ts.

## Pass 3 — 2026-10-23
Reviewers: fix diff, edge cases, verification gap, intent alignment  |  Findings: major 4, minor 5, decision-needed 0  |  Dropped in triage: 0 (merged: zero-height band ×2). Kept minor: the cap counts simulated time (exceeded only below 20 fps; reviewer minor).
### Applied
- [major] src/ui/celebration/step.test.ts:329-342 (pass-2 fix 6 test) — asserts only bounce-before-exit and `exits > 0`; a slowed speed where most groups never reach a side edge (EXIT_AFTER_CONTACTS 4: 3/12 exit) still passes, though EXPERIENCE.md also says each group "leaves past a side edge" → fixer item 1
- [major] src/ui/celebration/step.ts:1-5, :108-118 vs ARCHITECTURE-SPINE.md AD-19 Rule bullet 1 ("launch time, side and speed derive from the entry index and the band size") and SPEC CAP-2/F3 — side (since 10.3) and now speed also derive from the launch origin, needed for EXPERIENCE.md ("side with more room", "bounces … and leaves past a side edge"); the spec wins, but no plan/ticket/close-out record points entry 9 at the spine/SPEC wording (rule 7: the spine edit is the owner's) → fixer item 2 (record only; no spine/SPEC edit)
- [major] src/engine/replay.ts:162 with view.test.ts 'R-86 word list' and serialize.test.ts WON_WORDS_LIST — no scenario uses a non-default `setPlacementOrder`, so `cards` taken from the placement order instead of word order passes all 1123 engine tests (R-86/AD-3 "cards in word order"; the celebration draws copies from `entry.cards`) → fixer item 3
- [major] src/ui/celebration/celebration.svelte.test.ts:294-341 vs celebration.svelte.ts:194 — the manual clock's remainder carry is tested only when earlier calls made zero steps; discarding the remainder after any whole step passes (ticket 10.3 verify "`advance` remainder carried"; entry 5's cap rows ride on it) → fixer item 4
### Minors (listed, not sent to the fixer — owner rule)
- src/ui/celebration/step.ts:93-118 — a band no taller than a card (window shorter than the two bars plus a card) gives NaN/Infinity physics (gravity 0, contactMs 0/NaN): an invisible run until the cap or an instant exit; fail fast or finish at once.
- src/ui/celebration/celebration.svelte.ts:92-101 with step.ts DT_MAX_MS — the cap counts simulated time; below 20 fps a Normal run outlasts 6 s of wall time (EXPERIENCE.md Motion "ends within 6 s at Normal"); no ticket carries it (10.3 review log listed it unapplied); a wall-time end in `frame` or a doc note would settle it.
- src/ui/end-sheet.test.ts:210-227 — the stub list is already in engine order, so a UI re-sort (AD-3 re-derivation) passes.
- _bmad-output/implementation-artifacts/review-loop/10-3-build.md:18,20 — mount check and client-side register test still attributed to entry 4 (entry 5 carries them).
- (pass-2 minors on the 10.3 plan:75 and story review log :80,:92 stand.)
### Dropped
- none
### Fixer outcome
1. Real-geometry test renamed 'AD-19 every group bounces on the floor, then exits before the cap (…)': all 12 exit before the cap with ≥ 1 bounce in each of the 9 cases (EXIT_AFTER_CONTACTS = 4 fails all 9).
2. 10.3 plan Plan Change Log entry (2026-10-23) recording the launch-parameter wording for entry 9's close-out; step.ts header updated; tickets.toml entry 9 description carries "AD-19 Rule bullet 1 and SPEC CAP-2/F3 launch parameters (entry index, launch origin and band size; Opus review of 10.3)". Spine and SPEC untouched.
3. view.test.ts 'R-86 cards stay in R-30 word order after a non-word setPlacementOrder before Confirm' (QU_TOP session; placementOrder for `cards` fails it, 1 of 1124).
4. celebration.svelte.test.ts 'AD-19 advance carries the remainder after a call that stepped: 20 then 12 ms is two 16 ms steps' (remainder dropped after a step fails it).
Fixer ran: npm test 86 files / 3379 passed; lint pass (1 pre-existing warning); check 0 errors.
Orchestrator verify: npm test 86 files / 3379 passed; lint pass (1 pre-existing warning); check 0 errors. Snapshot: tree 3 2f3b1c46ee5d17699e0447a56300526b29927540; pass3.fix.diff 123 lines.

## Pass 4 — 2026-10-23 (late-pass bar)
Reviewers: fix diff, edge cases, verification gap, intent alignment  |  Findings: major 2, minor 2, decision-needed 0  |  Dropped in triage: 0. Reclassified: celebration z-index (reviewer minor) → major (ticket 10.3's renderer contract follows DESIGN.md's layer order; no later ticket owns it; a mounted run would draw under a lifted card, column outline, hover peek or drag layer). Fix diff and edge-case lenses returned [].
### Applied
- [major] src/ui/celebration/Celebration.test.ts:27-92 vs Celebration.svelte glyph and `cardH` — no test pins that each copy shows its own card's letter in word order or the board card height: every copy showing the row's first letter, or `cardH = cardW * 1.2`, passes all celebration tests (R-87 "its own copies of the card faces", AD-19 "copies of the card faces from `view.faces`"; risk area 9) → fixer item 1
- [major] src/ui/celebration/Celebration.svelte:74 `.celebration { z-index: 1 }` vs DESIGN.md Layer order ("… sticky bars → selection/lift → hover peek → drag layer → win celebration → scrim → overlay") — the container sits under sticky bars' siblings at 2, selection/lift and column outlines at 3, hover peek 4 and drag layer 5 → fixer item 2 (default applied: z-index 6, above the drag layer and below WordCellView 10 / Sheet and Panel 20 / Dialog 30; pinned in the container render test)
### Minors (listed, not sent to the fixer — owner rule)
- SPEC.md CAP-5 — entry 9's new launch-parameter hand-off also amends this SPEC's CAP-2/F3, which CAP-5's success line does not list (add it at entry 9).
- 10.3 plan:96 and 10-3-build.md:20 — "layout measured with direct rects … settles at entry 5 mount" is obsolete (band from visible-band.ts, sizes from layout/geometry since pass 1/2) and entry 5 does not carry it.
### Dropped
- none
### Fixer outcome
1. Celebration.test.ts 'AD-19 each copy shows its own card letter in word order, at the board card height' ([C,A,T] and [QU,O,T,E] at cardW 40: glyph texts per group in DOM order; group height and container `--wc-H` = cardMetrics(40).H = 53 ≠ 48); both mutations fail it.
2. Celebration.svelte `.celebration` z-index 6 (DESIGN.md Layer order comment); container-style test pins 6, > Column.svelte drag layer 5, < WordCellView 10; z-index 1 fails it.
Fixer ran: npm test 86 files / 3380 passed; lint pass (1 pre-existing warning); check 0 errors.
Orchestrator verify: npm test 86 files / 3380 passed; lint pass (1 pre-existing warning); check 0 errors. Snapshot: tree 4 4be45369e3f1c944a9ee359833b64a2b445e1f57; pass4.fix.diff 61 lines.

## Pass 5 — 2026-10-23 (late-pass bar)
Reviewers: fix diff, edge cases, verification gap, intent alignment  |  Findings: major 0, minor 1, decision-needed 0  |  Dropped in triage: 0. Fix diff, edge cases and intent alignment returned [].
### Minors (listed, not sent to the fixer — owner rule)
- e2e/end-sheet.spec.ts:912-927 'R-88 scrolling, collapsing and expanding leave localStorage untouched' — `before` is taken after boot's reconcile, so a history record that grew (e.g. a stored word list) would pass; assert the stored `wordcell:history` record has exactly the six AD-6 keys and HISTORY_VERSION.
Orchestrator final: npm test 86 files / 3380 passed; lint pass (1 pre-existing warning, e2e/end-sheet.spec.ts:857 non-null assertion, present at HEAD as :846); check 0 errors; `npx playwright test e2e/end-sheet.spec.ts e2e/helpers.spec.ts --project=android` 122 passed, 2 skipped. No screenshot run (owner rule).

## Result — converged after 5 passes
Majors per pass: 12, 7, 4, 2, 0. Decision needed: 1 (Words row separators use `--wc-outline`, DESIGN.md says `{colors.hairline}`; proposed default hairline + regenerate the four end-sheet-words baselines). Technical defaults applied: 9 (visible-band owner reuse, absent-wordList throw, celebrationFadeMs, style-parity test, AST reactivity check, data-celebration-group marker, per-group exit speed EXIT_AFTER_CONTACTS = 2, SESSIONS.longWord in e2e/helpers/sessions.ts, z-index 6).
Owner close-out carried by entry 9 (rule 7; recorded in tickets.toml entry 9 and the 10.3 plan Plan Change Log): AD-19 Rule bullet 1 and SPEC CAP-2/F3 launch parameters should read "entry index, launch origin and band size".
Screenshots: no baseline is stale from this loop (the celebration is unmounted; EndSheet.svelte unchanged). If the owner takes the hairline default, regenerate e2e/end-sheet.screens.spec.ts-snapshots/end-sheet-words-{android,desktop}-linux.png and end-sheet-words-paper-{android,desktop}-linux.png.
Unapplied minors (15): pass 1 ×6, pass 2 ×2, pass 3 ×4, pass 4 ×2, pass 5 ×1 (listed under each pass).

## Orchestrator close-out — 2026-10-23
- Decision F14 (owner standing rule, proposed default accepted): `.words li` separators use `--wc-hairline` (src/ui/EndSheet.svelte), `7352e29`.
- Gates: `npm run test:all` exit 0 (1054 dev-server e2e passed); screenshots regenerated in the container: 4 real changes (end-sheet-words android/desktop, Charcoal and Paper; only the nine separators), 7 noise-only (max 1-2/255 on 7-23 px: keyboard-focused-tile ×2, theme-paper board/tray, theme-plum/scifi/steampunk board) restored; read-only evaluator verdict approve, no escalation; baselines `4e0d813`; `test:screens` rerun 66 passed, 38 skipped.
- No post-loop fix was needed. Models since the run start: claude-opus-5-5 only.
- Commits: fixes `c84a1df`, F14 `7352e29`, baselines `4e0d813`.
- rule-coverage.md: three rows added for the sentences whose first tests this loop wrote (AD-19 step, AD-19 renderer and controller, the Words 14 px shrink).
- Owner docs checked against F14 and the fixes: game-flow-spec.md, EXPERIENCE.md, DESIGN.md (already says hairline; layer order already places the celebration above the drag layer), AGENTS.md, requirements-carryover.md: no change. ARCHITECTURE-SPINE.md: AD-19 Rule bullet 1 (and SPEC CAP-2/F3) pending, "entry index and band size" → "entry index, launch origin and band size", reason: the pass 2-3 physics fix needed for EXPERIENCE.md Win celebration; Scaffold deltas pending for `tsconfig.app.json` `allowImportingTsExtensions` (minor). Both carried by tickets.toml entry 9; not applied (rule 7).
