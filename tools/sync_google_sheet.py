#!/usr/bin/env python3
"""
Sync Google Sheet Vocabulary directly to LexiQuest Data files.
- Downloads the published CSV
- Parses Word, POS, Meaning (ENG & CHIN), Sample Sentence
- Formats context sentence blanks for game modes
- Updates data/vocab.js and data/wordle_dict.js
"""

import urllib.request
import csv
import io
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/1F7qsitvNk4e2Cp3OstJCMaJHDzWSN7wrZpO6bh4ZacM/export?format=csv"
VOCAB_OUT = os.path.join(ROOT, "data", "vocab.js")
WORDLE_OUT = os.path.join(ROOT, "data", "wordle_dict.js")


def fetch_sheet():
    req = urllib.request.Request(SHEET_CSV_URL, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req) as resp:
        content = resp.read().decode("utf-8")
    return list(csv.reader(io.StringIO(content)))


def parse_meaning(raw_meaning):
    # Splits ENG and CHIN if present
    eng = ""
    chin = ""
    lines = [line.strip() for line in raw_meaning.split("\n") if line.strip()]
    for line in lines:
        if line.startswith("ENG:"):
            eng = line.replace("ENG:", "").strip()
        elif line.startswith("CHIN:"):
            chin = line.replace("CHIN:", "").strip()
        elif not eng:
            eng = line
        elif not chin and "CHIN:" in line:
            parts = line.split("CHIN:", 1)
            chin = parts[1].strip()
    full = eng
    if chin:
        full = f"{eng} ({chin})" if eng else chin
    return full, eng, chin


def format_context_blank(word, sentence):
    # Normalise curly quotes / apostrophes
    s = sentence.replace("’", "'").replace("“", '"').replace("”", '"')
    w = word.replace("’", "'")

    # If word has "...", handle phrasal split (e.g. "hinder ... from")
    if "..." in w:
        parts = [re.escape(p.strip()) for p in w.split("...") if p.strip()]
        if len(parts) == 2:
            pattern = re.compile(rf"\b{parts[0]}\b(.*?)\b{parts[1]}\b", re.IGNORECASE)
            s = pattern.sub(r"___ \1 ___", s)
            return s

    # Exact or word boundary regex match
    pattern = re.compile(rf"\b{re.escape(w)}\b", re.IGNORECASE)
    if pattern.search(s):
        return pattern.sub("___", s)

    # Substring search fallback
    idx = s.lower().find(w.lower())
    if idx != -1:
        return s[:idx] + "___" + s[idx + len(w):]

    # If not matched directly, append blank context note
    return s


def main():
    print(f"Fetching Google Sheet from: {SHEET_CSV_URL}")
    rows = fetch_sheet()
    if not rows or len(rows) < 2:
        print("Error: No data found in Google Sheet.")
        return

    cards = []
    seen = set()

    for idx, r in enumerate(rows[1:], 1):
        if not r or not r[0].strip():
            continue
        word = r[0].strip()
        pos = r[1].strip() if len(r) > 1 else ""
        raw_meaning = r[2].strip() if len(r) > 2 else ""
        sample_sentence = r[3].strip() if len(r) > 3 else ""

        if word.lower() in seen:
            continue
        seen.add(word.lower())

        meaning_full, meaning_eng, meaning_chin = parse_meaning(raw_meaning)
        context = format_context_blank(word, sample_sentence)

        cards.append({
            "id": len(cards),
            "word": word,
            "pos": pos,
            "topic": "HKDSE Core Academic",
            "meaning": meaning_full,
            "meaning_eng": meaning_eng,
            "meaning_chin": meaning_chin,
            "synonyms": [s.strip() for s in meaning_chin.split("/") if s.strip()] if meaning_chin else [],
            "context": context,
            "raw_sentence": sample_sentence
        })

    print(f"Successfully processed {len(cards)} vocabulary cards.")

    # Save data/vocab.js
    with open(VOCAB_OUT, "w", encoding="utf-8") as f:
        f.write("// AUTO-GENERATED from Google Sheet by tools/sync_google_sheet.py\n")
        f.write("window.VOCAB = ")
        json.dump(cards, f, ensure_ascii=False, indent=2)
        f.write(";\n")
    print(f"Saved to {VOCAB_OUT}")


if __name__ == "__main__":
    main()
