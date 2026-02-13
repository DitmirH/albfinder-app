#!/usr/bin/env python3
"""
Local Ollama model comparison: web-scrape ONE record, then test all local models
on the SAME web context so results are directly comparable.
"""
import os, json, time, sys

# Import the real enrichment functions from enrich.py
from enrich import (
    read_csv_records, gather_web_context, _build_prompt,
    _parse_json_response,
)

# ── Pick a record ─────────────────────────────────────────────────────
# Record row 12 = REIBANQ LTD (financial, has known data to benchmark against)
TARGET_ROW = 12
INPUT_CSV = "data.csv"

print("=" * 90)
print("LOCAL OLLAMA MODEL COMPARISON")
print("=" * 90)

records = read_csv_records(INPUT_CSV)
rec = None
for r in records:
    if r["_row"] == TARGET_ROW:
        rec = r
        break

if not rec:
    print(f"Row {TARGET_ROW} not found in {INPUT_CSV}")
    sys.exit(1)

company = rec.get("company_name", "?")
director = rec.get("director_name", "?")
postcode = rec.get("registered_postcode", "?")
print(f"\nTest Record (row {TARGET_ROW}):")
print(f"  Company:  {company}")
print(f"  Director: {director}")
print(f"  Postcode: {postcode}")
print(f"  SIC:      {rec.get('sic_descriptions', '?')[:80]}")

# ── Step 1: Gather web context ONCE ───────────────────────────────────
print(f"\n{'-' * 90}")
print("STEP 1: Gathering web context (search + scrape) ...")
print(f"{'-' * 90}")
t0 = time.time()
web_context = gather_web_context(rec)
scrape_time = time.time() - t0
ctx_len = len(web_context)
print(f"\n  Web context gathered: {ctx_len:,} chars in {scrape_time:.1f}s")

if ctx_len < 50:
    print("  ERROR: Not enough web data. Aborting.")
    sys.exit(1)

# ── Known correct data (from data_expanded-4omini.csv) ───────────────
KNOWN = {
    "website": "reibanq.co.uk",
    "emails": ["support@reibanq.com"],  # Original found this
    "phones": ["+44 2081598280", "+44 2081065325"],  # Original found both
    "linkedin": "reibanq",
}

# ── Models to test ────────────────────────────────────────────────────
MODELS = [
    "qwen3-coder-next:latest",
    "qwen2.5-coder:14b",
    "gpt-oss:120b",
    "mistral:latest",
]

# Model sizes (for reference)
MODEL_SIZES = {
    "qwen3-coder-next:latest": "51 GB",
    "qwen2.5-coder:14b": "9 GB",
    "gpt-oss:120b": "65 GB",
    "mistral:latest": "4.4 GB",
}

# ── Step 2: Run all models on the same context ───────────────────────
print(f"\n{'-' * 90}")
print("STEP 2: Testing local models on the SAME web context ...")
print(f"{'-' * 90}")

import ollama
prompt = _build_prompt(rec, web_context)

results = []
for model in MODELS:
    print(f"\n  >>> {model} ({MODEL_SIZES.get(model, '?')}) ...", end=" ", flush=True)
    try:
        start = time.time()
        response = ollama.chat(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            options={"temperature": 0.1, "num_predict": 2048},
        )
        elapsed = time.time() - start

        raw = response["message"]["content"] or ""
        parsed = _parse_json_response(raw)

        # ── Score accuracy against known data ─────────────────────
        score = 0
        max_score = 7  # we check 7 fields

        # 1. Website
        website = (parsed.get("website") or "").lower()
        has_website = KNOWN["website"] in website
        if has_website:
            score += 1

        # 2. Email (support@reibanq.com)
        emails = parsed.get("emails") or []
        has_support_email = any("support@reibanq.com" in str(e).lower() for e in emails)
        if has_support_email:
            score += 1

        # 3. Phone (both numbers)
        phones = parsed.get("phones") or []
        has_phone1 = any("2081598280" in str(p).replace(" ", "").replace("-", "") for p in phones)
        has_phone2 = any("2081065325" in str(p).replace(" ", "").replace("-", "") for p in phones)
        if has_phone1:
            score += 1
        if has_phone2:
            score += 1

        # 4. LinkedIn
        sm = parsed.get("social_media") or {}
        has_linkedin = KNOWN["linkedin"] in (sm.get("linkedin") or "").lower()
        if has_linkedin:
            score += 1

        # 5. Any other social media found
        other_social = sum(1 for k in ["facebook", "instagram", "twitter", "tiktok"]
                          if sm.get(k))
        if other_social > 0:
            score += 1

        # 6. Listing URLs found
        listings = parsed.get("listing_urls") or []
        if len(listings) > 0:
            score += 1

        # 7. Trading premises check
        if parsed.get("address_is_trading_premises") is not None:
            score += 1

        # Count total data points
        total_data = (
            len(emails) +
            len(phones) +
            (1 if website else 0) +
            sum(1 for v in sm.values() if v) +
            len(listings) +
            (1 if parsed.get("address_is_trading_premises") is not None else 0) +
            (1 if parsed.get("notes") else 0)
        )

        info = {
            "model": model,
            "size": MODEL_SIZES.get(model, "?"),
            "time_s": round(elapsed, 2),
            "accuracy": f"{score}/{max_score}",
            "score": score,
            "total_data_points": total_data,
            "emails": emails,
            "phones": phones,
            "website": parsed.get("website"),
            "social_media": sm,
            "listings": listings,
            "trading_premises": parsed.get("address_is_trading_premises"),
            "notes": parsed.get("notes"),
            "full_result": parsed,
        }
        results.append(info)

        print(f"{elapsed:.1f}s | {score}/{max_score} accuracy | {total_data} data points")

        # Detail
        print(f"      Emails:   {emails}")
        print(f"      Phones:   {phones}")
        print(f"      Website:  {parsed.get('website')}")
        print(f"      Social:   { {k:v for k,v in sm.items() if v} }")
        print(f"      Listings: {len(listings)} URLs")
        print(f"      Trading:  {parsed.get('address_is_trading_premises')}")
        if parsed.get("notes"):
            print(f"      Notes:    {str(parsed.get('notes'))[:120]}")

    except Exception as e:
        print(f"ERROR: {e}")
        results.append({"model": model, "error": str(e)})

# ── Summary Table ─────────────────────────────────────────────────────
print(f"\n\n{'=' * 110}")
print("RESULTS COMPARISON TABLE")
print(f"{'=' * 110}")
print(f"{'Model':<25} {'Size':>8} {'Time':>8} {'Data Pts':>9} {'Accuracy':>10} {'Emails':>7} {'Phones':>7} {'Website':>8} {'Social':>7} {'Listings':>9}")
print(f"{'-' * 110}")

for r in results:
    if "error" in r:
        print(f"{r['model']:<25} {'ERROR':>8}  {r.get('error','')[:60]}")
        continue

    sm_count = sum(1 for v in r.get("social_media", {}).values() if v)

    print(
        f"{r['model']:<25} "
        f"{r.get('size', '?'):>8} "
        f"{r['time_s']:>7.1f}s "
        f"{r['total_data_points']:>9} "
        f"{r['accuracy']:>10} "
        f"{len(r.get('emails',[])):>7} "
        f"{len(r.get('phones',[])):>7} "
        f"{'YES' if r.get('website') else 'NO':>8} "
        f"{sm_count:>7} "
        f"{len(r.get('listings',[])):>9}"
    )

print(f"{'-' * 110}")

# Find winners
valid = [r for r in results if "error" not in r]
if valid:
    best_data = max(valid, key=lambda r: r["total_data_points"])
    best_accuracy = max(valid, key=lambda r: r["score"])
    fastest = min(valid, key=lambda r: r["time_s"])

    print(f"\n  MOST DATA:     {best_data['model']} ({best_data['total_data_points']} data points)")
    print(f"  BEST ACCURACY: {best_accuracy['model']} ({best_accuracy['accuracy']})")
    print(f"  FASTEST:       {fastest['model']} ({fastest['time_s']:.1f}s)")

# ── Compare with original gpt-4o-mini results ────────────────────────
print(f"\n{'-' * 110}")
print("COMPARISON WITH ORIGINAL GPT-4O-MINI (from data_expanded-4omini.csv):")
print(f"{'-' * 110}")
print(f"  Original found:")
print(f"    - Website: https://reibanq.co.uk/")
print(f"    - Emails: support@reibanq.com")
print(f"    - Phones: +44 2081598280; +44 2081065325 (2 phones)")
print(f"    - LinkedIn: https://uk.linkedin.com/company/reibanq-business")
print(f"    - Trading premises: True")
print(f"\n  Best local model should match or exceed this!")

# ── Save full results ─────────────────────────────────────────────────
output = {
    "test_record": {
        "row": TARGET_ROW,
        "company": company,
        "director": director,
    },
    "web_context_chars": ctx_len,
    "scrape_time_s": round(scrape_time, 1),
    "known_correct": KNOWN,
    "original_gpt4o_mini": {
        "website": "https://reibanq.co.uk/",
        "emails": ["support@reibanq.com"],
        "phones": ["+44 2081598280", "+44 2081065325"],
        "linkedin": "https://uk.linkedin.com/company/reibanq-business",
        "trading_premises": True,
    },
    "results": results,
}
with open("local_model_comparison.json", "w", encoding="utf-8") as f:
    json.dump(output, f, indent=2, ensure_ascii=False, default=str)

print(f"\n[+] Full results saved to local_model_comparison.json")
