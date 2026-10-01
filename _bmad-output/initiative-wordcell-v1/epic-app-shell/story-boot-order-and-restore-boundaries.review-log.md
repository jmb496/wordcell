# Review log — story-boot-order-and-restore-boundaries.md (ticket 3.11)

State: pass 1: done

Mode: docs, thorough, max 7, budget 1500 words. Pass 0: HEAD f2c76de, copy story-boot-order-and-restore-boundaries.passes/pass0.md, 218 words.
Intent carried from tickets.toml entry 11 (not copied by the pull): interface, tests, owns; pass-1 fixer adds them to Description as 'Interface:', 'Tests:', 'Owns:'.

## Pass 1 — 2026-10-01
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 7, minor 8, decision-needed 0  |  Dropped in triage: 0 (about 15 duplicates merged)
Words (docs): 646 (3.0 x pass 0)  |  Snapshot: story-boot-order-and-restore-boundaries.passes/pass1.md
Fixer: applied 1–15; no commands or tool claims added
### Applied
- [major] Description / Verify — main.ts already runs the order and tests from 3.3/3.7/3.8 already cover some promises; reuse vs new unstated → fixer item 1
- [major] Description, crash mode — dispatch before crash, page2 captureBoot, exact assertions unstated; duplicates 3.3 kill test → fixer item 2
- [major] Description, restore suite — step sequence and snapshot timing (hidden mode) and "present before reload" unstated → fixer item 3
- [major] Description, finish-undone boundary — snapshot equality cannot prove the record stays removed → fixer item 4
- [major] Verify, startHidden — negative-only case passes on a never-requesting build (3.8 plan handed the positive case here) → fixer item 5
- [major] Verify, nothing written before font check — no healthy-boot case exists → fixer item 6
- [major] Description — Interface/Tests/Owns from tickets.toml entry 11 missing → fixer item 7
- [minor] Verify, rejected root before History notice — weaker than AD-16 deferral → fixer item 8
- [minor] Description — "minus the service worker" omits pointer controller, end sheet, requestPersistence → fixer item 9
- [minor] Description — "history-three-records.json undone" wording → fixer item 10
- [minor] Description — "(review-log open major 1)" ambiguous → fixer item 11
- [minor] Description — test ids for restore cases → fixer item 12
- [minor] Description — prefs-non-default case Session → fixer item 13
- [minor] Description — spec file and project scope → fixer item 14
- [minor] Interface — spine amendment recorded in build-notes, spine not edited → fixer item 15
### Default applied (technical)
- crash mode — extend the existing 3.3 kill test (Undo, captureBoot(page2), three-field __wordcellBoot assertion, Session exactly as written) instead of a second test
- "present before reload" — the key exists in localStorage at snapshot time, read in the same evaluate as current()
- hidden mode — hidePage, then snapshot, then reload
- prefs case — prefs-non-default.json seeded alone (boot writes the fresh Session, which the snapshot holds)
- suite file — e2e/restore.spec.ts, android-only skip; new AD-16 cases beside siblings in blocking.spec.ts / dictionary.spec.ts
- test ids — Session fixtures R-73, below-committed-last Q-41, prefs and history cases AD-17
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none
