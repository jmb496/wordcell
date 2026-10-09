# Review log — story-controller-seams.md (ticket 5.4)
State: pass 1: done

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
