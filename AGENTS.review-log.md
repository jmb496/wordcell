# Review log — AGENTS.md

Target: `AGENTS.md` (bmad-project-context block, adoption of CLAUDE.md)
Refs: CLAUDE.md, ARCHITECTURE-SPINE.md, docs/game-flow-spec.md, docs/development-methodology.md.
Pre-loop state: HEAD `8793159` plus uncommitted AGENTS.md (new), CLAUDE.md (reduced to `@AGENTS.md` + Commands + BMAD), README.md pointer.
Deviation: decision-needed items are kept in this log, not appended to AGENTS.md (the managed block has no open-questions table).

## Pass 1 — 2026-09-27
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 9, minor 14, decision-needed 1 (after merging 53 raw findings)  |  Dropped in triage: 3
### Applied
- [major] Running — "ticket done when test:all passes" vs methodology Definition of done → test:all gates `built`; owner marks done
- [major] CLAUDE.md Commands vs AGENTS.md — scripts that don't exist yet listed as current → CLAUDE.md lines marked "(epic 1)"; AGENTS.md duplicate clause dropped
- [major] Policy deal line — golden test doesn't exist; file-freeze wording blocked the LangData delta → rule on dealt output; epic 2 adds the test
- [major] Rule 6 — "one exception" vs AD-15 specified outcomes, Q-40, AD-7 → specified outcomes are values; prefs the one silent default
- [major] Rule 2 — vs AD-9 `registerBeforeHide` → named as the one sanctioned shell→UI hook
- [major] Conventions — per-rule "done" weaker than spec per-sentence coverage → per-sentence wording; AD-n naming for AD-only tests
- [major] Layer table — read as whitelist forbidding npm packages/assets → cross-layer-only note
- [major] Single owners — player-visible strings broader than spine → message-catalogue strings, with the formatting rules
- [major] Pitfall `history` — overbroad vs AD-17 object keys → variable/import binding only
- [minor] test-file exemption, exempt sentences defined, Map fallback, mirror cross-ref, Q range removed, "Testing expectations" mapping, restored "exhaustive"/`toHaveScreenshot`/Node 24, New game/Replay createSession, build-auto commit ask, dontCacheBust moved to Conventions, rule 5 target note, WSL path, Numbers convention
### Decision needed
- Core row / dictionary repro cases — where do they live and how may they load `generated/dictionary/en.txt` under AD-1's engine-test import rule? — proposed default: leave to the epic 2 spec; the block adds nothing until then
### Dropped
- "tickets that change visuals run test:screens" — not stated in any ref (invented requirement)
- App version convention — epic spec material; not a cross-component rule a builder gets wrong
- Move the user-named pitfalls (3–23, `history`, `data-mirror-of`) out of Known pitfalls — the owner asked for them as pitfalls; they trace to spine review passes

## Pass 2 — 2026-09-27
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 7, minor 11, decision-needed 3 (after merging 34 raw findings)  |  Dropped in triage: 2
### Applied
- [major] Rule 2 — `registerBeforeHide` "the one sanctioned shell→UI hook" vs AD-13 nav registrations → scoped to the store; nav receives UI-registered callbacks; shell never imports ui
- [major] Rule 6 — SW/precache failures still reach the AD-15 handler in dev/test (Q-40) → stated
- [major] Running — TODO omitted `test:screens`, `test:e2e:pwa`, the two configs and `testIgnore`; a screens spec would run on the host → named; no screens specs until they exist
- [major] Single owners / `history` pitfall — unscoped, forbade e2e helpers AD-17 requires → scoped to `src/**`
- [major] Deal line — "identical to 785c0f6" untestable before epic 2 while the LangData delta touches the deck → golden test added first; owner for layout change; SESSION_VERSION after v1
- [major] Single owners — lifecycle listeners (AD-9), `wordcell:prefs` (AD-10), `cancel()` first (AD-12) missing → added
- [minor] rule 1 points at AD-1 list and exempts engine tests; `persist()`/`navigator.storage`; one-writer scoped outside engine and tests; Map `src/` prefix and directory fallback; `history.*` chains; `version` in Session; scaffold tests not id-named; spec as rules source in Orientation; CLAUDE.md `test:all` screenshot note restored
### Decision needed
- scripts/ tests — where do tests of `scripts/*.mjs` live and which runner collects them (Vitest includes only `src/**/*.test.ts`)? — proposed default: leave to the epic 1 spec
- Test naming — how are shell/UI Vitest tests named when they relate to an R-id but do not count as coverage? — proposed default: start with the AD-n they verify
- Rules 1–7 location — they are human-owned and cited by number but sit inside the managed block, which refresh replaces — proposed default: move them outside the markers in AGENTS.md
### Dropped
- "`desktop` too" ambiguity — mirrors AD-17's own wording ("also on `desktop`")
- Scaffold pitfall lacks an observed mistake — kept: it is a repo-verifiable gap that stops agents copying scaffold shape; retire when epic 1 lands

## Pass 3 — 2026-09-27
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 5, minor 14, decision-needed 0 (after merging 25 raw findings)  |  Dropped in triage: 1
### Applied
- [major] Rule 7 — `bmad-build` also commits locally → both skills named as the ask
- [major] Architecture pointer — Map lookup never reached AD-14/AD-15 → read every AD whose `Binds:` or Map row covers the file
- [major] Test split — whole-rule "(UI)" tags (R-14, R-65, R-73) omitted → included
- [major] Rule 6 — "one silent default" vs AD-7 absent-key defaults → prescribed handling is a specified outcome; prefs the one silent default for unreadable data
- [major] Single owners — score-history owner and flush scope missing → added (AD-6, AD-9)
- [minor] full AD-1 History member list + `popstate`; test exemption scoped to localStorage/History only; hide flush in the `cancel()` list; CSS transitions use `--wc-base-ms`; New game/Replay per AD-4; "once v1 ships"; spec wins over spine; unit/watch timing; other CLAUDE.md citations map here; versioning line (both constants) moved to Conventions; smoke.spec scaffold note; TODO retirement trigger; rule 4 hit-rect note
### Decision needed
- none new
### Dropped
- TODO duplicated between AGENTS.md and CLAUDE.md "(epic 1)" markers — removing either copy reintroduces the pass-1 contradiction while the command list stands; settles with the command-list decision

## Result — capped at 3 passes
Majors per pass: 9 → 7 → 5 (pass 3 majors were fixed by the final fixer but not re-reviewed). The late majors were scope and completeness of single-owner and lookup rules against the spine, not contradictions in the block's intent.

## Owner decisions — 2026-09-27
Jared accepted every proposed default.
- D1 dictionary repro location → epic 2 spec; no block change
- D2 `scripts/*.mjs` tests → epic 1 spec; no block change
- D3 shell/UI Vitest tests start with the AD-n they verify, even when an R-id relates → Conventions, test names
- D4 rules 1–7 moved above the managed block as hand-maintained "Architecture rules"
- D5 CLAUDE.md command list deleted (ground 4); non-obvious command facts stay in the block
- D6 block size accepted; trim after epic 1 retires the TODO and scaffold pitfall
