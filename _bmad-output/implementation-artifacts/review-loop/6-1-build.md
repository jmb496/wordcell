# Review loop — 6-1-build (code mode)

State: done
Target: a27a690..HEAD (build bfed752), diff at /mnt/d/CodeProjects/wordcell/_bmad-output/implementation-artifacts/review-loop/6-1-build.passes/pass0.diff. Intent: story-surface-foundation-and-the-one-new-game-function-plan.md. Pre-loop HEAD bfed7523ffed7cfe0f583a23868222bf73044911, tree 0 0888aacf016ac599d6c04ab331820718426f2d88.

## Pass 1 — 2026-10-14
Reviewers: correctness, edge cases, verification gap, intent alignment  |  Findings: major 5 (after dedupe), minor 9, decision-needed 0  |  Dropped in triage: 0
### Applied (sent to fixer)
- [major] presence.svelte.ts onend — transitioncancel (interrupted open by a close) unmounts at once; bubbled descendant opacity events unmount early → items 1, 2
- [major] presence.ts/svelte.ts — close before opacity ever changed (no transition event) leaves invisible layer present → item 3
- [major] surfaces.test.ts — missing mounted tests: focus start, focus return, cancel-first on wrapped handlers, exiting inert, peek→sticky no replay, close/reopen during exit → item 4 (default applied: Playwright dev-server spec; no jsdom dependency)
### Minor (applied if no cost)
- openSurface return early when overlays.isOpen(id); WordCellView exit snapshot; expandEndSheet exact message; closedByBack for confirms; opener from menu hand-off, reduced-motion in Sheet/Panel (deferred to 6.2, tree-shaken) — recorded
### Default applied (technical)
- Playwright for mounted coverage; event-target filter for presence
### Decision needed
- none
Snapshot: tree f068ac28c60a2ea5cffadf05d4cbe0a49974f5ba; fix diff pass1.fix.diff; fixer ran test/lint/check/e2e green. Deferred: Sheet/Panel focus + act() caller mount tests to 6.2 (no opener).

## Pass 2 — 2026-10-14
Reviewers: fix diff, edge cases, verification gap, intent alignment  |  Findings: major 1, minor 5 (after dedupe), decision-needed 0  |  Dropped in triage: 0
### Applied (sent to fixer)
- [major] src/ui/surfaces.test.ts AD-13 App main inert loop — resetConfirm case opens historyNotice beneath, which is itself inert, so dropping resetConfirm from INERT_UNDER still passes
- [minor] opacityRunning counts descendant transitions (ownership mismatch with ownsTransition) — reported by 2 reviewers
- [minor] resetConfirm "keeps hoverPeek" test body never opens a peek
- [minor] Sheet focusStart fallback when content has no focusable control
- [minor] opener overwritten when reopened during exit
### Dropped / recorded
- silent guards in restoreFocus (rule 6): recorded as unapplied minor (guards map to specified outcomes: no opener, focus moved on)
### Decision needed
- none
Snapshot: tree b637e1532fbed1021d1a9b5a59f4f67809b45943; fix diff pass2.fix.diff; test/lint/check green.

## Pass 3 — 2026-10-14
Reviewers: fix diff, edge cases, verification gap, intent alignment  |  Findings: major 1, minor 6, decision-needed 0  |  Dropped in triage: 0
Snapshot: tree 2 (no fix pass; stopping rule met: passes 2 and 3 each yielded at most one major)
### Open major (recorded, not fixed)
- [major] src/ui/open-surface.ts openSurface — for `resetConfirm` over a `historyNotice` that sits above a sticky WordCellView or tail selection (the notice opens over these at boot per the ticket), the clearing block calls `overlays.close('wordcellView')`/`deselect()` with the notice on top and throws `AD-13 close(wordcellView) while the top is historyNotice`. Default fix: when top is historyNotice, skip the view/selection/peek clearing and open directly; add a test with sticky view and tail selection beneath the notice. No current opener goes through openSurface for resetConfirm (HistoryNotice.svelte opens it directly), so latent.
### Minor (unapplied)
- restoreFocus: opener lost on reopen after the post-tick null (close, flush, reopen during exit, close) and on a surface mounted already open (`!wasPresent` guard) — capture on every closed→open edge when opener is null
- WordCellView exit renders live `view.faces` for snapshotted cell cards (New game during fade shows new letters) — snapshot faces too
- WordCellView gets presence focus return the ticket did not specify — add a `focus:false` option or document/test
- Panel/Dialog `data-presence-target` has no static check; Sheet check is a bare count of 2
- silent guards in restoreFocus (rule 6), reduced-motion of Sheet/Panel by source scan only, focus restore across menu→X hand-off, Dialog exit only when `open` bound, Sheet/Panel focus + act() caller mount tests (need 6.2 openers)

## Result — converged after 3 passes
open major: openSurface('resetConfirm') over historyNotice with a sticky view or tail selection beneath throws from the clearing step.
