---
id: 9
type: story
title: "Close-out: documents, AGENTS pitfall and device check"
parent: epic-end-of-game-words
covers: [CAP-5]
after: [2, 7, 8]
hitl: true
risk: low
---

# Close-out: documents, AGENTS pitfall and device check

## Description

Brings the documents of the Notes' sync list in line with the build (only the 2026-10-23 Opus review close-out edits are applied: AD-19 launch parameters, SPEC CAP-2/F3, Scaffold deltas, the rule-coverage Exempt list; the 2026-10-24 tuning edits to CAP-2 are this ticket's), runs `bmad-project-context` to write the celebration-copy lines to AGENTS.md, and hands Jared the build for the final Android read (checklist in Notes). That read is the done checkpoint (`done_checkpoint`): the ticket stays `built` until the owner marks it done.

## Acceptance Criteria

Verify: SPEC CAP-5's sections and every item of the Notes' sync list match the build, shown by a plan checklist mapping each item to the document and section edited, or "already matches" (R-87's remaining text stands by owner decision; F16, the hidden-page win, is covered by R-87's "the app being hidden … ends it the same way"; F20–F29 are SPEC/spine refinements, not contradictions); every row of rule-coverage.md has a passing test whose name carries the id (method in Notes); AGENTS.md carries the two lines; `npm run test:all` and `npm run test:screens` are green, no baseline regenerated in this ticket (any diff is a failure to investigate); and Jared records his Android read in the epic Notes.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-end-of-game-words/epic-end-of-game-words.md
- constraint — AGENTS.md (managed block edits go through bmad-project-context)

## Notes

- Decision (owner, 2026-10-23 run prompt; recorded 2026-10-24): the autopilot is authorised to run this ticket's non-device parts (the doc syncs, the AGENTS.md pitfall through `bmad-project-context`, the rule-coverage check, `test:all`, `test:screens`). Its only hitl part is the owner's final Android read: build and verify it, leave it `built`, and stop (epic-autopilot stop rule 4).
- AGENTS.md write: run `bmad-project-context`'s `record` intent with evidence SPEC CAP-5 and AD-14/AD-19; the owner's authorisation above is the approval of exactly two lines (plus the block's provenance line if the skill updates it): a Known-pitfalls line (celebration copies carry `data-celebration`, never `data-card-id`, `data-testid` or `data-mirror-of`, and never take part in a FLIP glide) and the Conventions line "every other copy is a mirror (see Known pitfalls)" amended to except them. If the skill refuses or proposes more, write nothing else; record it in the plan for the owner.
- Doc syncs to apply. Sources govern: every Close-out docs line of the autopilot digest's 10.4–10.8 entries (`_bmad-output/implementation-artifacts/autopilot/epic-end-of-game-words-20261020-0925.md`); every item a done ticket or plan addresses to entry 9 (incl. refinements (a)–(e) in story-celebration-overlay-entry.md Notes and the story-hook-free-celebration-suite-plan.md items, listed below); the epic Notes' entry-9 lines; SPEC Decisions F15–F29. Minimum per doc:
  - ARCHITECTURE-SPINE.md: AD-13 and AD-19 refinements (a)–(e); AD-17 Celebration seam; AD-19 Rule bullet 1 (`step` over groups → per-card motion), the `Celebration.svelte` bullet (35 % overlap, no launch row, `opacity` per group, `transform` per shown copy), Duration ("groups"), Start (F16), Skip (F17–F19, post-run tails, pass-through while halted), Hide (F28, registered by `installInterruptions`); `src/ui/open-menu.ts` in AD-13/AD-19, AD-19's Binds line and the Capability → Architecture Map row.
  - EXPERIENCE.md: Win celebration "What plays" (F21/F23/F25–F27), Skip (F18/F19), "Never plays" (F16), "Keys while it runs" (drop "to confirm at ticket review"), message row (F28); § Keyboard (F15).
  - DESIGN.md: Win celebration and A-D12 (35 % overlap; per-card motion; no launch row).
  - Epic SPEC: CAP-2 (F20–F27), CAP-6 and F12; F25's "As built" wording ("one constant speed per word along its path, the run as long as the path's") replaces its "set so every lap … did" clause and drops "entry 9 rewords this row"; F24's row gains "(superseded by F25)".
  - rule-coverage.md: new rows (no new column) for F16, F18, F19, F28 and F29 with their test kinds; the row "`?`, WordCell `Enter` and a WordCell tap do nothing" reworded so a WordCell press only skips (consumed); the banner row reads "a press anywhere on the dictionary banner is not a skip".
  - tickets.toml entry 7 `interface` (plain `end()`, `installInterruptions`); the epic file's References F-range.
- Rule-coverage check: the plan maps each row to its test file, full title(s) and the green `test:all`/`test:screens` run that executed them (rows without an R-id cite their AD-17, DESIGN.md or screenshot test title); a row with no passing, non-skipped test gets one, named with its id, in this ticket.
- Decision (owner standing rule, 2026-10-24): `docs/game-flow-spec.md` R-87 adds the dictionary banner to the press-skip exemption ("outside the top and action bars and the dictionary banner"), as built since 10.6; no other rule text changes. Recorded as a dated amendment sentence in the spec preamble, no version bump (the 2026-10-01 Q-42 precedent). This ticket adds an `android` Playwright test `R-87 a press on the dictionary banner where no control lies does not skip the run` (or names an existing one covering it).
- Device read fixture: a valid won Session `fixtures/session-won-long-words.json` reached by scripted play (`session-won-words.json` does not qualify), its last move the winning Confirm with no redo tail; longest word at least 15 letters, more entries and copies than `session-won-words.json`. The plan records its entry count, copy count, smallest scale and per-entry pace from `src/ui/celebration/step.ts` at `android` geometry, asserted by its fixture test; registered as the other won fixtures are (`src/architecture-ad2-ad12-ad17.test.ts` fixture list; `src/engine/serialize.test.ts` valid and scripted-replay lists). A-D12's 40 % floor is not a fixture target (pinned by `step.test.ts`); the read judges the smallest scale reached.
- Device read handoff (docs/device-testing.md, not chrome://inspect; the build does not run the share): hand the owner `node scripts/device-preview.mjs session-won-long-words`. A seeded won Session opens in Game over, no celebration (R-73): Undo then Confirm plays the win; reopen the seed URL to reset. Checklist: long-list frame rate and readability, smallest scale; hide-to-background mid-run (end sheet waiting on return, F28); the Words section on the sheet; no trail or colour change (rule-coverage Exempt); the 10.7 residuals (a mobile-browser toolbar show/hide ends the run, ☰ then an immediate back, a bfcache return mid-run); the end sheet's history push after the hide callback (epic Notes Unknown); per-word tempo where the F22 pace fit engages. Each is recorded as accepted or a 10.10 item; the A-D12 verdict goes in the epic Notes with the read and into DESIGN.md A-D12 when the owner marks the ticket done.
- Changes the read asks for are applied in this ticket as 10.6's Tuning was (new SPEC F-row, doc re-sync, `test:all` and `test:screens` rerun) before the owner marks it done.
