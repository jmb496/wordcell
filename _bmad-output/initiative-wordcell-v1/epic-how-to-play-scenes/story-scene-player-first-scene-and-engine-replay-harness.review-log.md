# Review log — story-scene-player-first-scene-and-engine-replay-harness.md

State: pass 1: done

Pre-loop: HEAD a5593dc4d44b2d08484392c5aa7437fad578e97d, 315 words (pass 0 copy: story-scene-player-first-scene-and-engine-replay-harness.passes/pass0.md). Growth budget 2.5x = ~790 words.

## Pass 1 — 2026-10-16
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 11 (merged from 4 reviewers), minor 6, decision-needed 1  |  Dropped in triage: 0 (duplicates merged)
### Applied (to fixer, list below in fix step)
- [major] ticket lacks toml fields (unknown, interface, tests, owns, consumers, references, plan_checkpoint, done_checkpoint)
- [major] scene format / fixture schema undefined (JSON vs UI script, step time as motion kind, targets, rest)
- [major] replay harness: start position via engine-internal seam, rejected-case format vs TABLE, optional fields, dictionary (inline Set), illegal-move check as mutation test
- [major] closed/hidden undefined, no new visibilitychange listener (AD-9), observable
- [major] reduced-motion frames/Next/resting frame, act()-wrapped text.ts controls
- [major] motion kinds for steps/rest; resolve open question
- [major] Card mirror static, scene-local wrappers, ghost separate, no data-card-id/testid
- [major] panel baseline and scene-1 final-frame baseline, consumers specs
- [major] scene 1 content: tray-opens beat and approved caption
- [major] Verify gaps: Animation speed Slow>Fast, figure/aria structure
### Default applied (technical)
- Reduced motion: Next absent on last frame (resting state), Replay returns to frame 1; no pause/play icon → HP-2/HP-6 reading
- Dictionary in replay: inline Set of fixture words
- Hidden: panel unmounted when closed; document hidden via existing shell signal, no listener in src/ui
### Decision needed (functionality / UX / gameplay)
- Scene tap: after a tap pauses a running scene, does the next tap resume from the paused point or restart from the beginning? — proposed default: pause when playing, restart from step 1 when paused (epic: "a tap pauses or restarts")

Fix applied; words 803 (2.55x pass 0); snapshot story-scene-player-first-scene-and-engine-replay-harness.passes/pass1.md. Minors applied: QU notation, open-question to plan checkpoint. Not applied: tap resume-vs-restart (decision-needed).
