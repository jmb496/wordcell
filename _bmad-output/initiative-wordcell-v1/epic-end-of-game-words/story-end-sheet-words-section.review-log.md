# Review log — story-end-sheet-words-section.md
State: pass 1: done
Pre-loop: HEAD d8828a2; pass0.md 209 words; budget 1500 words.

## Pass 1 — 2026-10-20
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 8, minor 5, decision-needed 0  |  Dropped in triage: 0 (duplicates merged)
### Majors (all technical, default applied)
1. Row accessible name `BAKED, 5 letters` markup unspecified (word and count are two visual spans) → `ul` labelled by an `h3` Words heading, `li` with `aria-label` from one `text.ts` function using the existing `letters` helper; exact-name locators.
2. Empty case: heading plus a `p`, no `list` element rendered.
3. Placement/layout dropped from SPEC CAP-4 and DESIGN: last block of expanded sheet, no inner scroll area, text only, flex row left/right overriding the sheet's centred text, handle and bars fixed; no tests for 44 px, scroll, overflow → add P6 checks.
4. Give-up fixture and expected rows unnamed; light theme and screenshot states unnamed.
5. AD-3 test method undefined; section must bind to the `result` snapshot (not live `view`); `wordList` undefined on a finished status is a bug (rule 6), `[]` alone gives the empty line.
6. `localStorage` unchanged: baseline undefined → compare `wordcell:*` after open vs after scroll, collapse, expand.
7. Undo / New game / Replay "removed": assertion form (list count 0, Replay through its confirm, second finish not stale).
8. Count from `entry.letterCount` (QU = 2), uppercase in JS not CSS.
### Minor (applied, small)
- Reload for both outcomes; no new focusable elements, focus-on-open stays on Replay; test names `R-88 …` / `AD-3 …`; section only in expanded sheet.
### Extra tickets.toml keys to add to Description
tests, owns, consumers (risk and after already in front matter).
Words: 634 (3.0 x pass 0)  |  Snapshot: story-end-sheet-words-section.passes/pass1.md
### Applied
- [major] items 1-8 and extra tickets.toml fields → fixer items 1-9 (Intent line added; give-up built as a `{literal}` session from the won fixture, noted `unverified` that it parses)
