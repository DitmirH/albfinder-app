#!/usr/bin/env python3
"""Clean up phone numbers in data_expanded.csv — remove non-UK numbers.

Also rebuilds enrich_progress.json from the expanded columns so enrich.py
can resume without re-processing already-enriched records.
"""
import csv
import json
import re


def is_uk_phone(phone):
    """Return True if phone looks like a plausible UK telephone number."""
    p = phone.strip()
    if not p:
        return False
    digits_only = re.sub(r"[^0-9+]", "", p)

    # Explicit UK accept
    if digits_only.startswith("+44") or digits_only.startswith("044"):
        return True
    # Domestic UK
    if re.match(r"^0[1-9]", digits_only):
        if digits_only.startswith("04") and len(digits_only) == 10:
            return False  # Australian mobile
        return True

    # Explicit non-UK reject
    non_uk = ["+1", "+49", "+61", "+355", "+33", "+34", "+39", "+31",
              "+91", "+86", "+81", "+82", "+7", "+52", "+55", "+48", "+353"]
    for prefix in non_uk:
        if digits_only.startswith(prefix):
            return False
    # US format: (xxx) xxx-xxxx
    if re.match(r"^\(?\d{3}\)?[\s.\-]\d{3}[\s.\-]\d{4}$", p):
        return False
    # US toll-free
    if re.match(r"^1[\-\s]?[89]\d{2}", p):
        return False
    if re.match(r"^(800|866|877|888|855)", digits_only):
        return False
    # US 11-digit
    if re.match(r"^1\d{10}$", digits_only):
        return False
    # Too short
    if len(digits_only) < 7:
        return False
    return True


# Read data_expanded.csv
with open("data_expanded.csv", "r", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    rows = list(reader)
    fieldnames = reader.fieldnames

total_phones = 0
rejected_phones = 0
cleaned_rows = 0

for row in rows:
    phones_str = row.get("phones", "")
    if phones_str:
        phones = [p.strip() for p in phones_str.split(";") if p.strip()]
        total_phones += len(phones)
        uk_phones = [p for p in phones if is_uk_phone(p)]
        rejected = len(phones) - len(uk_phones)
        rejected_phones += rejected
        if rejected > 0:
            bad = [p for p in phones if not is_uk_phone(p)]
            director = row.get("director_name", "?")
            company = row.get("company_name", "?")
            print(f"  [{director} / {company}] Rejected {rejected}: {bad}")
            cleaned_rows += 1
        row["phones"] = "; ".join(uk_phones)

# Write cleaned data back
with open("data_expanded.csv", "w", encoding="utf-8", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(rows)

print(f"\nSummary:")
print(f"  Total phones found: {total_phones}")
print(f"  Rejected non-UK:    {rejected_phones}")
print(f"  Records cleaned:    {cleaned_rows}")
print(f"  Written back to data_expanded.csv")

# --- Rebuild enrich_progress.json from expanded columns ---
ENRICHED_COLS = [
    "website", "address_is_trading_premises", "notes", "emails", "phones",
    "listing_urls", "social_media_facebook", "social_media_instagram",
    "social_media_twitter", "social_media_linkedin", "social_media_tiktok",
]

progress = {}
for idx, row in enumerate(rows, 1):
    emails_str = row.get("emails", "")
    phones_str = row.get("phones", "")
    listing_str = row.get("listing_urls", "")
    atp_str = row.get("address_is_trading_premises", "")

    ai_data = {
        "emails": [e.strip() for e in emails_str.split(";") if e.strip()] if emails_str else [],
        "phones": [p.strip() for p in phones_str.split(";") if p.strip()] if phones_str else [],
        "website": row.get("website") or None,
        "social_media": {
            "facebook": row.get("social_media_facebook") or None,
            "instagram": row.get("social_media_instagram") or None,
            "twitter": row.get("social_media_twitter") or None,
            "linkedin": row.get("social_media_linkedin") or None,
            "tiktok": row.get("social_media_tiktok") or None,
        },
        "listing_urls": [u.strip() for u in listing_str.split(";") if u.strip()] if listing_str else [],
        "address_is_trading_premises": (
            True if atp_str.lower() == "true"
            else False if atp_str.lower() == "false"
            else None
        ),
        "notes": row.get("notes") or "",
    }

    # Only save if there's actual data
    has_data = (
        ai_data["emails"] or ai_data["phones"] or ai_data["website"]
        or any(v for v in ai_data["social_media"].values())
        or ai_data["listing_urls"]
        or ai_data["address_is_trading_premises"] is not None
        or ai_data["notes"]
    )
    if has_data:
        progress[str(idx)] = json.dumps(ai_data, ensure_ascii=False)

with open("enrich_progress.json", "w", encoding="utf-8") as f:
    json.dump(progress, f, indent=2, ensure_ascii=False)

print(f"\n  Rebuilt enrich_progress.json: {len(progress)} enriched records")
print("  Done!")
