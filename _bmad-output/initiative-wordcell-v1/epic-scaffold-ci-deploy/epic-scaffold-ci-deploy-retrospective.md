---
epic: epic-scaffold-ci-deploy
date: 2026-09-28
verdict: accepted-with-open-items
criteria: declared
headless: false
---

# Retrospective: epic-scaffold-ci-deploy

## Epic summary

- **Epic:** `epic-scaffold-ci-deploy` (epic 1, Scaffold hardening, CI and deploy), branch `epic-1-scaffold`.
- **Tickets:** all nine are `done` (`tickets.py status`); `pending_tickets` is empty and no ticket sits at `built`. 1.1–1.2 were built by hand; 1.3–1.9 ran through `/epic-autopilot` (digest `_bmad-output/implementation-artifacts/autopilot/epic-scaffold-ci-deploy-20260928-0053.md`).
- **Run mode:** interactive. The owner supplied the going-in concerns in the invocation: the amendments the builds left, the deferred follow-ups, and the autopilot process (loops capped at 7, two usage-limit stops). They asked for technical choices to take the recommended default, and for questions only on functionality, UX or gameplay.

### Ranges

Ranges run from each plan's `baseline_revision` to the next; the last is inferred and cut at `447fefc` (the AGENTS.md audit `0309bee` follows it and is not epic work). Churn comes from `git_evidence.py`; the range has no merges.

| Ticket | Range | Commits |
|---|---|---|
| 1.1 Layer layout and AD-1 purity checks | `6396100..8d50800` | 5 |
| 1.2 Dictionary generation and `?url` wiring | `8d50800..36a8658` | 4 |
| 1.3 Test harness | `36a8658..e061d92` | 4 |
| 1.4 WordCell Serif font | `e061d92..e744fa8` | 4 |
| 1.5 PWA packaging | `e744fa8..9bd182e` | 6 |
| 1.6 Size budget gate | `9bd182e..46dd98b` | 4 |
| 1.7 Screenshot pipeline | `46dd98b..21d7b80` | 4 |
| 1.8 CI workflow | `21d7b80..eb8e4f9` | 4 |
| 1.9 Deploy (inferred end) | `eb8e4f9..447fefc` | 3 |
| Whole epic | `6396100..447fefc` | 38 |

Each hardening commit sits at the end of the previous ticket's range, so a ticket's code commit can appear one range later than its story documents.

### Evidence inventory

**Available:**
- The epic file, the initiative Requirements (CAP-1..9), and the SPEC and build notes under `_bmad-output/specs/spec-epic-1-scaffold-ci-deploy/`.
- For all nine tickets: the story file, `-plan.md` and ticket `.review-log.md`.
- Code review-loop logs `review-loop/1-{1,3,4,5,6,7,8,9}-build.md`, plus the autopilot digest and its working directory `/tmp/wordcell-autopilot/20260928-0053/`.
- The git history, the live site, and CI run ids (recorded in the digest).

**Missing:**
- No code review-loop log for 1.2. Its build's internal review is the only code review record.
- No conversation transcripts for 1.1–1.2. Process findings for those two rest on their plans and review logs.
- No previous retrospective. This is the first epic.

**How the analysis ran:** four parallel sub-agents covered spec reconciliation, the aggregate views, `bmad-review` (adversarial, edge-case and verification-gap lenses on the code diff without `_bmad-output`, `.claude` and the lockfile), and process. The parent re-checked the findings that drive action items against the files.

## Findings

Dispositions: **fix** = action item; **defer** = tracked for a named later epic; **accept** = recorded so later retros stop re-flagging it.

### Spec-to-implementation reconciliation

Every Done when (DW1–DW4) and every CAP-1..9 is met in the as-built code. The divergences below are spine or spec text the build outgrew, plus proof that exists only as a claim.

**S1. Spine Scaffold deltas omit `build.assetsInlineLimit` (1.4).**
- `vite.config.ts:12` keeps the woff2 from being inlined, so the preload `href` equals the `@font-face` URL. The woff2 is 4,284 B, just over Vite's 4,096 B default, so today the setting guards against a future smaller font (1.4 plan:94,103,155).
- Fix: spine reconciliation (A1).

**S2. AD-18 says CI runs on "every push and PR".**
- `ci.yml:3-13` runs on every branch push (not tags) and every PR, and cancels older runs on the same ref (`story-ci-workflow.md:79`).
- The same AD-18 passage should also say the `dist` artifact includes hidden files (`.vite/manifest.json`), and that failures upload `test-results/`, not "Playwright reports".
- Fix: spine reconciliation (A1).

**S3. Deploy config (1.9) goes beyond the spine and SPEC CAP-9.**
- `compatibility_date` is `2026-09-25` (`wrangler.jsonc:3`), capped at wrangler 4.141.0's `DEFAULT_COMPAT_DATE`; a `--dry-run` never checks it (1.9 plan:110). Ticket line 29's claim "verified accepted … without warning" is false as written.
- The origin check requires `origin` to be `jmb496/wordcell` (`story-deploy-…md:24`). SPEC CAP-9 only asks that `origin` exists.
- `/index.html` answers 307 to `/` under the default `html_handling`, and the post-deploy check follows the redirect (`deploy.yml:176`). SPEC CAP-9 lists `/index.html` as serving `no-cache` directly.
- `preview_urls: false` (`wrangler.jsonc:5`) is not written into A-A6 "no preview deploys".
- Fix: spine and SPEC reconciliation (A1).

**S4. AD-18's size-budget wording ("chunks listed in the manifest") no longer describes the code.**
- `scripts/size-budget.mjs` counts by reachability. Replacement text was proposed at 1.6 plan:101 and never applied.
- Fix: A1.

**S5. Behaviour specified only at ticket level, not in the spine or SPEC.**
- In CI and deploy: the CI flaky-report step (`ci.yml:79-148`), `retries: 2` under CI (`playwright.config.ts:13`, `playwright.pwa.config.ts:24`), the `verify dist` step (`deploy.yml:45-61`) and deploy checks 8–9 (`/_headers` and `/.assetsignore` answer 404).
- In `package.json`: `check` also runs `tsconfig.arch.json` and `tsconfig.e2e.json` (`package.json:16`).
- In AD-1: the file-extension bans (`architecture.test.ts:384-385`) are SPEC Assumptions only.
- Accept, and fold into A1 so the spine describes what exists.

**S6. AD-17 says "CI runs all of them", but CI runs its steps one by one.**
- `ci.yml:63-77` splits `test:e2e:pwa` into `build:test` plus a direct Playwright call, per the owner's epic Note (epic file line 59).
- Accept, and record in A1.

**S7. Proof that exists only as a claim.**
- DW3 and DW4 run ids appear only in the digest.
- DW2's real-build over-budget failure was one manual run (1.6 plan:89).
- The CAP-4 byte-for-byte font rebuild, the CAP-5 icon regeneration and the CAP-8 actionlint pass have no repeatable test.
- Accept for the run ids. Defer the rest to A6 and A9.

**S8. Plans 1.1 and 1.6 set `followup_review_recommended: true`, and neither follow-up ran.**
- 1.1: the markup `history`-binding regex was written after its review (plan:173).
- 1.6: the gzip level is not pinned by a test (plan:156).
- Fix: A7.

**S9. Ticket 1.7 still carries the pathspec `':!_bmad-output'`, which fails on git 2.43.**
- Source: 1.7 plan:17-25.
- Fix: A7 (a one-line ticket errata).

### Diff-scope review (`bmad-review`, weighted to the seams between tickets)

**Seams checked and clean:**
- CI builds, size-checks and uploads one `dist/`; deploy never rebuilds.
- Test-hook gating: `src/shell/test-hook.ts:9`, plus `dist-smoke.spec.ts:17,22`.
- The dictionary and the font appear once each in the precache (`precache.spec.ts:10,19`).
- `_headers` matches the hashed and unhashed split.
- The screens image tag equals the locked `@playwright/test` 1.63.0.

**R1 (medium). `test:all` is narrower than CI.**
- `package.json:30` never runs `build`, so the `postbuild` size budget never runs locally. It also skips `test:e2e:dist` and the screenshots, which CI runs (`ci.yml:44-51,160-177`).
- A ticket can pass the local "built" gate while over budget, or while leaking the hook into `dist`, and only turn CI red afterwards.
- Fix: A2.

**R2 (medium). Every packaging test reads `dist-test/`, never the shipped `dist/`.**
- Tests: `precache.spec.ts`, `build-output.spec.ts` and `font.spec.ts`, all through `e2e/helpers/dist-test.ts:7`. `dist-smoke` checks only that the app boots and the hook is absent.
- Harmless while the two builds are identical apart from the hook. It becomes a risk once epic 7 wires `sw.ts`.
- Fix: A3.

**R3 (medium). `_headers`, `.assetsignore` and `wrangler.jsonc` are first checked after production already serves them.**
- The curl step (`deploy.yml:70`) runs after `wrangler deploy` (`:63`), with no automatic rollback.
- This matches the deferred "pre-deploy header check" (1.9 plan:237).
- Fix: A4.

**R4 (medium). The screens image tag and `@playwright/test` are coupled only by convention.**
- `package.json:28` and `ci.yml:165` pin the image exactly, while `package.json:34` uses a caret range. A lockfile bump to 1.64 turns the screens job red, and with it deploys.
- This matches the deferred item at 1.8 plan:19-24.
- Fix: A5.

**R5 (low). The precache carries duplicate entries.**
- `includeAssets` (`vite.config.ts:20`) and the plugin's manifest icons repeat five URLs the glob already matches. The live `sw.js` lists `favicon.svg`, the three icons and `manifest.webmanifest` twice each, with equal revisions (observed 2026-09-28).
- `precache.spec.ts:62-66` tolerates up to two copies. If the two hashers ever disagree, Workbox refuses the conflicting entries and the service worker fails to install.
- Fix: A3.

**R6 (low). The deploy check tests the immutable header only on the first JS asset.**
- It never checks `assets/en-*.txt` or the woff2 (`deploy.yml:166-172`).
- Fix: A4.

**R7 (low). `test:e2e:dist` does not build first.**
- `package.json:27`. Locally it tests whatever stale `dist/` is on disk. AGENTS.md now says so (`0309bee`).
- Accept; A2 makes it moot.

**R8 (low). The screens-container guard checks only an environment variable.**
- `playwright.screens.config.ts:8`. Combined with `updateSnapshots: 'missing'`, a host with that variable set could write baselines on the host.
- Defer.

**R9 (low). `Window.__wordcell` is declared by hand twice.**
- `src/shell/test-hook.ts:5` and `e2e/globals.d.ts:5`, under separate tsconfigs, so drift is not a type error.
- Defer to the first epic that adds hook accessors (epic 3 or 7).

**R10 (low). "Seed only through `seedStorage`" is unenforced in `e2e/**`.**
- The AD-1 scan covers `src/` only (`architecture.test.ts:1544`).
- Defer.

**R11 (low). Committed binaries have no check against their generators.**
- No hash ties the woff2 or `public/icons/*.png` to `build-font.py` or `build-icons.mjs`. This is the same gap as S7 for CAP-4 and CAP-5.
- Fix: A9.

### Aggregate views

**Architecture delta: clean.**
- `src/` grew from 8 files to the AD-1 layers. The import graph has no cycles and no layering violation. `App.svelte` imports types from `'../engine'`, a directory specifier the scanner resolves to `index.ts` (`architecture.test.ts:274-281`).
- Nothing in `e2e/` or `scripts/` imports `src/`.
- Two couplings are not imports: `window.__wordcell` (R9), and `size-budget.mjs:18` naming `src/shell/sw.ts`, which does not exist until epic 7. Accept.

**Duplication (defer; consolidate when next touched).**
- Four directory walkers: `architecture.test.ts:1532`, `size-budget.mjs:166`, `e2e/helpers/dist-test.ts:44`, and an inline one in `dist-smoke.spec.ts:24`.
- Two `data/README.md` SHA-bullet parsers that end a bullet differently: `build-font.test.mjs:30-45` and `build-dictionary.test.mjs:118-132`.
- Three copies of the run-only-when-called-directly check in `scripts/*.mjs`.
- Precache glob and limit literals in both `vite.config.ts:43-44` and `size-budget.mjs:11-13`, held together by a source-text test.
- The engine token list in both `biome.json` and `architecture.test.ts:480-495`.
- The `#15171B` palette in about ten files, in mixed case.
- The same `node-version`, checkout and `npm ci` steps in `ci.yml` and `deploy.yml`.
- Three Playwright configs with no shared base.
- `e2e/test-hook.spec.ts` and `e2e/pwa/test-hook.spec.ts`, identical apart from the title.
- Only the Playwright pieces are likely to hurt soon: epics 3 and 7 add projects. See A8.

**Size growth: one candidate.**
- `src/architecture.test.ts` is 1,600 lines, all from ticket 1.1: about 445 lines of scanner, about 1,080 lines of fixture tables, and about 55 lines of the real scan plus the tsconfig gate.
- It is structured, and it is exempt from its own scan as a single file. Splitting the scanner into a module under `src/` would bring that module into the scan, or need a new exemption.
- Accept for now. Revisit when the first rule is added to it (A8).
- Other large files are flat test lists that follow the modules they test: `size-budget.test.mjs` 518, `e2e/helpers.spec.ts` 406, `build-icons.test.mjs` 285.

**Pattern divergence.**
- Every `it` and `test` name starts with an id, except the scaffold's `src/engine/deal.test.ts:6,15,25,30`. That is a known pitfall, left for epic 2's golden-deal ticket.
- `describe` names mix id-first and plain labels. The AGENTS.md rule covers `it` and `test` only. Accept.
- Comments cite epic-local ids (`CAP-n`, `D4`, `A-A5`, `story 1.1 OQ #2`) that AGENTS.md's cite-by-id rule does not list. Accept; they resolve through the SPEC.
- Rule-6 candidates:
  - `?? ''` on regex groups and attributes in `e2e/pwa/font.spec.ts:12,35` and `build-icons.test.mjs:108,136,265`. In tests, a missing value then fails the following assertion rather than hiding an error. Accept.
  - `if-no-files-found: ignore` on the failure-only uploads (`ci.yml:156,185`). Accept.
- `scripts/build-font.py` is the only Python script and has no lint or type check. Accept: it is host-only and pinned by `uv`.

### Process (autopilot and review loops)

**P1. Ticket review loops hit the cap on most tickets and grew each ticket a lot.**

| Ticket | Majors per pass | Result | Words before → after |
|---|---|---|---|
| 1.1 | 8,8,5,4 | capped at the old cap of 4 | 418 → 2344 |
| 1.2 | 7,4,5,0 | converged | 449 → 1470 |
| 1.3 | 13,6,3,3,1,1,1 | capped | 459 → 3597 |
| 1.4 | 6,6,3,1,2,1,0 | converged at pass 7 | 310 → 2339 |
| 1.5 | 8,4,3,3,3,3,2 | capped | 429 → 2857 |
| 1.6 | 9,4,2,2,4,0 | converged | 250 → 2002 |
| 1.7 | 6,1,1,1,3,3,3 | capped | 355 → 1961 |
| 1.8 | 8,7,4,3,3,2,3 | capped | 351 → 3012 |
| 1.9 | 7,4,3,2,1,1,1 | capped | 418 → 2007 |

- Five of the seven autopilot tickets hit the cap with the last fix never re-reviewed (digest lines 8, 24, 40, 48, 56). Tickets grew 3.3× to 8.6× in word count; `--stat` hides this because the bullets are single long lines.
- Late-pass majors mostly sat in procedures the loop had itself added:
  - 1.7: "the persistent churn source is the review-loop-added evidence procedure itself" (`story-screenshot-…review-log.md:170`).
  - 1.8: "every late major sat in the Verify proof harness for the non-gating flaky-report step" (`story-ci-workflow.review-log.md:163`).
  - 1.4 passes 4–6: plan-evidence mechanics.
- Some late majors corrected earlier fixer output:
  - 1.1 pass 4: the pass-3 rationale was wrong, and pass 3 had changed a SPEC Assumption without asking.
  - 1.5 pass 6: a pass-3 claim was wrong.
  - 1.3 code loop pass 3.
- Counts that rose rather than fell show fixes creating new majors: 1.6 went 2→4 and 1.7 went 1→3.
- Documentation drift:
  - Methodology still says "pass cap (default 4)" and "real majors on a third pass mean the refs are unclear; fix the spec" (`docs/development-methodology.md:62-63`).
  - The review-loop `argument-hint` still says `max=4` (`.claude/skills/review-loop/SKILL.md:4`).
  - The autopilot continues past a capped loop, so the third-pass rule never fired.
- Fix: A10 and A11 (proposals only).

**P2. Code review loops were mostly idle after a hardened ticket and an internal build review.**
- Six of eight logged code loops ended in one pass with 0 majors.
- The one production-affecting catch was 1.9's `compatibility_date` 2026-09-28, which would have failed the real deploy (`CR/1-9-build.md:9`, commit `081a3f9`).
- 1.3 caught an untested guard order. Its pass-3 major was self-inflicted by pass 2.
- Three review layers overlap: the ticket loop, the `bmad-build-auto` internal review (19–31 findings per plan) and the code loop.
- Fix: A11.

**P3. The defect class caught late is "tool behaviour prescribed but never executed".**
- The wrangler compat date (1.9), the git pathspec (1.7, introduced by the loop's pass-5 fixer and missed by passes 6–7), Biome lowercasing hex colours against the ticket's "exactly" (digest:28), and `assetsInlineLimit` missing from the spine (digest:20).
- The two inline-bash steps were made untestable by the ticket's own "no script file" constraint (1.8 plan:133, 1.9 plan:238). No ticket review flagged this, while 1.8 spent four passes specifying proofs for that same step.
- Fix: A10.

**P4. Two usage-limit interruptions.**
- **1.5 build, 04:09.** The plan was already written and resumed cleanly. The loss was about 2 h idle (`W/1.5-build-attempt1.log`; built at 06:23, `89af221`).
- **1.8 ticket review, 08:50.** Passes 1–5 were on disk but uncommitted. The rerun improvised a resume at pass 6 (`story-ci-workflow.review-log.md:119`), because the review-loop skill has no resume procedure and the autopilot's Step A skips only a log that ends in `## Result`. The loss was about 2.5 h idle.
- What `7efec94` covers: stdin is closed and there is a stop rule.
- What it leaves open:
  - no match text for the limit message, and no precedence over the missing-JSON rule (flagged by 1.5 plan:20-22,269)
  - no resume for a review loop stopped mid-pass
  - pass copies kept in session scratch
  - no scheduled resume at the reset time
- Fix: A11.

**P5. Owner escalations were few and appropriate.**
- 1.5 favicon: a genuine UX choice.
- The icon art at gate 4.
- The pushes and the 1.7–1.9 authorisations.
- 1.1's six open questions were spine amendments and went to the owner under rule 7. All were settled on the defaults.
- Nothing in the artifacts shows the owner having to catch a defect.
- Accept.

## Behavior verification

This epic changes the build, packaging and deploy, not gameplay. Exercised on 2026-09-28:

**Local build and smoke:** `npm run build`, then `npm run test:e2e:dist`. 2 passed: the production build loads with 52 live cards, no errors and no test hook, and no file in `dist/` contains `__wordcell`.

**Live site, https://wordcell.jmb496.workers.dev:**
- `/`, `/sw.js` and `/manifest.webmanifest` answer 200 with `cache-control: no-cache`.
- `/index.html` answers 307 to `/` (see S3).
- The hashed JS and the woff2 under `/assets/` answer `public, max-age=31536000, immutable`.
- `/_headers` and `/wrangler.jsonc` answer 404.
- The live JS contains no test-hook string.
- The live `sw.js` precaches the dictionary `assets/en-n6QSuDF0.txt` and the woff2 once each, and five public files twice with equal revisions (R5).

**Earlier gates:** `npm run lint` and `npm run check` pass at `0309bee`. `test:all` was last green at ticket 1.9's build (plan Verification) and was not re-run for this retrospective, which changed no code.

**Not exercised:** installing the PWA on an Android device, and offline launch. The service worker is not registered until epic 7 (AD-16, `registerType: 'prompt'`, `injectRegister: false`).

## Previous-retro follow-through

No previous retrospective file exists: this is the initiative's first epic. There was nothing to follow through on.

## Action items

All items are proposals. Nothing was applied.

| # | Action | Kind | Owner | From |
|---|---|---|---|---|
| A1 | Amend the spine and SPEC to the as-built: `assetsInlineLimit` in Scaffold deltas; AD-18 CI triggers and concurrency, hidden-file `dist` artifact and `test-results/` upload; `wrangler.jsonc` shape (compat date ≤ the pinned wrangler's default, `workers_dev`, `preview_urls: false`, no `html_handling`); CAP-9 origin check and the `/index.html` 307; size-budget reachability wording (1.6 plan:101); AD-17 note that CI runs the steps split; AD-1 extension bans; the extra `check` tsconfigs. Proposed text is in the 1.6 plan and in this retro's evidence (spine AD-18 `:691-727`, Scaffold deltas `:794-820`). | Spec reconciliation | Architect (`bmad-architecture` update), owner approves | S1–S6 |
| A2 | Make `test:all` cover what CI gates: append `npm run build && npm run test:e2e:dist`. Screenshots stay container-only, and AGENTS.md says so. | Remediation | Dev, first epic-2 ticket or a hardening ticket | R1, R7 |
| A3 | Run the disk-only packaging tests against `dist/` as well as `dist-test/` (let `distTest()` take a root). Drop `includeAssets` and the duplicate manifest-icon entries, and require exactly one precache entry per URL. | Remediation | Dev, before epic 7 | R2, R5 |
| A4 | Add a pre-deploy Vitest check that parses `public/_headers` and `.assetsignore` against AD-18's exact rule set. Extend the post-deploy immutable check to the dictionary and the woff2. | Remediation | Dev, hardening ticket | R3, R6, 1.9 plan:237 |
| A5 | Pin `@playwright/test` exactly, and add a unit test that the lockfile version equals the image tag in `package.json` and `ci.yml`. | Remediation | Dev, hardening ticket | R4, 1.8 plan:19-24 |
| A6 | Put actionlint in CI (the pinned `rhysd/actionlint` image as a step in the test job), and move the flaky-report and deploy-check bash into testable `scripts/*.mjs` or `.sh` files with unit tests. The move needs the "no script file" ticket constraint lifted, which is a technical choice. | Remediation | Dev, hardening ticket | S7, P3, 1.8 plan:25-38,133, 1.9 plan:238 |
| A7 | Run the two recommended follow-up reviews (the 1.1 markup `history` regex, the 1.6 gzip level). Add an errata note to ticket 1.7 for the broken pathspec and to ticket 1.9 for the false "verified accepted" line. | Remediation | Dev, `/review-loop` on the code | S8, S9, S3 |
| A8 | Consolidate the three Playwright configs on a shared base, and the directory walkers, when epic 3 or 7 next touches them. Revisit splitting `architecture.test.ts` when a rule is next added to it. | Deferred cleanup | Dev, epics 3 and 7 | Aggregate views |
| A9 | Add hash checks tying the committed woff2 and icon PNGs to their generator inputs, or record that regeneration is verified only by hand. | Remediation | Dev, hardening ticket | S7, R11 |
| A10 | **review-loop skill (proposal, not applied):** (a) from pass 4, count as major only defects in shipped behaviour, a gating check or the ticket's contract; (b) from pass 2, one lens reviews only the last fix diff against the prior fixes; (c) reserve the last pass under the cap for a verify-only pass, so no fix goes un-reviewed; (d) stop early on two consecutive passes with at most 1 major, and stop and name the ref to fix when majors rise; (e) a growth budget: log word count per pass and, beyond about 2.5× growth, push procedure detail to the build; (f) run any literal command, config value or version claim against the pinned tool before calling it fixed; (g) a builder-lens major for constraints that make code untestable; (h) checkpoint and resume from a log without `## Result`, with pass copies beside the log rather than in scratch; (i) fix the `max=4` hint and methodology lines 62-63, and state whether minors may be applied after convergence (1.1 did). | Process change | Owner decides; Dev applies | P1, P3, P4 |
| A11 | **epic-autopilot skill (proposal, not applied):** (a) match `hit your (session\|usage) limit` before the missing-JSON rule, record the reset time, and optionally schedule the resume for it; (b) resume a partial review log instead of restarting; (c) commit a WIP checkpoint after each review pass; (d) run the code loop at quick depth when the build's internal review left no high or medium finding; (e) when a loop caps, record the late-major area in the digest as a ref to fix (methodology:63) instead of continuing silently. | Process change | Owner decides; Dev applies | P2, P4 |

## Acceptance verdict

**accepted-with-open-items**, against the criteria declared in the epic file's Done when.

- DW1–DW4 and CAP-1..9 are met in the as-built code. The live deploy was verified in this run.
- All nine tickets are `done`, and `pending_tickets` is empty.
- No blocking finding is open. The open items are medium verification gaps (R1–R4), spine and spec text that trails the code (S1–S6), and process proposals (A10, A11).
- The owner accepted every ticket; there is no separate human verdict override.

## Open questions

- A1 edits the spine and SPEC, the build contract. Rule 7 and the Policy section ask for the owner's go-ahead before any spine edit, even to match reality.
- A10 and A11 change how future epics are hardened and built. The owner asked for proposals only.
- Should A2–A6 and A9 be one epic-1 hardening ticket before epic 2, or folded into epic 2's first ticket? This is technical sequencing; the default is one small hardening ticket, so epic 2 starts on a gate that matches CI.
