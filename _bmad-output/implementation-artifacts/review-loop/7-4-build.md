# Review loop — ticket 7.4 build (precacheComplete() test hook), code mode

State: pass 1: done

Target: commit range `8e132f0..HEAD` (9fb2731), diff at `7-4-build.passes/pass0.diff` (excludes `_bmad-output/`)
Intent: `_bmad-output/initiative-wordcell-v1/epic-pwa-release/story-precachecomplete-test-hook-plan.md` (and its story file)
Depth: quick (correctness + verification gap; fix diff from pass 2) | max 7
Pre-loop: HEAD 9fb2731, tree snapshot 0 a5553c846b06c212804f078dfe59dc91ac1dd01f
Extra scope: the dev `AD-15 AD-17` halt test (`e2e/test-hook.spec.ts`) and the pwa test's un-halted check (`e2e/pwa/test-hook.spec.ts`), added after the build's own review lenses ran.

## Pass 1 — 2026-10-30
Reviewers: correctness, verification gap (both told to read the dev `AD-15 AD-17` halt test and the pwa un-halted check)  |  Findings: major 0, minor 3, decision-needed 0  |  Dropped in triage: 0
Snapshot: tree a5553c846b06c212804f078dfe59dc91ac1dd01f (no fix pass)
### Applied
- none (zero majors: stopping rule met before the fix step)
### Default applied (technical)
- none
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none
### Minors (confirmed in triage, not applied)
- `e2e/pwa/test-hook.spec.ts` `AD-17 precacheComplete() polls to true …` — the `current().kind` / `errors` un-halted check runs before the recomputes started by the last poll calls settle, so a one-off late rejection would be missed (a kept URL-promise rejection is still caught, since the poll never reaches `true`). Fix: move both assertions after the `precacheMissing` evaluate, or settle first as the dev test does (awaited `getRegistration()` plus a macrotask).
- `src/shell/test-hook.test.ts` `AD-17 importing calls nothing…` — only the hook module's own import is shown to start no recompute; nothing fails if `main.ts` or `sw.ts` calls `recomputePrecacheComplete()` at boot or on activation (story: "in `src/` called only, with `void`, from the env-gated block"). Fix: a source-scan assertion (e.g. in a `src/architecture-*.test.ts`) that the name appears under `src/` only in `src/shell/test-hook.ts` and its test.
- `e2e/helpers.spec.ts` `AD-17 precacheMissing …` — the case runs at `/`, where the page URL and `/sw.js` give the same resolution base, so a helper that resolved against `location.href` would pass. Fix: `goto` a nested path (e.g. `/play/x`) before the cache setup.

Halt assertions added after the build's lenses: both read in pass 1. The dev `AD-15 AD-17` test replaces the page's `getRegistration` with a rejecting one, calls the accessor and waits for `halted` with the alertdialog description `AD-17 test`, so it fails if the accessor caught the rejection or if another error caused the halt; no major. The pwa un-halted check is the first minor above.

## Result — converged after 1 pass
Final state (HEAD 9fb2731, unchanged): `npm test` 91 files / 3713 passed; `npm run lint` clean; `npm run check` 0 errors.
Unapplied minors: the three listed under Pass 1.
