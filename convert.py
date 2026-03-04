#!/usr/bin/env python3
"""Convert the CSV data to clean JSON for the frontend app.

Reads data.csv (auto-detects whether 'Table 1' row is present),
merges in enrichment data (from expanded CSV columns OR enrich_progress.json),
and writes public/data.json.
"""
import csv
import json
import os
import sys

csv.field_size_limit(sys.maxsize)

# ── Mapping from CSV header names to clean frontend field names ───────
# Any CSV column whose header (stripped) matches a key here will be
# written into the JSON record under the corresponding clean name.
HEADER_TO_FIELD = {
    "director_name":                "director_name",
    "company_name":                 "company_name",
    "nationality":                  "nationality",
    "company_number":               "company_number",
    "company_status":               "company_status",
    "company_type":                 "company_type",
    "sic_codes":                    "sic_codes",
    "sic_descriptions":             "sic_descriptions",
    "date_of_creation":             "date_of_creation",
    "accounts_next_due":            "accounts_next_due",
    "accounts_last_made_up_to":     "accounts_last_made_up_to",
    "registered_postcode":          "registered_postcode",
    "company_link":                 "company_link",
    "officer_link":                 "officer_link",
    "director_dob":                 "director_dob",
    "director_address":             "director_address",
    "occupation":                   "occupation",
    "country_of_residence":         "country_of_residence",
    "company_size":                 "company_size",
    "previous_company_names":       "previous_company_names",
    "accounts_type":                "accounts_type",
    "company_charges":              "company_charges",
    "company_category":             "company_category",
    "registered_address":           "registered_address",
    # Financial columns (messy CSV header names → clean names)
    "Period End Date":                                                  "period_end_date",
    "Turnover (Revenue)":                                               "turnover",
    "Net Profit/Loss":                                                  "net_profit_loss",
    "Gross Profit":                                                     "gross_profit",
    "Operating Profit":                                                 "operating_profit",
    "Profit Before Tax":                                                "profit_before_tax",
    "Net Assets (Total Wealth/Value)":                                  "net_assets",
    "Cash at Bank (Liquid Cash)":                                       "cash_at_bank",
    "Total Assets (Overall Company Value)":                             "total_assets",
    "Current Assets (Liquidity)":                                       "current_assets",
    "Working Capital (Current Assets - Current Liabilities)":           "working_capital",
    "Debtors (Money Owed to Company)":                                  "debtors",
    "Creditors Due Within One Year (Short-term Obligations)":           "creditors_due_within_one_year",
    "Share Capital (Equity Base)":                                      "share_capital",
    "Average Number of Employees":                                      "average_number_of_employees",
    "Overall Financial Health Grade (A/B/C/D/F)":                       "financial_health_grade",
    "Overall Financial Health Score (0-100)":                            "financial_health_score",
    "EBITDA (Earnings Before Interest, Tax, Depreciation, Amortization)": "ebitda",
    "Fixed Assets (Property, Plant & Equipment)":                       "fixed_assets",
    # New enrichment metadata
    "website_verified":  "website_verified",
    "confidence_score":  "confidence_score",
}

# Enriched columns (expanded format from enrich.py) – built into ai_input JSON
ENRICHED_COLUMNS = [
    "website",
    "address_is_trading_premises",
    "notes",
    "emails",
    "phones",
    "listing_urls",
    "social_media_facebook",
    "social_media_instagram",
    "social_media_twitter",
    "social_media_linkedin",
    "social_media_tiktok",
]

# Filing-analysis columns (from enrich_filings_data.py) – passed through directly
FILING_COLUMNS = [
    "filing_links",
    "ai_notes",
    "ai_summary",
    "financial_history",
    "data_enrichment_last",
]

# Google Knowledge Panel columns – built into nested google_kp object
# Only included when google_kp_match >= 0.5
GOOGLE_KP_COLUMNS = [
    "google_kp_name",
    "google_kp_category",
    "google_kp_rating",
    "google_kp_reviews",
    "google_kp_address",
    "google_kp_phone",
    "google_kp_website",
    "google_kp_hours",
    "google_kp_description",
    "google_kp_social_instagram",
    "google_kp_social_linkedin",
    "google_kp_social_facebook",
    "google_kp_social_twitter",
    "google_kp_summary",
    "google_kp_match",
    "google_kp_enriched",
]

# Data quality columns – built into nested data_quality object
# Deliberately excludes: dq_phones_removed, dq_emails_removed,
#                        dq_website_non_uk, dq_kp_website_non_uk
DQ_COLUMNS = [
    "dq_kp_name_similarity",
    "dq_kp_name_match",
    "dq_kp_is_accountant",
    "dq_overall_score",
    "dq_score_breakdown",
]


def clean_value(val):
    if val is None:
        return None
    val = val.strip()
    if val == '-' or val == '':
        return None
    return val


def build_ai_input_from_columns(row_dict):
    """Build an ai_input JSON string from expanded enriched columns."""
    emails_str = row_dict.get("emails") or ""
    phones_str = row_dict.get("phones") or ""
    listing_str = row_dict.get("listing_urls") or ""
    atp_str = row_dict.get("address_is_trading_premises") or ""

    ai_data = {
        "emails": [e.strip() for e in emails_str.split(";") if e.strip()] if emails_str else [],
        "phones": [p.strip() for p in phones_str.split(";") if p.strip()] if phones_str else [],
        "website": row_dict.get("website") or None,
        "social_media": {
            "facebook": row_dict.get("social_media_facebook") or None,
            "instagram": row_dict.get("social_media_instagram") or None,
            "twitter": row_dict.get("social_media_twitter") or None,
            "linkedin": row_dict.get("social_media_linkedin") or None,
            "tiktok": row_dict.get("social_media_tiktok") or None,
        },
        "listing_urls": [u.strip() for u in listing_str.split(";") if u.strip()] if listing_str else [],
        "address_is_trading_premises": (
            True if atp_str.lower() == "true"
            else False if atp_str.lower() == "false"
            else None
        ),
        "notes": row_dict.get("notes") or "",
    }

    # Only return if there's actually some data
    has_data = (
        ai_data["emails"] or ai_data["phones"] or ai_data["website"]
        or any(v for v in ai_data["social_media"].values())
        or ai_data["listing_urls"]
        or ai_data["address_is_trading_premises"] is not None
        or ai_data["notes"]
    )
    if has_data:
        return json.dumps(ai_data, ensure_ascii=False)
    return None


# ── Load enrichment progress if available (fallback) ─────────────────
enrichment = {}
if os.path.exists('enrich_progress.json'):
    with open('enrich_progress.json', 'r', encoding='utf-8') as f:
        enrichment = json.load(f)
    print(f"Loaded enrichment progress for {len(enrichment)} records (fallback)")

# ── Read CSV ───────────────────────────────────────────────────────────
records = []
with open('data.csv', 'r', encoding='utf-8') as f:
    reader = csv.reader(f)
    first_row = next(reader)

    # Auto-detect "Table 1" junk row
    if first_row and first_row[0].strip().lower() == 'table 1':
        raw_header = next(reader)
    else:
        raw_header = first_row

    # Clean header
    raw_header = [h.strip().strip('"') for h in raw_header]

    # Detect shifted columns caused by duplicate EBITDA/FixedAssets headers
    # whose names contain commas and were split into multiple CSV columns.
    # The REAL Avg Employees, Grade, Score sit at the split-artifact positions.
    emp_override_idx = None
    grade_override_idx = None
    score_override_idx = None
    for ci, col_name in enumerate(raw_header):
        cn = col_name.strip()
        if cn == "Tax" and ci > 40:
            emp_override_idx = ci
        elif cn == "Depreciation" and ci > 40:
            grade_override_idx = ci
        elif cn.startswith("Amortization") and ci > 40:
            score_override_idx = ci

    if emp_override_idx:
        print(f"  [column-fix] Real Employees at col {emp_override_idx}, Grade at {grade_override_idx}, Score at {score_override_idx}")

    for idx, row in enumerate(reader, 1):
        record = {"id": idx}

        # Build a dict from raw header → value
        row_dict = {}
        for col_idx, col_name in enumerate(raw_header):
            if col_idx < len(row):
                val = row[col_idx].strip()
                row_dict[col_name] = val if val not in ('-', '') else None

        # ── Map known fields via header names ─────────────────────
        for csv_header, field_name in HEADER_TO_FIELD.items():
            if csv_header in row_dict:
                record[field_name] = clean_value(row_dict[csv_header])

        # ── Override shifted Employees / Grade / Score ────────────
        if emp_override_idx is not None and emp_override_idx < len(row):
            val = row[emp_override_idx].strip()
            record["average_number_of_employees"] = val if val not in ('-', '') else None
        if grade_override_idx is not None and grade_override_idx < len(row):
            val = row[grade_override_idx].strip()
            record["financial_health_grade"] = val if val not in ('-', '') else None
        if score_override_idx is not None and score_override_idx < len(row):
            val = row[score_override_idx].strip()
            record["financial_health_score"] = val if val not in ('-', '') else None

        # ── Try to get enrichment from expanded CSV columns ──
        ai_input = None

        has_expanded = any(col in raw_header for col in ENRICHED_COLUMNS)
        if has_expanded:
            enriched_dict = {}
            for col in ENRICHED_COLUMNS:
                if col in raw_header:
                    enriched_dict[col] = row_dict.get(col)
            ai_input = build_ai_input_from_columns(enriched_dict)

        # Check for old-style ai_input JSON column
        if not ai_input and "ai_input" in raw_header:
            ai_raw = row_dict.get("ai_input")
            if ai_raw:
                ai_input = ai_raw

        # Fallback: use enrich_progress.json
        if not ai_input:
            row_key = str(idx)
            if row_key in enrichment:
                ai_input = enrichment[row_key]

        if ai_input:
            record['ai_input'] = ai_input

        # ── Filing analysis columns (pass through directly) ───────
        for col in FILING_COLUMNS:
            raw = row_dict.get(col)
            if raw:
                record[col] = raw

        # ── Google Knowledge Panel (only if match score >= 0.5) ───
        kp_match_str = row_dict.get("google_kp_match")
        if kp_match_str:
            try:
                kp_match_val = float(kp_match_str)
            except (ValueError, TypeError):
                kp_match_val = 0
            if kp_match_val >= 0.5:
                google_kp = {}
                for col in GOOGLE_KP_COLUMNS:
                    val = clean_value(row_dict.get(col))
                    if val:
                        key = col.replace("google_kp_", "")
                        google_kp[key] = val
                if google_kp:
                    record["google_kp"] = google_kp

        # ── Data Quality scores ───────────────────────────────────
        dq = {}
        for col in DQ_COLUMNS:
            val = clean_value(row_dict.get(col))
            if val:
                key = col.replace("dq_", "")
                dq[key] = val
        if dq:
            record["data_quality"] = dq

        records.append(record)

# ── Write JSON ─────────────────────────────────────────────────────────
os.makedirs('public', exist_ok=True)
with open('public/data.json', 'w', encoding='utf-8') as f:
    json.dump(records, f, indent=2, ensure_ascii=False)

enriched_count = sum(1 for r in records if 'ai_input' in r)
filing_count = sum(1 for r in records if 'ai_summary' in r)
kp_count = sum(1 for r in records if 'google_kp' in r)
dq_count = sum(1 for r in records if 'data_quality' in r)
grade_count = sum(1 for r in records if r.get('financial_health_grade'))
score_count = sum(1 for r in records if r.get('financial_health_score'))
emp_count = sum(1 for r in records if r.get('average_number_of_employees'))
turnover_count = sum(1 for r in records if r.get('turnover'))
print(f"Converted {len(records)} records to public/data.json")
print(f"  - {enriched_count} with contact details")
print(f"  - {filing_count} with filing analysis")
print(f"  - {kp_count} with Google Knowledge Panel (match >= 0.5)")
print(f"  - {dq_count} with data quality scores")
print(f"  - {grade_count} with health grade, {score_count} with health score")
print(f"  - {emp_count} with employee count, {turnover_count} with turnover")