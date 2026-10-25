#!/usr/bin/env python3
"""models-used.py --since <ISO-8601 UTC> [--project-dir DIR]

Lists the models that answered in this project's headless Claude Code sessions (`claude -p`,
transcript entrypoint `sdk-cli`) and their subagents since the given time, from the local transcripts (~/.claude/projects/<project>/**/*.jsonl, the files
usage-report.py reads). Prints one line per model: "<count> <model>". Exits 1 when any model
other than Opus or Fable answered, so loop.sh can pause for the owner; 0 otherwise (also when
no transcript has calls in the window).
"""
import argparse, glob, json, os, re, subprocess, sys
from collections import Counter
from datetime import datetime, timezone

def project_dir(root):
    return os.path.expanduser('~/.claude/projects/' + root.replace('/', '-'))

ap = argparse.ArgumentParser()
ap.add_argument('--since', required=True)
ap.add_argument('--project-dir')
a = ap.parse_args()
root = subprocess.run(['git', 'rev-parse', '--show-toplevel'], capture_output=True, text=True).stdout.strip()
pdir = a.project_dir or project_dir(root)
since_epoch = datetime.fromisoformat(a.since.rstrip('Z')).replace(tzinfo=timezone.utc).timestamp()
seen = Counter()
for path in glob.glob(os.path.join(pdir, '**', '*.jsonl'), recursive=True):
    if os.path.getmtime(path) < since_epoch:  # not written since: no calls in the window
        continue
    for line in open(path, encoding='utf-8'):
        try:
            d = json.loads(line)
        except ValueError:
            continue
        if d.get('type') != 'assistant' or (d.get('timestamp') or '') < a.since:
            continue
        if d.get('entrypoint') != 'sdk-cli':  # headless (claude -p) only: skip the owner's own sessions
            continue
        m = d.get('message', {}).get('model') or ''
        if m and not m.startswith('<'):
            seen[m] += 1
for m, n in seen.most_common():
    print(n, m)
sys.exit(1 if any(not re.search('opus|fable', m) for m in seen) else 0)
