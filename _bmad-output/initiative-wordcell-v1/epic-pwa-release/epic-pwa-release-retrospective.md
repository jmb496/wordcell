---
epic: epic-pwa-release
date: 2026-11-07
verdict: accepted-with-open-items
criteria: declared
headless: true
---

# Epic 7 retrospective: PWA and release

Headless run (`-H pwa-release`, 2026-11-07), after the close-out (7.11, done 2026-11-07) and before the owner's merge, per SPEC F12 and `release-checklist.md` Production sequence step 6 (epic Notes, Decision 2026-10-29). The retro wrote only this document. It changed no status, epic file, plan, story file or code.

## Epic summary

**Epic:** `epic-pwa-release` (id 7), `_bmad-output/initiative-wordcell-v1/epic-pwa-release/`. Branch `pwa-release`, cut from `main` at `4130fb4`. The autopilot run started at `87ab949` (digest `_bmad-output/implementation-artifacts/autopilot/epic-pwa-release-20261030-1141.md`, cited below as "digest"). HEAD is `869890c`.

**Tickets, in build order (`tickets.py status`):**

| Ref | Title | State |
| --- | --- | --- |
| 7.1 | Worker registration, state module and swState() | done |
| 7.2 | Worker failure split and no-skip-waiting guards | done |
| 7.3 | Two-build update proof | done |
| 7.4 | precacheComplete() test hook | done |
| 7.5 | Persistent-storage request and boot-order proofs | done |
| 7.6 | Offline proof | done |
| 7.7 | Q-40 failure and Q-42 controlled-branch proofs | done |
| 7.8 | Packaging and size budget with a real worker module | done |
| 7.9 | Device-read tooling for a registered worker | done |
| 7.10 | Refactor sweep | done |
| 7.13 | Deflake the success-signal drag test (fix ticket, D-65) | done |
| 7.14 | Deflake the helpers.spec.ts doubleTap test under load (fix ticket, D-71) | done |
| 7.15 | Close the 7.11 §6.4 test-name and celebration-colour gaps (fix ticket) | done |
| 7.11 | Close-out: documents, audits and device read (hitl) | done (owner, 2026-11-07) |
| 7.12 | Owner's post-merge v1 release: production install, 1.0.0 and ten games (hitl) | **planned: post-merge by design** |

- **Still at `built`:** none.
- **Unfinished (`pending_tickets`): 7.12.** This is by design. SPEC F12, `release-checklist.md` step 6 and the epic Notes (Decision 2026-10-29, user direction) put this retrospective after 7.11 and before the merge, and put 7.12 after the merge. Headless: recorded under Assumptions, with no confirmation invented.

**Plan ranges.** Baselines are ordered by history. Each range runs to the next baseline; the last runs to HEAD (inferred).

| Ticket | Range | Build commits (digest) |
| --- | --- | --- |
| 7.1 | 96cca7c..1a96068 | 4938cf9 |
| 7.2 | 1a96068..f45add3 | e340aee, 326edb4 |
| 7.3 | f45add3..8e132f0 | 26b0fae, 8be346f |
| 7.4 | 8e132f0..d3854dd | 9fb2731 |
| 7.5 | d3854dd..d4d58cf | 1259a50 |
| 7.6 | d4d58cf..360b966 | b02f567 |
| 7.7 | 360b966..0a61fc2 | bdf477e |
| 7.8 | 0a61fc2..6785917 | c7cd412, a35d6b6 |
| 7.9 | 6785917..575fdf7 | 820dd04, 9da4299 |
| 7.10 | 575fdf7..84df83f | b11abd5, 6629acd, 38a52d5, 38f5dd8, bbdd2d5, 6127385, c8440d1 |
| 7.13 | 84df83f..420e831 | e4c9ef0, 8f86d49 |
| 7.14 | 420e831..8a98d45 | 14f0835, 785b8c2 |
| 7.11 | 8a98d45..HEAD | Phase 1 427bfe6…7b287ea; Phase 2 d486f89…8e48410. It overlaps 7.15's range, because Phase 2 resumed after 7.15. |
| 7.15 | 404c525..HEAD | c6bdeb3, 6d694a4 |

`git_evidence.py` over the whole epic, `87ab949..HEAD`: 188 commits, 0 merges, so merge measurement is complete. The test-free production change is 10 files, +624/−92: `src/main.ts`, `src/shell/{sw,sw-state,storage,test-hook}.ts`, `src/architecture-scan.ts`, `scripts/{device-preview,size-budget}.mjs`, `package.json`. No change reached `src/engine/`, `src/ui/` or `fixtures/`.

**Evidence inventory.**
- **Available and read:** the epic file (Done when 1–5, Notes); `tickets.py status`; all 14 ticket files, plans and ticket review logs; the code review logs `_bmad-output/implementation-artifacts/review-loop/7-*-build.md`; the digest; the 7.11 run records `.autopilot/manual-7-11/` (`7.11-B*.json`, `device-read.md`, the test logs); the 7.11 plan's §6.4/§6.6 audits; the ten earlier retrospectives and their epics' plans and digests (for the cross-epic table, through read-only helpers).
- **Session logs:** the autopilot step logs under `.autopilot/20261030-1141/` and `.autopilot/manual-7-11/` are present. Full conversation transcripts were not read. Process lessons rest on the digest, the plans and those step records.
- **Missing:** nothing the analyses needed.

## Findings

Each finding has a source, an instance disposition (fix now / defer / accept) and an upstream lesson. Ids: **S** spec reconciliation, **V** verification gap, **R** diff review, **P** process, **D** duplication/size, **T** tickets.toml.

### Architecture delta

- **Clean.** The layer table holds. `sw.ts` is shell (the only `workbox-window` importer), `sw-state.ts` imports nothing, and `main.ts` alone imports `./shell/sw`, dynamically, after the dictionary settles (AD-16). The AD-1 scans gained the skip-waiting names list (7.2) and the D-66 boot-order source check (7.10). `src/architecture-*.test.ts` passed 336/336 at the last tree (digest § 7.11). There are no new cross-layer imports, and engine, UI and fixtures are untouched (`git diff --stat 87ab949..HEAD -- src/engine src/ui fixtures` is empty). Disposition: none.

### Duplication map

- **D1 (defer). Two run-as-script idioms in `scripts/`.** `scripts/device-preview.mjs:316` compares `import.meta.url` with a raw `file://${process.argv[1]}`. `scripts/size-budget.mjs:221-224` uses `realpathSync` + `fileURLToPath` correctly. The first predates the epic (unchanged since 87ab949). See R4.

### Size growth

Ranked on `files` (non-merge churn), then read at HEAD:
- **D2 (defer). `e2e/helpers.spec.ts` is 2,249 lines, +680 this epic** (11 commits: 7.3, 7.5, 7.6, 7.10, 7.14 helper self-tests). It is one file of self-tests for every helper module. It is a candidate to split per helper module (`e2e/helpers/<module>.spec.ts` would break the AGENTS.md "helper modules in `e2e/helpers/` with their tests in `e2e/helpers.spec.ts`" convention, so a split needs that line changed). Not a defect. Defer to the next sweep that touches it.
- **D3 (accept). `e2e/pwa/update.spec.ts` is 744 lines, new in this epic (+901/−157, 7 commits).** About half of it is the spec's own self-tests of `readState`/`activationOutcome` (D-14, D-16, D-18, D-70 rows). Legitimately large for a two-build proof. The 7.10 code review left three edge cases in those helpers (V3).
- Production files stay small: `src/main.ts` 299, `src/shell/sw.ts` 91, `src/shell/test-hook.ts` 177, `scripts/device-preview.mjs` 316 lines.

### Pattern divergence

- None found. Test names carry ids (AD-n for shell, UI and helper tests; Q-40/AD-16 for the update and failure proofs). Fixtures are seeded through `e2e/helpers/seed.ts`. The skip-waiting names stay out of non-test sources (AD-1 scan).

### Spec-to-implementation reconciliation

- **S1 (accept, recorded). G5 / Q-50.** On a relaunch into Game over, the first Android back before any tap leaves the app instead of collapsing the end sheet. The probable cause is Chrome's history-manipulation intervention, which skips entries pushed at boot without user activation. Playwright's Chromium does not apply that intervention, so no automated test can see it. Jared accepted it on 2026-11-06 as spec §9 Q-50, device-read only, with no fix ticket (epic Notes, Device read G5 and Decision 2026-11-07; `docs/game-flow-spec.md` Q-50, 1fbb31c, e54263f). The spine's A-A11 and AD-16 now state it as an inference, with no compensating code (50395f2). Upstream lesson: a "back honours boot pushes" assumption (A-A11) needs a device read, never a Playwright proof. That is now written in the spine.
- **S2 (optional follow-up, Jared). Owner stop item 14.** This is the spine review's guess that, in a desktop or mobile Chrome tab, a back before any click followed by Forward might later make one back close two overlays. It has not been observed, needs no code change and does not block the release. The spine marks it unread (digest § 7.11; 7.11 plan deferred list). An optional desktop-Chrome check: seed `session-won-words`, cold-load, press Back, then Forward, then open and close two overlays with Back.
- **S3 (accept, recorded). G20 "not confirmed as described".** "Didn't seem to match the overall description of what the UI should look like, but I'm ok with how it is." Accepted as is, with no change requested (epic Notes, Device read, Desktop). Recorded so later retros stop re-flagging it.
- **S4 (accept). G18 and G19 were not reinstated, and G7's optional dictionary-404 Reload was not attempted.** These follow the owner decisions of 2026-10-16 (device-checks.md:34-35) and the epic Notes. G16 is entry 12's row.
- **S5 (open by design). Done when 5 is not met.** Entry 12 (CAP-10) runs after the merge: the production install, the 1.0.0 commit, ten qualifying games, and every `release-checklist.md` row with its evidence. This forces the machine verdict (below).
- **S6 (fix-now, owner). Q-50 needs the initiative Done when 3 waiver at entry 12.** The id-level name check then has one id without a test. The 7.11 plan's owner-wait note and Owner stop item 12 (c) state that the waiver goes in the initiative Notes at entry 12.

### Diff review (adversarial, edge-case, verification-gap lenses)

The review ran as a read-only helper over the production diff `87ab949..HEAD` (the 10 non-test files above), weighting the 7.1/7.2/7.4/7.5/7.8/7.9/7.10 boundaries. Its findings were re-checked against the source by the parent; the cited lines hold at HEAD. **Checked and clean:** `sw.ts` worker states (present before registration, redundant before or after activating, replaced waiting worker, rejected or `undefined` `register()`, missing `navigator.serviceWorker`); `updatefound` attached after `register()` misses nothing; `main.ts`'s four `halted()` checks and the F17 catch order; every `requestPersistence()` branch; size-budget dynamic-import reachability; `precacheComplete()` staleness and URL union. No high or medium finding.

- **R1 (low, defer). `scripts/device-preview.mjs:207-208`.** Only SIGINT and SIGTERM run `stop()`. Closing the terminal (SIGHUP) leaves the `tailscale serve --bg` share pointing at 127.0.0.1:4173. A later `npm run test:e2e:pwa` (`playwright.pwa.config.ts:41`, the same port) would then serve the hook build on the tailnet URL. Exposure is limited to Jared's tailnet. Test: none.
- **R2 (low, defer). `package.json:50` pins `workbox-window` `7.4.1` while `vite-plugin-pwa ^1.3.0` resolves `workbox-build`.** F2's "pinned to the version vite-plugin-pwa resolves" is checked nowhere. A lockfile refresh could split the window and worker runtimes silently (small impact today: `sw.ts` sends no messages). Test: none. Proposed: a unit test comparing the lockfile's `workbox-build` version with `workbox-window`.
- **R3 (low, defer). `scripts/device-preview.mjs:264`** allows the tailnet host through Vite's internal `__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS`. No test exercises `realIo`, so a Vite upgrade that drops the variable would show "host not allowed" on the phone with every test green. The device read is the only check.
- **R4 (low, defer; predates the epic). `scripts/device-preview.mjs:316`** compares a percent-encoded URL with a raw path. In a checkout path with a space or non-ASCII character, or through a symlink, `main()` never runs and the script exits 0 silently. Fix: reuse `size-budget.mjs:221-224`'s idiom (D1).
- **R5 (accept: F17 allows it). `src/main.ts:271-279`.** The F17 catch turns any rejection of `import('./shell/sw')`, including a top-level throw inside the chunk, into a silent `failed` in production. Test builds still report it, but only for errors Chromium reproduces.

### Verification gaps and review-loop leftovers

- **V1 (fix-now, Dev). D-54 recurred on the device read.** After a session restart, a `--no-build` device-preview run timed out at the 15 s port wait (`scripts/device-preview.mjs:211`); cold `vite preview` on `/mnt/d` took about 9–15 s. The run left `vite preview` running on 4173, and it was killed by PID (`.autopilot/manual-7-11/device-read.md:13`, "the 7.9 carry"). D-54's test (`scripts/device-preview.test.mjs:366` "AD-17 run kills the preview and rethrows the same error when the port wait times out") uses a fake IO. It asserts only that `kill()` is called once, not that the real child has exited, so it did not reproduce the field failure. Proposed (technical): wait for the child's `exit` after `kill()`, escalate to SIGKILL after a bound, and raise the cold-start wait (or make it a flag). Add a test with a real child that ignores SIGTERM. The same session's lesson: `pgrep -f vite` matched the agent's own bash wrapper, whose command line contained the pattern, not the node process. Use `ss -ltnp 'sport = :4173'` or `fuser 4173/tcp` to find the listener (P7).
- **V2 (defer). 7.10 code-review leftovers (`review-loop/7-10-build.md` Result, 8 minors).**
  - Plan wording: the D-65 count at f29b440; the stale D-64/D-71 sub-entry in "For the owner or orchestrator" item 4; the recorded `Received: 28314` mutation value; the D-70 row's `unreadable` citation.
  - `e2e/pwa/update.spec.ts` helper edges: `READ_MS` lower bound; `activationOutcome` treating `undefined` from A's record as unreadable; `readState` giving A's fallback read its own `READ_MS` bound.
  - The D-46 worst case can reach the 60 s test timeout (still a failure, never a pass).
  - The three `update.spec.ts` edges are test-robustness items for the next ticket that touches `update.spec.ts`. The plan wording is in a done plan and stays as is.
- **V3 (defer). 7.13 open major (`review-loop/7-13-build.md` Result).** The plan's Item 3 failing-path list omits `src/ui/overlays.svelte.ts` and the `dispatch` pre-write files `src/engine/view.ts`, `replay.ts`, `scoring.ts`, `types.ts` and `src/shell/storage.ts`. Its "not on the tap path" sentence is wrong for `overlays.svelte.ts`. Only the evidence record is affected; the Never-reproduces outcome rests on the run counts, which nobody disputes. 9 further minors are listed in its Pass 2. Disposition: the plan is done; a future D-65 sighting's fix ticket cites this correction.
- **V4 (defer). 7.14 residual (`review-loop/7-14-build.md` Result).** `doubleTap` reads one stamp per tap and reuses it for `touchEnd` (`e2e/helpers/touch.ts:124-136`). A WSL clock step during `touchStart`'s CDP round trip (2–16 ms) still shifts `touchEnd`: about 0.05 %, not the plan's 0.01 %. Proposed (technical): stamp per event (`stamp(at)` before each `session.send`).
- **V5 (defer). 7.15 plan wording (`review-loop/7-15-build.md` Result).**
  - The plan says "two samples" in places where the test takes three.
  - It says no opacity mutation was run, but the pass-1 fixer ran a group-opacity mutation that failed the test. Only the copy's own `opacity` has not been shown failing.
  - Only the first, QU and last groups are proven sampled.
  - Disposition: the plan is done, so accept the wording. Optional test hardening: assert the union of the sampled group indices.

### Process

- **P1 (fix-now, Owner). D-64 and its fix path.** The flaky test is `e2e/nav.spec.ts:163` "§2 AD-13 a double tap on New game on the rejected root opens the notice at wc 1 and no Reset confirm".
  - 7.10 proposed it as an owner backlog entry outside epic 7, not in tickets.toml (`story-refactor-sweep-plan.md:183`, `:202`). The digest left that entry "to the retrospective" (digest § 7.10 resumed, § 7.10 done). No such entry exists in any `tickets.toml`, the initiative file or `docs/`; the 7.11 ticket review already noted it "points at a backlog entry that does not exist" (`story-close-out-documents-audits-and-device-read.review-log.md:80`).
  - 7.14 (D-71) found a mechanism that probably covers D-64 too. The WSL2 clock steps back about 1.6 s roughly every 32 s. `doubleTap` derived the second tap's stamp from a reading taken before the first tap, so a step between the taps pushed the second tap past Chromium's tap-count window.
  - The fix stamps each tap at dispatch (14f0835, with the self-test `e2e/helpers.spec.ts:1127`). It applies to every `doubleTap` caller, D-64's included. The 7.14 plan estimates about a 0.3 % per-run hit rate for D-64's default 80 ms `between` before the fix, as a hypothesis, not proof (`story-deflake-the-helpers-spec-ts-doubletap-test-under-load-plan.md:57`, `:186`).
  - D-64's test passed 5/5 in 7.14's caller repeats (20/20 over four callers, `:105`) and failed 0 times in 7.10's and 7.14's counted runs.
  - Proposal: close D-64 as "probable cause fixed by 7.14 (D-71)", with a recurrence rule: any new D-64 failure opens a fix ticket citing the 7.14 plan and its event log. Do not create a separate backlog entry. Jared decides (it was his backlog item, epic 11 retro A7).
- **P2 (fix-now, Owner/methodology). Review loops hit the 7-pass cap twice, and no flake-close protocol exists.**
  - 7.10's ticket review was capped at 7 passes (majors 10, 7, 5, 4, 2, 1, 2), with its two open majors in the AC flake-rerun bullet (`story-refactor-sweep.review-log.md` Result).
  - 7.13's was capped at 7 (majors 8, 8, 8, 5, 5, 5, 1). Its "persisting area" was the outcome-routing rules of Scope 4–5 (modes, proof halves, void rule, which runs count), because "no ref defines a flake-close protocol" (`story-deflake-the-success-signal-drag-test.review-log.md` Result; digest § 7.13 "Ref to fix upstream" (1)–(4)).
  - 7.14 (7 passes, majors 8 → 0) and 7.11 (7 passes, 15 → 0) converged on the last allowed pass.
  - Three of the four 7-pass reviews were about flake handling or test-run rules, not product behaviour.
  - Proposal: add a **flake-close protocol** to `docs/development-methodology.md`, built from 7.10 items 5–6, the D-70 precedent and the 7.13/7.14 plans. It should define:
    - the reproduction command and counts (isolated `--repeat-each=50`, three counted runs);
    - what a proof half is (injected failure without and with the fix);
    - the void rule;
    - "never reproduces" closure with recorded evidence;
    - where an unrelated flake sighting during a final `test:all` goes (one rerun, then a fix ticket).
  - Flake tickets then cite it instead of carrying it alone. Also turn the late-major areas into refs to fix upstream, listed in the next item.
- **P3 (fix-now, Owner/methodology). Late-major areas as refs to fix upstream.** Each became a ticket-local rule because no shared ref held it:
  - (a) the final `test:all` retry rule (7.10 AC bullet 3, digest § 7.10);
  - (b) the 7.13 Scope 4 void rule and proof-half counting;
  - (c) 7.13 Scope 2's "never loosen an assertion" list;
  - (d) 7.13 Scope 5's cause classification against AD-14.
  - Proposal: (a), (b) and (c) go into the flake-close protocol (P2). (d) goes into the protocol as "classify the cause by layer: test, helper or `src/`, a `src/` cause stops for the owner", citing AD-14 only as an example. None of them is spec or spine intent.
- **P4 (fix-now, Dev/orchestrator). tickets.toml lags the ticket files (T).**
  - Entry 13's `description`, `verify` and `references` keep the short pre-review wording. The 7.13 review log Result asked the orchestrator to sync them ("Orchestrator — sync tickets.toml entry 13 … and add 13 to entry 14's `after`").
  - Entry 14's `after` is `[10]` in `tickets.toml:188`, while the ticket file says `after: [10, 13]`. `tickets.py` flags entries 11 and 14 `drift: true`.
  - Entries 14 and 15 also keep their short pre-review descriptions (digest § 7.14, § 7.15).
  - The ticket file is the authority, and every entry is done, so nothing runs wrong. But a `tickets.py` reader (status, the epic gate) sees stale text.
  - Proposal: one docs commit syncing entries 13–15 (`description`, `verify`, `references`) and entry 14's `after` to their ticket files, through the ticketing skill (`bmad-preview-ticketing` refine/publish). An autopilot rule should follow: after a ticket review converges, the orchestrator syncs tickets.toml to the ticket file in the same commit.
- **P5 (accept, recorded). WSL root filesystem fault (2026-11-04).**
  - During 7.11 Phase 1's `test:all`, the WSL Ubuntu root filesystem went to emergency read-only (`ext4 errors=remount-ro`, `emergency_ro`). `/tmp` and `$HOME` became unwritable, while `/mnt/d` stayed writable.
  - Run 1 passed up to e2e test 567 before the fault. Run 2 had 24 unit failures, all EROFS. In run 3, with `TMPDIR` on drvfs, one timeout and two dist-smoke failures were all environmental (7.11 plan :398-406).
  - `test:screens` still passed through `docker.exe`.
  - Jared restarted the machine on 2026-11-04, and the rerun was green (digest § 7.11).
  - Lesson: a `test:all` with failures everywhere and `EROFS` in the logs is a machine fault. Check `mount | grep ' / '` for `ro`/`emergency_ro` before reading any failure as a test result. It needs `wsl --shutdown` and a fsck, not a fix ticket.
- **P6 (accept, recorded). Host CPU load timed out unit tests.** The first `test:all` rerun of 2026-11-05 timed out 17 unit tests because a Windows game was using about a third of the CPU. With the game closed, the run exited 0 (digest § 7.11, "Resumed 2026-11-05"). Lesson: check host load (`uptime` in WSL, Task Manager on Windows) before a counted or gating suite run, and treat mass 5 s timeouts as load first.
- **P7 (fix-now, Dev: `docs/device-testing.md`). Device-read process lessons** (epic Notes, Device read; `.autopilot/manual-7-11/device-read.md`):
  - (a) Chrome's All sites list groups the origin under `tail50c600.ts.net`, not under the machine name, so search "tail50c600" to find it. Already applied to `docs/device-testing.md` (428960f, untagged). Before the fix, "Clear site data" before G3's A and the first two G4 seeds cleared nothing.
  - (b) Confirm the seeded state in the Chrome tab before closing it. A first G4 try after a real clear showed a new game, probably from a window opened before the seed (device-read.md:6). Not yet in the guide as a step.
  - (c) A controlling service worker answers `/seed.html` with the app, so clear site data before seeding. The guide already says so (`docs/device-testing.md:47`, 7.9). It still bit, because the clear itself missed the origin until (a) was known: a clear that "worked" is only proven by the seeded tab showing the fixture, which is (b).
  - (d) The device-preview port-timeout leftover and the `pgrep -f` trap (V1).
  - Proposal: add (b) as an explicit step and the (d) recovery line (`ss -ltnp 'sport = :4173'`, then kill that PID) to `docs/device-testing.md`. Also drop the five steps still tagged (unverified) that were not exercised, or keep them tagged (they stay tagged now).
- **P8 (accept + optional follow-up). G5 / Q-50 and Playwright.** As in S1: Chrome's history-manipulation intervention skips boot-pushed entries before user activation, and Playwright's Chromium does not apply it. Any "back after launch" assumption needs a device read. Owner stop item 14 is S2.
- **P9 (fix-now, Owner/methodology). 7.11 needed three headless resumes (B2–B4) for wording-only syncs.**
  - Each resume's review found further wording that aligned documents with decisions already made: Owner stop item 12 (Q-50 syncs) → 13 (twelve alignments: binds, certainty, AD-13/AD-15 wording, A-E1, G5 Check, §6.6 wording, the §7.12 citation, AGENTS rule 6) → 14 (an unobserved case) (`.autopilot/manual-7-11/7.11-B2.json`, `-B3.json`, `-B4.json`; epic Notes, Decision (orchestrator) 2026-11-07).
  - Item 13 was in the end applied as technical defaults under Jared's run rule.
  - Proposal: the close-out ticket template (and the methodology § Autopilot) authorise the close-out to apply, as technical defaults, wording-only alignments with a decision already recorded (a §9 answer, an owner decision in the epic Notes, the as-built code). Each gets its own commit and checklist line. Only text that changes behaviour, reopens a decision or adds a new owner choice stays an Owner stop item. That would have folded items 12 (c)'s wording, 13 and 14's recording into B2.
- **P10 (accept). Usage limits and interrupted sessions.** These caused four stops: 7.3 Step C, 7.6 Step B (session exit), 7.10 Step B and 7.11 Step B (digest "Stopped" entries). Every resume path worked with no lost work: WIP checkpoint commits, `in-progress` plans and the resume prompt. No change.

### Close-out docs per ticket (digest "Close-out docs")

- 7.1–7.10, 7.13, 7.14, 7.15: none. 7.15's 2026-11-07 decision adds tests only; it also added the mapped P6 row to epic 10's `rule-coverage.md:47` (c6bdeb3), a coverage table, not an owner doc.
- 7.11:
  - Spine `ARCHITECTURE-SPINE.md` (Phase 1 7cd8939; items 2–10 cd4fc25; item 12 08c35dc; item 13 50395f2).
  - `EXPERIENCE.md` (fcbb3ac, 6cceeac, 15791ba).
  - AGENTS.md (managed block 7366186; rule 6 d20c1a9, a3d647c; skip-waiting pitfall).
  - `docs/game-flow-spec.md`: Q-40 wording c048c93, Q-50 1fbb31c, §7.12 citation e54263f.
  - `docs/device-testing.md` Site settings step (428960f).
  - Epic 7 SPEC dir: F6, F8, F12, build-notes, `device-checks.md` G5 (e620eab, cf75557), `rule-coverage.md`, `release-checklist.md` §6.4/§6.6 (e620eab, cf75557).
  - Epic 3 coverage rows Q-40/Q-42 (5d40612, 6652256); spec companions (cf76ac8).
  - Sources: digest § 7.11 Close-out docs; the 7.11 plan Sync checklist.

## Cross-epic bug-fix table (release-checklist §6.6)

This is the one cross-epic table the owner decided on (2026-11-07, epic Notes, 80a445d; 7.11 plan § "§6.6 audit"; `release-checklist.md` §6.6 as amended in cf75557). It covers every epic, 1–11, with the 7.11 §6.6 audit as its starting point.

- **Scope rule.** A row is a defect fixed **after** the defective code had landed as built work (Assumptions has the full rule). Excluded, and only counted:
  - in-ticket WIP code-review fixes;
  - owner design changes that fixed no defect;
  - coverage additions that fixed no defect.
- **Fix rows.** One row per distinct defect: an Opus-review commit that fixed seven defects gives seven rows. "Wrong test" rows are tests that passed on a broken implementation (the test was the defect).
- **Non-fix rows.** A few rows record a sighting or an accepted behaviour with no fix: D-64, D-65, the bfcache flush and Q-50. They are kept so §6.6 lists them.

**Reproduction-test cells.**
- **A test cell** gives `path:line "title"`, grep-verified at HEAD 869890c. `${…}`/`%s` marks a generated title. A test counts when its assertion fails on the defect.
- **"gap, accepted 2026-11-07":** a fix on Jared's accepted list that has no such test.
- **"gap, needs Jared":** any other fix without one. These are **not accepted** and are listed after the table.

**Rows.** 135 rows over the 11 epics (epic: rows): 1: 3, 2: 9, 3: 3, 4: 8, 5: 10, 6: 42, 8: 17, 9: 13, 10: 17, 11: 2, 7: 11. Epic 7 is listed last.
- 5 rows are accepted gaps: the 4.13 banner flake, F-7 543575c, 9f90cce, one c84a1df defect, and Q-50.
- 10 rows are gaps that needed Jared; he accepted all ten on 2026-11-07 (A1, epic Notes).
- 5 rows are non-fixes (bfcache, D-65, D-64 twice, Q-50).

**Owner's accepted list against the evidence.**
- Three fixes Jared accepted as gaps turned out to **have** reproduction tests: 081a3f9 (`scripts/deploy-config.test.mjs:130`, added in 1.11), 7352e29 (`e2e/end-sheet.screens.spec.ts:54`, whose baselines fail the comparator on the defect) and 169c6bc (`e2e/helpers.spec.ts:1102`). Each row shows the test, so no acceptance is needed.
- c84a1df is "possibly" on the list. It holds eight defects. Seven have tests, and one (the closing-fade duration source) is the accepted gap.
- Correction to the §6.6 audit: F1/F37's pinning unit test is `src/ui/gestures/controller.test.ts:2377`, not :2395 (which covers the opposite case).

| epic | fix (short) | commit | reproduction test (file:line "title") or gap |
| --- | --- | --- | --- |
| 1 scaffold-ci-deploy | 1.9 `compatibility_date` 2026-09-28 was later than the pinned wrangler 4.141.0's default (2026-09-25), so the real deploy would have failed | 081a3f9 | `scripts/deploy-config.test.mjs:130` "AD-18 the committed wrangler.jsonc passes against the DEFAULT_COMPAT_DATE read from the real cli.js" and `:217` "AD-18 compatibility_date equal to DEFAULT_COMPAT_DATE passes, the day after fails" (added later in 4fa949e, 1.11; :130 fails on the defective date). On the owner's accepted-gap list, but reproduced, so not a gap |
| 1 scaffold-ci-deploy | Precache listed the favicon, the three icons and the manifest twice each | 1d33960 | `e2e/pwa/precache.spec.ts:29` "AD-16 the precache manifest holds exactly one entry per URL, one per build file the globPatterns match" |
| 1 scaffold-ci-deploy | The AD-1 regex scan of `.svelte` markup missed `history` bindings in 12+ forms and wrongly flagged an each-key (fixed by a svelte/compiler parse) | 1d33960 | `src/architecture-ad1.test.ts` describe :1076 "AD-1 .svelte extraction", generated cases e.g. :1207 "AD-1 fails: script closed by &lt;/script &gt; with whitespace (src/ui/X.svelte)", :1237 "AD-1 fails: markup {const history = x} (src/ui/X.svelte)", :1359 "AD-1 passes: markup {#each xs as x (history)} key is a reference (src/ui/X.svelte)" |
| 2 rules-engine | D1: `addFreeLetter` with `index: undefined` threw `command-domain` instead of appending (fixed in epic 3) | 81487f6 | `src/engine/commands.test.ts:1087` "R-33 addFreeLetter with index: undefined appends like an absent index (Q-31)" |
| 2 rules-engine | D2: `parseSession` accepted an `activeMs` near 2^53, and the first `accrue` halted the app (fixed in epic 3) | 64e96ca | `src/engine/serialize.test.ts:1147` "§2 %s is replay-failed with its version and the stage throws its code" (row `session-invalid-ad7-active-ms-headroom.json`); `:1422` "§2 idle-fresh with activeMs 2^52 parses; accrue, view and giveUp work on the result" |
| 2 rules-engine | D4a: `checkRecord` accepted a won record with a negative `finalScore` (fixed in epic 3) | 64e96ca | `src/engine/serialize.test.ts:1706` "§2 checkRecord rejects %s with its code" (row :1700 "a won record at finalScore -1") |
| 2 rules-engine | D4b: `checkRecord` accepted `longestWord.letterCount` &lt; 3 (fixed in epic 3) | 64e96ca | `src/engine/serialize.test.ts:1706` (row :1686 "longestWord 'ab' 2") |
| 2 rules-engine | D4c: `checkRecord` accepted a `letterCount` differing from the spelling's length (fixed in epic 3) | 64e96ca | `src/engine/serialize.test.ts:1706` (row :1691 "longestWord 'tan' 4") |
| 2 rules-engine | D5: `statistics` returned the record's own `longestWord` object (latent; fixed in epic 3) | 64e96ca | `src/engine/history.test.ts:441` "R-84 statistics returns a copy of the longest word, not the record’s own object" |
| 2 rules-engine | Wrong test (2.3): two AD-7 pre-replay cases each broke a second check, passing for the wrong reason (2.12 S10) | dee02da | `src/engine/replay.test.ts:260` "§2 rejects ${name} (${code})" (rows :207 ad7-cursor-phase, :223 ad7-place-fields) |
| 2 rules-engine | Wrong test (2.8): the canValidate-false test took its expected code from the view itself (2.12 S17) | dee02da | `src/engine/view.test.ts:1038` "AD-3 in each canValidate false state validate throws the expected check" |
| 2 rules-engine | Wrong test (2.8): `isLegalTarget` compared with the view's own `legalTargets` (2.12 S18) | dee02da | `src/engine/view.test.ts:579` "AD-3 isLegalTarget and used in all three phases" |
| 3 app-shell | `fatal()` called `console.error` before `game.halt` (AD-15: halt first) (3.12 I-19) | dcf317d | `e2e/blocking.spec.ts:216` "AD-15 a fatal halts the store before console.error reports it" |
| 3 app-shell | `flush()` assigned a new `state` even when nothing accrued, forcing a needless GameView re-derive (3.12 I-25) | dcf317d | `src/shell/game.svelte.test.ts:1170` "AD-9 a flush that accrues nothing keeps the game.state reference (${name})" |
| 3 app-shell | CI-only: the history-notice double tap hit the centre of Reset history, which the confirm card covers when the title wraps in CI's DejaVu Sans (test-only fix) | a887379 | gap, accepted 2026-11-07 (no test shows the failure mode, which needs CI's wider font; nearest: the fixed test `e2e/history-notice.spec.ts:231` "§2 a double tap on Reset history below the Reset confirm's card lands its second tap on the confirm's scrim and leaves the confirm open at wc 2") |
| 4 board-and-gestures | F1/F37: a press on a card mostly under a sticky bar counted as having left its column, so a release back on that column dropped it there | 90de645, 54dabda | `src/ui/gestures/controller.test.ts:2377` "AD-12 F37 a press on a face mostly under the $name has not left its source: a nudge and a release back over its visible part fly back with no dispatch (Q-34)"; `e2e/drag.spec.ts:626` "R-14 Q-34 AD-12 F37 a tail pressed mostly under the top bar, nudged and released back over its column's visible part, flies back: nothing lit and the stored Session byte-identical" |
| 4 board-and-gestures | D7/F34: a column hidden under a bar could light up and take a drop | 921c0c5 | `src/ui/gestures/controller.test.ts:2263` "AD-12 F34 a column wholly under the top bar is never lit; the release flies back with no dispatch"; `e2e/drag.spec.ts:514` "AD-12 F34 a tail held over the top bar never lights the column under it; the release flies back and the stored Session is byte-identical" |
| 4 board-and-gestures | D6: the hover-peek timer survived Svelte replacing a cell's element | 921c0c5 | `src/ui/gestures/controller.test.ts:3575` "AD-12 the hover timer is keyed by cell number: a pointerout from a replaced cell node, or an entry into an empty cell, stops it" |
| 4 board-and-gestures | D6: a point on the shared edge of two cells resolved to the left cell | 921c0c5 | `src/ui/gestures/controller.test.ts:3594` "AD-12 the suppression slot uses half-open rects: a last point on the shared 3/4 edge suppresses cell 4, not cell 3" |
| 4 board-and-gestures | D9: a same-id pointerdown with a non-primary button did not end the lost press | 921c0c5 | `src/ui/gestures/controller.test.ts:1034` "AD-12 CAP-4 a same-id pointerdown with button !== 0 during a live press ends it (sameId) before the button check returns" |
| 4 board-and-gestures | D9: a keyboard (detail 0) click on a tray tile did not deselect (latent) | 921c0c5 | `src/ui/gestures/controller.test.ts:1717` "AD-12 F25 a click with detail 0 resolving outside, on a tray tile or on a block deselects; detail 1 and a column target do nothing" |
| 4 board-and-gestures | D1 (4.13): "banner during a scroll" e2e flake | 921c0c5, b94b7b2, 2f6a4d1, 3131ef8 | gap, accepted 2026-11-07 (nearest: `e2e/layout.spec.ts:282` "AD-11 banner during a scroll applied after it ends") |
| 4 board-and-gestures | D4 (4.13): pre-emptive fix of a flaky F33 pointercancel e2e (three separate pauses could miss the fly-back) | 921c0c5 | gap, accepted 2026-11-07 (no self-test shows the failure mode; never seen failing; nearest: `e2e/drag-interruptions.spec.ts:617` "AD-12 F33 a pointercancel of a drag from above the selection flies each face to its resting slot: selected faces lifted, no snap at settle") |
| 5 tray-and-place | S19 (5.14): the word line fitted against a rounded-up `clientWidth` | 3131ef8 | `e2e/tray.spec.ts:671` "AD-11 (R-30) a word line of fractional width, whose clientWidth rounds up past the next size, fits at the largest size its true width holds" (red before, green after) |
| 5 tray-and-place | `attribute()` read a missing or empty attribute as card 0 (rule 6) | 3131ef8 | `src/ui/gestures/lookup.test.ts:44` "AD-12 attribute throws on a missing attribute (rule 6: not card 0)" (also :50) |
| 5 tray-and-place | ActionBar ellipsis drawn at the button's 16 px, not the fitted label size | 543575c, f108967 | `e2e/tray-controls.spec.ts:323` "AD-11 (A9 4.2-m1) the primary label shrinks to 15 px between its 15/16 px widths and to 14 px, then ellipsizes, below its 14 px width" |
| 5 tray-and-place | FLIP reduced-motion fade used ease-out instead of linear | 543575c, f108967 | `src/ui/flip.test.ts:392` "AD-14 under reduced motion a flip play and an undo play fade opacity 0 → 1 over duration() (120) with linear/no easing, no translate, no wc-glide" (also :413) |
| 5 tray-and-place | F-7: the scroll-busy e2e in `tray-growth.spec.ts` depended on smooth-scroll timing | 543575c | gap, accepted 2026-11-07 (nearest: `e2e/tray-growth.spec.ts:118` "AD-11 session-place-long: a Confirm within 150 ms of a scroll event re-lays out at once (the move clears scroll-busy)") |
| 5 tray-and-place | Strip band marks overflowed the card face on wide system fonts | bb689e1 | `e2e/tray.spec.ts:309` "R-50 R-80 (UI) Place on ${row.fixture}: word line ${row.word}, bottom on the first tile, top and the orange star in the last tile's bottom band, meta" (`expectBand` checks the mark's right edge; fails only with wide `system-ui`, as on CI) |
| 5 tray-and-place | The tile area did not grow for a third compact row, so tiles 15+ were clipped and could not be hit | ca202db | `src/ui/layout/tray.test.ts:134` "AD-11 A-D4 the tile area grows with the band: area − max(H, 92) is trayGrowth(rows, H) for rows 1…4 at H 61 and 93"; `e2e/tray-growth.spec.ts:87` "AD-11 session-composing-long: + gives three rows, − two, the WordCell row box unchanged (scroll 0 / ${grown} / 0), no column face animating" |
| 5 tray-and-place | The win guard's key tracker stuck after a lost macOS keyup and swallowed later Z/Cmd+Z | ca202db | `src/ui/motion.test.ts:593` "AD-14 a Meta+Z keydown whose keyup macOS never sends, held over the win: the next Meta+Z keydown ends it, passes and undoes, and is not consumed after the uninstall" (also :621) |
| 5 tray-and-place | FLIP did not lift the tile clip for tray glides starting outside the tile area (8 → 7 tiles) | ca202db | `src/ui/flip.test.ts:1036` "AD-14 a tray-band glide from compact row 2 to card row 1 (8 → 7 tiles, tile-area height unchanged) lifts wc-drag-tiles until the last settle" |
| 5 tray-and-place | Wrong test: the flyToCell "no 0.5 px skip" test moved no card under 0.5 px, so it could not fail | ca202db | `src/ui/flip.test.ts:606` "AD-14 flyToCell glides a free letter from another cell rect to rect, no tile lift, and skips nothing under 0.5 px" |
| 6 game-surfaces-and-keyboard | A mouse-wheel scroll during a mouse drag left the faces, highlight and drop target stale (epic 4 F3, deferred to 6.14) | e01cf6a | `src/ui/gestures/controller.test.ts:5844` "AD-12 F3 a wheel during a mouse column drag adds the scroll delta to the faces and clears a target the scroll took away; the release flies back from the cumulative transform" (also :5993, :6070); `e2e/wheel-drag.spec.ts:42` "AD-12 F3 a wheel scroll during a held mouse drag keeps the face under the pointer and re-targets: …" |
| 6 game-surfaces-and-keyboard | F-3: the Reset confirm opened over the History notice cleared the entries beneath it (a latent AD-13 throw) | ee6085a | `src/ui/overlays-surfaces.test.ts:327` "AD-13 resetConfirm over the History notice leaves a sticky view, a tail selection or a peek beneath it untouched" |
| 6 game-surfaces-and-keyboard | Space on an open WordCell view could not close it (board inert while the view is open; SPEC F11) | ee6085a, 354a14f | `e2e/board-keys.spec.ts:224` "R-65 Space, Space on a WordCell opens the sticky view, then closes it with focus back on the cell"; `src/ui/keys.test.ts:1217` "AD-12 Space with focus in the open sticky view closes it; Enter there does not (SPEC F11)" |
| 6 game-surfaces-and-keyboard | The h:mm:ss timer measured 65 px in its 64 px box on CI's wider fonts | 1cfcbfd | `e2e/preferences.spec.ts:347` "R-82 at 360 px the top bar fits Score −530 and a 12:03:04 timer, without overlap or overflow" (asserts `scrollWidth ≤ 64`; fails only with CI's fonts) |
| 6 game-surfaces-and-keyboard | Sub-pixel flake on the 52 px menu-row check (test tolerance) | 9f90cce | gap, accepted 2026-11-07 |
| 6 game-surfaces-and-keyboard | bfcache hide flush (epic 4 F7): not reproduced in two attempts | e01cf6a (build-notes line) | not a fix: accepted non-reproduction (SPEC CAP-12 "not a bug") |
| 6 game-surfaces-and-keyboard | `openSurface` deselected before closing a sticky view (an AD-13 throw that halts the app) | 4cbaf45 | `src/ui/overlays-surfaces.test.ts:287` "AD-13 a sticky view promoted over a tail selection closes first, then the selection pops, then the surface pushes" |
| 6 game-surfaces-and-keyboard | The board stayed reachable (not inert) under the expanded end sheet | 4cbaf45 | `e2e/end-sheet.spec.ts:250` "R-75 expanded, the board under the scrim is inert and both bars are live; collapsed, the board is live again" |
| 6 game-surfaces-and-keyboard | Closing Statistics always focused ☰, even when opened from the end sheet | 4cbaf45 | `e2e/end-sheet.spec.ts:463` "AD-13 Statistics over the sheet: wc 2, Esc closes only the panel, the top bar is inert under it; Esc and back return focus to the Statistics button of the sheet" |
| 6 game-surfaces-and-keyboard | StatisticsPanel derived "history unreadable" itself instead of the shared `historyUnreadable()` getter (SPEC F4) | 4cbaf45 | gap, accepted 2026-11-07 (no behaviour change; no scan pins the single getter) |
| 6 game-surfaces-and-keyboard | Both Reset history buttons (EndSheet, HistoryNotice) bypassed `openSurface` (SPEC F8) | 4cbaf45 | `src/architecture-open-surface.test.ts:35` "AD-13 in src/ui outside tests only open-surface.ts calls overlays.open(, plus history-notice.svelte.ts for historyNotice" (positive control :45) |
| 6 game-surfaces-and-keyboard | The "focus ☰ after a menu-opened surface closes" rule was copied per surface, had drifted, with silent `?.focus()` (rule 6) | 4cbaf45 | gap, accepted 2026-11-07 (refactor; nearest: `src/ui/overlays-surfaces.test.ts:360` "AD-13 set only by an open from a menu row, taken once at close, rewritten by a non-menu open after a reset or back close") |
| 6 game-surfaces-and-keyboard | How to play always refocused ☰ on close, even when opened with `?` | 377ecd9 | `e2e/keys.spec.ts:133` "AD-13 ? with a column card focused: Esc closes How to play and returns focus to that card, not the menu button" (also :448) |
| 6 game-surfaces-and-keyboard | Menu and Confirm returned focus to `main` instead of the board (`focusBoard()`) | 377ecd9 | `e2e/menu.spec.ts:224` "AD-13 closing by ${name} leaves wordcell:session byte-identical and focus on the board"; `e2e/confirm.spec.ts:43` "R-74 ${name} acts at once on a fresh deal: no dialog, focus on the board" |
| 6 game-surfaces-and-keyboard | Closing the History notice on a relaunch left focus on `body` | 377ecd9 | `e2e/history-notice.spec.ts:353` "§2 closing the notice by ${name} on an Idle relaunch (session-idle-fresh.json) focuses the board" (also :385) |
| 6 game-surfaces-and-keyboard | Undo of a win from the sheet: the end sheet's `focusBoard` overrode phase focus | 377ecd9 | `e2e/end-sheet.spec.ts:317` "R-70 R-75 Undo from the expanded sheet (${name}) pops its entry, resumes play, phase focus" |
| 6 game-surfaces-and-keyboard | N starting a new game at once with a card focused focused a buried card of the new deal | 377ecd9 | `e2e/keys.spec.ts:122` "Q-24 N with nothing to lose and a column card focused focuses the new deal board" |
| 6 game-surfaces-and-keyboard | Focus never entered the sticky WordCell view or returned to its cell | 377ecd9 | `e2e/board-keys.spec.ts:205` "Q-24 Space on a WordCell moves focus into the sticky view; Esc returns it to the cell and Tab goes on to the next cell" |
| 6 game-surfaces-and-keyboard | F with more destination cards than movable tiles dropped focus to `body` | 377ecd9 | `e2e/board-keys.spec.ts:686` "Q-24 F with more destination cards than movable tiles keeps focus on the focused tile, and the arrows still move it" |
| 6 game-surfaces-and-keyboard | Dismissing a New game confirm opened with N returned focus to the opener or `body` | ba75e4e | `e2e/keys.spec.ts:95` "Q-24 N with a column card focused, then Keep playing, returns focus to the board, not that card" (also :79) |
| 6 game-surfaces-and-keyboard | Buttons showed the browser focus ring, not DESIGN.md's accent-teal ring | ba75e4e | `e2e/board-keys.spec.ts:424` "Q-24 Tab onto the Menu button, Undo and the primary action draws the 2 px accent-teal ring at a 2 px offset" |
| 6 game-surfaces-and-keyboard | Win guard: a bare modifier key after the 300 ms floor completed the animation, so the sheet flashed before Ctrl+Z | 3253419 | `src/ui/motion.test.ts:1053` "AD-14 Normal, after the floor before settle: ${name} down then Z: no open before the Undo"; `e2e/win-guard.spec.ts:462` "AD-14 R-70 Control+z after the floor during the animation: no sheet ever, no history entry (${name})" |
| 6 game-surfaces-and-keyboard | Win guard: the Undo hold took any mouse button; a lost pointerup or same-id press left it stuck | 3253419 | `src/ui/motion.test.ts:1017` "AD-14 a non-primary pointerdown on Undo is an ordinary consumed input: no hold, the open fires at 300 ms" (also :1025, :413) |
| 6 game-surfaces-and-keyboard | Win guard: a touch Undo released its hold before Android's click arrived | 3253419 | `src/ui/motion.test.ts:979` "AD-14 touch pointerup on Undo with no click: the open fires after the click grace" (also :991; unit only) |
| 6 game-surfaces-and-keyboard | A screen-reader announcement pending while hidden was spoken on return | 3253419 | `src/ui/announce.test.ts:232` "AD-3 a set or an outcome requested while hidden schedules no frame and is never set"; `e2e/screen-reader.spec.ts:272` "A-E9 a commit set still pending when the page hides is never spoken on return" |
| 6 game-surfaces-and-keyboard | The Statistics panel left out the unreadable-history headline (SPEC F9) | 354a14f | `e2e/statistics.spec.ts:152` "Q-33 ${file} shows the notice's headline above its message and Reset history instead of tiles, and the menu dot" |
| 6 game-surfaces-and-keyboard | The menu closed over the expanded end sheet put focus on `main` behind the scrim (SPEC F10) | 354a14f | `e2e/keys.spec.ts:463` "AD-13 the menu over the expanded end sheet, closed by Esc, back, a scrim tap or Close menu, returns focus to the menu button" |
| 6 game-surfaces-and-keyboard | Playwright traces on the drvfs checkout stalled context teardown, so `test:all` failed at random (epic 1 config, found by the epic 6 review) | 09285b2 | gap, accepted 2026-11-07 (only a manual diagnostic run reproduced it: 7.13 plan :97) |
| 6 game-surfaces-and-keyboard | Wrong test (6.13): the no-op announce test passed with the `changed` guard deleted | ee6085a | `src/ui/announce.test.ts:140` "AD-3 a no-op dispatch (changed false) after time has elapsed announces nothing, even when the views differ" |
| 6 game-surfaces-and-keyboard | Wrong test (6.13): the silent-relaunch e2e attached its recorder after boot | ee6085a | `e2e/screen-reader.spec.ts:228` "A-E9 a relaunch into a stored session is silent" (positive control; also :238) |
| 6 game-surfaces-and-keyboard | Wrong test (6.14): the free-letter wheel test passed without the scroll listener | 8377c18 | `src/ui/gestures/controller.test.ts:6089` "AD-12 F3 a small wheel scroll during a free-letter drag keeps the gap and the release adds the letter" |
| 6 game-surfaces-and-keyboard | Wrong test: the R-76 Game-over timer-freeze tests could not fail | 4cbaf45 | `e2e/preferences.spec.ts:156` "R-76 the timer is frozen in Game over (${name} shows ${expected})" (control :167) |
| 6 game-surfaces-and-keyboard | Wrong test: the R-83 final-score test compared the score with itself | 4cbaf45 | `e2e/end-sheet.spec.ts:184` "R-83 the sheet shows the final score, band name and message from the view" |
| 6 game-surfaces-and-keyboard | Wrong test: the reduced-motion branch count accepted ≥ 2, and EndSheet was missing from the source scan | 4cbaf45 | `e2e/pwa/build-output.spec.ts:189` "AD-10 the built CSS keeps the @container style(--wc-reduced branch, reading var(--wc-fade-ms) with no literal 120ms" (also `src/ui/surfaces.test.ts:150`, `e2e/menu.spec.ts:98`) |
| 6 game-surfaces-and-keyboard | Wrong test: "Redo after an undone Give up" never pressed Redo | 4cbaf45 | `e2e/end-sheet.spec.ts:362` "R-75 R-71 Redo after an undone Give up with a redo tail re-applies the move and does not reopen the sheet" |
| 6 game-surfaces-and-keyboard | Wrong test: "Halted: no key acts" passed with the halted guard removed | 377ecd9 | `src/ui/keys.test.ts:428` "AD-12 Halted: no key acts" |
| 6 game-surfaces-and-keyboard | Wrong test: the N-at-once tests did not prove a new game started | 377ecd9 | `e2e/keys.spec.ts:111` "Q-24 N with nothing to lose starts a new game at once" (also :431) |
| 6 game-surfaces-and-keyboard | Wrong test: "tile selection clears when Z changes the phase" could not fail | 377ecd9 | `e2e/keys.spec.ts:392` "Q-24 a tile selection clears when Z changes the phase (Place to Composing); one tap then selects one tile" |
| 6 game-surfaces-and-keyboard | Wrong test: the announcer sole-owner scans read a hand-picked file list that missed 9 files | 3253419 | `src/architecture-announce.test.ts:36` "AD-3 no game.dispatch( call is left in src/ui outside announce.ts and tests" (also :41, :46; control :51) |
| 6 game-surfaces-and-keyboard | Wrong test: the win-guard "is consumed" tests asserted only the settled end state | 3253419 | `e2e/win-guard.spec.ts:303` "AD-14 ${key} during the window is consumed and the sheet opens (${name})" (also :516) |
| 6 game-surfaces-and-keyboard | Wrong test: the win-guard WordCell-tap tests passed even when the tap was not consumed | 3253419 | `e2e/win-guard.spec.ts:489` "AD-14 a WordCell tap during the window opens no view; the sheet opens (${name})" |
| 6 game-surfaces-and-keyboard | Wrong test: the hover-peek re-anchor width case never triggered a re-placement | 3253419 | `e2e/hover-peek-reanchor.spec.ts:83` "Q-17 AD-12 an open hover peek re-anchors above its cell after a viewport width change, the pointer staying on the cell" |
| 8 how-to-play-scenes | The scene never restarted after a hidden tab (the step in flight finishes only once visible); the old e2e faked `document.hidden` | b6272b0 | `src/ui/scenes/scenes.test.ts:553` "AD-9 a step that finishes only after the page turned visible again restarts at step 1"; `e2e/how-to-play.spec.ts:357` "AD-9 a hidden page stops the scene and a visible one restarts it at step 1" |
| 8 how-to-play-scenes | The carousel reset its index on close, so the exit placeholder took scene 1's height | b6272b0 | `e2e/how-to-play.spec.ts:1406` "HP-1 during the panel exit the empty carousel keeps the closing scene and its stage height; reopening starts at scene 1" |
| 8 how-to-play-scenes | With reduced motion, scene 1 drew E twice (D block and tray) | b6272b0 | `src/ui/scenes/scenes.test.ts:1885` "AD-14 every scene: from the frame a step reveal hides the D block on (its tray-N), each reduced-motion frame hides it" |
| 8 how-to-play-scenes | Wrong test: the dictionary repro checked only `rejectedWords`, never looking up the fixture words | b6272b0 | `src/engine/how-to-play-scenes.test.ts:713` "R-38 AD-17 dictionary repro: every fixture word is in the generated dictionary" (also :722) |
| 8 how-to-play-scenes | Wrong test: the Slow/Fast e2e read the stage wait hold; the player's timing was untested | b6272b0 | `src/ui/scenes/scenes.test.ts:314` "AD-10 the player times each effect, step wait hold and the rest by duration(kind) × times, at two speeds"; `e2e/how-to-play.spec.ts:337` "R-10 AD-10 Animation speed Slow runs a scene step longer than Fast" |
| 8 how-to-play-scenes | Wrong test: the closed-panel tests read `getAnimations()`, which drops detached targets, so they could not fail | b6272b0 | `src/ui/scenes/scenes.test.ts:489` "AD-14 destroy() cancels every animation and no animate call follows it; the Scene effect teardown calls it"; `e2e/how-to-play.spec.ts:282` "R-10 AD-14 closed, the scene animates nothing; reopened, it starts again at step 1" |
| 8 how-to-play-scenes | D1: the clipped filler row read an obscenity | 011935c | `src/ui/scenes/stage.test.ts:173` "AD-14 the check catches the old order: E U G K on scene 1 reads FUCK once the strip clips it" (also :154, :179) |
| 8 how-to-play-scenes | D3: scene 5's rearrangement was a pointer drift with a cross-fade, not a tile glide | 011935c | `src/ui/scenes/scenes.test.ts:1950` "AD-14 every scene animates each of its fixture arrange commands as an arrange tile glide, never a pointer move (owner decisions D3 D4)" |
| 8 how-to-play-scenes | D4: the scene 2 tap put L mid-word, against Q-31 | 011935c | `src/engine/how-to-play-scenes.test.ts:116` "Q-31 R-33 R-30 scene free-letter: the tap on WordCell 6 names no index, so L lands at the right end of M (BAKLED); the arrange then gives BALKED" |
| 8 how-to-play-scenes | D5: place frame 0 showed an empty tray, a lit Validate and cell 6 not dimmed | 011935c | `src/ui/scenes/scenes.test.ts:1135` "AD-14 R-30 R-31 scene place: frame 0 shows the composed word B A L K E D in the tray with the D block B locked (owner decision D5)" |
| 8 how-to-play-scenes | D6: the stage fit ignored the controls, so the WordCell row sat below the fold | 011935c | `e2e/how-to-play.spec.ts:1646` "HP-1 AD-11 on a short window every scene’s whole stage fits below the carousel controls without scrolling, at its own card width" |
| 8 how-to-play-scenes | D8: the scene 5 drag-out was clipped by the stage edge | 011935c | `src/ui/scenes/scenes.test.ts:2106` "AD-14 every scene: every pointer target and the carried cards at every step stay on the stage (owner decision D8)" |
| 8 how-to-play-scenes | D9: the place strip had no bottom/top marks (R-50 (UI)) | 011935c | `src/ui/scenes/scenes.test.ts:1149` "AD-14 R-50 scene place: every strip marks its first card bottom and its last top with the star, the game marks (owner decision D9)" |
| 8 how-to-play-scenes | D10: column 3 still drew D and N while they were in the tray | 011935c | `src/ui/scenes/scenes.test.ts:2164` "AD-14 R-31 scenes 1 and 2: column 3 reads M F N D, then M F N at k 2 and M F at k 3" |
| 8 how-to-play-scenes | D11: the scenes' not-legal dim and used hatch differed from the game's | 011935c | `src/ui/scenes/scenes.test.ts:1253` "AD-14 R-33 R-40 the dim and the used hatch have one source, app.css, read by the game and the scenes (owner decision D11)" |
| 8 how-to-play-scenes | D12: scene text fell below the 11 px floor | 011935c | `e2e/how-to-play.spec.ts:1685` "HP-1 AD-11 at the 32 px landscape floor every scene’s text renders at 11 px or more" |
| 8 how-to-play-scenes | Unit suite red on main: the owner's band-label edit (2b7c4e5) landed without its test update | c640608 | `src/ui/text.test.ts:266` "AD-3 bandScore strings carry the R-83 English ranges in steps of 50" |
| 9 themes | Alternate theme blocks won only by stylesheet order; the Plum/Paper e2e checks could not tell them from Charcoal | 5210279 | `e2e/theme.spec.ts:302` "AD-10 Q-45 every registered theme computes its app.css record on the root, in any source order"; `src/ui/theme/contrast.test.ts:269` "AD-10 the app.css theme record ids equal the registered theme ids" |
| 9 themes | The TH-2 colour-literal scan missed literals in markup expressions, short hex or named colours in script colour contexts, declaration strings and rune shapes | 5210279, a88cf67, 45f6a13 | `src/ui/theme/colour-literals.test.ts` generated cases :45 "flags hex in style directive expression", :54 "flags short hex assigned to a style colour", :72 "flags named after a non-colour declaration", :219 "flags short hex in a $derived.by arrow under a colour name" (titles "AD-14 flags …") |
| 9 themes | The TH-2 scan blanked `var()` fallbacks, so `var(--x, red)` passed | a88cf67 | `src/ui/theme/colour-literals.test.ts:155` generated case "named var() fallback in a css file" (title "AD-14 flags …"; also :164) |
| 9 themes | Prefs `THEMES` was not tied to `ThemeId`: a stale id would halt the boot instead of falling back to the Q-36 default (latent) | 5210279 | gap, accepted 2026-11-07 (only the `satisfies Record<ThemeId, true>` type check at `src/shell/prefs.svelte.ts:67`, enforced by `npm run check`; nearest: `src/ui/theme/registry.test.ts:26` "AD-10 ThemeId, prefs themes and registry ids agree", which would pass with an extra id) |
| 9 themes | The art worst-point contrast was checked only at the capped opacity sum | a88cf67 | `src/ui/theme/art.test.ts:183` "AD-14 worstRatio finds an inner minimum between the alpha ends" (also :173) |
| 9 themes | D1: at 360 px the Theme labels were clipped and Plum Dusk could not be tapped (the old test scrolled) | 45f6a13 | `e2e/theme.spec.ts:406` "AD-10 Q-45 at 360 px every Theme label lies inside the group and is hit at its centre, without scrolling" |
| 9 themes | D2: `fatal()` left the theme's status-bar colour over the Charcoal Halted screen | 45f6a13 | `e2e/blocking.spec.ts:171` "AD-15 AD-16 a fatal under a stored Daylight Paper shows Charcoal Halted colours and resets the theme-color meta" |
| 9 themes | D3: the dark alternate themes' drag shadow was lighter than DESIGN.md's `#0008` | 45f6a13 | `src/ui/theme/contrast.test.ts:380` "AD-14 theme %s: a dark theme declares the default --wc-shadow-drag, a light one its own" |
| 9 themes | D4: a drop-target card lost its texture under the wash | 45f6a13 | `e2e/theme-art.spec.ts:221` "AD-14 TH-9 ${id}: the drop-target card under a drag keeps its texture beneath the wash" |
| 9 themes | D5: the focused checked segment showed no visible focus ring | 45f6a13 | `e2e/theme.spec.ts:500` "AD-10 Q-45 the focused checked segment shows a table-coloured gap inside its ring in every theme" |
| 9 themes | D6: Greenhouse Dusk's washed drop-target outlines were below 3:1 | 45f6a13 | `src/ui/theme/contrast.test.ts:396` "AD-14 a wash that drops outline/table below 3 fails naming the wash" (also :189 "AD-14 theme %s meets the contrast floors") |
| 9 themes | Wrapped theme labels in Preferences were not centred | 7d45ee0 | gap, accepted 2026-11-07 (no test asserts text alignment; the Theme rows became a left-aligned list in 45f6a13, so the rule now affects only the Animation speed segments) |
| 9 themes | The screenshot gate's per-pixel threshold (0.2) let 24 stale baselines pass (config predates epic 9; found by its Opus review) | fc3c20c | gap, accepted 2026-11-07 (config-only change to `playwright.screens.config.ts`; nothing pins the threshold) |
| 10 end-of-game-words | Celebration drifted toward the nearer wall, against EXPERIENCE.md; its test pinned the wrong side | c84a1df | `src/ui/celebration/step.test.ts:740` "AD-19 SPEC F27: drifts toward the farther wall: left of centre goes right, right of centre goes left, the exact centre goes right" |
| 10 end-of-game-words | On wide or short bands (desktop, landscape) most groups left without a floor bounce | c84a1df | `src/ui/celebration/step.test.ts:1093` "AD-19 every card bounces on the floor, then exits, all before the closing fade (${geometry}, ${name}, ${list})" (runs 1280x720 and 839x412) |
| 10 end-of-game-words | The celebration band ignored a shown dictionary banner | c84a1df | `src/ui/celebration/celebration.svelte.test.ts:909` "AD-19 a shown dictionary banner tops the band: the ceiling is the banner bottom (AD-12)" |
| 10 end-of-game-words | A missing `wordList` silently ended the run (rule 6) | c84a1df | `src/ui/celebration/celebration.svelte.test.ts:195` "AD-19 an empty list ends at once: onEnd then done once, no rAF; start after and inside done is legal; an absent list throws" |
| 10 end-of-game-words | `props()`/`running()` were not reactive, so a per-run mount could not follow a run | c84a1df | `src/ui/celebration/celebration.svelte.test.ts:925` "AD-19 props() and running() are reactive: both getters read the $state.raw active binding; their values follow start, end and cancel" |
| 10 end-of-game-words | The closing-fade duration was read from prefs instead of `motion.ts` (AD-19 single owner) | c84a1df | gap, accepted 2026-11-07 (nearest: `src/ui/motion.test.ts:54` "AD-19 celebrationFadeMs is 90, 180 and 320 at Fast, Normal and Slow", which pins the helper, not the controller's use of it) |
| 10 end-of-game-words | `data-celebration` sat on the groups, not on each copy | c84a1df | `src/ui/celebration/Celebration.test.ts:30` "AD-19 every group is hidden and carries data-celebration-group; each copy carries data-celebration and aria-hidden; no live-card attributes" |
| 10 end-of-game-words | The celebration layer sat at z-index 1, under the drag layer | c84a1df | `src/ui/celebration/Celebration.test.ts:59` "AD-19 the container is fixed to the band and clips to it; each copy scales from its top left" (asserts z 6) |
| 10 end-of-game-words | Wrong test: the R-86 duplicate-word test also passed when ties were broken by cell or card id | c84a1df | `src/engine/view.test.ts:1309` "R-86 a duplicate word gives equal entries in move order with different cards and cell" |
| 10 end-of-game-words | F14: Words rows used `--wc-outline`, not `--wc-hairline` | 7352e29, 4e0d813 | `e2e/end-sheet.screens.spec.ts:54` "AD-17 end sheet screenshot with the Words list in Charcoal at 360 px" / "… in Paper at 360 px" (`test:screens` only; the comparator fails the defect baselines, 1.06–1.11 % of pixels differ, limit 1 %). On the owner's accepted-gap list, but reproduced, so not a gap |
| 10 end-of-game-words | F18: a quick second press after a press skip reached the just-opened sheet | 2af38ac | `e2e/celebration.spec.ts:577` "R-87 a quick second tap on Replay this deal after a touch press skip is consumed (SPEC F18): no pointerdown, pointerup or click reaches the page, nothing activated, Session unchanged"; `src/ui/celebration/skip.test.ts:421` "AD-19 a new press (id ${pointerId}) within 300 ms after the release is consumed: its pointerdown, pointerup and click (SPEC F18)" |
| 10 end-of-game-words | `nav.spec.ts` double-tap flake: under load the real gap between taps passed Chromium's 400 ms window (`doubleTap` now stamps the taps) | 169c6bc | `e2e/helpers.spec.ts:1102` "AD-17 doubleTap gives two touch taps whose clicks have detail 1 then 2, even 600 ms apart in real time" (injects a 600 ms real gap; added in 169c6bc). On the owner's accepted-gap list, but reproduced by this self-test, so not a gap. A clock-step residual was fixed later in 7.14 (D-71) |
| 10 end-of-game-words | Wrong test: closing-fade step tests passed through NaN (`vx: 0`) | 767ed42 | `src/ui/celebration/step.test.ts:830` "AD-19 the cap: moving groups fade over the last baseMs and the run finishes by the cap" (also :864) |
| 10 end-of-game-words | Wrong test: the hidden-group check `includes('opacity: 0')` also matched 0.5 | 767ed42 | `src/ui/celebration/Celebration.test.ts:30` (title as above; the regex is now `opacity: 0(;\|")`) |
| 10 end-of-game-words | Wrong test: the dist-smoke `added()` true check could not fail | 767ed42 | `e2e/pwa/dist-smoke.spec.ts:132` "R-87 hook-free build: a real win plays and a press skips it to the expanded end sheet" (also :166) |
| 10 end-of-game-words | Svelte dev warning `binding_property_non_reactive` (`bind:this` in Celebration.svelte) | 767ed42 | gap, accepted 2026-11-07 (putting `bind:this` back stays green; 10.10 deferred the regression check) |
| 10 end-of-game-words | Wrong test: the 6.6 e2e "AD-13 R-62 a win by Redo while a sticky WordCell view is open …" never had its view open; removed | d4b42a6 | `src/ui/overlays.svelte.test.ts:834` "AD-13 a legal start with a sticky view on top pops the view, then pushes once" (also :540) |
| 11 place-preview | Wrong test: the scene bad-frame cases matched only the message prefix, so the no-after case passed on a different error | e99350f | `src/ui/scenes/scenes.test.ts:1228` "AD-14 Q-49 scene place: rendering throws when a Place frame names an after with no previews entries or has no after, or the fixture has no previews" |
| 11 place-preview | `nav.spec.ts:163` double-tap flake came back in 11.4 (D-64) | 9394922, 61f5419 (diagnostics only) | not a fix: deferred by the owner; see the epic 7 D-64 row and P1 |
| 7 pwa-release | 7.1's F17 catch reported a `sw.ts` chunk failure only when the game had not already halted (spec F17/AD-15: report anyway), test builds only | e340aee (7.2); runtime test b11abd5 (7.10 D-06) | `e2e/pwa/sw-failure.spec.ts:150` "Q-40 AD-15 (F17) a halt while the sw.ts chunk request is held, then the chunk 404: the F17 report replaces the halt text, swState() failed, no register, …" |
| 7 pwa-release | D-16: the update spec's redundant self-test regex matched B's setup `/sw.js` 200, so it did not prove C's fetch (test bug) | b11abd5 (7.10) | `e2e/pwa/update.spec.ts:509` "AD-17 the update spec activation poll fails at once when B turns redundant, with the request log" |
| 7 pwa-release | D-18: `withSite`'s `finally` let a cleanup error replace the body error (helper bug) | b11abd5 (7.10) | `e2e/pwa/update.spec.ts:598` "AD-17 the update spec withSite keeps the body error and attaches the cleanup error" |
| 7 pwa-release | D-22: the pwa `precacheComplete()` test checked "not halted" before the last poll's recomputes settled (test bug) | b11abd5 (7.10) | `e2e/pwa/test-hook.spec.ts:61` "AD-17 precacheComplete() polls to true once the worker is activated and every precache manifest URL is cached" (a 20 ms late rejection fails the moved check 8/8, 7.10 plan D-22) |
| 7 pwa-release | D-46: the "no worker request" timer started at `goto` and the hold at the hit, so a late hit plus a hold timeout reported the wrong reason (test bug) | b11abd5 (7.10) | `e2e/pwa/sw-failure.spec.ts:59` "Q-40 AD-15 a precached icon 404 during the first install: the install turns redundant, swState() failed and the fatal surface shows"; `e2e/pwa/dist-smoke.spec.ts:409` "Q-40 a precached icon 404 during the first install: the install turns redundant silently, then the page deals and validates with nothing shown" |
| 7 pwa-release | D-54: a `waitForPort` timeout left `vite preview` running (tooling) | b11abd5 (7.10) | gap, accepted 2026-11-07: `scripts/device-preview.test.mjs:366` "AD-17 run kills the preview and rethrows the same error when the port wait times out" asserts only that `kill()` is called on a fake IO, and the real failure recurred on the 2026-11-06 device read (`.autopilot/manual-7-11/device-read.md:13`; finding V1) |
| 7 pwa-release | D-70: `readState` treated only closed/destroyed handles as gone, so "Service worker restarted" failed the update spec (flake) | 38a52d5 (7.10) | `e2e/pwa/update.spec.ts:671` "AD-17 the update spec readState treats a restarted worker handle as gone" |
| 7 pwa-release | D-71: `doubleTap` derived the second tap's stamp from a pre-first-tap clock read, so a WSL2 clock step pushed it past Chromium's tap-count window (flake) | 14f0835 (7.14) | `e2e/helpers.spec.ts:1127` "AD-17 doubleTap stamps the second tap from the wall clock at its dispatch, so a 150 ms step only Node sees moves it 150 ms on the page" (injected step: 5/5 fail without the fix, 0/5 with) |
| 7 pwa-release | D-65: the success-signal drag test (`e2e/success-signal.spec.ts` "R-73 (UI) Success signal … the same move by drag …") fails intermittently | none: no fix shipped (7.13 e4c9ef0, plan only) | not a fix: "Never reproduces" (0 failures in 50 isolated, 3 counted and 200 loaded runs; two mechanisms refuted by injection); a recurrence opens a new fix ticket citing the 7.13 plan |
| 7 pwa-release | D-64: `e2e/nav.spec.ts:163` "§2 AD-13 a double tap on New game on the rejected root opens the notice at wc 1 and no Reset confirm" flake | none of its own; probably fixed by 14f0835 (7.14, shared `doubleTap`) | not closed: 7.14's self-test covers the shared mechanism; no D-64-specific reproduction (P1) |
| 7 pwa-release | Q-50: first Android back on a relaunch into Game over leaves the app (G5) | none: accepted as built, spec §9 Q-50 (1fbb31c) | gap, accepted 2026-11-07 (owner decision: device-read only, G5 2026-11-06; not a code fix) |

**Gaps needing Jared** (each is action item A1; all ten accepted as gaps by Jared on 2026-11-07, no new tests, epic Notes; their rows now read "gap, accepted 2026-11-07"):
1. **3 app-shell, a887379.** The CI-only history-notice double-tap fix has no test showing the failure mode, which needs CI's wider DejaVu Sans.
2. **4 board-and-gestures, 921c0c5 (4.13 D4).** The pre-emptive F33 pointercancel flake fix has no self-test showing the failure; the flake was predicted by review, never seen.
3. **6 game-surfaces-and-keyboard, 4cbaf45.** StatisticsPanel now uses the shared `historyUnreadable()` getter (SPEC F4), but nothing pins the single getter. No behaviour change.
4. **6 game-surfaces-and-keyboard, 4cbaf45.** The copied focus-☰ rule was unified, removing a silent `?.focus()`. This is a refactor, and nothing tests the old drift.
5. **6 (epic 1 config), 09285b2.** Playwright traces on the drvfs checkout stalled teardown. Only a manual diagnostic run (7.13 plan :97) reproduced it.
6. **9 themes, 5210279.** `THEMES` is tied to `ThemeId` only by a type check (`npm run check`, `src/shell/prefs.svelte.ts:67`), not by a titled test.
7. **9 themes, 7d45ee0.** The centring of wrapped Preferences labels: no test asserts text alignment.
8. **9 themes, fc3c20c.** The screenshot threshold of 0.05 is pinned by nothing.
9. **10 end-of-game-words, 767ed42.** The Svelte `binding_property_non_reactive` warning: restoring `bind:this` stays green.
10. **7 pwa-release, b11abd5 (D-54).** The test (`scripts/device-preview.test.mjs:366`) checks only that a fake `kill()` is called. The real leftover `vite preview` recurred on the 2026-11-06 device read (V1).

**Excluded workflow tooling.** These are fixes to `.claude/skills/` and `_bmad/` autopilot scripts, which are not product, test or CI code. They are listed so nothing is hidden, and are not counted above: e3fd9af (`limits.py` null `resetAt`), 7efec94 (driver stdin), fd69490, 9e3e8cc, 3b4683a. Jared can ask for them as rows.

**Excluded counts** (from the helpers):
- **In-ticket WIP code-review commits:** epic 1: 2 (081a3f9 aside); 2: 9; 3: 9; 4: 20; 5: 22; 6: 20; 8: 6 (+81c2c31); 9: 1; 10: 9; 11: 3; 7: 9.
- **Owner design changes:** 2: 1; 3: 1; 4: 1; 6: F12–F16; 8: 6 (+ the 8.6–8.11 rework); 9: 3; 10: 6.
- **Coverage-only additions:** 7.10's D-06, D-10, D-11, D-14, D-23, D-24, D-25, D-30, D-33, D-34, D-39, D-45, D-53, D-66; epic 6: 12; 2.12 and 3.12: the listed test-gap items; epic 10: 13 in c84a1df and 26 in 767ed42.

**Sources per epic.** Each helper recorded a source per row: the plan, review-log, retro or digest line, or the commit message. The main records are:
- epic 1: retro S3, R5, S8; the 1.10 plan.
- epic 2: retro D1–D5; the 2.12 plan; `review-loop/2-3-build.md`, `2-8-build.md`.
- epic 3: the 3.12 plan I-19, I-25; commit a887379.
- epic 4: retro F1; `epic-board-and-gestures/story-refactor-sweep-plan.md:191-212`.
- epic 5: retro F-7, F-10; `story-refactor-sweep-code-plan.md`; `review-loop/opus-review-epic-5-tail.md`; commit bb689e1.
- epic 6: retro F-3, F-9, F-13; `review-loop/opus-review-epic-6{a,b,b2,c}.md`; commits 1cfcbfd, 09285b2.
- epic 8: `review-loop/opus-review-epic-8.md` and its decisions; epic file :83-84.
- epic 9: `review-loop/opus-review-epic-9.md`, `-9b.md`; epic file :70-72; commit 7d45ee0.
- epic 10: `review-loop/opus-review-epic-10.md`; the 10.10 plan Appendix C; epic Notes :63-75.
- epic 11: the 11.6 sweep plan R5, R11.
- epic 7: the 7.10 plan D-rows; the 7.13 and 7.14 plans; the 7.11 plan § "§6.6 audit".

## Behavior verification

- **Exercised by the retro:** `npm run test:e2e:pwa` at HEAD `869890c`, 2026-11-07. It built `dist-test/` with hooks and ran `e2e/pwa/` against `vite preview`: **44 passed, exit 0** (`.autopilot/manual-7-11/retro/test-e2e-pwa.log`, git-ignored). That includes:
  - the offline reload proof (`e2e/pwa/offline.spec.ts:43`);
  - both update proofs (`e2e/pwa/update.spec.ts:428` "build B stays waiting on reloads and while pages open and close …" and `:456` "build B activates only once every page has closed …");
  - the failure paths (`sw-failure.spec.ts`);
  - `precacheComplete()` (`test-hook.spec.ts:61`).
  - Host load before the run: load average 1.97 on 16 cores (P6).
- **Earlier evidence relied on:** `test:all` and `test:screens` green at e2cd94f (digest § 7.11); every later commit is documents only (`git diff --name-only e2cd94f..HEAD`: `_bmad-output/`, `docs/`, `AGENTS.md`). Jared's device read of c048c93 on the phone and in desktop Chrome, 2026-11-06/07 (epic Notes) is the end-to-end run of the installed system: G1–G4, G6–G8, G10–G15 and G17 pass; G5 differs and was accepted as Q-50; G21 and G22 pass; G20 accepted as is.
- **Not exercised:** the production deploy, install and update (entry 12, post-merge).

## Previous-retro follow-through

The previous retrospective is `epic-place-preview/epic-place-preview-retrospective.md`, with Action items A1–A10 and a follow-through list of carried epic 10 items. **Jared declined every one of A1–A10 on 2026-10-29** (that retro :159, "declined every open question and action item"), and epic 7's SPEC kept them out of scope (`SPEC.md:99`). "Not landed" below is therefore the expected state, not a miss. Each line was checked at HEAD by a read-only helper, and the parent re-read :159.

- **A1 S2** (Dev) re-record the 11.6 plan verification at `c2f1fe7`: not landed, declined. No commit to that plan since 4130fb4.
- **A1 V3** (Dev) guard `read.events` and remove the listeners in a `finally` in `e2e/helpers/touch.ts`: not landed, declined. `touch.ts:165` is still unguarded, and :169-173 is outside any `finally`. 7.14 (14f0835) changed only the tap stamps.
- **A1 V4** (Dev) give `doubleTap` a timeout: not landed, declined. The poll at `touch.ts:144-149` passes no `timeout`.
- **A1 V5** (Dev) drop the self-compare at `e2e/fly-to-cell.spec.ts:370`: not landed, declined. The line is unchanged.
- **A2** (Dev) used-look coverage for paper and plum: not landed, declined. `e2e/theme-art.spec.ts` has no commit since 4130fb4.
- **A3** (Dev) fail fast in scene authoring: not landed, declined. `src/ui/scenes/script.ts` and `Scene.svelte` are unchanged.
- **A4** (Owner) carried epic 10 B3, B4, B6, B7: not landed, declined.
  - B3: `src/ui/celebration/celebration.svelte.test.ts:828` still uses `vx: 0`.
  - B4: `celebration.svelte.ts:119` still returns early on an empty run.
  - B6: no `.ts`-path pitfall in AGENTS.md.
  - B7: no resize-during-glide test.
- **A5** (Owner) DESIGN.md:311 `★` wording: not landed, declined. DESIGN.md has no commit since 4130fb4.
- **A6** (Dev, deferred) fold the e2e preview helpers: not landed. Its trigger, a change to `e2e/place*.spec.ts`, never came.
- **A7** (Owner) `nav.spec.ts:163` fix ticket or backlog entry: partly.
  - 7.10 numbered it D-64 and drafted a backlog entry (`story-refactor-sweep-plan.md:202`). No entry exists in any `tickets.toml`, the initiative file or `docs/`.
  - The 7.11 review noted that its D-64 rule "points at a backlog entry that does not exist" (`story-close-out-documents-audits-and-device-read.review-log.md:80`).
  - 7.14 probably fixed its cause (P1).
- **A8** (Owner) ticket review pass cap: not landed, declined. `.claude/skills/epic-autopilot/SKILL.md:272`, `:320` still cap at 7 (last changed ca8e7f3, 2026-10-25). Epic 7 again ran four 7-pass ticket reviews (P2).
- **A9** (Owner) size-budget margin decision: no evidence found of a decision. The margin is only recorded: 39,296 bytes at 7.11 (560,704 / 600,000), and `scripts/size-budget.mjs:16` is still `600_000`.
- **A10** (Dev) autopilot re-records the plan or stops when `open_major` is set: not landed, declined. `SKILL.md:328-331` is unchanged. Epic 7 repeated the pattern: 7.13's code review "converged" with an open major (V3).
- **Carried B8** (Owner) a flake in a second ticket gets its own fix ticket: landed for the new flakes. D-65 became 7.13 and D-71 became 7.14 (5d71918). D-64: see A7.
- **Carried B9** (Owner) live-tunable device preview: no evidence found. Epic 7 had no motion-tuning work.

## Action items

All items are proposed, not applied. The retro edited no tree file.

Kinds: **remediation** (code or test work for the normal dev loop), **spec/doc reconciliation** (awaiting human application), **decision** (Jared's alone).

**For Jared before the merge**

- **A1 (Owner, decision): the 10 "gap, needs Jared" rows** of the cross-epic table. `release-checklist.md` §6.6 allows a fix with no reproduction test only as "a gap Jared accepted in the epic Notes". For each row, either accept it in the epic Notes or ask for a test. Recommended defaults, all technical:
  - **Accept as gaps.** Rows 1, 2, 5 and 8 are environment- or config-only failures that a test cannot reproduce on the dev box. Rows 3, 4 and 7 are refactors or looks that change no behaviour.
  - **Ask for a cheap test.** Row 6: a unit test that `THEMES` keys equal the registered `ThemeId`s. Row 9: a unit test that mounts `Celebration.svelte` with a console spy and asserts no `binding_property_non_reactive` warning.
  - **Row 10 is remediation (A3).**
- **A2 (Owner, decision): the verdict override.** The machine verdict is **rejected**, forced only by post-merge 7.12. Decide on an override, e.g. accepted-with-open-items with 7.12 tracked as the release step, before merging `pwa-release`.
- **A3 (Dev, remediation, small; tooling only, nothing ships to players): device-preview robustness** (V1, R1, R4, D1).
  - After `kill()`, wait for the child's `exit`, and escalate to SIGKILL after a bound.
  - Make the cold-start port wait longer, or a flag (cold `vite preview` on `/mnt/d` took about 9–15 s against the 15 s wait).
  - Also run `stop()` on SIGHUP.
  - Use `size-budget.mjs`'s `realpathSync` + `fileURLToPath` run-as-script idiom.
  - Tests: a real child that ignores SIGTERM is gone after the timeout path, plus a SIGHUP case.
  - This also turns row 10 into a reproduced fix. It can land before the merge as a fix ticket, or after it under F11.
- **A4 (Owner, decision): D-64** (P1). Recommended: close it as "probable cause fixed by 7.14 (D-71)", and record in the initiative Notes that any new failure of `e2e/nav.spec.ts:163` opens a fix ticket citing the 7.14 plan and the failure's event log. The alternative is to file the backlog entry 7.10 drafted (`story-refactor-sweep-plan.md:202`).

**Process (methodology and skills, owner-approved changes)**

- **A5 (Owner, doc reconciliation): a flake-close protocol** in `docs/development-methodology.md` (P2, P3).
  - It covers the reproduction counts, proof halves (injected failure without and with the fix), the void rule and "never reproduces" closure with evidence.
  - It also covers final-`test:all` routing of an unrelated flake (one rerun, then a fix ticket), the "never loosen an assertion" list, and cause classification by layer (test, helper, `src/`; a `src/` cause stops for the owner).
  - Flake tickets cite it instead of carrying it alone. This answers the two capped review loops (7.10, 7.13).
  - Optionally, revisit epic 11's A8: a lower pass cap for sweep and flake tickets once the protocol exists.
- **A6 (Owner, doc reconciliation): a close-out wording default** (P9).
  - The close-out ticket template and methodology § Autopilot authorise the close-out to apply, as technical defaults, wording-only alignments with a decision already recorded (a §9 answer, an epic-Notes owner decision, the as-built code). Each gets its own commit and checklist line.
  - Owner stop items are kept for text that changes behaviour, reopens a decision or adds an owner choice.
  - That would have saved 7.11's B3 and B4 resumes.
- **A7 (Dev/orchestrator, doc reconciliation): sync tickets.toml to the ticket files** (P4). Through the ticketing skill, sync entries 13–15 (`description`, `verify`, `references`) and entry 14's `after` = [10, 13]. Proposed autopilot rule: when a ticket review converges, the orchestrator syncs that ticket's tickets.toml entry in the same commit.
- **A8 (Dev, doc reconciliation): `docs/device-testing.md`** (P7).
  - Add the step "confirm the seeded state in the Chrome tab before closing it and launching the app".
  - Add a recovery line for a leftover preview: find the listener with `ss -ltnp 'sport = :4173'` (not `pgrep -f`, which matches its own shell), then kill that PID.
  - (a) is already applied (428960f), and (c) is already at :47.
- **A9 (Owner/Dev, doc reconciliation): a pre-run environment check** (P5, P6). Add a line under AGENTS.md "Running and verifying", through `bmad-project-context`, or in the methodology: before a gating or counted suite run, check host load (`uptime`; close heavy Windows apps) and that `/` is read-write (`mount | grep ' / '`). Read mass 5 s timeouts or `EROFS` as environment, not test results.

**For entry 12 and later**

- **A10 (Owner, entry 12): the Q-50 waiver** in the initiative Notes for initiative Done when 3 (S6; 7.11 owner-wait note).
- **A11 (Owner, optional): Owner stop item 14** (S2). The desktop-Chrome back/forward check is unobserved and needs no code change.
- **A12 (Dev, deferred, remediation): test-robustness batch** for the next ticket that touches these files.
  - `e2e/pwa/update.spec.ts`: the `READ_MS` lower bound, `activationOutcome` treating `undefined` as unreadable, and `readState`'s fallback bound (V2).
  - `doubleTap`: stamp per event (V4).
  - The 7.15 R-87 test: assert the union of the sampled group indices (V5).
  - A lockfile check that `workbox-window` equals the resolved `workbox-build` version (R2).
  - A split of `e2e/helpers.spec.ts` per helper module, with the AGENTS.md file-convention line changed to match (D2).

**Not raised again:** epic 11 retro A1–A10, which Jared declined on 2026-10-29 (follow-through above), and the 7.13 V3 and 7.15 V5 plan-wording leftovers in done plans (accepted).

## Acceptance verdict

**Machine verdict: rejected** (criteria declared: epic file § Done when 1–5). **Overridden by Jared, 2026-11-07: accepted-with-open-items** (Human decision below; epic Notes).

The rubric forces **rejected** because `pending_tickets` is non-empty: **7.12** (CAP-10, the owner's post-merge v1 release) is `planned`. That is by design. SPEC F12, `release-checklist.md` step 6 and the epic Notes (Decision 2026-10-29, user direction) put this retrospective before the merge and 7.12 after it. So Done when 5 cannot be met at retro time. The rejection is not about a defect, and no blocking finding stands.

Per criterion:
1. **Done when 1** (offline on `dist-test/` and `dist/`; every rule-coverage row passing or an accepted D gap; the epic 3 P7 rows for Q-40/Q-42 closed): **met**.
   - `e2e/pwa/offline.spec.ts:43` passed at HEAD in this retro's `test:e2e:pwa` run (44/44); the `dist-smoke` project passed at e2cd94f (digest § 7.11).
   - The 7.11 §6.4 audit: 101 ids, 98 covered, 2 exempt, and 1 accepted gap (Q-50, owner 2026-11-07). The only D row is A-A11 (G5 → Q-50).
   - The epic 3 rows were closed in 5d40612 and 6652256.
2. **Done when 2** (B waits while any page is open and takes over only after all close, no prompt; the three failure paths): **met**.
   - `e2e/pwa/update.spec.ts:428`, `:456` and `e2e/pwa/sw-failure.spec.ts` passed at HEAD.
   - The hook-free `dist-smoke` failure cases passed at e2cd94f.
   - G3 passed on the phone (epic Notes).
3. **Done when 3** (`test:all` and `test:screens` green; `workbox-window` and `sw.ts` out of the counted set, at or under 600,000 bytes with the margin recorded; no Session or history change): **met**.
   - Both suites were green at e2cd94f; only documents changed since.
   - The size budget is 560,704 / 600,000, a margin of 39,296 bytes (7.11 plan :403; 7.8 `e2e/pwa/build-output.spec.ts` packaging checks).
   - `src/engine/` and `fixtures/` are unchanged over `87ab949..HEAD`, so no version bump.
4. **Done when 4** (spine, EXPERIENCE.md and AGENTS.md match the build; every Device and Desktop row run and recorded with its footer, failures fixed or answered): **met with accepted deviations.**
   - The docs were synced in 7.11, including Owner stop items 1–13.
   - The rows were read 2026-11-06/07 on footer `0.0.0 (c048c93)`.
   - G5 was answered as Q-50 (S1). G20 was accepted as is (S3). G18 and G19 are optional and were not reinstated (S4).
5. **Done when 5** (production install, 1.0.0, ten games, every `release-checklist.md` row with evidence, v1 declared): **not met: entry 12, post-merge by design.**

**Open items that would remain under an override** (none blocking): the bug-fix table gaps that need Jared, D-64's disposition (P1), and the deferred findings D1–D3, R1–R4 and V2–V5.

**Human decision (Jared, 2026-11-07): accepted-with-open-items.** 7.12 is tracked as the post-merge release step. A1: all ten rows needing him are accepted as gaps, with no new tests. A3, A4 (close D-64), A5–A9 applied as recommended; A10 at entry 12; A11 and A12 deferred (epic Notes).

## Open questions

- **Override.** Does Jared override the machine **rejected** (forced by post-merge 7.12) before the merge, e.g. to accepted-with-open-items?
- **Bug-fix gaps.** Does Jared accept each "gap, needs Jared" row in the cross-epic table, or want a reproduction test or fix ticket for some?
- **D-64.** Close it as "probably fixed by 7.14 (D-71), recurrence opens a fix ticket", or file the backlog entry 7.10 drafted (P1)?
- **Owner stop item 14.** Run the optional desktop-Chrome back/forward check (S2), or leave it unread?
- **Methodology.** Adopt the flake-close protocol (P2, P3) and the close-out wording-default rule (P9)? Lower the review pass cap for sweep and flake tickets (epic 11 A8, declined then, recurred here)?
- **Q-50 waiver.** At entry 12, the initiative Done when 3 needs the Q-50 waiver in the initiative Notes (S6). This is information for entry 12, not a question now.

## Assumptions

- **Epic resolution.** `-H pwa-release` was taken as the epic folder named in the invocation, `_bmad-output/initiative-wordcell-v1/epic-pwa-release/` (slug `epic-pwa-release`, id 7). `tickets.py status <folder>` ran; it did not fail.
- **Unfinished ticket.** `pending_tickets` = [7.12]. The retro proceeded headless, with no confirmation invented, and recorded 7.12 as post-merge by design (SPEC F12, `release-checklist.md` step 6, epic Notes 2026-10-29).
- **Machine verdict.** **rejected**, forced by 7.12 and rendered with no human decision. Recorded as *not accepted* until Jared decides.
- **Earlier attempt.** An earlier run of this retrospective was cut off by a usage limit (`.autopilot/manual-7-11/retro-partial-1.md`, an empty outline). This run started fresh. Its findings, notably a887379 and three epic 8–9 fixes without tests, were re-derived independently, not copied.
- **Bug-fix scope rule (the retro's own).** The table lists defects corrected **after** the defective code landed as built work: fix tickets, `fix(...)` commits outside a ticket's own build, refactor-sweep fixes of earlier tickets' defects, whole-epic (Opus) review fixes, retrospective-driven fixes, owner-read fixes, CI-only fixes and flake fixes. Excluded and only counted:
  - in-ticket WIP code-review-pass fixes made before that ticket was built (their tests ship with the ticket);
  - pure owner design changes that fixed no defect;
  - test-coverage additions that fixed no defect (e.g. most of 7.10's 25 "fixed" D-rows, which add missing tests: D-06, D-10, D-11, D-14, D-23, D-24, D-25, D-30, D-33, D-34, D-39, D-45, D-53, D-66);
  - 7.15's naming and assertion gaps (not bugs).
  - A different scope (e.g. every WIP review fix) would give a much longer table; Jared can ask for it.
- **"Reproduction test" reading.** A test at HEAD, grep-verified by title, whose assertion fails on the defect. A test that touches the area but would not catch the defect is a gap ("nearest: …"). A flake fix counts as reproduced only when a self-test demonstrates the failure mode.
- **Accepted-gap list.** Marked "gap, accepted 2026-11-07" only for the fixes Jared named (081a3f9, the 4.13 banner flake, F-7 543575c, 9f90cce, 169c6bc, 7352e29, c84a1df), and only for the rows of those that really have no reproduction test. Every other gap is "gap, needs Jared".
- **Helpers.** The table rows for epics 1–6 and 8–11, the diff review and the follow-through were derived by read-only helper subagents. The parent spot-checked their key claims against the source (titles by `grep -n`, commits by `git show`). Rows the parent did not re-open are marked by the helpers' own grep-verified titles.
- **Diff-review narrowing.** The `bmad-review` skill was not invoked. Its three code lenses (adversarial, edge-case, verification-gap) ran in one read-only helper over the **production** diff only (the 10 non-test files). The epic's test and helper changes (`e2e/**`, `*.test.*`) were not re-reviewed: each had its own code review loop (`review-loop/7-*-build.md`), and their leftovers are V2–V5.
- **Proposed items.** Every action item below is proposed, not applied, with the owner named. Technical items take the recommended default (Jared's run rule); none changes gameplay or UX.
- **Behaviour check.** It ran `npm run test:e2e:pwa` only, not the full `test:all` or `test:screens` (documents-only delta since e2cd94f). The device read of 2026-11-06/07 stands as the end-to-end run of the installed app.
