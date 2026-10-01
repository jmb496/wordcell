#!/bin/bash
# wait-for.sh <done-file> [max-seconds, default 540]
# Waits in the foreground until <done-file> exists, its process dies, or max-seconds pass (stay
# under the Bash tool's 600 s limit). Prints "done exit=<code>", "died" (the pid in
# <done-file>.pid is gone and no exit code was written: treat as a missing result, stop rule 5)
# or "not yet" (call it again).
set -u
f=$1; max=${2:-540}; t=0
alive() { [ -e "$f.pid" ] && kill -0 "$(cat "$f.pid" 2>/dev/null)" 2>/dev/null; }
while [ ! -e "$f" ] && [ "$t" -lt "$max" ]; do
  if [ -e "$f.pid" ] && ! alive && [ ! -e "$f" ]; then echo "died"; exit 0; fi
  read -r -t 5 < <(tail -f /dev/null) || true
  t=$((t + 5))
done
if [ -e "$f" ]; then echo "done exit=$(cat "$f")"
elif [ -e "$f.pid" ] && ! alive; then echo "died"
else echo "not yet"; fi
