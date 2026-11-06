#!/usr/bin/env python3
"""
Syncs collocation data from Google Sheet into data/collocations.js
Sheet: https://docs.google.com/spreadsheets/d/1htnx7ppi8SESWNGP0R1xCJaCrxoQSPXHRZ7kx9sqfio/edit
"""

import io
import json
import os
import re
import sys
import urllib.request
import openpyxl

SHEET_XLSX_URL = "https://docs.google.com/spreadsheets/d/1htnx7ppi8SESWNGP0R1xCJaCrxoQSPXHRZ7kx9sqfio/export?format=xlsx"
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(SCRIPT_DIR)
COLLOC_OUT = os.path.join(PROJECT_DIR, "data", "collocations.js")

PREPOSITIONS = {
    "about", "for", "of", "to", "towards", "with", "from", "in", "on", 
    "at", "into", "between", "against", "by", "over"
}

def fetch_workbook():
    req = urllib.request.Request(
        SHEET_XLSX_URL,
        headers={"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"}
    )
    with urllib.request.urlopen(req) as resp:
        data = resp.read()
    return openpyxl.load_workbook(io.BytesIO(data))

def parse_meaning(raw_meaning):
    if not raw_meaning:
        return "", ""
    text = str(raw_meaning).strip()
    m_eng = ""
    m_chin = ""
    m = re.search(r"\(([\u4e00-\u9fff].*?)\)", text)
    if m:
        m_chin = m.group(1).strip()
        m_eng = re.sub(r"\([\u4e00-\u9fff].*?\)", "", text).strip()
    else:
        m_eng = text
    return m_eng, m_chin

def decompose_collocation(cat, phrase, raw_meaning, sentence):
    p = str(phrase).strip()
    m_eng, m_chin = parse_meaning(raw_meaning)
    head = ""
    partner = ""
    prep = None

    if cat == "Verb + Noun":
        m_verb = re.match(r"^([A-Za-z]+(?:/[A-Za-z]+)?)\s+(.*)$", p)
        if m_verb:
            head = m_verb.group(1).strip()
            partner = m_verb.group(2).strip()
        else:
            head = p
            partner = ""
    else:
        tokens = p.split()
        prep_idx = -1
        for idx, tok in enumerate(tokens):
            clean_tok = tok.lower().strip("()/,")
            if "/" in clean_tok:
                sub_toks = clean_tok.split("/")
                if any(st in PREPOSITIONS for st in sub_toks):
                    prep = tok.strip("()")
                    prep_idx = idx
                    break
            elif clean_tok in PREPOSITIONS and not tok.startswith("("):
                prep = clean_tok
                prep_idx = idx
                break
        if prep_idx != -1:
            head = " ".join(tokens[:prep_idx]).strip()
            partner = " ".join(tokens[prep_idx:]).strip()
        else:
            head = p
            partner = ""

    return {
        "phrase": p,
        "cat": cat,
        "head": head,
        "partner": partner,
        "prep": prep,
        "meaning_eng": m_eng,
        "meaning_chin": m_chin,
        "sentence": str(sentence or "").strip()
    }

def main():
    print(f"Fetching collocation workbook from: {SHEET_XLSX_URL}")
    wb = fetch_workbook()
    ws = wb.active
    print(f"Loaded sheet: {ws.title} with {ws.max_row} rows")

    items = []
    for r in range(2, ws.max_row + 1):
        num = ws.cell(r, 1).value
        cat = ws.cell(r, 2).value
        phrase = ws.cell(r, 3).value
        pos = ws.cell(r, 4).value
        meaning = ws.cell(r, 5).value
        sentence = ws.cell(r, 6).value

        if not phrase:
            continue

        cat_str = str(cat or "").strip()
        parsed = decompose_collocation(cat_str, phrase, meaning, sentence)
        items.append({
            "id": len(items) + 1,
            "cat": parsed["cat"],
            "phrase": parsed["phrase"],
            "head": parsed["head"],
            "partner": parsed["partner"],
            "prep": parsed["prep"],
            "pos": str(pos or "").strip(),
            "meaning_eng": parsed["meaning_eng"],
            "meaning_chin": parsed["meaning_chin"],
            "sentence": parsed["sentence"]
        })

    print(f"Total processed collocations: {len(items)}")

    # Ensure data directory exists
    os.makedirs(os.path.dirname(COLLOC_OUT), exist_ok=True)
    with open(COLLOC_OUT, "w", encoding="utf-8") as f:
        f.write("// AUTO-GENERATED from Google Sheet by tools/sync_collocations.py\n")
        f.write("window.COLLOCATIONS = ")
        json.dump(items, f, ensure_ascii=False, indent=2)
        f.write(";\n")

    print(f"Successfully saved to {COLLOC_OUT}")

if __name__ == "__main__":
    main()

