---
epic: epic-rules-engine
date: 2026-09-30
verdict: accepted-with-open-items
criteria: declared
headless: true
---

# Epic 2 retrospective: rules engine

## Epic summary

- **Epic:** `epic-rules-engine` (epic 2), branch `epic-2-engine`. Inception commit 906264e; retro read up to e86da23.
- **Tickets:** 2.1 to 2.13, all `done` according to `tickets.py status`. None is still at `built`, and `pending_tickets` is empty.
- **Ticket 2.13 was added during the epic** by owner decision D-STATS (Q-44, 2026-09-30). The commits are 768cf67, b21d89b, fad187e and 39856a9.
- **Ranges.** Each range runs from the ticket's plan `baseline_revision` to the next ticket's baseline. The baselines are in ancestor order (checked with `git merge-base --is-ancestor`). The last range ends at HEAD and is inferred. `git_evidence.py` was run once per range.

  | Ticket | Range | Commits |
  |---|---|---|
  | 2.1 | 82d8553..6f8101f | 9 |
  | 2.2 | 6f8101f..0e58096 | 12 |
  | 2.3 | 0e58096..eaf7f73 | 11 |
  | 2.4 | eaf7f73..19f8d8d | 10 |
  | 2.5 | 19f8d8d..e94b7ae | 10 |
  | 2.6 | e94b7ae..0d3c9de | 8 |
  | 2.7 | 0d3c9de..db8edab | 11 |
  | 2.8 | db8edab..6f03e95 | 9 |
  | 2.9 | 6f03e95..b2f734d | 9 |
  | 2.10 | b2f734d..23f2111 | 8 |
  | 2.11 | 23f2111..3a26472 | 10 |
  | 2.12 | 3a26472..1f6b83d | 9 |
  | 2.13 | 1f6b83d..HEAD | 3 (inferred) |

  The whole epic, 906264e..HEAD, has 125 commits. Under `src/` and `fixtures/` it changes 100 files, +8371/−87.
- **Evidence available:**
  - The epic file and its Done when.
  - The spec folder `spec-epic-2-rules-engine`: SPEC.md, rule-coverage.md, build-notes.md, and the Spine notes in build-notes.md.
  - 13 story files and 13 plans.
  - 13 ticket review logs, each with its `.passes/` folder.
  - 13 code review logs, `review-loop/2-1-build.md` to `2-13-build.md`.
  - Two autopilot digests: `epic-rules-engine-20260928-2138.md` and `-20260930-0738.md`.
  - The previous retro, `epic-scaffold-ci-deploy-retrospective.md`.
- **Evidence missing:** the headless step logs for tickets 2.1 to 2.12. The folder `/tmp/wordcell-autopilot/20260928-2138` no longer exists. Only 2.13's logs survive, in `/tmp/wordcell-autopilot/20260930-0738/`. Process lessons for 2.1–2.12 therefore come from the review logs, plans and digest alone.

## Findings

Each finding is marked **fix now**, **defer** or **accept**. Findings from subagents were re-checked against the source before routing.

### Spec to implementation reconciliation

- **S1. All five Done when items are met in the repo.** Item 5's live check is still pending.
  - **Item 1:** `test:all` exits 0. The unit suite runs 1394 tests in 22 files in 2.66 s, within AD-17's 5 s budget. All 43 rule groups of §2–§6 (§2 plus 42 R-ids) are in `rule-coverage.md`, and each has passing tests whose names carry the id. The four `(UI)` rules (R-14, R-65, R-73, R-82) map to Playwright in later epics, as intended.
  - **Item 2:** the golden literals have the same sha256 at HEAD and at 0386bbe (`src/engine/deal.test.ts:7`).
  - **Item 3:** tested at `serialize.test.ts:1431`. The script covers a single move (`TAN_SCRIPT`, `:962`). The behaviour check below covered two moves.
  - **Item 4:** the table is `commands.test.ts:291`, the first `describe` at `:926`, preceded by imports and helpers. The exports are pinned at `index.test.ts:43`.
  - **Item 5:** `e2e/smoke.spec.ts:3` passes on android and desktop. The live check waits for the merge to main.
  - **Disposition:** accept.
- **S2. Two sentences are approved for a `(UI)` tag and are still untagged:** R-50 "The UI shows which card lands on the bottom…" and R-83 "Longest word shows "—"…". `rule-coverage.md:11,63,89` already flags both for P4–6.
  - **Disposition:** fix now, in close-out Task 3a (owner-approved 2026-09-30).
- **S3. R-38's "throws while structural fails" has tests, but they are named `R-36 validate … → throw`.** No test name carries R-38 for this sentence (`rule-coverage.md:60`; the `commands.test.ts` validate rows).
  - **Disposition:** defer: rename, or add an R-38-named case, in the first epic 3 engine-touching ticket.
  - **Lesson:** a coverage check should grep for each sentence's own id.
- **S4. The spine lags the as-built code in several places:**
  - AD-17 says fixtures are valid Sessions and histories, but 62 of the 72 are rejecting `session-invalid-*`/`history-invalid-*` files (spine :640).
  - AD-7 says "integer" where the code requires a safe integer (`replay.ts:66`, `serialize.ts:325-330`).
  - AD-2's `accrue` text omits unsafe integers and `r76-active-ms-overflow` (`commands.ts:521-533`).
  - AD-6 does not carry Q-44.
  - Scaffold deltas :868-870 still describe the `types.ts` → LangData and `STUCK_PENALTY` change as future work.
  - `parseHistory`'s ok-payload `{ ok: true, history }` (`serialize.ts:21`) is not in the spine.

  **Disposition:** fix now in Task 3a (the approved Spine notes plus the D-STATS authorisation).
- **S5. Epic 1 A1 has landed** (e962c4b; see Previous-retro follow-through). The CI `concurrency` groups (`ci.yml:11-13`, `deploy.yml:18-20`) are in AD-18 in words, not by the key name: "a newer run on the same ref cancels the older" and "runs serialised, none cancelled". A first keyword grep missed them; this was corrected during close-out.
  - **Disposition:** accept.
- **S6. The epic file's `after` was changed** from `[epic-scaffold-ci-deploy]` (906264e) to `[]` (72b4163). The reason: an epic container gets no `done` status, so the old value gated every ticket (digest 2138:8). The cross-epic need stays on the initiative entry (`initiative tickets.toml:15`) and on entry 2.1.
  - **Disposition:** accept for epic 2.
  - **Lesson:** mark each finished epic container done after its retro (Task 3d), and have the autopilot stop instead of editing `after` (Skill note 4).

### Diff-scope review (bmad-review: adversarial, edge-case, verification-gap)

Scope: `906264e..HEAD` over `src/` and `fixtures/`, weighted to the seams between tickets. Checks run:
- 74 single-point mutants, all behaviour-changing ones caught.
- Two cross-ticket fuzz walks (about 300 seeds × 200–400 steps, AD-4 accrue order) found no failures.
- All nine valid session fixtures rebuilt exactly from `apply`.

No correctness bug was found at any seam between tickets.

- **D1 (medium). A command with an explicit `index: undefined` is rejected.** `apply({type:'addFreeLetter', cell, index: undefined})` throws `command-domain` instead of appending (`commands.ts:248-249`: `Object.hasOwn` sees the key). It compiles, because `exactOptionalPropertyTypes` is off. An epic 4 tray handler that passes an optional index straight through would crash to the AD-15 surface on an ordinary tap. The command table has no row for this.
  - **Disposition:** fix now, as a small engine ticket before the tray UI (epic 3's first engine-touching ticket): treat `undefined` like an absent key, and add the table row.
- **D2 (low). A stored Session can pass parsing, then fail on the first `accrue`.** `parseSession` accepts `activeMs` up to `MAX_SAFE_INTEGER` (`replay.ts:66-70`). The first `accrue` then throws `r76-active-ms-overflow` (`commands.ts:527-532`), so the Session halts the app instead of taking the replay-failed path. This needs a tampered value near 2^53 ms.
  - **Disposition:** defer to epic 3 (store and storage). There, decide whether the store treats it as corrupt storage, or AD-7's domain leaves headroom.
- **D3 (low). Two finishes of the same seed can match each other.** Games on the same seed with the same outcome and `activeMs` match (`history.ts:55`). This happens after R-74 Replay, e.g. two give-ups at 0 ms. When the second finish went unrecorded, undoing it removes the first game's record.
  - **Disposition:** accept. Q-43 is the owner's matching rule and deliberately excludes score, and AGENTS.md Policy forbids reopening it. Recorded so later retros do not re-flag it.
- **D4 (low). `checkRecord` accepts impossible records:**
  - a `won` record with a negative `finalScore` (the engine never produces one, R-80);
  - `longestWord.letterCount` below 3, or not matching the spelling (`serialize.ts:318-330`; the comment at :302-303 says this is deliberate).

  A corrupt history can then show a negative best score. **Disposition:** defer to epic 3, next to the History-unreadable flow.
- **D5 (low). `statistics` hands out the record's own `longestWord` object** (`history.ts:116-117`), and parsed histories are not frozen. A consumer that mutates it would change the stored history.
  - **Disposition:** defer. The first consumer is epic 3 or 6: copy or freeze it then, or add an AGENTS.md pitfall.
- **D6 (low). `deal(seed)` does not check the seed range** (`deal.ts:51`).
  - **Disposition:** accept. `deal` is the D1 transitional export, which epic 3 removes.
- **D7 (low). `apply(null)` throws a raw `TypeError`** (`commands.ts:469`).
  - **Disposition:** accept. Commands are typed, and a null command is a bug that AD-15 surfaces either way.
- **D8 (low, latent). The redo-tail replay's `placed(draft)` cast relies on `s2-last-only` running first** (`replay.ts:173`). This is not reachable today.
  - **Disposition:** accept. It is covered by the stage-order tests.
- **D9 (low, test gap). No test accrues time between a finish and its un-finish** (`history.test.ts:312-327`), although the store's AD-4 order does. The behaviour is correct (probe).
  - **Disposition:** defer to epic 3's store tests.
- **D10 (low, test gap). The nine valid session fixtures came from a throwaway script,** and no test regenerates them from `apply`. `history-three-records.json` does have such a test (`serialize.test.ts:1046-1051`).
  - **Disposition:** defer: add a regeneration test in epic 3 before the restore specs rely on the fixtures.
- **D11 (info). One store dispatch replays the game about five times** (accrue, apply, two `gameRecord` calls, view).
  - **Disposition:** defer: measure on a low-end Android device in epic 3 or 7 before optimising.

### Aggregate views

- **A1. The architecture holds.**
  - There are no import cycles, including type-only edges (scratch `cycles.py`).
  - Engine sources import only relative engine paths.
  - `architecture.test.ts` is unchanged and still scans all of `src/`.
  - The D2 seam (`Start`, `checkStart`, `replayFrom`, `replayWords`, `dealtStart`, `applyFrom`, `viewFrom`) is not exported from `index.ts`, and neither is `EngineError`.
  - **Disposition:** accept.
- **A2 (medium). The type surface of `index.ts` is not locked.** `index.test.ts:42` pins the runtime keys exactly, but the type check at `:64-92` only confirms that listed types exist. So `export type { Start }` would pass.
  - **Disposition:** defer. Add a type-level exactness check when epic 3 removes the D1 export.
- **A3 (medium). The same logic is written more than once:**
  - `expectEngineError` exists in 6 identical copies. `test-helpers.ts` cannot import `vitest` under `architecture.test.ts:245-257`.
  - The Session and Move field lists appear three times (`serialize.ts:65-78`, `replay.ts:30-43`, `serialize.ts:30-43`).
  - There are two field-set checkers (`replay.ts:59`, `serialize.ts:266`).
  - The uint32 and safe-integer domain checks are repeated across `session.ts`, `serialize.ts`, `replay.ts` and `commands.ts`.
  - The letter-count sum is repeated (`scoring.ts:11`, `rules.ts:186`).

  **Disposition:** defer to a cleanup when epic 3 next touches parse. Record the `expectEngineError` constraint as an AGENTS.md pitfall.
- **A4 (medium). Error codes follow three naming styles** (`schema.*`/`history.*`, rule-prefixed, unprefixed). The same check has different codes in the two parsers (`ad7-active-ms` and `history.active-ms`). All 41 codes are listed in `errors.ts:4-34`.
  - **Disposition:** accept. The codes are asserted by tests, and renaming them now is churn.
  - **Lesson:** an AGENTS.md pitfall: new codes go into `errors.ts`, and tests assert the code.
- **A5 (medium). Some files and functions are large:**
  - `viewFrom` is 114 lines (`view.ts:157-270`) and `checkSession` 72 lines (`replay.ts:63-134`).
  - `commands.ts` has 534 lines and was touched by five tickets. It also holds view predicates.
  - `serialize.ts` has 353 lines and splits history validation with `history.ts`.

  **Disposition:** accept for now; watch in epic 3.
- **A6 (low). Code comments cite more than rule ids.** There are 41 `CAP-n`/build-notes citations, and "entry 10" at `replay.ts:147` and `rules.ts:286`.
  - **Disposition:** defer: replace the "entry N" citations the next time those files are touched.
- **A7. AGENTS.md has stale text:**
  - line 80: both Known-pitfalls sentences (the STUCK_PENALTY_PER_CARD scaffold, and "deal.test.ts tests are not id-named"), recorded as S37 in `story-refactor-sweep-plan.md:136`;
  - line 64: "(until epic 2 creates it…)".

  **Disposition:** fix now in Task 3b.

### Process (review logs, plans, digest)

- **P1. Ticket reviews found many majors in pass 1** (110 across 13 tickets; 55 passes in total). The majors recur in a few areas:
  - public surface left unstated (index exports and signatures): 8 tickets;
  - rule sentences without an id-named test: 6 tickets;
  - rule ownership moving between tickets (R-60, SESSION_VERSION/HISTORY_VERSION, R-39);
  - test inputs that could not be built as written.

  Several later-pass majors came from the previous pass's own fix (2.4 log:38, 2.5 log:66, 2.8 log:58, 2.12 log:46). **Lesson:** at inception, write each entry's exports and signature delta, its sentence → test ids, and rule ownership into `tickets.toml`, so the review loop starts from a sharper ticket.
- **P2. The code review loops found 14 majors in 21 passes.** Every one was a test that could not fail or a mutant that survived; none was a production defect. Four loops converged with an open major (2.3, 2.4, 2.6, 2.11), and 2.12 closed all four.
  - **Disposition:** accept. The loop worked.
  - **Lesson:** state in the skill how a converged-with-open-major result is reported (Skill note 6, Task 3c).
- **P3. The six unapplied minors in `review-loop/2-12-build.md:24-29` are all still open:**
  - `commands.test.ts:1205-1208`: an R-42 literal-order case;
  - `view.test.ts:787-790`: assert `draftOf(s).reached`;
  - `view.test.ts:799-802` and `:820-823`: guards against the degenerate n = 1 case;
  - `view.test.ts:29-30`: a duplicated local `DICT`;
  - `story-refactor-sweep-plan.md:57`: the Code Map row;
  - `story-refactor-sweep-plan.md:106,140,142`: the S6 name and the 1376 count.

  **Disposition:** defer the four test minors to epic 3's first engine-touching ticket. Accept the two plan-text minors: plans are historical records and are not rewritten.
- **P4. Autopilot and skill notes** (digest 2138:83-90):
  - Session limits were caught; the weekly limit was missed (note 1).
  - Resume worked (note 2).
  - Step A hard-codes `delta-checks.md` (note 3).
  - The container `after` gated every ticket (note 4).
  - The depth rule worked (note 5).
  - The converged-with-open-major wording is missing (note 6).
  - No loop diverged (note 7).
  - New in this run: the digest created at Setup must be committed at once, or Step B's clean-tree check fails. This run committed it as 3f15022.

  **Disposition:** fix now in Task 3c (notes 1, 3, 4 and 6, plus the start commit). `bmad-preview-ticketing` needs no skill change: closing a container is its existing board verb, and Task 3d runs it.
- **P5. Step logs do not survive.** They live under `/tmp`, and the 2.1–2.12 logs are gone, which narrowed this retro.
  - **Disposition:** defer.
  - **Lesson (proposal):** keep `W` under a git-ignored folder in the repo, so the tree stays clean and the logs outlive `/tmp`.

## Behavior verification

A scratch script (`behavior.ts`, run with `tsx` against the real `generated/dictionary/en.txt`) drove the public engine through two moves on seed 1 (WINE, then MOMI on cell 4). It then ran 6 undos to `{0, idle}` and a 7th undo that threw `r70-nothing-to-undo`, then 6 redos back to an equal Session and view.

- Serialise → parse gave an equal Session and view after every step.
- With `accrue(12345)` and then give up: `finalScore` −418 (32 − 450), band 0, and `canUndo` true. After the give-up, `accrue` returned the same reference and a drop threw `command-status`.
- `gameRecord` and `reconcileHistory` appended the record, `isRecorded` was true, and an un-finish removed the record again.
- Statistics over two negative given-up records gave counts and longest word, with best and average absent (Q-44).
- History round-tripped. Version 2 gave `version-unknown`, and `{` gave `version-unreadable`.

Nothing surprising came up. The UI was not exercised beyond the e2e smoke spec: the engine has no UI in this epic. The live deploy check is Task 4.

## Previous-retro follow-through

From `epic-scaffold-ci-deploy-retrospective.md:281-297`:

| Item | Owner | Landed? |
|---|---|---|
| A1 spine and SPEC reconciled to the as-built | Architect; owner approves | Yes: e962c4b (spine +76/−43, epic 1 SPEC and build-notes), then 1d33960 and 4fa949e. The CI concurrency is in AD-18 (S5). |
| A2 `test:all` covers what CI gates | Dev | Yes: 1d33960, `package.json:30` |
| A3 packaging tests against `dist/`; precache dedupe | Dev | Yes: 1d33960 (`e2e/helpers/dist-test.ts`, `e2e/pwa/precache.spec.ts`) |
| A4 `_headers`/`.assetsignore` test; immutable check extended | Dev | Yes: 4fa949e (`scripts/deploy-config.test.mjs`, `deploy-check.mjs`) |
| A5 exact Playwright pin plus lockfile test | Dev | Yes: 1d33960 (`package.json:34`, `scripts/playwright-pin.test.mjs`) |
| A6 actionlint in CI; bash moved into tested scripts | Dev | Yes: 4fa949e (`ci.yml:29-30`) |
| A7 follow-up reviews and errata | Dev | Yes: 6990f6b (errata), 1d33960 (gzip level 9, regex) |
| A8 shared Playwright config base | Dev, epics 3 and 7 | No evidence found. Deferred to epic 3 by the owner (2026-09-30). |
| A9 hash checks for woff2 and icons | Dev | Yes: 1d33960 (`scripts/asset-hashes.test.mjs`) |
| A10 review-loop skill changes | Owner; Dev | Yes: 5e59b0d, e6e1f9e |
| A11 epic-autopilot skill changes | Owner; Dev | Yes: 5e59b0d, e6e1f9e. The regex (a) missed the weekly limit (P4). |

## Action items

| # | Action | Kind | Owner | From |
|---|---|---|---|---|
| B1 | Add the (UI) tags to R-50 and R-83 in `docs/game-flow-spec.md` and update `rule-coverage.md` through bmad-spec. Also update §9's heading "Q-01 … Q-43" to include Q-44. | Spec reconciliation (owner-approved) | Close-out Task 3a | S2 |
| B2 | Spine: AD-17 fixtures also hold the rejecting files; AD-7 and AD-2 safe-integer domain, and the `accrue` overflow; AD-6 Q-44; mark the Scaffold-deltas LangData/penalty item done; `parseHistory` ok-payload. Epic 1 A1 needs nothing more (S5). | Spec reconciliation (owner-approved) | bmad-architecture / bmad-spec, Task 3a | S4, S5 |
| B3 | AGENTS.md: drop the two stale line-80 sentences and the stale line-64 parenthetical. Add pitfalls: EngineError codes live in `errors.ts` and tests assert codes; the D2 seam is never exported from `index.ts`; `fixtures/` holds rejecting `*-invalid-*` files; `expectEngineError` stays per test file because `test-helpers.ts` is an engine source; `parseHistory` returns `.history` (the `history` naming pitfall). | Docs | bmad-project-context, Task 3b | A7, A3, A4 |
| B4 | Apply Skill notes 1, 3, 4 and 6 to epic-autopilot and review-loop, plus committing the digest at Setup. No change to bmad-preview-ticketing. | Process change (owner-approved) | Task 3c | P4 |
| B5 | Mark `epic-scaffold-ci-deploy` and `epic-rules-engine` done with bmad-preview-ticketing. | Board | Task 3d | S6 |
| B6 | Engine fix: `addFreeLetter` treats `index: undefined` as absent, with a command-table row. | Remediation | Dev, epic 3's first engine-touching ticket | D1 |
| B7 | Test gaps: an R-38-named structural-throw case; the four open 2.12 test minors; accrue between a finish and its un-finish; a fixture regeneration test for the valid session fixtures; a type-level exactness check on `index.ts` exports. | Remediation | Dev, epic 3 (with the D1 removal) | S3, P3, D9, D10, A2 |
| B8 | Storage hardening decisions for epic 3: parse-accepted `activeMs` near 2^53 vs `accrue` overflow; `checkRecord` domain (a negative `won` score, `letterCount` < 3 or mismatched); `statistics` returning a shared `longestWord` object. | Remediation (technical defaults) | Epic 3 spec (bmad-spec) | D2, D4, D5 |
| B9 | Duplication cleanup (field lists, domain checks, letter sum) and the "entry N" comment citations, when epic 3 touches parse. Measure dispatch replay cost on a low-end device. | Deferred cleanup | Dev, epics 3 and 7 | A3, A6, D11 |
| B10 | Ticketing lesson: at inception, each entry names its export and signature delta, its sentence → test ids, and the owning ticket of any shared rule. Keep autopilot step logs in a git-ignored repo folder. | Process change (proposal) | Owner decides; epic 3 inception | P1, P5 |
| B11 | Epic 1 A8 (shared Playwright config base) stays deferred to epic 3. | Deferred cleanup | Dev, epic 3 | A8 of epic 1 |

B1 to B5 are owner-approved in the 2026-09-30 close-out. B6 to B11 are proposals for the epic 3 spec and tickets.

## Acceptance verdict

**accepted-with-open-items** (criteria declared).

- All five Done when items are met in the evidence (S1). Item 5's live check comes after the approved merge and deploy.
- Every ticket is done, and `pending_tickets` is empty.
- The behaviour check matched the spec.
- No blocking finding is open: D1 is a latent crash in a UI path that does not exist yet.
- The open items B6 to B11 are deferred and tracked.

## Open questions

- None needs the owner now. D3, the Q-43 same-seed matching, is the owner's recorded rule and is accepted as-is. If the owner wants a replayed deal given up at the same moment never to be confused with the first game, that would reopen Q-43.

## Assumptions

- **Epic resolved:** the folder `_bmad-output/initiative-wordcell-v1/epic-rules-engine`, given explicitly (`-H`).
- **`pending_tickets` was empty,** so the verdict was not forced.
- **The machine verdict was rendered without a human decision.** The owner pre-approved the close-out steps for accepted or accepted-with-open-items verdicts.
- **Ticket 2.13's range ends at HEAD** (e86da23), inferred.
- **Every action item (B1 to B11) was proposed without the user.** B1 to B5 follow the owner's 2026-09-30 approvals; B6 to B11 are recommendations.
- **The D3 disposition (accept) rests on Q-43 and AGENTS.md Policy,** not on a new owner answer.
- **Subagent findings** (the bmad-review lenses and aggregate views) were re-checked at the cited lines for D1, D2 and D3 before routing. The rest rely on the subagents' probes, whose scratch files are in the session scratchpad and are not committed.
