# Review log — story-game-store-load-dispatch-and-storage.md (ticket 3.3)
State: pass 4: done

Mode: docs, thorough, max 7, budget 1500 words. Pass 0: 219 words, copy at story-game-store-load-dispatch-and-storage.passes/pass0.md (HEAD 676e286).
Carried intent from tickets.toml entry 3 (not copied by the pull): interface, tests, owns — added to Description in pass 1.

## Pass 1 — 2026-09-30
Reviewers: builder's reading, edge-case, adversarial, ref alignment  |  Findings: major 6, minor 11, decision-needed 0  |  Dropped in triage: 0 (duplicates merged: 33 raw → 17)
Words (docs): 810 (3.70 x pass 0; budget 1500)  |  Snapshot: story-game-store-load-dispatch-and-storage.passes/pass1.md
Fixer: all 17 applied; no commands touched.
### Applied
- [major] Description — add Interface/Tests/Owns lines from tickets.toml entry 3 (caller instruction) → fixer 1
- [major] Description clock — nothing resumes the clock in entry 3 (AD-16 resume lands with entry 6 listeners); take returns 0 so accrue is same-ref in Playwright; Vitest resumes the clock itself under stubbed performance.now → fixer 2
- [major] Description dispatch — which DispatchResult fields entry 3 fills (finished/unfinished need reconcile's status comparison; reconcile is entry 7) → fixer 3
- [major] References/Verify — rule-coverage §5 R-73/R-74 rows missing: stored Session deep-equals current().session (after load and each Undo/Redo), two fresh contexts differ, no off-origin/non-GET request; cite rule-coverage.md and SPEC CAP-3/E1 → fixer 4
- [major] Tests — rule-coverage AD-9 clock row (peek non-consuming, resume/pause idempotence) owned by no entry → fixer 5
- [major] Description spec moves — e2e/pwa/font.spec.ts:99 locates `placeholder board` text; replacing the meta line breaks test:e2e:dist → fixer 6
- [minor] E1 fidelity vs disposable board → fixer 7
- [minor] load: E7 removal, main.ts load() before mount, re-entry throws, parse ok → active nothing written → fixer 8
- [minor] booting/rejected render before entry 5; four-kind union → fixer 9
- [minor] write-then-assign order → fixer 10
- [minor] primary-action is entry 4; Undo/Redo enablement → fixer 11
- [minor] loaded() source is the store's launch parse → fixer 12
- [minor] kill variant: unseeded new page, same context, comparison value → fixer 13
- [minor] kill variant owner: epic Notes split line stale (tickets.toml gives it to entry 3) → fixer 14
- [minor] Vitest isolation of module-level store → fixer 15
- [minor] globals.d.ts Session type; test-hook specs key assertions → fixer 16
- [minor] later board changes regenerate the baseline → fixer 17
### Default applied (technical)
- dispatch — full AD-4 type now: changed, rejectedWord passed through from apply, finished/unfinished from view(accrued).status vs view(result.session).status; write before state assignment
- clock — no resume in entry 3
- board — DESIGN.md colour/type tokens and button component; WordCells 3–10 as simple labelled stacks, no AD-11 geometry
- booting/rejected — WordCell heading only; union carries all four kinds (halted unreachable until entry 5)
- Vitest — vi.resetModules + stubGlobal + dynamic import per test
- globals.d.ts — `import type { Session } from '../src/engine/index'`
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none

## Pass 2 — 2026-09-30
Reviewers: fix diff, edge-case, adversarial, ref alignment  |  Findings: major 5, minor 14, decision-needed 0  |  Dropped in triage: 1 (duplicates merged: 26 raw → 19)
Words (docs): 1090 (4.98 x pass 0; budget 1500)  |  Snapshot: story-game-store-load-dispatch-and-storage.passes/pass2.md
Fixer: all 18 applied; no commands touched.
### Applied
- [major] Load — "load() throws unless booting" contradicts SPEC CAP-4 / entry 5 halt-before-load (load still parses, stays halted, no write) → fixer 1
- [major] Verify — Undo/Redo and kill-variant checks pass when nothing is written (circular); require the stored/current Session to differ from before the action and from the seeded fixture → fixer 2
- [major] Dispatch — a rejectedWord shell Vitest case cannot run in entry 3 (no dictionary until entry 9; validate without dictionary throws command-dictionary) → fixer 3
- [major] Load/States — rejected reason must keep the parse failure's version (serialize.ts VersionFailure / replay-failed carry `version`); entry 5 shows it → fixer 4
- [major] Tests — loaded() shapes null (fresh launch) and { rejected } and unchanged-after-dispatch untested (rule-coverage AD-17 loaded() row carries 3) → fixer 5
- [minor] session-won example order (Undo off the win, then Redo) → fixer 6
- [minor] coverage citation narrowed to this ticket's parts (Confirm/New game/feedback entry 4, halt entry 5, restore suite entry 11) → fixer 7
- [minor] current() is the AD-17 union; active carries session only until entries 7/10 → fixer 8
- [minor] writes use serializeSession, reads parseSession (AD-7) → fixer 9
- [minor] request check: fixture, action and project → fixer 10
- [minor] status compared once per dispatch; entry 7 reconcile reuses it → fixer 11
- [minor] accrue-only case names a TABLE no-op row → fixer 12
- [minor] tests import clock.ts from the same fresh module graph → fixer 13
- [minor] Undo/Redo native disabled; WordCell stack label → fixer 14
- [minor] first-launch write before entering active → fixer 15
- [minor] helpers.spec raw seeds reach rejected harmlessly (wording) → fixer 16
- [minor] throwing-write Vitest case → fixer 17
- [minor] clock resume(0) and seed 0 / 4294967295 boundary cases → fixer 18
### Default applied (technical)
- load guard — throws once load has run (active or rejected); entry 5 adds the halted path
- rejected reason — `{ reason, version? }` (the parse failure minus `ok`), in state, current() and loaded().session; globals.d.ts imports ParseSessionResult type
- rejectedWord — store passes `dictionary: undefined` until entry 9; the pass-through test moves to entry 9's Validate
- request check — session-place.json, Undo, reload, page.on('request') on android dev-server
- disabled — native `disabled`; stack labelled by its cell number
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- globals.d.ts engine import may trip tsconfig.e2e.json noUnused* — build-plan detail (npm run check catches it; fix engine, not config)

## Pass 3 — 2026-09-30
Reviewers: fix diff, edge-case, adversarial, ref alignment  |  Findings: major 1, minor 12, decision-needed 0  |  Dropped in triage: 0 (duplicates merged: 17 raw → 13)
Words (docs): 1198 (5.47 x pass 0; budget 1500)  |  Snapshot: story-game-store-load-dispatch-and-storage.passes/pass3.md
Fixer: all 13 applied; no commands touched.
### Applied
- [major] Load vs Tests — stated load behaviours untested: throwing first-launch write (stays booting, rethrows, loaded() still throws), second load() throws, parse-ok load writes nothing, import does no top-level storage read → fixer 1
- [minor] loaded() shape in entry 3 unstated — carries only session until entries 7/10 (build-notes CAP-3: never null before) → fixer 2
- [minor] rejected case without version (version-unreadable); variant read as reason.reason → fixer 3
- [minor] accrue-only no-op case named: setDestinationCount k = 1 on session-composing.json (TABLE R-71 no-op) → fixer 4
- [minor] gaveUp branch of finished/unfinished untested → fixer 5
- [minor] clock starts paused; take() before any resume returns 0 → fixer 6
- [minor] status compared only on a changing dispatch → fixer 7
- [minor] WordCells as wordcell-<n> stacks of live cards (data-place cell) per E1 / build-notes CAP-3 → fixer 8
- [minor] Undo/Redo text-labelled secondary buttons on the disposable board (DESIGN icon-only deferred) → fixer 9
- [minor] font.spec locator targets the Seed line only → fixer 10
- [minor] "while booting" unrenderable → "while rejected" → fixer 11
- [minor] kill variant compares stored Session (JSON.parse), not text → fixer 12
- [minor] storage.ts read/write/remove direct Vitest case → fixer 13
### Default applied (technical)
- loaded() — `{ session }` only until entries 7/10
- no-op case — setDestinationCount k = 1 on fixtures/session-composing.json
- status comparison — only when result.session !== accrued
- Undo/Redo — text-labelled secondary buttons named Undo and Redo on the minimal board
- font.spec — Seed line locator
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none

## Pass 4 — 2026-09-30
Reviewers: fix diff, edge-case, adversarial, ref alignment  |  Findings: major 1, minor 17, decision-needed 0  |  Dropped in triage: 0 (duplicates merged: 18 raw → 17)
Words (docs): 1198 (5.47 x pass 0; budget 1500)  |  Snapshot: story-game-store-load-dispatch-and-storage.passes/pass3.md (no fix pass)
### Open (not fixed — stopping rule: passes 3 and 4 each ≤ 1 major)
- [major] Board (E1) — pass 3 fixer 9 made Undo/Redo text-labelled buttons "not DESIGN.md's 44×44 icon-only buttons"; SPEC E1 puts the minimal board "in the DESIGN.md components and tokens" and DESIGN.md undoRedo is 44 × 44 icon-only button-secondary (↶/↷, accessible names Undo/Redo). Fix: use the DESIGN.md undoRedo component with accessible names Undo and Redo (role/name locators unchanged); same word count.
### Minors (not applied; for the build plan or the next loop)
- Tests — "a second load() throws" reads as part of the throwing-first-launch case (store still booting); split with semicolons: "load() after an active or rejected load throws"
- Tests clock — add pause-gap case: resume(0), pause(10), take(100) → 10; resume(200), take(205) → 5
- Tests dispatch — negative case: TABLE no-op with the clock paused returns changed false and writes nothing
- Tests — "dispatch order" has no observable outcome; make it concrete (resume, advance performance.now, Undo, written Session = post-Undo with activeMs added)
- Description — "writes on every new reference" → writes when result.session !== the pre-accrue session (AD-4, build-notes CAP-3)
- Dispatch — cut "(entry 7's reconcile reuses that comparison)"; AD-6 reconcileHistory derives status itself
- Spec moves — font.spec: `/placeholder board/` becomes the Seed line (`/^Seed \d+/`); the spec stays unseeded
- Board — "The `Seed <n>` line replaces the meta line"
- Tests — assert Undo/Redo disabled state (Redo disabled on session-place.json before Undo, enabled after)
- Tests storage — add "remove deletes the key"
- Tests request check — attach page.on('request') before the first goto
- Plan — name the store accessor test-hook.ts reads (e.g. game.launch)
- Plan — vi.unstubAllGlobals() in afterEach
- Tests — reactivity probe first ($state change updates game.view; SPEC Assumptions)
- Tests — tag the seed cases AD-5, not AD-4/AD-9
- Smoke — pick up ticket 1 plan's deferred gap (letters and order in one column of session-idle-fresh.json) or note it stays with epic 4
### Decision needed (functionality / UX / gameplay)
- none

## Result — converged after 4 passes
open major: Board (E1) Undo/Redo — ticket says text-labelled buttons, contradicting SPEC E1 / DESIGN.md undoRedo (44 × 44 icon-only button-secondary with accessible names Undo/Redo); the build should use the DESIGN.md component.
Majors per pass: 6, 5, 1, 1. Words 219 → 1198. Unapplied minors: the 16 listed under Pass 4.
