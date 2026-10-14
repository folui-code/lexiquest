#!/usr/bin/env python3
"""
Generate Cryptographic Whitelist & Official Roster for HPCCSS students and staff.
- Reads uploads/whitelist/Vocab student list.xlsx
- Extracts all legitimate @*.hpccss.edu.hk emails and official names
- Supports domain aliases (e.g. @teacher.hpccss.edu.hk <-> @hpccss.edu.hk)
- Hashes each normalized email with SHA-256
- Outputs data/whitelist_hashes.js with:
    1. window.HPCCSS_HASH_WHITELIST (Set of approved SHA-256 hashes)
    2. window.HPCCSS_CANONICAL_MAP (Alias hash -> Canonical primary hash)
    3. window.HPCCSS_ROSTER (SHA-256 hash -> Official Name)
- Prevents students/teachers from typing custom or inconsistent nicknames
"""

import openpyxl
import hashlib
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
XLSX_PATH = os.path.join(ROOT, "uploads", "whitelist", "Vocab student list.xlsx")
OUT_JS = os.path.join(ROOT, "data", "whitelist_hashes.js")

def hash_email(email_str):
    norm = email_str.strip().lower()
    return hashlib.sha256(norm.encode("utf-8")).hexdigest()

def get_aliases(email_str):
    norm = email_str.strip().lower()
    user, domain = norm.split("@")
    aliases = [norm]
    if domain == "teacher.hpccss.edu.hk":
        aliases.append(f"{user}@hpccss.edu.hk")
    elif domain == "staff.hpccss.edu.hk":
        aliases.append(f"{user}@hpccss.edu.hk")
    elif domain == "student.hpccss.edu.hk":
        aliases.append(f"{user}@hpccss.edu.hk")
    elif domain == "hpccss.edu.hk":
        aliases.append(f"{user}@teacher.hpccss.edu.hk")
        aliases.append(f"{user}@staff.hpccss.edu.hk")
    return aliases

def main():
    if not os.path.exists(XLSX_PATH):
        print(f"Error: {XLSX_PATH} does not exist.")
        return

    wb = openpyxl.load_workbook(XLSX_PATH, data_only=True)
    hashes = set()
    canonical_map = {}
    roster = {}

    def add_entry(primary_email, disp_name):
        primary_norm = primary_email.strip().lower()
        primary_hash = hash_email(primary_norm)
        hashes.add(primary_hash)
        canonical_map[primary_hash] = primary_hash
        roster[primary_hash] = disp_name

        for alias in get_aliases(primary_norm):
            alias_hash = hash_email(alias)
            hashes.add(alias_hash)
            canonical_map[alias_hash] = primary_hash
            roster[alias_hash] = disp_name

    # 1. Students
    if "Student" in wb.sheetnames:
        ws = wb["Student"]
        for r in range(2, ws.max_row + 1):
            email = ws.cell(r, 10).value
            enname = ws.cell(r, 5).value
            cls = ws.cell(r, 3).value
            if email and isinstance(email, str) and "@" in email and enname:
                disp_name = f"{enname.strip()} ({cls.strip()})" if cls else enname.strip()
                add_entry(email, disp_name)

    # 2. Staff
    if "Staff" in wb.sheetnames:
        ws = wb["Staff"]
        for r in range(2, ws.max_row + 1):
            enname = ws.cell(r, 2).value
            email = ws.cell(r, 5).value
            role = ws.cell(r, 1).value
            if email and isinstance(email, str) and "@" in email and enname:
                disp_name = f"{enname.strip()} ({role.strip()})" if role else enname.strip()
                add_entry(email, disp_name)

    sorted_hashes = sorted(list(hashes))

    os.makedirs(os.path.dirname(OUT_JS), exist_ok=True)
    with open(OUT_JS, "w", encoding="utf-8") as f:
        f.write("// HPCCSS OFFICIAL ENCRYPTED WHITELIST & ROSTER\n")
        f.write("// Automatically generated from official school Excel list\n")
        f.write("window.HPCCSS_HASH_WHITELIST = new Set(")
        json.dump(sorted_hashes, f, indent=2)
        f.write(");\n\n")
        f.write("window.HPCCSS_CANONICAL_MAP = ")
        json.dump(canonical_map, f, indent=2)
        f.write(";\n\n")
        f.write("window.HPCCSS_ROSTER = ")
        json.dump(roster, f, indent=2, ensure_ascii=False)
        f.write(";\n")

    print(f"Exported {len(sorted_hashes)} hashes, {len(canonical_map)} canonical mappings, and {len(roster)} roster entries to {OUT_JS}")

if __name__ == "__main__":
    main()
