# Review log — story-close-out-documents-agents-pitfall-and-device-check (ticket 10.9)

State: pass 3: done

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

## Pass 2 — 2026-10-24 15:20
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 11, minor 6, decision-needed 0  |  Dropped in triage: 3 (plus duplicates merged)
Words (docs): 1201 (2.79 x pass 0)  |  Snapshot: story-close-out-documents-agents-pitfall-and-device-check.passes/pass2.md (fix diff pass2.fix.diff)
### Applied
- [major] Notes, AGENTS.md write — `record` admits one observed mistake and writes one line; ticket gives spec evidence and asks two lines (one an edit); refusal fallback contradicts the AC → fixer item 1
- [major] AC vs last Notes bullet — "no baseline regenerated in this ticket" vs read changes applied "as 10.6's Tuning was" (which regenerated the mid-run baseline) → item 2
- [major] Notes, fixture — "its fixture test" unnamed (serialize.test.ts cannot import src/ui, AD-1); "`android` geometry" ambiguous (Pixel 7 412x839 vs step.test.ts portrait 360x740) → item 3
- [major] Notes, fixture — "more entries and copies than session-won-words.json" too weak for SPEC Assumptions' longest realistic list (tens of words, a few hundred cards) → item 4
- [major] Notes, rule-coverage — new-row list omits F17, F20/F21 (story-celebration-skip-plan.md:180 "Entry 9 adds the F20/F21 rows"), F23, F25–F27; existing AD-19 rows still describe the launch row / groups → item 5
- [major] Notes, rule-coverage — the new rows' id is unspecified; existing tests are titled R-87/AD-19, not F-ids (bare F-ids collide with other epics) → item 6
- [major] Notes, doc syncs — WordCell-tap rewording (story-celebration-interruptions.md:22) only applied to rule-coverage; AD-13 (spine:656), EXPERIENCE.md Keys while it runs, SPEC CAP-3 and F15 still say "a WordCell tap … do nothing" → item 7
- [major] Notes, rule-coverage F29 vs checklist — the ☰-then-immediate-back race has no test (interruptions plan:183) yet every row needs one → item 8
- [major] Notes, handoff — outcomes "accepted or a 10.10 item" vs next bullet; entry 10 is cleanup only → item 9
- [major] Notes, doc syncs — tickets.toml entry 7 and epic References edits assigned to bmad-build-auto, which never writes a ticket file (step-01:34; skip plan:173) → item 10
- [major] Notes, EXPERIENCE.md — Flow 8 step 2 still describes the launch row and side exit (F26/F27) and is on no list → item 11
- [minor] Notes, Epic SPEC F25 — trailing "As built …" sentence duplicates the reworded clause; its "about 7 %" differs from epic Notes' 8.1 % → item 12
- [minor] Notes, rule-coverage check — "non-skipped" ambiguous for project-specific rows → item 13
- [minor] Notes, spine/EXPERIENCE — refinement (e) is an EXPERIENCE.md "When" edit, filed under the spine → item 14
- [minor] Notes, checklist — "no trail" vs the rainbow string-out; R-87's trail is copies left behind → item 15
- [minor] AC — "is covered by" → "is read under" → item 16
- [minor] Notes, fixture — "a 23-letter row" also not a fixture target (pinned by step.test.ts's long scene) → folded into item 4
### Default applied (technical)
- AGENTS.md write — pitfall via `record` with the observed mistake (2026-10-23 Opus review: `data-celebration` on groups, not copies) as evidence; the Conventions-line amendment as a `refresh` ledger rewrite entry; the Notes authorisation approves both; if the skill writes neither or anything else, the build HALTs for the owner (no `built` with the AC unmet)
- baselines — the unattended build regenerates none; a change from the read regenerates in the container only the baselines it touches (story-celebration-skip-plan.md:179 command), `git status e2e/` shows no other
- fixture tests — serialize.test.ts asserts entry/copy counts; step.test.ts adds an inline row list and PACES entry at portrait 360x740 pinning smallest scale and per-entry pace
- fixture floors — at least 20 entries and 100 copies; the plan records the counts reached and names a shortfall as an owner item for the read
- new rule-coverage rows — begin with the test's id (R-87 or AD-19) and cite "(SPEC Fnn)"; no test renamed
- F29 back race — listed in rule-coverage Exempt as the device read's; the menu-already-open half rows on the existing P6 tests
- tickets.toml/epic edits — handed off in the plan to the autopilot orchestrator at mark-done
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- Device-preview command unverified (fix diff) — the pass 1 fix outcome already records it as not run (fixture not yet created); the owner runs it at handoff
- Banner-topped band in the spine `Celebration.svelte` bullet and DESIGN.md (minor) — over budget and adds words; listed as an unapplied minor
- A-D12 second edit owner (minor) — over budget and adds words; listed as an unapplied minor
### Fix outcome
- Fixer applied items 1–16, no conflicts; 1070 → 1201 words (majors only; minors 12–16 word-neutral). Only command added: `git status e2e/` (run, git 2.43.0: clean tree).

## Pass 3 — 2026-10-24 16:05
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 8, minor 3, decision-needed 0  |  Dropped in triage: 6 (plus duplicates merged)
Words (docs): 1270 (2.95 x pass 0)  |  Snapshot: story-close-out-documents-agents-pitfall-and-device-check.passes/pass3.md (fix diff pass3.fix.diff)
### Applied
- [major] Notes, AGENTS.md write — `record` only notes a single occurrence (a line needs "recurring or costly"); a `refresh` re-verifies the whole block since 7e8dd28 and will propose more, so "writes less or proposes more → HALT" stops an authorised change; AC and Notes disagree on the HALT trigger → fixer item 1
- [major] Notes, doc syncs — tickets.toml entry 7 / epic References "plan-listed for the autopilot at mark-done": the autopilot stops at D.3 for this hitl ticket and the owner marks it done, so nobody makes them → item 2
- [major] Notes, doc syncs — pass 2's "likewise" (EXPERIENCE.md Keys, SPEC CAP-3/F15, rule-coverage row) points at the wrong antecedent and undoes pass 1's explicit WordCell-press wording → item 3
- [major] Notes, rule-coverage — "(F22/F24 if uncovered)": F24 (and F21's delay, F23's row line) are superseded, so their rows could have no passing test → item 4
- [major] Notes, fixture — `PACES` holds paces only and is read in a loop over three geometries; a portrait-only entry makes desktop/landscape throw and cannot pin the smallest scale → item 5
- [major] Notes, Epic SPEC F25 — "full laps within 8.1 %" was measured under F25, before F26/F27; no test pins it, so the SPEC would state an unverified figure → item 6
- [major] Notes, fixture — the epic Notes and 10.6 digest carry "a 23-letter row, hundreds of copies" to this read; the ticket targets ≥15 letters and drops them with no owner item → item 7
- [major] AC, CAP-5 sections — a doc/build mismatch with no F-row or ticket record behind the build has no outcome (rule 7) → item 8
- [minor] Notes, last bullet — `git status e2e/` also lists spec edits; done tickets used `git status --porcelain | grep -- -snapshots` → item 9
- [minor] Notes, checklist — "per-word tempo where the F22 pace fit engages": the owner cannot tell which entries → item 10
- [minor] Notes, AGENTS.md HALT — a line already written stays in a dirty tree → folded into item 1 ("revert AGENTS.md and HALT")
### Default applied (technical)
- AGENTS.md write — one `record` run writes both lines: evidence states the costly ground (shipped through 10.1–10.3, a post-close Opus review finding, fixed in c84a1df) and the Conventions-line exception as the same mistake's fix; HALT (AGENTS.md reverted) only when the skill will not write the two lines; anything else it proposes stays unwritten, an owner item in the plan
- tickets.toml/epic edits — plan-listed owner items, applied when the owner marks the ticket done (with the A-D12 verdict)
- rule-coverage — rows cover only unsuperseded parts; F22 only if uncovered
- step.test.ts — the new list joins both scene loops with PACES entries for all three geometries; one separate AD-19 test pins the smallest `g.scale` at portrait 360x740
- F25 — drop the lap percentage
- fixture — longest word 23 letters (R-36) targeted; the plan lists every carried item the fixture does not reach (23-letter row, a few hundred copies) as an owner item for the read
- CAP-5 mismatch without an F-row or ticket record — plan checklist "owner item"; neither doc nor code edited
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- "15 letters" → "15 cards" (minor) — superseded by item 7 (23 letters per R-36)
- Bullet 1 authorisation names only the pitfall (minor) — adds words over budget; unapplied
- Which session applies read changes / tuning review loop (minor) — adds words; unapplied
- Read in Chrome tab vs installed PWA (minor) — adds words; unapplied
- Long fixture failing the bounce/exit loop → owner item and HALT (minor) — adds words; unapplied
- Duplicate F24/likewise minors merged into items 3 and 4
### Fix outcome
- Fixer applied items 1–10, no conflicts; 1201 → 1270 words (majors; minors 9–10 word-neutral). Item 7 cites the dictionary maximum (23 letters, checked in generated/dictionary/en.txt) instead of R-36. Command changed: `git status --porcelain | grep -- -snapshots` (run, git 2.43.0: no output, exit 1).
