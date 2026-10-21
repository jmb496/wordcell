# Review log — story-celebration-step-renderer-and-run-controller.md
State: pass 3: done
Pre-loop: HEAD 4efc910; pass0.md 276 words; budget default 2.5x (~690 words).

## Pass 1 — 2026-10-21
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 10 (merged from ~30 raw), minor 4, decision-needed 0  |  Dropped in triage: 0 (duplicates merged)
### Majors (all technical, default applied)
1. Step/renderer inputs undefined: bounds and per-entry launch origin (`cell`, SPEC F8) as plain data, measured once at start; step does no DOM.
2. Cap/fade: cap counts summed clamped dt; fade over last `baseMs`; wave/stagger scaled so any entry count finishes within the cap; run ends when all groups exited or at the cap; durations only via `motion.ts`.
3. `end()`/`cancel()`/`onEnd` semantics and the sync-vs-microtask `done` (AD-19) unreconciled.
4. Manual clock: non-multiple-of-16 remainder, idle/non-manual `advance`, `setManual` timing.
5. Real rAF loop: dt source, first frame, stop on end/cancel, no test.
6. Empty list outcome unstated.
7. Second `start` while running unstated.
8. Renderer: `rowScale` untestable as stated (23 letters, 360 px band, 0.4 floor), `aria-hidden`, overlap, QU, live-card count, direct transform writes.
9. `BASE_MS` export shape and cap values per speed untested.
10. Tests: ceiling, determinism, `AD-19` names, tickets.toml fields to add to Description.
### Minor
- Perf fallback note (not applied, over budget).
Words: 676 (2.4 x pass 0)  |  Snapshot: story-celebration-step-renderer-and-run-controller.passes/pass1.md
Fixer applied findings 1–9 and the tickets.toml fields; the perf-fallback minor not applied.

## Pass 2 — 2026-10-21
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 6, minor ~8, decision-needed 0  |  Dropped in triage: 0 (merged duplicates)
### Majors (all technical, default applied)
1. Empty-list `start` ordering and reentrancy: run marked inactive before `onEnd`/`done`; a `start` inside `done` is legal; `onEnd` fires on the empty path.
2. `rowScale` formula: clamp(0.9·band/rowWidth, 0.4, 1); the test fixes card width and expected values (3 letters → 1, 23 letters at 360 px → floor binds).
3. `step` inputs omit cap, `baseMs`, elapsed; the finished flag and who ends the run (both drivers call `end()`); `running()` missing from interface (entry 5 seam).
4. Renderer drops DESIGN Win celebration: normal card state of the live theme at `{components.card.width}`, shadow `0 6px 16px #0008`.
5. Direction and bounds: drift toward the side with more room (EXPERIENCE), floor = action bar top edge, ceiling/walls = band between bars; `start`'s geometry source; test of opposite drift.
6. Controller↔component element contract for per-frame writes (registration on mount; frames before registration step state only).
### Minor (applied only if word-neutral)
- `setManual` during a run throws; `advance` idle is the specified no-op; remainder cleared at `start`; `onEnd` replaced by a second call, persists; dt clamped to [0, 50]; stagger formula and "large list" size (not applied, over budget).
Words: 765 (2.8 x pass 0, over the 2.5x budget: minors now word-neutral only)  |  Snapshot: story-celebration-step-renderer-and-run-controller.passes/pass2.md
Fixer applied majors 1–6 and the word-neutral minors; rowScale expected value 0.675 (card width 40 per DESIGN) rather than the floor.

## Pass 3 — 2026-10-21
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 2, minor ~6, decision-needed 0  |  Dropped in triage: 1
### Majors (technical, default applied)
1. Group geometry undefined: per-group width/height in state (from `rowScale` and card size), `exited` = whole box beyond the wall it drifts toward, floor/ceiling contact edges, origin x and y relative to the band measured from the `wordcell-<n>` label, missing element throws (rule 6), tie at band centre drifts right.
2. Several stated rules had no Verify clause (onEnd replace/keep, setManual throw, advance remainder/no-op, rAF first-frame dt and clamp, pre-registration frames, no-op end/cancel).
### Dropped
- "cancel() vs onEnd ambiguous": the ticket says `onEnd` is called by `end()` only; an explicit test clause is covered by major 2.
### Minor (word-neutral only)
- Name `step.ts`; Slow cap compared with tolerance (10666.67); `advance` stops stepping/rendering after `end()` and ms ≤ 0 is a no-op. Registration API name and a 10-letter rowScale case left to the plan.
Words: 789 (2.9 x pass 0)  |  Snapshot: story-celebration-step-renderer-and-run-controller.passes/pass3.md
Fixer applied majors 1–2 and the word-neutral minors.
