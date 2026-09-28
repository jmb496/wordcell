# Review log — ticket 1.1 build (code mode)

Target: diff `6396100..working tree` of ticket 1.1 (build commit `04ff50a`). Refs: story 1.1,
its plan, ARCHITECTURE-SPINE.md (AD-1, AD-2, AD-14, AD-17), epic 1 SPEC/build-notes/delta-checks,
AGENTS.md, CLAUDE.md. Rules: cap 7; technical choices take defaults.

## Pass 1 — 2026-09-27 21:40
Reviewers: correctness, edge cases, verification gap, intent alignment  |  Findings: major 0, minor 7 (after merging duplicates), decision-needed 0  |  Dropped in triage: 0
### Applied (post-convergence cleanup; all technical, default applied)
- [minor] engine directives — `// @TS-NOCHECK` / `/// <REFERENCE LIB="dom" />` bypassed check 1 (tsc is case-insensitive) → `i` flag, fixtures.
- [minor] markup `history` bindings — `let:history`, destructuring in `{@const}` / `{:then}` / `{:catch}` missed → regex widened, fixtures; nested-brace `{#each}` pattern noted as a known limitation.
- [minor] `historyBindings` — destructuring assignment `({ history: h } = x)` and object-literal get/set `history` missed → counted, fixtures.
- [minor] engine imports — `'..'`/`'.'` resolving to `src/engine` and dotted names like `./deal.data` falsely failed → accepted; extension check limited to code/asset extensions.
- [minor] mutation-surviving matchers (8) → one pinning fixture each.
- [minor] identifier-boundary lookarounds unpinned → passing boundary fixtures.
- (duplicate of the markup-binding and engine-`..` findings from a second lens merged above.)
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none

Verification after cleanup: `npm run test:all` green — lint clean, check 0 errors, Vitest 236 passed, Playwright `AD-17` on android and desktop.

## Result — converged after 1 pass
