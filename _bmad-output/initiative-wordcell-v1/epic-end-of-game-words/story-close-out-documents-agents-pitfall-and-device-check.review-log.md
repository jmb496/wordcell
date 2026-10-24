# Review log — story-close-out-documents-agents-pitfall-and-device-check (ticket 10.9)

State: pass 1: done

Mode: docs, thorough, max 7. Pre-loop: HEAD 18eefff, copy `story-close-out-documents-agents-pitfall-and-device-check.passes/pass0.md`, 431 words.
Intent carried from `tickets.toml` entry 9: `done_checkpoint = true` (not copied into the ticket; fixer adds it to the Description in pass 1). The Notes' owner authorisations (doc syncs incl. owner docs listed there, R-87 wording) are decided, not decision-needed.

## Pass 1 — 2026-10-24 14:55
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 16, minor 8, decision-needed 0  |  Dropped in triage: 3 (plus duplicates merged)
Words (docs): 1070 (2.48 x pass 0)  |  Snapshot: story-close-out-documents-agents-pitfall-and-device-check.passes/pass1.md (fix diff pass1.fix.diff)
### Applied
- [major] Description — tickets.toml entry 9 `done_checkpoint = true` not carried → fixer item 1
- [major] Notes, doc syncs — sources stop at 10.5–10.7/F16–F29: the 10.4 Close-out line (EXPERIENCE.md Keyboard ← F15) is missing → item 2
- [major] Notes, doc syncs — 10.4 ticket's spine refinements (a)–(e), deferred to entry 9, missing → item 2
- [major] Notes, doc syncs — 10.8 plan's entry-9 deferrals (AD-17 Celebration seam, SPEC CAP-6/F12 press-or-back, AD-19 copies-not-groups `transform`) missing (digest said "none") → item 2
- [major] Notes, spine list — "Rule bullet 1" misnames where the 50 % overlap / per-group transform live (the `Celebration.svelte` bullet; Duration bullet "groups") → item 2
- [major] Notes, EXPERIENCE.md list — "What plays" (group in one row, F21/F23/F26) and Skip (F18/F19) omitted; per-doc brackets read as a limit → item 2
- [major] Notes, DESIGN.md list — A-D12 row (50 %, "to confirm on device") omitted though epic Notes give it to entry 9 → item 2
- [major] AC — "No document contradicts the build" unbounded, no check → item 3
- [major] AC / rule-coverage — rows name test kinds, not tests; method of the row check unspecified → item 4
- [major] Notes / rule-coverage — no rows for F16, F18, F19, F28, F29; row 24 (WordCell tap) and the banner row disagree with the build → item 4
- [major] Notes, R-87 banner wording — the whole-banner exemption has no P6 test (only Reload, e2e/celebration.spec.ts:575) → item 5
- [major] Description — `bmad-project-context` is interactive ("the user approves every write"); intent, approval and diff scope for an unattended run unspecified → item 6
- [major] Description — AGENTS.md:75 "every other copy is a mirror" contradicts the celebration copies; a pitfall alone leaves it → item 7
- [major] Notes, fixture — targets unmeasurable; 40 % floor unreachable in play (23 letters → 0.53 at 360 px); registrations unnamed → item 8
- [major] Notes, handoff — seeded won Session relaunches with no celebration (R-73); no Undo→Confirm step; unattended build cannot run the Tailscale share → item 9
- [major] Notes, checklist — 10.7 residuals (toolbar resize, ☰ then back, bfcache), Exempt "no trail, no colour change", Android sheet push after hide omitted → item 10
- [minor] Description — "CAP-2/F3 … already applied" reads as CAP-2 out of scope → item 2
- [minor] Notes — F24/F25 edit imprecise → item 11
- [minor] Notes, R-87 — how the spec preamble records the amendment → item 12 (default applied)
- [minor] AC — R-87's untouched text vs F16 read as a contradiction → item 3
- [minor] Notes — tickets.toml entry 7 `interface`, Map row/Binds `open-menu.ts`, epic References F-range stale → item 2
- [minor] AC — `test:screens` diff handling → item 13
- [minor] Notes — device read asking for changes has no home → item 14
- [minor] Notes — A-D12 verdict recorded after the read → item 9
### Default applied (technical)
- rule-coverage check — plan maps each row to test file:title and the green run; the doc gains rows only (no Test column), per rule-coverage.md's preamble
- bmad-project-context — `record` intent, owner authorisation in Notes = approval of the two named lines only; anything else unapplied, recorded for the owner
- fixture — longest word ≥ 15 letters, more entries and copies than session-won-words.json, counts and per-entry pace recorded and asserted; 40 % floor not a fixture target
- R-87 amendment — dated preamble note, no version bump (Q-42 2026-10-01 precedent)
- test:screens — no baseline regenerated; a diff is a failure
- device-read changes — applied in this ticket as 10.6 Tuning (F-row, re-sync, reruns)
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- Digest should mark Close-out docs applied by 10.9 — the digest is the autopilot orchestrator's, not the build's
- Add a Test column to rule-coverage.md — conflicts with its preamble ("the tickets record the test names"); plan mapping chosen
- Device checklist "per-word tempo of late long words" — R-86 order puts the longest word first; kept only as "per-word tempo where the pace fit engages"
### Fix outcome
- Fixer applied items 1–14, no conflicts; target 431 → 1070 words. Only command claim touched: `node scripts/device-preview.mjs session-won-long-words` — usage header read (takes a `fixtures/session-*.json` name without `.json`); not run (the fixture does not exist yet; the ticket creates it).
