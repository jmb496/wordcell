# Review log — story-boot-order-and-restore-boundaries.md (ticket 3.11)

State: pass 3: done

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

## Pass 2 — 2026-10-01
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 2, minor 11, decision-needed 0  |  Dropped in triage: 1 (about 10 duplicates merged)
Words (docs): 804 (3.7 x pass 0)  |  Snapshot: story-boot-order-and-restore-boundaries.passes/pass2.md
Fixer: applied 1–12; no commands added; noted snapshot() needs extending to report present keys
### Applied
- [major] Verify, font case — 'booting' holds from module load and index.html preloads the font, so the no-key check can run before boot reaches fontCheck → fixer item 1
- [major] Description, restore asserts — only loaded() checked after reload; a boot that replaced the parsed Session would pass (R-73 restored on launch) → fixer item 2
- [minor] Verify — no check that build-notes Spine notes carry the AD-17 amendment → fixer item 3
- [minor] Verify lead — "existing tests kept as they are" conflicts with extending the kill test → fixer item 4
- [minor] Description — "Q-41 (R-73)" leaves the leading id unclear → fixer item 5
- [minor] Verify, startHidden — no wait window for the negative check → fixer item 6
- [minor] Verify, font case — captureBoot unused; string vs object comparison; history/prefs absence → fixer item 7
- [minor] Description — "(Done when 2)" points at the epic → fixer item 8
- [minor] Description — restore suite helpers and hook-readiness → fixer item 9
- [minor] Description — test titles per mode → fixer item 10
- [minor] Interface — main.ts change expectation reads two ways → fixer item 11
- [minor] Verify, startHidden — "beside the AD-16 describe" placement → fixer item 12
### Default applied (technical)
- font case — wait for the held woff2 request, the nav launch stamp ({ wc: 0, launch } in history.state) with current() still 'booting', then animationFrames(page, 2); assert no wordcell:* key; release; JSON.parse(wordcell:session) deep-equals current().session, history and prefs absent, all __wordcellBoot values null
- after reload — current().kind 'active', current().session deep-equals loaded().session except activeMs not smaller, current().prefs deep-equals loaded().prefs when non-null
- restore suite — reuse/extract game-store.spec.ts open() and snapshot() helpers
- test titles — '<id> <fixture> restores after hidden then reloaded | reloaded without a hide'
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- Crash mode __wordcellBoot comparison "adds little" — the comparison is the AD-17 seam check the ticket intends; no change needed

## Pass 3 — 2026-10-01
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 2, minor 12, decision-needed 0  |  Dropped in triage: 1 (about 6 duplicates merged)
Words (docs): 909 (4.2 x pass 0)  |  Snapshot: story-boot-order-and-restore-boundaries.passes/pass3.md
Fixer: applied 1–12; no commands added
### Applied
- [major] Verify, rejected root bullet — credited to '§2 AD-13 deferred push: …', whose name lacks AD-16, while the ticket forbids touching it; rule-coverage AD-16 row (P3) needs an AD-16-named test → fixer item 1
- [major] Description, helper reuse — open()/snapshot() are module-local in game-store.spec.ts; "if needed" extraction, snapshot shape change and helpers.spec.ts tests unstated → fixer item 2
- [minor] Verify lead — "each AD-16 ordering promise" overclaims; scope to the CAP-10 promises → fixer item 3
- [minor] Verify, font case — launch id is random; state as wc 0 and launch a number → fixer item 4
- [minor] Verify, font case — goto must use waitUntil 'domcontentloaded' (preload blocks load); release every held woff2 route; wait for 'active' before comparing → fixer item 5
- [minor] Verify, font case — all-null __wordcellBoot check proves nothing in an empty context; cut → fixer item 6
- [minor] Verify, font/startHidden — animationFrames is local to dictionary.spec.ts → fixer item 7
- [minor] Verify, font case placement — file level after the Q-37 AD-15 fatal describe → fixer item 8
- [minor] Description — hidden-mode step list lacks the reload tail → fixer item 9
- [minor] Description, Asserts — current().history not compared with loaded().history; cut the mismatched "(as the kill variant does via sessionOf)" → fixer item 10
- [minor] Description, titles — two-fixture case title → fixer item 11
- [minor] Crash mode — Done when 2 read via AD-17 "the Session as written by the last dispatch" → fixer item 12
### Default applied (technical)
- rename nav.spec.ts:146 to '§2 AD-13 AD-16 deferred push: …' (body unchanged)
- extract open()/snapshot() to e2e/helpers/restore.ts (snapshot adds present wordcell:* keys; open waits for kind !== 'booting'), tested in e2e/helpers.spec.ts; game-store.spec.ts imports them; other specs' open() variants left to CAP-11
- animationFrames moves to e2e/helpers/lifecycle.ts, tested in helpers.spec.ts, imported by dictionary.spec.ts and blocking.spec.ts
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- restore.spec.ts comment pointing at the kill variant — Owns line and Crash mode paragraph already locate it
