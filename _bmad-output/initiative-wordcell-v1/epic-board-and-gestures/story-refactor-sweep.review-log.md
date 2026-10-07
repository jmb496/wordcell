# Review log — story-refactor-sweep.md (ticket 4.13)

State: pass 1: done

- Mode: docs, thorough, max 7, budget 1500 words
- Pre-loop: HEAD 149fa80; pass 0 copy story-refactor-sweep.review-log.passes/pass0.md, 226 words
- Intent additions from tickets.toml entry 13 (not copied at pull): interface, tests, owns — fixer adds them to the Description in pass 1

## Pass 1 — 2026-10-07
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 15, minor 6, decision-needed 0  |  Dropped in triage: 0 (about 40 raw findings merged into 21)
Words (docs): 1401 (6.2x pass 0; budget 1500)  |  Snapshot: story-refactor-sweep.review-log.passes/pass1.md, fix diff pass1.fix.diff
### Applied (fixer items, see list below)
- [major] Notes/Description — no deferred inventory → 1
- [major] banner-during-scroll flake (layout.spec.ts) → 2
- [major] carried open majors 4.5, 4.6, 4.9-f32, 4.12 → 3
- [major] 4.12 hover timer keyed by element; closed-rect 6/7 edge → 4
- [major] 4.8 column rects not clipped under the sticky top bar → 5
- [major] player-visible leftovers without a disposition → 6
- [major] AC "unedited except imports" contradicts the inventory → 7
- [major] re-measure metric undefined → 8
- [major] watch re-run method on drvfs → 9
- [major] measure order and owner-stop timing records → 10
- [major] test:screens with Docker unreachable → 11
- [major] R6 helper shape (build-notes CAP-10, PrefsRejectReason) → 12
- [major] R7 boundary and shared setup → 13
- [major] intent fields interface/tests/owns and the AGENTS.md record → 14
- [major] architecture.test.ts split shape → 15
- [minor] items 16–21 (close-out doc boundary, e2e helper dedup, test/plan minor batch, count badge, 5 s boundary, flake rerun policy)
### Default applied (technical)
- re-measure — metric → Vitest-reported Duration, warm fsModuleCache, wall clock for information
- watch re-run — method → Linux-filesystem clone, else warm `npx vitest run <file>` proxy
- test:screens — Docker unreachable → record in plan, green run moves to the owner's done/merge gate
- R7 — shared setup → copied into history.svelte.test.ts
- split — shape → `src/architecture-<topic>.test.ts`, SELF becomes the set
- AGENTS.md — tickets.toml over build-notes CAP-10: record in plan, no edit
- top-bar clip — fix to EXPERIENCE.md Drop targeting steps 6–7
- player-visible leftovers — homes epic 5 / 6 / 7 device pass
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- edge-case reviewer: 4-5 minor 1 test name "now accurate" — disproved (overlays.svelte.test.ts resetForNewSession test still opens no hover peek)

Fixer: all 21 applied (inventory D1–D15, Out of scope section, intent fields); ran `npx vitest run src/engine/deal.test.ts` (652 ms); full-suite claims (5 green test:e2e runs, Docker) unverified as design statements.
