"""Parse Oxford 3000 + 5000 PDFs -> data/parsed/wordlist.json

Usage:  python scripts/parse_oxford.py
Needs:  pip install pymupdf
"""
import json
import re
from pathlib import Path

import pymupdf

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data" / "raw"
OUT = ROOT / "data" / "parsed" / "wordlist.json"

LEVELS = ["A1", "A2", "B1", "B2", "C1"]

POS_MAP = {
    "n.": "noun", "noun.": "noun", "v.": "verb", "adj.": "adjective", "adv.": "adverb",
    "prep.": "preposition", "conj.": "conjunction", "pron.": "pronoun",
    "det.": "determiner", "exclam.": "exclamation", "modal v.": "modal verb",
    "auxiliary v.": "auxiliary verb", "indefinite article": "article",
    "definite article": "article", "number": "number",
    "infinitive marker": "infinitive marker", "linking v.": "linking verb",
    "ordinal number": "number",
}
# longest first so "modal v." wins over "v."
POS_ALT = "|".join(re.escape(p) for p in sorted(POS_MAP, key=len, reverse=True))
# one POS group: "n." | "adj./adv." | "det./pron."
POS_GROUP = rf"(?:{POS_ALT})(?:/ ?(?:{POS_ALT}))*"
# a full entry tail: POS groups separated by commas, each optionally followed by level
TAIL = re.compile(
    rf"(?<![A-Za-z])((?:{POS_GROUP})(?:\s*(?:A1|A2|B1|B2|C1))?(?:,\s*(?:{POS_GROUP})(?:\s*(?:A1|A2|B1|B2|C1))?)*)"
)

# words that lost their space in the PDF
GLUED = {"accordingto": "according to", "becauseof": "because of",
         "inorder to": "in order to", "infrontof": "in front of"}

NOISE = re.compile(
    r"[^\n]*The Oxford [35]000[^\n]*|[^\n]*Oxford University Press[^\n]*|\b\d+\s*/\s*\d+\b"
)


def extract_text(pdf: Path) -> str:
    with pymupdf.open(pdf) as doc:
        text = "\n".join(page.get_text() for page in doc)
    text = text.replace("’", "'").replace("®", "").replace("\x08", "")
    return NOISE.sub(" ", text)


def parse_tail(tail: str, default_level: str | None):
    """'prep. A1, conj., adv. A2' -> [(prep,A1),(conj,A2),(adv,A2)]"""
    parts = [p.strip() for p in re.split(r",\s*(?=" + POS_GROUP + ")", tail)]
    result, pending = [], []
    for part in parts:
        m = re.match(rf"({POS_GROUP})\s*(A1|A2|B1|B2|C1)?$", part)
        if not m:
            raise ValueError(f"bad tail part: {part!r}")
        group, level = m.group(1), m.group(2)
        pending.extend(POS_MAP[p.strip()] for p in group.split("/"))
        if level:
            result.extend((p, level) for p in pending)
            pending = []
    if pending:  # no level written (Oxford 5000 file) -> section level
        if not default_level:
            raise ValueError(f"no level for {tail!r}")
        result.extend((p, default_level) for p in pending)
    return result


def parse(text: str, source: str, section_levels: bool):
    entries = []
    # split on section headers ("B2", "C1" alone on a line) for the 5000 file
    chunks = [("", text)]
    if section_levels:
        pieces = re.split(r"^\s*(B2|C1)\s*$", text, flags=re.M)
        chunks = list(zip(pieces[1::2], pieces[2::2]))
    for level, chunk in chunks:
        # "number n. A1": the headword itself looks like a POS -> protect it
        chunk = re.sub(r"\s+", " ", chunk).replace(" number n.", " NUMBER_WORD n.")
        pos = 0
        for m in TAIL.finditer(chunk):
            head = chunk[pos:m.start()].strip(" ,")
            pos = m.end()
            if not head:
                continue
            for p, lv in parse_tail(m.group(1), level or None):
                entries.append(make_entry(head, p, lv, source))
    return entries


def make_entry(head: str, pos: str, level: str, source: str):
    sense = None
    sm = re.search(r"\((.+?)\)", head)
    if sm:
        sense = sm.group(1)
        head = (head[:sm.start()] + head[sm.end():]).strip()
    variants = [v.strip() for v in head.split(",")]
    word = variants.pop(0)
    word = re.sub(r"[^\w' .-]", "", word)  # stray symbols (Wi-Fi®)
    hm = re.search(r"(?<=[a-z])(\d)$", word)  # can1, close2 -> homonym number
    homonym = int(hm.group(1)) if hm else None
    word = word[:hm.start()] if hm else word
    word = GLUED.get(word, word).replace("NUMBER_WORD", "number")
    return {"word": word, "pos": pos, "level": level, "sense": sense,
            "homonym": homonym, "variants": variants, "source": source}


def main():
    all_entries = (
        parse(extract_text(RAW / "American_Oxford_3000.pdf"), "3000", False)
        + parse(extract_text(RAW / "American_Oxford_5000.pdf"), "5000", True)
    )
    variant_of = {v for e in all_entries for v in e["variants"]}

    merged: dict[tuple, dict] = {}
    dupes = []
    for e in all_entries:
        if e["word"] in variant_of:  # "an" already stored as variant of "a"
            continue
        key = (e["word"], e["pos"], e["sense"], e["homonym"])
        if key in merged:
            old = merged[key]
            dupes.append(f'{e["word"]} {e["pos"]} {old["level"]}/{e["level"]}')
            if LEVELS.index(e["level"]) < LEVELS.index(old["level"]):
                merged[key] = e
            continue
        merged[key] = e

    words = sorted(merged.values(), key=lambda e: (LEVELS.index(e["level"]), e["word"].lower(), e["pos"]))
    for i, e in enumerate(words, 1):
        e["id"] = i
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(words, ensure_ascii=False, indent=1), encoding="utf-8")

    print(f"raw entries: {len(all_entries)}, unique: {len(words)}, duplicates dropped: {len(dupes)}")
    for lv in LEVELS:
        n = sum(1 for w in words if w["level"] == lv)
        print(f"  {lv}: {n} words -> {-(-n // 22)} units")
    collide = {}
    for w in words:
        collide.setdefault((w["word"], w["pos"]), []).append(w["sense"] or w["homonym"])
    print("same (word,pos) with different senses:", {k: v for k, v in collide.items() if len(v) > 1})
    print("sample dupes:", dupes[:10])


if __name__ == "__main__":
    main()
