---
title: 'Close-out: documents, AGENTS pitfall and device check'
type: 'chore'
ticket: '9'
created: '2026-10-24'
status: done
baseline_revision: '91d1f550c94bb47be6f567386d55e41c7e78ab76'
route: 'full'
route_source: 'auto'
review: 'thorough'
review_source: 'auto'
lenses_ran: ['blind-hunter', 'edge-case-hunter', 'verification-gap', 'intent-alignment']
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-end-of-game-words/story-close-out-documents-agents-pitfall-and-device-check.md'
  - '{project-root}/_bmad-output/specs/spec-epic-10-end-of-game-words/SPEC.md'
  - '{project-root}/_bmad-output/specs/spec-epic-10-end-of-game-words/rule-coverage.md'
warnings: ['oversized', 'multiple-goals']
deferred:
  - summary: >-
      e2e/nav.spec.ts:162 fails intermittently under the full android run.
    evidence: |-
      Pre-existing load flake recorded since 10.4 (autopilot digest); failed once in each full android run of this ticket, passed 8/8 and 5/5 alone; the spec is untouched here.
    location: >-
      e2e/nav.spec.ts:162
    severity: low
---

<intent-contract>

## Intent

**Problem:** Epic 10's documents (spine AD-13/AD-17/AD-19, EXPERIENCE.md, DESIGN.md, epic SPEC, rule-coverage.md, R-87) lag the build after F15–F29, AGENTS.md calls every non-live card copy a mirror though the celebration copies are not, and the owner's final Android read has no long-list fixture.

**Approach:** One `bmad-project-context` `record` run writes the two authorised AGENTS.md lines first; then add the `session-won-long-words` fixture with its registrations and `step.test.ts` rows, one `android` banner test, sync every listed document to the build, map every rule-coverage row to its passing test, run `test:all` and `test:screens`, and hand the owner the device-read command and checklist. The ticket ends `built`.

## Boundaries & Constraints

**Always:** Cite rules by id. Sync docs to the build; never change code behaviour (`src/**` except tests is untouched, `step.ts` included). An unbacked doc/build mismatch (no F-row or ticket record) is an owner item, nothing edited. New rule-coverage rows lead with their test's id (R-87 or AD-19) and cite "(SPEC Fnn)"; no Test column is added; no test is renamed. Fixture words are inline-dictionary strings (R-37 trusts committed words). `test:screens` regenerates no baseline.

**Never:** Write AGENTS.md by hand or beyond the two lines (plus nothing else the skill proposes). Write a ticket file (tickets.toml, the story, the epic file). Edit DESIGN.md A-D12's verdict (the owner's at done). Run the Tailscale share. Push.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| record writes both lines | `record` run with the Notes evidence | AGENTS.md diff = pitfall line + Conventions-line exception | — |
| record will not write both | skill declines or writes one | `git checkout -- AGENTS.md`; HALT `blocked` for the owner, before any other edit | tree clean |
| long list in step.test.ts | new rows join the bounce/exit loop | every card bounces then exits before the fade at 3 geometries × 3 speeds | a failure → owner item + HALT; `step.ts` not changed |
| fixture shortfall | search cannot reach a target (23 letters, ≥ 20 entries, ≥ 100 copies) | fixture committed at what it reaches; counts recorded | each shortfall an owner item for the read |
| banner press | press on the dictionary banner where no control lies, mid-run | run continues, no sheet | — |

</intent-contract>

## Code Map

- `AGENTS.md:75` -- Conventions line "every other copy is a mirror (see Known pitfalls)" — the line already covering copies (Record's check); gains the celebration exception. `AGENTS.md:82` -- the mirrors pitfall the new pitfall sits beside. `:16` provenance line — `record` leaves it (no block re-verify).
- `.claude/skills/bmad-project-context/SKILL.md` § Record -- take task, mistake, correction, evidence; check for a covering line; costly → write a line; mechanically preventable → name the check.
- `src/engine/serialize.test.ts` -- fixture registration: JSON imports :229-230; `ValidName` :295-315; `VALID` :318-339; `PROPERTIES` :849-1021 (pattern: `'won-words'` :997-1020); `REBUILDS` :1842-2033 (pattern: won-words :1993-2032 `play(createSession(2089), […], WON_WORDS_DICTIONARY)`, helper `whole(c,n)`; dictionary/expected-list consts :342-372); same index in `VALID` and `REBUILDS`. Fixture JSON = `serializeSession(build())`, no trailing newline.
- `src/engine/test-helpers.ts` -- `play` :56-66, `DICT` :52-53, `drop` :68-77. Commands `src/engine/commands.ts:34-51`; QU card id 35 (`src/engine/lang/en.ts:21`).
- `src/architecture-ad2-ad12-ad17.test.ts:10-41` -- `AD-17 the valid fixtures/session-*.json files are exactly the rebuilt ones`: add `'session-won-long-words.json'` in sorted order.
- `src/ui/celebration/step.test.ts` -- `scene(w,h,hoverFine,rows)` :979-995, rows `[cardCount, cell]` (controller passes `entry.cards.length`); `LONG` :996-998; `FIXTURE` :999-1011; bounce/exit loop :1012-1048; `PACES` :1051-1062 (`${list} ${geometry}` → per-group pace, Normal); pace loop :1063-1085; scale pins :890-906.
- `e2e/celebration.spec.ts` -- `R-87 a press on the top bar (touch) or the action bar (mouse) where no control lies…` :507 (`quietBarPoint`, `recordPressTargets`, `running`, `sheet`) and `R-87 the dictionary banner’s Reload pressed mid-run…` :575 (failed-dictionary route) are the patterns for the new banner test; banner band `[data-band="banner"]` (`src/ui/celebration/skip.ts:60`).
- Docs: spine `_bmad-output/planning-artifacts/architecture/architecture-wordcell-2026-09-27/ARCHITECTURE-SPINE.md` (AD-9 ~412-417, AD-13 Binds 577-578 and celebration paragraph 656, AD-16 750-760, AD-17 seam 838, AD-19 958-974, Structural Seed 1022, Map 1118); `…/ux-wordcell-2026-09-27/EXPERIENCE.md` (49, 116, 172, 343-345, 376-385, 412, 432-436, 607, 675); `…/DESIGN.md` (494-495, 692, 753); `docs/game-flow-spec.md` (preamble 12-13, R-87 370-381); SPEC (CAP-2 33, CAP-3 37, CAP-6, F12, F15 103, F24/F25 112-113); `rule-coverage.md`.
- Read-only: `src/**` non-test sources (the build is the reference), the story, `tickets.toml`, the epic file.

## Tasks & Acceptance

**Execution:**
- [x] `AGENTS.md` -- MAIN SESSION (done; do not touch AGENTS.md again), before any other edit and before the implementing handoff: run `bmad-project-context` `record` (Design Notes D1). Both lines written → continue; else revert and HALT -- Notes bullet 2; a HALT leaves a clean tree.
- [x] `fixtures/session-won-long-words.json`, `src/engine/serialize.test.ts`, `src/architecture-ad2-ad12-ad17.test.ts` -- find a seed and script by a throwaway search (not committed) and register the fixture (D2) -- device-read fixture.
- [x] `src/ui/celebration/step.test.ts` -- `LONG_WORDS` rows beside `FIXTURE` joining both loops, three `PACES` keys, one smallest-scale pin (D3); unit median before/after -- F22 tempo and A-D12 scale inputs to the read.
- [x] `e2e/celebration.spec.ts` -- android test `R-87 a press on the dictionary banner where no control lies does not skip the run` (D4) -- R-87 banner amendment.
- [x] `docs/game-flow-spec.md` -- R-87 "outside the top and action bars and the dictionary banner"; preamble dated sentence (D5) -- owner standing rule 2026-10-24.
- [x] `ARCHITECTURE-SPINE.md` -- edits S1–S12 (D6).
- [x] `EXPERIENCE.md`, `DESIGN.md` -- edits X1–X12, G1–G3 (D7).
- [x] `SPEC.md` -- edits P1–P6 (D8).
- [x] `rule-coverage.md` -- edits R1–R5 (D9).
- [x] this plan -- fill the Close-out checklist and Rule-coverage map (D10) in Implementation Notes; record the owner items and handoff (D11).

**Acceptance Criteria:**
- Given the `record` run, when AGENTS.md is diffed, then it shows exactly the pitfall line and the Conventions-line exception (else the tree is clean and the run HALTed).
- Given the new fixture, when `npm test` runs, then `AD-17 the valid fixtures…`, `§2 long-words parses…`, `§2 long-words has its defining property` (entry count, copy count, longest letterCount/cards) and `AD-17 session-won-long-words.json equals its scripted accrue/apply rebuild` pass.
- Given `step.test.ts`, when `npm test` runs, then the long-words list passes both scene loops at three geometries and the new `AD-19` pin asserts its smallest `g.scale` at portrait 360x740.
- Given a running celebration with the dictionary banner shown, when the player presses the banner where no control lies, then the run continues and no sheet opens (`android`).
- Given the sync list and CAP-5's sections, when the plan checklist is read, then every item maps to the document and section edited, "already matches" or "owner item".
- Given rule-coverage.md, when the Rule-coverage map is read, then every row names a passing, non-skipped test on its Test kind's project whose title carries the row's id (P6 half of row 17 by its R-87 title).
- Given the finished tree, when `npm run test:all` and `npm run test:screens` run, then both are green and `git status --porcelain | grep -- -snapshots` prints nothing.

## Implementation Notes

- Task 1 (main session, 2026-10-24): `bmad-project-context` `record` run (Record: task, mistake, correction `c84a1df`, evidence per D1; covering-line check found AGENTS.md:75, amended; mechanically preventable: the existing `AD-19 every group is hidden, carries data-celebration…` and `R-87 the copies: 55 face copies…` tests are the check in place, component-only, so the prose stays). Diff: exactly the two D1 lines (2 insertions, 1 deletion); provenance line unchanged; nothing else proposed.
- Task 2 (fixture, D2): seed 1 (QU card 35 in column 3), found by a throwaway greedy search over a model of R-10–R-62 (`/tmp`, not committed), then replayed through the bundled engine. Script: the opening word takes column 5 whole onto column 6 with k = 4 (10 letters, cell 10); 19 more one-card or two-card words, each with every WordCell top it can use (R-33, R-41), fill cells 3–9 and empty columns 2, 4–8; the winning word takes column 3 whole onto column 1 with k = 7 and all eight free letters. Reached: 21 entries, 161 copies (52 + 109 free-letter uses), longest `ldxomiwlquejatazirshcgn` 23 letters, 22 cards with QU, cell 10; cursor `{21, idle}`, no redo tail. Words are inline-dictionary strings, not English. Registered: import, `ValidName` `'won-long-words'`, `VALID` and `REBUILDS` appended at the same index after won-words (both lists are chronological, not alphabetical), `PROPERTIES` entry (floors ≥ 20 entries and ≥ 100 copies, the longest `[23, 22, 10]` containing card 35, each `letterCount` = `wordLetterCount`, sort order), `WON_LONG_WORDS_DICTIONARY`; `'session-won-long-words.json'` in the AD-17 sorted list (before `session-won-words.json`).
- Task 3 (`step.test.ts`, D3): `LONG_WORDS` (21 rows `[cards, cell]`) joins both loops (9 bounce/exit and 3 pace tests, all green); the `PACES` keys were measured at Normal on 2026-10-24; the pin `AD-19 the session-won-long-words list's smallest copy scale at portrait 360x740 is 0.553 (A-D12; the device read judges it)` (0.5529, from the 22-card word; the 40 % floor is not reached). Unit suite, warm runs 2–4 of 4 on this checkout (docker-desktop bind mount over D:, not a Linux-filesystem checkout): before 3581 tests, wall 22.86 s median (vitest Duration 16.98 s); after 3597 tests, wall 22.94 s median (Duration 16.73 s). There is no measurable change. Both exceed AGENTS.md's 5 s budget, which is measured on a Linux-filesystem checkout, so the before and after figures are recorded but not judged.
- Task 4 (banner test, D4): `R-87 a press on the dictionary banner where no control lies does not skip the run` (android) widens `quietBarPoint`'s band type to `'banner'`. The test asserts the recorded press is `touch banner no control`, `running` true and no sheet. `npx playwright test e2e/celebration.spec.ts -g "dictionary banner"`: 2 passed on android (with the Reload test), 2 project skips.
- Tasks 5–9 (docs): edits as in the Close-out checklist below. No unbacked doc/build mismatch was found, so the checklist has no doc owner item. Build facts that the docs now state where D6 wording differed: `Esc` skips with Shift (only `Space` refuses Shift); `Esc` mid-run ends through the skip's `end()` (`ended` by `close`), not `pressEscape`.

### Close-out checklist (D10; CAP-5 sections and the story's sync list)

CAP-5 sections:
- EXPERIENCE.md message catalogue — already matches (`Words`, `n letters`/`1 letter`, `No words were played.` = `text.ts`).
- EXPERIENCE.md End sheet row — edited (X3: F16 hidden-page win, F28 run ended by hiding).
- EXPERIENCE.md Motion — edited (X8: F22 pace fit; a word still moving fades as a whole); cap formula already matched `celebrationCapMs`.
- DESIGN.md Words section — already matches (44 px rows, `--wc-hairline`, 14 px font floor).
- DESIGN.md Win celebration — edited (G2), layer order edited (G1), A-D12 edited (G3; "(to confirm on device, epic 10)" kept, verdict untouched).
- Spine AD-3 — already matches (`wordList` / `WordListEntry` amended 2026-10-20).
- Spine AD-13, AD-17, AD-19, Capability Map — edited (S1–S12 below).
- AGENTS.md celebration copies — edited by `record` (Task 1).
- rule-coverage.md no empty row — see the Rule-coverage map.

Sync list, ARCHITECTURE-SPINE.md:
- (a) `startCelebration` legality — edited, AD-13 celebration bullet (S1).
- (b) `attempt()` `CELEBRATION_KEYS` — edited, AD-13 celebration bullet (S2).
- (c) `mainInert` excludes `celebration` — edited, AD-13 celebration bullet (S1).
- (d) removal pops first, `end()`/`cancel()` — edited, AD-19 run-controller bullet (S6).
- AD-13 celebration sentence, WordCell press is a consumed skip — edited (S2); menu via `openMenu()` and F29 — edited (S2).
- AD-13 Binds `open-menu.ts`, `keys.ts` — edited (S3).
- AD-17 Celebration seam — edited (S4).
- AD-19 Rule bullet 1, per-card motion with F21–F23, F25–F27 — edited (S5).
- AD-19 `Celebration.svelte` bullet — edited (S7).
- AD-19 Start (F16) — edited (S8).
- AD-19 Duration — edited (S9; stale "`BASE_MS` (today module-private)" dropped).
- AD-19 Skip (F17–F19, tails, halted pass-through) — edited (S10; spine bug "unless a bar or banner control holds focus" removed).
- AD-19 Hide (F28, `installInterruptions`) — edited (S11), and so are AD-9, AD-16 boot order and AD-19 Amends.
- AD-19 Binds, Structural Seed and Map row — edited (S12).

Sync list, EXPERIENCE.md:
- IA row — edited (X1).
- Message row — edited (X2).
- End sheet row — edited (X3).
- § Keyboard (F15) — edited (X4–X7: prose, `Space`, `Enter`, `?`, `Esc`).
- Motion — edited (X8).
- "What plays" — edited (X9).
- "When" (e) — edited (X10).
- Skip, "Never plays", "Keys while it runs" — edited (X11; "to confirm at ticket review" dropped).
- A-E16 — edited (X11: F29, Replay not on a bar).
- Flow 8 step 2 — edited (X12).

Sync list, epic SPEC:
- CAP-2 — edited (P1).
- CAP-3 and F15 — edited (P2).
- CAP-6 and F12 — edited (P3).
- F24 — edited (P4).
- F25 — edited (P5).
- CAP-2 band text — already matches (P6).
- CAP-6 `dist-smoke` relaunch check (10.5 plan:164) — already matches: `e2e/pwa/dist-smoke.spec.ts` `R-87 a relaunch into a won game plays no celebration in the hook-free build`.

Sync list, rule-coverage.md:
- `step` and renderer rows reworded per card — edited (R1).
- Row 24 — edited (R2).
- Row 25 — edited (R3).
- 13 new rows F16–F23, F25–F29 — edited (R4).
- Exempt gains F29's back race — edited (R5).

Sync list, other documents:
- docs/game-flow-spec.md — edited: the R-87 banner wording and the dated preamble sentence (D5).

Owner items, applied at done:
- tickets.toml entry 7 `interface` — still names "end(hide-mode)" and "main.ts before-hide and resize registrations"; it should name plain `end()` and `installInterruptions`.
- Epic References — still give the F-range as "F1…F13"; it should be F1…F29.

### Rule-coverage map (D10)

Unless noted, the R-87 tests are in `e2e/celebration.spec.ts`, the AD-19 tests in `src/ui/celebration/*.test.ts` (Vitest), and the R-88 tests in `e2e/end-sheet.spec.ts` (android).

Rows 7–13 (engine and architecture, Vitest):
- R-86 rows 7–11 → `src/engine/view.test.ts`:
  - row 7: `R-86 a duplicate word gives equal entries in move order with different cards and cell`, `R-86 QU is lowercase qu, counts 2 and one card fewer than letterCount`, `R-86 a flipped word lists its cards in the committed order`, `R-86 cards stay in R-30 word order after a non-word setPlacementOrder before Confirm`
  - row 8: `R-86 orders by letter count descending, then spelling`, `R-86 a letter-count tie is alphabetical, not move order`
  - row 9: the duplicate-word test and `R-86 a WordCell top reused as a free letter appears in two entries`
  - row 10: `R-86 the pending draft and the redo tail are excluded, also when gaveUp`, `R-86 gaveUp with no committed word gives an empty list`
  - row 11: `R-86 the key is absent while playing and present for won and gaveUp`, `R-86 Undo of the finish leaves playing without the key; Confirm restores the list`
- Row 12 → `view.test.ts` `R-86 gameRecord keys and longestWord shape are unchanged by the widened replay`, plus `serialize.test.ts` `§2 %s parses, equals the fixture and re-serializes byte-equal` and `AD-17 %s.json equals its scripted accrue/apply rebuild` (won-words, won-long-words).
- Row 13 → `src/architecture-tree-scan.test.ts` `AD-1 every file under src/ except the architecture tests and their scan module passes the scan`; `src/architecture-ad2-ad12-ad17.test.ts` `AD-2 src/engine/index.ts exports exactly the AD-2 names, types and values`; `src/engine/index.test.ts` `AD-2 index exports … only at runtime`.

Rows 14–17 (celebration UI):
- Row 14 → `step.test.ts`: `AD-19 floor contact: …`, `AD-19 exited needs the whole box beyond its wall…`, `AD-19 group exit is its last card's exit…`, `AD-19 the run is deterministic…`, `AD-19 dt is clamped to 50 ms (500 equals 50)`, `AD-19 the cap: moving groups fade over the last baseMs…`, `AD-19 zero groups is finished at once`.
- Row 15 → `step.test.ts`:
  - `AD-19 waves overlap at ${name}…`
  - `AD-19 the launch rises…`
  - `AD-19 every card bounces on the floor, then exits, all before the closing fade (${geometry}, ${name}, ${list})`: 3 geometries × Fast, Normal and Slow × 3 lists, the long-words list included
  - `AD-19 the physics scales with the speed… (SPEC F23, F25)`
  - `AD-19 the closing fade lasts baseMs at ${name}…`
- Row 16:
  - `celebration.svelte.test.ts`: `AD-19 a shown dictionary banner tops the band…`, `AD-19 a zero-height banner does not count…`, `AD-19 a 23-letter row is drawn scaled to fit the 360 px band…`, `AD-19 each group launches from its own WordCell label (SPEC F8)…`
  - `Celebration.test.ts`: `AD-19 the container is fixed to the band and clips to it…`, `AD-19 each copy shows its own card letter in word order, at the board card height`
  - `step.test.ts`: `AD-19 a 23-letter word is scaled as its row would span 90 % of the band (A-D12; SPEC F26: no row is drawn)`, plus the new long-words scale pin
- Row 17 → U: `Celebration.test.ts` `AD-19 every group is hidden, carries data-celebration and aria-hidden, and has no live-card attributes` and `AD-19 the live [data-card-id] count is unchanged…`. P6 half, by its R-87 title (android): `R-87 the copies: 55 face copies beside the 52 live cards, none live or a mirror, each group spelling its word, a group shown by the run`.

Rows 18–30 (R-87, android unless noted):
- Row 18 → `R-87 a win plays the celebration with the sheet hidden; its end pops the entry before the sheet opens expanded with Replay this deal focused`.
- Row 19 → `R-87 the copies: 55 face copies …`.
- Row 20 → `R-87 a touch press on ${name} skips the run, consumed: …` ('an empty band point', 'a non-empty WordCell').
- Row 21 (desktop) → `R-87 Space skips the run: its repeat once Replay this deal has focus and its release activate nothing`, `R-87 Esc skips the run: the sheet expanded with Replay this deal focused, Session unchanged`.
- Row 22 → `R-87 back skips the run: the sheet expanded and the app open; back again collapses the sheet, the app still open`.
- Row 23 → `R-87 hiding the app mid-run ends it with no sheet and no overlay entry; …`, `R-87 ${name} mid-run ends it: …` ('a resize', 'an orientationchange').
- Row 24:
  - desktop: `R-87 ? and WordCell Enter do nothing while it runs; Z, Ctrl+Z and N cancel it, each its own run (Y restores the win)`, `R-87 a mouse click on a non-empty WordCell hovered past the long-press time skips the run, …`
  - android: `R-87 a touch press on a non-empty WordCell skips the run, consumed: …`
- Row 25 → `R-87 a touch held on an empty band point from before the Confirm, released mid-run, does not skip it`, `R-87 the dictionary banner’s Reload pressed mid-run refetches and does not skip the run`, `R-87 a press on the dictionary banner where no control lies does not skip the run` (new).
- Row 26 → `R-87 ☰ ends the run, the sheet expanded behind the menu; back closes the menu only`.
- Row 27 → `R-87 the Undo button stops the run: no end sheet, no overlay entry`, `R-87 New game stops the run: no end sheet, no overlay entry; back leaves the app`.
- Row 28 → `R-87 a Redo that restores the win plays it again: the first run is gone and a new group is shown`, `R-87 Undo mid-run, then a Redo that restores the win, then the run’s end: exactly one end sheet, expanded`.
- Row 29 → `R-87 a Give up plays no celebration: the sheet opens expanded at once`, `R-87 a reload mid-run is a relaunch: the sheet opens expanded at boot and no copy is drawn`, `R-87 under reduced motion a win plays no celebration: the sheet opens expanded`; plus `e2e/pwa/dist-smoke.spec.ts` `R-87 a relaunch into a won game plays no celebration in the hook-free build` (dist-smoke).
- Row 30 → `R-87 at Fast the run ends by the cap rounded up to a 16 ms step: sheet expanded`, `R-87 at Slow the run still runs after the Fast cap and ends by the Slow cap rounded up to a 16 ms step: sheet expanded`.

Rows 31–32 (CAP-6):
- Row 31 (dist-smoke) → `e2e/pwa/dist-smoke.spec.ts` `R-87 hook-free build: a real win plays and a press skips it to the expanded end sheet`, `R-87 hook-free build: a real win plays and back skips it to the expanded end sheet, the app still open`.
- Row 32 → `e2e/test-hook.spec.ts` (android, desktop) and `e2e/pwa/test-hook.spec.ts` (pwa): `AD-17 test hook is present under the dev server: … celebration` / the test-build twin, and `AD-17 the celebration seam is off by default under the dev server: …` / the test-build twin.

New rows (SPEC F16–F29):
- F16:
  - P6: `R-87 a page hidden when the win settles plays no celebration: the sheet is expanded on return`, `R-87 under reduced motion a win plays no celebration…`
  - U: `src/ui/end-sheet.test.ts` `AD-19 reduced motion, the flag off or a hidden page at settle run today's open only`, `AD-19 done on a hidden page opens nothing until whenVisible resolves, then expanded with no announce`. The "no entry pushed" half is asserted by U only.
- F17:
  - P6 desktop: `R-87 Space skips the run…`, `R-87 Esc skips the run…`, `R-87 Shift+Space, Ctrl+Space, Alt+Space and Meta+Space do not skip the run and never activate the focused New game; Esc then skips it`, `R-87 a Shift+Space held past the repeat delay, its Shift released before the Space, …`
  - U: `skip.test.ts` `AD-19 Space and Esc skip with a focused ${band} control (no focus is read; SPEC F17)` and its F17 siblings.
- F18:
  - P6: `R-87 a quick second tap on Replay this deal after a touch press skip is consumed (SPEC F18): …`
  - U: `skip.test.ts` `AD-19 a new press (id ${pointerId}) within 300 ms after the release is consumed: … (SPEC F18)`.
- F19:
  - P6: `R-87 a touch just beside ${name}, outside its rect, skips the run, consumed: …` ('the top bar', 'the action bar')
  - U: `skip.test.ts` `AD-19 a press whose point is beside the ${band} but whose target is retargeted onto it (touch adjustment) skips: …`.
- F20 → `Celebration.test.ts` `AD-19 SPEC F20, F26: the copies carry no layout or visibility of their own …`; `step.test.ts` `AD-19 SPEC F20, F26: card k is hidden at the launch point until …`.
- F21 → `celebration.svelte.test.ts` `AD-19 SPEC F21, F23, F26: the first frame shows only the leading copy, …`; `step.test.ts` `AD-19 SPEC F23: letter order holds all run, …`.
- F22 → `step.test.ts` `AD-19 SPEC F22, F27: the card-unit trail fits each word on the real layouts, at the natural tempo or a measured pace (${geometry}, Normal, ${list})`, `AD-19 a trail that would overrun is fitted: the group plays its arc faster, …`.
- F23 → `step.test.ts` `AD-19 SPEC F23: consecutive cards are CARD_STEP card units apart along the path …`, `AD-19 SPEC F23: the gap is in card units: …`, `AD-19 SPEC F23 stacking: each frame the stack follows y …`; `celebration.svelte.test.ts` `AD-19 SPEC F23 stacking: each copy gets the z-index of its place by y …`.
- F25 → `step.test.ts` `AD-19 SPEC F25: one constant speed per word: …`, `AD-19 SPEC F25, F27: one speed per word, not per lap: …`.
- F26 → `step.test.ts` `AD-19 per-cell origins (SPEC F8, F26): …`, `AD-19 SPEC F26: no card is ever on the old row line: …`; `celebration.svelte.test.ts` `AD-19 SPEC F23 stacking, F26: a re-registration writes every copy's z-index and visibility again …`.
- F27 → `step.test.ts` `AD-19 SPEC F27: drifts toward the farther wall: …`, `AD-19 SPEC F27: a word crosses the band and exits past the far wall, …`, `AD-19 SPEC F27: every card makes the word's \`contacts\` floor contacts …`.
- F28:
  - P6: `R-87 hiding the app mid-run ends it with no sheet and no overlay entry; a second flush changes nothing; …`
  - U: `attached.test.ts` `AD-19 installInterruptions registers one hide callback and one resize and one orientationchange listener`, `AD-19 the hide callback twice gives one pop and one done (after a microtask); the second is a no-op`.
- F29:
  - P6: `R-87 a double ☰ tap mid-run gives one menu and no Halted surface` (android), `R-87 M twice mid-run gives one menu over the expanded sheet and no Halted surface` (desktop)
  - U: `attached.test.ts` `AD-19 openMenu() drops the deferred open when the top is not endSheet at the settle`.

R-88 and Words rows (android unless noted):
- R-88 list for won and gaveUp → `R-88 a won sheet lists the ten words in order, SURF twice`, `R-88 a give-up with words lists the nine remaining words`.
- R-88 order → `R-88 a won sheet lists the ten words in order, SURF twice`.
- R-88 empty list → `R-88 a zero-move give-up shows the heading and the empty line, no list`.
- R-88 latest game only → `R-88 Undo of the finish removes the list and a later Give up lists the other words`, `R-88 New game removes the list`, `R-88 Replay removes the list`.
- R-88 relaunch → `R-88 the won list survives a reload`, `R-88 the give-up list survives a reload`.
- R-88 nothing stored → `R-88 scrolling, collapsing and expanding leave localStorage untouched`.
- AD-3 (Vitest) → `src/ui/end-sheet.test.ts` `AD-3 the rows equal the stubbed view.wordList`, `AD-3 an empty wordList renders the heading and the empty line, no list`, `AD-3 an undefined wordList on a finished view throws`.
- DESIGN.md Words row → `R-88 a 20-letter word shrinks below 16 px but not under 14 px and stays on one line beside its count at 360 px` (by its R-88 title).
- Words screenshots (screens) → `e2e/end-sheet.screens.spec.ts` `AD-17 end sheet screenshot with the Words list in Charcoal at 360 px` and `… in Paper at 360 px`.

No test above is `skip`, `fixme` or `todo`. The android and desktop tests run only on their own project (`onAndroid`/`onDesktop`). Every title above passed in the run below.

### Verification results (2026-10-24)

`test:all` was run as its sub-scripts in order, because an unattended single run was cut off mid-e2e.
- `lint`: exit 0. One pre-existing warning, `e2e/end-sheet.spec.ts:845` `noNonNullAssertion`, in a file this ticket does not touch.
- `check`: 0 errors, 0 warnings.
- `test`: 90 files, 3597 tests passed.
- `build`: size budget 559,957 / 600,000.
- `test:e2e:dist`: 21 passed.
- `test:e2e` android: 839 passed, 225 skipped, 1 failed. The failure was `e2e/nav.spec.ts:162` `§2 AD-13 a double tap on New game on the rejected root opens the notice at wc 1 and no Reset confirm`, a spec this ticket does not touch. It passed 8 of 8 alone (`--repeat-each=8`), so it is a load flake.
- `test:e2e` desktop: 254 passed, 811 skipped.
- `test:e2e:pwa`: 17 passed.
- `test:screens` (container): 67 passed, 39 project skips.
- `git status --porcelain | grep -- -snapshots`: no output.
- `npx playwright test e2e/celebration.spec.ts -g "dictionary banner"`: 2 passed on android.
- `git diff --stat AGENTS.md`: 2 lines changed, 1 of them added (Task 1).

### Owner items and handoff (D11)

- Applied at done by the owner's done session:
  - tickets.toml entry 7 `interface`: plain `end()`, `installInterruptions`.
  - Epic References F-range: F1…F29.
  - A-D12 verdict: into the epic Notes and DESIGN.md A-D12.
- Fixture facts:
  - Words are inline strings, not English.
  - Smallest scale: 0.553 at 360x740, from the 22-card word (floor 0.4 not reached).
  - These values are pinned at `step.test.ts` geometries (360x740 reference); the owner's phone (Pixel 7 class, 412x839) may differ.
  - F22-paced entries at 360x740 (pace > 1), as list index, word, cards, cell, pace:
    - 0 `ldxomiwlquejatazirshcgn` 22/10 1.19
    - 1 `naentscfsz` 10/10 1.173
    - 7 `rhfarvsz` 8/5 1.02
    - 8 `svtnorpi` 8/4 1.052
    - 9 `yocemzph` 8/3 1.466
    - 11 `nseviap` 7/4 1.152
    - 12 `ochsrfe` 7/6 1.198
    - 13 `pzfntah` 7/3 1.678
    - 14 `rmhosea` 7/5 1.293
    - 15 `rhozsi` 6/6 1.332
    - 16 `vstmif` 6/4 1.387
    - 17 `fcpso` 5/3 1.427
    - 18 `hifzo` 5/5 1.501
    - 19 `misz` 4/4 1.548
    - 20 `poz` 3/3 1.594
  - So 15 of the 21 entries hop faster on a long list, the late short words most.
  - Shortfall against the carried items: 161 copies, not "a few hundred". The 23-letter row, ≥ 20 entries and ≥ 100 copies were all reached.
- Command: `node scripts/device-preview.mjs session-won-long-words`.
  - The seeded won Session opens in Game over with no celebration (R-73). Undo then Confirm plays the win; reopen the seed URL to reset.
  - Read in the Chrome tab the seed page opens: the toolbar show/hide residual exists only there. The installed PWA is optional for the rest.
- Checklist for the read:
  - long-list frame rate and readability
  - smallest scale
  - hide mid-run (sheet waiting on return, F28)
  - the Words section on the sheet
  - no left-behind copies or colour change
  - the 10.7 residuals: toolbar show/hide ends the run; ☰ then an immediate back; a bfcache return mid-run
  - the sheet's history push after the hide callback
  - per-word tempo of the paced entries above
  - Each item is recorded as accepted, changed in this ticket, or a cleanup-only 10.10 item.
- Read-asked changes: applied by a follow-up session the owner starts on this ticket, as 10.6's Tuning was:
  - a new SPEC F-row (next is F30) and a doc re-sync
  - a tuning `/review-loop` on the diff
  - `test:all` and `test:screens` rerun, regenerating in the container only the baselines the change touches
- Ticket wording (owner, at done): Notes bullet 1 names only "the AGENTS.md pitfall", while bullet 2 authorises both lines. This build read bullet 1 as including the Conventions-line exception.
- Stale names (not renamed, for 10.10):
  - test title `Celebration.test.ts` `AD-19 every group is hidden, carries data-celebration…` (the copies carry it)
  - code comments in `interruptions.ts` ("pending the owner's rule 7 nod", settled by F28) and `step.ts` (spine wording)
  - `onEnd` has no production caller

## Plan Change Log

## Review Triage Log

### 2026-10-24 — Review pass
- verdicts: 35 findings — high 0, medium 5, low 21, false 9, maybe-false 0
- findings:
  - `false` `reject` (blind) EXPERIENCE.md cites F19 for the chorded/repeat `Space` — SPEC F19 itself decides "a chorded or repeat `Space` during the run never activates a focused control"; F17 was added beside it anyway in the Keys bullet.
  - `low` `patch` (blind) EXPERIENCE.md Skip's "exactly as a normal finish does" ignores the silent return after a hide — appended "(after a hide, on return and unannounced, F28)".
  - `low` `patch` (blind) EXPERIENCE.md omits `Esc`'s repeat/chord rule (`skip.ts` onKey returns on `e.repeat || chord` for `Escape`) — `Esc` row and Keys bullet now say a repeat or Ctrl/Alt/Meta `Esc` does nothing.
  - `medium` `patch` (blind) rule-coverage F16 row leads with R-87 but its "no entry pushed" half is covered only by UI Vitest (never R-id coverage, AGENTS.md) — split into an R-87 P6 row (hidden-page win, `R-87 a page hidden when the win settles…`) and an AD-19 U row (no entry pushed: `AD-19 reduced motion, the flag off or a hidden page at settle run today's open only`).
  - `medium` `patch` (blind) `LONG_WORDS` in step.test.ts is a hand copy never checked against the fixture — the `won-long-words` property now pins the full `[cards.length, cell]` list; the `LONG_WORDS` comment points at it.
  - `low` `patch` (blind) `won.wordList ?? []` and `list[0]?.` in the new property hide an absent list — throws on an absent `wordList`, indexes directly.
  - `low` `patch` (blind) the fixture comment says twenty one- or two-card words, but the opening word is 10 cards — comment rewritten (opening 10-card word, nineteen short-source words, the final 22-card word).
  - `false` `reject` (blind) "R-37 trusts committed words" mis-cites — the same citation is the established one in serialize.test.ts (the `won-words` comment at :347 and its R-37 test); not introduced here.
  - `low` `defer` (blind) `test:all` never seen as one green run; android `e2e/nav.spec.ts:162` failed — pre-existing load flake (digest 10.4–10.6); rerun after patches: every sub-script green, android 839 passed with that one failure, which passed 5/5 alone; deferred.
  - `low` `reject` (blind) unit 5 s budget not measured on a Linux checkout — 16 new pure tests (≈ ms); the bind-mount median (22.9 s) is unchanged before/after; the measurement environment is not this change's.
  - `false` `reject` (blind) plan frontmatter `in-review`, empty triage log and change log — a mid-run snapshot; Finalize sets `built`; the change log records review loopbacks only.
  - `low` `reject` (blind) AGENTS.md diff figures disagree inside the plan — fix is editing this build's plan.
  - `low` `patch` (blind) A-E16 and A-D12 edited under their old confirmation dates — each gains "(amended 2026-10-24, epic 10 SPEC F29/F20)".
  - `false` `reject` (blind) rule-coverage legend omits the new fixture — no Playwright row uses `session-won-long-words`; it is the device-read fixture.
  - `low` `reject` (blind) plan row numbers shifted by the inserted rows — fix is editing this build's plan.
  - `low` `reject` (blind) spine AD-19 Tests bullet not extended — it names test kinds generically and contradicts nothing in the build; not a sync-list item.
  - `low` `patch` (blind) PACES comment blames edge WordCells only — reworded: later words launch nearer the cap and edge words cross the whole band.
  - `low` `reject` (blind) the banner test covers touch only — `skip.test.ts` `AD-19 a press on a ${band} target passes through…` covers every primary press on the banner band; a mouse P6 duplicate adds no R-87 sentence.
  - `low` `patch` (blind) `quietBarPoint` comment still says "bar" — now "a bar or the dictionary banner".
  - `low` `patch` (blind) SPEC F25 "one constant speed per word" doubled — "per word" dropped once.
  - `false` `reject` (blind) F25 drops "laps within about 7 %" — the ticket review (pass 3 default) drops the unverified lap percentage on purpose.
  - `low` `patch` (blind) SPEC F15 ends with two parentheticals — merged "(R-87; AD-13)".
  - `medium` `patch` (edge) `LONG_WORDS` drift — grouped with the blind `LONG_WORDS` finding; same patch.
  - `low` `patch` (edge) EXPERIENCE.md `Esc` chord/repeat claim — grouped with the blind `Esc` finding; same patch.
  - `medium` `patch` (verification-gap) the property pins only part of the list, so `LONG_WORDS`, `PACES` and the 0.553 pin can drift — grouped; same patch.
  - `false` `reject` (intent) the diff exceeds the Description (fixture, tests) — the ticket Notes prescribe each piece.
  - `medium` `patch` (intent) F16 row's "no entry pushed" clause has no R-id coverage — grouped with the blind F16 finding; same patch.
  - `low` `reject` (intent) the plan's map truncates titles with "…" — fix is editing this build's plan.
  - `low` `defer` (intent) `test:all` substitute evidence — grouped with the blind flake finding.
  - `false` `reject` (intent) that the skill ran rests on the plan note — the main session ran `record` (Implementation Notes Task 1); the diff is exactly its two lines.
  - `low` `reject` (intent) extra doc edits (AD-9, AD-16, `act()`, shadow token) lack a cited record per line — fix is editing this build's plan; each matches the build.
  - `low` `reject` (intent) sync-list items mapped per document, not per source line — fix is editing this build's plan.
  - `false` `reject` (intent) the 20 shorter words could have been English — the ticket asks only to say whether they are real; the plan does, and the read judges letter legibility.
  - `false` `reject` (intent) status `in-review` vs `built` — mid-run snapshot.
  - `low` `reject` (intent) unit budget on the bind mount — grouped with the blind budget finding.

## Design Notes

**D1 AGENTS.md record.** Task: epic 10 celebration renderer (10.1–10.3). Mistake: `data-celebration` was put on the group elements, not on each card copy, and AGENTS.md:75's "every other copy is a mirror" told agents a non-live copy is a mirror. Correction: `c84a1df` (2026-10-23 Opus review). Costly: shipped through three tickets, caught only by a post-close review. Covering-line check: :75 covers card copies and is wrong for these, so the fix amends it (else two contradictory instructions). Mechanically preventable: the check already in place is `src/ui/celebration/Celebration.test.ts` `AD-19 every group is hidden, carries data-celebration and aria-hidden, and has no live-card attributes` and `e2e/celebration.spec.ts` `R-87 the copies: 55 face copies beside the 52 live cards, none live or a mirror, …`; they guard this component only, so the prose stays. Lines (owner-authorised, ticket Notes):
- Known pitfalls, after :82: "Win-celebration copies (`src/ui/celebration/`, AD-19) are neither live elements nor mirrors: each copy (not its group) carries `data-celebration`, never `data-card-id`, `data-testid` or `data-mirror-of`, and never takes part in a FLIP glide."
- :75 ends: "every other copy is a mirror (see Known pitfalls), except the win celebration's copies (`data-celebration`, see Known pitfalls)."
Anything else the skill proposes stays unwritten and is listed as an owner item. Provenance line unchanged.

**D2 Fixture.** Target: a won Session, last move the winning Confirm, no redo tail; `wordList` ≥ 20 entries, ≥ 100 copies (Σ `cards.length` = 52 + free-letter uses), longest 23 letters = 22 cards with the QU card 35 (R-37: source 7 + destination k 7 from two full columns 1–4, plus 8 free letters, so all eight WordCells non-empty first; cell 10 needs an earlier ≥ 10-letter word, R-40). Words are the strings the cards spell, not English words (no ENABLE word of 22–23 letters contains `qu`); the read judges letter legibility, not word sense. Registration: import, `ValidName` `'won-long-words'`, `VALID` and `REBUILDS` at the same index (sorted as the others), `PROPERTIES` entry asserting won, cursor, `wordList.length ≥ 20`, Σ cards ≥ 100, the longest entry's `letterCount` 23 and 22 cards (or the reached values if short, D11), each `letterCount` = `wordLetterCount`, sort order. The search script lives under `/tmp` and is not committed; record the seed and counts here.

**D3 step.test.ts.** `LONG_WORDS` = the fixture's `wordList` as `[cards.length, cell]` rows, inline beside `FIXTURE`, added to the bounce/exit loop (:1012-1015) and the pace loop (:1063-1066) as `'the session-won-long-words list'`; `PACES` keys for portrait 360x740, desktop 1280x720, landscape 839x412 (measured). One test `AD-19 the session-won-long-words list's smallest copy scale at portrait 360x740 is <value> (A-D12; the device read judges it)`, pinning `min(g.scale)` to 3 digits. If a loop fails for this list: record an owner item, revert `step.test.ts` and the fixture work stays; HALT `blocked`. Measure warm `npm test` wall time (3 runs, median) before and after; both recorded; over 5 s → note it (budget is measured on a Linux checkout).

**D4 banner test.** Pattern: :575 (route `**/en*.txt` → 500, `waitForDictionary(page,'failed')`), then a touch at a banner point whose `elementFromPoint` has no control ancestor (assert it, as `quietBarPoint` does), `animationFrames(page,3)`, `running` true, sheet count 0.

**D5 R-87.** R-87 line 376 "outside the top and action bars" → "outside the top and action bars and the dictionary banner". Preamble, after the v0.11 sentence: "On 2026-10-24 the owner amended R-87's press skip to exempt the dictionary banner as well (epic 10 close-out)." No version bump.

**D6 Spine** (wording from the investigation, cite SPEC Fnn):
- S1 AD-13 :656 `startCelebration` legality: closes a sticky `wordcellView` first, no peek, sheet hidden ((a)); `attempt()` lets `CELEBRATION_KEYS` (undo, newGame, menu) through ((b)); `mainInert` excludes `celebration` ((c)); removals by `closedByBack`, `close`, `resetForNewSession()` or `onUnfinished()`, reasons `ended`/`cancelled`; History notice caveat (opens only at boot or after a rejected-root New game).
- S2 AD-13 :656 keys: `?`, WordCell `Enter` and other game keys do nothing; a WordCell press is a consumed skip (AD-19 Skip); Playwright line likewise. Menu: `openMenu()` (`src/ui/open-menu.ts`) calls `end()`, then after nav settles `openSurface('menu')` in `act()` only when `endSheet` is on top; a back or an open menu in between drops it (F29).
- S3 AD-13 Binds :577-578: add `src/ui/open-menu.ts`, `src/ui/keys.ts`.
- S4 AD-17 :838: the hook-free R-87 specs in `e2e/pwa/dist-smoke.spec.ts` end the run by a press or back; 10.8 audited the rest (none wins by play); seam methods throw until registered, `advance` throws with no live run, `setEnabled` throws mid-run and sets manual mode, flag defaults on and only the hook-build block in `main.ts` turns it off.
- S5 AD-19 Rule bullet 1 :965: per-word closed-form path, per-card position from elapsed time; card k one `CARD_STEP` (0.65) of arc behind, appears at the launch point in turn (F21, F23, F26); one constant speed per word (F25) toward the farther wall (F27); launch time from entry index; gravity from cap and band height; card count and cap fit the pace (vx, vy × pace, gravity × pace², F22).
- S6 AD-19 rule :966 ((d)): every removal pops the entry, then the callback stops the run and queues `done` unless `cancelled`; `end()` the run-driven path and the only one firing `onEnd`; `cancel()` legal only with no entry; `act()` cancels and clears the tile selection; menu via `openMenu()`.
- S7 `Celebration.svelte` bullet :968: band = AD-12 visible band (below the top bar or a shown dictionary banner); one group element of copies, 35 % overlap along the path (F20), no launch row (F26), scaled to fit (90 %, 40 % floor); per frame `opacity` per group, `transform` per shown copy, `visibility: hidden` until shown, `z-index` on a stack change.
- S8 Start :969 (F16): pushed and started only with the seam on, motion not reduced and the page visible at the settle (a long-press cancelled first); otherwise today's open, no history entry; `done` defers silently to `whenVisible()` on a hidden page.
- S9 Duration :970: each word's last card fitted out by cap − 1 × base; a word still moving fades as a whole over the last base; ends by the cap.
- S10 Skip :971: wording from the investigation (capture `pointerdown`/`keydown`; press point via `elementFromPoint`, F19; whole banner exempt; non-repeat unchorded `Space` or `Esc` whatever holds focus, F17; other `Space` only default-prevented; press tail with 300 ms click swallow and `SWALLOW_MS` press guard, F18; Space tail; pass-through while halted).
- S11 Hide :967 (F28): `installInterruptions` (`src/ui/celebration/interruptions.ts`, called once by `main.ts`) registers one callback with `registerBeforeHide` and on `resize`/`orientationchange`; ordinary `end()` unless halted, pops the entry, idempotent; `done` opens at the next `whenVisible()`. AD-9 :412-417 and AD-19 Amends :974 name `installInterruptions`; AD-16 boot order adds `attachOverlays()` after `nav.register` and `installInterruptions` plus the hook seam beside `registerBeforeBack`.
- S12 AD-19 Binds :962 (+ `open-menu.ts`, `keys.ts`, `App.svelte`, `gestures/click-swallow.ts`, `gestures/visible-band.ts`), Structural Seed :1022 (+ `skip.ts`, `interruptions.ts`, `ui/open-menu.ts`), Map :1118 (+ `ui/open-menu.ts`, `ui/keys.ts`, `shell/test-hook.ts`, `main.ts`).

**D7 EXPERIENCE.md / DESIGN.md.** X1 IA :49 cards pour out one behind another. X2 message row :116 (F28): silent only for a sheet opened while hidden (F16 win settled hidden, F28 run ended by hiding). X3 End sheet row :172 (F16, F28). X4 Keyboard prose :343-345 (F15). X5 `Space` :376 whatever holds focus, chorded/repeat does nothing (F17). X6 `Enter` :379, `?` :385 nothing while it runs. X7 `Esc` :382 whatever holds focus. X8 Motion :412 F22 pace sentence. X9 "What plays" :432 (F20–F27, drop "tuning values for the ticket"). X10 "When" :433 ((e): no input of its own, not HTML `inert`; page visible, F16). X11 Skip :434 (F18, F19, F28, F29; Undo and New game stop it, Replay not on a bar) and A-E16 :675 (F29); "Never plays" :435 (F16); "Keys while it runs" :436 (WordCell press skips, R-87; F15, F17; drop "to confirm at ticket review"). X12 Flow 8 step 2 :607 (F26, F27). G1 DESIGN layer order :494-495 band below a shown banner. G2 Win celebration :692 35 % along the path, no launch row, ceiling below a shown banner, shadow `--wc-shadow-drag`. G3 A-D12 :753 overlap 35 %, per-card trail, no launch row; "(to confirm on device, epic 10)" kept; verdict at done.

**D8 Epic SPEC.** P1 CAP-2: per-card motion along each word's path (F21, F23, F25–F27), 35 % overlap (F20), no launch row, `opacity` per group, `transform` per shown copy. P2 CAP-3 and F15: "`?`, WordCell `Enter` and every other game key do nothing; a WordCell press is a consumed skip (R-87)". P3 CAP-6 and F12: hook-free winning specs skip by a press or back. P4 F24 row: "(superseded by F25: its speed rule)". P5 F25: "set so … did" → "one constant speed per word along its unchanged path, the run as long as the path's (device-approved 2026-10-24)"; cut "so the run length is back to before F24" and the "As built …" sentence. P6 CAP-2 band text unchanged (already the AD-12 band).

**D9 rule-coverage.md.** R1 rows 15/16 reworded per card (copies scaled, each card bounces and exits, no launch row). R2 row 24: "R-87 `?` and WordCell `Enter` do nothing while it runs, a WordCell press is a consumed skip; `N` and Undo keys act" (P6, android + desktop). R3 row 25: "…; a press anywhere on the dictionary banner is not a skip". R4 new rows, each `R-87 …`/`AD-19 … (SPEC Fnn)` with kind: F16 (P6, U), F17 (U, P6 `desktop`), F18 (U, P6), F19 (U, P6), F20 (U), F21 per-card follow (U), F22 (U), F23 (U), F25 (U), F26 (U), F27 (U), F28 (U, P6), F29 menu-already-open (U, P6). R5 Exempt: F29's ☰-then-immediate-back race (device read). No Test column.

**D10 Rule-coverage map.** One line per row: row text → file → full title(s) → project. Investigation map (tests named) covers rows 7–41 and F16–F29; row 12 by `R-86 gameRecord keys and longestWord shape are unchanged by the widened replay` plus the serialize round-trips; row 32 and 41 by their AD-17 titles; row 40 by its R-88 title (DESIGN.md is the source, not an id). Checklist line for CAP-6 (10.5 plan:164): the `dist-smoke` relaunch check is "already matches" by `e2e/pwa/dist-smoke.spec.ts` `R-87 a relaunch into a won game plays no celebration in the hook-free build`. Confirm each green in the `test:all`/`test:screens` run.

**D11 Owner items and handoff** (Implementation Notes, then the Auto Run Result):
- Applied at done by the owner's done session: tickets.toml entry 7 `interface` (plain `end()`, `installInterruptions`); epic References F-range F1…F29; A-D12 verdict into the epic Notes and DESIGN.md A-D12.
- Fixture facts: words are not real English (inline strings); smallest scale and F22-paced entries are pinned at `step.test.ts` geometries (360x740 reference); the owner's phone may differ. List the paced entries (pace > 1) at 360x740 from `PACES`. Any target shortfall.
- Command: `node scripts/device-preview.mjs session-won-long-words`; seeded won Session opens in Game over with no celebration (R-73): Undo then Confirm plays the win; reopen the seed URL to reset. Read in the Chrome tab the seed page opens (the toolbar show/hide residual exists only there); the installed PWA is optional for the rest.
- Checklist: long-list frame rate and readability; smallest scale; hide mid-run (sheet waiting, F28); Words section on the sheet; no left-behind copies or colour change; 10.7 residuals (toolbar show/hide ends the run, ☰ then immediate back, bfcache return mid-run); the sheet's history push after the hide callback; per-word tempo of the paced entries. Each: accepted, changed in this ticket, or a cleanup-only 10.10 item.
- Read-asked changes: applied by a follow-up session the owner starts on this ticket (a `bmad-build-auto` follow-up pass or an interactive session), as 10.6's Tuning: new SPEC F-row, doc re-sync, a tuning `/review-loop` on the diff, `test:all` and `test:screens` rerun, only touched baselines regenerated in the container.
- Ticket wording (owner, at done): Notes bullet 1 names only "the AGENTS.md pitfall"; bullet 2 authorises both lines, so this build reads bullet 1 as including the Conventions-line exception.
- Stale test title (not renamed, 10.10): `Celebration.test.ts` `AD-19 every group is hidden, carries data-celebration…` (the copies carry it).

## Verification

**Commands:**
- `git diff --stat AGENTS.md` -- expected: 2 lines changed after `record`.
- `npm test` (3 warm runs before and after) -- expected: green; medians recorded.
- `npm run test:all` -- expected: exit 0.
- `npm run test:screens` -- expected: green; then `git status --porcelain | grep -- -snapshots` prints nothing.
- `npx playwright test e2e/celebration.spec.ts -g "dictionary banner"` -- expected: the new test passes on `android`.

**Manual checks (if no CLI):**
- Each Close-out checklist line names an edited section, "already matches" or "owner item"; each Rule-coverage map line names a title carrying the row's id.

## Auto Run Result

- **Summary:** Epic 10 close-out (ticket 10.9) built: AGENTS.md carries the two authorised celebration-copy lines through one `bmad-project-context` `record` run; the spine (AD-9, AD-13, AD-16, AD-17, AD-19, Seed, Map), EXPERIENCE.md, DESIGN.md, the epic SPEC (CAP-2, CAP-3, CAP-6, F12, F15, F24, F25), rule-coverage.md (rows reworded, 14 new rows, F29 back race to Exempt) and R-87 (dictionary banner exemption, dated preamble sentence) match the build; a long device-read fixture `session-won-long-words` (seed 1: 21 words, 161 copies, longest 23 letters in 22 cards with QU) with its registrations and `step.test.ts` rows (smallest scale 0.553 at 360x740); one android test for a banner press. Status `built`; the owner's Android read is the done checkpoint.
- **Files changed:**
  - `AGENTS.md` — Conventions-line exception and the celebration-copy pitfall.
  - `fixtures/session-won-long-words.json` — the device-read won Session.
  - `src/engine/serialize.test.ts` — fixture registered (VALID, REBUILDS, property with counts and the full row list).
  - `src/architecture-ad2-ad12-ad17.test.ts` — fixture list entry.
  - `src/ui/celebration/step.test.ts` — `LONG_WORDS` in both scene loops, three `PACES` keys, the smallest-scale pin.
  - `e2e/celebration.spec.ts` — `R-87 a press on the dictionary banner where no control lies does not skip the run`.
  - `docs/game-flow-spec.md` — R-87 banner exemption, preamble amendment sentence.
  - `ARCHITECTURE-SPINE.md`, `EXPERIENCE.md`, `DESIGN.md`, epic `SPEC.md`, `rule-coverage.md` — synced to the build (Close-out checklist above).
- **Review:** thorough, one pass, 35 findings (high 0, medium 5, low 21, false 9). Patched: 2 medium entries (the fixture row list pinned against `LONG_WORDS`; the F16 coverage row split into R-87 P6 and AD-19 U) and 10 low entries (EXPERIENCE `Esc` chord/repeat and hide wording, amendment dates on A-E16/A-D12, test fallbacks and comments, SPEC wording). Deferred: the pre-existing `e2e/nav.spec.ts:162` load flake. Rejected: 9 false, 9 low (plan-only edits, generic Tests bullet, mouse duplicate of the banner test, unit budget environment) with reasons in the triage log. Patches applied in the main session (the implementing subagent resumes only asynchronously).
- **Follow-up review recommended:** false. Patched by verdict: medium 2, low 10. Both medium patches are a test assertion and a coverage-doc row, verified green; no specific unverified risk remains to name.
- **Verification:** after the patches: `lint`, `check`, `test` (3597 passed), `build` (559,957 / 600,000), `test:e2e:dist` (21 passed), `test:e2e` desktop (254 passed), `test:e2e:pwa` (17 passed) all exit 0; `test:e2e` android 839 passed, 1 failed (`e2e/nav.spec.ts:162`, pre-existing flake, 5/5 alone); `test:screens` 67 passed, 39 project skips (implementation run; the patches touched no UI); `git status --porcelain | grep -- -snapshots` empty.
- **Residual risks / owner items:** the device read (checklist and command in Owner items and handoff); tickets.toml entry 7 `interface`, epic References F1…F29 and the A-D12 verdict at done; 161 copies vs "a few hundred"; scale and pace pinned at 360x740, the phone may differ; fixture words are not English; Notes bullet 1 wording; stale names for 10.10.
