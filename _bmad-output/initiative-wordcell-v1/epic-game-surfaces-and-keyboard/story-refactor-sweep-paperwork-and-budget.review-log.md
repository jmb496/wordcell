# Review log — story-refactor-sweep-paperwork-and-budget (ticket 6.17)

State: pass 1: done

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
