---
title: 'Preferences and motion'
type: 'feature'
ticket: '10'
created: '2026-10-01'
baseline_revision: '77844fc6e8f3dcb6e68d3b040bbf711ef324cc3b'
status: 'built'
route: 'full'
route_source: 'auto'
review: 'thorough'
review_source: 'auto'
lenses_ran: ['blind-hunter', 'edge-case-hunter', 'verification-gap', 'intent-alignment']
review_loop_iteration: 0
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/initiative-wordcell-v1/epic-app-shell/story-preferences-and-motion.md'
  - '{project-root}/_bmad-output/specs/spec-epic-3-app-shell/build-notes.md'
warnings: ['oversized']
deferred: []
---

<intent-contract>

## Intent

**Problem:** `wordcell:prefs` has no owner: no parser, defaults, setters, motion source or CSS mirror, and `loaded()`/`current()` and the Q-38 stale check ignore it (ticket 3.10, CAP-9, AD-7, AD-10).

**Approach:** Add `src/shell/prefs.svelte.ts` modelled on `history.svelte.ts`, `src/ui/motion.ts` as the only duration source, wire prefs into `main.ts` boot, `game.svelte.ts` (`loaded`/`current`/`staleOwners`) and the test-hook types, plus two fixtures, shell/UI Vitest and an android Playwright spec. The ticket file is the full intent; this plan pins what it leaves open.

## Boundaries & Constraints

**Always:**
- Ticket Description, Interface, Tests and Acceptance Criteria bind as written; build-notes CAP-9 and Test hook; AGENTS.md rules 1–7 and conventions (test names: shell/UI Vitest `AD-n`, Playwright per ticket ids).
- `prefs.svelte.ts` touches no browser global at import; reads `game.state` only inside functions (import cycle as `history.svelte.ts`). Uses bare `matchMedia(...)` (global, = `window.matchMedia` in browsers) and `document.documentElement.style.setProperty`; tests stub `matchMedia` with `vi.stubGlobal('matchMedia', …)` (the `window` stub stays a bare EventTarget).
- Setter order: state check (throw `Error('AD-15 <setter>() while <kind>')` while `halted` or `booting`) → same-value no-op → `write(PREFS_KEY, JSON.stringify({ version: 1, animationSpeed, showTimer }))` → `lastText` → in-memory value → mirror. A throwing write propagates (rule 6) with lastText, value and the mirror unchanged. Setters work while the game store is `rejected`: AD-4's "nothing written while rejected" binds the Session/history writes; prefs follow AD-10.
- Boot: `main.ts` calls `prefs.load()` right after `await fontCheck()` returns and before `game.load()`, also when halted during the font check; a throwing font check runs neither load.
- Unit suite not slower than the baseline beyond run-to-run noise (baseline below).

**Never:**
- No change to `src/engine/`, the deal, the Session/history formats, or `SESSION_VERSION`.
- No default for `--wc-base-ms`/`--wc-reduced` in `app.css` (the mirror is unset before `prefs.load()`; nothing before mount relies on it); no animation consumes `motion.ts` yet (epic 5); no Settings UI (epic 6).
- No `localStorage` outside `storage.ts`; no message or dialog for unreadable prefs (Q-36).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Absent | no key | value defaults `normal`/`false`, `loaded()` null, nothing written, not stale | — |
| Valid | `prefs-non-default.json` | value = parsed, baseMs 320, `--wc-base-ms` `320ms` | — |
| Unreadable | `'x'`, `null`, `[]`, `{}`, version −1, 1.5, `'1'` | `version-unreadable`; defaults; key untouched | silent (Q-36) |
| Unknown version | version 2 | `{ reason: 'version-unknown', version: 2 }`; defaults | silent |
| Bad contents | missing/extra field, `'turbo'`, showTimer `'true'` | `{ reason: 'contents-unreadable', version: 1 }`; defaults | silent |
| Change on unreadable | first changing setter | full valid object written | — |
| Same value | setter with in-memory value (incl. `'normal'` on unreadable) | no write | — |
| Halted / booting | any setter call | throws, writes nothing | AD-15 |
| Reduced | matchMedia matches / `change` | `motion.reduced` and `--wc-reduced` track it; baseMs unchanged | — |

</intent-contract>

## Code Map

- `src/shell/history.svelte.ts` -- the pattern to copy: `lastText`, `launch` (undefined until load; `load()` twice throws), `rejectReason`, `isStale()` = `read(KEY) !== lastText`, `reset()`'s halted/booting throw, exported object with getters.
- `src/shell/storage.ts` -- `PREFS_KEY`, `read`, `write` already exist.
- `src/shell/game.svelte.ts` -- `Loaded` (add `prefs: LoadedPrefs`), `Current` active variant (add `prefs: Prefs`), `loaded()`/`current()` (`prefs.loaded()`, `prefs.value`), `staleOwners()` (OR `prefs.isStale()`), header comment ("entry 10 adds/extends" wording → present tense).
- `src/main.ts` `boot()` -- `await fontCheck(); prefs.load(); game.load();`; update the AD-16 comment.
- `src/shell/test-hook.ts` -- unchanged (delegates to `game`). `e2e/globals.d.ts` -- add an inline `Prefs` type and `PrefsRejectReason` (`{ reason: 'version-unreadable' } | { reason: 'version-unknown' | 'contents-unreadable'; version: number }`) declared inline (not derived from engine types), `loaded().prefs: Prefs | null | { rejected }`, active `current().prefs: Prefs`.
- `src/shell/game.svelte.test.ts` -- `setup()` (~100–143): stubs; `active()`; exact-equality `loaded()`/`current()` assertions (lines ~192–1026, grep `history: EMPTY`, `history: null`, `REJECT_LAUNCH`, `HALTED` launch table ~564) gain `prefs`. Test 'AD-4 the store starts booting and importing it reads no storage' (~170) must not load prefs.
- `e2e/blocking.spec.ts` (~232, ~282, ~311), `e2e/game-store.spec.ts` (~62, ~269) and any other exact `loaded()`/`current()` equality in `e2e/` -- gain prefs. ~311 (page 2 writes `'{}'` during the font check) expects `prefs: { rejected: { reason: 'version-unreadable' } }`.
- `e2e/helpers/seed.ts` (`seedStorage({ prefs })`, `fixture`), `e2e/helpers/lifecycle.ts` (`hidePage`), android skip pattern at `e2e/game-store.spec.ts:7`.

## Tasks & Acceptance

**Execution:**
- [x] `src/shell/prefs.svelte.ts` -- new store per Design Notes 1 -- AD-10, Q-36.
- [x] `src/shell/game.svelte.ts` -- wiring per Code Map -- AD-17, Q-38.
- [x] `src/main.ts` -- boot call per Boundaries -- AD-16.
- [x] `src/ui/motion.ts` -- new, Design Notes 2 -- AD-10.
- [x] `fixtures/prefs-non-default.json`, `fixtures/prefs-unreadable.json` -- exact contents from the ticket Interface.
- [x] `src/shell/game.svelte.test.ts` -- `setup()` gains option `prefs?: string` (seeds `wordcell:prefs`) and `loadPrefs?: boolean` (default true; false only in the import-safety case), `document.documentElement.style` (map-backed `setProperty`/`getPropertyValue`) and a stubbed global `matchMedia` (matches false, overridable, `change` fireable); calls `prefs.load()` after the imports; returns `prefs`. Update exact assertions. Add `AD-4` cases: own `setShowTimer(true)` then persisted pageshow stays active; outside `setItem(PREFS_KEY)` then persisted pageshow halts another-window; prefs seeded, outside `removeItem` then persisted pageshow halts.
- [x] `src/shell/prefs.svelte.test.ts` -- new; setup copied (trimmed) from game.svelte.test.ts; every ticket "AD-10 shell Vitest" case named `AD-10 …`, plus: a throwing setter write leaves storage, `prefs.value`, `lastText` (`isStale()` false) and the mirror unchanged; rejected-state write asserts storage and `prefs.value` (not `current()`). parsePrefs cases share one import (`beforeAll`) to keep the suite fast.
- [x] `src/ui/motion.test.ts` -- `vi.mock('../shell/prefs.svelte')` with a mutable `prefs.motion`; `AD-10 motion durations …` per kind at 90/180/320 and reduced, plus `stagger()`.
- [x] `e2e/globals.d.ts`, `e2e/blocking.spec.ts`, `e2e/game-store.spec.ts` (+ any other exact equality found by grep) -- prefs fields.
- [x] `e2e/prefs.spec.ts` -- new android spec, Design Notes 3.

**Acceptance Criteria:**
- Given the ticket Acceptance Criteria, when `e2e/prefs.spec.ts` runs on android, then each bullet passes under the test names of Design Notes 3.
- Given the ticket's Tests list, when `npm run test` runs, then every listed shell/UI Vitest case exists and passes.
- Given the change, when `npm run test:all` runs, then it exits 0, and `npx vitest run` Duration is not worse than the baseline beyond noise.

## Implementation Notes

- Baseline unit suite (HEAD 77844fc6e8f3dcb6e68d3b040bbf711ef324cc3b, `npx vitest run` twice): 5.78 s, 5.81 s; 32 files, 1612 tests.
- Review-log disposition (Result: converged, no open major). Unapplied minors: (1) globals.d.ts prefs rejects declared inline → Code Map; (2) bare `matchMedia` pinned, stubbed via `vi.stubGlobal` → Boundaries; (3) `loadPrefs` setup option → Tasks; (4) R-76 vs §7.10 names split → Design Notes 3; (5) removal case seeds prefs first → Tasks; (6) boot "always" defined → Boundaries; (7) setters vs AD-4 rejected → Boundaries; (8) "halted or booting" → Boundaries (ticket file not edited: the build never writes ticket files); (9) byte-identical = the seeded fixture text → Design Notes 3; (10) `expect.poll` for the live toggle → Design Notes 3; (11) getComputedStyle is the reading helper, not a test → Design Notes 3; (12) no app.css default → Never; (13) throwing setter write → prefs.svelte.test.ts case.

## Plan Change Log

## Review Triage Log

### 2026-10-01 — Review pass
- verdicts: 18 findings — high 0, medium 0, low 16, false 2, maybe-false 0 (blind 12, edge 1, verification-gap 0, intent-alignment 5)
- findings:
  - `[low]` `[patch]` Blind: Q-36 e2e checks only `getByRole('dialog')`; the Blocking message is `alertdialog` (`BlockingMessage.svelte:26`) — added an `alertdialog` count 0 assertion.
  - `[low]` `[patch]` Blind: `FIELDS` hand-sorted and compared index-wise; an out-of-order edit silently rejects every pref — derived from `Object.keys(DEFAULTS).sort()`.
  - `[low]` `[patch]` Blind: version 0 and an unsafe integer untested in parsePrefs — added both inline cases.
  - `[low]` `[reject]` Blind: mirror-before-mount not observed in e2e — the order is three adjacent lines in `main.ts` boot; a MutationObserver harness is more machinery than the risk; the halted-during-font-check case already proves `prefs.load()` runs before `game.load()`.
  - `[low]` `[reject]` Blind: plan lacks verification evidence — fix is editing this build's plan (filled at Finalize anyway).
  - `[low]` `[patch]` Blind: `game.svelte.test.ts` setup returns `style`/`media`/`queries` and a `reducedMotion` option no test uses — the import-safety case now asserts no matchMedia query and no style write; unused pieces dropped.
  - `[low]` `[reject]` Blind: `e2e/prefs.spec.ts` wraps the hook locally instead of `e2e/helpers/` — existing specs (game-store, blocking) follow the same local-wrapper pattern; no named divergence.
  - `[low]` `[patch]` Blind: Q-36 e2e re-checks less after reload — re-asserts `loaded().prefs` rejected and `current().prefs` defaults after reload.
  - `[low]` `[reject]` Blind: setter before `prefs.load()` with the game active is unguarded — unreachable: `main.ts` always loads prefs before `game.load()`; a guard adds a branch for a state no caller produces.
  - `[low]` `[patch]` Blind: "load() called twice" assertion hidden in the absent-key case — moved to its own `AD-10 load() called twice throws` case.
  - `[low]` `[patch]` Blind: `src/main.ts:94` comment 115 columns — rewrapped to 100.
  - `[low]` `[patch]` Blind: `set(setter: string, …)` loose type — typed as the two setter names.
  - `[low]` `[patch]` Edge: alertdialog missed by the Q-36 "silently" test — same root cause and fix as the first row.
  - `[low]` `[reject]` Intent: setters and overwrite-on-change exercised only through shell Vitest — no UI can change a pref until epic 6; the ticket's Acceptance Criteria use seeded fixtures.
  - `[low]` `[reject]` Intent: written §7.10 format asserted only under AD-10 shell names — no UI write path exists in this ticket; Playwright cannot produce a write; the format is pinned by the setter cases.
  - `[false]` `[reject]` Intent: R-76 bullet split across an R-76 and a §7.10 test — the split is the review log's unapplied minor (rule-coverage R-76 row covers Show timer only); every bullet assertion still runs on android.
  - `[low]` `[patch]` Intent: Q-36 `dialog` locator narrower than "no message" — same root cause as the first row; fixed by its `alertdialog` assertion.
  - `[false]` `[reject]` Intent: boot timing untested beyond blocking.spec — not a divergence the intent requires a test for; ordering is in `main.ts` and the halted-boot case covers the always-runs reading.

## Design Notes

1. `prefs.svelte.ts`: `export type Prefs = { readonly version: 1; readonly animationSpeed: 'fast'|'normal'|'slow'; readonly showTimer: boolean }`; `export function parsePrefs(text)` returning `{ ok: true, prefs } | { ok: false, reason: 'version-unreadable' } | { ok: false, reason: 'version-unknown' | 'contents-unreadable', version: number }` (catch `JSON.parse`; plain object = non-null, non-array object; own `version` that is a safe integer ≥ 0; exact own key set; enum and boolean checks); `PrefsRejectReason`, `LoadedPrefs`. State: `value = $state.raw<Prefs>(DEFAULTS)`, `reduced = $state(false)`, `motion = $derived({ baseMs: BASE_MS[value.animationSpeed], reduced })` with `BASE_MS = { fast: 90, normal: 180, slow: 320 }`. `load()`: read, `lastText`, parse, `launch` (`result.prefs` | null | `{ rejected }`), value, `const query = matchMedia('(prefers-reduced-motion: reduce)')`, `reduced = query.matches`, `query.addEventListener('change', e => { reduced = e.matches; mirror(); })`, `mirror()`. `mirror()` sets `--wc-base-ms` `${baseMs}ms` and `--wc-reduced` `'1'|'0'` on `document.documentElement.style`. Export `prefs = { get value, get motion, load, loaded, setAnimationSpeed, setShowTimer, isStale }`.
2. `motion.ts`: `export type MotionKind = 'snap'|'flyBack'|'parting'|'undoRedo'|'flyToCell'|'overlay'`; factors 1, 1, 0.5, 1, 2, 1 × `prefs.motion.baseMs`; reduced → 120 except `parting` 0; `stagger()` 30, reduced 0. Header comment cites AD-10 and EXPERIENCE.md Motion.
3. `e2e/prefs.spec.ts` (android only; `cssVar(page, name)` helper reading `getComputedStyle(document.documentElement).getPropertyValue(name)`; "byte-identical" = equal to the seeded `fixture(...)` text):
   - `§7.10 non-default prefs set 320ms and survive New game and reload` (session-gave-up + prefs-non-default);
   - `§7.10 non-default prefs survive Undo and Redo` (session-place);
   - `Q-36 unreadable prefs give the defaults silently and stay untouched` (incl. hidePage + reload);
   - `R-76 a first launch has Show timer off` (loaded().prefs null, current().prefs.showTimer false);
   - `§7.10 a first launch uses Normal speed and writes no prefs` (animationSpeed 'normal', 180ms, key absent after hidePage);
   - `§7.10 New game without stored prefs writes none` (session-gave-up alone);
   - `AD-10 reduced motion follows the media query live` (emulateMedia 'no-preference' before goto, toggles via `expect.poll`, baseMs 180ms under reduce);
   - `AD-10 reduced motion at launch sets --wc-reduced 1` (emulate 'reduce' before goto).

## Verification

**Commands:**
- `npx vitest run` (twice) -- expected: all pass; Duration recorded, not worse than 5.78–5.81 s beyond noise.
- `npx playwright test e2e/prefs.spec.ts --project=android --repeat-each 3` -- expected: pass.
- `npm run test:all` -- expected: exit 0.
- `git diff --stat 77844fc6e8f3dcb6e68d3b040bbf711ef324cc3b -- src/engine` -- expected: empty.

## Auto Run Result

- **Summary:** `wordcell:prefs` now has an owner, `src/shell/prefs.svelte.ts`. It provides `parsePrefs`, the AD-7 defaults, the silent Q-36 handling, setters that write at once (they throw while the game is halted or booting and work while it is rejected), `motion` derived from prefs plus a live reduced-motion listener, a root CSS mirror of `--wc-base-ms`/`--wc-reduced`, and `isStale`. `src/ui/motion.ts` is the single source of animation durations. Prefs are wired into the `main.ts` boot (after the font check, before `game.load()`), into `game.loaded()`/`current()`, and into `staleOwners()`.
- **Files:**
  - `src/shell/prefs.svelte.ts`: the new store.
  - `src/ui/motion.ts`: `duration(kind)` and `stagger()`.
  - `src/shell/game.svelte.ts`: prefs in `Loaded`/`Current` and `staleOwners`.
  - `src/main.ts`: the `prefs.load()` boot call.
  - `fixtures/prefs-non-default.json`, `fixtures/prefs-unreadable.json`: the two new fixtures.
  - `src/shell/prefs.svelte.test.ts`: the new AD-10 shell Vitest.
  - `src/ui/motion.test.ts`: the new AD-10 UI Vitest.
  - `src/shell/game.svelte.test.ts`: the setup stubs, the `loadPrefs` option, prefs in exact assertions, and three AD-4 pageshow cases.
  - `e2e/prefs.spec.ts`: the new android spec, 8 tests.
  - `e2e/globals.d.ts`: the Prefs types.
  - `e2e/blocking.spec.ts`, `e2e/game-store.spec.ts`: prefs in exact assertions.
- **Review:** one thorough pass (blind 12, edge 1, verification-gap 0, intent 5; 18 rows).
  - 8 low entries patched: the alertdialog check, the Q-36 post-reload re-checks, `FIELDS` derived, the setter-name type, the version-0 and unsafe-integer cases, the load-twice case split out, the import-safety case asserting no matchMedia call or style write, and the `main.ts` wrap.
  - 0 deferred.
  - 8 rejected: 6 low, reasons in the triage log (mirror-before-mount e2e, a plan-edit finding, local hook wrappers, the setter-before-load guard, setters exercised only in shell tests, the written format only under AD-10 names); 2 false (the R-76 split, the boot-timing test).
- **Follow-up review recommended:** false. Patched entries: high 0, medium 0, low 8.
- **Verification:**
  - `npm run test:all`: exit 0 after the patches (Vitest 34 files / 1654 tests; dev-server e2e 156 passed; dist-smoke and pwa suites passed).
  - `npx playwright test e2e/prefs.spec.ts --project=android --repeat-each 3`: 24/24.
  - `git diff --stat <baseline> -- src/engine`: empty.
- **Unit-suite time (AD-17):** the baseline was 5.78 s and 5.81 s (HEAD, two runs at the start). Later the machine got slower, so the baseline (a worktree at HEAD) and this change were measured interleaved in the same session.
  - Baseline: 7.79, 7.69, 7.94, 7.77, 6.77, 5.66, 6.43 s (mean 7.15).
  - With the change: 7.60, 7.87, 7.69, 7.64, 6.12, 5.93, 5.90 s (mean 6.96).
  - Inside `test:all`: 6.56 s.
  - Not worse. Still above AD-17's 5 s budget, which was already the case before this change.
- **Review-log disposition:** no open major. All 13 unapplied minors are resolved in this plan; see Implementation Notes.
- **Residual risks:**
  - The ticket text still says "a write while halted throwing"; the code throws while halted or booting, per the review-log minor. The ticket file was not edited.
  - No stylesheet consumes `--wc-base-ms`/`--wc-reduced` yet (epic 5/6).
