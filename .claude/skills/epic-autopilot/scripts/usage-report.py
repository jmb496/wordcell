#!/usr/bin/env python3
"""usage-report.py --since <ISO-8601 UTC> [--until <ISO>] [--project-dir DIR]

Sums the Claude Code token usage of every session and subagent of this project with API calls
in [since, until), from the local transcripts (~/.claude/projects/<project>/*.jsonl, the same
files usage extensions read). Prints one plain line for the autopilot digest:
  Tokens: 4.1M input-equivalent (ticket review 52%, build 20%, code review 15%, orchestrator 9%,
  other 4%); orchestrator peak context 96k
The transcript folder defaults to the one for the git repo root (any working directory inside
the repo works). Sessions are classed by their first prompt: the step prompts of SKILL.md, and
"orchestrator" for one-ticket sessions or an interactive /epic-autopilot command.
Weights (relative to one uncached input token, API price ratios): cache read 0.1, 5-minute
cache write 1.25, 1-hour cache write 2, output 5. Subscription limits are not published per
type, so read the shares as relative.
"""
import argparse, glob, json, os, subprocess, sys
from collections import defaultdict

def project_dir(root):
    return os.path.expanduser('~/.claude/projects/' + root.replace('/', '-'))

def calls(path, since, until):
    reqs, first = {}, None
    for line in open(path, encoding='utf-8'):
        try:
            d = json.loads(line)
        except ValueError:
            continue
        if d.get('type') == 'user' and first is None:
            c = d.get('message', {}).get('content')
            if isinstance(c, list):
                c = ' '.join(x.get('text', '') for x in c if isinstance(x, dict))
            if isinstance(c, str) and c.strip():
                if not c.startswith('<'):
                    first = c
                elif 'epic-autopilot' in c and '<command' in c:
                    first = 'epic-autopilot (interactive)'
        if d.get('type') == 'assistant':
            ts, u = d.get('timestamp') or '', d.get('message', {}).get('usage')
            if u and since <= ts < until:
                reqs[d.get('requestId') or d.get('uuid')] = u
    return first or '', list(reqs.values())

def cost(u):
    cc = u.get('cache_creation') or {}
    w5 = cc.get('ephemeral_5m_input_tokens', 0) if cc else u.get('cache_creation_input_tokens', 0)
    w1 = cc.get('ephemeral_1h_input_tokens', 0)
    return (u.get('input_tokens', 0) + 0.1 * u.get('cache_read_input_tokens', 0) + 1.25 * w5
            + 2 * w1 + 5 * u.get('output_tokens', 0))

def ctx(u):
    return (u.get('input_tokens', 0) + u.get('cache_read_input_tokens', 0)
            + u.get('cache_creation_input_tokens', 0))

def kind(first):
    if 'review-loop skill in code mode' in first: return 'code review'
    if 'review-loop skill' in first: return 'ticket review'
    if 'bmad-build-auto' in first: return 'build'
    if 'epic-autopilot' in first: return 'orchestrator'
    return 'other'

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--since', required=True)
    ap.add_argument('--until', default='9999')
    ap.add_argument('--project-dir', default=None)
    a = ap.parse_args()
    top = subprocess.run(['git', 'rev-parse', '--show-toplevel'], capture_output=True, text=True).stdout.strip()
    root = a.project_dir or project_dir(top or os.getcwd())
    totals, peak = defaultdict(float), 0
    for f in glob.glob(os.path.join(root, '*.jsonl')):
        first, us = calls(f, a.since, a.until)
        if not us:
            continue
        k = kind(first)
        totals[k] += sum(cost(u) for u in us)
        if k == 'orchestrator':
            peak = max(peak, max(ctx(u) for u in us))
        sid = os.path.basename(f)[:-6]
        for s in glob.glob(os.path.join(root, sid, 'subagents', '*.jsonl')):
            _, su = calls(s, a.since, a.until)
            totals[k] += sum(cost(u) for u in su)
    total = sum(totals.values())
    if not total:
        print('Tokens: none recorded in the window'); return
    parts = ', '.join(f'{k} {v / total * 100:.0f}%' for k, v in sorted(totals.items(), key=lambda x: -x[1]))
    print(f'Tokens: {total / 1e6:.1f}M input-equivalent ({parts}); orchestrator peak context {peak / 1e3:.0f}k')

if __name__ == '__main__':
    sys.exit(main())
