---
id: 10
type: story
title: "Preferences and motion"
parent: epic-app-shell
covers: [CAP-9]
after: [9]
risk: low
---

# Preferences and motion

## Description

Builds prefs.svelte.ts (parsePrefs with a JSON.parse catch per Q-36, defaults normal and false, absent not written, unreadable or unknown-version defaults with no message and overwritten on the next change, setters writing at once, a write while halted throwing, lastText and isStale), motion { baseMs, reduced } mirrored to --wc-base-ms (<n>ms) and --wc-reduced (1 or 0), src/ui/motion.ts as the only duration source, and loaded()/current() prefs; prefs fixtures are exempt from the *-invalid-* rule.

- parsePrefs(text) (build-notes CAP-9) mirrors parseHistory's result: `{ ok: true, prefs }`, `{ ok: false, reason: 'version-unreadable' }` (non-JSON text, a non-plain-object root, no own `version`, or a version that is not a safe integer ≥ 0), `{ ok: false, reason: 'version-unknown', version }` (version ≠ 1), `{ ok: false, reason: 'contents-unreadable', version }` otherwise; exact fields `{ version: 1, animationSpeed: 'fast'|'normal'|'slow', showTimer: boolean }`.
- Boot (AD-16): main.ts calls `prefs.load()` between `fontCheck()` and `game.load()`, always (read-only, also when the store later rejects or halts); load() parses the key once, records lastText, sets motion, writes --wc-base-ms and --wc-reduced on the root and installs the `matchMedia('(prefers-reduced-motion: reduce)')` change listener, all before mount.
- Import safety: prefs.svelte.ts touches no browser global at import (matchMedia and the root mirror only inside load()) and reads `game.state` only inside functions (the import-cycle rule history.svelte.ts follows); Vitest runs with environment 'node', so shell tests stub matchMedia and document.
- Setters (SPEC CAP-9 "writes on change only"): write the full object at once when the value differs from the in-memory value, else no-op; throw (AD-15) while the game store is halted or booting (as `scoreHistory.reset`), work while rejected.
- Motion: --wc-base-ms always mirrors the preference (90/180/320ms); reduced motion is signalled only by --wc-reduced.
- Q-38: game.svelte.ts `staleOwners()` ORs `prefs.isStale()`.
- Test hook (AD-17, build-notes Test hook): `loaded().prefs` is the parsed stored object, `null` when absent, `{ rejected: reason }` when parsePrefs fails; `current().prefs` (active variant) is always the in-memory Prefs (defaults when absent, unreadable or unknown-version), never `{ rejected }`; the Loaded/Current types and e2e/globals.d.ts gain prefs in this ticket.

Interface: New src/shell/prefs.svelte.ts (prefs, motion, load, setAnimationSpeed, setShowTimer, isStale); new src/ui/motion.ts (`duration(kind)` with kinds snap, flyBack, parting, undoRedo, flyToCell, overlay after the EXPERIENCE.md Motion rows → 1×, 1×, 0.5×, 1×, 2×, 1× `motion.baseMs`, and `stagger()` = 30 ms; when `motion.reduced`, every kind returns the 120 ms fade except parting (0, it snaps) and `stagger()` returns 0; no animation uses it until epic 5); loaded().prefs and current().prefs added (Loaded/Current, e2e/globals.d.ts); main.ts calls prefs.load(); staleOwners() ORs prefs.isStale(); fixtures prefs-non-default.json (`{ "version": 1, "animationSpeed": "slow", "showTimer": true }`, build-notes) and prefs-unreadable.json (`{"version":1,"animationSpeed":"turbo","showTimer":true}`: valid JSON failing contents, since Biome lints *.json; the JSON.parse-catch path is an inline S case).

Tests: §7.10 prefs format { version, animationSpeed, showTimer }; §7.10 stored separately and survive Undo, Redo (session-place.json) and New game; Q-36; R-76 Show timer default off; AD-10 shell Vitest (parsePrefs one inline case per reason input; unreadable and unknown-version stored prefs replaced by the full valid object on the first changing setter call and not written before it; an absent key not written by load; a setter writes at once and updates motion.baseMs and --wc-base-ms; a setter with the in-memory value is a no-op; setter throws while halted); AD-4 shell Vitest (own prefs change then persisted pageshow does not halt; a write or removal of wordcell:prefs from outside the setters then persisted pageshow halts with the another-window message); UI Vitest 'AD-10 motion durations' per kind at 90/180/320 and under reduced.

Owns: wordcell:prefs and the motion variables.

## Acceptance Criteria

Verify: npm run test:all is green, and Playwright on android shows:

- prefs-non-default.json with session-gave-up.json setting --wc-base-ms to 320ms and surviving New game and reload: wordcell:prefs byte-identical, current().prefs deep-equal to the fixture, --wc-base-ms still 320ms;
- prefs-non-default.json with session-place.json keeping wordcell:prefs byte-identical and --wc-base-ms 320ms after Undo and Redo;
- prefs-unreadable.json giving 180ms with the key byte-identical, loaded().prefs `{ rejected: { reason: 'contents-unreadable', version: 1 } }`, current().prefs the defaults, and no dialog or banner shown;
- a first launch reporting loaded().prefs null and current().prefs.showTimer false, and wordcell:prefs still absent after a hide flush (hidePage) and New game;
- reduced motion: --wc-reduced 0 after load, emulateMedia({ reducedMotion: 'reduce' }) giving 1 and 'no-preference' giving 0 again, without reload.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-app-shell/epic-app-shell.md
- _bmad-output/specs/spec-epic-3-app-shell/SPEC.md — CAP-9; CAP-10 (loaded/current snapshot rule)
- _bmad-output/specs/spec-epic-3-app-shell/build-notes.md — Test hook, Q-38, CAP-9 Prefs
- _bmad-output/specs/spec-epic-3-app-shell/rule-coverage.md
- ARCHITECTURE-SPINE.md — AD-7, AD-10, AD-16, AD-17
- EXPERIENCE.md — Motion
- docs/game-flow-spec.md — §7.10, Q-36, R-76

## Notes

- Open question: None.
