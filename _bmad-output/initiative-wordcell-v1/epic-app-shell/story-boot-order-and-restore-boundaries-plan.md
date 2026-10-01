---
title: 'Boot order and restore boundaries'
type: 'feature'
ticket: '11'
created: '2026-10-01'
status: done
baseline_revision: 'cc326d7f106e456bef60e3343416e5c24e91f46d'
route: 'full'
route_source: 'auto'
review: 'thorough'
review_source: 'auto'
lenses_ran: ['blind-hunter', 'edge-case-hunter', 'verification-gap', 'intent-alignment']
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-app-shell/story-boot-order-and-restore-boundaries.md'
  - '{project-root}/_bmad-output/specs/spec-epic-3-app-shell/build-notes.md'
warnings: ['oversized']
deferred: []
---

<intent-contract>

## Intent

**Problem:** CAP-10's ordering promises (AD-16) are only partly pinned by named tests, and the AD-17 restore-boundary suite (each fixture × hidden-then-reloaded / plain-reloaded, plus the crash mode of epic Done when 2) does not exist (ticket 3.11).

**Approach:** Test-only change: move the shared Playwright helpers into `e2e/helpers/`, add `e2e/restore.spec.ts`, two new AD-16 cases, one rename, extend the kill variant, and add the AD-17 amendment to build-notes Spine notes. `src/` changes only if a new AD-16 case fails. The ticket file is the full intent; this plan pins what it and its review log leave open.

## Boundaries & Constraints

**Always:**
- Ticket Description and Acceptance Criteria bind as written, except where Design Notes resolve a review-log item (each listed in Implementation Notes).
- Existing AD-16 / ordering test bodies stay unchanged except the nav.spec.ts rename, the kill-variant extension and helper imports.
- Restore and AD-16 specs run on android only (the sibling specs' `beforeEach` skip).
- AGENTS.md test naming (ids first, R- before Q-/§-/AD-), Files layout (helpers in `e2e/helpers/`, their tests in `e2e/helpers.spec.ts`).
- Unit suite not slower than the baseline (6.08 s, 6.03 s) beyond noise; no Vitest file changes are planned.

**Never:**
- No edit to `ARCHITECTURE-SPINE.md`, the ticket file, `src/engine/`, fixtures, or `SESSION_VERSION`.
- No change to `src/` unless an AD-16 case fails (then stop and record it: the boot order is spec-bound).
- Other specs' own `open()` variants are not touched (CAP-11).

## I/O & Edge-Case Matrix

| Case (fixture) | Dispatch | Present before reload | After reload |
|---|---|---|---|
| R-73 session-place-free-letter-redo-tail.json | none | session | session restored, label = before |
| R-73 session-gave-up.json | none | session | label New game |
| R-84 session-gave-up.json+history-three-records.json undone | Undo click | session, history | history.records = fixture records minus last |
| §7.10 prefs-non-default.json | none (boot writes a fresh Session) | session, prefs | loaded().history null, current().history default |
| R-73 Q-41 session-below-committed-last.json | none | session | restored at the same phase |
| Crash (kill variant) | Undo | session | loaded().session = Undo's write exactly; label = before |

</intent-contract>

## Code Map

- `e2e/game-store.spec.ts` -- module-local `Snapshot` type (~10), `snapshot()` (~17), `sessionOf()` (~30), `open()` (~35), `dictionaryReady()` (~41) move out; kill variant (~248) extended. Every other use stays, re-imported.
- `e2e/helpers/restore.ts` -- new: `Snapshot` (gains `present`), `snapshot(page)`, `sessionOf(snap)`, `open(page, url = '/')`, `dictionaryReady(page)`, `booted(page)` (the `__wordcell !== undefined && current().kind !== 'booting'` wait).
- `e2e/dictionary.spec.ts` -- `animationFrames` (~76) moves to `e2e/helpers/lifecycle.ts`; `countRequests` (~26), `waitForDictionary` stay local; `test.describe('AD-16 dictionary start')` (~267) gains the startHidden case.
- `e2e/blocking.spec.ts` -- new file-level AD-16 font case after the `'Q-37 AD-15 fatal'` describe (~60–143); imports `animationFrames`.
- `e2e/nav.spec.ts:146` -- rename only to `'§2 AD-13 AD-16 deferred push: …'`.
- `e2e/helpers/seed.ts` -- `seedStorage(page, seed, { captureBoot: true })`, `captureBoot(page)`, `fixture()`; reused as is.
- `e2e/helpers/lifecycle.ts` -- `hidePage`, `showPage`, `startHidden`; gains `animationFrames`.
- `e2e/globals.d.ts` -- `window.__wordcell` / `__wordcellBoot` types; unchanged.
- `src/main.ts` `boot()` -- AD-16 order, read-only reference. `src/shell/nav.ts` -- stamps `{ wc: 0, launch }` in `launch()` before the font check.
- `_bmad-output/specs/spec-epic-3-app-shell/build-notes.md` `## Spine notes` -- append the AD-17 amendment bullet.

## Tasks & Acceptance

**Execution:**
- [x] `e2e/helpers/restore.ts` -- new module per Design Notes 1.
- [x] `e2e/helpers/lifecycle.ts` -- add exported `animationFrames(page, count)` (body moved verbatim).
- [x] `e2e/game-store.spec.ts` -- delete the moved helpers, import them from `./helpers/restore`; extend the kill variant per Design Notes 3.
- [x] `e2e/dictionary.spec.ts` -- import `animationFrames`; add the startHidden case per Design Notes 4.
- [x] `e2e/blocking.spec.ts` -- add the font case per Design Notes 5.
- [x] `e2e/nav.spec.ts` -- rename the deferred-push test.
- [x] `e2e/restore.spec.ts` -- new, Design Notes 2.
- [x] `e2e/helpers.spec.ts` -- new `describe('restore helpers')` and an `animationFrames` case per Design Notes 6.
- [x] `_bmad-output/specs/spec-epic-3-app-shell/build-notes.md` -- Spine notes bullet: "AD-17: the restore suite compares all three `loaded()` fields with `JSON.parse(__wordcellBoot[key])` (`null` when absent); `current().history`/`.prefs` before the reload equal `loaded()`'s only for keys present in localStorage at snapshot time (absent keys report in-memory defaults) (CAP-10)."

**Tests mapping (sentence → test):**
- R-73 restored on launch, every element of `moves` validated by replay → `e2e/restore.spec.ts` `R-73 AD-17 session-place-free-letter-redo-tail.json restores after hidden then reloaded` / `… restores after a reload without a hide`; `R-73 AD-17 session-gave-up.json restores after hidden then reloaded` / `… after a reload without a hide` (the rejection side is §2, ticket 3.4).
- R-73 (UI) exact phase on restore → the same restore titles (primary-action label equals the pre-reload label).
- R-73 exact phase after Android kills the app → `e2e/game-store.spec.ts` `R-73 kill variant: an Undo on session-place-free-letter-redo-tail.json survives a renderer crash` (extended: all three `loaded()` fields vs page2's `__wordcellBoot`, the Session as written by the Undo exactly, the label).
- Q-41 each move validated at its own `reached` → `R-73 Q-41 AD-17 session-below-committed-last.json restores after hidden then reloaded` / `… after a reload without a hide`.
- R-84 the finish-undone record stays removed (persistence half, AD-17) → `R-84 AD-17 session-gave-up.json+history-three-records.json undone restores after hidden then reloaded` / `… after a reload without a hide`.
- §7.10 preferences stored separately and restored → `§7.10 AD-17 prefs-non-default.json restores after hidden then reloaded` / `… after a reload without a hide`.
- AD-16 dictionary after first paint (`card-0` and `primary-action` in the DOM) → `e2e/dictionary.spec.ts` `AD-16 the word-list request arrives with card-0 and primary-action in the DOM` (existing).
- AD-16 a `startHidden` page requests the word list only after `showPage` → `e2e/dictionary.spec.ts` `AD-16 a startHidden page requests the word list only after showPage, exactly once`.
- AD-16 nothing written before the font check → `e2e/blocking.spec.ts` `AD-16 a healthy fresh launch writes nothing before the font check passes`.
- AD-16 rejected root before the History notice → `e2e/nav.spec.ts` `§2 AD-13 AD-16 deferred push: a rejected Session plus an unreadable history pushes nothing; New game opens the notice at { wc: 1, launch } of the boot launch` (renamed).
- AD-17 restore-boundary suite (Session vs the snapshot, history/prefs vs `__wordcellBoot`) → every `e2e/restore.spec.ts` title above; helpers → `e2e/helpers.spec.ts` `AD-17 snapshot reports present keys in fixed order and open() waits past booting`, `AD-17 booted, sessionOf and dictionaryReady read the active store and the ready word list`, `AD-17 animationFrames resolves after the given number of animation frames`.
- S only (rule-coverage AD-16 row): the double rAF and `whenVisible` themselves.
- Exempt: none beyond those the rule-coverage rows assign to other entries.

**Acceptance Criteria:**
- Given the ticket's five restore cases, when `e2e/restore.spec.ts` runs on android, then all ten tests pass under the titles of Design Notes 2.
- Given the ticket's Acceptance Criteria bullets, when the named AD-16 tests and the extended kill variant run on android, then each passes.
- Given the change, when `npm run test:all` runs, then it exits 0, and `npx vitest run` Duration is not worse than the baseline beyond noise.

## Implementation Notes

- Baseline unit suite (HEAD cc326d7f106e456bef60e3343416e5c24e91f46d, `npx vitest run` twice): 6.08 s, 6.03 s; 34 files, 1654 tests.
- Review-log open major (primary-action label races the dictionary) → Design Notes 2 step 3 and 5: the label is read only after `dictionaryReady()`, before `hidePage`, and again after the reload.
- Unapplied minors: (1) `present` in fixed order → DN 1; (2) crash-mode label compare → DN 3 (both labels read after `dictionaryReady`, so no assumption about the phase after Undo); (3) Q-41 title `R-73 Q-41 …` → DN 2; (4) restore flow uses `open()` and `booted()` → DN 2; (5) font predicate folds `__wordcell !== undefined` → DN 5; (6) `animationFrames` helper test named → DN 6; (7) "first sentence" wording is the ticket's own text: no build change, recorded only; (8) hidden-mode exact `activeMs` cites AD-9 in a test comment → DN 2; (9) null `loaded()` history/prefs → assert in-memory defaults → DN 2 step 6; (10) every restore title carries AD-17 → DN 2.
- Correction 2026-10-01 (3.12): Auto Run Result 'Review' bullet ("hide-flush assert", "animationFrames delta") and Design Notes 6 describe pass-0 behaviour: the hide-flush assert was removed and the `animationFrames` self-test asserts exactly 3 frames requested and fired (Plan Change Log 2026-10-01).
- Correction 2026-10-01 (3.12): Residual risks bullet 1: plain mode pins the restored Session modulo `activeMs` only; its `activeMs` not-smaller check cannot detect a missing pagehide flush.
- Correction 2026-10-01 (3.12): the Plan Change Log's "the hide flush and paused clock rest on the exact `after.loaded.session` equality": that equality pins the paused clock only; restore.spec.ts now arms `armStorageSpy` around `hidePage` and asserts the hide's single `wordcell:session` write.

## Plan Change Log

- 2026-10-01 code-review loop: Review Triage Log Blind row 1's hidden-mode `expect(before.stored).toEqual(session)` could not detect a missing hide flush (the store writes before it assigns state, so stored always equals current) and is removed; the hide flush and paused clock rest on the exact `after.loaded.session` equality. Also: first-launch seed checks in the restore flow, a kind check before the post-reload snapshot, the `animationFrames` self-test now counts exact rAF calls (DN 6's "at least 3" superseded), a `booted`/`sessionOf`/`dictionaryReady` helper case, and the Tests mapping block.

## Review Triage Log

### 2026-10-01 — Review pass
- verdicts: 30 findings — high 0, medium 0, low 22, false 8, maybe-false 0 (blind 12, edge 4, verification-gap 2, intent-alignment 12)
- findings:
  - `[low]` `[patch]` Blind: hidden mode never checks the hide flush (the reload's pagehide flush also satisfies it) — added `expect(before.stored).toEqual(session)` in hidden mode.
  - `[low]` `[reject]` Blind: per-case extras keyed on `c.id` strings silently stop on a title reword — a title reword is rare and the fix adds case-table structure for it.
  - `[low]` `[reject]` Blind: "fixed order" in the restore-helpers test is indistinguishable from seeding order — the order is structural (`KEYS.filter`); a reordered-seed harness adds machinery for no reachable defect.
  - `[low]` `[reject]` Blind: `booted`, `sessionOf`, `dictionaryReady` lack own helper tests — `sessionOf`/`dictionaryReady` moved verbatim; `booted` runs inside `open()`, which the helper test covers.
  - `[low]` `[reject]` Blind: font case samples storage once rather than spying writes — the ticket specifies the snapshot assertion; a write-then-remove before the font check has no code path.
  - `[low]` `[patch]` Blind: startHidden case checks "exactly once" only at the ready instant — two animation frames after 'ready' before the length assert (grouped with Edge row 3).
  - `[low]` `[reject]` Blind: exact phase rests on the label only, not Undo/Redo enablement — the deep-equal Session already pins the phase; the ticket names the label check.
  - `[false]` `[reject]` Blind: dead kind guards in restore.spec.ts — `before.current.kind` throw narrows the type for `before.current[field]`; the `return` follows a hard `expect` and is type narrowing (later replaced by the early kind assert).
  - `[low]` `[patch]` Blind: `DEFAULTS` duplicate the in-memory defaults without a source pointer — comment now names `prefs.svelte.ts` DEFAULTS and `history.svelte.ts` EMPTY, change together.
  - `[low]` `[patch]` Blind: build-notes AD-17 bullet ambiguous about whose `loaded()` — reworded (post-reload `loaded()` vs pre-reload `current()`, in-memory defaults when null).
  - `[low]` `[reject]` Blind: plan records no verification evidence — fix edits this build's plan (filled at Finalize).
  - `[low]` `[patch]` Blind: animationFrames self-test loop cannot show the helper's own frames — counter read just before the call, assert delta ≥ 3 (grouped with Edge row 4, VG gap).
  - `[low]` `[patch]` Edge: `booted` resolves on rejected/halted and `dictionaryReady` then times out opaquely — restore flow snapshots and asserts kind 'active' right after `booted`, before `dictionaryReady`.
  - `[low]` `[patch]` Edge: same root cause at the restore-spec post-reload wait — same fix.
  - `[low]` `[patch]` Edge: late duplicate word-list request passes — same fix as Blind row 6.
  - `[low]` `[patch]` Edge: animationFrames self-test counts frames from an earlier evaluate — same fix as Blind row 12.
  - `[low]` `[patch]` VG gap: animationFrames off-by-one undetected (filed defer) — fixed directly as Blind row 12, a one-line change.
  - `[low]` `[reject]` VG other: removing `booted` from `open()` would not fail the helper test (the WordCell heading already implies past booting) — no caller loses anything today; the ticket requires the wait regardless.
  - `[false]` `[reject]` Intent: reading B (every boot arrow pinned) — the ticket's AC enumerates the CAP-10 promises; rule-coverage AD-16 row and review-log minor 7 keep the other arrows S.
  - `[false]` `[reject]` Intent: reading C (production relaunch, visual board) — rule-coverage marks R-73/AD-17 as P3 Playwright on android, as implemented.
  - `[low]` `[reject]` Intent: Q-41 title 'R-73 Q-41 …' differs from the ticket's 'Q-41 R-73 …' — review-log unapplied minor 3 and AGENTS.md (R-id first); recorded in Implementation Notes.
  - `[low]` `[reject]` Intent: AD-17 suffix on the R-73 titles — review-log minor 10; harmless extra id for the AD-17 coverage row.
  - `[false]` `[reject]` Intent: extra `dictionaryReady` waits — they are the fix for the review log's open major.
  - `[low]` `[reject]` Intent: DEFAULTS hard-coded beyond the ticket — review-log minor 9 (SPEC CAP-10 states them); source pointer added under Blind row 9.
  - `[false]` `[reject]` Intent: §7.10 `present` contains session assert unrequested — the ticket states the Session is present before the reload; asserting it is the stated precondition.
  - `[false]` `[reject]` Intent: crash-mode label compare beyond the ticket — review-log minor 2.
  - `[low]` `[reject]` Intent: helper module wider (`dictionaryReady`, `booted`, `Key`) — both specs need them; no extra surface outside e2e.
  - `[low]` `[reject]` Intent: helpers.spec adds a three-key case — strengthens the `present` order check (review-log minor 1); no conflict.
  - `[false]` `[reject]` Intent: font predicate folds `kind === 'booting'` into the wait — review-log minor 5 asked for that fold; same outcome on normal runs.
  - `[false]` `[reject]` Intent: dictionary case match — reported as matching; no divergence.

## Design Notes

1. `e2e/helpers/restore.ts`: `KEYS = ['wordcell:session', 'wordcell:history', 'wordcell:prefs'] as const`. `type Snapshot = { stored; current; loaded; present: (typeof KEYS)[number][] }`; `snapshot()` reads all in one `page.evaluate`, `present = KEYS.filter(k => localStorage.getItem(k) !== null)` (KEYS passed as the evaluate argument). `booted(page)` = `page.waitForFunction(() => window.__wordcell !== undefined && window.__wordcell.current().kind !== 'booting')`. `open(page, url = '/')` = goto, WordCell heading visible, `booted(page)`. `sessionOf`, `dictionaryReady` move verbatim. Header comment cites AD-17.
2. `e2e/restore.spec.ts`: a `CASES` table `{ id, name, seed, undo }` over the five cases; ids `R-73 AD-17`, `R-73 AD-17`, `R-84 AD-17`, `§7.10 AD-17`, `R-73 Q-41 AD-17`; `for (const c of CASES) for (const mode of ['hidden', 'plain'])` a test titled `` `${id} ${name} restores after hidden then reloaded` `` / `` `… after a reload without a hide` ``. Flow: (1) `seedStorage(page, c.seed, { captureBoot: true })`; (2) `open(page)`; (3) `dictionaryReady(page)`; if `c.undo` click `getByRole('button', { name: 'Undo', exact: true })` and `expect.poll` until the snapshot's session differs from the pre-click one; read `label = primary-action textContent`; (4) hidden: `hidePage(page)`; (5) `before = snapshot(page)`; `page.reload()`; `booted(page)`; `dictionaryReady(page)`; `after = snapshot(page)`; `boot = page.evaluate(() => window.__wordcellBoot)`. Asserts: for each of session/history/prefs, `after.loaded[f]` equals `boot[key] === null ? null : JSON.parse(boot[key])`; `after.loaded.session` equals `sessionOf(before)` — hidden exactly (comment: AD-9 the clock is paused after `hidePage`), plain `{ ...s, activeMs: expect.any(Number) }` plus `activeMs >= before's`; for history/prefs, when `before.present` has the key, `after.loaded[f]` equals `before.current[f]`; `primary-action` has text `label`; `after.current.kind` is `'active'`; `sessionOf(after)` equals `after.loaded.session` except `activeMs` not smaller; `after.current.history`/`.prefs` equal `after.loaded`'s when non-null, else the in-memory defaults `{ version: 1, records: [] }` / `{ version: 1, animationSpeed: 'normal', showTimer: false }` (SPEC CAP-10). Extra per case: R-84 `after.loaded.history.records` equals the fixture's records minus its last; §7.10 `before.present` contains the session and `after.loaded.history` is null.
3. Kill variant (keep its title and body): `await captureBoot(page2)` before `open(page2)`; before the crash `dictionaryReady(page)` then read `label`; after: `restored.loaded` equals `{ session: JSON.parse(boot['wordcell:session']), history: null-or-parse, prefs: null-or-parse }` from page2's `__wordcellBoot`, the existing `restored.loaded` / `sessionOf` equalities to `written` stay (exact, no flush ran); `dictionaryReady(page2)` then page2's primary-action has text `label` (R-73 exact phase after a kill).
4. dictionary.spec.ts, inside `AD-16 dictionary start`: `'AD-16 a startHidden page requests the word list only after showPage, exactly once'`: `requests = countRequests(page)`; `startHidden`; `goto('/')`; `card-0` attached; `animationFrames(page, 2)`; `expect(requests).toEqual([])`; `showPage`; `waitForDictionary(page, 'ready')`; `expect(requests).toHaveLength(1)`.
5. blocking.spec.ts: `'AD-16 a healthy fresh launch writes nothing before the font check passes'`: hold `**/*.woff2` into `held: Route[]`; `goto('/', { waitUntil: 'domcontentloaded' })`; `expect.poll(() => held.length).toBeGreaterThan(0)`; `waitForFunction(() => window.__wordcell !== undefined && history.state?.wc === 0 && typeof history.state?.launch === 'number' && window.__wordcell.current().kind === 'booting')`; `animationFrames(page, 2)`; no `localStorage` key starting `wordcell:`; continue every held route; wait for kind `'active'`; stored session parse equals `current().session`; `wordcell:history` and `wordcell:prefs` null.
6. helpers.spec.ts: `describe('restore helpers')`: `'AD-17 snapshot reports present keys in fixed order and open() waits past booting'` — seed session only (`session-place.json`), `open(page)`, then `current().kind` is `'active'` and `snapshot(page).present` equals `['wordcell:session']`; a second page in a fresh context seeded with all three keys (session, history-three-records, prefs-non-default) reports all three in KEYS order. `describe('hidePage / showPage / pageHide / pageShow')` gains `'AD-17 animationFrames resolves after the given number of animation frames'`: a page-side rAF counter started before, `animationFrames(page, 3)`, then the counter is at least 3.

## Verification

**Commands:**
- `npx playwright test e2e/restore.spec.ts e2e/game-store.spec.ts e2e/dictionary.spec.ts e2e/blocking.spec.ts e2e/nav.spec.ts e2e/helpers.spec.ts --project=android` -- expected: pass.
- `npx playwright test e2e/restore.spec.ts --project=android --repeat-each 3` -- expected: pass (flake check).
- `npx vitest run` (twice) -- expected: Duration not worse than 6.03–6.08 s beyond noise.
- `npm run test:all` -- expected: exit 0.
- `git diff --stat cc326d7f106e456bef60e3343416e5c24e91f46d -- src` -- expected: empty.

## Auto Run Result

- **Summary:** CAP-10 is pinned by tests only; `src/` is unchanged because every new AD-16 case passed against the existing `boot()`. New `e2e/restore.spec.ts` runs the five AD-17 restore cases × hidden-then-reloaded / plain-reloaded (10 android tests), reading the primary-action label only after the word list is ready (the review log's open major). The kill variant now compares all three `loaded()` fields with page2's `__wordcellBoot`, the Session exactly, and the label. New AD-16 cases: startHidden requests the word list only after `showPage`, exactly once; a fresh launch writes nothing before the font check. The nav deferred-push test is renamed with AD-16. build-notes Spine notes carry the AD-17 amendment.
- **Files:**
  - `e2e/helpers/restore.ts`: new; `Snapshot` (+`present`), `snapshot`, `sessionOf`, `booted`, `open`, `dictionaryReady`.
  - `e2e/helpers/lifecycle.ts`: `animationFrames` moved in.
  - `e2e/restore.spec.ts`: new restore suite.
  - `e2e/game-store.spec.ts`: helpers imported; kill variant extended.
  - `e2e/dictionary.spec.ts`: `animationFrames` import; startHidden AD-16 case.
  - `e2e/blocking.spec.ts`: AD-16 fresh-launch font case.
  - `e2e/nav.spec.ts`: rename only.
  - `e2e/helpers.spec.ts`: restore-helper and `animationFrames` cases.
  - `_bmad-output/specs/spec-epic-3-app-shell/build-notes.md`: AD-17 Spine note.
- **Review:** one thorough pass, 30 rows (blind 12, edge 4, verification-gap 2, intent 12). 6 low entries patched (hide-flush assert, early kind assert, DEFAULTS source comment, late-duplicate frames, animationFrames delta, build-notes wording); 0 deferred; 14 rejected (12 low, reasons in the triage log) plus 8 false.
- **Follow-up review recommended:** false. Patched entries: high 0, medium 0, low 6.
- **Verification:**
  - `npm run test:all`: exit 0 after the patches.
  - Six affected specs on android: 105 passed; `e2e/restore.spec.ts --repeat-each 3`: 30/30.
  - `git diff --stat <baseline> -- src`: empty.
- **Unit-suite time (AD-17):** before 6.08 s, 6.03 s; after 5.94 s, 5.98 s (34 files, 1654 tests). Not worse; still above AD-17's 5 s budget, as before this ticket.
- **Review-log disposition:** open major resolved (label read after `dictionaryReady`, before `hidePage` and after the reload). Minors 1–6 and 8–10 applied; minor 7 is ticket wording (no build change).
- **Residual risks:**
  - The plain-reload cases rely on the reload's pagehide flush having written before the new document reads storage (`activeMs` not smaller); stable over 3 repeats.
  - The Q-41 title order follows AGENTS.md ('R-73 Q-41 …'), not the ticket's literal 'Q-41 R-73 …'; the ticket file was not edited.
