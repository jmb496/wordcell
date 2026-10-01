# Review log — story-preferences-and-motion.md (ticket 3.10)

State: pass 3: done

Mode: docs, thorough, max 7, budget 1500 words. Pass 0: HEAD 249db05, copy story-preferences-and-motion.passes/pass0.md, 156 words.
Intent carried from tickets.toml entry 10 (not copied by the pull): interface, tests, owns; pass-1 fixer adds them to Description as 'Interface:', 'Tests:', 'Owns:'.

## Pass 1 — 2026-10-01
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 10, minor 6, decision-needed 0  |  Dropped in triage: 0 (about 25 duplicates merged)
Words (docs): 768 (4.9 x pass 0)  |  Snapshot: story-preferences-and-motion.passes/pass1.md
Fixer: applied 1–13; item 6/9 mirror serialize.ts real reason shapes ({ reason, version } for version-unknown/contents-unreadable)
### Applied
- [major] Description / AD-16 — no boot step for prefs; main.ts goes fontCheck() → game.load() → fixer item 1
- [major] Description / Q-38 — prefs.isStale() not wired into game.svelte.ts staleOwners(); only the negative pageshow case tested → fixer item 2
- [major] Tests / Q-36, AD-7 — no S case for overwrite on next change, absent not written by load, setter write + motion update → fixer item 3
- [major] Description / AD-17 — loaded().prefs and current().prefs shapes for unreadable prefs unstated; e2e/globals.d.ts update → fixer item 4
- [major] Interface / AD-10, EXPERIENCE Motion — motion.ts API and its test unspecified; 120 ms reduced fade dropped → fixer item 5
- [major] Description / build-notes CAP-9 — parsePrefs result shape and reasons unstated; unknown version omitted → fixer item 6
- [major] Description / SPEC CAP-9 — setter semantics: same-value call, states that throw (halted vs booting vs rejected) → fixer item 7
- [major] Description / vite.config.ts test env node — prefs.svelte.ts must not touch browser globals at import (game.svelte.ts imports it) → fixer item 8
- [major] Acceptance Criteria — Verify drops Undo/Redo survival (session-place.json), absent key staying absent, live reduced-motion listener, unreadable loaded()/current() and no message → fixer item 9
- [major] Interface / fixtures — prefs-unreadable.json contents unstated → fixer item 10
- [minor] Description — --wc-base-ms under reduced motion → fixer item 11
- [minor] References — only the parent listed; add SPEC CAP-9, build-notes, AD-7/10/16/17 → fixer item 12
- [minor] Description — add Interface / Tests / Owns lines from tickets.toml entry 10 → fixer item 13
### Default applied (technical)
- motion.ts — duration(kind) with kinds from the EXPERIENCE Motion table, stagger 30 ms; reduced → 120 (parting and stagger 0)
- setters — write only when the value differs from the in-memory value; throw while game store halted or booting; work while rejected
- prefs-unreadable.json — valid JSON failing contents ({"version":1,"animationSpeed":"turbo","showTimer":true}); JSON.parse catch covered by inline S cases
- current().prefs — always in-memory Prefs (defaults when absent or unreadable); loaded().prefs { rejected: reason }
- --wc-base-ms always mirrors the preference; reduced signalled only by --wc-reduced
- pageshow stale cases named AD-4 (rule-coverage AD-4 row)
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- none (duplicates merged)

## Pass 2 — 2026-10-01
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 6, minor 8, decision-needed 0  |  Dropped in triage: 2
Words (docs): 961 (6.2 x pass 0)  |  Snapshot: story-preferences-and-motion.passes/pass2.md
Fixer: applied 1–12; Biome claim verified (fixtures/ ignored); parsePrefs inputs checked against serialize.ts versionStage
### Applied
- [major] Verify bullet 4 — New game unreachable on a true first launch (status playing; App.svelte:65) → fixer item 1
- [major] Description Boot/Q-38/Test hook — prefs behaviour before prefs.load() (isStale, loaded) and the game.svelte.test.ts harness unstated → fixer item 2
- [major] Tests motion durations — harness unclear (setters throw while booting; game.svelte.ts touches window at import) → fixer item 3
- [major] Description Boot — "the root" ambiguous (main.ts `root` is #app; tokens on :root) → fixer item 4
- [major] Verify/Tests — initial reduced-motion value at load untested → fixer item 5
- [major] Tests — setter throw while booting and write while rejected untested → fixer item 6
- [minor] Interface — "since Biome lints *.json" false (biome ignores fixtures/) → fixer item 7
- [minor] Setters — check order (state first) and side-effect/serialization order → fixer item 8
- [minor] Tests — parsePrefs inline inputs named → fixer item 9
- [minor] Tests — same-value setter on unreadable prefs leaves key untouched → fixer item 10
- [minor] Verify bullet 3 — "no dialog or banner" locator → fixer item 11
- [minor] Interface — `prefs` export shape → fixer item 12
### Default applied (technical)
- motion.test.ts mocks ../shell/prefs.svelte with a mutable motion object
- prefs lastText starts null, isStale() never throws; load() throws if called twice; prefs loaded result throws before load; game.svelte.test.ts setup calls prefs.load() before game.load()
- variables written on document.documentElement.style
- setter: state check first, then same-value no-op, then JSON.stringify { version, animationSpeed, showTimer }, write, lastText, memory, mirror
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- motion.ts fade keyframes / shake kind — epic 5 scope, no defect in this ticket
- reduced default unpinned in Playwright — folded into fixer item 5

## Pass 3 — 2026-10-01
Reviewers: fix diff, edge-case hunter, adversarial, ref alignment  |  Findings: major 4, minor 9, decision-needed 0  |  Dropped in triage: 2
Words (docs): 1148 (7.4 x pass 0)  |  Snapshot: story-preferences-and-motion.passes/pass3.md
Fixer: applied 1–13; no runnable commands added
### Applied
- [major] Q-38 bullet — "an absent key is not stale" contradicts the removal-halts AD-4 test and build-notes Q-38 (read !== lastText) → fixer item 1
- [major] Interface — `prefs` defined as a Prefs getter yet called as prefs.load()/prefs.isStale(); launch-result accessor unnamed → fixer item 2
- [major] Tests — live prefers-reduced-motion change updating motion.reduced (JS side) untested (AD-10 Prevents) → fixer item 3
- [major] Tests/Verify — baseMs/--wc-base-ms unchanged under reduced motion untested → fixer item 4
- [minor] Import safety — harness stubs lack documentElement.style and matchMedia; where prefs tests live → fixer item 5
- [minor] Test hook — existing loaded()/current() toEqual assertions gain prefs (blocking.spec.ts another-window cases expect { rejected: { reason: 'version-unreadable' } } from their '{}' write) → fixer item 6
- [minor] Tests — setShowTimer not named → fixer item 7
- [minor] Boot — only loaded() throws before load; value, motion, isStale defined before load → fixer item 8
- [minor] Motion — `$derived` per AD-10, defaults before load → fixer item 9
- [minor] Verify bullet 3 — unreadable key untouched after hidePage and reload (SPEC CAP-9) → fixer item 10
- [minor] Verify bullet 4 — first launch --wc-base-ms 180ms, animationSpeed 'normal' → fixer item 11
- [minor] Verify — test-name ids per bullet → fixer item 12
- [minor] Interface — e2e/globals.d.ts declares Prefs and reject shape inline → fixer item 13
### Default applied (technical)
- export const prefs = { value, motion, load, loaded, current, setAnimationSpeed, setShowTimer, isStale } mirroring scoreHistory; motion.test.ts mocks prefs.motion
- prefs.svelte.test.ts beside the module with a copied setup; stubs gain documentElement.style and global matchMedia (vi.stubGlobal)
### Decision needed (functionality / UX / gameplay)
- none
### Dropped
- CSS consumers combining --wc-reduced for the 120 ms fade — epic 5/6 scope
- version-unknown Playwright variant — covered by S cases; optional
