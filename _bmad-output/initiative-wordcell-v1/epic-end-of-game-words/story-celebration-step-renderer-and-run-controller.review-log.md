# Review log — story-celebration-step-renderer-and-run-controller.md
State: pass 1: done
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
