# WordCell v1 release checklist

**v1 released** means: initiative Done when 1–3 hold on the production build whose menu footer
reads `1.0.0 (<sha>)` (F11), each row below carries its evidence, and Jared declares it and marks
the initiative done (CAP-10). Play Store/TWA is not part of it (brief §8).

Evidence kinds: **T** a named passing test and the CI run of the release commit; **D** Jared's
device read, recorded in the epic Notes with its date; **A** an audit recorded in the CAP-10 plan;
**O** Jared's judgement.

## Brief §6 success criteria

| Criterion | What counts as checked | Evidence |
| --- | --- | --- |
| §6.1 Plays by choice, trusts Undo, never fights the controls | Jared's statement after the ten-game run | O |
| §6.2 Restore after hide/reload and after an Android kill | AD-17 restore-boundary and kill-variant Playwright tests green; force-stop at the §6.2 boundaries on the installed production app (`device-checks.md` G4) | T + D |
| §6.3 Ten consecutive qualifying games, no misdrop, no lost drop | Ten games on 1.0.0, each won or given up with ≥ 5 committed words; restart rule per SPEC Open Questions; game seeds and outcomes listed | D |
| §6.4 Every engine sentence by Vitest, every (UI) and app-shell sentence by Playwright | Audit: every R-id, §-id and Q-id of spec §2–§7 has at least one passing test whose name carries it, by the kind AD-17 assigns, or a recorded exemption; gaps become fix tickets before the declaration | A + T |
| §6.5 Engine purity | `src/architecture-*.test.ts` and `src/engine/tsconfig.json` green | T |
| §6.6 No server; bugs reproducible as tests | No backend in the build (static `dist/`); each epic's retrospective lists its bug fixes with their reproduction tests | A |
| §6.7 Unit suite < 5 s, watch re-run < 1 s; no manual deploy-to-test | CAP-8's measurement (AD-17 Speed); deploys only by `deploy.yml` | T + A |
| §6.8 ≤ 600 KB to first Validate; offline after precache | `scripts/size-budget.mjs` pass with margin; CAP-4 offline test; airplane-mode launch on the installed production app (G2) | T + D |
| §6.9 Every design question answered by Jared before code | Spec §9 has no open Q-xx; no ticket plan left an owner question open | A |

## Initiative Done when

| # | Done when | Evidence |
| --- | --- | --- |
| 1 | Every brief §6 criterion checked and passing, device checks included | The table above, plus every Device and Desktop row of `device-checks.md` passed or resolved |
| 2 | Live on its production host, deployed only by CI | `deploy.yml` run of the 1.0.0 commit green (AD-18 post-deploy checks); install and update read on that URL (G1, G3) |
| 3 | Every rule of spec §2–§7 has a passing test named by its id | The §6.4 audit |

## Production sequence (CAP-10, F12)

1. Owner go-ahead; the epic branch merges to `main`; CI and Deploy green.
2. Jared installs from the production URL (G1), checks offline launch (G2) and force-stop restore (G4).
3. Release commit: `package.json` `version` `1.0.0`; CI and Deploy green.
4. On the installed app: old footer while any WordCell window is open; `1.0.0 (<sha>)` after every window closed and a relaunch (G3).
5. Ten qualifying games on 1.0.0 (§6.3, G16), §6.1 judgement, the §6.4 audit.
6. Every row above has its evidence; Jared declares v1 released; the initiative is marked done; the epic retrospective follows.
