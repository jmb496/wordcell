---
type: initiative
title: "WordCell v1: an installable, offline word card game on Android and the web"
parent: none
covers: []
after: []
assignee: ""
risk: high
---

# WordCell v1: an installable, offline word card game on Android and the web

## Description

WordCell v1 ships the solo FreeCell-style word card game as an installed Android PWA first, also playable in desktop and mobile browsers, from static hosting with no backend. The product brief owns the outcome and success criteria; the rules spec owns the game; the architecture spine owns the build contract and the epic list (Proposed epics). Each epic gets its own spec from `bmad-spec` before inception.

## Outcome

A player installs WordCell on an Android phone, plays and resumes games offline, and the brief's §6 success criteria hold.

## Done when

1. Every brief §6 success criterion is checked and passes, device checks included.
2. The app is live on its production host, deployed only by the CI pipeline.
3. Every rule of `docs/game-flow-spec.md` §2–§7 has a passing test named by its id.

## Boundaries

The WordCell app, its build, CI and deploy. Not the old BGA version (read-only), not a Play Store listing (brief §8), not a backend. Epics follow the spine's Proposed epics, one per row.

## References

- brief — _bmad-output/planning-artifacts/briefs/brief-wordcell-2026-09-26/brief.md, §6 Success criteria and §7 Scope
- rules — docs/game-flow-spec.md
- architecture — _bmad-output/planning-artifacts/architecture/architecture-wordcell-2026-09-27/ARCHITECTURE-SPINE.md, Proposed epics
- ux — _bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/DESIGN.md and EXPERIENCE.md
- methodology — docs/development-methodology.md

## Notes

- Assumption: this envelope was created during epic 1 ticketing (2026-09-27) so the ticket tree has a home; epics 2–7 are added to `tickets.toml` with ids 2–7 as each is specced, following the spine's Proposed epics order.
- Decision: the opening epic is the platform baseline, epic 1 "Scaffold hardening, CI and deploy" (spine Proposed epics row 1).
- Status (2026-10-25): epics 1–6 and 8–10 are done, merged and deployed (epic 10 in `baf5766`). Epic 7 PWA and release (spine Proposed epics row 7: SW registration and update policy, offline test, `requestPersistence()`, the `swState()`/`precacheComplete()` hooks, the brief §6 device checks) is the one Proposed epic not yet in `tickets.toml`; it carries the device checks deferred to it by earlier retrospectives (grep `epic-7` / `epic 7` in the epic folders' `*-retrospective.md`) and is what remains for this initiative's Done when 1 (the brief §6 checks, device checks included).
- Assumption (2026-10-25, recommended to the owner): epic 11 "Place preview of WordCell tops" (Q-49, owner decision 2026-10-25) is added after epic 10 and builds before epic 7, so epic 7's release device checks see the new Place screen; epic 7 then takes `after` epic 11.
