"""Quality check for content TSVs.

Usage: python scripts/check_content.py A1
Checks: missing/extra words, empty fields, exactly one {{...}}, masked form looks like the word,
word not leaking elsewhere in the sentence, IPA format, tabs/quotes problems.
"""
import csv
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PARSED = ROOT / "data" / "parsed"
CONTENT = ROOT / "data" / "content"
FIELDS = ["meaning_vi", "definition_en", "definition_vi", "example_en", "example_vi", "ipa", "image_prompt"]


def note_of(w):
    return w["sense"] or (f"homonym {w['homonym']}" if w["homonym"] else "")


def main(level):
    sys.stdout.reconfigure(encoding="utf-8")
    words = [w for w in json.loads((PARSED / "wordlist.json").read_text(encoding="utf-8")) if w["level"] == level]
    expected = {(w["word"], w["pos"], note_of(w)) for w in words}
    rows, problems = {}, []
    for tsv in sorted(CONTENT.glob(f"_{level}_*.tsv")):
        with tsv.open(encoding="utf-8", newline="") as f:
            for n, row in enumerate(csv.DictReader(f, delimiter="\t", quoting=csv.QUOTE_NONE), 2):
                key = (row["word"], row["pos"], row.get("note") or "")
                where = f"{tsv.name}:{n} {row['word']}"
                if None in row or None in row.values():
                    problems.append(f"{where}: wrong column count")
                    continue
                if key not in expected:
                    problems.append(f"{where}: not in {level} wordlist ({row['pos']})")
                if key in rows:
                    problems.append(f"{where}: duplicate")
                rows[key] = row
                for fld in FIELDS:
                    if not row[fld].strip():
                        problems.append(f"{where}: empty {fld}")
                masked = re.findall(r"\{\{(.+?)\}\}", row["example_en"])
                if len(masked) != 1:
                    problems.append(f"{where}: {len(masked)} masks")
                    continue
                m, base = masked[0].lower(), row["word"].lower()
                if m[:2] != base[:2] and base not in m:
                    problems.append(f"{where}: masked '{masked[0]}' (irregular? check)")
                if re.search(r"}}[A-Za-z]|[A-Za-z]{{", row["example_en"]):
                    problems.append(f"{where}: mask cuts a word")
                rest = re.sub(r"\{\{.+?\}\}", "", row["example_en"]).lower()
                if len(base) > 2 and re.search(rf"\b{re.escape(base)}\b", rest):
                    problems.append(f"{where}: word leaks outside mask")
                if not re.fullmatch(r"/[^/]+/", row["ipa"]):
                    problems.append(f"{where}: bad ipa {row['ipa']}")
    missing = expected - rows.keys()
    print(f"{level}: {len(rows)}/{len(expected)} rows, {len(missing)} missing, {len(problems)} flags")
    for p in problems:
        print(" -", p)


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "A1")
