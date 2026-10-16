# Review log — story-refactor-sweep-paperwork-and-budget (ticket 6.17)

State: pass 3: done

Mode: docs, thorough, max 7, budget 1500 words. Pass 0: 122 words (copy at .passes/pass0.md), HEAD d86d694.
Ticket intent also includes the tickets.toml entry 17 fields not copied into the file:
- verify: npm run test:all and npm run test:screens are green with every P6 row of rule-coverage.md covered, the unit median under 5 s on the Linux filesystem and the size script under 600,000 bytes.
- tests: "Done when 1 audit (P6 none)."
- owns: "The paperwork."
- references: (already in the file)

## Pass 1 — 2026-10-16
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 9 (merged), minor 6, decision-needed 0  |  Dropped in triage: 1 (stale-log note: the log is this loop's own)
Words (docs): 696 (5.7 x pass 0; budget 1500)  |  Snapshot: .passes/pass1.md
### Applied
- [major] Description — add the 6.16 plan rows `handed to 6.17` (D35, D38 wording, D40, D45, D46-D48) as the worklist; each ends applied / already satisfied / recorded for owner; zero rows = none
- [major] Description — close-out edits: 6.17 lists them (file, old text, new text, reason) in build-notes.md and does not edit spine, EXPERIENCE.md, DESIGN.md or SPEC (SPEC CAP-12 "lists the close-out edits"; AGENTS.md rule 7); names the two known items (AD-13 "menu plus confirm", buried-card aria-hidden exception)
- [major] Acceptance — P6 audit method: one line per row, spec file/title/project carrying the id, U-only rows as AD-n Vitest, "U, P6"/desktop rows; a gap is fixed by correcting row text or recorded for owner, no new tests
- [major] A8 row — split wheel / hover-peek / bfcache; bfcache non-reproduction is the accepted outcome (CAP-12), no test added
- [major] Unit median protocol — Linux-filesystem checkout, warm-up, median of 5 `npm test` wall times, record; miss recorded not fixed
- [major] Size — gzip total printed by scripts/size-budget.mjs after `npm run build` (AD-18), pass = script exit 0, record number and margin
- [major] Constraints — only docs change (no src/, e2e/, fixtures/, baselines); test:screens only via npm script, no --update-snapshots, halt if container unavailable; flaky rerun once and record; red = recorded for owner
- [major] Tests line "P6 none" vs P6 coverage — no new P6 rows or tests; the audit result is the proof
- [major] Retrospective inputs — define: recorded-for-owner rows of 6.16 inventory, new-string digest, 2026-10-15 owner decisions, bfcache non-reproduction, measurements, flaky tests; 6.17 runs no retrospective
- [minor] Add Owns/Tests lines from tickets.toml; References add build-notes.md, rule-coverage.md, 6.16 ticket+plan, AD-17/AD-18, methodology DoD; plan ends `built`, only owner marks done
### Default applied (technical)
- all of the above are technical/process choices → reviewer defaults taken
### Decision needed (functionality / UX / gameplay)
- none

## Pass 2 — 2026-10-16
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 5 (merged), minor 8, decision-needed 0  |  Dropped in triage: 0
Words (docs): 1049 (8.6 x pass 0)  |  Snapshot: .passes/pass2.md
### Applied
- [major] Measurements/Verify — plan status when a Verify item is unmet: `built` allowed with misses listed first as open Verify misses for the owner; only unavailable preconditions halt
- [major] Measurements — test:all is `&&`-chained: after a red step run remaining scripts individually; rerun is the failing script only; size number from last successful build; a stopped-short run is not green; non-budget size-script exit is a real failure
- [major] Measurements — Linux checkout method: ~/wordcell-watch is not a git repo; clone/rsync epic branch HEAD, npm ci, warm-up, record hash and dir
- [major] Audit/Measurements — "U, P6" rows need both halves; rows with no id matched by named behaviour with a CAP/AD/Q id; "passing" = green in this ticket's own run, so order is: worklist and lists, static audit, one test:all + test:screens, measurements, fill audit
- [major] Worklist — D38/D40/D45 sit in both the recorded and the handed rows: work only the handed (paperwork/wording) part, keep the rest recorded without duplication
- [minor] Worklist `applied` for spine/SPEC/EXPERIENCE/DESIGN rows means listed in close-out section; extend the existing Close-out section, convert the loose buried-card note (line 56) into an entry, include EXPERIENCE.md/epic 4 F16 refs
- [minor] Size: record `total N / 600000` line, margin = 600000 - N, "at most 600,000"; timing basis `time npm test` incl. pretest, strict < 5 s, failing run not counted; 'P6 none' meaning; closing `git status --short` check
### Default applied (technical)
- all above → reviewer defaults
### Decision needed (functionality / UX / gameplay)
- none
### Dropped / not applied (minor)
- digest source command, References tidy, close-out justification wording

## Pass 3 — 2026-10-16
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment (clean)  |  Findings: major 2, minor 6, decision-needed 0  |  Dropped in triage: 0
Words (docs): 1194 (9.8 x pass 0)  |  Snapshot: .passes/pass3.md
### Applied
- [major] Retrospective inputs — pass 2's "owner-visible exception to AGENTS.md" for `built` is an unauthorised deviation (AGENTS.md rule 7): drop it; a recorded Verify miss leaves the plan before `built` with misses listed first for the owner, who decides
- [major] Measurements — spine AD-17 Speed re-measures the 5 s median AND the 1 s watch gate at each epic's refactor sweep; "watch gate is not measured" dropped: measure the slowest engine test file's re-run on the Linux checkout and record it; a miss is recorded for owner
- [minor] test:screens/timing runs fall under the rerun rule; bfcache part counts as covered by the accepted non-reproduction; "android + desktop" rows need a test in each project; git status check = tracked changes only, allowed set named; remove loose line-56 note when its entry is added, keep the line-52 owner-decision sentence; note 5-run protocol is a stricter superset of AD-17's median of three
### Default applied (technical)
- all above → reviewer defaults
### Decision needed (functionality / UX / gameplay)
- none
