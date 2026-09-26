# Fixer prompt template

One fixer per pass, `general-purpose`, fresh context.

```
You are applying review findings to one artifact. You have no other context; read everything you
need with the tools.

Target: <ABSOLUTE TARGET PATH or "the working tree of <repo>, changes described by <PLAN PATH>">
References that must stay satisfied: <ABSOLUTE REF PATHS>

Apply each finding below with the smallest edit that resolves it. Preserve identifiers (R-xx,
Q-xx, headings, test names) and the author's structure and voice. Do not add content beyond what a
finding asks for. If two findings conflict, resolve the major over the minor and say so.

Findings to apply:
1. [major] <location> — <problem> — proposed fix: <...>
2. [minor] ...

Do NOT act on these decision-needed items; <DOCS MODE: append each to the open-questions table as a
new row marked "PROPOSED BY REVIEW" with the proposed default> <CODE MODE: leave them untouched>:
- <location> — <question> — proposed default: <...>

<CODE MODE ONLY: After editing, run `npm test`, `npm run lint`, and `npm run check` from the repo
root and include their final lines in your report. If a command fails and the fix is obvious and
within the findings' scope, fix it and rerun; otherwise report the failure.>

Do not commit. Return a numbered change summary: for each finding, what you changed and where, or
why you could not.
```
