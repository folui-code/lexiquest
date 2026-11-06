#!/usr/bin/env python3
"""
Sync Google Sheet Vocabulary directly to LexiQuest Data files.
- Downloads the entire workbook via XLSX export
- Supports multiple grade level tabs (e.g. 'S4 (2026-27)', 'S5 (2026-27)')
- Automatically detects column headers regardless of column order:
    - Set (e.g. 1, 2, 3...)
    - Content (e.g. Writing 1, Writing 2, Exemplar...)
    - Word / Phrase
    - Part of Speech
    - Meaning (ENG & CHIN)
    - Sample Sentence
- Outputs structured vocabulary to data/vocab.js
"""

import urllib.request
import io
import json
import os
import re
import openpyxl

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHEET_XLSX_URL = "https://docs.google.com/spreadsheets/d/1F7qsitvNk4e2Cp3OstJCMaJHDzWSN7wrZpO6bh4ZacM/export?format=xlsx"
VOCAB_OUT = os.path.join(ROOT, "data", "vocab.js")


def fetch_workbook():
    req = urllib.request.Request(SHEET_XLSX_URL, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req) as resp:
        data = resp.read()
    return openpyxl.load_workbook(io.BytesIO(data), data_only=True)


def parse_meaning(raw_meaning):
    if not raw_meaning:
        return "", "", ""
    text = str(raw_meaning).strip()
    eng = ""
    chin = ""
    lines = [line.strip() for line in text.split("\n") if line.strip()]
    for line in lines:
        if line.startswith("ENG:"):
            eng = line.replace("ENG:", "").strip()
        elif line.startswith("CHIN:"):
            chin = line.replace("CHIN:", "").strip()
        elif not chin and "CHIN:" in line:
            parts = line.split("CHIN:", 1)
            chin = parts[1].strip()

    if not (eng and chin):
        non_ch = [l for l in lines if not re.search(r"[\u4e00-\u9fff]", l)]
        ch = [l for l in lines if re.search(r"[\u4e00-\u9fff]", l)]
        if non_ch and ch:
            eng = " ".join(non_ch).strip()
            chin = " ".join(ch).strip()
        elif " / " in text:
            # Find a ' / ' separator where left is purely English and right has Chinese
            parts = text.split(" / ", 1)
            if not re.search(r"[\u4e00-\u9fff]", parts[0]) and re.search(r"[\u4e00-\u9fff]", parts[1]):
                eng = parts[0].strip()
                chin = parts[1].strip()
            elif re.search(r"[\u4e00-\u9fff]", parts[0]) and not re.search(r"[\u4e00-\u9fff]", parts[1]):
                chin = parts[0].strip()
                eng = parts[1].strip()
        if not (eng and chin):
            # Match parenthetical block containing Chinese (greedy inner so nested parens like (慷慨（關愛）) stay intact)
            match = re.search(r"[\(（]([^\(（]*[\u4e00-\u9fff].*)[\)）]\s*$", text)
            if not match:
                match = re.search(r"[\(（]([^\)）]*[\u4e00-\u9fff][^\)）]*)[\)）]", text)
            if match:
                chin = match.group(1).strip()
                eng = (text[:match.start()] + text[match.end():]).strip()
            elif "/" in text:
                parts = text.split("/", 1)
                if not re.search(r"[\u4e00-\u9fff]", parts[0]) and re.search(r"[\u4e00-\u9fff]", parts[1]):
                    eng = parts[0].strip()
                    chin = parts[1].strip()
                elif re.search(r"[\u4e00-\u9fff]", parts[0]) and not re.search(r"[\u4e00-\u9fff]", parts[1]):
                    chin = parts[0].strip()
                    eng = parts[1].strip()

    if not eng:
        eng = text
    if not chin:
        match_ch = re.search(r"[\u4e00-\u9fff]+.*", text)
        if match_ch:
            chin = match_ch.group(0).strip()

    eng = re.sub(r"^ENG:\s*", "", eng, flags=re.IGNORECASE).strip()
    eng = re.sub(r"[\(（]\s*[\)）]", "", eng).strip()
    chin = re.sub(r"^CHIN:\s*", "", chin, flags=re.IGNORECASE).strip()
    chin = chin.strip()
    if len(chin) >= 2 and chin[0] in "(（" and chin[-1] in ")）":
        chin = chin[1:-1].strip()
    if "（" in chin and "）" not in chin and ")" not in chin:
        chin += "）"

    full = eng
    if chin and chin not in eng:
        full = f"{eng} ({chin})"
    return full, eng, chin


def format_context_blank(word, sentence):
    if not sentence:
        return ""
    s = str(sentence).replace("’", "'").replace("“", '"').replace("”", '"')
    w = str(word).replace("’", "'").strip()

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

    return s


def map_columns(headers):
    mapping = {
        "set": None,
        "content": None,
        "word": None,
        "pos": None,
        "meaning": None,
        "sentence": None
    }
    for idx, h in enumerate(headers):
        if not h:
            continue
        h_norm = h.strip().lower()
        if re.search(r"\bset\b|\bunit\b|\bchapter\b", h_norm):
            mapping["set"] = idx
        elif re.search(r"\bcontent\b|\bsource\b|\bwriting\b|\btask\b", h_norm):
            mapping["content"] = idx
        elif re.search(r"\bword\b|\bphrase\b|\bterm\b", h_norm):
            mapping["word"] = idx
        elif re.search(r"\bpos\b|\bpart of speech\b|\bclass\b", h_norm):
            mapping["pos"] = idx
        elif re.search(r"\bmeaning\b|\bdefinition\b", h_norm):
            mapping["meaning"] = idx
        elif re.search(r"\bsentence\b|\bsample\b|\bexample\b|\bcontext\b", h_norm):
            mapping["sentence"] = idx

    # Positional fallbacks if some standard columns weren't explicitly matched
    if mapping["word"] is None and len(headers) > 0:
        mapping["word"] = 0
    if mapping["pos"] is None and len(headers) > 1:
        mapping["pos"] = 1
    if mapping["meaning"] is None and len(headers) > 2:
        mapping["meaning"] = 2
    if mapping["sentence"] is None and len(headers) > 3:
        mapping["sentence"] = 3

    return mapping


def clean_set(val):
    if val is None:
        return "1"
    if isinstance(val, (int, float)):
        return str(int(val))
    s = str(val).strip()
    s = re.sub(r"\.0+$", "", s)
    s = re.sub(r"^set\s*", "", s, flags=re.IGNORECASE).strip()
    return s or "1"


def get_cell(row, idx):
    if idx is None or idx >= len(row):
        return ""
    val = row[idx]
    return str(val).strip() if val is not None else ""


def main():
    print(f"Fetching Google Sheet workbook from: {SHEET_XLSX_URL}")
    wb = fetch_workbook()
    print(f"Discovered sheets: {wb.sheetnames}")

    cards = []
    seen = set()

    for sheet_name in wb.sheetnames:
        ws = wb[sheet_name]
        if ws.max_row < 2:
            continue

        # Extract level from sheet title (e.g. 'S4 (2026-27)' -> 'S4')
        level_match = re.search(r"\b(S[1-6])\b", sheet_name, re.IGNORECASE)
        level = level_match.group(1).upper() if level_match else "S4"

        headers = [str(ws.cell(1, c).value or "").strip() for c in range(1, ws.max_column + 1)]
        col_map = map_columns(headers)
        print(f"Sheet '{sheet_name}' (Level: {level}) mapped columns: {col_map}")

        sheet_cards = 0
        for r_idx in range(2, ws.max_row + 1):
            row_vals = [ws.cell(r_idx, c).value for c in range(1, ws.max_column + 1)]
            word = get_cell(row_vals, col_map["word"])
            if not word:
                continue

            # Duplicate check across levels
            key = f"{level}:{word.lower()}"
            if key in seen:
                continue
            seen.add(key)

            pos = get_cell(row_vals, col_map["pos"])
            raw_meaning = get_cell(row_vals, col_map["meaning"])
            sample_sentence = get_cell(row_vals, col_map["sentence"])
            raw_set = row_vals[col_map["set"]] if col_map["set"] is not None and col_map["set"] < len(row_vals) else None
            set_str = clean_set(raw_set)
            content_val = get_cell(row_vals, col_map["content"]) or f"Set {set_str}"

            meaning_full, meaning_eng, meaning_chin = parse_meaning(raw_meaning)
            context = format_context_blank(word, sample_sentence)

            topic_label = f"Set {set_str} · {content_val}" if content_val else f"Set {set_str}"

            cards.append({
                "id": len(cards),
                "key": key,
                "word": word,
                "pos": pos,
                "level": level,
                "set": set_str,
                "content": content_val,
                "topic": topic_label,
                "meaning": meaning_full,
                "meaning_eng": meaning_eng,
                "meaning_chin": meaning_chin,
                "synonyms": [s.strip() for s in meaning_chin.split("/") if s.strip()] if meaning_chin else [],
                "context": context,
                "raw_sentence": sample_sentence
            })
            sheet_cards += 1

        print(f"  -> Added {sheet_cards} cards from '{sheet_name}'")

    print(f"\nTotal vocabulary cards processed: {len(cards)}")

    # Write data/vocab.js
    with open(VOCAB_OUT, "w", encoding="utf-8") as f:
        f.write("// AUTO-GENERATED from Google Sheet by tools/sync_google_sheet.py\n")
        f.write("window.VOCAB = ")
        json.dump(cards, f, ensure_ascii=False, indent=2)
        f.write(";\n")
    print(f"Successfully saved to {VOCAB_OUT}")


if __name__ == "__main__":
    main()
