# Review loop — ticket 3.9 build (code, 43d46dc..5f2d46b)

State: pass 1: done

Target: `_bmad-output/implementation-artifacts/review-loop/3-9-build.passes/pass0.diff` (43d46dc..5f2d46b)
Intent: `_bmad-output/initiative-wordcell-v1/epic-app-shell/story-dictionary-load-retry-and-validate-plan.md`
Depth: thorough, max 7. Pre-loop HEAD 5f2d46b, tree snapshot 0 e4e8fb9370664033cb9a438acbf91d9641f43b50.

## Pass 1 — 2026-10-01
Reviewers: correctness, edge cases, verification gap, intent alignment  |  Findings: major 1, minor 3, decision-needed 0  |  Dropped in triage: 3
Snapshot: tree 94bb292d4e3485627c894bf4c2ed1dfd3f6a09cd  |  Fix diff: 3-9-build.passes/pass1.fix.diff  |  Verify: npm test 1612 passed (32 files), lint clean, check 0 errors; fixer ran dictionary.spec.ts android 13 passed; both new assertions fail with the behaviour broken (aria-hidden removed; banner rendered on the rejected root)
Fixer: all 4 applied (plan Design Notes 5 test names updated)
### Applied
- [major] e2e/dictionary.spec.ts invalid-word and rejected-root tests — two stated ticket sentences have no assertion: the ✕ in its own aria-hidden element, and no banner on the Session-rejected root while the list is failing (the rejected-root test runs only with a ready list) → fixer item 1
- [minor] e2e/dictionary.spec.ts '§2 a Session-rejected root still loads the word list' — covers the AD-16 start rule; add AD-16 to the name → fixer item 2
- [minor] e2e/dictionary.spec.ts '§2 replay never consults…' (banner visible + colour) and 'Q-42 Reload after a 404 reloads the page' — ticket AC says banner cases are named with AD-8; add AD-8 → fixer item 3
- [minor] e2e/dictionary.spec.ts 'AD-8 Q-42 under a stubbed service-worker controller…' — a stub must not count as the Q-42 controlled-SW coverage owned by epic 7 P7; drop Q-42 from the name → fixer item 4
### Default applied (technical)
- item 1: add the two assertions (aria-hidden ✕ sibling; a failing-route rejected-root variant asserting the banner text has count 0)
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- correctness [major] / intent [decision-needed] — banner hides after a successful in-place Reload under a controlling SW vs spec Q-42 / AD-8 / EXPERIENCE "stays until the next launch": the owner accepted the ticket review's proposed default (ticket review-log line 88: "recovered words make Validate work again and the banner then hides"), recorded in the epic and ticket Notes; the stale spec/spine/EXPERIENCE wording is owner-owned text already listed as deferred in the plan front matter. Not a code defect; carried to the owner as a doc sync.
- edge cases [minor] — controller sampled at Reload tap rather than at the 404: the plan (Load bullet) specifies the tap-time read, and the owner decision is "a controlled page never reloads", which tap-time sampling implements.
