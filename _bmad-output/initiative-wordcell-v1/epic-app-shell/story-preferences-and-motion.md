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

Builds prefs.svelte.ts (parsePrefs with a JSON.parse catch per Q-36, defaults normal and false, absent not written, unreadable defaults with no message and overwritten on the next change, setters writing at once, a write while halted throwing, lastText and isStale), motion { baseMs, reduced } mirrored to --wc-base-ms (<n>ms) and --wc-reduced (1 or 0), src/ui/motion.ts as the only duration source, and loaded()/current() prefs; prefs fixtures are exempt from the *-invalid-* rule.

## Acceptance Criteria

Verify: npm run test:all is green, and Playwright on android shows prefs-non-default.json with session-gave-up.json setting --wc-base-ms to 320ms and surviving New game and reload, prefs-unreadable.json giving 180ms with the key byte-identical, a first launch reporting loaded().prefs null and current().prefs.showTimer false, and emulateMedia reducedMotion reduce giving --wc-reduced 1.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-app-shell/epic-app-shell.md

## Notes

- Open question: None.
