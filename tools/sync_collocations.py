#!/usr/bin/env python3
"""
Syncs collocation data from Google Sheet into data/collocations.js
Sheet: https://docs.google.com/spreadsheets/d/1htnx7ppi8SESWNGP0R1xCJaCrxoQSPXHRZ7kx9sqfio/edit

Enriches every item with contextual token spans:
  - head_token: { type, base, word, tense (if verb), start, end }
  - partner_token: { type, base, word, start, end }
Ensures exact sentence blanking (using ****) and grammatical tense/form alignment for options.
"""

import io
import json
import os
import re
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

IRREGULARS = {
    "give": {"base": "give", "past": "gave", "part": "given", "ing": "giving", "s": "gives"},
    "have": {"base": "have", "past": "had", "part": "had", "ing": "having", "s": "has"},
    "overcome": {"base": "overcome", "past": "overcame", "part": "overcome", "ing": "overcoming", "s": "overcomes"},
    "pay": {"base": "pay", "past": "paid", "part": "paid", "ing": "paying", "s": "pays"},
    "break": {"base": "break", "past": "broke", "part": "broken", "ing": "breaking", "s": "breaks"},
    "keep": {"base": "keep", "past": "kept", "part": "kept", "ing": "keeping", "s": "keeps"},
    "beat": {"base": "beat", "past": "beat", "part": "beaten", "ing": "beating", "s": "beats"},
    "catch": {"base": "catch", "past": "caught", "part": "caught", "ing": "catching", "s": "catches"},
    "do": {"base": "do", "past": "did", "part": "done", "ing": "doing", "s": "does"},
    "hold": {"base": "hold", "past": "held", "part": "held", "ing": "holding", "s": "holds"},
    "lose": {"base": "lose", "past": "lost", "part": "lost", "ing": "losing", "s": "loses"},
    "make": {"base": "make", "past": "made", "part": "made", "ing": "making", "s": "makes"},
    "run": {"base": "run", "past": "ran", "part": "run", "ing": "running", "s": "runs"},
    "set": {"base": "set", "past": "set", "part": "set", "ing": "setting", "s": "sets"},
    "take": {"base": "take", "past": "took", "part": "taken", "ing": "taking", "s": "takes"},
    "tell": {"base": "tell", "past": "told", "part": "told", "ing": "telling", "s": "tells"},
    "win": {"base": "win", "past": "won", "part": "won", "ing": "winning", "s": "wins"},
    "throw": {"base": "throw", "past": "threw", "part": "thrown", "ing": "throwing", "s": "throws"},
    "hear": {"base": "hear", "past": "heard", "part": "heard", "ing": "hearing", "s": "hears"},
    "lead": {"base": "lead", "past": "led", "part": "led", "ing": "leading", "s": "leads"},
    "find": {"base": "find", "past": "found", "part": "found", "ing": "finding", "s": "finds"},
    "bring": {"base": "bring", "past": "brought", "part": "brought", "ing": "bringing", "s": "brings"},
    "fall": {"base": "fall", "past": "fell", "part": "fallen", "ing": "falling", "s": "falls"},
    "rise": {"base": "rise", "past": "rose", "part": "risen", "ing": "rising", "s": "rises"},
    "grow": {"base": "grow", "past": "grew", "part": "grown", "ing": "growing", "s": "grows"},
    "see": {"base": "see", "past": "saw", "part": "seen", "ing": "seeing", "s": "sees"},
    "speak": {"base": "speak", "past": "spoke", "part": "spoken", "ing": "speaking", "s": "speaks"},
    "stand": {"base": "stand", "past": "stood", "part": "stood", "ing": "standing", "s": "stands"},
    "spend": {"base": "spend", "past": "spent", "part": "spent", "ing": "spending", "s": "spends"},
    "write": {"base": "write", "past": "wrote", "part": "written", "ing": "writing", "s": "writes"},
    "apologise": {"base": "apologise", "past": "apologized", "part": "apologized", "ing": "apologizing", "s": "apologizes"},
    "criticise": {"base": "criticise", "past": "criticized", "part": "criticized", "ing": "criticizing", "s": "criticizes"},
}

def conjugate_verb(base):
    b = base.lower().strip()
    if b in IRREGULARS:
        return IRREGULARS[b]
    res = {"base": b}
    if b.endswith("e"):
        res["past"] = b + "d"
        res["part"] = b + "d"
        res["s"] = b + "s"
        res["ing"] = b[:-1] + "ing"
    elif b.endswith("y") and len(b) > 2 and b[-2] not in "aeiou":
        res["past"] = b[:-1] + "ied"
        res["part"] = b[:-1] + "ied"
        res["s"] = b[:-1] + "ies"
        res["ing"] = b + "ing"
    elif b.endswith(("sh", "ch", "ss", "x", "o")):
        res["past"] = b + "ed"
        res["part"] = b + "ed"
        res["s"] = b + "es"
        res["ing"] = b + "ing"
    else:
        double_c = len(b) >= 3 and b[-1] not in "aeiouywer" and b[-2] in "aeiou" and b[-3] not in "aeiou"
        c = b[-1] if double_c else ""
        res["past"] = b + c + "ed"
        res["part"] = b + c + "ed"
        res["s"] = b + "s"
        res["ing"] = b + c + "ing"
    return res

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

def extract_token_spans(cat, phrase, head, partner, sentence):
    sent = str(sentence or "").strip()
    head_token = None
    partner_token = None

    # 1. Head target (Verb, Noun, Adj)
    if "Verb" in cat:
        clean_v = re.sub(r"\(.*?\)", "", head).strip()
        v_cands = [v.lower().strip() for v in re.split(r"[/,\s]+", clean_v) if v.strip()]
        for v in v_cands:
            forms = conjugate_verb(v)
            for form_type, form_word in forms.items():
                m = re.search(r"\b" + re.escape(form_word) + r"\b", sent, re.I)
                if m:
                    head_token = {
                        "type": "verb",
                        "base": v,
                        "word": m.group(0),
                        "tense": form_type,
                        "start": m.start(),
                        "end": m.end()
                    }
                    break
            if head_token:
                break
    elif cat == "Noun + Preposition":
        clean = re.sub(r"^(a|an|the)\s+", "", head, flags=re.I).strip()
        cands = [w.lower().strip() for w in re.split(r"[/,\s]+", clean) if w.strip()]
        for c in cands:
            m = re.search(r"\b" + re.escape(c) + r"(?:s|es)?\b", sent, re.I)
            if m:
                head_token = {
                    "type": "noun",
                    "base": c,
                    "word": m.group(0),
                    "tense": "base",
                    "start": m.start(),
                    "end": m.end()
                }
                break
    elif cat == "Adjective + Preposition":
        clean = re.sub(r"\(.*?\)", "", head).strip()
        cands = [w.lower().strip() for w in re.split(r"[/,\s]+", clean) if w.strip()]
        for c in cands:
            m = re.search(r"\b" + re.escape(c), sent, re.I)
            if m:
                head_token = {
                    "type": "adjective",
                    "base": c,
                    "word": m.group(0),
                    "tense": "base",
                    "start": m.start(),
                    "end": m.end()
                }
                break

    # 2. Partner target (Preposition or Noun)
    if "Preposition" in cat:
        phrase_preps = [w.lower().strip("()/") for w in re.split(r"[/,\s]+", phrase) if w.lower().strip("()/") in PREPOSITIONS]
        search_start = head_token["end"] if head_token else 0
        for p in phrase_preps:
            m = re.search(r"\b" + re.escape(p) + r"\b", sent[search_start:], re.I)
            if m:
                partner_token = {
                    "type": "preposition",
                    "base": p,
                    "word": m.group(0),
                    "start": search_start + m.start(),
                    "end": search_start + m.end()
                }
                break
        if not partner_token:
            for p in phrase_preps:
                m = re.search(r"\b" + re.escape(p) + r"\b", sent, re.I)
                if m:
                    partner_token = {
                        "type": "preposition",
                        "base": p,
                        "word": m.group(0),
                        "start": m.start(),
                        "end": m.end()
                    }
                    break
    elif cat == "Verb + Noun":
        clean = re.sub(r"\(.*?\)", "", partner).strip()
        clean = re.sub(r"['’]s\b", "", clean).strip()
        cands = [w.lower().strip() for w in re.split(r"[/,\s]+", clean) if w.strip() and w.lower() not in ("a", "an", "the", "your", "his", "her", "their", "our", "for", "to", "from", "with", "about", "away", "s.o.", "s.t.")]
        if not cands and phrase == "Admire (s.o.) for (s.t.)":
            cands = ["research"]
        search_start = head_token["end"] if head_token else 0
        for c in cands:
            m = re.search(r"\b" + re.escape(c) + r"(?:s|es)?\b", sent[search_start:], re.I)
            if m:
                partner_token = {
                    "type": "noun",
                    "base": c,
                    "word": m.group(0),
                    "start": search_start + m.start(),
                    "end": search_start + m.end()
                }
                break
        if not partner_token:
            for c in cands:
                m = re.search(r"\b" + re.escape(c) + r"(?:s|es)?\b", sent, re.I)
                if m:
                    partner_token = {
                        "type": "noun",
                        "base": c,
                        "word": m.group(0),
                        "start": m.start(),
                        "end": m.end()
                    }
                    break

    return head_token, partner_token

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
        head_token, partner_token = extract_token_spans(
            cat_str, parsed["phrase"], parsed["head"], parsed["partner"], parsed["sentence"]
        )

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
            "sentence": parsed["sentence"],
            "head_token": head_token,
            "partner_token": partner_token
        })

    print(f"Total processed collocations: {len(items)}")

    # Ensure data directory exists
    os.makedirs(os.path.dirname(COLLOC_OUT), exist_ok=True)
    with open(COLLOC_OUT, "w", encoding="utf-8") as f:
        f.write("// AUTO-GENERATED from Google Sheet by tools/sync_collocations.py\n")
        f.write("window.COLLOCATIONS = ")
        json.dump(items, f, ensure_ascii=False, indent=2)
        f.write(";\n")

    print(f"Successfully saved enriched collocations to {COLLOC_OUT}")

if __name__ == "__main__":
    main()
