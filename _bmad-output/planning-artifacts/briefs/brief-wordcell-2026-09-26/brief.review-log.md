# Review loop log — brief.md

Target: `_bmad-output/planning-artifacts/briefs/brief-wordcell-2026-09-26/brief.md`
Mode: docs · max 4 · depth thorough · refs: `docs/game-flow-spec.md`, `docs/requirements-carryover.md`,
`docs/platform-decision.md`, `CLAUDE.md`. Pre-loop state: `d40c2bc` (repo), pass-0 copy in scratchpad.
Before the loop the brief had the product-brief skill's own polish pass (bmad-review structure + prose).

## Pass 1 — 2026-09-26 20:40
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 7, minor 16, decision-needed 2  |  Dropped in triage: 0 (about 10 duplicates merged)
### Applied
- [major] §7 / §9 — keyboard shortcuts in scope but the set has no definition and no owner → set named a UX deliverable; added to bmad-ux list
- [major] §6.5, §6.6, §4 — "reproducible from Session alone" / "any bug is a session string" false for Validate (dictionary as data, R-38), the clock (R-76) and UI/drag bugs (R-14) → scoped to rule/state bugs; commands are pure functions of Session plus explicit data
- [major] §3 — "Session … replayed and never stored" contradicts R-73 → Session persisted whole; positions replay-derived
- [major] §6.4 — one passing test per R-id lets mixed (UI)/engine rules pass with UI sentences untested → per-sentence criterion, both suites for mixed rules
- [major] §9 — bmad-ux "owns" list reads exhaustive but omits end screen, stats view, version/reset messages, confirmations, preferences, Place screen → lead reworded, surfaces added
- [major] §7 — spec §7 listed as scope though the spec calls it a proposal → fixed items (R-14, Q-22, Q-23, CLAUDE.md rule 4, 44 px) separated from advisory rest
- [major] §8 / §9 — Play Store timing has no default in platform decision §5 yet the brief resolved it untagged → tagged [ASSUMPTION], A-7, §9 corrected
- [minor] ×16 — CLAUDE.md rule 1 quoted verbatim; Q-17 vs carryover §5 citation; misdrop/lost drop and "full game" defined; 600 KB budget given codec and measurement; R-73 criterion broadened to hardest boundary with Playwright proxy; hosting/deploy scope bullet; "a test per R-id"; R-39 cited for no Cancel; "a candidate" sprite sheet; empty-destination note; self-drop wording (R-21); qualitative label on §6.1 and proxy on §6.7; QU ×2 indicator in scope; "every engine rule" in §1; §1 word description per R-30; app-shell duties in architecture handoff; "never became reliable" replaced by the carryover fact; "one thumb" tagged [ASSUMPTION] A-8
### Decision needed
- §4 / §6.6 — does v1 need a player-visible "copy session" affordance for bug reports? — proposed default: no product feature; read local storage via Chrome remote debugging (added to brief §11 as D-1, PROPOSED BY REVIEW)
- §4 — is one-handed thumb play a layout goal for UX? — proposed default: yes (tagged A-8 in the brief's assumptions table)
### Dropped
- none; duplicates across lenses merged into the rows above

## Pass 2 — 2026-09-26 21:05
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 5, minor 17, decision-needed 2  |  Dropped in triage: 0 (about 12 duplicates merged)
### Applied
- [major] §7 — "the rest of spec §7 is advisory" (introduced in pass 1) made binding items optional: Q-23 flip button, R-14 placeholder slot (§7.7), R-33 tray-tile removal (§7.2), R-76/§7.10 preference storage → fixed list extended; clause now "items not cited by an R-id or Q-id are advisory"
- [major] §6.4 — "every untagged sentence … Vitest" unsatisfiable for process/provenance sentences (R-02, R-37, R-85) → scoped to sentences stating engine behaviour; exempt sentences named in the ticket plan; sentence-to-test mapping checked at review
- [major] §6.8 — budget boundary undefined (precache traffic, lazily loaded dictionary, gzip vs brotli) and art not in the estimate → measured from navigation until Validate can succeed, gzip on the production build, art counted; A-4 reworded
- [major] §3 — "every rule lives in a pure engine with a test per R-id" contradicts §6.4 and the spec preamble → untagged sentences in the engine (Vitest), (UI) sentences in the shell (Playwright)
- [major] §6.3 — misdrop/lost-drop definitions hard-coded a targeting algorithm the brief hands to UX, and counted drags the spec says open no tray → defined against the UX-confirmed overlap rule, restricted to Idle while playing, minimum five committed words per game; overlap rule added to bmad-ux list
- [minor] ×17 — both Playwright projects green with desktop-only behaviours on the desktop project; unit-suite bounds (5 s / 1 s) and "every ticket, every epic"; "per-language data"; A-8 surfaced in §9; Show timer default off (R-76, Q-13); tap-to-select/tap-to-drop wording; R-75 boundaries in §3 step 5; "short serialised Session" replaces 200 bytes; WordCell add gesture per UX; Svelte 5 removed from leftovers; Q-17 vs §7.8 wording; language data in engine argument list; all Session fields in §6.2; native install prompt tagged A-9; D-1 default notes secondary players
### Decision needed
- §1/§3/§7 — which browsers beyond Chrome on Android must v1 support? — proposed default: Android Chrome required and tested on device; desktop Chromium via Playwright; desktop Firefox/Safari best-effort; iOS untested (brief §11 D-2)
- §4/§7 — in-app rules / how-to-play page in v1? — proposed default: yes, one static page with the legacy rulebook text and worked example, no tutorial (brief §11 D-3)
### Dropped
- none
### Note for the refs
- The spec preamble's "every untagged sentence by an engine unit test" has the same overreach as §6.4 had (R-02, R-37, R-85 contain untestable process sentences); consider softening it in `docs/game-flow-spec.md`.

## Pass 3 — 2026-09-26 21:35
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 5, minor 14, decision-needed 0  |  Dropped in triage: 0 (about 8 duplicates merged)
### Applied
- [major] §6.4 — untagged app-shell sentences (R-38, R-76, R-84, spec §2) fit no test bin, id-less behaviour (spec §2, Q-24) cannot "name the R-id", and the exemption departs from the spec preamble untagged → shell sentences get Playwright tests, naming rule for id-less sentences, exemption tagged [ASSUMPTION] A-10 with a note that the spec preamble should be amended
- [major] §6.8 / §9 — Validate before the dictionary has loaded is undefined and unowned → handed to bmad-ux (control state) and bmad-architecture (precache, fail-fast on load failure)
- [major] §6.3 — misdrop defined against the overlap rule was tautological and unmeasurable on device (pass-2 overcorrection) → defined by Jared's intent at the drop, drags only, timed "before v1 is declared done"; A-3 quotes it
- [major] §6.2 — score history not covered, activeMs comparison point and reload-without-hide missing → Session and score history restored as last saved; finish-undone-reload boundary added
- [major] §9 — add-free-letter gesture deferred to UX in §3 but never handed over → added with R-14/R-65 coexistence and Q-31 insertion note
- [minor] ×14 — animation speed values and default owner; single measurement method for the 600 KB budget (script over dist/); §6.6 judgeable form; §6.9 non-vacuous form; §7.10 attribution; CI/deploy in architecture handoff; second-language wording; persistent controls and invalid-word message in UX list; timing bounds tagged A-11; replay needs language data; §3 per-sentence wording; D-3 default rewritten to match the spec, not the legacy rulebook
### Decision needed
- none new
### Dropped
- none
### Note for the refs
- Third pass still produced real majors, almost all in §6 success criteria that earlier fixes made more precise. The recurring ref problem is the spec preamble's coverage rule ("every untagged sentence by an engine unit test"), which does not fit app-shell or process sentences; A-10 proposes the amendment. The brief's §6 is also now spec-like in detail; the owner may prefer to trim it once A-3/A-4/A-10/A-11 are answered.

## Pass 4 — 2026-09-26 22:10
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 3, minor 14, decision-needed 0  |  Dropped in triage: 0 (about 9 duplicates merged)
### Applied
- [major] §3 — engineering-shape paragraph still said every untagged sentence lives in the engine, contradicting the pass-3 rewrite of §6.4 / A-10 → aligned with §6.4 (engine sentences → Vitest; shell and (UI) sentences → Playwright)
- [major] §6.5 — "nothing else is stored" contradicted the score history (R-84) and preferences (§7.10) stores → only position and derived values are never stored
- [major] §6.5 / §9 — engine input list omitted the score history while §6.6 relied on it → list marked non-exhaustive; engine/score-history boundary handed to bmad-architecture
- [minor] ×14 — §6.4 example list corrected ((UI)-tagged R-73/R-74 removed, R-84 engine-tested); §6.3 lost-drop scoped to Idle while playing, over-no-column case covered by intent, qualifying-games rule; §6.8 renamed to a gzip size budget with an offline Playwright test and single dictionary download; §7.10 preference storage tagged A-12; §6.2 covers preferences, names the observation method and the force-stop procedure; §9 owners for purity check, size script, touch-drag helper, app icon; §3 tap path, Give-up availability, flip as toggle; R-14/R-33 coexistence wording; purity enforcement chosen by architecture
### Decision needed
- none new
### Dropped
- none

## Result — capped at 4 passes
Majors per pass: 7 → 5 → 5 → 3, none disproved. Passes 2–4 were mostly second-order effects of
making §6 more precise, not defects in the original intent. Ref to fix: the spec preamble's coverage
rule (A-10). Decision-needed items D-1…D-3 are in brief §11; assumptions A-1…A-12 in §10 await the
owner. The brief has grown to about 3300 words; once the A-x/D-x items are answered the owner may
prefer to trim §6 back toward brief-level statements and leave the detail to the architecture spine.

## Owner answers — 2026-09-27
D-1, D-2, D-3: proposed defaults accepted. A-1…A-12: confirmed; A-7 refined to "Play Store deferred,
not needed yet". Folded into the brief (§10 and §11 removed, tags dropped, status `reviewed`). The
spec preamble was amended to v0.6 for A-10.
