#!/bin/bash
# loop.sh <epic-slug> [max-tickets]
# Fresh context per ticket: runs one headless epic-autopilot session per ticket ("one-ticket"
# mode, SKILL.md) until a session stops for the owner, a gate fails, a usage limit hits, or the
# epic is complete. Each session reads the run state from files (digest, plans, review logs,
# git), so no context is carried between tickets. The session's handoff file says what happened.
# max-tickets replaces the interactive mode's stop-after=<ref>.
# Before each ticket it checks the plan's usage limits (limits.py, from the Claude Code Usage
# VS Code extension's local cache): at or over MAX_FIVE_HOUR (default 80) percent of the 5-hour
# window or MAX_SEVEN_DAY (default 80) percent of a weekly window it stops and waits for the
# owner to rerun it. LIMIT_CHECK=off skips the check. One driver per epic at a time (lock file).
# While a session runs it prints progress lines (steps started/finished, new commits; see
# watch_progress and SKILL.md "Watching progress").
# Exit codes: 0 complete or max reached, 2 stopped (see handoff), 3 usage limit hit, 4 no
# progress (or a dirty tree, a live leftover step, or another driver running), 5 limit threshold
# reached before a ticket, 6 limits could not be read.
set -u
if [ $# -lt 1 ]; then echo "usage: $0 <epic-slug> [max-tickets]"; exit 4; fi
EPIC=$1; MAX=${2:-99}
HERE=$(cd "$(dirname "$0")" && pwd)
cd "$(git rev-parse --show-toplevel)" || exit 4
# Run state lives in the git-ignored repo folder .autopilot/ (survives a reboot; git status
# --short ignores it, so the tree stays clean for the build).
AP=$PWD/.autopilot
mkdir -p "$AP" || exit 4
exec 9> "$AP/$EPIC.lock"
flock -n 9 || { echo "Another loop.sh for $EPIC is already running."; exit 4; }
H=_bmad-output/implementation-artifacts/autopilot/$EPIC-handoff.md

# Progress lines for the console while a session runs, read only from what the session leaves
# on disk (detached step logs and done files under .autopilot/<run>/, and new
# commits), so the orchestrator's context is unchanged. Polls every PROGRESS_SECS (default 15).
step_label() {
  case "$1" in
    A) echo "ticket review" ;; B) echo "build" ;; C) echo "code review" ;;
    test) echo "test:all" ;; *) echo "$1" ;;
  esac
}
step_result() { # one-line summary of a step's result JSON, if any
  [ -s "$1" ] || return
  python3 - "$1" <<'PY' 2>/dev/null
import json, sys
d = json.load(open(sys.argv[1]))
out = []
if "result" in d: out.append(str(d["result"]))
if "passes" in d: out.append(f'{d["passes"]} passes')
if d.get("majors_per_pass"): out.append("majors " + ", ".join(map(str, d["majors_per_pass"])))
if "status" in d: out.append(str(d["status"]))
if d.get("decision_needed"): out.append(f'{len(d["decision_needed"])} decision(s) for the owner')
if d.get("blocking_condition"): out.append(f'blocked: {d["blocking_condition"]}')
print("; ".join(out))
PY
}
watch_progress() { # <start-marker> <base-commit>
  local marker=$1 base=$2 f name ref step label summary line
  declare -A seen
  poll() {
    for f in $(find "$AP"/2*/ -maxdepth 1 -name '*.log' -newer "$marker" 2>/dev/null | sort) \
        $(find "$AP"/2*/ -maxdepth 1 -name '*.done' -newer "$marker" 2>/dev/null | sort); do
      [ -n "${seen[$f]:-}" ] && continue
      seen[$f]=1
      name=$(basename "$f"); name=${name%.*}
      ref=${name%%-*}; step=${name#*-}; label=$(step_label "$step")
      if [ "${f##*.}" = log ]; then
        echo "[$(date +%H:%M)]   $ref $label: started"
      else
        summary=$(step_result "${f%.done}.json")
        echo "[$(date +%H:%M)]   $ref $label: finished (exit $(cat "$f" 2>/dev/null))${summary:+ — $summary}"
      fi
    done
    while read -r line; do
      [ -z "$line" ] || [ -n "${seen[c:$line]:-}" ] && continue
      seen[c:$line]=1
      echo "[$(date +%H:%M)]   commit $line"
    done < <(git log --reverse --format='%h %s' "$base..HEAD" 2>/dev/null)
  }
  trap 'poll; exit 0' TERM
  while :; do poll; sleep "${PROGRESS_SECS:-15}" & wait $!; done
}
LOGS=$AP/loop-$EPIC-$(date +%Y%m%d-%H%M)
mkdir -p "$LOGS"
echo "loop logs: $LOGS"
for i in $(seq 1 "$MAX"); do
  for pidf in "$AP"/*/*.pid; do
    [ -e "$pidf" ] || continue
    if kill -0 "$(cat "$pidf" 2>/dev/null)" 2>/dev/null; then
      echo "A step from an earlier session is still running ($pidf). Wait for it to finish (or kill it), then rerun."
      exit 4
    fi
  done
  if [ "${LIMIT_CHECK:-on}" != off ]; then
    python3 "$HERE/limits.py" --max-five-hour "${MAX_FIVE_HOUR:-80}" --max-seven-day "${MAX_SEVEN_DAY:-80}"
    rc=$?
    if [ "$rc" -ne 0 ]; then
      [ "$rc" -eq 5 ] && echo "Paused before the next ticket: usage limit threshold. Rerun $0 $EPIC when you want to continue."
      [ "$rc" -ne 5 ] && echo "Usage limits unreadable or stale (is VS Code open?). Rerun with LIMIT_CHECK=off to skip the check."
      [ "$rc" -eq 5 ] && exit 5
      exit 6
    fi
  fi
  start=$(date -u +%Y-%m-%dT%H:%M:%S)
  before=$(git rev-parse HEAD)
  echo "[$(date +%H:%M)] session $i: starting"
  touch "$LOGS/session-$i.start"
  watch_progress "$LOGS/session-$i.start" "$before" &
  watcher=$!
  claude -p "Run the epic-autopilot skill with arguments: $EPIC one-ticket" \
    --permission-mode bypassPermissions --output-format text < /dev/null > "$LOGS/session-$i.log" 2>&1
  sleep 1; kill "$watcher" 2>/dev/null; wait "$watcher" 2>/dev/null
  if grep -qiE 'hit your [a-z]+ limit' "$LOGS/session-$i.log"; then
    echo "USAGE LIMIT: $(grep -iE 'hit your [a-z]+ limit' "$LOGS/session-$i.log" | tail -1)"
    echo "Rerun after the reset: $0 $EPIC"
    exit 3
  fi
  updated=$(sed -n 's/^updated: //p' "$H" 2>/dev/null | head -1)
  if [ "$(git rev-parse HEAD)" = "$before" ] || [ -z "$updated" ] || [[ "$updated" < "$start" ]]; then
    echo "Session $i made no progress (no commit or no fresh handoff; e.g. a dirty tree or wrong branch). Log: $LOGS/session-$i.log"
    exit 4
  fi
  outcome=$(sed -n 's/^outcome: //p' "$H" | head -1)
  reason=$(sed -n 's/^reason: //p' "$H" | head -1)
  echo "[$(date +%H:%M)] session $i: $outcome — $(sed -n 's/^summary: //p' "$H" | head -1)"
  case "$outcome" in
    done) continue ;;
    complete) echo "Epic complete. Handoff: $H"; exit 0 ;;
    *)
      if echo "$reason" | grep -qi 'usage limit'; then echo "A step hit a usage limit: $reason"; echo "Rerun after the reset: $0 $EPIC"; exit 3; fi
      echo "Stopped. Read $H"; exit 2 ;;
  esac
done
echo "Reached max-tickets ($MAX)."
exit 0
