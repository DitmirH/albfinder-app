#!/usr/bin/env python3
"""
AI-powered contact detail enrichment for company records.
Uses DuckDuckGo search + web scraping + Ollama (local) or OpenAI (ChatGPT).

Usage:
    python enrich.py                              # Ollama (default, free)
    python enrich.py --model qwen2.5-coder:14b    # Ollama with specific model
    python enrich.py --openai                      # ChatGPT (uses .env key)
    python enrich.py --openai --openai-model gpt-4o-mini   # Specific GPT model
    python enrich.py --start 5                     # Start from row 5
    python enrich.py --only 10                     # Process only row 10
    python enrich.py --max 20                      # Process at most 20 records
"""

import csv
import json
import os
import re
import sys
import time
import argparse
import logging
from pathlib import Path
from typing import Optional

import requests
from bs4 import BeautifulSoup
from ddgs import DDGS

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
INPUT_CSV = "data.csv"
OUTPUT_CSV = "data.csv"  # writes back to same file (progress file keeps a backup)
PROGRESS_FILE = "enrich_progress.json"
DEFAULT_OLLAMA_MODEL = "mistral"
DEFAULT_OPENAI_MODEL = "gpt-4.1-mini"  # best balance of quality / cost
SEARCH_RESULTS_PER_QUERY = 5
MAX_PAGE_TEXT_CHARS = 6000  # max chars to send to the LLM per scraped page
REQUEST_TIMEOUT = 15  # seconds
DELAY_BETWEEN_RECORDS = 3  # be nice to search engines
DELAY_BETWEEN_SEARCHES = 2  # base delay between DDG queries
MAX_SEARCH_RETRIES = 3  # retries on 429 / rate-limit errors

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("enrich")

# ---------------------------------------------------------------------------
# Enriched columns  (written as separate CSV columns, NOT a JSON blob)
# ---------------------------------------------------------------------------
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



# ---------------------------------------------------------------------------
# Flatten / expand enrichment JSON ↔ CSV columns
# ---------------------------------------------------------------------------
def flatten_enrichment(result: dict) -> dict:
    """Convert an LLM JSON result dict into flat column values for CSV."""
    flat = {}
    flat["website"] = result.get("website") or ""
    atp = result.get("address_is_trading_premises")
    flat["address_is_trading_premises"] = str(atp) if atp is not None else ""
    flat["notes"] = result.get("notes") or ""

    # Multi-value fields → semicolon-separated
    emails = result.get("emails") or []
    flat["emails"] = "; ".join(str(e) for e in emails if e) if emails else ""

    phones = result.get("phones") or []
    # Apply UK validation
    uk_phones = validate_phones(phones)
    flat["phones"] = "; ".join(str(p) for p in uk_phones if p) if uk_phones else ""

    listing_urls = result.get("listing_urls") or []
    flat["listing_urls"] = "; ".join(str(u) for u in listing_urls if u) if listing_urls else ""

    # Social media → one column per platform
    sm = result.get("social_media") or {}
    flat["social_media_facebook"] = sm.get("facebook") or ""
    flat["social_media_instagram"] = sm.get("instagram") or ""
    flat["social_media_twitter"] = sm.get("twitter") or ""
    flat["social_media_linkedin"] = sm.get("linkedin") or ""
    flat["social_media_tiktok"] = sm.get("tiktok") or ""

    return flat


def unflatten_enrichment(rec: dict) -> dict:
    """Rebuild a JSON result dict from flat CSV columns (for re-processing)."""
    emails_str = rec.get("emails") or ""
    phones_str = rec.get("phones") or ""
    listing_str = rec.get("listing_urls") or ""
    atp_str = rec.get("address_is_trading_premises") or ""

    return {
        "emails": [e.strip() for e in emails_str.split(";") if e.strip()] if emails_str else [],
        "phones": [p.strip() for p in phones_str.split(";") if p.strip()] if phones_str else [],
        "website": rec.get("website") or None,
        "social_media": {
            "facebook": rec.get("social_media_facebook") or None,
            "instagram": rec.get("social_media_instagram") or None,
            "twitter": rec.get("social_media_twitter") or None,
            "linkedin": rec.get("social_media_linkedin") or None,
            "tiktok": rec.get("social_media_tiktok") or None,
        },
        "listing_urls": [u.strip() for u in listing_str.split(";") if u.strip()] if listing_str else [],
        "address_is_trading_premises": (
            True if atp_str.lower() == "true"
            else False if atp_str.lower() == "false"
            else None
        ),
        "notes": rec.get("notes") or "",
    }


# ---------------------------------------------------------------------------
# CSV helpers (handles the quirky header in data.csv)
# ---------------------------------------------------------------------------


def read_csv_records(path: str) -> list[dict]:
    """Read data.csv, auto-detect header, return list of dicts.

    Reads the header dynamically so it works regardless of column layout.
    Handles optional 'Table 1' junk row at the top if present.
    """
    records = []
    with open(path, "r", encoding="utf-8") as f:
        reader = csv.reader(f)
        first_row = next(reader)
        # Skip the "Table 1" junk row if present
        if first_row and first_row[0].strip().lower() == "table 1":
            header = next(reader)
        else:
            header = first_row
        # Clean header names
        header = [h.strip() for h in header]
        for row_idx, row in enumerate(reader, start=1):
            rec = {"_row": row_idx}
            for col_idx, col_name in enumerate(header):
                val = row[col_idx].strip() if col_idx < len(row) else ""
                if val == "-" or val == "":
                    val = None
                rec[col_name] = val
            records.append(rec)
    return records


def _read_csv_header(path: str):
    """Read the CSV header and detect whether a 'Table 1' junk row is present."""
    with open(path, "r", encoding="utf-8") as f:
        reader = csv.reader(f)
        first_row = next(reader)
        if first_row and first_row[0].strip().lower() == "table 1":
            return [h.strip() for h in next(reader)], True
        return [h.strip() for h in first_row], False


def write_enriched_csv(records: list[dict], path: str):
    """Write back the full CSV preserving all original columns + expanded enriched columns.

    Instead of a single 'ai_input' JSON blob we now write individual columns:
        website, address_is_trading_premises, notes, emails, phones,
        listing_urls, social_media_facebook, … social_media_tiktok
    """
    if not records:
        return

    # Read the existing header and detect format
    has_table1 = False
    try:
        header, has_table1 = _read_csv_header(path)
    except (FileNotFoundError, StopIteration):
        header = [k for k in records[0].keys() if not k.startswith("_")]

    # Remove old 'ai_input' column if present (we expand it now)
    header = [h for h in header if h != "ai_input"]

    # Remove any "Unnamed:" phantom columns from the old format
    header = [h for h in header if not h.startswith("Unnamed")]

    # Ensure all enriched columns exist at the end
    for col in ENRICHED_COLUMNS:
        if col not in header:
            header.append(col)

    with open(path, "w", encoding="utf-8", newline="") as f:
        writer = csv.writer(f)
        if has_table1:
            writer.writerow(["Table 1"])
        writer.writerow(header)
        for rec in records:
            row = []
            for col_name in header:
                val = rec.get(col_name)
                row.append(val if val is not None else "")
            writer.writerow(row)
    log.info(f"Wrote {len(records)} records to {path}")


# ---------------------------------------------------------------------------
# Progress tracking  (so you can stop and resume)
# ---------------------------------------------------------------------------
def load_progress() -> dict:
    p = Path(PROGRESS_FILE)
    if p.exists():
        return json.loads(p.read_text(encoding="utf-8"))
    return {}


def save_progress(progress: dict):
    Path(PROGRESS_FILE).write_text(json.dumps(progress, indent=2), encoding="utf-8")


# ---------------------------------------------------------------------------
# Industry-aware search query builder
# ---------------------------------------------------------------------------
SIC_CATEGORY_MAP = {
    "restaurant": ["56101", "56102", "56103", "56210", "56290"],
    "hairdressing_beauty": ["96020"],
    "construction": [
        "41100", "41201", "41202", "42990", "43210", "43220", "43290",
        "43310", "43330", "43341", "43390", "43910", "43991", "43999",
        "16230",
    ],
    "plumbing_heating": ["43220"],
    "electrical": ["43210"],
    "real_estate": ["68100", "68201", "68209", "68320"],
    "cleaning": ["81210", "81299"],
    "car_wash_vehicle": ["45200", "45112", "96090"],
    "it_tech": ["62012", "62020", "62090", "63110", "63120", "63990"],
    "transport": ["49410"],
    "retail": ["47710", "47910"],
    "health_care": [
        "86101", "86102", "86210", "86220", "86230", "86900",
        "87100", "87200", "87300", "87900", "88100", "88910", "88990",
    ],
    "financial": [
        "64110", "64191", "64192", "64201", "64202", "64203",
        "64204", "64205", "64209", "64301", "64302", "64303",
        "64304", "64305", "64306", "64910", "64921", "64922",
        "64929", "64991", "64992", "64999", "65110", "65120",
        "65201", "65202", "66110", "66120", "66190", "66210",
        "66220", "66290", "66300",
    ],
}


def classify_industry(sic_codes_str: Optional[str]) -> list[str]:
    """Return list of industry tags based on SIC codes."""
    if not sic_codes_str:
        return ["general"]
    codes = [c.strip() for c in sic_codes_str.split(",")]
    tags = set()
    for code in codes:
        for tag, tag_codes in SIC_CATEGORY_MAP.items():
            if code in tag_codes:
                tags.add(tag)
    return list(tags) if tags else ["general"]


def simplify_company_name(name: str) -> str:
    """Strip common suffixes like LTD, LIMITED etc. for broader searches."""
    name = name.strip()
    for suffix in [" LIMITED", " LTD.", " LTD", " PLC", " LLP"]:
        if name.upper().endswith(suffix):
            name = name[: -len(suffix)].strip()
    return name


def build_search_queries(rec: dict) -> list[str]:
    """Build a LEAN list of DuckDuckGo queries for this record (~15-20 max).

    Strategy: use broad queries that let DDG search across ALL sites at once.
    Individual site: queries are wasteful because DDG already indexes those
    sites — a single broad query covers the same ground as 20 site: queries.

    We only use site: for a handful of truly high-value sources where the
    company is very likely to be listed (e.g. LinkedIn, Companies House).
    """
    company = rec.get("company_name") or ""
    short_name = simplify_company_name(company)
    director = rec.get("director_name") or ""
    postcode = rec.get("registered_postcode") or ""
    address = rec.get("registered_address") or ""
    tags = classify_industry(rec.get("sic_codes"))
    company_num = rec.get("company_number") or ""

    queries = []

    # =================================================================
    # 1) CORE COMPANY SEARCHES (4-5 queries — most valuable)
    # =================================================================
    # These broad queries will surface results from Yell, Trustpilot,
    # FreeIndex, Google Maps, social media, etc. all at once.
    queries.append(f'"{company}" contact email phone website')
    queries.append(f'{short_name} contact phone email website')
    if postcode:
        queries.append(f'"{short_name}" {postcode}')
        queries.append(f'{short_name} {postcode} reviews')

    # =================================================================
    # 2) SOCIAL MEDIA (2 queries — batched, not one per platform)
    # =================================================================
    # One query catches LinkedIn, Facebook, Instagram, Twitter all at once
    queries.append(f'"{short_name}" linkedin OR facebook OR instagram OR twitter')
    if director:
        queries.append(f'"{director}" linkedin OR facebook OR instagram')

    # =================================================================
    # 3) DIRECTOR SEARCHES (2-3 queries — catches trading names)
    # =================================================================
    if director:
        queries.append(f'"{director}" "{short_name}"')
        if postcode:
            queries.append(f'"{director}" {postcode}')
        # Director + industry keywords (catches "John Smith Plumbing" patterns)
        industry_kw = _industry_keywords(tags)
        if industry_kw and postcode:
            queries.append(f'"{director}" {industry_kw} {postcode}')

    # =================================================================
    # 4) COMPANY NUMBER (1 query — unique identifier)
    # =================================================================
    if company_num:
        queries.append(f'"{company_num}" "{short_name}" contact')

    # =================================================================
    # 5) ADDRESS-BASED (1 query — what's trading at this location?)
    # =================================================================
    if address and postcode:
        street = _extract_street(address)
        if street:
            industry_kw = _industry_keywords(tags)
            kw = industry_kw if industry_kw else "business"
            queries.append(f'{street} {postcode} {kw}')

    # =================================================================
    # 6) PREVIOUS COMPANY NAMES (0-1 query)
    # =================================================================
    prev_names = rec.get("previous_company_names")
    if prev_names and prev_names not in ["-", "", None]:
        prev_short = simplify_company_name(prev_names)
        if prev_short and prev_short != short_name:
            queries.append(f'"{prev_short}" {postcode} contact')

    # =================================================================
    # 7) INDUSTRY-SPECIFIC (2-4 queries — only the most valuable)
    # =================================================================
    # Instead of site: queries for each directory, we use broad industry
    # searches that surface listings from Checkatrade, Bark, TripAdvisor etc.

    if "restaurant" in tags:
        queries.append(f'"{short_name}" restaurant {postcode} tripadvisor OR deliveroo OR just-eat')
        queries.append(f'"{short_name}" menu book table {postcode}')

    if "hairdressing_beauty" in tags:
        queries.append(f'"{short_name}" hair salon beauty {postcode} treatwell OR fresha OR booksy')
        queries.append(f'"{short_name}" book appointment {postcode}')

    if "plumbing_heating" in tags:
        queries.append(f'"{short_name}" plumber heating {postcode} checkatrade OR trustatrader OR bark')
        queries.append(f'"{short_name}" gas safe registered {postcode}')

    if "electrical" in tags:
        queries.append(f'"{short_name}" electrician {postcode} niceic OR checkatrade OR napit')
        queries.append(f'"{short_name}" electrical approved {postcode}')

    if "construction" in tags:
        queries.append(f'"{short_name}" builder construction {postcode} checkatrade OR mybuilder OR bark')
        queries.append(f'"{short_name}" construction reviews {postcode}')

    if "real_estate" in tags:
        queries.append(f'"{short_name}" estate agent {postcode} rightmove OR zoopla')
        queries.append(f'"{short_name}" property lettings {postcode}')

    if "cleaning" in tags:
        queries.append(f'"{short_name}" cleaning services {postcode} checkatrade OR bark')

    if "car_wash_vehicle" in tags:
        queries.append(f'"{short_name}" car wash valeting {postcode}')

    if "it_tech" in tags:
        queries.append(f'"{short_name}" software IT technology clutch OR crunchbase OR github')
        queries.append(f'"{short_name}" developer agency portfolio')

    if "transport" in tags:
        queries.append(f'"{short_name}" haulage transport logistics {postcode}')

    if "retail" in tags:
        queries.append(f'"{short_name}" shop store {postcode}')

    if "health_care" in tags:
        queries.append(f'"{short_name}" clinic {postcode} cqc OR nhs OR doctify')

    if "financial" in tags:
        queries.append(f'"{short_name}" financial adviser {postcode} fca')

    return queries


def _industry_keywords(tags: list[str]) -> str:
    """Return a short keyword string for the top industry tag."""
    kw_map = {
        "restaurant": "restaurant cafe food",
        "hairdressing_beauty": "hair salon beauty",
        "plumbing_heating": "plumber heating gas",
        "electrical": "electrician electrical",
        "construction": "builder construction",
        "real_estate": "estate agent property",
        "cleaning": "cleaning",
        "car_wash_vehicle": "car wash valeting",
        "it_tech": "software IT developer",
        "transport": "transport haulage",
        "retail": "shop store",
        "health_care": "clinic medical health",
        "financial": "financial adviser",
    }
    for tag in tags:
        if tag in kw_map:
            return kw_map[tag]
    return ""


def _extract_street(address: str) -> str:
    """Extract a usable street name from a registered address."""
    parts = address.split(",")
    if not parts:
        return ""
    street = parts[0].strip()
    # Remove common prefixes like "Flat 1", "Unit 2", "Office 3"
    for prefix in ["Flat", "Unit", "Office", "Suite", "Room"]:
        if street.upper().startswith(prefix.upper()):
            sub_parts = street.split(None, 2)
            if len(sub_parts) > 2:
                street = sub_parts[2]
            break
    return street if len(street) > 5 else ""


# ---------------------------------------------------------------------------
# Web scraping helpers
# ---------------------------------------------------------------------------
SCRAPE_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    )
}


def search_ddg(query: str, max_results: int = SEARCH_RESULTS_PER_QUERY) -> list[dict]:
    """Run a DuckDuckGo text search with retry + exponential backoff on 429."""
    for attempt in range(1, MAX_SEARCH_RETRIES + 1):
        try:
            ddgs = DDGS()
            results = list(ddgs.text(query, max_results=max_results))
            return results
        except Exception as e:
            err_str = str(e).lower()
            is_rate_limit = any(k in err_str for k in ["429", "rate", "too many", "sorry"])
            if is_rate_limit and attempt < MAX_SEARCH_RETRIES:
                wait = DELAY_BETWEEN_SEARCHES * (2 ** attempt)  # 4s, 8s, 16s …
                log.warning(
                    f"Rate-limited on attempt {attempt} for '{query[:50]}…' "
                    f"— waiting {wait}s before retry"
                )
                time.sleep(wait)
            else:
                log.warning(f"DDG search failed for '{query[:50]}…': {e}")
                return []
    return []


def scrape_page(url: str) -> Optional[str]:
    """Fetch a URL and return its visible text (trimmed)."""
    try:
        resp = requests.get(url, headers=SCRAPE_HEADERS, timeout=REQUEST_TIMEOUT)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")
        # Remove scripts/styles
        for tag in soup(["script", "style", "noscript", "nav", "footer", "header"]):
            tag.decompose()
        text = soup.get_text(separator=" ", strip=True)
        # Collapse whitespace
        text = re.sub(r"\s+", " ", text)
        return text[:MAX_PAGE_TEXT_CHARS]
    except Exception as e:
        log.debug(f"Scrape failed for {url}: {e}")
        return None


def gather_web_context(rec: dict) -> str:
    """Search the web and scrape pages. Return combined text context.

    Uses progressive delays: after every batch of queries the delay
    increases slightly so we stay under rate-limits while still being
    fast for the early (most important) queries.
    """
    queries = build_search_queries(rec)
    seen_urls = set()
    snippet_texts = []  # (source, text)
    urls_for_scraping = []

    total_q = len(queries)
    consecutive_fails = 0  # track consecutive failures for adaptive backoff
    log.info(f"  Running {total_q} search queries...")

    for idx, q in enumerate(queries, 1):
        log.debug(f"  [{idx}/{total_q}] Search: {q}")
        results = search_ddg(q)

        if not results:
            consecutive_fails += 1
        else:
            consecutive_fails = 0

        for r in results:
            url = r.get("href") or r.get("link") or ""
            title = r.get("title") or ""
            snippet = r.get("body") or ""

            # Always keep the DDG snippet (even for duplicate URLs)
            if snippet:
                snippet_texts.append((url or "search-snippet", f"[{title}] {snippet}"))

            if url and url not in seen_urls:
                seen_urls.add(url)
                # Skip PDFs, images, and certain domains
                skip_exts = (".pdf", ".jpg", ".png", ".gif", ".xlsx", ".doc")
                skip_domains = ("companies-house", "company-information.service.gov.uk")
                if not any(url.lower().endswith(e) for e in skip_exts) and \
                   not any(d in url.lower() for d in skip_domains):
                    urls_for_scraping.append(url)

        # --- Adaptive delay logic ---
        # Base delay + progressive slow-down to avoid 429s
        if consecutive_fails >= 3:
            # Getting rate-limited — slow down significantly
            wait = DELAY_BETWEEN_SEARCHES * 4  # e.g. 8 seconds
            log.info(f"  [{idx}/{total_q}] {consecutive_fails} consecutive fails, slowing to {wait}s")
            time.sleep(wait)
        elif idx % 10 == 0:
            # Every 10th query, take a slightly longer break
            time.sleep(DELAY_BETWEEN_SEARCHES * 2)
        else:
            time.sleep(DELAY_BETWEEN_SEARCHES)

        # If too many consecutive fails, skip remaining optional queries
        if consecutive_fails >= 8:
            log.warning(f"  [{idx}/{total_q}] Too many consecutive failures — "
                        f"skipping remaining queries, using {len(snippet_texts)} snippets collected so far")
            break

    log.info(f"  Search complete: {len(snippet_texts)} snippets, {len(urls_for_scraping)} unique URLs")

    # Scrape the top unique URLs (limit to 10 for comprehensive coverage)
    scrape_count = min(len(urls_for_scraping), 10)
    log.info(f"  Scraping up to {scrape_count} pages...")
    for url in urls_for_scraping[:10]:
        text = scrape_page(url)
        if text and len(text) > 100:
            snippet_texts.append((url, text))

    # Build a combined context string
    parts = []
    for source, text in snippet_texts:
        parts.append(f"--- Source: {source} ---\n{text}\n")
    combined = "\n".join(parts)

    # Cap total context to avoid overloading the LLM
    max_total = 40000
    if len(combined) > max_total:
        combined = combined[:max_total] + "\n... [truncated]"

    return combined


# ---------------------------------------------------------------------------
# Shared LLM prompt
# ---------------------------------------------------------------------------
EXTRACTION_PROMPT = """\
You are a data-enrichment assistant. Your job is to extract **contact details** \
and **useful business information** from the web search results provided below.

### CRITICAL: This is a UK-registered company
All contact details MUST belong to the actual UK company listed below. \
Do NOT return contact details from similarly-named companies in other countries \
(USA, Australia, Germany, etc.).

### Company Record
- Director: {director_name}
- Company: {company_name}
- Nationality: {nationality}
- Registered Address: {registered_address}
- Postcode: {postcode}
- Industry (SIC): {sic_descriptions}
- Company Number: {company_number}
- Companies House: {company_link}

### Web Search Results
{web_context}

### Your Task
From the web results above, extract ANY of the following you can find:
1. **Email addresses** (business or director)
2. **Phone numbers** — ONLY UK numbers (starting with +44, 01, 02, 03, 07, 08)
3. **Website URL** (official company website, NOT Companies House — must be a .co.uk or UK-hosted site, or clearly the same company)
4. **Social media** (Facebook, Instagram, Twitter/X, LinkedIn, TikTok — of the director or the actual UK company)
5. **Google Maps / TripAdvisor / Yell listing URL** (UK listings only)
6. **Physical location confirmed** (is the registered address actually a trading premises?)
7. **Any other useful contact info** (WhatsApp, booking links, etc.)

### Rules
- Only include information you actually found in the search results above.
- Do NOT hallucinate or make up any contact details.
- REJECT any phone numbers that are NOT UK (no US +1, no Australian +61, no German +49, etc.).
- REJECT any websites/emails from a different company in another country.
- If in doubt whether data belongs to this specific UK company, LEAVE IT OUT.
- If you found nothing useful, return an empty JSON.
- Return ONLY valid JSON, no markdown, no explanation, no extra text.

### Output Format (JSON only)
{{
  "emails": [],
  "phones": [],
  "website": null,
  "social_media": {{
    "facebook": null,
    "instagram": null,
    "twitter": null,
    "linkedin": null,
    "tiktok": null
  }},
  "listing_urls": [],
  "address_is_trading_premises": null,
  "notes": ""
}}
"""


def _build_prompt(rec: dict, web_context: str) -> str:
    """Build the extraction prompt with record data filled in."""
    return EXTRACTION_PROMPT.format(
        director_name=rec.get("director_name") or "Unknown",
        company_name=rec.get("company_name") or "Unknown",
        nationality=rec.get("nationality") or "Unknown",
        registered_address=rec.get("registered_address") or "Unknown",
        postcode=rec.get("registered_postcode") or "Unknown",
        sic_descriptions=rec.get("sic_descriptions") or "Unknown",
        company_number=rec.get("company_number") or "Unknown",
        company_link=rec.get("company_link") or "N/A",
        web_context=web_context if web_context else "(No web results found)",
    )


def _parse_json_response(raw: str) -> dict:
    """Extract and parse JSON from an LLM response string."""
    # Try to find a JSON object in the response
    json_match = re.search(r"\{[\s\S]*\}", raw)
    if json_match:
        return json.loads(json_match.group())
    return {"raw_response": raw, "parse_error": True}


# ---------------------------------------------------------------------------
# Provider: Ollama (local, free)
# ---------------------------------------------------------------------------
def extract_with_ollama(rec: dict, web_context: str, model: str) -> dict:
    """Send the context to Ollama and parse the JSON response."""
    import ollama

    prompt = _build_prompt(rec, web_context)
    try:
        response = ollama.chat(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            options={"temperature": 0.1, "num_predict": 2048},
        )
        raw = response["message"]["content"]
        return _parse_json_response(raw)
    except json.JSONDecodeError as e:
        log.warning(f"JSON parse error: {e}")
        return {"raw_response": raw, "parse_error": True}
    except Exception as e:
        log.error(f"Ollama error: {e}")
        return {"error": str(e)}


# ---------------------------------------------------------------------------
# Provider: OpenAI / ChatGPT (paid, better quality)
# ---------------------------------------------------------------------------
_openai_client = None


def _get_openai_client():
    """Lazy-init the OpenAI client, reading key from .env."""
    global _openai_client
    if _openai_client is None:
        from dotenv import load_dotenv
        from openai import OpenAI

        load_dotenv()  # reads .env in current directory

        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            log.error(
                "OPENAI_API_KEY not found!\n"
                "Create a .env file in the project root with:\n"
                "  OPENAI_API_KEY=sk-your-key-here"
            )
            sys.exit(1)

        _openai_client = OpenAI(api_key=api_key)
        log.info("OpenAI client initialised")
    return _openai_client


def _is_reasoning_model(model: str) -> bool:
    """Check if the model needs max_completion_tokens instead of max_tokens.

    GPT-5.x models and o-series reasoning models use the newer API format.
    """
    new_api_prefixes = [
        "o1", "o3", "o4",                        # reasoning models
        "gpt-5", "gpt-5.1", "gpt-5.2",          # GPT-5 family
    ]
    return any(model.startswith(p) for p in new_api_prefixes)


def extract_with_openai(rec: dict, web_context: str, model: str) -> dict:
    """Send the context to OpenAI ChatGPT and parse the JSON response."""
    client = _get_openai_client()
    prompt = _build_prompt(rec, web_context)

    try:
        # Build kwargs — reasoning models don't support temperature / max_tokens
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
            # Reasoning models use max_completion_tokens, no temperature
            kwargs["max_completion_tokens"] = 2048
        else:
            kwargs["temperature"] = 0.1
            kwargs["max_tokens"] = 2048

        response = client.chat.completions.create(**kwargs)
        raw = response.choices[0].message.content or ""
        result = _parse_json_response(raw)

        # Log token usage for cost tracking
        usage = response.usage
        if usage:
            log.info(
                f"  OpenAI tokens — "
                f"input: {usage.prompt_tokens:,}, "
                f"output: {usage.completion_tokens:,}, "
                f"total: {usage.total_tokens:,}"
            )
        return result
    except json.JSONDecodeError as e:
        log.warning(f"JSON parse error: {e}")
        return {"raw_response": raw, "parse_error": True}
    except Exception as e:
        log.error(f"OpenAI error: {e}")
        return {"error": str(e)}


# ---------------------------------------------------------------------------
# Main pipeline
# ---------------------------------------------------------------------------
def process_record(rec: dict, provider: str, model: str) -> dict:
    """Full pipeline for one record: search → scrape → LLM → validate → result."""
    company = rec.get("company_name") or "?"
    row = rec["_row"]
    log.info(f"[Row {row}] Processing: {company}")

    # Step 1: Gather web context
    log.info(f"[Row {row}]   Searching the web...")
    web_context = gather_web_context(rec)
    context_len = len(web_context)
    log.info(f"[Row {row}]   Gathered {context_len:,} chars of web context")

    if context_len < 50:
        log.info(f"[Row {row}]   Very little web data found, skipping LLM")
        return {"emails": [], "phones": [], "notes": "No web data found"}

    # Step 2: Feed to LLM
    if provider == "openai":
        log.info(f"[Row {row}]   Sending to OpenAI ({model})...")
        result = extract_with_openai(rec, web_context, model)
    else:
        log.info(f"[Row {row}]   Sending to Ollama ({model})...")
        result = extract_with_ollama(rec, web_context, model)

    log.info(f"[Row {row}]   Done. Found: {json.dumps(result, default=str)[:200]}")
    return result


def main():
    parser = argparse.ArgumentParser(description="Enrich company records with AI")

    # Provider selection
    parser.add_argument(
        "--openai", action="store_true",
        help="Use OpenAI ChatGPT instead of local Ollama (reads OPENAI_API_KEY from .env)"
    )
    parser.add_argument(
        "--openai-model", default=DEFAULT_OPENAI_MODEL,
        help=f"OpenAI model to use (default: {DEFAULT_OPENAI_MODEL})"
    )
    parser.add_argument(
        "--model", default=DEFAULT_OLLAMA_MODEL,
        help=f"Ollama model to use (default: {DEFAULT_OLLAMA_MODEL})"
    )

    # Record selection
    parser.add_argument("--start", type=int, default=1, help="Start from row N")
    parser.add_argument("--only", type=int, default=None, help="Process only row N")
    parser.add_argument("--max", type=int, default=None, help="Max records to process")
    parser.add_argument("--reset", action="store_true", help="Ignore saved progress")

    args = parser.parse_args()

    # Determine provider and model
    if args.openai:
        provider = "openai"
        model = args.openai_model
        # Validate OpenAI key early
        _get_openai_client()
        log.info(f"Using OpenAI provider, model: {model}")
    else:
        provider = "ollama"
        model = args.model
        # Check Ollama is reachable
        import ollama
        try:
            models_resp = ollama.list()
            available = [m.model for m in models_resp.models]
            log.info(f"Ollama is running. Available models: {available}")
            model_found = any(model in m for m in available)
            if not model_found:
                log.error(
                    f"Model '{model}' not found. Available: {available}\n"
                    f"Pull it with: ollama pull {model}"
                )
                sys.exit(1)
        except Exception as e:
            log.error(f"Cannot connect to Ollama: {e}")
            log.error("Make sure Ollama is running (ollama serve)")
            sys.exit(1)
        log.info(f"Using Ollama provider, model: {model}")

    # Read CSV
    log.info(f"Reading {INPUT_CSV}...")
    records = read_csv_records(INPUT_CSV)
    log.info(f"Loaded {len(records)} records")

    # Load progress
    progress = {} if args.reset else load_progress()
    log.info(f"Previously processed: {len(progress)} records")

    # Determine which records to process
    to_process = []
    for rec in records:
        row = rec["_row"]
        if args.only is not None and row != args.only:
            continue
        if row < args.start:
            continue
        if str(row) in progress:
            # Apply saved progress as expanded columns
            _apply_progress_to_record(rec, progress[str(row)])
            continue
        to_process.append(rec)

    if args.max:
        to_process = to_process[: args.max]

    log.info(f"Records to process this run: {len(to_process)}")

    if not to_process:
        log.info("Nothing to do!")
        # Still write CSV in case progress was loaded
        for rec in records:
            row_key = str(rec["_row"])
            if row_key in progress and "website" not in rec:
                _apply_progress_to_record(rec, progress[row_key])
        write_enriched_csv(records, OUTPUT_CSV)
        return

    # Cost estimate for OpenAI
    if provider == "openai":
        est_cost = len(to_process) * 0.006  # ~$0.006 per record for gpt-4.1-mini
        log.info(
            f"Estimated OpenAI cost: ~${est_cost:.2f} "
            f"({len(to_process)} records x ~$0.006/record with {model})"
        )

    # Process each record
    processed_count = 0
    for rec in to_process:
        row = rec["_row"]
        try:
            result = process_record(rec, provider, model)

            # Save raw JSON to progress file (backup)
            progress[str(row)] = json.dumps(result, ensure_ascii=False)
            save_progress(progress)

            # Apply flattened enrichment to the record's CSV columns
            flat = flatten_enrichment(result)
            for col, val in flat.items():
                rec[col] = val

            processed_count += 1
            log.info(
                f"[Row {row}] Saved. "
                f"Progress: {processed_count}/{len(to_process)}"
            )
        except KeyboardInterrupt:
            log.info("\nInterrupted! Progress has been saved.")
            break
        except Exception as e:
            log.error(f"[Row {row}] Error: {e}")
            progress[str(row)] = json.dumps({"error": str(e)})
            save_progress(progress)

        time.sleep(DELAY_BETWEEN_RECORDS)

    # Apply any progress data to records that weren't in to_process
    for rec in records:
        row_key = str(rec["_row"])
        if row_key in progress and "website" not in rec:
            _apply_progress_to_record(rec, progress[row_key])

    # Write enriched CSV
    write_enriched_csv(records, OUTPUT_CSV)
    log.info("All done!")


def _apply_progress_to_record(rec: dict, progress_json: str):
    """Parse a progress JSON string and apply flattened columns to a record."""
    try:
        result = json.loads(progress_json) if isinstance(progress_json, str) else progress_json
        flat = flatten_enrichment(result)
        for col, val in flat.items():
            rec[col] = val
    except (json.JSONDecodeError, TypeError):
        pass  # skip if progress data is corrupt


if __name__ == "__main__":
    main()
