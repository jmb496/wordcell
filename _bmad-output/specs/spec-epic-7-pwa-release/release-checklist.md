# WordCell v1 release checklist

**v1 released** means: initiative Done when 1–3 hold on the production 1.0.0 build (F11; G1,
G2 and G4 read on the merged pre-release build count for it, F12), each row below carries its evidence, and Jared declares it and marks
the initiative done (CAP-10). Play Store/TWA is not part of it (brief §8).

Evidence kinds: **T** a named passing test and the CI run of the release commit; **D** Jared's
device read, recorded in the epic Notes with its date; **A** an audit recorded in the CAP-10 plan
(§6.4 and §6.6 in the CAP-9 plan, last before the merge, after every Device and Desktop row is
recorded and its fix tickets are done; audit-gap fix tickets land before the merge, the audit
re-confirming only their deltas, with F12 re-reads where they touch a Device or Desktop row's
subject; CAP-10 re-confirms only post-merge fixes' deltas);
**O** Jared's judgement. A gap Jared accepted in the epic Notes (§6.4, §6.6) is recorded as
"checked, not passing"; for such a criterion the declaration step also records Jared's explicit
waiver of initiative Done when 1 in the initiative Notes.

## Brief §6 success criteria

| Criterion | What counts as checked | Evidence |
| --- | --- | --- |
| §6.1 Plays by choice, trusts Undo, never fights the controls | Jared's statement after the ten-game run | O |
| §6.2 Restore after hide/reload and after an Android kill | AD-17 restore-boundary and kill-variant Playwright tests green; force-stop of Chrome and WordCell at the §6.2 boundaries, including a finish recorded then undone, on the installed production app, reached by play (`device-checks.md` G4) | T + D |
| §6.3 Ten consecutive qualifying games, no misdrop, no lost drop | Ten games, each recording every footer it was played on: a game counts only if every footer it was played on is `1.0.0 (<sha>)`; a game spanning a 1.0.0 SHA change keeps or restarts the run per the restart rule (on a restart it does not count; the new run starts with the next game played entirely on the new SHA, F12); each won or given up with ≥ 5 committed words; restart rule: Jared's answer to the SPEC Open Question, or its proposed default if he defers it; a qualifying game with a misdrop or lost drop resets the count to zero and becomes a finding or fix ticket (G16); each game's date, outcome, final score, words placed (end sheet) and footer listed | D |
| §6.4 Every engine sentence by Vitest, every (UI) and app-shell sentence by Playwright | Sentence-level audit of spec §2–§7 against the epics' `rule-coverage.md` files and the ticket plans' sentence→test mappings: each named test exists and passes, of the kind AD-17 assigns, or a sentence-level exemption (ownership, provenance, versioning process) is recorded; a P7 row turned D (SPEC Assumptions) is listed as a gap Jared accepted in the epic Notes (checked, not passing), not an exemption; likewise a behaviour-stating §9 answer Jared rules device-read only (Q-50, owner 2026-11-07), listed with its device read and cross-listed under §6.6; ids are the R-ids and §-ids of §2–§7 plus every answered §9 Q-id whose answer states behaviour; every other gap becomes a fix ticket landed before the merge (Evidence kinds) | A + T |
| §6.5 Engine purity | `src/architecture-*.test.ts` and `src/engine/tsconfig.json` green | T |
| §6.6 No server; bugs reproducible as tests | No backend in the build (static `dist/`); each epic's retrospective lists its bug fixes with their reproduction tests; the audit lists epic 7's fix tickets with theirs; a fix with none is listed as a gap Jared accepted in the epic Notes (checked, not passing), not as met (CAP-9); a behaviour Jared accepts as built with device-read-only coverage (Q-50) is listed the same way; every other gap becomes a fix ticket | A |
| §6.7 Unit suite < 5 s, watch re-run < 1 s; no manual deploy-to-test | The unit suite's warm median and watch re-run re-measured on a Linux-filesystem checkout of the release commit (or after the last fix ticket), not only CAP-8's (AD-17 Speed); deploys only by `deploy.yml`; every ticket closed through its plan (per-ticket loop), no code on `main` outside ticket plans and merges (the release commit and any post-merge fix are in the CAP-10 plan or a fix ticket's plan, F11) | T + A |
| §6.8 ≤ 600 KB to first Validate; offline after precache | `scripts/size-budget.mjs` pass with margin; CAP-4 offline test; airplane-mode launch on the installed production app (G2) | T + D |
| §6.9 Every design question answered by Jared before code | Spec §9 has no open Q-xx; no ticket plan left an owner question open; each SPEC Open Question carries Jared's answer, recorded in the epic Notes; an explicit deferral is accepted only where the current behaviour is a decided spine AD (New-version prompt → AD-16; Firefox prompt → AD-7), so code follows the AD meanwhile; for the ten-game run a deferral means its proposed default (§6.3) | A |

## Initiative Done when

| # | Done when | Evidence |
| --- | --- | --- |
| 1 | Every brief §6 criterion checked and passing, device checks included | The table above, plus every Device and Desktop row of `device-checks.md` passed or resolved (Optional (owner) rows only if Jared reinstated them; resolved: a fix ticket done with the row re-read as pass, or an owner answer recorded in the epic Notes; an answer that leaves the row failing makes it an accepted gap under the waiver below); a criterion with an accepted gap is checked, not passing, and needs Jared's waiver in the initiative Notes (Evidence kinds) |
| 2 | Live on its production host, deployed only by CI | `deploy.yml` run of the 1.0.0 commit green (AD-18 post-deploy checks); install read on that URL (G1, on the merged pre-release build, F12) and the update read to 1.0.0 (G3; the tailnet G3 read only if the production read was spoiled; after a second consecutive spoiled read, G3 resolved as that row says) |
| 3 | Every rule of spec §2–§7 has a passing test named by its id | The id-level name check within the §6.4 audit: every id it covers has at least one passing test whose name carries it; exemptions are sentence-level only (ownership, provenance, versioning process) |

## Production sequence (CAP-10, F12)

1. Jared merges `pwa-release` into `main` and pushes; CI deploys it (F11); CI and Deploy green.
2. Jared uninstalls the tailnet-origin app (CAP-7), installs from the production URL (G1), checks offline launch with G2's readiness step and force-stop restore (G4, boundaries reached by play); each row records the footer it was read on (F12).
3. Release commit (F11): `1.0.0` in `package.json` and `package-lock.json` (e.g. `npm version 1.0.0 --no-git-tag-version`), committed locally on `pwa-release` after the agent fast-forwards it to `main` (`git merge --ff-only main`; if that fails, it stops for Jared); Jared merges and pushes; CI and Deploy green.
4. On the installed app, in G3's order (`docs/device-testing.md`, CAP-7): close every WordCell window (app swiped from recents, tabs on the origin closed), then launch cold (old footer; 1.0.0 fetched); readiness: about a minute on Wi-Fi, or 1.0.0 seen waiting in chrome://serviceworker-internals (unverified); with the app in recents, a Chrome tab on the URL shows the old footer; resume: still old (a visible reboot is a discarded renderer: 1.0.0 there is consistent only if the Chrome tab also shows a fresh boot or is gone, otherwise it is an activation-timing failure (owner question, per G3's Disposition) (unverified)); wherever a window shows the Q-38 message, Jared taps its Reload, then reads the menu footer (a reload never activates the waiting worker, AD-16, A-A15); close every WordCell window, app and Chrome tabs, relaunch: `1.0.0 (<sha>)`. Failures route as G3 says; a spoiled read (the first cold launch already shows 1.0.0) is not a fix ticket: it is redone at the next deploy or rests on the tailnet G3 read; a second consecutive spoiled read, after the old build's readiness step, is not redone: it routes and resolves as G3 says (a fix ticket against CAP-7's update-read procedure, or the AD-16/A-A15 owner question).
5. Ten qualifying games on 1.0.0 (§6.3, G16), §6.1 judgement; the §6.4 and §6.6 audits (CAP-9) re-confirmed for post-merge fixes only, last, after every production row is recorded and its fix tickets are done.
6. Every row above has its evidence; any Done when 1 waiver (Evidence kinds) is recorded in the initiative Notes; Jared declares v1 released; the initiative is marked done (the epic retrospective already ran, after CAP-9 and before the merge: epic Notes, user direction 2026-10-29; amended 2026-11-04, epic 7 entry 11).

A post-merge fix takes step 3's path: before the release commit it leaves `version` unchanged and the release commit follows it; after the release commit it keeps `1.0.0` and differs by SHA (F11); each row records the footer it was read on; a fixed row is re-read on the build carrying the fix, and any Device or Desktop row whose subject a later fix touches is re-read (F12); G1, G2 and G4 read on the merged pre-release build count for 1.0.0, since the release commit changes only the version; in the ten-game run, a game counts only if every footer it was played on is `1.0.0 (<sha>)`; a game spanning a 1.0.0 SHA change keeps or restarts the run per the restart rule; on a restart it does not count and the new run starts with the next game played entirely on the new SHA (F12).
