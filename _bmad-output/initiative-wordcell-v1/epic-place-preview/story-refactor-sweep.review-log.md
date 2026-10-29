# Review loop — story-refactor-sweep.md (ticket 11.6)

State: pass 5: done

Mode: docs, thorough, max 7, budget 1500 words. Pass 0: 100 words, copy at story-refactor-sweep.review-log.passes/pass0.md (HEAD c4ab534).
Caller intent: tickets.toml entry 6 `done_checkpoint = true` (not copied at pull) belongs to the ticket's intent; the fixer adds it to the Description in pass 1. Scope is built from the epic's build records and deferred findings (11.1–11.5 plans, review logs, review-loop/11-*-build.md, digest epic-place-preview-20261028-1937.md, 11.5 device-read result).

## Pass 1 — 2026-10-29
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 7, minor 4, decision-needed 0  |  Dropped in triage: 35 (duplicates across the four lenses, merged)
Words (docs): 1011 (10.1 x pass 0; budget 1500)  |  Snapshot: story-refactor-sweep.review-log.passes/pass1.md
Fixer: all 10 applied as Scope 1-6, AC bullets, References; checked `git merge-base main HEAD` = d5015e5, `git diff --exit-code d5015e5 -- src/engine/deal.test.ts package.json package-lock.json` exit 0, commits c0664ef/d67b42a/169c6bc exist, cites grepped at HEAD; playwright/test:all/test:screens/build/median runs unverified (build-time). `fixtures/` written as "untouched by this ticket's diff" (two fixtures changed earlier in the epic).
### Applied
- [major] frontmatter/Description — tickets.toml entry 6 `done_checkpoint = true`, `hitl = false` not carried; build would not stop at `built` → fixer item 1
- [major] Description — no Scope list ("scope is set when it starts"); unattended build would pick its own work → fixer item 2
- [major] Scope — live test gaps from review-loop/11-2, 11-3, 11-4 `## Result` (expectPreviewLive, expectMarkCorner, New-game interrupt e2e, scenes.test.ts:1234-1237 prefix match) unnamed, no pass condition → fixer item 3
- [major] Scope — nav.spec.ts:163 doubleTap flake (digest 11.4, handoff "Still open"), flip-controller.spec.ts:350 (11.4 plan :99), tree-scan drvfs timeout (11.4 plan :186) missing, no measurable bar → fixer item 4
- [major] AC — "every deferred cleanup finding" matches nothing (all plans `deferred: []`), no sources, no record, no dispositions beyond applied/declined → fixer item 5
- [major] Description — no edit boundary or owner-call route (★ glyph vs DESIGN.md Icons, epic 5 F28, tickets.toml drift, done plans' errata) → fixer item 6
- [major] AC — epic Done-when 4 and AGENTS.md invariants dropped (snapshots unchanged, Docker only, fixtures, versions, R-02 deal, packages, budgets) → fixer item 7
- [minor] Description — device read is done and asked for no change; reword → fixer item 2
- [minor] Scope — already-closed items with cites → fixer item 8
- [minor] Scope — build triage "refactor only" rejects (duplicate preview helpers, `.preview-mark` font literal, reduced-motion `expectFlight` repeat) → fixer item 9
- [minor] References — evidence sources and AGENTS.md missing → fixer item 10
### Default applied (technical)
- Scope test item (d) — New-game interrupt e2e → add it; if it cannot be driven, record "covered by composition" as declined
- Flake item — 3 `android` runs at default workers, 0/3 to leave, test-only fix in e2e/helpers, timeouts/retries/workers an owner call (epic 10 item 5 pattern)
- Invariant base commit — d5015e5 (epic Notes: branch cut from main there; `git merge-base main HEAD`)
- Duplicate preview helpers — fold into e2e/helpers only if test-only with no assertion change, else decline; font literal declined (line-heights differ)
- Done plans' errata and tickets.toml drift — one declined row group / declined (epic 10 item 9 pattern)
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- 35 duplicates merged into the items above (every lens raised the missing scope, done checkpoint, flake, AC sources and invariants)

## Pass 2 — 2026-10-29
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 7, minor 6, decision-needed 0  |  Dropped in triage: 12 (duplicates merged)
Words (docs): 1369 (13.7 x pass 0; budget 1500)  |  Snapshot: story-refactor-sweep.review-log.passes/pass2.md
Fixer: all 13 applied; checked playwright.base.ts:17 retries, spine AD-17 Speed :805-813 and Touch :867-868, Card.svelte pointer-events :233/:242/:248, flip.ts:57 `finishAll`, `git show --stat d67b42a` (spine, DESIGN.md, EXPERIENCE.md), plan cites 11.2 :110/:111, 11.3 :105, 11.4 :191/:192, epic 10 plan :821; `--repeat-each`, android runs and the median/watch measurements unverified (build-time).
### Applied
- [major] Scope 4 — the 360 px two-digit badge/★ meet marked closed by the 11.5 read, which never mentions it (read fixture's largest badge 5); no route for a cite that fails → fixer item 1
- [major] Scope 2 — the 0/3 "leave it" bar already let nav.spec.ts:163 through once (epic 10 plan :821, then 11.4 attempt1 log); CI/flaky counting unstated → fixer item 2
- [major] Scope 2 — a touch.ts fix could loosen the AD-17 Touch `doubleTap` contract (exactly two clicks, detail 1 then 2) → fixer item 3
- [major] AC — no rule for the single final `test:all` hitting a flake Scope 2 already rows → fixer item 4
- [major] Scope 2/3 — commit measured unspecified; a fresh clone sees only committed work → fixer item 5
- [major] Scope 3 — AD-17 Speed also re-measures the 1 s watch re-run at each sweep and says profile first → fixer item 6
- [major] Scope 1(b) — paraphrase drops lift-probe-restore; pill and face are `pointer-events: none` (Card.svelte), so a plain `elementFromPoint` test fails at HEAD → fixer item 7
- [minor] Scope 3 cite "epic Done-when 4" names no budget → fixer item 8
- [minor] Scope 1 fold — needs an e2e/helpers.spec.ts case; 11.3 :105 `expectFlight` reuse adds assertions → fixer item 9
- [minor] Scope 1 Pass — new test (c) not covered by "tightened"/"changed"; name prefix → fixer item 10
- [minor] Scope 4 — EXPERIENCE.md close-out also in d67b42a → fixer item 11
- [minor] Scope 4/5 — "covered by construction" gaps are declines, not closures; 11.1 and 11.4 residuals missing → fixer item 12
- [minor] Scope 6 — sources grep "refactor only" misses 11.2 :110 and 11.3 :105; Close-out docs lines; 0/3 disposition value → fixer item 13
### Default applied (technical)
- nav.spec.ts:163 — live regardless of 3-run count: diagnose from the attempt1 log, test-only fix, evidence 3 runs plus `--repeat-each=20`; no cause found → owner-call row, never "leave it"
- Final `test:all` — one rerun at the same commit for a failure confined to a Scope 2 row, both results recorded; any other or a second failure: stop and report
- Measured commit — commit Scope 1 edits first; Scope 2/3 on a clean tree at that recorded commit; a later fix gets a new commit for its rerun and the final `test:all`
- 360 px meet — owner-call row (owner judges on `session-place-long` at 360 px), no code change
### Decision needed (functionality / UX / gameplay)
- none (the 360 px meet is routed to the owner by the ticket's own owner-call row at the done checkpoint; the look is already decided, 2026-10-28)
### Dropped
- 12 duplicates merged (cite fix, helper fold, EXPERIENCE.md, test naming raised by several lenses)

## Pass 3 — 2026-10-29
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 4, minor 10, decision-needed 0  |  Dropped in triage: 14 (duplicates merged; "test:all/test:screens on the /mnt/d checkout" dropped as over-budget precision)
Words (docs): 1486 (14.9 x pass 0; budget 1500)  |  Snapshot: story-refactor-sweep.review-log.passes/pass3.md
Fixer: all 14 applied; checked controller.ts:1046, flip.ts settle/releaseHold, 11.3 plan :106, place.spec.ts:283, attempt1 log :2491, device-preview.mjs `[fixture] [--no-build]`, fixtures/session-place-long.json, epic 10 retro B3/B4/B6; test runs unverified (build-time).
### Applied
- [major] Scope 2 — nav.spec.ts:163's mandatory fix has no pass bar and no before/after commit for its evidence → fixer item 1
- [major] AC bullet 3 — the one-rerun rule lets a "fixed here"/declined Scope 2 row fail in the final `test:all` and stay marked fixed (the epic 10 pattern pass 2 removed) → fixer item 2
- [major] Scope 1 Pass (c) — example mutation `finishAll()` not clearing `inFlight.committed` survives (flip.ts `settle` already calls `releaseHold()`); interrupt link is controller.ts:1046 `deps.finishGlides()` → fixer item 3
- [major] Scope 6/5 — 11.3 plan :106 cosmetic reject (`test.step` naming) missing from an exhaustive-looking source cite, no disposition → fixer item 4
- [minor] Scope 3 — median after a discarded warm-up (AD-17 Speed :807-808) → fixer item 5
- [minor] Scope 2 — "clean tree" while the plan records; no Scope 1 commit if Scope 1 commits nothing → fixer item 6
- [minor] Scope 2 — "no-change row" not a Scope 6 disposition → fixer item 7
- [minor] Scope 2 — "flaky counts as a failure" can never apply (retries 0) → fixer item 8
- [minor] AC Verify "one full" vs bullet 3's rerun → fixer item 9
- [minor] Scope 1 fold — order vs (a)/(b) unstated → fixer item 10
- [minor] Scope 1(a) — e2e/place.spec.ts:283 `expectPreviewBeneath` has the same gap → fixer item 11
- [minor] Scope 1 Pass — repeat-each for tests calling a changed helper → fixer item 12
- [minor] Scope 5 — 360 px owner row names no means (phone may be 412 px) → fixer item 13
- [minor] Scope 5/6 — epic 10 retrospective B3, B4, B6 ("for a later/the next sweep") neither taken nor declined → fixer item 14
### Default applied (technical)
- nav fix bar — fixed here only with 0/3 full `android` runs and 0/20 `--repeat-each=20` at the fix commit; any failure, no cause found, or a failure never reproduced before the fix ("fix unconfirmed"): owner-call row with counts
- Final `test:all` rerun — a failure of a row already fixed here/declined turns it into an owner-call row
- (c) mutation — controller.ts:1046 `deps.finishGlides()` removed; copy check before the flight would end on its own
- Helper fold — judged after (a)/(b); a fold changing any caller's assertions: declined
- Epic 10 retro B3, B4, B6 — declined row group, outside epic 11 Boundaries, carried to the epic 11 retrospective (B4 is behaviour: owner call there)
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- 14 duplicates merged; one over-budget precision minor (checkout for the final runs)

## Pass 4 — 2026-10-29
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 4, minor 7, decision-needed 0  |  Dropped in triage: 9 (duplicates merged; 3 left to the plan: clone setup, helpers.spec.ts case pass condition, device-read quote as evidence)
Words (docs): 1496 (15.0 x pass 0; budget 1500)  |  Snapshot: story-refactor-sweep.review-log.passes/pass4.md
Fixer: all 11 applied; minors paid by cuts (Description "Cleanup only, no new behaviour." — covered by Scope 5's edit boundary; Scope 2/4/5 quote trims); checked WordCellRow.svelte:120, Menu.svelte act(), controller.ts:1046, epic-autopilot SKILL.md :234-236, DESIGN.md:311; test runs unverified.
### Applied
- [major] Scope 1(c) — the New-game interrupt cannot detect the hold release (a new deal empties every WordCell, WordCellRow.svelte:120 `lowest` −1 either way; in progress, New game opens a confirm, the menu button's act() is the real interrupt); pass-3's mutation still survives → fixer item 1
- [major] Scopes 1-3 — mid-build local commits vs the autopilot step prompt's "Do not commit" (digest 11.3: build left work uncommitted; epic-autopilot SKILL.md :234-236); AGENTS.md rule 7 → fixer item 2
- [major] AC bullet 3 — "a recurrence" vs "a second failure" reads two ways (gating) → fixer item 3
- [major] Scope 2 — "fix unconfirmed": keep or revert the committed touch.ts fix unstated → fixer item 4
- [minor] Scope 2 — "reproduced before the fix" undefined → fixer item 5
- [minor] Scope 3 — clone "of the Scope 1 commit" lacks Scope 2's HEAD fallback → fixer item 6
- [minor] Scope 2 — helpers.spec.ts case only when a helper changes → fixer item 7
- [minor] Scope 2 — AD-17 Touch paraphrase partial → fixer item 8
- [minor] Scope 1 Pass — name example `AD-14 F28 Q-49` puts AD first though Q-49 applies (AGENTS.md) → fixer item 9
- [minor] AC bullet 1 — screenshot failure not caused by this diff → fixer item 10
- [minor] AC bullet 2 — "this ticket's diff" base unnamed → fixer item 11
### Default applied (technical)
- (c) — interrupt with the act()-wrapped menu button right after Confirm (cells keep their cards), check the copy gone after the next frame; mutation controller.ts:1046 `deps.finishGlides()` removed; cannot be driven: declined, covered by composition
- Commits — the Scope 1 and fix commits are bmad-build-auto's own local commits (AGENTS.md rule 7), outside a step prompt's "do not commit"; a build that cannot commit stops at Scope 2 and reports
- Final rerun — first failure on a fixed-here/declined row makes it an owner call; a failing rerun or any other failure stops the build
- Unconfirmed fix — kept (test-only, AD-17 Touch intact), row "kept, unconfirmed", owner may revert
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- 6 duplicates merged; 3 procedure-precision minors left to the build's plan (over budget)

## Pass 5 — 2026-10-29
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 1, minor 9, decision-needed 0  |  Dropped in triage: 6 (duplicates merged; 3 left to the plan: android-only load of the flake runs, device-read words per Scope 4 closure, `expectMarkCorner` probe call site)
Words (docs): 1500 (15.0 x pass 0; budget 1500)  |  Snapshot: story-refactor-sweep.review-log.passes/pass5.md
Fixer: all 10 applied; minors paid by cuts (epic 10 plan :821 parenthetical, small trims); checked keys.ts:259-265/:480/:548 (`M` → menu row via act() → cancel()), App.svelte:119, controller.ts:684-689/:1046, retro B7/B8; test runs unverified.
### Applied
- [major] Scope 1(c) — a pointer click on ☰ reaches the controller's pointerdown (App.svelte:119 `use:pointerRoot`; controller.ts:684-689 finishes glides when `deps.glidesRunning()`), so the hold is released before act() and the :1046 mutation survives; nothing checks the copy is present at the interrupt → fixer item 1
- [minor] Scope 3 — "Scope 2's measured commit" ambiguous (several commits) → fixer item 2
- [minor] Scope 1 — "stops at Scope 2" → before → fixer item 3
- [minor] Scope 1 Pass — an item whose Pass fails while green at HEAD has no route → fixer item 4
- [minor] Scope 2 — "fix unconfirmed" label covers only the last case → fixer item 5
- [minor] Scope 2/5 — epic 10 retro B8 (recurring flake gets its own fix ticket) and B7 not mentioned → fixer item 6
- [minor] Scope 2 — the no-loosening rule covers only touch.ts → fixer item 7
- [minor] AC Verify — commit for `test:screens` unstated → fixer item 8
- [minor] Scope 6 — 11.5 findings live in the 11.5 ticket's Document check (plan is frontmatter only) → fixer item 9
- [minor] Scope 3 — "profile first" applies to the timings, not the AD-18 size margin → fixer item 10
### Default applied (technical)
- (c) — interrupt with the `M` key (keys.ts menu command, act()-first, no pointerdown on `main`); assert the copy present just before the interrupt, gone after the next frame; mutation controller.ts:1046 `deps.finishGlides()` removed
- Scope 3 commit — Scope 2's last measured commit
- nav row owner call — proposes its own fix ticket (epic 10 retro B8)
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- 3 duplicates merged; 3 procedure-precision minors left to the build's plan (over budget)
