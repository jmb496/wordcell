# Review loop — ticket 6.2 build (code mode)
State: done
Range: 4efa3cd..HEAD (f924833). Pre-loop HEAD f924833. Intent: story-menu-sheet-menu-button-and-version-footer-plan.md
tree0: 78099b1413b43c9a1ed5464c1a3dd04e59ed91ae

## Pass 1 — 2026-10-15
Reviewers: correctness, edge cases, verification gap, intent alignment  |  Findings: major 1, minor 8 (6 after merge), decision-needed 1  |  Dropped in triage: 2
### Applied
- [major] e2e/menu.spec.ts:58 — inert test presses Tab only; ticket requires Enter too → fixer item 1
- [minor] app-version.mjs — override returned untrimmed → item 2 (default applied)
- [minor] menu.test.ts — AD-3 id mis-used, source-grep test → item 3
- [minor] menu.spec.ts — dispatched-click tests labelled openSurface-only → item 4
### Default applied (technical)
- trim override; rename test ids
### Decision needed (functionality / UX / gameplay)
- src/ui/WordCellView.svelte:92, Board.svelte:79 — with a WordCell view open (or a peek), a real tap on ☰ is blocked by the view scrim; ticket/SPEC F6 say the top bar stays live. Should ☰ sit above the scrim? — proposed default: leave layering, amend ticket wording (already deferred in the plan)
### Dropped
- Menu focus-to-main on any close (minor, entry 10 replaces the interim handler)
- vite.config appVersion() fails without git (ticket mandates fail-fast, rule 6)
- No test for architecture scans accepting the define (existing ad1 fixture and real d.ts pass the scan)
Pass 1 snapshot tree 5045b31b5763d50aa5a758618510f47a98a7cefd; test/lint/check pass (fixer-run).

## Pass 2 — 2026-10-15
Reviewers: fix diff, edge cases, verification gap, intent alignment  |  Findings: major 0, minor 1, decision-needed 0  |  Dropped in triage: 0
### Applied
- none (converged)
### Unapplied minors
- e2e/menu.spec.ts inert test: the Enter probe after blur goes to body so it cannot fail alone; the `closest('[inert]')` assertion carries the rule.

## Result — converged after 2 passes
Majors per pass: 1, 0. Decision needed: ☰ tap blocked by an open WordCell view's scrim (already deferred in the plan). Final npm test / lint / check: pass.
