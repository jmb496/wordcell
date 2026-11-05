---
title: 'Close-out: documents, audits and device read (7.11, Phase 1)'
type: 'chore'
ticket: 11
created: '2026-11-04'
status: 'in-progress'
route: 'full'
route_source: 'auto'
baseline_revision: '8a98d45b327147b6af87c3608c8d10fd65d7314d'
review: ''
review_source: ''
lenses_ran: []
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-pwa-release/story-close-out-documents-audits-and-device-read.md'
  - '{project-root}/_bmad-output/specs/spec-epic-7-pwa-release/SPEC.md'
  - '{project-root}/_bmad-output/specs/spec-epic-7-pwa-release/build-notes.md'
warnings: ['oversized']
deferred: []
---

<intent-contract>

## Intent

**Problem:** Epic 7 is built (entries 1–10, 13, 14 done) but none of its decisions reached the spine, EXPERIENCE.md or AGENTS.md (no commit since `main` touches them), several SPEC and build-notes lines describe a design the build replaced (D-43, D-50, D-62, D-63), and the rule-coverage rows are not yet mapped to tests. Jared's device read (Owner stop) needs a committed build and a handoff list.

**Approach:** Phase 1 of ticket 7.11 only, under Jared's run authorisation (2026-11-03, "At 7.11 (hitl): do its document check, then give me the device read"): record the authorisation in the epic Notes first, apply exactly the listed syncs (ticket Description and SPEC CAP-9) through the named skills, map every `rule-coverage.md` row to its passing test, run `npm run test:all` and `npm run test:screens`, commit locally on `pwa-release`, and stop the plan `in-progress` with the owner-wait note and the device-read handoff. Phase 2 is not done here.

## Boundaries & Constraints

**Always:**
- Edit only the files the ticket's sync list names (Code Map); each edit states the build as it is at HEAD, cited by file:line or test title.
- Spine edits through `bmad-architecture`, EXPERIENCE.md through `bmad-ux`, AGENTS.md's managed block through `bmad-project-context`, each run headless with an explicit update intent naming its items and citing the epic Notes authorisation line as the owner's approval of exactly those edits.
- Any other edit a skill proposes, and any build–document contradiction found beyond the list, is an Owner stop item (a proposed sync or fix ticket) recorded in this plan, not applied.
- Commits are local on `pwa-release`, each message ending with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Never push or merge.
- Kill any server started by its PID; never `pkill -f`.

**Never:**
- Phase 2 work: no (unverified) tag edits, no §6.4/§6.6 audits, no `built` status.
- No change under `src/`, `e2e/`, `scripts/`, `fixtures/`, config files or `tickets.toml`; no edit of a done ticket's plan, log or ticket file, or of this ticket file.
- No change to `SESSION_VERSION`, `HISTORY_VERSION`, the Session or history shape, AD numbering, a §9 answer or an owner decision.
- No edit outside AGENTS.md's managed block (rules 1–7 are hand-maintained).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Listed sync | an item of the Sync checklist | the doc states the as-built fact; checklist line gets source and commit | — |
| Extra edit proposed | a skill or the implementer finds another stale line | not applied; Owner stop item with file:line, as-built fact, proposed text | — |
| Row with no passing test | a `rule-coverage.md` row whose map entry finds none | fix-ticket proposal in the handoff, landing before any row touching its subject is read | not synced |
| `test:all` fails on D-64 alone | `§2 AD-13 a double tap on New game on the rejected root …` | events logged (A7) in Implementation Notes; whole `test:all` repeats once; a second failure stops the plan `in-progress` for Jared | — |
| Any other failing title | `test:all` or `test:screens` | title recorded; fix-ticket proposal; no rerun; the scripts the `&&` chain skipped are run alone and recorded; the handoff still goes out | — |

</intent-contract>

## Code Map

S = `_bmad-output/planning-artifacts/architecture/architecture-wordcell-2026-09-27/ARCHITECTURE-SPINE.md` (frontmatter `updated: '2026-10-29'`; companions `.memlog.md` beside it). E = `_bmad-output/planning-artifacts/ux-designs/ux-wordcell-2026-09-27/EXPERIENCE.md`. SPEC dir = `_bmad-output/specs/spec-epic-7-pwa-release/`. Line numbers are at HEAD 8a98d45 (= ff84c95 for SPEC dir files).

As-built facts (sources for the syncs):
- `src/main.ts`: :264 `await dictionary.load()`; :268 `halted()` return; :269 `if (!import.meta.env.DEV)` (dev skips the import, F3); :271-279 F17 catch around `import('./shell/sw')` only: `setSwState('failed')`, `reportError` when `VITE_TEST_HOOKS === '1'`; :281 `halted()` return; :282 `await sw.registerWorker()`; :288 `halted()` return; :289 `await requestPersistence()`; :159-161 halted `game.load()` return.
- `src/shell/sw-state.ts` (the state module): `SwState`, `swState()`, `setSwState()`, `failed` sticky (:13-16), no imports.
- `src/shell/sw.ts:28-91` `registerWorker()`: only `workbox-window` importer (:11), `new Workbox('/sw.js', { scope: '/' })` (:34); Q-40 `failed` without rejecting on absent `navigator.serviceWorker` (:30), rejected (:39) or `undefined` (:43) `register()`, redundant before activated with no newer worker (:74-75); reports only when `VITE_TEST_HOOKS === '1'` (:19); no skip-waiting, no `controlling` reload (:2-3).
- `vite.config.ts:21-24` `registerType: 'prompt'`, `injectRegister: false`, `includeManifestIcons: false`. Generated `sw.js` pinned by `e2e/pwa/build-output.spec.ts:104` `AD-16 the generated sw.js skips waiting only on SKIP_WAITING and has no clientsClaim`.
- `src/shell/test-hook.ts:152` hook gate `DEV || VITE_TEST_HOOKS === '1'`; :153-162 six frozen keys (loaded, current, dictionaryState, swState, precacheComplete, celebration); :158-161 `precacheComplete()` starts `void recomputePrecacheComplete()` and returns the stored value (last-started-wins :127-136).
- `src/shell/storage.ts:35-40` `requestPersistence()` (absent → none; `persisted()` true → none; else `persist()`, result ignored, no catch); :31-33 comment already names `main.ts` the spec-sanctioned exception.
- `src/architecture-scan.ts:57` `NAVIGATOR_STORAGE` (localStorage's exemptions); :59-64 `SKIP_WAITING_NAMES` (messageSkipWaiting, SKIP_WAITING, updateSW, virtual:pwa-register; strings kept). Tests: `src/architecture-tree-scan.test.ts:33`, `src/architecture-ad1.test.ts:864`, :939.
- `scripts/size-budget.mjs:149-153` error `size-budget: manifest key src/shell/sw.ts is reached by no dynamic import from the entry` (exit 1, :218); counting unchanged (:147-148, :76-78, :101-110); a missing key behind an edge throws `size-budget: manifest has no key src/shell/sw.ts` (:50). Content check `e2e/pwa/build-output.spec.ts:73`.
- `package.json:49-51` `"dependencies": { "workbox-window": "7.4.1" }` (4938cf9, 7.1). `tsconfig.e2e.json:8` `"allowJs": true` (c7cd412, 7.8) so the e2e typecheck covers `scripts/size-budget.mjs`, imported by `e2e/pwa/build-output.spec.ts:4` (D-48).
- `playwright.pwa.config.ts:10-41`: `pwa` (`testIgnore: '**/dist-smoke.spec.ts'`) and `dist-smoke` (`testMatch` dist-smoke, precache, build-output, font); no `serviceWorkers` set anywhere; `serviceWorkers: 'allow'` only at file level in `offline`, `update`, `dictionary-retry`, `sw-failure` specs and in `dist-smoke.spec.ts:240-241` describe `F6 serviceWorkers allow` (comment :236-239: the other dist-smoke tests use Playwright's default). No spec sets `block` (D-43).
- Update proof (D-63): Workbox 7.4.1 fetches precache entries by plain URL (`cache: 'reload'`; `__WB_REVISION__` only in the cache key), so there is no `?__WB_REVISION__` install fetch; `e2e/helpers/static-server.ts:17, :61` resolves by pathname (query ignored, `e2e/helpers.spec.ts:1966`); no `context.route`/`page.route`/CDP route (`e2e/pwa/update.spec.ts:13-14, :464`; 7.3 plan :137); `waitingHandle` (:254-272) requires exactly one waiting (B) and one active (A) worker and installs a `statechange` recorder for B in A's scope; `pollActivated`/`activationOutcome` (:326-383) read B's handle, then A's record once B's handle is closed or unreadable (D-70 `Service worker restarted`). Stated wording: 7.3 plan :147, :154, :159.
- Update/Q-40/Q-42/offline tests: `update.spec.ts:428`, :456; `sw-failure.spec.ts:40`, :59, :127, :150; `dist-smoke.spec.ts:244` (offline), :373, :409, :508; `dictionary-retry.spec.ts:22`; `offline.spec.ts:43` (order: move, precache complete, offline reload, restore, no prompt, deal, validate).

Sync targets (current text):
- S:774-780 AD-16 boot tail (no `halted()` returns, dev skip, F17 catch) and update policy (matches; add no `clientsClaim`); S:749 AD-16 `Binds:` (add `src/shell/sw-state.ts`); S:849 AD-17 key list (four keys); S:840-842 AD-17 Reading state; S:357-363 AD-7; S:739-740 AD-15 "its later steps still run"; S:102 AD-1 scan list; S:1027-1029 Structural Seed `shell/` (has `sw.ts`, add `sw-state.ts`); S:1131 Capability Map PWA row (add `shell/sw-state.ts`); S:1059-1108 Scaffold deltas (pattern: "Epic N (close-out edit, not a deviation; owner go-ahead …)" bullets at :1083, :1090, :1097); S:908-915 AD-18 Size; S:873-881 AD-17 Projects. Amendment convention: inline "(amended 2026-11-04, epic 7 entry 11)" tags, frontmatter `updated:` bump, a `.memlog.md` event line.
- E:225 "New app version installed" row; E:672 A-E4 → "activates once every WordCell window has closed" (S:778), no behaviour change; E's own `.memlog.md`.
- AGENTS.md managed block (:15 `<!-- bmad:context -->` … :91): :49 shell-module list (add `sw.ts`, `sw-state.ts`); :71 "`storage.ts` is called only by the shell stores (AD-7)" (add the `main.ts` boot `requestPersistence()` exception, AD-16, AD-7); :71 Single owners (add "`navigator.storage` only in `src/shell/storage.ts`").
- SPEC.md:132 F6 (`block` sentences); :134 F8 (revision-query fetch, "unverified for 1.63"); :138 F12 ("the retrospective follows CAP-10"). `release-checklist.md:46` step 6 ("the epic retrospective follows"). Decision: epic Notes `epic-pwa-release.md:66-67`.
- `build-notes.md`: :22-23 (inside the exempt "As built at 4130fb4" snapshot, the one non-exempt line pair); :55; :112-115; :121-124; :150-152 (the `self.serviceWorker.state` poll in the newest of `context.serviceWorkers()`).
- `device-checks.md:25` G9 disposition: 7.10 D-66 **fixed**, test `AD-12 AD-13 AD-16 src/main.ts creates the controller after the halted return and createGate, before registerLifecycle and the before-back cancel, and sets it once before mount` in `src/architecture-tree-scan.test.ts` (7.10 plan :545).
- `_bmad-output/specs/spec-epic-3-app-shell/rule-coverage.md:86` Q-40 row (`| Q-40 SW and precache failures | — | P7 | |`) and :88 Q-42 row: name the CAP-5 tests by title (Rule-coverage map below).

Read-only: everything under `src/`, `e2e/`, `scripts/`, config; done plans and logs; `tickets.toml`; the ticket file.

## Tasks & Acceptance

**Execution:**
- [x] `_bmad-output/initiative-wordcell-v1/epic-pwa-release/epic-pwa-release.md` -- append to Notes, as the first commit of the run (with this plan): `- Decision (owner, 2026-11-03): run authorisation for entry 11 (7.11, hitl), in his words: "At 7.11 (hitl): do its document check, then give me the device read." It covers exactly the syncs listed in the entry's Description and SPEC CAP-9 (and, in Phase 2, the re-syncs the ticket allows under it); any other edit a skill proposes is an Owner stop item. Phase 1 writes this line (ticket 7.11 plan).` -- the ticket requires the record before the first sync commit.
- [x] S (+ its `.memlog.md`) -- via `bmad-architecture` (headless update): apply Sync checklist items 1–12 from the as-built facts; inline amendment tags; `updated: '2026-11-04'`; Scaffold deltas bullet "Epic 7 (close-out edit, not a deviation; owner run authorisation 2026-11-03, epic Notes)" listing `workbox-window` 7.4.1 in `dependencies` and `tsconfig.e2e.json` `allowJs` (why: `scripts/size-budget.mjs` typechecked through `build-output.spec.ts`); one commit `docs(spine): sync epic 7 build (ticket 7.11)`.
- [x] E (+ its `.memlog.md`) -- via `bmad-ux` (headless update): items 13–14; commit `docs(ux): sync new-version activation wording to AD-16 (ticket 7.11)`.
- [x] `AGENTS.md` -- via `bmad-project-context` (refresh limited to items 15–17; keep the verified stamp unless the skill requires changing it for a partial edit, and record what it did); commit `docs(agents): epic 7 shell modules and storage owners (ticket 7.11)`.
- [x] SPEC.md, `release-checklist.md`, `build-notes.md`, `device-checks.md`, epic 3 `rule-coverage.md` -- items 18–26 by direct edit (SPEC companions are not skill-managed); commit `docs(spec-7): sync F6, F8, F12, build-notes and coverage rows to the build (ticket 7.11)`.
- [x] this plan -- fill each Sync checklist line's commit, the Rule-coverage map (already drafted below; re-check each title still exists with `grep -n`), Owner stop items found, Implementation Notes; commit `docs(plan): ticket 7.11 Phase 1 syncs and coverage map`.
- [ ] (orchestrator, step 3 Verify) `npm run test:all`, then `npm run test:screens`; record outcomes per the I/O Matrix; Phase 1 owner-wait note; final commit.

**Sync checklist** (source → applying commit, filled by the build):
1. AD-16 boot tail as built (`main.ts:264-289`: halted returns, dev skip, F17 catch, attempt always resolves) and update policy (no prompt, no `updateSW`, no skip-waiting, no `clientsClaim`; `sw.ts:2-3`, `build-output.spec.ts:104`) → commit: 7cd8939
2. AD-16 `Binds:` gains `src/shell/sw-state.ts` → commit: 7cd8939
3. AD-17 key list → six keys (F14; `test-hook.ts:153-162`) → commit: 7cd8939
4. AD-17 Reading state: `precacheComplete()` returns the last recomputed value; tests poll it (`test-hook.ts:158-161`) → commit: 7cd8939
5. AD-7 `requestPersistence()` as built (`storage.ts:35-40`), after the attempt settles (registered, failed incl. F17, or skipped in dev), none after a launch halted before it settles (`main.ts:288`; `boot-order.spec.ts:166`) → commit: 7cd8939
6. AD-15 boot returns at `halted()` incl. registration and persistence (F4; replaces "later steps still run"; `main.ts:261-289`, `boot-order.spec.ts:118`, :143, :166) → commit: 7cd8939
7. AD-1 scan list gains `navigator.storage` only in `src/shell/storage.ts` and the no-skip-waiting names scan (`architecture-scan.ts:57`, :59-64) → commit: 7cd8939
8. Structural Seed `shell/` gains `sw-state.ts` → commit: 7cd8939
9. Capability Map row "PWA, offline, install, manifest" gains `shell/sw-state.ts` → commit: 7cd8939
10. Scaffold deltas: `workbox-window` 7.4.1 in `dependencies` (`package.json:49-51`) and `tsconfig.e2e.json` `allowJs` (D-48) → commit: 7cd8939
11. AD-18 Size: fails on a `src/shell/sw.ts` key no dynamic edge reaches (`size-budget.mjs:149-153`) plus the content check (`build-output.spec.ts:73`) (D-49) → commit: 7cd8939
12. AD-17 Projects: update (`update.spec.ts`), Q-40 (`sw-failure.spec.ts`, dist-smoke cases), Q-42 (`dictionary-retry.spec.ts`), F8 `e2e/helpers/static-server.ts` (update and missing-`sw.js` cases run on it, not `vite preview`), the dist-smoke offline case, offline order move → precache complete → offline reload → restore → deal → validate → commit: 7cd8939
13. E:225 "New app version installed" → activates once every WordCell window has closed → commit: fcbb3ac
14. E:672 A-E4 same wording → commit: fcbb3ac
15. AGENTS.md shell-module list gains `sw.ts` (worker registration, AD-16, Q-40) and `sw-state.ts` (the worker state, F1) → commit: 7366186
16. AGENTS.md "`storage.ts` is called only by the shell stores" names `main.ts`'s boot `requestPersistence()` call (AD-16, AD-7) as the one exception → commit: 7366186
17. AGENTS.md Single owners gains "`navigator.storage` only in `src/shell/storage.ts`" → commit: 7366186
18. SPEC F12 (SPEC.md:138): retrospective after CAP-9 and before the merge (epic Notes :66-67) → commit: 5d40612
19. `release-checklist.md:46` step 6: same order (retrospective already ran before the merge) → commit: 5d40612
20. SPEC F6 (:132) and `build-notes.md:112-115`: dist-smoke runs in Playwright's default worker mode, not `block`; only `F6 serviceWorkers allow` sets `allow` per describe (D-43) → commit: 5d40612
21. SPEC F8 (:134) and `build-notes.md:121-124`, :150-152: no `?__WB_REVISION__` install fetch (query ignored by design), no `context.route` and no CDP route, observation through B's handle and a recorder in A's scope, `waitingHandle` needs exactly one waiting and one active worker at identification (D-63, 7.3 Residual risks, D-70) → commit: 5d40612
22. `build-notes.md:22-23`: counting statement kept, plus the unreachable-key failure (7.8 plan Implementation Notes (11), D-50) → commit: 5d40612
23. `build-notes.md:55`: `sw.ts` reports when `VITE_TEST_HOOKS === '1'` (`sw.ts:19`, `main.ts:276`); `DEV ||` stays for the hook install (D-62) → commit: 5d40612
24. `device-checks.md` G9 disposition: fixed by 7.10 (D-66), the pin test title → commit: 5d40612
25. Epic 3 `rule-coverage.md:86` Q-40 row names its CAP-5 tests (F15, D-47) → commit: 5d40612
26. Epic 3 `rule-coverage.md:88` Q-42 row names `dictionary-retry.spec.ts` → commit: 5d40612
27. Epic Notes authorisation record → commit: 427bfe6

**Acceptance Criteria:**
- Given the run's commits, when the epic Notes are read at the first sync commit's parent, then the authorisation line is present.
- Given HEAD, when each Sync checklist line is checked, then the target doc states its as-built fact and the line names its source and commit.
- Given `git diff 8a98d45 HEAD --stat`, when listed, then only the Code Map's sync targets, their `.memlog.md` files and this plan changed.
- Given `git diff 4130fb4 HEAD -- src/engine`, then it is empty and `SESSION_VERSION`/`HISTORY_VERSION` are 1.
- Given the Rule-coverage map, when each title is grepped, then it exists in the named file with one of the row's ids.
- Given `npm run test:all` and `npm run test:screens` at the final tree, then both exit 0, or each failure is recorded per the I/O Matrix.
- Given Phase 1 ends, then the plan `status` is `in-progress` and `## Owner-wait note` lists the handoff, the Owner stop items and the review-minor resolutions.

## Rule-coverage map

Epic 7 `rule-coverage.md` rows (line), test kind, file:line and title (from investigation at 8a98d45; P7 `pwa` unless noted):
- L59 AD-16 import after the dictionary settles — `e2e/pwa/boot-order.spec.ts:48` `AD-8 AD-16 AD-7 first launch: dictionary settled → register → register settled → persisted → persist, the sw.ts chunk requested only after the dictionary`; :84 `AD-16 AD-7 after a dictionary 404: …`; :99 `AD-16 AD-7 after a dictionary timeout: …`. (Mechanism differs from the row text: Owner stop item 1.)
- L60 F3 dev — Playwright dev `e2e/test-hook.spec.ts:48` `AD-16 AD-7 AD-17 the dev server never requests src/shell/sw.ts, swState() stays unregistered, precacheComplete() stays false and persistence is requested once`.
- L61 no prompt / no skip-waiting — S part (`src/architecture-tree-scan.test.ts:33` `AD-16 no skip-waiting names in non-test src/`; `src/architecture-ad1.test.ts:864` block; `src/shell/sw.test.ts` afterEach) is not rule coverage; B `build-output.spec.ts:104`; P7 `update.spec.ts:428`, :456 (`expectNoPrompt` at :192, :198, :477), `offline.spec.ts:43` (:119).
- L62 Q-40 activation — P7 `update.spec.ts:428` `Q-40 AD-16 A-A15 build B stays waiting on reloads and while pages open and close: every page keeps marker A, no prompt`; :456 `Q-40 AD-16 A-A15 build B activates only once every page has closed: a new page shows marker B, controlled, active, no prompt`. Not turned D (the P7 tests pass); G3 is read as a Device row.
- L63 Q-40 dist/ — `dist-smoke`: `dist-smoke.spec.ts:373`, :409 (titles in describe `F6 serviceWorkers allow`, `Q-40 the worker script missing: …`, `Q-40 a precached icon 404 during the first install: …`).
- L64 Q-40 test build — `sw-failure.spec.ts:40`, :59 (`Q-40 AD-15 …`); S `sw.test.ts:250` not counted.
- L65 F17 — `dist-smoke.spec.ts:508` `Q-40 (F17) the sw.ts chunk 404: …`; `sw-failure.spec.ts:127`, :150.
- L66 F4 — `boot-order.spec.ts:118`, :143 (and :166) `AD-16 AD-7 (F4) …`.
- L67, L68 Q-42 — `dictionary-retry.spec.ts:22` `Q-42 under a controlling worker, Reload after a 404 retries in place with the banner kept and no page load, and the banner hides when the retry succeeds`.
- L69 offline — `offline.spec.ts:43` and `dist-smoke` `dist-smoke.spec.ts:244` `AD-16 AD-17 offline after the precache is complete: a reload restores the game with no prompt, then deals and validates a word`; the D (G2) part is the device read.
- L70 AD-8 — `precache.spec.ts:8` `AD-8 the precache manifest lists the hashed dictionary once with revision null` (both projects); boot order `boot-order.spec.ts:48`.
- L71 AD-7 (S row) — `src/shell/storage.test.ts:91-133` `AD-7 requestPersistence > …`.
- L72 AD-1 (S row) — `src/architecture-ad1.test.ts:939` `AD-1 navigator.storage > …`.
- L73 AD-7 once per launch — `boot-order.spec.ts:48`, :84, :99.
- L74 AD-17 hook — `e2e/pwa/test-hook.spec.ts:9`, :50, :61; dev `e2e/test-hook.spec.ts:6`, :48.
- L75 no `__wordcell` — `dist-smoke` `dist-smoke.spec.ts:42` `AD-18 no file in dist/ contains __wordcell`.
- L76 register location — B `build-output.spec.ts:50` `AD-16 the build has no registerSW.js and registers a worker only from the sw.ts chunk`.
- L77 AD-18 — postbuild `size-budget.mjs` (runs in `npm run build`); B `scripts/size-budget.test.mjs:341` `computeBudget > AD-18 an orphan src/shell/sw.ts key fails as unreachable and is not counted`; B `build-output.spec.ts:73`; the ≤ 600,000 total is the postbuild gate's output (margin recorded at the run).
- L78 A-A11 — D (G5, G6), cited by their recorded reads at the Owner stop. L79 §6.2 — D (G4). L80 §6.3 — left to entry 12.

No row lacks a passing test of its kind (pending the runs); no Phase 1 fix ticket.

## Owner-wait note

Plan `status: in-progress`. Phase 1's syncs and coverage map are committed (427bfe6, 7cd8939, fcbb3ac, 7366186, 5d40612, 6701439, plus this note's commit and the F6 capitalisation fix); `npm run test:screens` is green; `npm run test:all` is **not green on a healthy machine**: the WSL root filesystem failed mid-run (below), so the device read waits on a `test:all` rerun after Jared restarts WSL (Owner stop item 11). The handoff, the Owner stop items (1–11) and the review-minor resolutions follow. No finding needs a Session, history or engine change; no §9 or owner question is raised by Phase 1 beyond the Owner stop items.

**Machine fault (2026-11-04, during the first `test:all`).** The WSL Ubuntu root filesystem dropped to emergency read-only (`/dev/sdd on / type ext4 (rw,…,errors=remount-ro,…,emergency_ro)`; `touch /tmp/x` and `touch ~/x` fail with `Read-only file system`; journald logs write failures). `/tmp` and `$HOME` are unwritable; `/mnt/d` (the checkout, NTFS) stays writable. The agent shell tool's `EROFS … /proc/self/fd/21/…output` failures are this fault. Repair is Jared's: `wsl --shutdown` from Windows (ends any running session), then let the distro fsck on restart (or `e2fsck` the `ext4.vhdx`) before any rerun.

**Run results (I/O Matrix), all at the docs-only tree 6701439 + this note (build sources identical to 8a98d45).**
- Run 1 (subagent, before the fault; log lost with `/tmp`): `lint` clean; `check` 0 errors; unit `Test Files 91 passed (91)`, `Tests 3788 passed (3788)`; `build` `total 560704 / 600000` (margin 39,296 bytes); `test:e2e:dist` `28 passed`; `test:e2e` at test 567/2258 with no failure when the fault killed it; `test:e2e:pwa` not started.
- Run 2 (orchestrator, `/tmp` read-only): `lint`, `check` pass; unit `Tests 24 failed | 3422 passed` (15 files), every failure an `EROFS`/`ENOENT` under `/tmp` (`mkdtemp '/tmp/…'`, Vite's `/tmp/…/ssr`) or a 5 s timeout behind it. Environmental; not a test result.
- Run 3 (orchestrator, `TMPDIR` moved to `/mnt/d/CodeProjects/.wordcell-7-11-tmp`, a scratch dir outside the repo): `lint`, `check` pass; unit `Tests 1 failed | 3787 passed (3788)`: `scripts/deploy-check.test.mjs` › verifyDist › "AD-18 each required file missing fails naming it" (`Test timed out in 5000ms`, 6033 ms; it copies a temp `dist` per case, now on drvfs). No `test:all` repeat (Matrix: not D-64). Diagnostic only: the file alone passes, `Tests 30 passed (30)`. Skipped scripts run alone: `build` pass (`total 560704 / 600000`); `test:e2e:dist` `2 failed, 26 passed`: `dist-smoke.spec.ts:132` "R-87 hook-free build: a real win plays and a press skips it to the expanded end sheet" and `:166` "R-87 hook-free build: a real win plays and back skips it to the expanded end sheet, the app still open" (both passed in run 1 on the same build sources); `test:e2e` stopped by PID after 81 failures and no pass in the first ~150 of 2258, all ~30 s timeouts in basic specs (e.g. `app-shell.spec.ts:5` "AD-16 the dev head carries the title, theme colour and viewport…", `blocking.spec.ts` §2/AD-15 cases): Chromium and the dev server run with an unwritable `$HOME` and root, so these are the fault, not the build; `test:e2e:pwa` not run (stopped with the script). Every process the runs started was stopped by PID; none remain.
- `npm run test:screens` (Docker container, started Docker Desktop for it): pass, `68 passed, 40 skipped` (the skips are the `android`-only screenshot specs under `desktop`), exit 0. Run with package.json's exact `docker run` arguments through `docker.exe` with `-v D:\CodeProjects\wordcell:/work`, because the WSL docker CLI cannot attach on the read-only distro.
- Fix-ticket proposals: none. Every failing title is explained by the machine fault (the same build sources passed them in run 1, or the file passes alone); a code fix ticket would be a guess. If a title still fails after the WSL repair, it becomes a fix-ticket proposal then.

**To resume (owner, then orchestrator):** repair WSL (Owner stop item 11); run `npm run test:all` on the healthy machine and record it here per the I/O Matrix; when green (or each failure recorded per the Matrix), hand Jared the device read below.

### Device-read handoff (in this order)

Setup and commands: `docs/device-testing.md`. A no-fixture run is `node scripts/device-preview.mjs`; the footer reads `0.0.0 (<sha>)` for the committed HEAD. Record each row in the epic Notes as pass, pass-with-note or fail, with the footer it was read on. No Phase 1 fix ticket blocks any row.
1. G1 install — no-fixture run, fresh install (site data cleared).
2. G2 offline — same install; G2's readiness step, then airplane mode.
3. G3 update — `WORDCELL_APP_VERSION=A node scripts/device-preview.mjs`, then `WORDCELL_APP_VERSION=B …` (device-testing.md Update read); record `git rev-parse --short=7 HEAD` beside footers `A` and `B`.
4. G4 force-stop restore — `session-place-free-letter-redo-tail`, then `session-gave-up` (separate seeds); finish-then-undo, prefs and timer by play; record whether the splash shows (G4's (unverified) cold-start sign has no device-testing.md step: an observation only).
5. G5 — `session-won-words`. 6. G6 — `--history history-invalid-null`. 7. G17 — `session-one-letter-left` (win by play, background mid-celebration).
8. By play on a no-fixture run: G7, G8 (judge lag; F10: measure on chrome://inspect only if lag is felt, then a follow-up ticket), G10, G11, G12, G13, G14, G15.
9. Desktop (desktop Chrome, no-fixture run): G20, G21, G22.
Optional (owner) G18/G19 only if Jared reinstates them (they then route as Device rows). G16 is a Production row (entry 12).

`docs/device-testing.md` (unverified) steps, each to mark confirmed, differs (what he saw) or not exercised, in the epic Notes: :59 Undo snackbar gone after closing tabs; :61 Site settings path to delete data; :72 serviceworker-internals shows ACTIVATED; :92 swipe away an app window the install opened; :124 B seen waiting in serviceworker-internals; :129 the discarded-renderer reading.

Retrospective leftovers (done plans stay unedited): `_bmad-output/implementation-artifacts/review-loop/7-13-build.md` (open major: 7.13 plan Item 3's failing-path list omits `src/ui/overlays.svelte.ts` and engine/shell files; 9 wording minors); `review-loop/7-10-build.md` (7 minors: D-65 count, D-64 item 4, `READ_MS` bounds, A's `undefined` read, D-46 timeout); `review-loop/7-14-build.md` (one stamp reused for touchStart/touchEnd; residual ~0.05%); run digest `_bmad-output/implementation-artifacts/autopilot/epic-pwa-release-20261030-1141.md` (D-64 owner backlog entry; tickets.toml entries 13/14 pre-review wording and 14's `after`; a home for the flaky-test close protocol).

### Owner stop items (proposed, not applied)

1. Build–document contradiction: `rule-coverage.md:59`, SPEC CAP-1 (SPEC.md:43 "P7: `dictionaryState()` is not `loading` when the `sw.ts` chunk request reaches the first-launch order test's route handler") and `build-notes.md:99-101` describe a `dictionaryState()` read in the chunk's route handler; as built (7.10 D-30, T4) `boot-order.spec.ts:48` holds the list `text()`, sees no chunk hit while `loading`, then checks the chunk's resource-timing start is after the release and the `register` log shows `dictionary:'ready'`. Proposed sync: reword the three to the as-built proof.
2. S:742-743 AD-15 and AGENTS.md rule 6 (outside the managed block): "SW/precache failures … in dev and test builds"; as built only `VITE_TEST_HOOKS === '1'` builds report (`sw.ts:19`, `main.ts:276`; `sw.ts` never loads in dev). Proposed sync: "in test builds (`VITE_TEST_HOOKS=1`)".
3. S:744 AD-15 "the `pwa` project catches regressions (Q-40)": `dist-smoke` runs Q-40 cases too. Proposed sync.
4. S:1041, :1044 Structural Seed `scripts/` and `e2e/helpers/ (seed, touch, lifecycle)` lists are stale (static-server, precache, offline, boot-calls …). Proposed sync.
5. S:1196 A-A3 "after the SW registration attempt settles": add the F17 and halted cases to match AD-7. Proposed sync.
6. AD-16 does not name `includeManifestIcons: false` (`vite.config.ts:24`). Proposed sync (or leave: seed-level).
Added by the build (bmad-architecture Reviewer Gate on the amendments, 2026-11-04; line numbers at 7cd8939):
7. S:765-766 AD-16 Binds and S:1182 Map: `src/shell/sw-state.ts` is bound and listed, but no AD names its writers and readers. As built (`sw-state.ts:1-3`, `sw.ts:12`, `main.ts:275`, `test-hook.ts:155`): imports nothing; `setSwState` called only by `sw.ts` and `main.ts`'s F17 catch; `failed` sticky for the launch; read by `sw.ts` and `test-hook.ts`, never by `src/ui/`. Proposed AD-16 Rule bullet: "`src/shell/sw-state.ts` imports nothing and holds the launch's one `SwState`; `setSwState` is called only by `src/shell/sw.ts` and `main.ts`'s F17 catch; `failed` is sticky for the launch; `swState()` is read only by `sw.ts` and `test-hook.ts`; no UI reads it (Q-40)." (AGENTS.md's shell-module line, item 15, already states the writers.)
8. S:866-867 AD-17 Reading state lists the `swState()` values but not their precedence. As built (`sw.ts` `recompute`; SPEC CAP-1): `failed` once set this launch, else the registration's waiting → `waiting`, else installing → `installing`, else active → `active`, else `unregistered`. Proposed: add that sentence after the value list.
9. S:316-318 AD-7 Store: "`storage.ts` … the only module that touches `localStorage`" names neither `navigator.storage` (AD-1 scan, item 7) nor its one non-store caller (item 16). Proposed: "… the only module that touches `localStorage` and `navigator.storage`; called by the shell stores and, for `requestPersistence()` only, by `main.ts`'s boot tail (AD-16)."
10. Item 2 above, confirmed by two lenses: S:758-759 AD-15 "reach this handler only in dev and test builds" now sits beside AD-16's as-built "reported … only in `VITE_TEST_HOOKS=1` builds" (S:797-798, item 1). Not a contradiction in effect (dev never loads `sw.ts`), but the wording differs; the proposed sync of item 2 (spine and AGENTS.md rule 6, which is outside the managed block) stands.
Added by the orchestrator (step 3 Verify, 2026-11-04):
11. Machine, not document: the WSL root filesystem is in emergency read-only mode (Owner-wait note, Machine fault). Jared restarts WSL (`wsl --shutdown`, fsck on restart) and then `npm run test:all` is rerun before the device read; the device read itself (`scripts/device-preview.mjs`) also needs a writable machine.

### Owner stop items 1–10 applied (owner approval 2026-11-05, "apply all ten")

- [x] 1. rule-coverage.md AD-16 row, SPEC CAP-1, build-notes order proof → as-built `boot-order.spec.ts:48` proof (held `text()`, no chunk hit while `loading`, resource-timing start after the release, `register` record `dictionary: 'ready'`) → commit: cf76ac8
- [x] 2. AD-15 and AGENTS.md rule 6 → "in test builds (`VITE_TEST_HOOKS=1`)" → commits: cd4fc25 (spine, via `bmad-architecture`), d20c1a9 (AGENTS.md rule 6, hand-maintained)
- [x] 3. AD-15 `pwa` project sentence → `dist-smoke` checks the hook-free build stays silent on the Q-40 cases → commit: cd4fc25
- [x] 4. Structural Seed `scripts/` and `e2e/` (incl. all `helpers/`) lists → as on disk → commit: cd4fc25
- [x] 5. A-A3 → at most once, after the attempt settles incl. F17; never after a halt → commit: cd4fc25
- [x] 6. AD-16 names `includeManifestIcons: false` (and `globIgnores: ['manifest.webmanifest']`, gate fix) → commit: cd4fc25
- [x] 7. AD-16 rule bullet: `sw-state.ts` writers and readers (outside `*.test.ts`) → commit: cd4fc25
- [x] 8. AD-17 Reading state: `swState()` precedence as of the last `recompute` → commit: cd4fc25
- [x] 9. AD-7 Store: `localStorage` and `navigator.storage`; `main.ts` calls `requestPersistence()` only → commit: cd4fc25
- [x] 10. Same as item 2 (AD-15 beside AD-16 wording) → commit: cd4fc25
- Gate (bmad-architecture): `lint_spine.py` 0 findings before and after; three lenses scoped to the amendments; as-built precision applied; `npm run test -- src/architecture` 336/336. Left open: `docs/game-flow-spec.md` §9 Q-40 still says "reported in dev and test builds only" (no effect: dev never loads `sw.ts`); a spec §9 wording change is the owner's, raised at the device-read handoff.

### Review-log minors (ticket review log, Result) and their resolution

- Pass 2: G4 splash tag → its own handoff line (item 4). G7–G17 commands → handoff items 5–8 from Seeded reads or play. Digest items → Retrospective leftovers. Mixed rows → map L69 (D part G2), L77 (postbuild + B). G8 → F10 measure-first in item 8.
- Pass 3: blocking Phase 1 fix tickets → none, stated in the handoff. Reinstated Optional rows route as Device rows → handoff.
- Pass 4: G4 splash → as above. Phase 1 failure still sends the handoff → I/O Matrix. G8/F10 → handoff. A finding needing a Session, history or engine change → an owner question (rule 7), stated in the owner-wait note. Spine amendment cites the authorisation → task 2's Scaffold deltas bullet.
- Pass 5: ticket file `after` [1–10, 13, 14] equals tickets.toml entry 11 `after` (checked; neither edited). Phase 2 re-sync scope → stated in the Notes authorisation line. Accepted §6.6 gap carries into entry 12's Done when 1 waiver → owner-wait note.
- Pass 6: device-read-only behaviour-stating §9 answer → owner question naming the choices (an answer worded without testable behaviour, or a §6.4 gap beyond release-checklist's allowance, which needs a checklist change), owner-wait note. Fix ticket closing without a fix for a row with no §9/owner route → Phase 2 lists it fix-less in §6.6 and raises an owner question (owner-wait note). `&&` chain → I/O Matrix. New §9 Q-id also updates §9's heading range and spec version note (resume step, owner-wait note). Jared records (unverified) marks in the epic Notes → handoff. Workable row order → handoff order. Notes authorisation: written by Phase 1, scope stated → task 1. An unfixed fix ticket's row → owner question (owner-wait note).
- Pass 7: AC 2 test kind → the map counts a row's D or postbuild part by its read or gate and never an S test for a P7/B row. "The last source commit" → the tree after which no build source changed, after any fix ticket; the checklist re-check runs at HEAD (Phase 2).

## Implementation Notes

Phase 1 run, 2026-11-04, `/mnt/d` checkout, branch `pwa-release`, Node 24. Commits (local, not pushed): 427bfe6 (epic Notes authorisation line + this plan, the run's first commit, so the line is present at every sync commit's parent), 7cd8939 (spine + memlog), fcbb3ac (EXPERIENCE.md + memlog), 7366186 (AGENTS.md), 5d40612 (SPEC companions + epic 3 rule-coverage).

- `bmad-architecture` (headless update): resolved customization; resumed the existing run folder `architecture-wordcell-2026-09-27` from its memlog; amended Rules in place (no AD added, renumbered or retired); inline "(amended 2026-11-04, epic 7 entry 11)" tags; `updated: '2026-11-04'` (`status: final` unchanged); two memlog `event` lines (the sync, the gate). Reviewer Gate: `lint_spine.py` 0 findings before and after; rubric walker plus both `finalize_reviewers` lenses (reality-check, adversary) as parallel read-only subagents scoped to the amended passages. Deviation from the gate's mechanics: the lenses returned summaries only and no `reviews/review-*.md` file was written, so `git diff 8a98d45 HEAD --stat` stays on the Code Map targets (AC 3). Applied (precision inside items 4, 5, 7, 11, each making the amended text state the code exactly): `precacheComplete()` is `false` before any recompute and a failed recompute rejects to AD-15, so it is polled online only (`test-hook.ts:50`, :123-126, `offline.spec.ts:60`); in `VITE_TEST_HOOKS=1` builds a Q-40 failure halts before persistence (`sw.ts:19`, CAP-3); the `navigator.storage` regex has identifier boundaries (`architecture-scan.ts:57`); the content check names `messageSkipWaiting` and `build-output.spec.ts:50` for `serviceWorker.register` elsewhere. Not applied: Owner stop items 7–10. The reality lens had no web access; versions were confirmed against `package.json`, `package-lock.json` and `node_modules` (workbox-window 7.4.1, vite-plugin-pwa 1.3.0, Playwright 1.63.0).
- `bmad-ux` (headless update): existing workspace `ux-wordcell-2026-09-27`; items 13–14 only; `updated: 2026-11-04`; one memlog `change` line. Its Reviewer Gate is opt-in and was not run (headless, two wording-only rows). No other EXPERIENCE.md line says "next launch".
- `bmad-project-context` (refresh limited to items 15–17): ledger of three `rewrite` entries, each an addition that keeps the full rule (nothing narrowed or dropped); paths checked (`src/shell/sw.ts`, `src/shell/sw-state.ts`); the `navigator.storage` scan shares the `localStorage` check's `storageCheck` gate (`architecture-scan.ts:582-586`), so the exemption parenthetical now reads "these three". Splice inside the markers only; rules 1–7 untouched. Verified stamp kept at "2026-10-14 against 7e8dd28": this was not a full re-verification, so restamping would overclaim.
- Direct edits (items 18–26): each carries "(amended 2026-11-04, epic 7 entry 11)" and its D-row. Item 21: SPEC F8 and build-notes keep "microsoft/playwright#14711; unverified for 1.63" for `context.route` (7.3 did not re-probe it) and add the as-built: no `context.route`, `page.route` or CDP route in the update spec. Line shift for Phase 2: build-notes' (unverified) lines named at ff84c95 :213, :216 are now :221, :224.
- AC 3: `git diff 8a98d45 HEAD --stat` also lists `_bmad-output/implementation-artifacts/autopilot/epic-pwa-release-20261030-1141.md` and `epic-pwa-release-handoff.json`, changed by the orchestrator's 226e7d4 before this run started; `git diff 226e7d4 HEAD --stat` (this run's commits) lists only the Code Map targets, their two `.memlog.md` files, the epic file and this plan.
- Rule-coverage map re-checked at 5d40612: every file:line above holds a test title carrying one of its row's ids (`grep`/`sed` per entry; test sources unchanged since 8a98d45). `git diff 4130fb4 HEAD -- src/engine` is empty; `SESSION_VERSION`/`HISTORY_VERSION` untouched.

- Orchestrator, step 3 Verify (resumed after the subagent's tool failure): diff since 8a98d45 read in full; it touches only the Code Map targets, their two `.memlog.md` files, the epic file, this plan and 226e7d4's two autopilot files. One fix: SPEC F6's sync sentence started lowercase ("with a comment. as built …"), capitalised in its own commit. Review-log Result counts checked against the resolutions below (pass 2: 5, pass 3: 2, pass 4: 5, pass 5: 3, pass 6: 8, pass 7: 2): each has a line. With the shell tool down, commands ran through the Monitor tool; long runs were started with `wsl.exe` from Windows (scripts and logs in the git-ignored `.autopilot/manual-7-11/`: `run-test-all.sh`, `run-skipped.sh`, `run-screens.sh`, `test-all-readonly-tmp.log`, `test-all.log`, `skipped-*.log`, `diag-deploy-check.log`, `test-screens.log`) with a Linux-only `PATH` (a profile-less `wsl.exe` shell otherwise resolves Windows npm). Phase 1 stops here: no step-04 review, plan stays `in-progress` (ticket Phase 1, owner instruction).

## Plan Change Log

## Review Triage Log

## Design Notes

- Skills headless: invoke each with intent `update`, the item list and the authorisation line; if a skill asks a question it cannot settle from this plan, take its recommended technical default for wording, never for content beyond the item.
- Ticket text says "Jared's 2026-11-04 run authorisation"; the owner's words are dated 2026-11-03 (orchestrator's instruction). The Notes line uses 2026-11-03.
- Phase 1 commits only documents, so `test:all`/`test:screens` at the final tree test the same build sources as 8a98d45; they still run (ticket).

## Verification

**Commands:**
- `git diff 8a98d45 HEAD --stat` -- expected: only sync targets, `.memlog.md` files, this plan.
- `git diff 4130fb4 HEAD -- src/engine` -- expected: empty.
- `npm run test:all` -- expected: exit 0 (failures per the I/O Matrix).
- `npm run test:screens` -- expected: exit 0.
- `git status --porcelain` -- expected: empty after the last commit.

## Auto Run Result

Status: `in-progress` (Phase 1 owner stop). Syncs 1–27 applied and committed; rule-coverage map re-checked; `npm run test:screens` pass (68 passed, 40 skipped by design); `npm run test:all` not green: the WSL root filesystem went emergency read-only mid-run, and the failing titles recorded in the Owner-wait note are explained by that fault (the same build sources passed in run 1, or the file passes alone). Next: Jared repairs WSL (Owner stop item 11), `test:all` is rerun, then the device-read handoff goes out. No push, no merge.
