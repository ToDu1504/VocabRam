# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

VocabRAM: a web app for learning English vocabulary from the Oxford 3000/5000 lists, organized as Level (A1–C1) → Unit (22 words) → card. The full spec is in [VocabRAM-PLAN.md](VocabRAM-PLAN.md), and it is the source of truth. Read the **📌 Tiến độ** box at the top of section 11 first for current status and the open decisions.

The plan is written in Vietnamese, and the user communicates in Vietnamese.

Claude writes all code: the app (backend/frontend), the data pipeline, and vocabulary content.

## Current state

`backend/` (Express 5 + Prisma 6 + MySQL, Phase 1) is done: run `npm run dev` in `backend/` (port 4000); `npm run db:seed` re-imports `data/content/*.json` (idempotent upsert by `(word, pos, sense)`). `frontend/` (Next.js) is not created yet. The repo is not a git repository yet.

## Data pipeline (Python, needs `pymupdf`)

Run from the repo root:

```
python scripts/parse_oxford.py          # data/raw/*.pdf -> data/parsed/wordlist.json
python scripts/build_units.py           # wordlist -> data/parsed/units.json (seeded shuffle, 22/unit)
python scripts/unit_words.py A2 7 12    # print words of units 7..12 (input for content writers)
python scripts/check_content.py B1      # QA the content TSVs of a level
python scripts/build_content.py B1      # TSVs -> data/content/B1.json (only fully-covered units)
```

**Key facts that span several files:**
- **Card identity is `(word, pos, note)`, not `(word, pos)`.**
  - The PDF splits homonyms: `bank (money)`/`bank (river)`, `ring1`/`ring2`. `wordlist.json` stores these in `sense` and `homonym`.
  - In the TSVs, `note` is the `sense` text, or `homonym N`, or empty.
  - This differs from the `@@unique([word, pos])` in the plan's Prisma schema, which is an open decision.
- **Edit content only in `data/content/_<LEVEL>_*.tsv`, then rebuild.** `<LEVEL>.json` is generated output.
  - TSV format: tab-separated with `csv.QUOTE_NONE`. Fields must not contain tabs or newlines.
  - Header: `word pos note meaning_vi definition_en definition_vi example_en example_vi ipa image_prompt`. The oldest A1 batch files have no `note` column.
- **`example_en` must contain exactly one `{{...}}`, wrapping the whole inflected form** (`{{cells}}`, never `{{cell}}s`). The word must not appear elsewhere in the sentence. The app masks this span, and both the base word and the masked form count as correct answers.
- **Do not change `SEED` in `build_units.py`, or `UNIT_SIZE`.** Doing so reshuffles every unit and breaks saved learner progress.
- **In `parse_oxford.py`, the 3000 PDF writes a level after each POS group**, while the 5000 PDF only has `B2`/`C1` section headers. When the same `(word, pos, sense, homonym)` appears in both files, the lower level is kept.

## Content conventions

- American English senses and spelling: gas = xăng, `revise` = edit, pound = weight first, `around` rather than `round`. The source is the *American* Oxford list.
- US IPA in `ər` / `ɜːr` style, between slashes.
- Write definitions and examples in your own words. Do not copy Oxford (copyright note in plan §5.7).
- `image_prompt`: a flat cartoon scene for all ages, with no text and no violence. Sensitive words get a gentle depiction.
- For bulk content the user wants Opus to act as manager: Sonnet subagents write about 6 units each, in parallel, each with its own scratch folder. Opus then reviews with `check_content.py` plus manual sampling, fixes errors, and reports in Vietnamese. Recurring Sonnet mistakes:
  - British senses instead of American ones
  - the wrong homonym (check the other homonym in `wordlist.json`)
  - masks that cut a word
