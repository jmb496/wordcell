# Review log — story-controller-seams.md (ticket 5.4)
State: pass 2: done

Mode: docs, thorough, max 7, budget 1500 words. Pass 0: 251 words (`.passes/pass0.md`), HEAD e261011. Intent fields from tickets.toml entry 4 (interface, tests, owns, consumers, unknown, verify, references): `.passes/intent.md`.

## Pass 1 — 2026-10-08
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 8, minor 6, decision-needed 0  |  Dropped in triage: 0 (duplicates merged across the four lenses)
Words (docs): 852 (3.39 x pass 0)  |  Snapshot: .passes/pass1.md
Fixer: all 14 items applied; e2e/helpers/drag.ts has no class literals, left out of Consumers; no commands added.
### Applied
- [major] Description — tickets.toml entry 4 interface/tests/owns missing; intent's interface omits the live `refreshHover` (controller.ts:1003, App.svelte:37) → fixer item 1
- [major] Description — L1 consumers missing (clip: pickTarget, drop-target registration, Q-34 hasLeftSource, entry 7 tray band; class names: Column/HoverPeek CSS + seven e2e files incl. drag-interruptions, helpers/drag.ts, helpers.spec.ts) → fixer item 2
- [major] Description classes.ts — Column.svelte/HoverPeek.svelte use the names only in `<style>` `:global()` selectors, cannot import TS → fixer item 3 (default applied)
- [major] Description lookup.ts — helper shape and site list undefined (GameView finds, DOM closest, registry finds; tags.ts missing+empty one message) → fixer item 4 (default applied)
- [major] Description "behind the existing deps pattern" — module seams, closure-state ownership (press, flying, root, lastPoint, suppressed), cross-calls (settle → suppress, refreshHover) and what stays in controller.ts undefined → fixer item 5 (default applied)
- [major] AC/Notes — median "decides" with no pass rule, run count or action → fixer item 6 (default applied)
- [major] Description "harness moved only" — where, and whether vi.mock/vi.hoisted move; new test files? → fixer item 7 (default applied)
- [major] Description "Entry N" headers — file set and inline-tag scope undefined → fixer item 8 (default applied)
- [minor] fixer items 9–14 (line map at HEAD, refs, plan mapping "none", lookup.ts imported outside gestures/, fly-back throws verbatim, class values byte-identical)
### Default applied (technical)
- classes.ts: TS imports; CSS selectors and e2e literals unchanged; also HOVER_FROM/HOVER_LEN
- lookup.ts: generic `found(value, message)` + `cellIn`/`columnIn` on it; column keeps index + field check; tags.ts one message
- seams: per-module factories built inside createController from its existing deps plus getter hooks; ControllerDeps unchanged; no module-level state; call order kept; drag, tap actions, hover classes, long-press peek stay
- median: 5 warm `npm test` runs on a Linux-filesystem checkout; after < 5 s and ≤ ~5 % above before; one vi.resetModules() per setup
- harness: tests and vi.mock blocks stay in controller.test.ts; no new test files
- Entry N: top-of-file headers of non-test src/ui files; inline tags → spec ids; tests, shell, main.ts out of scope
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none

## Pass 2 — 2026-10-08
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 4, minor 10, decision-needed 0  |  Dropped in triage: 1
Words (docs): 1169 (4.66 x pass 0; budget 1500)  |  Snapshot: .passes/pass2.md
Fixer: all items applied; Drag/clearDrag stay in controller.ts (fly-back imports the type only); overlays noted as the real module, not mocked; grep run for the Headers list.
### Applied
- [major] Interface vs Headers — "App.svelte untouched" while Headers rewrites its Entry 7 comment (App.svelte:32) → fixer item 1
- [major] Seams — pass-1 item 5 only half resolved: settle → clearDrag, gate.leave, suppress, refreshHover crosses modules; hoverEnter reads `flying`; `attribute()`, `Drag`, `clearDrag`, detach's `suppressed = null` have no home → fixer item 2 (default applied)
- [major] Headers — pattern misses "Epic 5 entry N" (layout/fit.ts, tray/WordLine.svelte), Card.svelte forward ref "set by entry 5", no mapping for inline tags, inline-only files → fixer item 3 (default applied)
- [major] AC median — method differs from AD-17 Speed (discarded warm-up + median of three); "~5 %" gate within WSL noise → fixer item 4 (default applied)
- [minor] fixer items 5–13 (lookup list authoritative + 269 left, `found` nullish only, harness: no new vi.mock + overlays real, Consumers e2e/helpers/drag.ts prefix and controller.test.ts class order, clip wording vs drop-target.ts, `found` is the one helper, `lifted` stays Card literal + var() refs, before/after commits, pointerdown/detach statement order)
### Default applied (technical)
- fly-back.ts takes `{ gate, clearDrag?, onSettle }`-style hooks; onSettle = suppress then refreshHover; hover-peek-timer takes isFlying/pressHeld/root/lastPoint hooks and exposes reset(); `attribute()` to lookup.ts; no new module imports controller.ts
- median: AD-17 method; hard gate < 5 s + one vi.resetModules() per setup; > 10 % rise after one re-run → per-file timings in the plan and fix before built
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- Notes "Open question" relabel — it is the tickets.toml `unknown`, kept as the prior tickets do; it already points to the AC rule
