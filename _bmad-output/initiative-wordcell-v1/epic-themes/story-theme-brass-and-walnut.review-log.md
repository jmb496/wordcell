# Review log — story-theme-brass-and-walnut.md (ticket 9.9)

State: pass 1: done

Pre-loop: HEAD 93516d8, 175 words (pass 0 copy at _bmad-output/initiative-wordcell-v1/epic-themes/story-theme-brass-and-walnut.review-log.passes/pass0.md). Budget 1500 words. Mode docs, thorough, max 7.

## Pass 1
Reviewers: builder's reading, edge-case hunter, adversarial, ref alignment  |  Findings: major 12 (merged from 4 reviewers), minor 4, decision-needed 0  |  Dropped in triage: 0 (all verified against the repo: no steampunk registry/label/fixture, build-output test asserts steampunk absent)
Majors (all default applied, technical): registry/text.ts/main.ts/meta; tokens + color-scheme + internal tokens; art conversion to 9.5 grammar (4 % wins, no rivets); contrast floors + blocked-on-failure policy + ARTS entry; switch test + fixture `prefs-theme-steampunk`; radio count 5/order and test edits; Default-baselines exemption (Preferences shots); screenshot spec; build-output test retarget; size budget margin; surfaces/hue alone/dark first frame; references.
Minors: add hitl and entry-fields line; owner gate list; DESIGN.md untouched until 9.11; Notes section.
Words: 1379 (7.9 x pass 0, budget 1500)  |  Snapshot: story-theme-brass-and-walnut.review-log.passes/pass1.md
### Applied
- all 12 majors and 4 minors applied (fixer items 1-16). Fixer found the brief's two-circle leather tile fails the TH-9 texture-cap check (per-colour opacity sum .08 > .06), so the ticket specifies one path of two arc subpaths at .04 (same pixels). Default applied (technical).
- Unverified: visual identity of the arc path vs circles; contrast figures are the brief's.
