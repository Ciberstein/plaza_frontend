"""Merges new translation keys into the three JSON files, without disturbing
existing ones.

Takes a path to a JSON file (not stdin — on Windows, piping non-ASCII text
through a shell heredoc can silently mangle it into invalid surrogates, which
this script would then fail to write, corrupting the destination) of the
shape:

    { "Some.Key": { "es": "...", "en": "...", "pt": "..." }, ... }

and appends each key, in order, to i18n/lang/{es,en,pt}.json. Fails loudly if
a key already exists with a different value, or if a language is missing for
a new key — a partial translation is worse than an error here.

Usage: python add-i18n-keys.py <path-to-keys.json>
"""
import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent / "i18n" / "lang"
LANGS = ("es", "en", "pt")

source = pathlib.Path(sys.argv[1])
entries = json.loads(source.read_text(encoding="utf-8"))

files = {
    lang: json.loads((ROOT / f"{lang}.json").read_text(encoding="utf-8"))
    for lang in LANGS
}

for key, values in entries.items():
    for lang in LANGS:
        if lang not in values:
            raise SystemExit(f"missing '{lang}' for key {key!r}")
        if key in files[lang] and files[lang][key] != values[lang]:
            raise SystemExit(f"key {key!r} already exists with a different {lang} value")
        files[lang][key] = values[lang]

for lang in LANGS:
    text = json.dumps(files[lang], ensure_ascii=False, indent=2) + "\n"
    (ROOT / f"{lang}.json").write_text(text, encoding="utf-8")

print(f"added {len(entries)} keys")
