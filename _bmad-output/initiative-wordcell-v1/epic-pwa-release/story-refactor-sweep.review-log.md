# Review log — story-refactor-sweep.md (ticket 7.10)

State: pass 1: done

Mode: docs, thorough, max 7, budget 1500 words. Pass 0: 212 words, copy `story-refactor-sweep.review-log.passes/pass0.md` (HEAD 1bca825).

## Pass 1 — 2026-10-31
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 10, minor 5, decision-needed 0  |  Dropped in triage: 0 (about 25 duplicates merged)
Words (docs): 1157 (5.5x pass 0; budget 1500)  |  Snapshot: story-refactor-sweep.review-log.passes/pass1.md, fix diff pass1.fix.diff
Fixer: all 14 applied; item 12 adjusted (package.json/lockfile changed after 4130fb4 by 7.1 `workbox-window`, so checked against the build start commit; fixer ran the `git diff --exit-code` forms); item 6 found the existing AD-14 pin (src/architecture-tree-scan.test.ts:38) already covers the hide-cancel order, so the new pin covers the remaining clauses; cites verified with git show/grep.
### Applied
- [major] Description, sources — sources named only as categories; no reconciliation, so "every deferred finding has its row" is uncheckable → fixer item 1
- [major] Description — no table location, columns or live-at-HEAD check; a "closed by" cite never checked against HEAD → fixer item 2
- [major] Description, dispositions — no "handed to entry 11" disposition for close-out doc syncs (7.8 plan deferred row expects one; entry 11 does not name build-notes, SPEC F6/F8) → fixer item 3
- [major] Description, edit boundary — "tooling" undefined; `docs/device-testing.md`, `scripts/device-preview.mjs`, done plans' errata, gate/timeout settings unplaced → fixer item 4
- [major] Description, fix ticket — who creates it, where recorded, whether it lands before entry 11 → fixer item 5 (default applied)
- [major] G9 — order to pin, test kind and decline evidence unspecified → fixer item 6 (default applied)
- [major] Budgets — no AD-17 Speed method, commit or over-budget path → fixer item 7 (default applied)
- [major] "fixed" — no pass condition (mutation, `--repeat-each`) → fixer item 8 (default applied)
- [major] Flakes — 7.9 residual names `nav.spec.ts:163` (SPEC Non-goals: follows A7, outside this epic) and `success-signal.spec.ts:440`; no rule → fixer item 9
- [major] Frontmatter — drops tickets.toml `hitl = false`, `done_checkpoint = true`; owner-call rows have no owner stop → fixer item 10
- [minor] AC — `test:screens` container-only, no-Docker stop, no baseline change → fixer item 11
- [minor] AC — epic invariants (fixtures, SESSION/HISTORY_VERSION, deal.test.ts, package.json vs 4130fb4) → fixer item 12
- [minor] Pre-assignments for items the refs already settle → fixer item 13
- [minor] References — AD-17 Speed, AD-18 and the evidence files → fixer item 14
### Default applied (technical)
- Fix-ticket route — plan row proposes the entry; build never edits tickets.toml; owner/orchestrator adds it before entry 11
- G9 — test-only source-order pin beside the F17 pin in `src/architecture-tree-scan.test.ts`
- Budgets — fresh Linux-filesystem clone of the sweep's last commit; over budget: profile, stop and report
- "Fixed" — fails on the named mutation; changed e2e `--repeat-each=5`
- `docs/device-testing.md` and `scripts/device-preview.mjs` count as CAP-7 tooling the sweep may edit
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none (duplicates merged into the items above)
