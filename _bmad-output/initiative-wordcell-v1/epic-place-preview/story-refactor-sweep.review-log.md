# Review loop — story-refactor-sweep.md (ticket 11.6)

State: pass 2: done

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
