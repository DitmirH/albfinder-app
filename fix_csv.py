#!/usr/bin/env python3
"""Fix corrupted data.csv: remove JSON from wrong columns, keep only ai_input."""
import csv
import json

INPUT = "data.csv"
OUTPUT = "data.csv"

with open(INPUT, "r", encoding="utf-8") as f:
    reader = csv.reader(f)
    first_row = next(reader)
    header = next(reader)
    rows = list(reader)

print(f"Header: {len(header)} columns")
print(f"Data rows: {len(rows)}")

# Find the ai_input column index
try:
    ai_idx = header.index("ai_input")
except ValueError:
    ai_idx = None

fixes = 0
for row_idx, row in enumerate(rows):
    for col_idx in range(len(row)):
        if col_idx == ai_idx:
            continue  # skip ai_input — that's where JSON belongs
        val = row[col_idx].strip()
        # Check if this cell contains JSON that doesn't belong
        if val.startswith("{") and ("emails" in val or "phones" in val):
            col_name = header[col_idx] if col_idx < len(header) else f"col_{col_idx}"
            print(f"  Row {row_idx+1}: Removing JSON from [{col_idx}] {col_name}")
            row[col_idx] = "-"
            fixes += 1

print(f"\nFixed {fixes} cells")

# Write back
with open(OUTPUT, "w", encoding="utf-8", newline="") as f:
    writer = csv.writer(f)
    writer.writerow(first_row)
    writer.writerow(header)
    for row in rows:
        writer.writerow(row)

print(f"Wrote fixed CSV to {OUTPUT}")
