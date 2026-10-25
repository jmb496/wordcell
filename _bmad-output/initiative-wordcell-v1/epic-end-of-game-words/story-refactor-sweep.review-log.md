# Review log — story-refactor-sweep.md (ticket 10.10)

State: pass 1: done

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
