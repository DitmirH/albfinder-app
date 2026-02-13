#!/usr/bin/env python3
"""Quick check: verify columns are mapped correctly in data.csv."""
import csv

with open("data.csv", "r", encoding="utf-8") as f:
    reader = csv.reader(f)
    next(reader)  # Table 1
    header = next(reader)
    
    # Check row 1 (A. K. LONDON CONSTRUCTIONS)
    row = next(reader)
    print("Row 1 - A.K. LONDON CONSTRUCTIONS:")
    for i, col in enumerate(header):
        v = row[i] if i < len(row) else ""
        if v and v != "-":
            print(f"  [{i:2d}] {col:40s} = {v[:80]}")
    
    print()
    # Check row 2 (DOCTORS' GENERAL CLINIC)
    row = next(reader)
    print("Row 2 - DOCTORS' GENERAL CLINIC:")
    for i, col in enumerate(header):
        v = row[i] if i < len(row) else ""
        if v and v != "-":
            print(f"  [{i:2d}] {col:40s} = {v[:80]}")
