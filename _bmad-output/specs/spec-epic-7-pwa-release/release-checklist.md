# WordCell v1 release checklist

**v1 released** means: initiative Done when 1–3 hold on the production 1.0.0 build (F11; rows
read on the merged pre-release build count for it, F12), each row below carries its evidence, and Jared declares it and marks
the initiative done (CAP-10). Play Store/TWA is not part of it (brief §8).

Evidence kinds: **T** a named passing test and the CI run of the release commit; **D** Jared's
device read, recorded in the epic Notes with its date; **A** an audit recorded in the CAP-10 plan;
**O** Jared's judgement.

## Brief §6 success criteria

| Criterion | What counts as checked | Evidence |
| --- | --- | --- |
| §6.1 Plays by choice, trusts Undo, never fights the controls | Jared's statement after the ten-game run | O |
| §6.2 Restore after hide/reload and after an Android kill | AD-17 restore-boundary and kill-variant Playwright tests green; force-stop of Chrome and WordCell at the §6.2 boundaries, including a finish recorded then undone, on the installed production app (`device-checks.md` G4) | T + D |
| §6.3 Ten consecutive qualifying games, no misdrop, no lost drop | Ten games on 1.0.0, each won or given up with ≥ 5 committed words; restart rule per SPEC Open Questions; a qualifying game with a misdrop or lost drop resets the count to zero and becomes a finding or fix ticket (G16); each game's date, outcome, final score, words placed (end sheet) and footer listed | D |
| §6.4 Every engine sentence by Vitest, every (UI) and app-shell sentence by Playwright | Sentence-level audit of spec §2–§7 against the epics' `rule-coverage.md` files and the ticket plans' sentence→test mappings: each named test exists and passes, of the kind AD-17 assigns, or a sentence-level exemption (ownership, provenance, versioning process) is recorded; a P7 row turned D (SPEC Assumptions) is listed as a gap Jared accepted in the epic Notes, not an exemption; ids are the R-ids and §-ids of §2–§7 plus every answered §9 Q-id whose answer states behaviour; gaps become fix tickets before the declaration | A + T |
| §6.5 Engine purity | `src/architecture-*.test.ts` and `src/engine/tsconfig.json` green | T |
| §6.6 No server; bugs reproducible as tests | No backend in the build (static `dist/`); each epic's retrospective lists its bug fixes with their reproduction tests; the audit lists epic 7's fix tickets with theirs, or the recorded device-only reason (CAP-9) | A |
| §6.7 Unit suite < 5 s, watch re-run < 1 s; no manual deploy-to-test | CAP-8's measurement (AD-17 Speed); deploys only by `deploy.yml`; every ticket closed through its plan (per-ticket loop), no code on `main` outside ticket plans, merges or the release commit | T + A |
| §6.8 ≤ 600 KB to first Validate; offline after precache | `scripts/size-budget.mjs` pass with margin; CAP-4 offline test; airplane-mode launch on the installed production app (G2) | T + D |
| §6.9 Every design question answered by Jared before code | Spec §9 has no open Q-xx; no ticket plan left an owner question open; each SPEC Open Question carries Jared's answer or his explicit deferral, recorded in the epic Notes | A |

## Initiative Done when

| # | Done when | Evidence |
| --- | --- | --- |
| 1 | Every brief §6 criterion checked and passing, device checks included | The table above, plus every Device and Desktop row of `device-checks.md` passed or resolved (Optional (owner) rows only if Jared reinstated them) |
| 2 | Live on its production host, deployed only by CI | `deploy.yml` run of the 1.0.0 commit green (AD-18 post-deploy checks); install read on that URL (G1, on the merged pre-release build, F12) and the update read to 1.0.0 (G3) |
| 3 | Every rule of spec §2–§7 has a passing test named by its id | The id-level name check within the §6.4 audit: every id it covers has at least one passing test whose name carries it; exemptions are sentence-level only (ownership, provenance, versioning process) |

## Production sequence (CAP-10, F12)

1. Jared merges `pwa-release` into `main` and pushes; CI deploys it (F11); CI and Deploy green.
2. Jared uninstalls the tailnet-origin app (CAP-7), installs from the production URL (G1), checks offline launch with G2's readiness step and force-stop restore (G4); each row records the footer it was read on (F12).
3. Release commit (F11): `1.0.0` in `package.json` and `package-lock.json` (e.g. `npm version 1.0.0 --no-git-tag-version`), committed locally on `pwa-release` after the agent fast-forwards it to `main` (`git merge --ff-only main`; if that fails, it stops for Jared); Jared merges and pushes; CI and Deploy green.
4. On the installed app, in G3's order (`docs/device-testing.md`, CAP-7): launch once (old footer; 1.0.0 fetched); wait about a minute on Wi-Fi, or confirm in chrome://serviceworker-internals that a new version is waiting (unverified); with the app in recents, a Chrome tab on the URL shows the old footer; resume: still old; wherever a window shows the Q-38 message, Jared taps its Reload, then reads the menu footer (a reload never activates the waiting worker, AD-16, A-A15); close every WordCell window, app and Chrome tabs, relaunch: `1.0.0 (<sha>)`.
5. Ten qualifying games on 1.0.0 (§6.3, G16), §6.1 judgement, the §6.4 audit.
6. Every row above has its evidence; Jared declares v1 released; the initiative is marked done; the epic retrospective follows.

A post-merge fix takes step 3's path, keeps `1.0.0` and differs by SHA (F11); each production row records the footer it was actually read on; rows read on the merged pre-release build count for 1.0.0, since the release commit changes only the version (F12); G1–G4 are re-read only when a fix touches what they check (F12).
