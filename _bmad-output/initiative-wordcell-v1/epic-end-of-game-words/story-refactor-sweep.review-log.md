# Review log — story-refactor-sweep.md (ticket 10.10)

State: pass 2: done

Mode: docs, thorough, max 7, budget 1500 words. Target: `_bmad-output/initiative-wordcell-v1/epic-end-of-game-words/story-refactor-sweep.md`.
Pass 0: `story-refactor-sweep.review-log.passes/pass0.md`, 104 words, HEAD 8806802.
Caller intent: tickets.toml entry 10 `done_checkpoint = true` (not copied at pull; fixer adds it in pass 1); scope set in pass 1 from the epic's deferred items, open review findings and the autopilot digest's Worth knowing lines (owner's Android read passed with nothing turned up; `e2e/nav.spec.ts` double-tap flake already fixed in 169c6bc). Cleanup only; behaviour/UX/gameplay changes are decision-needed.

## Pass 1 — 2026-10-24
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 13, minor 8, decision-needed 3 (after merging duplicates across the four lenses)  |  Dropped in triage: 0 (duplicates merged)
### Applied
- [major] whole ticket — no Scope; "every deferred cleanup finding" has no sources, record, dispositions or count → fixer item 1
- [major] frontmatter / AC — `done_checkpoint = true`, `hitl = false` (tickets.toml entry 10) missing; no owner checkpoint → fixer item 2
- [major] AC `test:screens` — no Docker rule, no "no baseline changes", versions/fixtures unchanged not pinned → fixer item 3
- [major] Scope — stale comments and test titles handed to 10.10 (10.9 plan stale names; 10-7 minor 6; tune2 minors 1, 3, 4; 10-6 pass 4; opus wave stagger) → fixer item 4
- [major] Scope — unit-test tightening minors (step.test vx 0 NaN, FALL_FRAC literal, `Math.max(lead, w)`, `opacity: 0`, QU `viewOf`, gaveUp tie, 10-1/10-3/10-4/10-7 rows) → fixer item 5
- [major] Scope — e2e tightening minors and the standing lint warning (dist-smoke.spec.ts:76, end-sheet.spec.ts:845, history-shape, `stepUntilShown`, 10-5/10-6/10-7/10-9 rows, `observeAdded` duplicate) → fixer item 6
- [major] Scope — Svelte `binding_property_non_reactive` dev warning (Celebration.svelte:36/:59, digest 10.5) → fixer item 7
- [major] Scope — R-87 touch-row `< LONG_PRESS_MS` timing (10.6 plan deferred, unverified) and nav.spec.ts confirmation need a repeat-each measurement → fixer item 8
- [major] Scope — already-closed deferrals need pre-assigned "already closed" rows → fixer item 9
- [major] Scope — no rule for items whose fix changes behaviour, a spine contract, an owner doc or tuned motion (`onEnd`, wave/contact rewrites, guard removal) → fixer item 10
- [major] Scope — 10.9 close-out doc syncs recorded "at done" not applied (DESIGN.md A-D12 / :692, AD-17 Touch `doubleTap`, tickets.toml entry 7 `interface`, epic References F1…F29) → fixer item 11
- [major] Scope — end-sheet.ts:41-43 reduced-motion / hidden / seam-off branch opens the sheet without `cancelGesture()` (10.4 deferral half still live) → fixer item 12
- [major] Scope/AC — end-of-epic budgets not checked (AD-18 size, `dependencies`, R-02 literals, SESSION/HISTORY_VERSION, warm unit median < 5 s on a Linux checkout) → fixer item 13
- [minor] tune2 minor 2 — comment narrowing only, decline the rAF hoist refactor → fixer item 14
- [minor] 10-3 pass 1 minors — check each against code; layout/ move declined → fixer item 15
- [minor] References — add evidence lines → fixer item 16
- [minor] Description — "anything the device read turned up": the 10.9 read carried nothing → fixer item 17
- [minor] table — merge duplicate findings, one row listing every source → fixer item 18
- [minor] budget — name only pre-assigned items in the ticket; per-finding rows live in the plan → fixer item 19
- [minor] historical errata in done tickets' plans/logs → one declined row group → fixer item 20
- [minor] 10.7 residuals — bfcache first-back row → fixer item 21
### Default applied (technical)
- 10.9 close-out syncs — apply in the build (owner verdicts recorded 2026-10-24) vs propose → apply the recorded syncs; anything without a recorded owner verdict is an old → new proposal
- `onEnd` "no production caller" → declined (AD-19 names it)
- end-sheet.ts `cancelGesture()` → repro test first; fix if reproducible, else decline with the evidence
- Svelte warning → fix with no behaviour/visual change; pass = no warning in a dev-server celebration run
### Decision needed (functionality / UX / gameplay)
- skip.ts press tail — after a press skip, a second finger that touched down before the skipping finger lifted can still tap the just-opened end sheet (Replay / New game) — proposed default: leave as built in 10.10; owner may later extend SPEC F18's swallow to any press down at the skip
- step.ts band height — on a window shorter than the bars plus one card the celebration plays as an invisible pause (NaN physics) — proposed default: skip the celebration and open the end sheet at once, as reduced motion does (not built in 10.10)
- celebration cap — below 20 fps a Normal run lasts longer than 6 s of wall time, against EXPERIENCE.md Motion "ends within 6 s" — proposed default: keep as built and note the low-frame-rate exception in EXPERIENCE.md Motion / AD-19 (owner reads found the frame rate good)
### Dropped
- none beyond duplicates merged across lenses
### Fixer outcome (pass 1)
All 21 items applied; the ticket now has Scope items 1–11, AC bullets for Docker/no-baseline/versions/rule-coverage and the owner checkpoint, `hitl: false` and `done_checkpoint: true` in the frontmatter and the Description. Notes: the `Math.max(lead, w)` guard no longer exists (removed in 96f3cc5), so its row became "already closed"; the epic's first commit is a0db217; the `-g` pattern was checked with `--list` (4 tests); `dependencies` absent at both ends (`null null`); `git diff a0db217^ -- src/engine/deal.test.ts` empty. Unverified (not run here): build margin, repeat-each runs, lint 0 warnings, unit median, test:all, test:screens, dev console capture. Fixer note: fixtures changed since a0db217 (other epics' how-to-play fixtures, this epic's won fixtures), so "fixtures unchanged" must be measured from the build's own baseline.
Words: 1499 (14.4 x pass 0; budget 1500)  |  Snapshot: story-refactor-sweep.review-log.passes/pass1.md, fix diff pass1.fix.diff

## Pass 2 — 2026-10-24
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 9, minor 9 (+4 unapplied, over budget), decision-needed 0  |  Dropped in triage: 0 (duplicates merged)
### Applied
- [major] Scope 9 vs 4, 6 — "only comments, tests, build records and dead code" forbids items 4 and 6's code fixes → fixer item 1
- [major] Scope 1-2 — live stale/test findings missing though only items 1-7 may be fixed: step.ts:3-5 "still say entry index" (10.9 plan :316), end-sheet.test.ts:395 stub already in engine order (opus pass 3), view.test.ts:1144 tail-half literal (10-1) → fixer item 2
- [major] AC 2 — "Fixtures unchanged" has no baseline; 7 fixture files differ from a0db217^; Done-when 4 is shapes/versions → fixer item 3
- [major] Scope 7 — tickets.toml entry 7 `interface` cannot be changed through the board tool (not maintained after pull, bmad-preview-ticketing SKILL.md:96) → fixer item 4
- [major] Scope 5 — isolated `--repeat-each` runs cannot show a load flake (it failed only in full runs, passed alone) → fixer item 5
- [major] Scope 10 — `dependencies` check is vacuous (`null null`; runtime libs are devDependencies) → fixer item 6
- [major] Scope 7 — DESIGN.md:692 rewording is a reviewer minor, not an owner decision (rule 7) → fixer item 7
- [major] Scope 2-3 — no path for a tightened test that fails at HEAD; FALL_FRAC remedy unnamed → fixer item 8
- [major] Scope 6 — a Vitest that arms the timer itself always reproduces, so it cannot decide reachability → fixer item 9
- [minor] Scope 6 — gave-up open is :62-63, not :61 → fixer item 10
- [minor] Scope 10 — a0db217 is the epic file's first commit; merge base 19acd17 → fixer item 11
- [minor] Scope 9 — bfcache residual "declined (not observed) or owner call" → owner call → fixer item 12
- [minor] Scope 7 — AD-17 `doubleTap`: epic Notes say retrospective; record "applied here" → fixer item 13
- [minor] Scope 1 — tune2 minor 3-4 sites include Celebration.test.ts:113/:122 → fixer item 14
- [minor] Scope 3 — "the 10-5 minors": minor 3 is Vitest (item 2), minor 5 is item 1 → fixer item 15
- [minor] Scope 3 — `wordSize` upper bound `<= 16` → fixer item 16
- [minor] Scope 8 — cites nav.spec.ts:163, skip.ts:99 → fixer item 17
- [minor] Scope 5 — failures per test, not failures/10 → folded into fixer item 5
### Default applied (technical)
- tickets.toml entry 7 `interface` → declined row (field not maintained after pull), no edit
- flake evidence → three full `npx playwright test --project=android` runs, failures per named test /3; solo runs optional
- `dependencies` → `git diff --exit-code 19acd17 -- package.json package-lock.json` empty (or a listed diff with no new runtime import)
- tightened test failing at HEAD → not committed; owner-call row with the failing case recorded; FALL_FRAC via a 1-letter reference group, no export
- end-sheet.ts repro → through the real controller (press after the dispatching act(), before the settle); gave-up open declined (act() cancels first)
### Decision needed (functionality / UX / gameplay)
- none new
### Not applied (minor, over budget, adds words)
- Scope 10 — AGENTS.md watch re-run < 1 s budget not named
- Scope 1 — wave-stagger (step.ts:41-44) and test-hook.ts:54-57 locations
- Scope 4 — console capture as a lasting e2e assertion (plan's choice)
- Scope 5 — other double-tap specs from 169c6bc (history-notice, celebration) left to item 11
### Dropped
- none
### Fixer outcome (pass 2)
All 17 items applied. Ran: `git merge-base main HEAD` → 19acd17; `git diff --exit-code 19acd17 -- package.json package-lock.json` empty, exit 0; `git diff 19acd17 -- src/engine/deal.test.ts | wc -l` → 0; `-g` pattern `--list` → 4 tests (celebration.spec.ts:332 ×2, :368, :424). Unverified: the three full android runs (suite run). Cuts to hold the budget: "Done checkpoint" line merged into AC bullet 3; "verify at HEAD" and duplicate "unfixed row is declined" dropped from items 2-3; NaN-band source list dropped from item 11; item 1 parenthetical; shorter item 4, item 9 list, AC snapshot bullet; two References lines merged.
Words: 1521 (14.6 x pass 0; budget 1500)  |  Snapshot: story-refactor-sweep.review-log.passes/pass2.md, fix diff pass2.fix.diff
