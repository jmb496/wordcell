# Review log — story-deflake-the-helpers-spec-ts-doubletap-test-under-load.md (ticket 7.14)

State: pass 2: done

Mode: docs, thorough, max 7, budget 1500 words. Pass 0: 279 words, copy `story-deflake-the-helpers-spec-ts-doubletap-test-under-load.review-log.passes/pass0.md` (HEAD 781d38f).

## Pass 1 — 2026-11-03
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 8, minor 5, decision-needed 0  |  Dropped in triage: 0 (about 25 duplicates merged)
Words (docs): 1144 (4.1x pass 0; budget 1500)  |  Snapshot: story-deflake-the-helpers-spec-ts-doubletap-test-under-load.review-log.passes/pass1.md, fix diff pass1.fix.diff
Fixer: all 13 applied, no conflicts; new `## Scope` items 1–6; `npx playwright --version` 1.63.0, `npx playwright test --help` lists `--grep`, `--workers`, `--project`, `--repeat-each`; the `git diff --name-only … ':(exclude)_bmad-output'` pathspec accepted; suites not run. tickets.toml entry 14 (`after`, description, verify) not synced: the orchestrator's.
### Applied
- [major] Description, mechanism — D-71 framed as the settled D-64 tap-window mechanism, but `doubleTap` stamps its taps so real-time lateness should not matter (touch.ts comment; the test asserts a page gap < 400 ms after a 600 ms real wait); a 1780 ms page gap means the stamps were not honoured: the open question, not a known cause → fixer item 1
- [major] Description, outcomes — only test/helper and `src/` causes; no input-delivery (Chromium/CDP) or config outcome, no Reproduces-without-proof outcome; `src/` "stops for the owner" contradicts SPEC CAP-8 (B8 fix-ticket proposal under technical defaults) → fixer item 2
- [major] AC — no standard of proof for cause or fix; 0/50 isolated after a fix proves nothing when it passed 30/30 alone before; no void rule for a failure after the fix lands → fixer item 3
- [major] Description/AC — no edit boundary and nothing bars weakening the test (title, 600 ms `between`, < 400 check, `[1, 2]`, `DOUBLE_TAP_GAP_MS`, report format, skip/fixme/retries, timeouts) or editing `src/`, config or the other caller specs; no `git diff --name-only` check → fixer item 4
- [major] Reproduction — only the isolated run, the condition known not to reproduce; no counted runs, no CI-unset/retries-0 pin, no tree rule for counts → fixer item 5
- [major] Changed helper — `doubleTap` is called by D-64's `e2e/nav.spec.ts:173`, `celebration.spec.ts:719`, `history-notice.spec.ts:249,408`; no mutation case, caller reruns, `test:screens` (screens specs import `gestures.ts`, which imports `touch.ts`), or AD-17 Touch spine-sync rule → fixer item 6
- [major] AC `test:all` — no rule for a final failure on D-64's or D-65's flakes or on this test → fixer item 7
- [major] Evidence/record — the only surviving evidence (7.10 plan D-71 row and :418, tree bbdd2d5; full helper report and trace lost) is not named; no trace-keeping rule; where results go undefined (7.10 plan stays unedited) → fixer item 8
- [minor] Frontmatter — `hitl: false` missing; `after` lacks 13 (7.13 builds first; tickets.toml sync is the orchestrator's) → fixer item 9
- [minor] No recurrence rule after a close → fixer item 10
- [minor] References — SPEC CAP-8, constraint refs, 7.13 plan's 7.14 hand-off, the end-of-game-words epic path → fixer item 11
- [minor] Sightings — omit the passes in the final `test:all` at 2d01200 and f29b440 and 7.13's 0/3 counted and green `test:all` at 84df83f → fixer item 12
- [minor] D-64 relation — a fix here does not close D-64 (SPEC Non-goals A7) → fixer item 13
### Default applied (technical)
- Outcomes and proof — 7.13 Scope items 4–5 adapted (two-half reverted injection, void rule, B8 fix-ticket proposal for `src/`/config, input-delivery outcome)
- Edit boundary — `e2e/helpers.spec.ts`, `e2e/helpers/touch.ts`, this ticket's plan; `src/`, Playwright config and other specs out
- Load counts — isolated ×50 plus three counted android runs, CI unset, retries 0, before and after
- Changed helper — 7.13 item 6 adapted to `doubleTap`'s callers; spine-sync note, no spine edit
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none

## Pass 2 — 2026-11-03
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 6, minor 9, decision-needed 0  |  Dropped in triage: 0 (about 12 duplicates merged)
Words (docs): 1500 (5.4x pass 0; budget 1500, reached)  |  Snapshot: story-deflake-the-helpers-spec-ts-doubletap-test-under-load.review-log.passes/pass2.md, fix diff pass2.fix.diff
Fixer: all 15 applied, no conflicts; cuts to stay in budget (D-64 history pointer moved to References, sightings point to item 3); the hypothesis sentence now reads "without cause found a suspected cause is a recorded hypothesis; without both halves, no edit"; no new literal commands; screens-spec import chains re-checked (none reaches `touch.ts`).
### Applied
- [major] Scope 5 outcomes — "Never reproduces" lost 7.13's "neither half / no injection showing the mode", so an injection-only cause can meet both Never reproduces (`built`) and Input-delivery (stop); "else" in Input-delivery unscoped; no "fix lands with both halves even at a natural 0"; Reproduces-without-proof does not cover an injection-only or fix-unproven cause → fixer item 1
- [major] Scope 2 — the trailing "unless" can be read to release the title, 600 ms `between`, < 400 ms check (AD-17 Touch does not state them), so a stamp limit could be "fixed" by weakening the test; `between` not pinned as the real wait between the taps → fixer item 2
- [major] Scope 5 thresholds — an injected failure need not be the `[1, 1]` mode to count; "0/N with" undefined (7.13 hardened this) → fixer item 3
- [major] AC bullet — a caller failing with `doubleTap`'s own "click details of the two taps" report (D-64's test reruns and may be discarded; celebration/history-notice stop the build) is this ticket's mode, not a sibling flake → fixer item 4
- [major] Scope 4/AC — no rule for other tests failing in uninjected diagnostic or injection runs (7.13's diagnostic had 5 unrelated failures) → fixer item 5
- [major] Scope 4/AC — whether a counted run with a D-64/R-73 failure still counts for this test, and what the counted-run "rerun" is → fixer item 6
- [minor] Scope 4 — later change re-runs only item 4 and `test:all`; 7.13 re-runs items 4–6 → fixer item 7
- [minor] Scope 6 — `gestures.ts` example wrong: no `*.screens.spec.ts` reaches `touch.ts` (checked at fddd390) → fixer item 8
- [minor] Scope 3 — the timeStamps are at the 7.10 plan's D-71 row :190 and Fix tickets :204, not :418 → fixer item 9
- [minor] AC bullet — where a D-64 (A7) or R-73 (D-65, B8 citing 7.13) sighting goes → fixer item 10
- [minor] Scope 6 vs 1 — a signature change must stay backward-compatible (callers not editable) → fixer item 11
- [minor] Description — the sighting failed in the helper's `[1, 2]` poll, not the < 400 ms check; which events the two timeStamps were is unknown → fixer item 12
- [minor] Scope 6 — after a fix, a caller failing in the item 6 ×5 runs has no consequence → fixer item 13
- [minor] Scope 1/6 — other `touch.ts` functions are editable but item 6 covers only `doubleTap`'s callers → fixer item 14
- [minor] Scope 5 — mechanism class "stamps not honoured when stale"; a stale-first-tap injection as a second example → fixer item 15
### Default applied (technical)
- Scope 2 — the stamp premise counts as AD-17 Touch prescribed for this ticket; the pinned list has no exception; a Chromium stamp limit takes the Input-delivery outcome with a B8 proposal and spine-sync note
- AC — any test failing with `doubleTap`'s `[1, 2]` report is a sighting of this mode
- Scope 4 — stop rules cover counted runs and the final `test:all`; diagnostic/injection failures of other tests are recorded only
- Scope 1 — `touch.ts` edits limited to `doubleTap` and code only it uses
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none
