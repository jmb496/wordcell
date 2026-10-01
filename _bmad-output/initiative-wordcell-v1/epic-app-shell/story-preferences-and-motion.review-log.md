# Review log — story-preferences-and-motion.md (ticket 3.10)

State: pass 1: done

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
