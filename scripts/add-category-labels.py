"""Appends category translations to src/utils/categoryLabels.js.

Takes a path to a JSON file (not stdin — on Windows, piping non-ASCII through
a shell heredoc mangles it) of the shape:

    { "some-slug": { "en": "...", "pt": "..." }, ... }

and writes each entry into the exported map, keeping what is already there.
Fails loudly if a slug already exists with a different value: a category
renamed in two places is a category that shows one name in English and another
in Portuguese.

Usage: python add-category-labels.py <path-to-labels.json> [section-comment]
"""
import json
import pathlib
import re
import sys

TARGET = pathlib.Path(__file__).resolve().parent.parent / "src" / "utils" / "categoryLabels.js"

source = pathlib.Path(sys.argv[1])
entries = json.loads(source.read_text(encoding="utf-8"))
heading = sys.argv[2] if len(sys.argv) > 2 else None

text = TARGET.read_text(encoding="utf-8")

# Everything already in the file, so a repeated run is a no-op rather than a
# second copy of every line.
present = set(re.findall(r"^\s*'([^']+)':", text, flags=re.M))

lines = []
if heading:
    lines.append(f"\n  /* {heading} */")

added = 0
for slug, value in entries.items():
    if slug in present:
        continue
    en = value["en"].replace("\\", "\\\\").replace("'", "\\'")
    pt = value["pt"].replace("\\", "\\\\").replace("'", "\\'")
    lines.append(f"  '{slug}': {{ en: '{en}', pt: '{pt}' }},")
    added += 1

if not added:
    print("nothing to add")
    raise SystemExit(0)

closing = text.rstrip().rfind("}")
if closing == -1:
    raise SystemExit("could not find the closing brace of CATEGORY_LABELS")

head = text.rstrip()[:closing].rstrip()
TARGET.write_text(head + "\n" + "\n".join(lines) + "\n}\n", encoding="utf-8")

print(f"added {added} category labels")
