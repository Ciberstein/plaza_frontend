"""Applies a list of exact string replacements to one file, independently.

Takes a path to a JSON file (not stdin — see add-i18n-keys.py for why) holding
an array of {"old": "...", "new": "..."}. Every pair is attempted and the ones
that match are written; the ones that do not are printed so they can be fixed
by hand, instead of losing everything already correct in the same file.

Usage: python apply-edits.py <target-file> <path-to-edits.json>
"""
import json
import pathlib
import sys

target = pathlib.Path(sys.argv[1])
edits = json.loads(pathlib.Path(sys.argv[2]).read_text(encoding="utf-8"))
s = target.read_text(encoding="utf-8")

misses = []
for i, edit in enumerate(edits):
    old, new = edit["old"], edit["new"]
    count = s.count(old)
    if count == 1:
        s = s.replace(old, new, 1)
    elif count == 0:
        misses.append((i, "not found", old))
    else:
        misses.append((i, f"appears {count} times", old))

target.write_text(s, encoding="utf-8")
print(f"{len(edits) - len(misses)}/{len(edits)} applied to {target}")
for i, reason, old in misses:
    print(f"  MISS #{i} ({reason}): {old[:80]!r}")
