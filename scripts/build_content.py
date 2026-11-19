"""units.json + wordlist.json + data/content/_<LEVEL>_*.tsv -> data/content/<LEVEL>.json

Usage: python scripts/build_content.py A1
Only units whose 22 words ALL have content are written (others are skipped).
"""
import csv
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PARSED = ROOT / "data" / "parsed"
CONTENT = ROOT / "data" / "content"


def main(level: str):
    words = {w["id"]: w for w in json.loads((PARSED / "wordlist.json").read_text(encoding="utf-8"))}
    units = json.loads((PARSED / "units.json").read_text(encoding="utf-8"))[level]

    content = {}
    for tsv in sorted(CONTENT.glob(f"_{level}_*.tsv")):
        with tsv.open(encoding="utf-8", newline="") as f:
            for row in csv.DictReader(f, delimiter="\t", quoting=csv.QUOTE_NONE):
                content[(row["word"], row["pos"], row.get("note") or "")] = row

    out_units, errors = [], []
    for unit in units:
        items = []
        for position, wid in enumerate(unit["wordIds"], 1):
            w = words[wid]
            note = w["sense"] or (f"homonym {w['homonym']}" if w["homonym"] else "")
            c = content.get((w["word"], w["pos"], note))
            if not c:
                break
            masked = re.findall(r"\{\{(.+?)\}\}", c["example_en"])
            if len(masked) != 1:
                errors.append(f'{w["word"]}: example must contain exactly one {{{{...}}}}')
            items.append({
                "position": position,
                "word": w["word"],
                "pos": w["pos"],
                "sense": w["sense"],
                "homonym": w["homonym"],
                "variants": w["variants"],
                "meaning_vi": c["meaning_vi"],
                "definition_en": c["definition_en"],
                "definition_vi": c["definition_vi"],
                "example_en": c["example_en"],
                "example_vi": c["example_vi"],
                "ipa": c["ipa"],
                "audio_url": None,
                "image_url": None,
                "image_prompt": c["image_prompt"],
            })
        if len(items) == len(unit["wordIds"]):
            out_units.append({"number": unit["number"], "words": items})

    if errors:
        sys.exit("\n".join(errors))
    path = CONTENT / f"{level}.json"
    path.write_text(json.dumps({"level": level, "units": out_units}, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"{path.name}: {len(out_units)}/{len(units)} units with full content")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "A1")
