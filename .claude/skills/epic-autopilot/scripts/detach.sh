#!/bin/bash
# detach.sh <done-file> <log-file> -- <command...>
# Starts <command> in its own session, detached from the caller (a headless `claude -p` session
# does not wait for its own background jobs), with stdin closed. Writes its pid to
# <done-file>.pid while it runs; when it exits, writes its exit code to <done-file> and removes
# the pid file. Pair with wait-for.sh. loop.sh refuses to start while any pid file under
# .autopilot/<run>/ names a live process.
set -u
done_file=$1; log_file=$2; shift 2
[ "${1:-}" = "--" ] && shift
rm -f "$done_file" "$done_file.pid"
DETACH_LOG=$log_file DETACH_DONE=$done_file setsid nohup bash -c \
  'echo $$ > "$DETACH_DONE.pid"; "$@" > "$DETACH_LOG" 2>&1; rc=$?; echo $rc > "$DETACH_DONE"; rm -f "$DETACH_DONE.pid"' \
  detach "$@" < /dev/null > /dev/null 2>&1 &
for _ in 1 2 3 4 5 6 7 8 9 10; do [ -e "$done_file.pid" ] || [ -e "$done_file" ] && break; read -r -t 0.2 < <(tail -f /dev/null) || true; done
echo "started pid $(cat "$done_file.pid" 2>/dev/null || echo '?') (done file: $done_file)"
