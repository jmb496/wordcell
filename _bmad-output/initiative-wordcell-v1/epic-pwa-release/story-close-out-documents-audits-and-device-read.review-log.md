# Review loop — ticket 7.11 (Close-out: documents, audits and device read)

State: pass 7: done

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

## Pass 2 — 2026-11-04
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 10, minor 8, decision-needed 0  |  Dropped in triage: 0 (5 stretch minors left unapplied, listed below; duplicates merged)
Words (docs): 1396 (2.96x pass 0; over budget, growth from majors only)  |  Snapshot: story-close-out-documents-audits-and-device-read.review-log.passes/pass2.md (fix diff pass2.fix.diff)
Fixer: all 16 applied; build-notes lines checked at ff84c95; 7.8 plan Implementation Notes (11) exists; no new runnable commands.
### Applied
- [major] Owner stop / AC 4 — a "finding" on a readable row has no outcome → fixer item 1
- [major] AC 4 — §9/owner answer kinds (accepts as-built = pass; needs change = fix ticket + re-read, new Q-id into §6.4; leaves row failing = accepted gap for the Done when 1 waiver) → item 2
- [major] Owner stop — fix-ticket proposal lacks the rows whose subject it touches (F12 unverifiable) → item 3
- [major] Phase 1 — no route for a rule-coverage row with no passing test or a build that contradicts the SPEC → item 4 (default applied)
- [major] Phase 1/2 runs — no rule for an unrelated failing test (D-64 recurrence) → item 5 (default applied: D-64 recorded against its backlog entry, one repeat; other failures a fix ticket, no rerun)
- [major] Phase 2 §6.6 — a fix ticket that changed no code (7.13) → item 6 (default applied: listed "no fix shipped" with its plan's reason, not a gap)
- [major] Phase 2 — an audit gap needing Jared's acceptance has no owner stop → item 7
- [major] Description — build-notes :22-23 sits inside the exempt "As built at 4130fb4" snapshot → item 8
- [major] Phase 1 — `bmad-project-context` (and spine/UX gate-2 edits) need owner approval in an unattended phase → item 9 (cite the owner's run authorisation as approval of exactly the listed edits; other proposed edits become owner items at the stop)
- [major] Phase 2 — a "differs" step needing a script change is raised after fix tickets are done → item 10 (route marks at the owner stop; tag kept until the F12 re-read confirms the corrected step)
- [minor] Description — D-row citations read as G9's sources → item 11
- [minor] Phase 2 — build-notes line numbers shift after Phase 1 edits → item 12
- [minor] AC 1 — checklist lines must name source and commit → item 13
- [minor] AC 8 — final tree when no fix ticket lands → item 14
- [minor] Phase 1 — clean committed tree for every read and re-read → item 15
- [minor] References — F4–F16 → item 16
### Default applied (technical)
- items 4, 5, 6, 9, 10
### Decision needed (functionality / UX / gameplay)
- none
### Dropped / left unapplied (stretch minors, over budget; for the build's plan)
- G4 splash (unverified) tag has no device-testing.md step: list it as its own handoff item
- G17/G7–G16 have no device-testing.md command: handoff builds them from Seeded reads or play
- digest retrospective items (D-64 backlog entry, tickets.toml entries 13/14 pre-review wording, flaky-test close rules) not listed in the handoff
- mixed rule-coverage rows (offline row D (G2), AD-18 `postbuild` part) need G2 / `size-budget.test.mjs` titles in the map
- G8 failure follows F10 (measure first, then fix ticket)

## Pass 3 — 2026-11-04
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 9, minor 9, decision-needed 0  |  Dropped in triage: 0 (2 minors left for the plan; duplicates merged)
Words (docs): 1409 (2.99x pass 0; additions offset by cuts: spine/UX/AGENTS lists now cite SPEC CAP-9, which names them; Notes section removed)  |  Snapshot: story-close-out-documents-audits-and-device-read.review-log.passes/pass3.md (fix diff pass3.fix.diff)
Fixer: all 16 applied; `e2e/nav.spec.ts:163` checked against the file and 7.10 D-64; no new runnable commands.
### Applied
- [major] Phase 1 — the owner's 2026-11-04 run authorisation is claimed "recorded in the epic Notes" but is not there → fixer item 1 (Phase 1 records it in the epic Notes before the first sync commit)
- [major] Phase 1 — D-64 rule: "noted there" points at a backlog entry that does not exist; a second D-64 failure has no outcome → item 2 (default applied: sighting with event log in the plan (A7), one repeat; a second D-64 failure stops the plan for Jared)
- [major] Phase 2 — fix tickets from the final runs land after the audits with no delta re-confirmation / §6.6 listing / F12 → item 3
- [major] Owner stop — every behaviour-stating §9 answer joins the §6.4 audit, not only change-needing ones → item 4
- [major] Phase 2 — §6.6 listing of a docs-only CAP-7 fix ticket → item 5 (default applied: "no build fix" with its plan's reason, not a gap)
- [major] Owner stop — the agent turn after Jared's read (writing proposals, committing his Notes records, landed-diff row check) is undefined → item 6 (default applied)
- [major] AC / Phase 2 — a sync line made stale by a landed fix has no route → item 7 (default applied: re-synced under the same authorisation when it only records the landed build; otherwise an Owner stop item)
- [major] Phase 1 — "a build contradicting the SPEC is a fix ticket" contradicts the listed SPEC F6/F8 syncs → item 8
- [minor] Phase 2 — build-notes :213/:216 need the ff84c95 anchor → item 9
- [minor] Phase 2 — a wording-only differs drops its tag → item 10
- [minor] AC 5 — "landed before `built`" → item 11
- [minor] AC 4 — reinstated Optional rows → item 12
- [minor] Description — "closes this epic's rule-coverage rows" means mapping in the plan → item 13
- [minor] handoff — G7–G17 have no device-testing.md command → item 14
- [minor] Description — F8 sync source is the as-built test (7.3 Residual risks, 7.10 D-70) → item 15
- [minor] Notes — redundant bullet → item 16
### Default applied (technical)
- items 1, 2, 5, 6, 7
### Decision needed (functionality / UX / gameplay)
- none
### Left for the build's plan (minor)
- handoff marks each row's blocking Phase 1 fix ticket
- reinstated Optional rows route as Device rows (covered by item 12's AC wording)

## Pass 4 — 2026-11-04
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 6, minor 8, decision-needed 0  |  Dropped in triage: 0 (6 stretch minors left for the plan; duplicates merged)
Words (docs): 1442 (3.06x pass 0; growth from majors, partly offset by cuts)  |  Snapshot: story-close-out-documents-audits-and-device-read.review-log.passes/pass4.md (fix diff pass4.fix.diff)
Fixer: all 12 applied; no runnable commands touched.
### Applied
- [major] Phase 2 §6.6 — the "no build fix, not a gap" exemption (pass 3 item 5, pass 2 item 6) waives Jared's explicit acceptance SPEC CAP-9 / release-checklist §6.6 require for a fix ticket with no reproduction test → fixer item 1 (exemption cut: 7.13 and any such ticket are gaps with their plan's reason, accepted at the existing owner-wait stop)
- [major] Phase 1 — only build–SPEC contradictions are routed; entry 11's verify is "No document contradicts the build" → item 2 (build–document contradiction; proposed sync or fix ticket)
- [major] Owner stop — a §9 answer is recorded only in the epic Notes, never as a Q-id in `docs/game-flow-spec.md` §9, so §6.4/§6.9 have nothing to check → item 3
- [major] Owner stop / Phase 2 — an approved Owner stop item is never applied or given a checklist line; a Phase 2 "Owner stop item" has no stop → item 4
- [major] AC 2 — pass 2's cut dropped "the name carries the id" (rule-coverage preamble, CAP-9's check) → item 5
- [major] AC 1 — the Phase 2 (unverified) tag updates have no checklist line or check → item 6
- [minor] Owner stop — stop again only when a proposal was written → item 7
- [minor] Owner stop — "its `after`" → "entry 11's `after`" → item 8
- [minor] Phase 1 — D-64 identified by title, event log recorded in the plan; "the failing script repeats once" → item 9
- [minor] Phase 1 — "clean tree" → committed build sources (Jared's Notes edits during the read do not ship) → item 10
- [minor] Phase 1 — authorisation covers exactly the listed syncs (SPEC CAP-9; build-notes "Close-out document edits (CAP-9)"), not only spine/UX/AGENTS → item 11
- [minor] Unknown — restore entry 11's verbatim "before the merge" → item 12
### Default applied (technical)
- items 1, 3, 4
### Decision needed (functionality / UX / gameplay)
- none
### Left for the build's plan (minor)
- G4's splash (unverified) tag has no device-testing.md step
- Phase 1 failure: the handoff still goes out
- G8 handoff line names F10's measure step
- a finding needing a Session/history/engine change is an owner question (rule 7)
- the spine amendment line cites the recorded authorisation

## Pass 5 — 2026-11-04
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 6, minor 8, decision-needed 0  |  Dropped in triage: 0 (3 minors left for the plan; duplicates merged)
Words (docs): 1442 (3.06x pass 0; additions offset by cuts)  |  Snapshot: story-close-out-documents-audits-and-device-read.review-log.passes/pass5.md (fix diff pass5.fix.diff)
Fixer: all 13 applied; `test:all` chain checked in package.json; no runnable commands touched.
### Applied
- [major] Phase 1 — no stated plan status at the hand-off to the read (pass 2 cut "stops `in-progress` … not `built`") → fixer item 1
- [major] Phase 1 — the authorisation's parenthetical (SPEC CAP-9; build-notes "Close-out document edits") omits syncs the Description requires (D-48 `allowJs`, SPEC F6/F8/F12, step 6, build-notes lines, G9) → item 2 ("(above and CAP-9)")
- [major] Phase 1 — `test:all` is an `&&` chain; repeating only "the failing script" leaves later scripts unrun → item 3 (default applied: the failing `test:all`/`test:screens` run repeats once in full; another title failing alongside D-64 takes the fix-ticket route)
- [major] Owner stop — the F12 re-read list depends on a field no fix plan produces → item 4 (agent judges rows from each landed diff on resume, listed in the plan)
- [major] Phase 2 §6.6 — 7.13 shipped no fix, so listing it as a "fix with none" gap forces an unneeded waiver (release-checklist §6.6 "a fix with none") → item 5 (7.13 "no fix shipped"; a fix ticket shipping a fix without a reproduction test stays a gap Jared accepts — pass 4's major stays resolved)
- [major] Owner stop — a behaviour-stating §9 answer only a device read can show (A-A11) has no route through §6.4 → item 6 (agent proposes a fix ticket for a test carrying the Q-id; device-only behaviour is an owner question at that stop)
- [minor] Owner stop — stop again also when a row is unresolved → item 7
- [minor] AC 1 — new §9 Q-ids get a checklist line → item 8
- [minor] Owner stop — "applies each approved Owner stop sync" (a fix-ticket item routes as a proposal) → item 9
- [minor] AC 2 — "one of the row's ids" → item 10
- [minor] Description — "as-built source" → "source" (F12/step 6 cite the epic Notes) → item 11
- [minor] Phase 1 — "build- or read–document contradiction" → item 12
- [minor] Owner stop — "a differs needing a script or procedure change" → item 13
### Default applied (technical)
- items 3, 4, 5, 6
### Decision needed (functionality / UX / gameplay)
- none
### Left for the build's plan (minor)
- frontmatter `after` kept in step with tickets.toml entry 11 `after`
- Phase 2 re-syncs after the read: the Notes record states the authorisation's scope; beyond it they are owner-wait items
- owner-wait note tells Jared an accepted §6.6 gap carries into entry 12's Done when 1 waiver

## Pass 6 — 2026-11-04
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 2, minor 9, decision-needed 0  |  Dropped in triage: 0 (8 minors left for the plan; duplicates merged)
Words (docs): 1440 (3.06x pass 0)  |  Snapshot: story-close-out-documents-audits-and-device-read.review-log.passes/pass6.md (fix diff pass6.fix.diff)
Fixer: all 9 applied; no runnable commands touched.
### Applied
- [major] AC 2 — the rule-coverage map accepts any passing test carrying one of the row's ids, so a P7 row could close on a shell Vitest `AD-n` test (preamble: S is never rule coverage) → fixer item 1 (test of the row's Test kind)
- [major] Phase 2 §6.6 — "lists 7.13 as no fix shipped and each fix … as a gap" parses two ways (7.13 as a gap brings back the waiver) → item 2 (reordered; fix-less tickets listed with 7.13)
- [minor] Owner stop — pass 5's cut reverted pass 4 item 8 ("its `after`") → item 3
- [minor] Unknown — pass 5's cut reverted pass 4 item 12 (verbatim "land before the merge") → item 4
- [minor] Phase 1 — D-64 never runs under `test:screens` (playwright.screens.config.ts testMatch) → item 5 ("its `test:all` run repeats once in full")
- [minor] Phase 1 — authorisation scope "(above and CAP-9)" sits before the Phase 2 tag edits → item 6 ("(Description and CAP-9)")
- [minor] AC 4 — §6.9 covers every owner question in the plan, not only the read's → item 7 ("raised in this plan")
- [minor] AC 4 — G3's footers carry no commit; F12 says "builds carrying the fix" → item 8
- [minor] AC 8 — "Phase 2's last commit" is circular (it records the runs) → item 9 ("the last source commit")
### Default applied (technical)
- none new
### Decision needed (functionality / UX / gameplay)
- none
### Left for the build's plan (minor)
- device-read-only behaviour-stating §9 answer: the owner question names the choices (answer worded without testable behaviour, or a §6.4 gap beyond release-checklist's allowance, which needs a checklist change)
- a fix ticket closing without a fix for a row with no §9/owner route: list it as fix-less in §6.6 and raise an owner question
- `test:all` `&&` chain: the plan records scripts that did not run after a failure and runs them before the handoff
- new §9 Q-id also updates the §9 heading range and spec version note
- Jared records (unverified) marks in the epic Notes
- handoff lists rows in a workable order (G1, G2, G3, seeded, by play, Desktop)
- the Notes authorisation record: who writes it (Phase 1 or orchestrator) and its scope
- an unfixed fix ticket's row routes to an owner question

## Pass 7 — 2026-11-04 (verify-only)
Reviewers: fix diff (pass6.fix.diff only)  |  Findings: major 0, minor 2, decision-needed 0  |  Dropped in triage: 0
Words (docs): 1440 (3.06x pass 0)  |  Snapshot: pass6.md (no fix pass)
### Minors (not applied)
- AC 2 — "passing test(s) of the row's Test kind" can read as needing a test per listed kind; rows with D (G2) or `postbuild` parts: the plan states those parts are covered by their read and by the row's B test (or reword "a Test kind the row lists (never S for a P7 or B kind)")
- AC 8 — "the last source commit" is undefined; read as "the tree after which no build source changed, after any fix ticket", with the checklist re-check at HEAD

## Result — converged after 7 passes
Majors per pass: 15, 10, 9, 6, 6, 2, 0. Decision-needed: none. Technical defaults applied: 20 (passes 1–5).
Words: 471 → 1440 (3.06x; over the ~1180 budget from pass 2 on, growth from majors; later minors were word-neutral).
Unapplied minors (for the build's plan): the two pass 7 minors above; pass 6 "Left for the build's plan" (8); pass 5 (3); pass 4 (5); pass 3 (2); pass 2 stretch minors (5).
