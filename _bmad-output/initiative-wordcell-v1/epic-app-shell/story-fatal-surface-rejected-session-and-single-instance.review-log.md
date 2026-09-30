# Review log — story-fatal-surface-rejected-session-and-single-instance (ticket 3.5)
State: pass 2: done

Mode: docs, thorough, max 7, budget 1500 words. Pass 0: 244 words, snapshot `story-fatal-surface-rejected-session-and-single-instance.passes/pass0.md`, HEAD e7384ee.
Note: the pull from tickets.toml entry 5 dropped `interface`, `tests`, `owns`; they are passed to reviewers and fixer as intent, and the pass 1 fixer adds them to the Description as `Interface:`, `Tests:`, `Owns:` lines.

## Pass 1 — 2026-09-30
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 14, minor 4, decision-needed 0  |  Dropped in triage: 0 (47 raw findings merged across lenses into 18)
Words (docs): 1283 (5.26 x pass 0)  |  Snapshot: story-fatal-surface-rejected-session-and-single-instance.passes/pass1.md  |  Fixer: all 18 applied; no commands or tool claims added
### Applied
- [major] Description — pulled entry lost interface/tests/owns → fixer 1
- [major] References — omit SPEC CAP-4, build-notes CAP-4/Fixtures, rule-coverage rows, review-log Pass 3, DESIGN.md Blocking message, AD-4/15/16; text.ts not named (3 lenses) → fixer 2
- [major] Description, boot order — font check vs load()/mount unplaced; today load() runs sync before mount, so "localStorage empty" needs the order; handlers before any await (3 lenses) → fixer 3
- [major] Description, font check — exact call, empty-list failure, timer not cleared (healthy game goes fatal at 30 s), timeout untested (4 lenses) → fixer 4
- [major] Description, halted boot — load() throws unless booting; loaded(), who mounts the another-window surface, "no mount" vs standalone mount unspecified (4 lenses) → fixer 5
- [major] Description, halt from rejected — storage event or fatal while the rejected root shows unspecified; a rejected window's New game could overwrite another window's game → fixer 6
- [major] Description, fatal text — haltCause carries no error text; source after mount, non-Error reasons, mounted flag unspecified (3 lenses) → fixer 7
- [major] Description, storage filter — only key null stated; wordcell: keys only, sessionStorage/foreign keys ignored; `storageArea === localStorage` in the store fails the AD-1 localStorage-owner scan (4 lenses) → fixer 8
- [major] Owns, storage-spy helper — no API, though entries 6 and 7 build on it (4 lenses) → fixer 9
- [major] Verify, fatal dispatch — "no later write" vacuous on the minimal board; bytes, error text, only Reload unasserted; AD-15 halted-writes test undefined (3 lenses) → fixer 10
- [major] Verify, rejected variants — fixture→variant→version mapping missing, "such as" fixture, only New game / no Board unasserted (4 lenses) → fixer 11
- [major] Verify/Tests, R-74 (and Q-29) rejected-root New game — deferred here by ticket 3.4, not listed (4 lenses) → fixer 12
- [major] Verify, two-page case — Reload and "first writes nothing after" dropped; one test or two (3 lenses) → fixer 13
- [major] Description, Blocking message — DESIGN.md names it for the rejected Session, build-notes for fatal/another-window; one component or two (4 lenses) → fixer 14
- [minor] haltCause getter only, current() stays { kind: 'halted' }, undefined unless halted → fixer 15
- [minor] Shell Vitest stubs window before a fresh import (store now adds a listener at creation) → fixer 16
- [minor] After rejected-root New game, a reload shows the board with the stored seed → fixer 17
- [minor] Fatal test asserts title, non-empty error body and Reload; exact message left to the plan → fixer 18
### Default applied (technical)
- Boot order — handlers → await font check → game.load() → mount (AD-16)
- Font check — Promise.race of fonts.load and a rejecting timer cleared on settle; page.clock timeout test plus healthy-boot-past-30 s test
- Halted load — load() while halted parses and records launch, writes nothing, stays halted; main.ts checks halted after each boot step and mounts only the standalone Blocking message
- halt(cause) valid from booting, rejected and active
- Fatal text — halt('fatal', text) stored beside haltCause; latest fatal replaces the text; `error.message` for an Error, else String(reason); mounted flag set after mount() returns, standalone clears #app
- Storage area check via a storage.ts helper (e.g. isLocalArea) so game.svelte.ts never names localStorage
- Storage spy — armStorageSpy(page, { throwOn?: key }) waits for current().kind !== 'booting', patches Storage.prototype.setItem for localStorage only, records { key, value }; storageWrites(page)
- One Blocking message component for all three surfaces

## Pass 2 — 2026-09-30
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 5, minor 12, decision-needed 0  |  Dropped in triage: 2
Words (docs): 1498 (6.14 x pass 0; budget 1500 reached)  |  Snapshot: story-fatal-surface-rejected-session-and-single-instance.passes/pass2.md  |  Fixer: all 15 applied; unverified: Playwright waitUntil 'domcontentloaded' and init-script stub of document.fonts.load (design statements)
### Applied
- [major] AC §2 / R-74 — pass 1 dropped the per-variant New game fresh-write that rule-coverage §2 requires; R-74 test names no fixture and seeds a *-invalid-* file outside a §2 test (AGENTS.md pitfall) (4 lenses) → fixer 1
- [major] AC fatal tests — Q-37 after-mount half and AD-15 before-mount half not under their ids (2 lenses) → fixer 2
- [major] Description, halted boot — "check after each step" vs "load still parses": does main.ts call load() when halted after the font check (2 lenses) → fixer 3
- [major] Interface — "game.svelte.ts rejected state rendering" puts rendering in the store; App.svelte and text.ts missing → fixer 4
- [major] AC — main.ts halted-boot path (standalone only, no App, no write) untested → fixer 5
- [minor] Storage spy — throwing call recorded, throws without writing; citation of open major 4 moved (3 lenses) → fixer 6
- [minor] halt valid while halted; haltText getter named; Vitest: haltCause undefined unless halted, second fatal replaces text → fixer 7
- [minor] New fixture = session-place.json with version 3 → fixer 8
- [minor] Font tests: goto waitUntil domcontentloaded, clock installed before goto (preload blocks load) (2 lenses) → fixer 9
- [minor] Font empty-list branch untested → fixer 10
- [minor] AD-15 P3 honesty: Playwright no-write checks cannot fail until entry 6's hide flush; Vitest is S (2 lenses) → fixer 11
- [minor] Shared fresh-import setup helper stubs window for every store test (2 lenses) → fixer 12
- [minor] rule-coverage §2 rows to be updated per open major 6 (plan's job) → fixer 13
- [minor] Reload calls location.reload() → fixer 14
- [minor] Boot as an async function so font failures exercise unhandledrejection, dispatch exercises error → fixer 15
### Default applied (technical)
- R-74 folded into a `§2 R-74 Q-29 …` test on session-invalid-version-unknown.json with history-three-records.json as sentinel
- Halted after the font check → load() still runs, then the standalone Blocking message, no later step
- Halted-boot Playwright: page 1 unseeded with the font held, page 2 writes a wordcell: key, release → another-window message, no Board, no Session
- Spy thrower: records the attempt, throws `Error('storage-spy: <key>')` without calling the original
- haltText getter, undefined unless cause is 'fatal'
### Dropped
- Empty Error message → omit body (edge; no ref, adds words over a trivial case)
- Import-time throw residual clause (already covered by "no storage reads at import")
