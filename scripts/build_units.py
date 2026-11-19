"""data/parsed/wordlist.json -> data/parsed/units.json (22 words/unit, seeded shuffle)

Usage: python scripts/build_units.py
Same SEED -> same units every run. Do NOT change SEED after users start learning.
"""
import json
import random
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "data" / "parsed" / "wordlist.json"
OUT = ROOT / "data" / "parsed" / "units.json"
SEED = 5000
UNIT_SIZE = 22
LEVELS = ["A1", "A2", "B1", "B2", "C1"]
MIN_LAST = 6  # a last unit smaller than this is merged into the previous unit


def main():
    words = json.loads(SRC.read_text(encoding="utf-8"))
    result = {}
    for lv in LEVELS:
        ids = [w["id"] for w in words if w["level"] == lv]
        rng = random.Random(f"{SEED}-{lv}")
        rng.shuffle(ids)  # Fisher-Yates
        result[lv] = [
            {"number": i // UNIT_SIZE + 1, "wordIds": ids[i:i + UNIT_SIZE]}
            for i in range(0, len(ids), UNIT_SIZE)
        ]
        if len(result[lv]) > 1 and len(result[lv][-1]["wordIds"]) < MIN_LAST:
            result[lv][-2]["wordIds"] += result[lv].pop()["wordIds"]
        print(f"{lv}: {len(ids)} words, {len(result[lv])} units, last unit {len(result[lv][-1]['wordIds'])} words")
    OUT.write_text(json.dumps(result), encoding="utf-8")


if __name__ == "__main__":
    main()
