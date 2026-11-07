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
- Status (2026-10-29): epic 11 Place preview of WordCell tops (Q-49) is done, merged and deployed (`b0f1a57`); epic 7 PWA and release is still the one Proposed epic not yet in `tickets.toml`.
- Decision (2026-10-29): epic 7 PWA and release is incepted from its hardened spec (`_bmad-output/specs/spec-epic-7-pwa-release/`) as `epic-pwa-release/` with entries 7.1–7.12, after epic 11 in `tickets.toml`, on branch `pwa-release` (cut from `main` at `4130fb4`); entry 7.11 is the tailnet/desktop device read, then the epic retrospective, then the owner's merge, then entry 7.12, the owner's post-merge v1 release (production install, 1.0.0 release commit, ten qualifying games) that closes this initiative's Done when 1–3.
- Decision (owner, 2026-11-07, epic 7 retrospective A4; epic-pwa-release Notes): D-64, the `e2e/nav.spec.ts:163` flake "§2 AD-13 a double tap on New game on the rejected root opens the notice at wc 1 and no Reset confirm" (deferred from epic 11's retrospective A7, numbered D-64 in the 7.10 sweep), is closed as probably fixed by 7.14 (D-71, 14f0835: `doubleTap` stamps each tap at dispatch). The backlog entry 7.10 drafted (`epic-pwa-release/story-refactor-sweep-plan.md` § Fix tickets) stays unfiled. Any new failure of that test opens a fix ticket citing the 7.14 plan (`epic-pwa-release/story-deflake-the-helpers-spec-ts-doubletap-test-under-load-plan.md`) and the failure's event log.
- Status (2026-11-07): epic 7 PWA and release is merged and deployed (`dcd2df0`); only entry 12 (7.12, the post-merge v1 release) remains.
