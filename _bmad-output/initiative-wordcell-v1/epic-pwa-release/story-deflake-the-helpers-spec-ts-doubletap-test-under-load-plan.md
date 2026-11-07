---
title: 'Deflake the helpers.spec.ts doubleTap test under load (D-71)'
type: 'bugfix'
ticket: 14
created: '2026-11-03'
status: done
route: 'oneshot'
route_source: 'auto'
baseline_revision: '420e8310e97e4ce42d06675463c7f2057d0d0208'
review: 'quick'
review_source: 'auto'
lenses_ran: ['quick']
review_loop_iteration: 0
followup_review_recommended: true
context: []
warnings: ['oversized']
deferred: []
---

<intent-contract>

## Intent

**Problem:** D-71 (ticket 7.10's sweep): `AD-17 doubleTap gives two touch taps whose clicks have detail 1 then 2, even 600 ms apart in real time` (`e2e/helpers.spec.ts`) failed once under full-suite load (bbdd2d5's final `test:all`) in `doubleTap`'s `[1, 2]` poll with click details `[1, 1]`. The helper's report shows the first tap's page events on its CDP stamp (740.1 ms) and the second tap's ~1700.1 ms after its stamp (2520.2 ms against a stamp at 820.1 ms), so the second tap reached the page past Chromium's 400 ms tap-count window.

**Approach:** Follow ticket Scope items 3–6. Record before-counts (item 4), then test the named mechanism (a stale second tap: Chromium not honouring a CDP `timestamp` that is old enough at dispatch) with a temporary, reverted, test-side injection within item 5's bounds, and measure its lateness threshold. A test-side fix lands only with both halves of item 5's proof; otherwise the plan records the item 5 outcome that applies (Input-delivery with a B8 proposal, Reproduces, or Never reproduces) with its counts and evidence. Item 1's edit boundary and item 2's pins hold.

</intent-contract>

## Outcome

**Cause found and fixed test-side, with both halves of item 5's proof.** The cause is a wall-clock step between the two taps. The WSL2 VM's clock is stepped back about 1.6–1.7 s every ~32.26 s of monotonic time, even when the machine is idle. Chromium converts a CDP `timestamp` against its own wall clock as the event arrives. `doubleTap` stamped the second tap `first + 80 ms` from a `Date.now()` taken before the first tap. So a backward step of X between the taps put the second tap 80 + X ms after the first on the page's event clock, past the 400 ms tap-count window, giving details `[1, 1]`. Load is not the mechanism. A stale second tap is honoured exactly (stale-second-tap model refuted). The fix stamps each tap from the wall clock at its own dispatch, minus its age on the monotonic clock, so a step both clocks share cancels. It is confined to `doubleTap` (`e2e/helpers/touch.ts`), with one new `e2e/helpers.spec.ts` case; `src/`, configs and every other spec are unchanged.

Outcome class (item 5): the second tap's page `timeStamp` is off the stamp as the report computes it (`stamp − timeOrigin`), so this is filed as an **input-delivery cause** fixed test-side by deterministic stamping, which item 5 allows with both halves. Equivalently it is a test-side cause: the helper derived the second stamp from a stale wall-clock reading. Either reading lands the same fix inside items 1 and 2. It is not a Chromium stale-stamp limit (item 2): stale stamps up to 3000 ms were honoured, so there is no threshold to record and no B8 proposal.

## Implementation Notes

Oneshot route: the change is a 16-line edit to `doubleTap` and one 30-line `e2e/helpers.spec.ts` case. Build start commit (baseline): `420e8310e97e4ce42d06675463c7f2057d0d0208`. All runs: the `/mnt/d` checkout, Node 24, CI unset (retries 0, `playwright.base.ts`), 16 cores, Playwright 1.63.0. No server was on :5173 or :4173 before the first run (`ss -ltnp`), and none was started outside Playwright's own `webServer` afterwards (review-log pass 3 minor). Logs, traces, the injection generator and the harness are in `~/wordcell-traces/7.14/` (not committed).

### Item 3: evidence

- Sighting (D-71, bbdd2d5, 2026-10-31 21:06 local): first tap at 740.1 = its stamp (`1793495191453.0 − 1793495190712.9`); second tap at 2520.2 against a stamp at 820.1. Lateness is 1700.1 ms, first-tap lateness 0.
- Before-count failures, isolated run (below), reps 48 and 49, run concurrently on two workers:
  - rep 48: `doubleTap: page events touchstart@477.4, touchend@477.4, click(1)@477.4, touchstart@2212.9, touchend@2212.9, click(1)@2212.9; CDP stamps 1793763650269.0 +0 and +80 ms; page timeOrigin 1793763649791.6`
  - rep 49: `… touchstart@427.2 … click(1)@427.2, touchstart@2162.6 … click(1)@2162.6; CDP stamps 1793763650659.0 +0 and +80 ms; page timeOrigin 1793763650231.8`
  - Both have first-tap lateness 0.0 and second-tap lateness 1655.5 / 1655.4. Run condition: isolated, before any fix, at 420e831. Traces: `~/wordcell-traces/7.14/before-isolated/…-repeat48/` and `…-repeat49/`.
  - In rep 48's trace (test-side Node clock), the first touchStart was sent at 45138.4 ms and the second at 45768.3 ms: a **630 ms real gap**. The page nevertheless saw 1735.5 ms. Every CDP send returned in 2–16 ms. So the extra ~1.1 s was not late delivery.
- The clock steps:
  - The system journal has `systemd-journald: Time jumped backwards, rotating` at **22:40:49**, the same second as both failing reps' `timeOrigin` (22:40:49.79 and 22:40:50.23 local). `systemd-resolved` logs `Clock change detected` every ~30.5 s. dmesg holds 22 such backward-jump lines in the 4.9 h since boot.
  - `clock-steps.mjs` samples Node's wall-minus-monotonic offset every 50 ms. Idle, it logged steps of −1645.4, −1611.6, −1619.6 and −1612.6 ms at wall intervals of 30.64 s (`clock-steps-idle.log`). Later runs logged −1659.7, −1656.1, −1649.5 and −1620.3 ms.
  - The monotonic period is the wall interval plus the step: 32.25–32.27 s. Each step size is within the sighting's 1700.1 ms; the sighting's own step was 1700.1 ms.
- Diagnostic `zz-diag-7-14.spec.ts`, temporary in `e2e/`, removed after each run (`git status` clean). It sends single CDP taps stamped S ms before dispatch, S = 0…3000.
  - The page's `timeStamp` is S ms before arrival every time (`receipt performance.now() − timeStamp = S + 2–3 ms`). So Chromium reads a stamp relative to its wall clock at arrival, and honours a 3 s stale stamp.
  - In its first run (3 workers, ×3), a step landed after row 1. On all three workers at once, every later row read `timeStamp − (stamp − timeOrigin)` = 1617 ms, while `receipt − timeStamp` stayed S. In its second run (no step) every row read 0.0. That is the step signature, not a staleness limit.
  - Deviation from item 3's copying practice: those two diagnostic outputs went to the session transcript only, not to a file. The numbers above are copied from it. Neither diagnostic run had a failure (3/3 and 2/2 passed), so item 3's per-failure record does not apply to them.
- Rates: the failure window is the real time between the taps' conversions, about 630 ms with `between` 600. That gives a hit rate of about 630 / 32 260 ≈ 2 % per run. One step can hit several concurrent reps. This fits 2/50 isolated (one step, two reps), 0/3 counted and the earlier 30/30. "Under load" was incidental: the steps happen idle too.
- D-64 (A7, recorded only, not closed): the other `doubleTap` callers use the default `between` of 80 ms, a ~100 ms window, so they get about a 0.3 % hit rate from the same mechanism. That may explain D-64's rare `nav.spec.ts` failures. It is a hypothesis for D-64's owner backlog entry, not proof; this ticket does not close D-64 (SPEC Non-goals A7).

### Item 4: reproduction counts

| Run | Tree | Result |
| --- | --- | --- |
| Isolated before (`… -g "doubleTap gives two touch taps" --project=android --repeat-each=50`) | 420e831 | **2/50** failed: reps 48, 49, `[1, 1]`; item 3 |
| Counted 1–3 before (`npx playwright test --project=android --reporter=line`) | 420e831 | **0/3**: each exit 0, 903 passed, 225 skipped; the test ran and passed in all three; no D-64 or R-73 failure |
| Isolated after (pre-review, superseded by Final runs) | 420e831 + the uncommitted pre-review fix (80 ms self-test wait) | 0/50 (45.6 s) |

The after-fix 0/50, 0/3 and `test:all` at the final tree are under Final runs below.

### Item 5: injections

The harness is `injections/run.sh` with generator `make.py`. It copies `e2e/helpers.spec.ts`, writes the injected copy, runs the test, restores the clean copy, copies `outputDir`, and appends `git diff --stat -- e2e` (empty after every revert). Each injected file is kept as `injected-<label>.ts`. Every injection edits only the 600 ms test's body. That body is the site, and the fix never touches it; `between` stays 600 ms for the step model. The injection command is `run.sh <mode> <N> <label>`, i.e. the isolated command at `--repeat-each=N` on the injected file. Per-rep failure records are in `inj-<label>.log` and `results-<label>/`.

- **step** models the named mechanism without load: it waits for a natural step before `page.goto`, then sends the first tap 300 ms before the next predicted step (period 32 260 ms).
- **stale** is the stale-second-tap model at about the sighting's lateness (review-log pass 7 minor): it starts right after a step, with `between` 1760 ms, so the second tap is ~1.69 s stale at dispatch and no step falls between the taps.

| Injection | Fix | Result |
| --- | --- | --- |
| step v1–v2 (harness development, not proof) | no | v1 (`inj-step-nofix`, `-diag`, `-diag2`): 0/10. The prediction used the 30.64 s wall period, so no step fell between the taps (logged step across the call: 0.0 ± 0.9 ms). v2 (`-v2`, monotonic period): 5/5 `[1, 1]`, but the page navigated before the previous step, so first-tap lateness was 1665.6 and second-tap lateness 3323.2. Raw lateness is beyond the 1700.1 bound, so per item 5 these 5 reps are out-of-bound measurements: not counted toward 5/5, not D-71's cause, and they decide no outcome. Their step across the taps (second-tap minus first-tap lateness, review-log pass 6) was 1657.5–1657.6. Item 5's lateness *threshold* is about a stale-stamp limit, which does not exist here (stale model). Example: `doubleTap: page events touchstart@64584.7, touchend@64584.7, click(1)@64584.7, touchstart@66322.3, touchend@66322.3, click(1)@66322.3; CDP stamps 1793765242713.0 +0 and +80 ms; page timeOrigin 1793765179793.9`; traces in `injections/results-step-nofix-v2/…-repeat1…4` and the unsuffixed rep-0 directory. v3 supersedes it as the proof. |
| **step v3** (`inj-step-nofix-v3`) | no | **5/5 failed `[1, 1]`**. First-tap lateness 0.0, second-tap lateness 1631.8–1632.0 ms (≤ 1700.1), stamps 80 ms apart. Logged wall step across the call: −1631.5 to −1632.4 ms. Run condition: injection. Example (each rep's full message is in `inj-step-nofix-v3.log`): `doubleTap: page events touchstart@31981.5, touchend@31981.5, click(1)@31981.5, touchstart@33693.4, touchend@33693.4, click(1)@33693.4; CDP stamps 1793765334551.0 +0 and +80 ms; page timeOrigin 1793765302569.6`. Traces: `injections/results-step-nofix-v3/…-android{,-repeat1…4}/trace.zip`. |
| **step v3** (`inj-step-fix`) | yes | **0/5 failed** (5 passed). Logged wall step across the call: −1675.4 to −1676.2 ms, so the step fell between the taps in every rep. |
| stale (`inj-stale-nofix`) | no | 0/5 failed. The stale model is refuted: no `[1, 1]` within the bound. |
| stale (`inj-stale-fix`) | yes | 0/5 failed |

Both halves hold: same site, same command, 5/5 without the fix, 0/5 with it, and no failure of any other kind. The stale-second-tap injection required by "Never reproduces" ran, and it did not reproduce.

### The fix

- `e2e/helpers/touch.ts` `doubleTap`: `start = performance.now()` is taken with `first`. `tap(at)` stamps both events of a tap with `(Date.now() − (performance.now() − start − at)) / 1000`; the calls are `tap(0)`, `between()`, `tap(DOUBLE_TAP_GAP_MS)`. The comment states the conversion rule and cites 7.14.
  - Pins unchanged: the title, `between` 600, its position, the < 400 ms check, the `[1, 2]` check, `DOUBLE_TAP_GAP_MS`, and the report format.
  - The report still prints `CDP stamps <first> +0 and +80 ms`. That is now the stamped gap on the event clock; after a step, the payload's wall-clock values differ by the step. A permanent extra field would change the format its self-tests pin (review-log pass 6 minor), so it is not added.
  - The signature and contract ("two stamped CDP taps", spine AD-17 Touch) are unchanged, and there is no new export, so no entry-11 spine-sync note is needed (item 6).
  - Residual: a step between Node's `Date.now()` read for a tap and Chromium's conversion of that tap (a few ms per tap) still shifts the tap. The window is about 0.01 % per tap.
- Item 6 case, `e2e/helpers.spec.ts`: `AD-17 doubleTap stamps the second tap from the wall clock at its dispatch, so a 150 ms step only Node sees moves it 150 ms on the page`.
  - It patches `Date.now` +150 ms in `between`, after a 300 ms real wait, and restores it in `finally`. It asserts the page's pointer gap is 230 ± 2 ms.
  - A step both clocks take cancels by design, so a Node-only step is what makes the stamp source observable without changing the machine's clock.
  - The 300 ms wait keeps the stepped second stamp in the past (~70 ms stale). That way the case depends only on the measured stale-stamp behaviour, not on unmeasured future-stamp handling (review pass 1).
  - Named mutations, each run `--repeat-each=5` with the file restored after (`cmp` identical):
    - Stamps back to `first + at / 1000`, the old derivation: 5/5 failed (`|gap − 230|` = 149.9–150.1). Logged in `item6-mutation.log` (80 ms wait) and `item6-mutation-v2.log` (300 ms wait).
    - Stamps of the bare dispatch time, `Date.now() / 1000`: 5/5 failed with `[1, 1]` (page gap 474–480 ms), in `item6-mutation-v2.log`.
- `test:screens`: no `*.screens.spec.ts` imports `touch.ts`, directly or transitively. The screens specs import `helpers/{board,celebration,how-to-play,seed,project,restore,blocking}`, none of which imports `touch` or `gestures`. So it is not triggered.

### Item 6 runs (android, fix applied)

- `e2e/helpers.spec.ts -g doubleTap --repeat-each=5`: this matches the whole touch describe (10 tests, the new case included). 50/50 passed.
- Callers `--repeat-each=5`: `nav.spec.ts:163` (D-64), `celebration.spec.ts:715`, `history-notice.spec.ts:231` and `:398`. 20/20 passed.

### Review-log unapplied minors (passes 3–7), as resolved

- P3 file-level Verify: `git diff <baseline> -- e2e/helpers/touch.ts` shows only `doubleTap`'s body and comment changed (Final runs).
- P3 threshold measurement: moot. Stale stamps up to 3000 ms are honoured, and the stale injection at ~1.69 s passed 5/5. There is no stale-stamp threshold.
- P3 dev server on :5173: none before any run (above).
- P4 the stale injection's fix route is deterministic stamping only: confirmed in effect. The landed fix is deterministic stamping, proven on the step injection; the stale model never failed.
- P4 strict void reading (any caller failure voids): adopted. Moot: no caller failed.
- P4 tickets.toml entry 14 out of sync: left to the orchestrator, as asked; this build did not edit it.
- P4 a non-`[1, 1]` sighting is its own mode: none occurred.
- P5 a larger-lateness sighting does not widen the bound: adopted. Every counted rep stayed ≤ 1700.1.
- P5 a single in-bound `[1, 1]` below threshold counts as Reproduces: adopted. Moot: the proof was 5/5.
- P5 name the concrete deterministic stamping change: done (The fix).
- P5 7.13's uninjected both-project drvfs diagnostic as before-evidence: recorded. In 7.13's `npx playwright test --output=test-results` run (15.4 min, 5 drvfs teardown stalls elsewhere), this test passed. That is consistent with a ~2 % per-run hit rate.
- P6 clock offset between Node and page `timeOrigin`: measured as second-tap minus first-tap lateness (`lateness.py`). Injection v3 moved the step wait before `page.goto`, so first-tap lateness is 0.0 and the raw bound holds as well.
- P6 whether a test-side remedy can beat a stale second tap: moot, since the stale model does not fail. The step model's remedy is proven.
- P6 the mutation case as a new self-test: done, with a Node-only wall step rather than a longer real gap.
- P6 a permanent extra report field: not added (the format is pinned).
- P6 after-fix runs are lighter than the sighting: the claim rests on the injection proof, which forces the mechanism in every rep. The sighting was not load-specific anyway (above).
- P6 the injection's "command" and per-rep records: defined above.
- P7 the stale injection at ~1700 ms: run at a ~1.69 s stale second tap, 0/5.

### Final runs (commit 14f0835, the last tree changing anything outside `_bmad-output/`)

All at `14f0835b72ecf2605772aea06c43f32c8936f5da`, after the review patches. Only this plan was uncommitted; logs are in `~/wordcell-traces/7.14/final/`.

| Run | Result |
| --- | --- |
| Isolated ×50 (item 4) | **0/50** (50 passed, 44.7 s) |
| Item 6: `e2e/helpers.spec.ts -g doubleTap --repeat-each=5` (10 touch tests, new case included) | 50/50 passed |
| Item 6: callers `nav.spec.ts:163`, `celebration.spec.ts:715`, `history-notice.spec.ts:231`, `:398` ×5 | 20/20 passed |
| Counted 1–3 (`npx playwright test --project=android --reporter=line`) | **0/3**: each exit 0, 904 passed, 225 skipped (the new case is the +1). The test ran and passed in all three. No D-64, R-73 or other failure. |
| `npm run test:all` | **exit 0** (7m12s). Lint clean; check 0 errors; unit 3788 passed (91 files); build total 560,702 / 600,000; `test:e2e:dist` 28 passed; `test:e2e` 1162 passed, 1096 skipped, 0 failed (this test and the new case passed on android); `test:e2e:pwa` 44 passed |
| `git diff --name-only 420e831 -- . ':(exclude)_bmad-output'` | `e2e/helpers.spec.ts`, `e2e/helpers/touch.ts`: item 1's files only |
| `git diff 420e831 -- e2e/helpers/touch.ts` (review-log pass 3 minor) | 5 hunks, all in `doubleTap`'s comment and body (lines 88–139); `checkPoints` and the other exports are untouched |

No sighting occurred from the fix's first uninjected run on, so the void rule never applied. No D-64 failure occurred in any run, so there is nothing to record for A7 beyond the hypothesis under item 3.

## Plan Change Log

## Review Triage Log

### 2026-11-03 — Review pass
- verdicts: 6 findings — high 0, medium 2, low 4, false 0, maybe-false 0
- findings:
  - `[medium]` `[patch]` No Final runs section: the after-fix 0/50, 0/3, `test:all` and the file-level diff check are not recorded — real. They were scheduled after review by design (item 4: counts at the last tree changing anything outside `_bmad-output/`). Fix: code committed as 14f0835; all of them run there and recorded under Final runs.
  - `[low]` `[patch]` The pre-review 0/50 has no exact tree ("420e831 + fix") — real. Same fix: the final 0/50 is at commit 14f0835, and the pre-review row stays labelled as superseded evidence.
  - `[low]` `[patch]` Item 3 records for injection and mutation failures are pointers only; diagnostic outputs exist in the transcript only — partly real. Fix: one full helper message per failing injection run, plus the trace directories, added to the item 5 table (v2, v3); each rep's full message stays in its log. The diagnostic runs had no failures, so item 3's per-failure record does not apply; the transcript-only copy is recorded as a deviation.
  - `[low]` `[patch]` The v2 reps beyond the 1700.1 bound were rescored rather than recorded as item 5 out-of-bound measurements — real. Fix: v2 is relabelled as out-of-bound measurements (not counted, not D-71's cause, decide no outcome). The text now says item 5's threshold concept is about a stale-stamp limit, which does not exist here.
  - `[medium]` `[patch]` The new self-test's second stamp was ~140 ms in the future, which no measurement covered — real. `between` waited 80 ms, then +150, so the stamp was 150 − (elapsed − 80) ahead. Fix: `between` waits 300 ms before the Node-only step, so the stamp is ~70 ms stale; the comment says why. The case passed 5/5, and both named mutations fail 5/5.
  - `[low]` `[patch]` The ±2 ms check did not exercise the monotonic-age term (a bare `Date.now()` stamp passes with an 80 ms wait) — real. Fixed by the same 300 ms wait: the bare-dispatch mutation now gives a 474–480 ms gap and fails 5/5 (`[1, 1]`), recorded as a second named mutation.


## Verification

**Commands:**
- `npm run lint`, `npm run check` -- expected: clean
- `npx playwright test e2e/helpers.spec.ts -g "doubleTap" --project=android --repeat-each=5` and the four caller tests ×5 -- expected: all pass (item 6)
- `npx playwright test e2e/helpers.spec.ts -g "doubleTap gives two touch taps" --project=android --repeat-each=50` -- expected: 0/50 at the final tree
- `npx playwright test --project=android --reporter=line` ×3 -- expected: 0/3 at the final tree
- `npm run test:all` -- expected: exit 0
- `git diff --name-only 420e8310e97e4ce42d06675463c7f2057d0d0208 -- . ':(exclude)_bmad-output'` -- expected: `e2e/helpers.spec.ts`, `e2e/helpers/touch.ts` only

## Auto Run Result

- **Summary:** D-71's cause was found and fixed test-side with both halves of item 5's proof. The WSL2 wall clock steps back ~1.6–1.7 s every ~32.26 s of monotonic time. Chromium reads a CDP stamp against its wall clock on arrival, and `doubleTap` derived the second stamp from a reading taken before the first tap, so a step between the taps gave `[1, 1]`. Each tap is now stamped from the wall clock at its dispatch minus its monotonic age.
  - Before the fix: 2/50 isolated, 0/3 counted.
  - The step injection (lateness ~1632 ms, stamps 80 ms apart, no load): 5/5 `[1, 1]` without the fix, 0/5 with it.
  - Stale-second-tap model: refuted (0/5).
  - After the fix, at 14f0835: 0/50 isolated, 0/3 counted, `test:all` green.
- **Files changed:**
  - `e2e/helpers/touch.ts`: `doubleTap` stamps each tap from the wall clock at its dispatch minus its monotonic age; the comment states Chromium's conversion rule and cites 7.14.
  - `e2e/helpers.spec.ts`: a new item 6 case pins the stamp source with a Node-only 150 ms `Date.now` step (gap 230 ± 2 ms); it fails on two named mutations.
- **Review (quick, 1 pass):** 6 findings, 2 medium and 4 low, all patched. None deferred, none rejected. Patches: the self-test waits 300 ms so its stamp stays in the past (it then also catches a bare-dispatch-time mutation); Final runs recorded at commit 14f0835; full failure messages and trace paths for the injection runs; the v2 reps relabelled as item 5 out-of-bound measurements.
- **Follow-up review recommended:** true (2 medium patched on a first pass). Unverified risk: the patched self-test (300 ms wait, two mutations) and the new Final-runs and item 5 records have not had a fresh reviewer's read.
- **Verification:** see Final runs.
- **Hand-offs:**
  - No entry-11 AD-17 Touch spine-sync note: there is no new export and no signature or contract change.
  - `test:screens` is not triggered.
  - tickets.toml entry 14 sync is left to the orchestrator.
  - D-64 (A7, not closed): the same clock-step mechanism with the default 80 ms `between` would give a ~0.3 % per-run hit rate, a hypothesis for D-64's owner backlog entry. The fix also applies to D-64's caller, so its rare failures may stop.
- **Residual risks:**
  - A step that falls in the few ms between Node's `Date.now()` read for a tap and Chromium's conversion still shifts that tap (~0.01 % per tap).
  - The analysis assumes Node and Chromium share the system wall clock. They do, as both run in the same WSL2 VM, and on CI.
  - The owner's WSL2 VM gains ~1.6 s per 32 s (≈5 %) between corrections. Any other test that mixes `Date.now()` with page time across a step could flake the same way; none is known.

