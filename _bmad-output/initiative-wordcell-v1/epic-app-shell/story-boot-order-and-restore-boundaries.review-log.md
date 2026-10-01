# Review log — story-boot-order-and-restore-boundaries.md (ticket 3.11)

State: pass 5: done

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

## Pass 4 — 2026-10-01
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 1, minor 13, decision-needed 0  |  Dropped in triage: 0 (about 5 duplicates merged)
Words (docs): 1034 (4.7 x pass 0)  |  Snapshot: story-boot-order-and-restore-boundaries.passes/pass4.md
Fixer: applied 1–13; no commands added
### Applied
- [major] Verify, font case — pass 3 dropped pass 2's wait for the held woff2 request; releasing before it is held leaves the font held until the 30 s fatal, so the gating case can hang → fixer item 1
- [minor] Description, open() — keep signature open(page, url = '/') and the heading wait; predicate `__wordcell !== undefined && current().kind !== 'booting'` (optional chaining is true while undefined), same after reload → fixer item 2
- [minor] Description, helper move — sessionOf() and the Snapshot type move too → fixer item 3
- [minor] Description, snapshot() — name the field `present` and the helpers.spec.ts case → fixer item 4
- [minor] Description — Undo dispatched by the Undo button click, as the kill variant → fixer item 5
- [minor] Description, Asserts — "the snapshot's current().session/.history/.prefs" (SPEC CAP-10) → fixer item 6
- [minor] Verify, startHidden — count with countRequests from goto until 'ready': exactly one → fixer item 7
- [minor] Verify lead — bodies kept except the rename and kill extension; only helper imports change → fixer item 8
- [minor] Description — "Pins the CAP-10 ordering promises of AD-16's boot order" → fixer item 9
- [minor] Description, Asserts — hidden mode: activeMs equal (clock paused after hidePage); plain mode not smaller → fixer item 10
- [minor] Description, Asserts — primary-action label after reload equals the pre-reload label (R-73 (UI) exact phase) → fixer item 11
- [minor] Description, titles — finish-undone 'R-84 AD-17 …', prefs '§7.10 AD-17 …' (AGENTS.md id order) → fixer item 12
- [minor] Verify, first bullet — the existing test's route handler checks the DOM when the request arrives (not a held route) → fixer item 13
### Default applied (technical)
- font case — expect.poll until at least one woff2 route is held, then the stamp/booting/two-frames wait, then continue every held route
- snapshot() field `present: ('wordcell:session' | 'wordcell:history' | 'wordcell:prefs')[]`; helpers.spec.ts: a session-only seeded page reports ['wordcell:session'] and open() resolves with kind 'active'
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none

## Pass 5 — 2026-10-01
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 1, minor 11, decision-needed 0  |  Dropped in triage: 0 (about 5 duplicates merged)
Words (docs): 1034 (4.7 x pass 0), unchanged (no fix pass)  |  Snapshot: story-boot-order-and-restore-boundaries.passes/pass4.md
### Open (not fixed; stopping rule: passes 4 and 5 each at most one major)
- [major] Description, restore suite (pass 4 item 11) — the primary-action label check races the dictionary: for the idle-phase cases (R-84 finish undone, §7.10 fresh Session) the label is 'Loading words…' or 'Validate' depending on dictionaryState(), a hidden page never starts the fetch, and the step list does not say when the pre-reload label is read. Proposed fix: read the label in the snapshot step (before hidePage) after waiting for dictionaryState() 'ready' (dictionaryReady() moving to e2e/helpers/restore.ts); after the reload wait for the kind predicate, then 'ready', then read it.
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none

## Result — converged after 5 passes
open major: restore-suite primary-action label check races the dictionary state and its pre-reload read point is unstated (Pass 5 Open).
Majors per pass: 7, 2, 2, 1, 1. Technical defaults applied: 19. Words 218 → 1034.

### Unapplied minors (for the build's plan)
- snapshot() `present` order undefined: filter in fixed order ['wordcell:session', 'wordcell:history', 'wordcell:prefs'].
- Crash mode: also compare page2's primary-action label with page's after the Undo (Place → Confirm, no dictionary race), for rule-coverage "R-73 exact phase after Android kills the app".
- Q-41 case title order: 'R-73 Q-41 …' per AGENTS.md (R-id first).
- Restore flow: call open(page) instead of restating goto + predicate; reuse the same wait after page.reload().
- Font case: fold `window.__wordcell !== undefined` into the stamp/'booting' waitForFunction predicate.
- animationFrames helper test in helpers.spec.ts unnamed (e.g. resolves after N frames).
- First sentence: "pins CAP-10's three ordering promises" (prefs → Session and lifecycle → surfaces → mount order stay S).
- Hidden-mode exact activeMs is stricter than SPEC CAP-10 / Done when 2: cite AD-9 paused clock as the reason.
- After reload, when loaded().history/.prefs is null, optionally assert current()'s in-memory defaults (SPEC CAP-10).
- Restore titles: R-73 and Q-41 cases could also carry AD-17 for the rule-coverage AD-17 row, or say why only two do.
