---
id: 2
type: story
title: "Parse hardening and engine cleanup"
parent: epic-app-shell
covers: [CAP-2]
after: [1]
risk: medium
---

# Parse hardening and engine cleanup

## Description

Applies B8 and B9: parseSession rejects activeMs above 2^52 as replay-failed under a new code ad7-active-ms-headroom after ad7-active-ms (E4), checkRecord rejects a won record with negative finalScore and a longestWord whose letterCount is below 3 or differs from spelling.length, checked after the existing longest-word checks (E5), statistics returns a copy of longestWord (E6), each new check with its own fixture and errors.ts code, the one existing accept case of a won record at finalScore −5 (serialize.test.ts ~1372) turned into a gaveUp case (review-log open major 3), and folds the duplicated Session/Move field lists, field-set checker, uint32 and safe-integer domain checks and letter-count sum, replacing the entry-N and cross-epic CAP-n comment citations.

## Acceptance Criteria

Verify: npm run test:all is green with a §2 test per new check asserting its code and reason, a Session at exactly 2^52 parsing and surviving one accrue of 86 400 000 ms, a statistics non-identity test, every other existing parse test and fixture result unchanged, and a grep finding no 'entry [0-9]' or cross-epic 'CAP-[0-9]' citation in src/engine sources.

## References

- parent — _bmad-output/initiative-wordcell-v1/epic-app-shell/epic-app-shell.md
- spec — _bmad-output/specs/spec-epic-3-app-shell/build-notes.md, CAP-2

## Notes

- Open question: Whether the fold changes any check order the rejecting fixtures rely on; the full fixture suite is the guard.
