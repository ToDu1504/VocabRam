"""Print the words of some units (input for content writers).

Usage: python scripts/unit_words.py A1 13 18   -> units 13..18 of A1, one "word<TAB>pos<TAB>note" per line
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PARSED = ROOT / "data" / "parsed"

level, start, end = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
words = {w["id"]: w for w in json.loads((PARSED / "wordlist.json").read_text(encoding="utf-8"))}
units = json.loads((PARSED / "units.json").read_text(encoding="utf-8"))[level]
sys.stdout.reconfigure(encoding="utf-8")
for unit in units[start - 1:end]:
    print(f"# unit {unit['number']}")
    for wid in unit["wordIds"]:
        w = words[wid]
        note = w["sense"] or (f"homonym {w['homonym']}" if w["homonym"] else "")
        print(f"{w['word']}\t{w['pos']}\t{note}")
