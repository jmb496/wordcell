# Review log — story-offline-proof.md (ticket 7.6)

State: pass 3: done

Mode: docs, thorough, max 7, budget 1500 words. Pass 0: 201 words, `story-offline-proof.review-log.passes/pass0.md`, HEAD 5f26585.
Intent carried from `epic-pwa-release/tickets.toml` entry 6 (not copied at pull; the fixer adds them to the Description in pass 1):
- tests: AD-16 AD-17 offline row of rule-coverage.md (P7, P7 `dist-smoke`); AD-8 one download (P7, existing).
- owns: The offline proof and the `allow` describe in `dist-smoke.spec.ts`.
- consumers: Entry 7 (adds its cases beside it).
Refs: `_bmad-output/specs/spec-epic-7-pwa-release/` SPEC.md, rule-coverage.md, device-checks.md, release-checklist.md, build-notes.md; epic-pwa-release.md; ARCHITECTURE-SPINE.md; AGENTS.md; done-ticket plans `epic-pwa-release/*-plan.md` (7.1–7.5); brief.md §6.8 (ticket ref).

## Pass 1 — 2026-10-30
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 4, minor 9, decision-needed 0  |  Dropped in triage: 3
Words (docs): 664 (3.3x pass 0; budget 1500)  |  Snapshot: story-offline-proof.review-log.passes/pass1.md  |  Fix diff: pass1.fix.diff
Fixer: all 12 items applied, no conflicts; `Response.fromServiceWorker()` checked in playwright-core types; `test-hook.spec.ts` 15_000 timeout and `update.spec.ts` file-level `allow` confirmed; TAN on seed 1 backed by e2e/dictionary.spec.ts; no runnable commands added.
### Applied
- [major] Description, deal + validated word — New game deals a random seed (`src/shell/seed.ts`), so no known word exists after the offline deal, and "validated" (accepted vs any verdict) and the `dist/` substitute for `dictionaryState()` `ready` are undefined (all four reviewers) → fixer item 1
- [major] Description, "restore the game" — no restore assertion named; `dist/` has no hook (builder, edge, adversarial) → fixer item 2
- [major] Description vs spine AD-17 Projects — spine still says "deal, validate, reload offline"; AGENTS.md policy would stop an unattended build (adversarial) → fixer item 3
- [major] Description — tickets.toml entry 6 tests/owns/consumers missing (adversarial; orchestrator's carried intent) → fixer item 4
- [minor] pwa file unnamed, F6 explicit `allow` + comment → item 5
- [minor] existing `precacheMissing` helper, activated check, poll timeout, manifest read online → item 6
- [minor] "no polling after it" ambiguous; never call `precacheComplete()` once offline → item 7
- [minor] no-prompt snapshot wait point, worker-served proof (`fromServiceWorker()`) → item 8
- [minor] start state and New game path (confirm opens only when in progress) → item 9
- [minor] `allow` describe: existing file-level tests unchanged, entry 7 adds inside → item 10
- [minor] "no fatal surface" check defined → folded into item 1
- [minor] test-only scope guard → item 11
- [minor] References: spine AD-16/AD-17, `e2e/helpers/live-region.ts` → item 12
### Default applied (technical)
- Known deal — page init script pins the one-element `crypto.getRandomValues(Uint32Array)` to seed 1 (precedent: 7.5's init-script stubs of browser APIs; storage seeding stays `seedStorage`) → default over the adversarial's "compute a word from the engine in Node" alternative
- Restore proof — `pwa`: AD-17 Reading state comparison; `dist`: stored session minus `activeMs` plus moved card's `data-place`
- `pwa` spec file — `e2e/pwa/offline.spec.ts`, file-level `allow` with F6 comment
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- edge: "assert `errorsOf` empty in dist" as a blanket console ban — offline reload may log network lines; replaced by the alertdialog/pageerror check (item 1)
- adversarial: compute a word from the engine and dictionary in Node with bounded New game retries — heavier than the seed pin; not adopted (item 1 default)
- builder: separate controller-non-null check — subsumed by item 8's `fromServiceWorker()` proof

## Pass 2 — 2026-10-30
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 4, minor 8, decision-needed 0  |  Dropped in triage: 2
Words (docs): 865 (4.3x pass 0; budget 1500)  |  Snapshot: story-offline-proof.review-log.passes/pass2.md  |  Fix diff: pass2.fix.diff
Fixer: all 12 applied, no conflicts; UI facts checked (Flip accessible name `Flip`, seed-1 column 3 `L QU E J A T A` / column 6 ends `N`, `trayIds` `['42','0','28m']`, `Loading words…` → `Validate`); added snippets are design statements, not run.
### Applied
- [major] Steps — composing TAN from a fresh seed-1 deal needs Flip: `drop()` hard-codes `destinationSide: 'left'` (src/engine/commands.ts:179), so a plain drop spells NTA and Validate rejects it (adversarial; verified) → fixer item 1
- [major] Steps — with the deal pinned to seed 1 nothing proves a deal happened; the restored TAN draft could survive and Validate still reach `Confirm` (edge; adversarial minor merged) → fixer item 2
- [major] Start and known deal — the always-on stub also pins nav's AD-13 launch id (`src/shell/nav.ts:100` `launchId = newSeed()`), contradicting "pins only … seed.ts" (ref alignment; edge minor merged) → fixer item 3
- [major] Restore assertion (`pwa`) — compared value unnamed (`snapshot().loaded.session` is the boot-time idle session; `sessionOf` is the moved game) and the spine's restore-test rule (captureBoot, three `loaded()` fields vs `__wordcellBoot`) left ambiguous (all four reviewers) → fixer item 4
- [minor] dist-smoke `activeMs` not smaller → item 5
- [minor] dist-smoke DOM half: `trayIds(page)` → item 6
- [minor] dist-smoke no-prompt wait point: `primary-action` reads `Validate` → item 7
- [minor] response waits armed before `reload()`; `isList` takes a Request → item 8
- [minor] `booted(page)` before `loaded()` → item 9
- [minor] setup stays inside the offline test, not a describe hook (entry 7 shares the describe) → item 10
- [minor] "(F7)" → "(SPEC Constraints)" → item 11
- [minor] scope guard: "code diff", allow `e2e/globals.d.ts` → item 12
### Default applied (technical)
- Seed stub — armed one-shot: the init script returns 1 only after the test arms it just before the confirm's New game, then disarms; the test asserts it was consumed once (keeps AD-13 launch ids random)
- Restore proof (`pwa`) — follow AD-17 Reading state in full, as `e2e/restore.spec.ts` does (captureBoot, three `loaded()` fields vs `__wordcellBoot`, `loaded().session` vs `sessionOf(before)`, `activeMs` not smaller)
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- adversarial: init-script "registered before the first goto" reason inaccurate — moot under the armed stub (item 3)
- adversarial: stub hit count as a separate check — folded into item 3

## Pass 3 — 2026-10-30
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 1, minor 12, decision-needed 0  |  Dropped in triage: 0
Words (docs): 1019 (5.1x pass 0; budget 1500)  |  Snapshot: story-offline-proof.review-log.passes/pass3.md  |  Fix diff: pass3.fix.diff
Fixer: all 12 applied, no conflicts; `glidesSettled`/`tapAt` exist; `update.spec.ts` uses `TEST_TIMEOUT_MS = 150_000` (ticket cites the pattern, not the value); Playwright 30 s default test timeout `unverified` (docs fact, no config sets one); brief line 180 old order confirmed.
### Applied
- [major] Steps, after the confirm's `New game` — no wait before the second compose's coordinate taps (`tapAt`, no actionability wait) while the Menu sheet's scrim and the confirm close (CSS transition, `Sheet.svelte`) and deal glides run (edge) → fixer item 1
- [minor] stub wording: "returns 1" → writes 1 into the passed array and returns it; unarmed calls go to the original bound to `crypto` (edge, adversarial) → item 2
- [minor] stub consumption counter read after the deal assertion → item 3
- [minor] dist-smoke deal check also reads stored `wordcell:session` (seed, moves, cursor) → item 4
- [minor] `pwa` restore: AD-17's history/prefs clauses (as `restore.spec.ts` asserts) missing from the "in full" list (ref, adversarial) → item 5
- [minor] Tests line: AD-16 no-prompt row, offline part (rule-coverage.md:17) → item 6
- [minor] `test.setTimeout(60_000)` per offline test, as `update.spec.ts` → item 7
- [minor] `pageerror` collector before the first `goto`, empty at the end, both builds (console not checked) → item 8
- [minor] a failure caused by production code stops the build and is reported for a fix ticket; never worked around in the test or fixed in `src/` here → item 9
- [minor] no-prompt snapshot placement reason ("once settled, as `expectNoPrompt` requires") → item 10
- [minor] `allow` describe titled after its mode (entry 7 shares it) → item 11
- [minor] Order bullet: brief §6.8's wording also uses the old order → item 12
### Default applied (technical)
- Post-deal settle — confirm and Menu sheet `toHaveCount(0)`, then `glidesSettled(page)`, both builds
- Test timeout — `test.setTimeout(60_000)`
- `allow` describe title — named after its mode (e.g. `F6 serviceWorkers allow`)
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none
