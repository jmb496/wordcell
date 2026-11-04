# Review loop — ticket 7.11 (Close-out: documents, audits and device read)

State: pass 1: done

Target: `_bmad-output/initiative-wordcell-v1/epic-pwa-release/story-close-out-documents-audits-and-device-read.md` (docs mode, thorough, max 7)
Pre-loop: HEAD ff84c95; pass 0 copy `story-close-out-documents-audits-and-device-read.review-log.passes/pass0.md`, 471 words (growth budget ~1180).
Intent also includes tickets.toml entry 11 fields not copied into the ticket: unknown, done_checkpoint = true (fixer adds them to the Description in pass 1). Ticket is hitl: the owner authorised the run up to his device read; his read of the Device and Desktop rows is a mid-ticket stop, the §6.4 and §6.6 audits run after it. The three SPEC Open Questions are already answered (epic Notes, Decision owner 2026-10-29); the ticket checks they are recorded.
Refs: SPEC.md and companions (build-notes, rule-coverage, device-checks, release-checklist) of `_bmad-output/specs/spec-epic-7-pwa-release/`, epic-pwa-release.md, ARCHITECTURE-SPINE.md, AGENTS.md, docs/device-testing.md, the 7.10 plan (deferred-findings table, Entry-11 amendment), the 7.13 and 7.14 plans, run digest `_bmad-output/implementation-artifacts/autopilot/epic-pwa-release-20261030-1141.md`, the epic's done-ticket plans, epic 3 rule-coverage.md (P7 Q-40/Q-42 rows).

## Pass 1 — 2026-11-04
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 15, minor 6, decision-needed 0  |  Dropped in triage: 2 (duplicates merged across lenses)
Words (docs): 1178 (2.50x pass 0)  |  Snapshot: story-close-out-documents-audits-and-device-read.review-log.passes/pass1.md (fix diff pass1.fix.diff)
Fixer: all 19 applied; size-budget failure wording checked against scripts/size-budget.mjs:151; fixtures/session-one-letter-left.json exists; no new runnable commands.
### Applied
- [major] frontmatter/Notes — entry 11 `done_checkpoint` missing, `unknown` mislabelled "Open question" → fixer item 1
- [major] Description — mid-ticket owner stop undefined (phase 1 / stop / phase 2, plan state, local commit before the read) → item 2 (default applied)
- [major] Description — who adds fix-ticket entries and how entry 11 waits on them → item 3 (default applied: plan proposes; orchestrator/owner adds ahead of entry 11 in table order, appended to entry 11 `after`, as 13/14)
- [major] AC — failed rows need resolution (fix ticket done + re-read as pass, or owner/§9 answer recorded) and F12 re-reads → item 4
- [major] AC — audit gaps acceptable only where release-checklist allows (§6.4 P7→D, §6.6 fix with no reproduction test) → item 5
- [major] Description — audit-gap fixes after the read: delta re-confirmation, F12 re-reads, reopened owner stop → item 6
- [major] AC — rule-coverage clause cannot pass for D-only rows; name tests by title, D-only rows closed by reads, §6.3 to entry 12 → item 7
- [major] AC — epic 3 Q-40/Q-42 P7 rows closure unchecked → item 8
- [major] AC — syncs, rule-coverage, test:all, test:screens not re-checked at the final tree after fix tickets → item 9
- [major] AC — "No document contradicts the build" untestable; SPEC F12/step 6 follow the epic Notes decision, not the build → item 10 (default applied: plan checklist per sync item; dated "As built at" snapshot exempt)
- [major] Description — (unverified) tag update rule missing; matching tags in other files → item 11 (default applied)
- [major] Description — digest 7.13 item (Item 3 file list) and 7-10/7-14 build-log leftovers have no disposition → item 12 (default applied: retrospective, listed in the 7.11 plan)
- [major] Description — unreadable row / non-reproducing sub-step routing missing → item 13 (default applied)
- [major] Description — D-48 `allowJs` and D-49 AD-18 Size wording not named; cite entry-11 rows D-32, D-47, D-48, D-49 → item 14
- [minor] AC — G3 `A`/`B` footers need their commit → item 15
- [minor] Description — F8 sync: exactly one waiting and one active worker; "browser-level CDP route is unavailable"; cite 7.3 plan Residual risks → item 16
- [minor] References — add the documents the ticket edits and takes its sync list from → item 17
- [minor] Description — handoff contents per row (command/fixture, G17 fixture, G18/G19 optional, default not run) → item 18
- [minor] AC — name the baseline `4130fb4` for SESSION_VERSION/HISTORY_VERSION/shapes → item 19
### Default applied (technical)
- phases, fix-ticket mechanism, sync checklist, tag rule, digest leftovers, unreadable rows (items 2, 3, 10, 11, 12, 13)
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- adversarial: retrospective before merge leaves §6.6 post-merge fixes without a home — speculative; release-checklist step 5 / entry 12 re-confirm post-merge deltas
- adversarial: `risk: low` should be medium — copied from tickets.toml, no defect in the ticket's contract
