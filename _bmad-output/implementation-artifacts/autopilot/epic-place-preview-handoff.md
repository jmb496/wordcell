# Epic place-preview autopilot — handoff (2026-10-29)

**Ticket 11.6 (Refactor sweep), the epic's last ticket, is built and verified, and is waiting for you at its done checkpoint.** Tickets 11.1–11.5 are done. The sweep adds no new behaviour: it tightens several browser tests (each shown to catch a deliberately broken version), makes the How to play scene tests check full error messages, and makes the flaky double-tap test report what happened if it fails again. Every test passes, including the screenshots and 20 repeats of the flaky test.

**What to decide** (plan `story-refactor-sweep-plan.md`, § Deferred-findings table):
- **R2:** one proposed extra check (that a used cell shows only the card beneath it) would test nothing on the cells it runs on. Proposal: drop it. The alternative is a new test on a cell that has a card beneath.
- **R10:** DESIGN.md:311 says icons are never font glyphs, but the ★ is one. Proposal: add a one-line exception to DESIGN.md at the retrospective. The alternative is an SVG star, which changes the look and needs its own ticket.
- **R11:** the double-tap flake in `nav.spec.ts:163` never came back (0 failures in 64+ runs), so its cause is still unknown. The test helper now reports the page's tap events when it fails. Proposal: keep that change and open a fix ticket once the next failure gives a report. You may revert it instead.
- **R18:** your 11.5 phone read did not include a two-digit count badge where it meets the ★ on a 360 px screen. To check it, run `node scripts/device-preview.mjs session-place-long` (badge 15) on a narrow phone or in Chrome's emulation. No code change is involved.
- **R26:** four items from the epic 10 retrospective (B3, B4, B6, B7) were left out of this sweep as out of scope. They carry over to the epic 11 retrospective.

**Worth knowing:** the code review left one open item. The plan's own verification notes still name the commit before the review's last fix. The checks were rerun at the final commit and all passed, but the plan text was not updated. Two small code-review notes about the double-tap failure report are also open (log `_bmad-output/implementation-artifacts/review-loop/11-6-build.md`).

**Close-out docs:** none new from this run's last ticket. The earlier ones were applied by you in 11.5 (d67b42a). One doc proposal is pending: R10 (DESIGN.md:311).

**Next:** decide the rows above, or take their proposals. Then mark 11.6 done (`uv run _bmad/method/scripts/tickets.py mark 11.6 done`), run `/bmad-retrospective` on the epic, apply its approved doc fixes, and mark the epic done with `bmad-preview-ticketing`.

Digest: `_bmad-output/implementation-artifacts/autopilot/epic-place-preview-20261028-1937.md`
