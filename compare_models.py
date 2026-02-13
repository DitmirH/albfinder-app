#!/usr/bin/env python3
"""
Full pipeline model comparison: web-scrape ONE record, then test all 6 models
on the SAME web context so results are directly comparable.
"""
from dotenv import load_dotenv
load_dotenv()

import os, json, time, re, sys

# Import the real enrichment functions from enrich.py
from enrich import (
    read_csv_records, gather_web_context, _build_prompt,
    _parse_json_response, _is_reasoning_model, _get_openai_client,
    ENRICHED_COLUMNS,
)

# ── Pick a record ─────────────────────────────────────────────────────
# Record row 13 = REIBANQ LTD (financial, has known data to benchmark against)
TARGET_ROW = 12
INPUT_CSV = "data.csv"

print("=" * 90)
print("FULL PIPELINE MODEL COMPARISON")
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

# ── Known correct data (from data_expanded.csv) ──────────────────────
KNOWN = {
    "website": "reibanq.co.uk",
    "email": "support@reibanq.com",
    "phone_fragment": "208",  # +44 208…
    "linkedin": "reibanq",
}

# ── Models to test ────────────────────────────────────────────────────
MODELS = [
    "gpt-4o-mini",
    "gpt-4.1-mini",
    "gpt-4.1-nano",
    "gpt-5.1",
    "gpt-5.2",
    "gpt-5-mini",
]

# Pricing per 1M tokens (input / output)
PRICING = {
    "gpt-4o-mini":  {"input": 0.15,  "output": 0.60},
    "gpt-4.1-mini": {"input": 0.40,  "output": 1.60},
    "gpt-4.1-nano": {"input": 0.10,  "output": 0.40},
    "gpt-5.1":      {"input": 2.00,  "output": 8.00},
    "gpt-5.2":      {"input": 2.00,  "output": 8.00},
    "gpt-5-mini":   {"input": 0.25,  "output": 2.00},
}

# ── Step 2: Run all models on the same context ───────────────────────
print(f"\n{'-' * 90}")
print("STEP 2: Testing 6 models on the SAME web context ...")
print(f"{'-' * 90}")

client = _get_openai_client()
prompt = _build_prompt(rec, web_context)

results = []
for model in MODELS:
    print(f"\n  >>> {model} ...", end=" ", flush=True)
    try:
        kwargs = {
            "model": model,
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "You are a data extraction assistant for UK companies. "
                        "You ONLY return valid JSON, nothing else. "
                        "No markdown fences, no explanation. "
                        "ONLY include UK contact details."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
        }

        if _is_reasoning_model(model):
            kwargs["max_completion_tokens"] = 2048
        else:
            kwargs["temperature"] = 0.1
            kwargs["max_tokens"] = 2048

        start = time.time()
        resp = client.chat.completions.create(**kwargs)
        elapsed = time.time() - start

        raw = resp.choices[0].message.content or ""
        usage = resp.usage
        parsed = _parse_json_response(raw)

        # Cost calculation
        pricing = PRICING[model]
        cost = (usage.prompt_tokens * pricing["input"] / 1_000_000) + \
               (usage.completion_tokens * pricing["output"] / 1_000_000)

        # ── Score accuracy against known data ─────────────────────
        score = 0
        max_score = 7  # we check 7 fields

        # 1. Website
        website = (parsed.get("website") or "").lower()
        has_website = KNOWN["website"] in website
        if has_website:
            score += 1

        # 2. Email
        emails = parsed.get("emails") or []
        has_email = any(KNOWN["email"] in str(e).lower() for e in emails)
        if has_email:
            score += 1

        # 3. Phone
        phones = parsed.get("phones") or []
        has_phone = any(KNOWN["phone_fragment"] in str(p) for p in phones)
        if has_phone:
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
            "time_s": round(elapsed, 2),
            "input_tok": usage.prompt_tokens,
            "output_tok": usage.completion_tokens,
            "total_tok": usage.total_tokens,
            "cost_usd": round(cost, 6),
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

        print(f"{elapsed:.1f}s | {score}/{max_score} accuracy | {total_data} data points | ${cost:.5f}")

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
print(f"{'Model':<16} {'Time':>6} {'Data Pts':>9} {'Accuracy':>10} {'Emails':>7} {'Phones':>7} {'Website':>8} {'Social':>7} {'Listings':>9} {'Cost/Rec':>10} {'Cost/117':>10}")
print(f"{'-' * 110}")

for r in results:
    if "error" in r:
        print(f"{r['model']:<16} {'ERROR':>6}  {r.get('error','')[:70]}")
        continue

    sm_count = sum(1 for v in r.get("social_media", {}).values() if v)
    pricing = PRICING[r["model"]]
    est_per = (r["input_tok"] * pricing["input"] / 1_000_000) + \
              (r["output_tok"] * pricing["output"] / 1_000_000)
    est_117 = est_per * 117

    print(
        f"{r['model']:<16} "
        f"{r['time_s']:>5.1f}s "
        f"{r['total_data_points']:>9} "
        f"{r['accuracy']:>10} "
        f"{len(r.get('emails',[])):>7} "
        f"{len(r.get('phones',[])):>7} "
        f"{'YES' if r.get('website') else 'NO':>8} "
        f"{sm_count:>7} "
        f"{len(r.get('listings',[])):>9} "
        f"${est_per:>8.5f} "
        f"${est_117:>8.2f}"
    )

print(f"{'-' * 110}")

# Find winner
valid = [r for r in results if "error" not in r]
if valid:
    best_data = max(valid, key=lambda r: r["total_data_points"])
    best_accuracy = max(valid, key=lambda r: r["score"])
    cheapest = min(valid, key=lambda r: r["cost_usd"])
    fastest = min(valid, key=lambda r: r["time_s"])

    print(f"\n  MOST DATA:     {best_data['model']} ({best_data['total_data_points']} data points)")
    print(f"  BEST ACCURACY: {best_accuracy['model']} ({best_accuracy['accuracy']})")
    print(f"  CHEAPEST:      {cheapest['model']} (${cheapest['cost_usd']:.5f}/record)")
    print(f"  FASTEST:       {fastest['model']} ({fastest['time_s']:.1f}s)")

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
    "results": results,
}
with open("model_comparison.json", "w", encoding="utf-8") as f:
    json.dump(output, f, indent=2, ensure_ascii=False, default=str)

print(f"\n[+] Full results saved to model_comparison.json")
