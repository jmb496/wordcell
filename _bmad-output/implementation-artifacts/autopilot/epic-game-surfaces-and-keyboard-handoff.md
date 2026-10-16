outcome: stopped
ticket: 6.12
reason: rule 3, npm run test:all failed at check (type errors in src/ui/motion.test.ts 701, 721, 731)
next: 6.12
updated: 2026-10-16T01:25:00Z
summary: Ticket 6.12 is built and reviewed; the full test run now fails on three test-file type errors, not on the earlier menu check.

## Report

The earlier menu row-height failure is fixed. The rerun of the full test run now stops earlier, at the type check: three errors in `src/ui/motion.test.ts` (lines 701, 721, 731), where the `opened` test mock is typed so that it cannot be passed as a plain function. No game behaviour is affected; it is a test-only typing fix. Nothing needs your decision. Ticket 6.12 stays `built`, not done. Screenshots were not run (they follow a green test run).

Resume: fix the mock's type in that test file (for example type `opened` as `vi.fn<() => void>()`), then rerun `.claude/skills/epic-autopilot/scripts/loop.sh epic-game-surfaces-and-keyboard`.

Close-out docs: SPEC.md CAP-5 "(none: opens at once)" edit may be needed (from ticket 6.12 review).
