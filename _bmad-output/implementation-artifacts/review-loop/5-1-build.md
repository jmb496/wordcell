# Review loop — ticket 5.1 build (code mode, 64ea5a4..443cbe5)
State: pass 2: done

Target: `_bmad-output/implementation-artifacts/review-loop/5-1-build.passes/pass0.diff` (git diff 64ea5a4..443cbe5; build commit 443cbe5)
Intent: `_bmad-output/initiative-wordcell-v1/epic-tray-and-place/story-draft-wordcards-and-the-composing-tray-plan.md`
Depth: thorough (correctness, edge cases, verification gap, intent alignment; fix diff from pass 2) | max 7
Follow-up risk flagged by the plan: WordLine refit lifecycle (invalid ↔ word branch switch with bind:this null, document.fonts.ready, real band-width changes)
Pre-loop: HEAD 443cbe5333a00f122005f08165abe73ec7d88a19, tree snapshot 0 b0554cf4235ee8cc882b6edf39665323e346aa88

## Pass 1 — 2026-10-08
Reviewers: correctness, edge cases, verification gap, intent alignment  |  Findings: major 2, minor 4, decision-needed 0  |  Dropped in triage: 2 (+1 duplicate merged)
Snapshot: tree a50a6244364b166ba2dcd36d7a759e645aeb6c01 (fix diff `5-1-build.passes/pass1.fix.diff`)
Fixer: items 1-6 applied in e2e/tray.spec.ts and WordLine.svelte (narrow width derived from measured 14/16 px widths, suffix right ≤ line right; R-38 size 14…16 after the branch switch, mutation-checked: a skipped refit fails at 20; `wordKey` derived; 360 px viewport case (no fixture word forces a shrink at 360 px, so it proves resize pickup and no overflow only); `8 letters`; BADGE_VARIANTS middle/first/last/k=1). Fixer runs: tray+dictionary android 33 passed, tray --repeat-each=3 57 passed. Orchestrator check: `npm test` 52 files, 2075 passed; lint clean (186 files); check 0 errors.
### Applied
- [major] e2e/tray.spec.ts 'AD-11 (R-38) a narrowed invalid line … suffix is never truncated' — at 120 px (box 98) the flex:none suffix is clipped by `.line`, and `scrollWidth <= clientWidth` on the suffix itself can never fail; assert suffix right ≤ line right at a width where 14 px fits but 16 px does not (edge cases + verification gap, merged) → fixer item 1
- [major] e2e/tray.spec.ts R-38 invalid-line test / WordLine.svelte refit effect — no test proves the word → invalid branch switch (bind:this swap) refits to the 16 px max (plan's flagged risk); assert computed size 14…16 and no overflow after Validate without narrowing → fixer item 2
- [minor] WordLine.svelte refit effect — depends on the `wordCards` array identity, which is new on every view; key it on the rendered text → fixer item 3
- [minor] e2e/tray.spec.ts — band-width change only via inline `.word-line` width; add a real `setViewportSize` case (fonts.ready stays untested; refit after it is a one-line handler) → fixer item 4
- [minor] e2e/tray.spec.ts letter count — every case is a non-QU word; assert `8 letters` in the BADGE_SCRATCH test (R-36 QU = 2) → fixer item 5
- [minor] e2e/tray.spec.ts ×2 badge — only the middle block tile checked; add QU-first and QU-last (and k=1) block positions → fixer item 6
### Default applied (technical)
- invalid-line narrowed width — derive from measured widths (14 px fits, 16 px does not) instead of a literal
- refit dependency — a `$derived` joined string of the word line text
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- intent: tickets.toml hand-off for entries 2 and 3 not made — not a code defect; the build workflow forbids ticket-file writes and the plan's frontmatter `deferred` records the exact text for the orchestrator (left to the caller)
- intent: BADGE_SCRATCH inline instead of fixtures/*.json — the plan's Design Notes sanction it ("not a fixture, seeded in the browser check only"); it is seeded through `seedStorage`

## Pass 2 — 2026-10-08
Reviewers: fix diff, edge cases, verification gap, intent alignment  |  Findings: major 2, minor 4, decision-needed 0  |  Dropped in triage: 0 (+2 duplicates merged)
Snapshot: tree e4204a95b3accdae18a6d0df783d37b708699fcc (fix diff `5-1-build.passes/pass2.fix.diff`)
Fixer: items 1-6 applied in e2e/tray.spec.ts only (shared `lineGeometry`/`fitted`/`measuring`/`raiseK` helpers; 14 px ellipsis case; mounted word → TANE and invalid → word refit cases; 360 px case now forces the shrink unconditionally; exact `fitted` size; no leftover `.wc-measuring`). Mutation: removing the effect fails (a), (b) and R-38; dropping `wordKey` alone stays green because `rejectedWord` reads `game.feedback`, which the store replaces on every changing dispatch (behaviour correct, trigger redundant). Fixer runs: tray+dictionary android 36 passed; tray --repeat-each=3 66 passed. Orchestrator check: `npm test` 2075 passed; lint clean; check 0 errors.
### Applied
- [major] e2e/tray.spec.ts invalid line — no case narrows below the 14 px full width, so the story's "at 14 px only the word span ellipsizes; the suffix is never truncated" is untested (a shrinkable suffix or missing `min-width: 0` would pass) → fixer item 1
- [major] WordLine.svelte refit effect / e2e — no test re-measures on text change while mounted (new word via tapDestinationCard; invalid → word switch back to max 20 after feedback clears); dropping `wordKey`/`textEl` from the effect stays green (verification gap + edge cases, merged) → fixer item 2
- [minor] e2e/tray.spec.ts BADGE_SCRATCH comment — column 3 order is top → bottom, not bottom → top → fixer item 3
- [minor] e2e/tray.spec.ts 360 px viewport case — cannot fail with a broken refit when nothing needs to shrink; force a shrink or rename to a no-overflow check (fix diff + verification gap, merged) → fixer item 4
- [minor] e2e narrowed cases — ranges only; assert the size equals the largest px whose measured natural width fits (derived, F11-safe) → fixer item 5
- [minor] e2e — no check that `wc-measuring` is removed after refit → fixer item 6
### Default applied (technical)
- 360 px case — rename to a no-overflow check unless a real width forces a shrink
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none
