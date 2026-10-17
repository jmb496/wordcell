# Review loop — ticket 8.4 build (code, quick, max 7)

State: pass 1: done
Pre-loop: HEAD 0cd5db3, tree snapshot 0 5b3d444. Range fe586c0..HEAD (build commit 0cd5db3). Intent: story-tricky-rules-section-plan.md

## Pass 1 — 2026-10-16
Reviewers: correctness, verification gap  |  Findings: major 3 (after merging), minor 4, decision-needed 0  |  Dropped: 1 (text.ts date, owner's date per epic Notes)
Snapshot: tree 8494dc0b9d3e5bb497fcf705057a6d452cecade0
### Applied
- [major] scenes.test.ts new tests — names must start AD-n (AGENTS.md); R-14/Q-34 test tied to column hit rect → fixer 1
- [major] frames' k/side unchecked vs engine → fixture `block` field compared in replayScene + frame test → fixer 2
- [major] e2e dest element wiring untested → visibility asserted per frame and after Replay → fixer 3
- [minor] Validate class exact token → 4; fixture-literal assertions removed → 5
### Default applied (technical)
- 4 test-structure defaults above
### Decision needed
- none
### Dropped
- text.ts 2026-10-17 date: owner's decision date in epic Notes
- Plan lacks sentence→test mapping (minor, plan doc, not applied)
