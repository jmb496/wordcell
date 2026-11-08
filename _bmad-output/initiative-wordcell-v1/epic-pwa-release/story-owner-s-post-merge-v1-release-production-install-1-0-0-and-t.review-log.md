# Review log — ticket 7.12 (Owner's post-merge v1 release: production install, 1.0.0 and ten games)

State: pass 5: done (converged)

Target: `_bmad-output/initiative-wordcell-v1/epic-pwa-release/story-owner-s-post-merge-v1-release-production-install-1-0-0-and-t.md` (docs mode, thorough, max 7)
Pre-loop: HEAD 233c795; copy `<passes>/pass0.md`, 361 words.
Caller intent: tickets.toml entry 12 keys `unknown` and `done_checkpoint = true` not copied by `pull`, added to the Description in pass 1; owner authorised the agent to run the ticket on 2026-11-07 ("please proceed") after merge dcd2df0, CI run 42412944905 and Deploy run 42414566899 to https://wordcell.jmb496.workers.dev (production URL recorded in the ticket); retro accepted-with-open-items, A10 (Q-50 waiver) belongs here; `main` is an ancestor of `pwa-release` (a1a5934 + pull commit ride along with the release commit); owner steps few and plain, on the phone, no desktop or keyboard testing.

## Pass 1 — 2026-11-07
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 15, minor 9, decision-needed 0  |  Dropped in triage: 0 (about 20 duplicates merged)
Words (docs): 942 (2.61 x pass 0; budget ~900 — later additions are minors unless word-neutral)  |  Snapshot: <passes>/pass1.md; fix diff <passes>/pass1.fix.diff
### Applied
- [major] Description opening — merge/deploy described as future Jared work; record dcd2df0 (agent, one-time owner exception, epic Notes 2026-11-07), CI 42412944905, Deploy 42414566899, production URL, Jared's 2026-11-07 "please proceed"; release-commit merge/push stay Jared's → fixer item 1
- [major] Description — tickets.toml entry 12 `unknown` and `done_checkpoint = true` not carried → fixer item 2
- [major] Description / Notes — ten-game restart rule called open; answered 2026-10-29 (epic Notes Decision (2)) → fixer item 3
- [major] Verify — waiver optional and Done when 1 only; retro A10: Jared's explicit waiver of Done when 1 and 3 with the accepted gaps listed → fixer item 4
- [major] Description — branch state: ff-only already satisfied, record commits ride along, push form, ff before every agent commit, closing records after the declaration → fixer item 5
- [major] Description — spoiled read: refs allow resting on the tailnet G3 pass; no deploy only for a redo → fixer item 6
- [major] Verify — production reads lack date and footer (F12) → fixer item 7
- [major] Description/Verify — no `test:all` or pre-run check before `built`; plan carries the release commit → fixer item 8
- [major] Description — owner steps not guided or few; per-game reporting; Desktop re-read conflict → fixer item 9
- [major] Verify — where each row's evidence lives is unstated → fixer item 10
- [major] Verify — ten-game criterion drops qualifying test, no misdrop/lost drop, reset → fixer item 11
- [major] Description — no guard against opening WordCell between the 1.0.0 push and Deploy green → fixer item 12
- [major] Description — red CI/Deploy and §6.7 over-budget have no route → fixer item 13
- [major] Description — §6.1 "no" has no route → fixer item 14
- [major] Verify — who marks 7.12, epic and initiative done → fixer item 15
- [minor] F10 felt lag in §6.1 statement → 16; tag v1.0.0 → 17; References gaps → 18; every footer a game was played on → 19; restart-rule paths → 20; production site data not cleared → 21; G4 boundaries on either build → 22; `<sha>` defined → 23; SPEC CAP-10 / checklist §6.7 wording sync per SPEC review minors 4–5 → 24
### Fixer outcome
- All 24 applied; Description restructured into Done so far / 8 Owner steps / Agent rules. Checked: `main` ancestor of `pwa-release`; `git diff main pwa-release` only `_bmad-output/`; `_bmad/method/scripts/tickets.py mark <ref> <status>` exists (plans only; epic and initiative via `bmad-preview-ticketing`). Unverified: `git push origin pwa-release:main` (not run). Item 8: post-merge fix in its own fix-ticket plan (F11), not the 7.12 plan.
### Default applied (technical)
- Spoiled read → rests on the tailnet G3 pass unless a post-merge fix deploys anyway (then redone once on it)
- Push form → `git push origin pwa-release:main` (fast-forward; deployed SHA = release commit) (unverified, not run: agents never push)
- Evidence location → evidence table in the 7.12 plan; D in the epic Notes; `release-checklist.md` unchanged
- Closing record commits → stay local on `pwa-release` until after the declaration; Jared merges them then (docs-only deploy, no re-read)
- Red CI/Deploy → post-merge fix under F11 (flake: methodology flake-close protocol); §6.7 over budget → re-run once after the pre-run check, then a fix ticket
- §6.1 "no" → stops before the declaration; reasons become fix tickets or a spec §9 question
- Desktop re-read needed by a fix → the agent stops and asks Jared
- Done marks → the agent runs `tickets.py mark` on Jared's explicit recorded word
- Production site data → not cleared (keeps his history)
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none (duplicates merged across the four lenses)

## Pass 2 — 2026-11-07
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 14, minor 13, decision-needed 0  |  Dropped in triage: 0 (duplicates merged)
Words (docs): 1146 (3.17 x pass 0; over budget)  |  Snapshot: <passes>/pass2.md; fix diff <passes>/pass2.fix.diff
### Applied
- [major] Owner steps 1, 5; Verify — no step yields each game's footers; footer read "when a deploy is announced" shows the old build (AD-16) → fixer item 1
- [major] Owner step 1 — no-clear default deviates from device-testing.md:60 and G1/G2/G4's expected footer is unstated → fixer item 2
- [major] Verify — requires a production G3 to 1.0.0 although a spoiled read may rest on the tailnet G3 → fixer item 3
- [major] Verify / step 5 — ten-game run omits "every footer is 1.0.0", spanning-game rule, non-qualifying games neither count nor break the run → fixer item 4
- [major] Step 6 / §6.1 rule — F10 felt-lag route (chrome://inspect needs a desktop) unspecified → fixer item 5
- [major] Agent rules — seeded Device-row re-reads after a post-merge fix not routed (production cannot be seeded; tailnet app uninstalled) → fixer item 6
- [major] Agent rules — failed production device read (G1, G2, G4, G16, non-spoiled G3) has no route → fixer item 7
- [major] Agent rules — release commit not required to be the pushed head (CI and footer SHA follow HEAD) → fixer item 8
- [major] Agent rules — "records stay local until the declaration" contradicts a `pwa-release:main` fix push → fixer item 9
- [major] Restart rule — restated wider than the owner's answer ("card sizing or positioning CSS") → fixer item 10
- [major] Verify / sync bullet — SPEC CAP-10 still puts evidence "in release-checklist.md" → fixer item 11
- [major] Agent rules — a flaky red CI on the 1.0.0 push leaves Deploy unrun; rerun route unspecified → fixer item 12
- [major] Verify / step 8 — closing-records push deploys a new SHA; its runs unchecked → fixer item 13
- [major] Verify — G20 (accepted as is) not named in the accepted-gap list → fixer item 14
- [minor] word-neutral: "checklist step 3's" → 15; "its fix ticket's plan" → 16; Owner steps heading names the pushes → 17; `<sha>` per 1.0.0 deploy → 18; withheld waiver also stops → 19; §6.7 on `origin/main` after fetch → 20; step 5 "misdrop, lost or stuck drop" → 21 (merged into 4); SPEC review minor 5's step-5 part → 22
### Fixer outcome
- All 22 applied with compressions elsewhere; `gh run rerun --help` confirms `--failed` (run, no rerun made); that a successful rerun re-fires Deploy's `workflow_run` is unverified. References gained device-checks G1–G6, G16, G17, G20–G22.
### Default applied (technical)
- Production site data → not cleared (keeps Jared's history); G1, G2, G4 count only on footer `0.0.0 (dcd2df0)`; the plan records the device-testing.md:60 deviation (no seed page, no earlier production worker)
- Felt lag → recorded, opens the F10 follow-up ticket (any chrome://inspect step only with Jared's OK); blocks only through his §6.1 answer
- Re-read production play cannot give (seeded rows, G20–G22) → stops for Jared
- Failed production read → routes per its device-checks row (default post-merge fix, F11; re-read F12)
- Records → ride along with any later fix push (docs-only), never rebased; release commit is the head when pushed
- Flaky red CI/Deploy → one rerun of failed jobs at the same commit (Jared, or `gh run rerun --failed` on his recorded OK); second red → post-merge fix
- Closing-records push → agent checks its CI and Deploy; red → a fix ticket after v1, declaration not reopened
### Deferred to the plan (over budget, not word-neutral)
- G4 win/undo inside a run game counts by its final finish and end sheet (adversarial)
- The 2026-11-07 "please proceed" authorisation recorded in the epic Notes by the plan's first record commit (adversarial)
- Plan `built` before the declaration with `test:all` green at the last code commit on `main` (adversarial)
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none

## Pass 3 — 2026-11-07
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 6, minor 14, decision-needed 0  |  Dropped in triage: 0 (duplicates merged; 1 reviewer major reclassified minor)
Words (docs): 1150 (3.19 x pass 0; over budget)  |  Snapshot: <passes>/pass3.md; fix diff <passes>/pass3.fix.diff
### Applied
- [major] Owner step 1 — pass 2 item 1 not resolved: one close-all and relaunch after a deploy only fetches the new build (G3 steps 6–10); footer must be read after G3's full activation, between games → fixer item 1
- [major] Agent rules bullet 1 — "count only on `0.0.0 (dcd2df0)`" contradicts the same bullet's G4 on 1.0.0 and F12 re-reads on a fix build → fixer item 2
- [major] Agent rules red-run bullet — a transient Deploy/AD-18/runner red with no test and no code to fix has only the post-merge-fix route → fixer item 3
- [major] Agent rules §6.1 bullet; Verify — no resume after a §6.1 "no"; Verify satisfied by a recorded "no"; a later drop/drag fix after the run → fixer item 4
- [major] Owner steps 3/heading — no step for Jared pushing a post-merge fix (F11) though the routes depend on it → fixer item 5
- [minor, word-neutral] step 1 "keeping site data (your history)" → "keeping any site data" (production is its own origin) → 6; "Last before the declaration" → 7; "one in a qualifying game resets the count" → 8; Done checkpoint after the closing push's check → 9; "one play cannot give" → "any play cannot give", drop "G17's seeding" (reachable by play) → 10; GitHub-app rerun and Deploy re-fire marked unverified → 11
### Fixer outcome
- All 11 applied; offsetting cuts: the "please proceed" quote and the exception's date in Done so far (authorisation date kept), "as in 7.11", "(screenshots fine)", "(CI and footer SHA follow it)", "paths are examples"; Verify's ten-game clause now cites brief §6.3 and F12 instead of restating them.
### Default applied (technical)
- Footer after a deploy → read after G3's full activation (close all, cold launch, readiness, close all, relaunch), between games
- G1/G2/G4 → count on a merged pre-release footer `0.0.0 (<sha>)` (dcd2df0 unless a fix lands first) or on `1.0.0 (<sha>)` (F12)
- Transient infrastructure red (runner, Cloudflare, network in the log) → same single rerun as a known flaky test
- After a §6.1 "no" → the fixes ship, Jared restates §6.1; only a "yes" proceeds; a later fix the restart rule covers re-reads G16 (F12)
### Deferred to the plan (over budget, not word-neutral)
- CI `screens` job on the push as the screenshot evidence; red follows the red-run route (adversarial)
- `origin/main` after fetch recorded as the technical reading of F11's `main` (adversarial)
- Run count starts at the first game played entirely on `1.0.0 (<sha>)` (adversarial)
- Optional `v1.0.0` tag on the release commit (adversarial)
- T and Done when 2 evidence cite the last deployed 1.0.0 commit's runs, the release commit's beside them (adversarial)
- AD-18 red after `wrangler deploy`: app stays closed until the fix's Deploy is green, G3 on that SHA (adversarial)
- Next push handed to Jared only after the previous `main` CI finished (`cancel-in-progress`) (adversarial)
- Plain-language prompts for Jared in the plan's handoff, ids kept in the Agent rules (adversarial)
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none

## Pass 4 — 2026-11-07
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment (late-pass bar)  |  Findings: major 1, minor 16 (12 word-neutral applied, 4 deferred), decision-needed 0  |  Dropped in triage: 0 (duplicates merged)
Words (docs): 1150 (3.19 x pass 0; over budget)  |  Snapshot: <passes>/pass4.md; fix diff <passes>/pass4.fix.diff
### Applied
- [major] Agent rules red-run bullet — the known-flake rerun exception drops the owner's A4 rule and methodology Flake-close protocol 8–9 (a new sighting of a closed flake opens a fix ticket) → fixer item 1
- [minor, word-neutral] `<sha>` dual meaning → 2; "any play cannot give" → "one that play cannot give" → 3; step 4 limited to the 1.0.0 push or a G3 redo → 4; restore "please proceed" → 5; withheld waiver resumes by Jared answering again → 6; §6.7 "Before the gap list" → 7; Verify lists G3 to 1.0.0 first, then G1, G2, G4 → 8; "once resolved (fixes activated)" → 9; "(F12)" → "(Evidence kinds D)" for where reports go → 10; cut "or AD-18" (a Deploy step) → 11; sync bullet reordered ("syncs … to this ticket") → 12; gap list names the retro table's other accepted §6.6 gaps → 13
### Fixer outcome
- All 13 applied, word count held at 1150 by trims ("single", "own" in step 1, rerun clause tightened, run ids kept only in Done so far, sync bullet's review-log cite left to References).
### Default applied (technical)
- Closed-flake sighting on a release push → opens its fix ticket (Flake-close protocol 8–9, retro A4); test-only, does not block the declaration or trigger re-reads
### Deferred to the plan (over budget, not word-neutral)
- Release commit handed over only after G1 and G2 (readiness) are recorded (adversarial; a miss yields a spoiled read, which has a route)
- A misdrop or lost drop in a non-qualifying run game → a G16 finding or fix ticket, no reset (adversarial)
- Closing-push red after the done marks → reported to Jared; a backlog fix ticket; its record waits for the next push (adversarial)
- Second consecutive spoiled read's procedure fix re-read on the next deploy that happens anyway, or after v1 (adversarial)
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none

## Pass 5 — 2026-11-07
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment (late-pass bar)  |  Findings: major 0, minor 19, decision-needed 0  |  Dropped in triage: 0 (duplicates merged)
Words (docs): 1150 (3.19 x pass 0; no fix pass)  |  Snapshot: <passes>/pass4.md (unchanged)
### Applied
- none (zero majors: converged; minors are not applied at convergence)
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none

## Result — converged after 5 passes
Majors per pass: 15, 14, 6, 1, 0. Decision-needed: none. Technical defaults applied: 21 (see each pass's "Default applied"). Words 361 → 1150 (3.19x; over the 2.5x budget from pass 1, so from pass 2 only word-neutral minors were applied and procedure detail was deferred to the plan). Checkpoint commits: ae039a6, e13861e, 2af6111, db59eb7.

Unapplied minors (for the 7.12 plan):
- Owner step 4 — "until Deploy is green" (Jared cannot see Deploy): "until told Deploy is green"; and "or a G3 redo" is circular: the guard applies to the push whose deploy the redo reads ("or a redo's fix push").
- Red-run bullet — the closed-flake fix ticket is "test-only" before its cause is known (Flake-close protocol 7 allows a `src/` cause): make the no-hold/no-re-read exemption conditional ("if test-only"); otherwise a post-merge fix (F11, F12); protocol 8 opens a *new* fix ticket.
- §6.1 bullet — after a withheld waiver, "only a 'yes' proceeds" should read "a 'yes' or his waiver"; a new ten-game run ends with a fresh §6.1 answer.
- Re-read rule — G1 reinstall, G2 airplane launch, G4 force-stop and a G3 redo are guided reads, not "play": "one production cannot give (seeded rows …; Desktop G20–G22) stops for Jared".
- Sync bullet — also sync SPEC CAP-10 and the checklist's Evidence kinds / Done when 3 row to the Done when 1 and 3 waiver (retro A10), and CAP-10's "Jared … marks the initiative done" to the agent marking on his recorded word.
- Owner step 2 vs bullet 1 — G4's win/undo case may wait for a run game: say so in step 2 so Jared knows step 2 can be finished before the push.
- Restart rule — "e.g. … the subject decides" loosens the owner's list (2026-10-29 (2)); prefer: a change on a listed path restarts; the agent rules only on changes elsewhere.
- Owner step 1 — the after-each-deploy footer read is a standing rule; move it to step 5.
- §6.7 over budget — its fix ticket lands before the gap list; a gap only if Jared accepts it explicitly.
- G16 — a misdrop with no reproducible cause is a G16 finding (count resets); a fix ticket opens on a cause or a repeat.
- Step 4 after a red release run — the agent tells Jared he may use the app until the fix is pushed.
- Verify — "the last `main` commit deployed" → "pushed" (a red-Deploy commit was never deployed).
- §6.1 evidence line — the judgement is taken on the deployed 1.0.0 build (brief §6.1 "after v1 ships").
- Deferred from pass 2: G4 win/undo inside a run game counts by its final finish and end sheet; the "please proceed" authorisation recorded in the epic Notes by the plan's first record commit; plan `built` before the declaration with `test:all` green at the last code commit on `main`.
- Deferred from pass 3: CI `screens` job as the screenshot evidence; `origin/main` after fetch as the reading of F11's `main`; run count starts at the first game played entirely on `1.0.0 (<sha>)`; optional `v1.0.0` tag on the release commit; T and Done when 2 cite the last deployed 1.0.0 commit's runs with the release commit's beside them; AD-18 red after `wrangler deploy` keeps the app closed until the fix's Deploy is green; the next push only after the previous `main` CI finished (`cancel-in-progress`); plain-language prompts in the plan's handoff.
- Deferred from pass 4: hand over the release commit only after G1 and G2 (readiness) are recorded; a misdrop in a non-qualifying run game is a G16 finding, no reset; a closing-push red after the done marks is reported to Jared and becomes a backlog fix ticket; a second consecutive spoiled read's procedure fix is re-read on the next deploy that happens anyway, or after v1.
- Unverified tool claims carried in the ticket: `git push origin pwa-release:main` (not run), the GitHub-app rerun, Deploy's `workflow_run` re-firing after a green rerun.
