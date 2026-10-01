#!/usr/bin/env python3
"""limits.py [--max-five-hour 80] [--max-seven-day 80] [--max-age-minutes 30] [--file PATH]

Reads the plan's usage-limit utilization from the local cache of the "Claude Code Usage" VS Code
extension (growthjack.claude-code-usage): quota-observations-v2.json in its VS Code global
storage (LOCAL-DATA.md of the extension). No network call and no credentials: the extension
does the lookup while VS Code runs. Uses the newest observation of each window (five-hour,
seven-day, and provider-scoped-seven-day, a narrower weekly cap checked against the weekly
threshold) for the account QUOTA_ACCOUNT names (a fingerprint from the file, e.g.
acct_6e7db6...), else the most recently observed account; the printed line shows the account's
last 6 characters. A window whose reset time has passed counts as 0%. Prints one line, exits:
  0  both windows below their thresholds
  5  a window is at or over its threshold (the line names it and its reset time)
  6  the cache is missing, unreadable, or older than --max-age-minutes (open VS Code so the
     extension refreshes it, or rerun the driver with LIMIT_CHECK=off)
The file path defaults to QUOTA_FILE, else the first match of
/mnt/c/Users/*/AppData/Roaming/Code/User/globalStorage/growthjack.claude-code-usage/
quota-observations-v2.json (WSL) or the native VS Code globalStorage path.
"""
import argparse, glob, json, os, sys, time
from datetime import datetime

NAME = 'growthjack.claude-code-usage/quota-observations-v2.json'

def find_file(arg):
    if arg:
        return arg
    if os.environ.get('QUOTA_FILE'):
        return os.environ['QUOTA_FILE']
    for pattern in ('/mnt/c/Users/*/AppData/Roaming/Code/User/globalStorage/' + NAME,
                    os.path.expanduser('~/.config/Code/User/globalStorage/' + NAME),
                    os.path.expanduser('~/Library/Application Support/Code/User/globalStorage/' + NAME)):
        hits = sorted(glob.glob(pattern), key=os.path.getmtime, reverse=True)
        if hits:
            return hits[0]
    return None

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--max-five-hour', type=float, default=80)
    ap.add_argument('--max-seven-day', type=float, default=80)
    ap.add_argument('--max-age-minutes', type=float, default=30)
    ap.add_argument('--file')
    a = ap.parse_args()
    path = find_file(a.file)
    if not path:
        print('limits: the Claude Code Usage extension cache was not found (set QUOTA_FILE)')
        return 6
    try:
        obs = [o for o in json.load(open(path, encoding='utf-8'))['observations']
               if o.get('provider') == 'claude' and isinstance(o.get('observedAt'), (int, float))]
        account = os.environ.get('QUOTA_ACCOUNT') or max(obs, key=lambda o: o['observedAt'])['accountFingerprint']
        latest = {}
        for o in obs:
            if o['accountFingerprint'] == account:
                k = o['periodType']
                if k not in latest or o['observedAt'] > latest[k]['observedAt']:
                    latest[k] = o
        windows = [('5-hour', latest['five-hour'], a.max_five_hour),
                   ('weekly', latest['seven-day'], a.max_seven_day)]
        if 'provider-scoped-seven-day' in latest:
            windows.append(('weekly model cap', latest['provider-scoped-seven-day'], a.max_seven_day))
        now_ms = time.time() * 1000
        age = (now_ms - min(w['observedAt'] for _, w, _ in windows)) / 60000
        over, parts = [], []
        for name, w, cap in windows:
            used = 0.0 if w['resetAt'] <= now_ms else float(w['usedFraction']) * 100
            reset = datetime.fromtimestamp(w['resetAt'] / 1000).astimezone().strftime('%a %H:%M %Z')
            parts.append(f'{name} {used:.0f}% (resets {reset})')
            if used >= cap:
                over.append(f'{name} at {used:.0f}% >= {cap:.0f}%')
    except (OSError, ValueError, KeyError, TypeError) as e:
        print(f'limits: could not read {path} ({type(e).__name__})')
        return 6
    line = f'limits [account …{account[-6:]}]: ' + ', '.join(parts) + f'; observed {age:.0f} min ago'
    if age > a.max_age_minutes:
        print(line + f'; STALE (older than {a.max_age_minutes:.0f} min: open VS Code so the extension refreshes)')
        return 6
    print(line + ('; OVER: ' + '; '.join(over) if over else ''))
    return 5 if over else 0


if __name__ == '__main__':
    sys.exit(main())
