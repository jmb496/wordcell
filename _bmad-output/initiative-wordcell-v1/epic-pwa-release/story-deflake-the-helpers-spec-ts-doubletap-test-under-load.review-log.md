# Review log — story-deflake-the-helpers-spec-ts-doubletap-test-under-load.md (ticket 7.14)

State: pass 1: done

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
