#!/usr/bin/env python3
"""
Generate Cryptographic Whitelist (SHA-256 Hashes) for HPCCSS students and staff.
- Reads uploads/whitelist/Vocab student list.xlsx
- Extracts all legitimate @*.hpccss.edu.hk emails
- Hashes each normalized email with SHA-256 (one-way, irreversible)
- Outputs data/whitelist_hashes.js for the client-side authentication guard
- ZERO personal info (no names, no class, no student IDs, no plain emails) is exported
"""

import openpyxl
import re
import hashlib
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
XLSX_PATH = os.path.join(ROOT, "uploads", "whitelist", "Vocab student list.xlsx")
OUT_JS = os.path.join(ROOT, "data", "whitelist_hashes.js")

EMAIL_REGEX = re.compile(r"[a-zA-Z0-9_.+-]+@(?:[a-zA-Z0-9-]+\.)*hpccss\.edu\.hk", re.IGNORECASE)

def hash_email(email_str):
    # Normalized: stripped of whitespace and lowercase
    norm = email_str.strip().lower()
    return hashlib.sha256(norm.encode("utf-8")).hexdigest()

def main():
    if not os.path.exists(XLSX_PATH):
        print(f"Error: {XLSX_PATH} does not exist.")
        return

    wb = openpyxl.load_workbook(XLSX_PATH, data_only=True)
    emails = set()

    for sheet_name in wb.sheetnames:
        ws = wb[sheet_name]
        for row in ws.iter_rows(values_only=True):
            for cell in row:
                if cell and isinstance(cell, str):
                    matches = EMAIL_REGEX.findall(cell)
                    for m in matches:
                        emails.add(m.strip().lower())

    print(f"Found {len(emails)} unique valid HPCCSS email addresses.")

    # Convert all emails into SHA-256 hashes
    hashes = sorted(list({hash_email(e) for e in emails}))

    os.makedirs(os.path.dirname(OUT_JS), exist_ok=True)
    with open(OUT_JS, "w", encoding="utf-8") as f:
        f.write("// SECURE ENCRYPTED WHITELIST (SHA-256 HASHES ONLY)\n")
        f.write("// Contains ZERO plain emails, names, or student IDs. Fully privacy-compliant.\n")
        f.write("window.HPCCSS_HASH_WHITELIST = new Set(")
        json.dump(hashes, f, indent=2)
        f.write(");\n")

    print(f"Exported {len(hashes)} secure hashes to {OUT_JS}")

if __name__ == "__main__":
    main()
