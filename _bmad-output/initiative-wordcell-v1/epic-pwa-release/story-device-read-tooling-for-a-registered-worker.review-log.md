# Review log — story-device-read-tooling-for-a-registered-worker.md (ticket 7.9)

State: pass 2: done

Mode: docs, thorough, max 7, budget 1500 words. Pass 0: 261 words, `story-device-read-tooling-for-a-registered-worker.review-log.passes/pass0.md`, HEAD f1f9418.
Intent carried from `epic-pwa-release/tickets.toml` entry 9 (not copied at pull; the fixer adds them to the Description in pass 1):
- interface: `device-preview.mjs` CLI (`--history`), the doc's G2/G3/G4–G6/Desktop procedures.
- tests: Device-preview seed and hint cases (`scripts/device-preview.test.mjs`).
- owns: The device-read tooling and procedure.
- consumers: Entry 11 (tailnet and desktop reads), entry 12 (production install and update read).
Refs: `_bmad-output/specs/spec-epic-7-pwa-release/` SPEC.md, rule-coverage.md, device-checks.md, release-checklist.md, build-notes.md; epic-pwa-release.md; ARCHITECTURE-SPINE.md; AGENTS.md; done-ticket plans `epic-pwa-release/*-plan.md` (7.1–7.8).

## Pass 1 — 2026-10-31
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 9, minor 8, decision-needed 0  |  Dropped in triage: 0 (duplicates merged across all four lenses)
Words (docs): 773 (3.0x pass 0; budget 1500)  |  Snapshot: story-device-read-tooling-for-a-registered-worker.review-log.passes/pass1.md  |  Fix diff: pass1.fix.diff
Fixer: all 16 items applied, no conflicts; Description split into labelled bullets; stub `dist/seed.html` removed by `npm run build` (run, exit 0, total 560704 / 600000); `WORDCELL_APP_VERSION=A|B node scripts/device-preview.mjs` unverified (needs Tailscale and the phone; env inheritance read from code).
### Applied
- [major] Description, seed-run hint — no exact text; today's line 106 ("After a new build…") contradicts CAP-7's every-seed/re-seed rule; "instead" (no-fixture run prints only the two lines) dropped (all four) → fixer item 1
- [major] Acceptance Criteria — parsing, phone URL and hints live in untestable `main()`; no pure seam, so the `--history` parse bug and a history-only run printing `/` instead of `/seed.html` go untested (all four) → fixer item 2
- [major] Description, update read — `WORDCELL_APP_VERSION=A`/`=B` builds (build-notes Device tooling) not named; footer cannot tell A from B (builder, ref, adversarial) → fixer item 3
- [major] Description, update read — entry 12 (consumer) runs G3 on production from this doc (SPEC CAP-10, release-checklist step 4); production variant not covered (ref) → fixer item 4
- [major] Description, fixture names — CLI takes bare names, ticket gives `.json` names; `--history` value form unstated (adversarial, edge; builder/ref as minor) → fixer item 5
- [major] Description, seed steps — an installed app left in recents resumes its old renderer and its AD-9 hide flush overwrites the seeded Session; seed steps must start by closing every WordCell window (edge) → fixer item 6
- [major] Description, update read — A must be a fresh install (clear site data, "Fresh install" line), site data kept only from A to B (edge) → fixer item 7
- [major] Description/AC, "`dist/sw.js` is unchanged" — untestable as written (SHA in footer changes hashed bundles); seed-page check method unstated (adversarial; builder, ref, edge as minor) → fixer item 8
- [major] Description — tickets.toml entry 9 interface/tests/owns/consumers not carried (orchestrator's carried intent) → fixer item 9
- [minor] CLI malformed args (missing/`--` `--history` value, repeated flag, extra positional, unknown flag) fail fast per rule 6; fixtures read before the build → item 10
- [minor] G5/G6 fixtures unnamed → defaults `session-won-words`, `--history history-invalid-null` → item 11
- [minor] "Desktop-row line" undefined → inline SPEC CAP-7's three clauses → item 12
- [minor] not-installed app at seeding → install through Chrome's own UI (G1) before closing the tab → item 13
- [minor] stale `dist/seed.html` on a no-fixture `--no-build` run → removed → item 14
- [minor] seed page's unregister: code and its test assertion unchanged, only comment/doc wording → item 15
- [minor] new test names carry `AD-17` like the existing cases → item 16
- [minor] "seed run" vs "a run that writes a seed page (session or `--history`)" wording → folded into item 1
### Default applied (technical)
- Test seam → exported pure helpers `parseArgs(argv)`, `seedPage({ sessionJson?, historyJson? })`, `hintLines(seeded)` / phone path; `main()` only wires them.
- Malformed CLI input → throws a usage error (rule 6).
- No-fixture `--no-build` run → deletes a stale `dist/seed.html`.
- G5/G6 seeds → `session-won-words`, `history-invalid-null`.
- "`dist/sw.js` unchanged" → verified as scope: the diff touches no `src/`, `public/` or `vite.config.ts`; seed-page absence checked by stub + `npm run build`.
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none (duplicates merged)

## Pass 2 — 2026-10-31
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 5, minor 10, decision-needed 0  |  Dropped in triage: 0 (duplicates merged)
Words (docs): 975 (3.7x pass 0; budget 1500)  |  Snapshot: story-device-read-tooling-for-a-registered-worker.review-log.passes/pass2.md  |  Fix diff: pass2.fix.diff
Fixer: all 15 items applied; items 2 and 10 conflicted (`--history h` would now be a usage error) → example name `history-x`; `WORDCELL_APP_VERSION=A npm run build` run (total 560689 / 600000) and `grep -c 'textContent=`A`' dist/assets/index-*.js` → 1, then a normal rebuild; manual `main()` checks left for the plan.
### Applied
- [major] Script bullet vs AC — new `seedPage({ sessionJson?, historyJson? })` breaks the existing string-argument cases the AC says "stay green" (fix diff, edge, adversarial; ref as minor) → fixer item 1
- [major] Script bullet `hintLines(url, seeded)` — the boolean leaves the history-only → seeded derivation (pass 1's bug) in untested `main()`; pass-1 item 2 only partly resolved (all four) → fixer item 2
- [major] AC vs Script bullet — five usage errors, `--no-build` → `build: false` and session-only parsing stated but only a missing `--history` value tested (fix diff, edge, adversarial; ref as minor) → fixer item 3
- [major] Seed steps G6 default `history-invalid-null` parses to `null`; absence must mean `undefined`, and the history-only `seedPage` case should use that fixture (adversarial) → fixer item 4
- [major] Script bullet "a no-fixture run removes any existing `dist/seed.html`" and "fixtures read before the build" — stated in `main()` with no check; the AC stub check proves only Vite's emptying (adversarial; edge as minor) → fixer item 5
- [minor] AC "the diff touches only the three files above" — fails on the build's own plan/log files → item 6
- [minor] production variant omits release-checklist step 4's second-consecutive spoiled read → item 7
- [minor] "A spoiled read is redone once" — from where (G3: from the start, A's fresh install) → item 8
- [minor] `hintLines` line layout (Ctrl+C its own last line, no blank entries) → item 9
- [minor] wrong-kind fixture (history name as positional, session name after `--history`) parses silently → item 10
- [minor] `--no-build` on B's run silently ignores `WORDCELL_APP_VERSION` → item 11
- [minor] "fresh install of A" when the tailnet app is already installed → item 12
- [minor] "only the comment/JSDoc … change" reads as freezing the usage comment → item 13
- [minor] seed tab boots the game and its hide flush rewrites the Session; close the tab promptly without playing → item 14
- [minor] `WORDCELL_APP_VERSION` build half checkable without Tailscale; plan records it → item 15
### Default applied (technical)
- `hintLines(url, parsed)` takes `parseArgs`' result and derives seeded itself.
- Existing `seedPage` cases ported to `{ sessionJson }`, assertions kept; a non-JSON `historyJson` throws too.
- Absent fixture = `undefined`; history-only `seedPage` case uses `history-invalid-null` (stores `"null"`).
- Stale-seed removal and read-before-build → plan-recorded manual checks (no new helper).
- Wrong-kind fixture → usage error (`session-` positional, `history-` value).
- `--no-build` with `WORDCELL_APP_VERSION` → doc says B's run builds (no new check).
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none
