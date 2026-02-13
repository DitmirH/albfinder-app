#!/usr/bin/env python3
"""
Deep enrichment of company records from Companies House.

For each record, this script:
  1. Scrapes the company OVERVIEW page (registered address, status, nature of business)
  2. Scrapes the OFFICERS page (directors, secretaries, service addresses)
  3. Scrapes the PERSONS WITH SIGNIFICANT CONTROL (PSC) page
  4. Scrapes the CHARGES page (mortgages, debentures)
  5. Scrapes the FILING HISTORY and downloads key documents (PDF + iXBRL)
  6. Extracts text from inside documents: accounts, confirmation statements,
     address changes, director appointments, incorporation docs, etc.
  7. Sends ALL gathered data to an LLM which produces:
       - ai_notes:   detailed extracted facts (addresses, contacts, financials, people)
       - ai_summary: concise one-paragraph company overview

Usage:
    python enrich_filings_data.py                                 # Ollama (default)
    python enrich_filings_data.py --model gpt-oss:120b            # Specific Ollama model
    python enrich_filings_data.py --openai                        # ChatGPT (uses .env key)
    python enrich_filings_data.py --openai --openai-model gpt-4.1-mini
    python enrich_filings_data.py --start 5                       # Start from row 5
    python enrich_filings_data.py --only 10                       # Process only row 10
    python enrich_filings_data.py --max 20                        # Process at most 20 records
    python enrich_filings_data.py --reset                         # Re-analyze all records
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
from io import BytesIO

import requests
from bs4 import BeautifulSoup

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
INPUT_CSV = "data.csv"
OUTPUT_CSV = "data.csv"
PROGRESS_FILE = "filings_progress.json"
RAW_DUMP_DIR = "filings_raw"       # folder to store raw extracted data per company
DEFAULT_OLLAMA_MODEL = "mistral"
DEFAULT_OPENAI_MODEL = "gpt-4.1-mini"
REQUEST_TIMEOUT = 25
DELAY_BETWEEN_RECORDS = 2          # be nice to Companies House
DELAY_BETWEEN_REQUESTS = 0.8       # pause between individual page/doc requests
MAX_PDF_PAGES = 10                 # pages to extract per PDF  (was 5)
MAX_DOCS_PER_COMPANY = 8           # documents to fully extract per company (was 5)
MAX_CHARS_PER_DOC = 6000           # chars to keep per extracted document (was 3000)
MAX_FILINGS_TO_LIST = 30           # filing rows to include in the LLM prompt

# Filing types worth downloading documents for
IMPORTANT_FILING_TYPES = {
    # Accounts & returns
    "AA", "AA(S)",
    "CS01", "CS01(A)",             # Confirmation statements
    "AR01",                        # Annual return (old style)
    # Incorporation
    "NEWINC", "MODEL",
    # Directors & secretaries
    "AP01", "AP02", "AP03", "AP04",  # Appointments
    "TM01", "TM02",                  # Terminations
    "CH01", "CH02", "CH03", "CH04",  # Changes
    # Registered office
    "AD01", "AD02", "AD03", "AD04",
    "SAIL", "SAIL(A)",               # Single alternative inspection location
    # Capital & shares
    "SH01", "SH02", "SH03", "SH04", "SH06", "SH07", "SH08", "SH09",
    "SH19",
    "RES15",                       # Special resolution
    "RES01",                       # Ordinary resolution
    # Name changes
    "NM01", "NM04", "NM06",
    # Strike-off
    "DS01", "DS02",
    "GAZ1", "GAZ1(A)", "GAZ2",
    "SOAS(A)", "DISS40", "DISS16(SOAS)",
    # Charges
    "MR01", "MR02", "MR04", "MR05",
    # PSC
    "PSC01", "PSC02", "PSC04", "PSC07", "PSC08", "PSC09",
    # Misc
    "CERTNM", "CERTINC", "CERT", "CERTAR",
    "AA(CERT)",
}

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("filings")

SCRAPE_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-GB,en;q=0.9",
}

CH_BASE = "https://find-and-update.company-information.service.gov.uk"

# ---------------------------------------------------------------------------
# CSV helpers
# ---------------------------------------------------------------------------

def read_csv_records(path: str) -> list[dict]:
    """Read data.csv, auto-detect header, return list of dicts."""
    records = []
    with open(path, "r", encoding="utf-8") as f:
        reader = csv.reader(f)
        first_row = next(reader)
        if first_row and first_row[0].strip().lower() == "table 1":
            header = next(reader)
        else:
            header = first_row
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
    """Read CSV header and detect 'Table 1' junk row."""
    with open(path, "r", encoding="utf-8") as f:
        reader = csv.reader(f)
        first_row = next(reader)
        if first_row and first_row[0].strip().lower() == "table 1":
            return [h.strip() for h in next(reader)], True
        return [h.strip() for h in first_row], False


ENRICHED_COLUMNS = ["ai_notes", "ai_summary", "financial_history", "data_enrichment_last"]
# filing_links is handled specially — it's inserted right after company_link
FILING_LINKS_COLUMN = "filing_links"


def write_csv_enriched(records: list[dict], path: str):
    """Write CSV back with filing_links (next to company_link) and
    ai_notes + ai_summary + financial_history at the end."""
    if not records:
        return

    has_table1 = False
    try:
        header, has_table1 = _read_csv_header(path)
    except (FileNotFoundError, StopIteration):
        # Output file doesn't exist yet — read header from input CSV
        try:
            header, has_table1 = _read_csv_header(INPUT_CSV)
        except (FileNotFoundError, StopIteration):
            header = [k for k in records[0].keys() if not k.startswith("_")]

    # Remove phantom "Unnamed:" columns
    header = [h for h in header if not h.startswith("Unnamed")]

    # Ensure filing_links sits right after company_link
    if FILING_LINKS_COLUMN in header:
        header.remove(FILING_LINKS_COLUMN)
    try:
        idx = header.index("company_link") + 1
    except ValueError:
        idx = len(header)
    header.insert(idx, FILING_LINKS_COLUMN)

    # Ensure enriched columns exist at the end
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
# Progress tracking
# ---------------------------------------------------------------------------

def load_progress() -> dict:
    p = Path(PROGRESS_FILE)
    if p.exists():
        return json.loads(p.read_text(encoding="utf-8"))
    return {}


def save_progress(progress: dict):
    Path(PROGRESS_FILE).write_text(
        json.dumps(progress, indent=2, ensure_ascii=False), encoding="utf-8"
    )


# ---------------------------------------------------------------------------
# Raw data dump  (one JSON per company in filings_raw/)
# ---------------------------------------------------------------------------

def save_raw_dump(rec: dict, overview: dict, officers: list[dict],
                  pscs: list[dict], charges: list[dict],
                  filings: list[dict], doc_extractions: list[dict]):
    """
    Save raw extracted file contents for a company to filings_raw/<company_number>.json

    The JSON includes:
      - enrichment_date: when this data was last enriched
      - charges: list of charges/mortgages (if any)
      - documents: dict where key = "date - description", value = raw text
    """
    from datetime import datetime
    
    company_number = rec.get("company_number") or f"row_{rec['_row']}"
    dump_dir = Path(RAW_DUMP_DIR)
    dump_dir.mkdir(exist_ok=True)

    # Build document extractions
    documents = {}
    for d in doc_extractions:
        key = f"{d['filing_date']} - {d['description']}"
        documents[key] = d["raw_text"]

    # Build full structure
    dump = {
        "enrichment_date": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "company_number": company_number,
        "company_name": rec.get("company_name", ""),
        "charges": charges if charges else "No charges registered",
        "documents": documents
    }

    total_chars = sum(len(v) for v in documents.values())

    out_path = dump_dir / f"{company_number}.json"
    out_path.write_text(
        json.dumps(dump, indent=2, ensure_ascii=False), encoding="utf-8"
    )
    log.info(f"    Raw dump saved: {out_path} ({len(documents)} files, {total_chars:,} chars)")


# ---------------------------------------------------------------------------
# Companies House page scrapers
# ---------------------------------------------------------------------------

def _safe_get(url: str, label: str = "") -> Optional[BeautifulSoup]:
    """GET a URL and return parsed soup, or None on error."""
    try:
        resp = requests.get(url, headers=SCRAPE_HEADERS, timeout=REQUEST_TIMEOUT)
        resp.raise_for_status()
        return BeautifulSoup(resp.text, "html.parser")
    except Exception as e:
        log.debug(f"Failed to fetch {label or url}: {e}")
        return None


def scrape_company_overview(company_link: str) -> dict:
    """
    Scrape the main company overview page for structured data:
      - registered_office_address
      - company_status_detail (e.g. 'Active - Proposal to strike off')
      - company_type_detail
      - incorporated_on
      - sic_codes_live
      - previous_names
      - nature_of_business
      - last_accounts_period
      - next_accounts_due
      - next_confirmation_due
      - has_been_liquidated
      - has_insolvency_history
      - has_charges
      - undelivered_documents
    """
    info = {}
    if not company_link:
        return info

    soup = _safe_get(company_link, "company overview")
    if not soup:
        return info

    # Registered office
    addr_dl = soup.find("dl", {"id": "registered-office-address"})
    if not addr_dl:
        # Fallback: look for the heading
        for h2 in soup.find_all("h2"):
            if "registered office" in h2.get_text(strip=True).lower():
                addr_dl = h2.find_next("dl")
                break
    if addr_dl:
        dd = addr_dl.find("dd")
        if dd:
            info["registered_office_address"] = dd.get_text(", ", strip=True)

    # Extract all definition lists for key-value pairs
    for dl in soup.find_all("dl"):
        for dt, dd in zip(dl.find_all("dt"), dl.find_all("dd")):
            key = dt.get_text(strip=True).lower()
            val = dd.get_text(" ", strip=True)
            if not val or val == "-":
                continue

            if "company status" in key:
                info["company_status_detail"] = val
            elif "company type" in key:
                info["company_type_detail"] = val
            elif "incorporated" in key or "registered" in key and "date" in key:
                info["incorporated_on"] = val
            elif "nature of business" in key or "sic" in key:
                info["sic_codes_live"] = val
            elif "previous name" in key:
                info.setdefault("previous_names", []).append(val)
            elif "last accounts" in key:
                info["last_accounts_period"] = val
            elif "next accounts" in key:
                info["next_accounts_due"] = val
            elif "next statement" in key or "confirmation" in key and "due" in key:
                info["next_confirmation_due"] = val
            elif "liquidat" in key:
                info["has_been_liquidated"] = val
            elif "insolvency" in key:
                info["has_insolvency_history"] = val
            elif "charge" in key and ("has" in key or "register" in key):
                info["has_charges"] = val
            elif "undelivered" in key:
                info["undelivered_documents"] = val

    # Also look for "More" link on filing status banners
    for banner in soup.find_all("div", class_="govuk-warning-text"):
        text = banner.get_text(" ", strip=True)
        if text:
            info["status_banner"] = text

    # Look for important notice panels
    for panel in soup.find_all(["div", "p"], class_=re.compile(r"notice|warning|important", re.I)):
        text = panel.get_text(" ", strip=True)
        if text and len(text) > 10:
            info.setdefault("notices", []).append(text[:200])

    log.info(f"    Overview: {len(info)} fields scraped")
    return info


def scrape_officers(company_link: str) -> list[dict]:
    """
    Scrape the officers page for director/secretary details.

    Returns a list of dicts:
      { name, role, appointed, resigned, nationality, dob, service_address, occupation, country }
    """
    if not company_link:
        return []

    officers_url = company_link.rstrip("/") + "/officers"
    soup = _safe_get(officers_url, "officers page")
    if not soup:
        return []

    officers = []

    # Officers are in appointment-N divs or in definition lists
    for appt in soup.find_all("div", class_="appointment-1"):
        # This is a single officer block — but the class might vary
        pass

    # More reliable: find all officer lists
    # CH uses <div class="appointments-list"> with <h2> name and <dl> details
    for h2 in soup.find_all("h2", class_="heading-medium"):
        name = h2.get_text(strip=True)
        if not name or len(name) < 3:
            continue
        # Skip section headings, cookie banners, footer junk
        if any(skip in name.lower() for skip in [
            "filter officers", "register view", "cookie",
            "support link", "help us improve", "officers:",
        ]):
            continue

        officer = {"name": name}

        # The details are in a <dl> after the heading
        dl = h2.find_next("dl")
        if dl:
            items = dl.find_all(["dt", "dd"])
            for i in range(0, len(items) - 1, 2):
                dt_text = items[i].get_text(strip=True).lower()
                dd_text = items[i + 1].get_text(", ", strip=True)
                if not dd_text or dd_text == "-":
                    continue

                if "role" in dt_text:
                    officer["role"] = dd_text
                elif "appoint" in dt_text:
                    officer["appointed"] = dd_text
                elif "resign" in dt_text:
                    officer["resigned"] = dd_text
                elif "nationality" in dt_text:
                    officer["nationality"] = dd_text
                elif "date of birth" in dt_text or "born" in dt_text:
                    officer["dob"] = dd_text
                elif "address" in dt_text or "correspondence" in dt_text:
                    officer["service_address"] = dd_text
                elif "occupation" in dt_text:
                    officer["occupation"] = dd_text
                elif "country" in dt_text and "residence" in dt_text:
                    officer["country_of_residence"] = dd_text

        if officer.get("name"):
            officers.append(officer)

    # Alternative parsing: look for all definition-list pairs on the page
    if not officers:
        for dl in soup.find_all("dl"):
            officer = {}
            items = dl.find_all(["dt", "dd"])
            for i in range(0, len(items) - 1, 2):
                dt_text = items[i].get_text(strip=True).lower()
                dd_text = items[i + 1].get_text(", ", strip=True)
                if not dd_text or dd_text == "-":
                    continue
                if "name" in dt_text:
                    officer["name"] = dd_text
                elif "role" in dt_text:
                    officer["role"] = dd_text
                elif "appoint" in dt_text:
                    officer["appointed"] = dd_text
                elif "address" in dt_text:
                    officer["service_address"] = dd_text
                elif "nationality" in dt_text:
                    officer["nationality"] = dd_text
                elif "occupation" in dt_text:
                    officer["occupation"] = dd_text
                elif "country" in dt_text:
                    officer["country_of_residence"] = dd_text
                elif "born" in dt_text or "date of birth" in dt_text:
                    officer["dob"] = dd_text
            if officer.get("name") or officer.get("role"):
                officers.append(officer)

    log.info(f"    Officers: {len(officers)} found")
    return officers


def scrape_psc(company_link: str) -> list[dict]:
    """
    Scrape Persons with Significant Control page.

    Returns a list of dicts:
      { name, nature_of_control, address, notified_on, nationality, dob, country }
    """
    if not company_link:
        return []

    psc_url = company_link.rstrip("/") + "/persons-with-significant-control"
    soup = _safe_get(psc_url, "PSC page")
    if not soup:
        return []

    pscs = []

    # PSCs are displayed similarly to officers — headings + definition lists
    for h2 in soup.find_all("h2"):
        name = h2.get_text(strip=True)
        if not name or len(name) < 3:
            continue
        # Skip section headings, cookie banners, footer junk
        if any(skip in name.lower() for skip in [
            "persons with significant", "filter", "register", "no psc",
            "statement", "exemption", "cookie", "support link",
            "help us improve", "follow us", "services and information",
            "departments", "government activity",
        ]):
            continue

        psc = {"name": name}
        dl = h2.find_next("dl")
        if dl:
            items = dl.find_all(["dt", "dd"])
            for i in range(0, len(items) - 1, 2):
                dt_text = items[i].get_text(strip=True).lower()
                dd_text = items[i + 1].get_text(", ", strip=True)
                if not dd_text or dd_text == "-":
                    continue

                if "nature of control" in dt_text:
                    psc["nature_of_control"] = dd_text
                elif "address" in dt_text or "correspondence" in dt_text:
                    psc["address"] = dd_text
                elif "notified" in dt_text:
                    psc["notified_on"] = dd_text
                elif "nationality" in dt_text:
                    psc["nationality"] = dd_text
                elif "country" in dt_text:
                    psc["country"] = dd_text
                elif "born" in dt_text or "date of birth" in dt_text:
                    psc["dob"] = dd_text

        if psc.get("name"):
            pscs.append(psc)

    log.info(f"    PSCs: {len(pscs)} found")
    return pscs


def scrape_charges(company_link: str) -> list[dict]:
    """
    Scrape the charges/mortgages page.

    Returns a list of dicts:
      { description, created, delivered, status, persons_entitled, charge_link }
    """
    if not company_link:
        return []

    charges_url = company_link.rstrip("/") + "/charges"
    soup = _safe_get(charges_url, "charges page")
    if not soup:
        return []

    charges = []

    for h2 in soup.find_all("h2"):
        text = h2.get_text(strip=True)
        if not text or len(text) < 5:
            continue
        if any(skip in text.lower() for skip in [
            "filter", "charges", "mortgage", "register"
        ]) and len(text) < 30:
            continue

        charge = {"description": text}
        
        # Try to find link to the charge document
        link_tag = h2.find("a")
        if link_tag and link_tag.get("href"):
            href = link_tag.get("href")
            if href.startswith("/"):
                charge["charge_link"] = CH_BASE + href
            else:
                charge["charge_link"] = href
        
        dl = h2.find_next("dl")
        if dl:
            items = dl.find_all(["dt", "dd"])
            for i in range(0, len(items) - 1, 2):
                dt_text = items[i].get_text(strip=True).lower()
                dd_text = items[i + 1].get_text(", ", strip=True)
                if not dd_text:
                    continue
                if "created" in dt_text:
                    charge["created"] = dd_text
                elif "delivered" in dt_text:
                    charge["delivered"] = dd_text
                elif "status" in dt_text:
                    charge["status"] = dd_text
                elif "entitled" in dt_text:
                    charge["persons_entitled"] = dd_text

        if charge.get("created") or charge.get("status"):
            charges.append(charge)

    if charges:
        log.info(f"    Charges: {len(charges)} found")
    else:
        log.info(f"    Charges: No charges registered")
    return charges


# ---------------------------------------------------------------------------
# Document text extraction  (PDF + iXBRL)
# ---------------------------------------------------------------------------

def extract_ixbrl_text(ixbrl_url: str) -> Optional[str]:
    """Download an iXBRL (XHTML) document and extract its text."""
    try:
        resp = requests.get(ixbrl_url, headers=SCRAPE_HEADERS, timeout=REQUEST_TIMEOUT)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")
        text = soup.get_text(" ", strip=True)
        return text[:MAX_CHARS_PER_DOC] if text else None
    except Exception as e:
        log.debug(f"iXBRL extraction failed: {e}")
        return None


def extract_pdf_text(pdf_url: str) -> Optional[str]:
    """Download a Companies House PDF and extract its text content."""
    try:
        resp = requests.get(pdf_url, headers=SCRAPE_HEADERS, timeout=REQUEST_TIMEOUT)
        resp.raise_for_status()

        if not resp.content[:5].startswith(b"%PDF"):
            log.debug(f"Not a PDF: {pdf_url}")
            return None

        try:
            import PyPDF2
        except ImportError:
            log.error("PyPDF2 is required. Install: pip install PyPDF2")
            return None

        pdf_file = BytesIO(resp.content)
        reader = PyPDF2.PdfReader(pdf_file)
        text_parts = []

        for i, page in enumerate(reader.pages[:MAX_PDF_PAGES]):
            try:
                text = page.extract_text()
                if text and text.strip():
                    text_parts.append(text.strip())
            except Exception as e:
                log.debug(f"Page {i} extraction failed: {e}")

        if not text_parts:
            return None

        combined = "\n\n".join(text_parts)
        return combined[:MAX_CHARS_PER_DOC]

    except requests.exceptions.HTTPError as e:
        log.debug(f"HTTP {e.response.status_code} for PDF: {pdf_url}")
        return None
    except Exception as e:
        log.debug(f"PDF extraction failed: {e}")
        return None


def extract_document_text(filing: dict) -> Optional[str]:
    """Extract text from a filing, preferring iXBRL over PDF."""
    # Prefer iXBRL — always text-based
    if filing.get("ixbrl_url"):
        log.info(f"      -> iXBRL")
        text = extract_ixbrl_text(filing["ixbrl_url"])
        if text:
            return text

    # Fall back to PDF
    if filing.get("pdf_url"):
        log.info(f"      -> PDF")
        text = extract_pdf_text(filing["pdf_url"])
        if text:
            return text

    return None


# ---------------------------------------------------------------------------
# Filing history scraper
# ---------------------------------------------------------------------------

def scrape_filing_history(company_link: str) -> list[dict]:
    """
    Scrape the Companies House filing history page.

    Returns a list of dicts:
      { date, type, description, pdf_url, ixbrl_url }
    """
    if not company_link:
        return []

    filings_url = company_link.rstrip("/") + "/filing-history"

    try:
        resp = requests.get(filings_url, headers=SCRAPE_HEADERS, timeout=REQUEST_TIMEOUT)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, "html.parser")

        table = soup.find("table", {"id": "fhTable"})
        if not table:
            log.warning(f"No filing history table at {filings_url}")
            return []

        tbody = table.find("tbody")
        container = tbody if tbody else table

        filings = []
        rows = container.find_all("tr")

        for row in rows:
            cells = row.find_all("td")
            if len(cells) < 3:
                continue

            date_text = cells[0].get_text(strip=True)
            filing_type = cells[1].get_text(strip=True) if len(cells) > 1 else ""

            desc_cell = cells[2] if len(cells) > 2 else cells[-1]
            description = desc_cell.get_text(" ", strip=True)

            pdf_link = None
            ixbrl_link = None
            link_cell = cells[3] if len(cells) > 3 else desc_cell

            for a in link_cell.find_all("a", href=True):
                href = a.get("href", "")
                a_text = a.get_text(strip=True)
                a_classes = a.get("class") or []
                full_href = (CH_BASE + href) if href.startswith("/") else href

                if "iXBRL" in a_text or "xhtml" in href:
                    ixbrl_link = full_href
                elif "download" in a_classes or "View PDF" in a_text or "/document" in href:
                    if not pdf_link:
                        pdf_link = full_href

            # Also check the description cell for links (some filings have them there)
            if not pdf_link and not ixbrl_link and desc_cell != link_cell:
                for a in desc_cell.find_all("a", href=True):
                    href = a.get("href", "")
                    full_href = (CH_BASE + href) if href.startswith("/") else href
                    if "/document" in href and not pdf_link:
                        pdf_link = full_href

            if date_text and description:
                filings.append({
                    "date": date_text,
                    "type": filing_type,
                    "description": description,
                    "pdf_url": pdf_link,
                    "ixbrl_url": ixbrl_link,
                })

        log.info(f"    Filing history: {len(filings)} filings found")
        return filings

    except requests.exceptions.HTTPError as e:
        log.warning(f"HTTP {e.response.status_code} scraping filings: {filings_url}")
        return []
    except Exception as e:
        log.warning(f"Failed to scrape filing history: {e}")
        return []


# ---------------------------------------------------------------------------
# LLM helpers
# ---------------------------------------------------------------------------

_openai_client = None


def _get_openai_client():
    global _openai_client
    if _openai_client is None:
        from dotenv import load_dotenv
        from openai import OpenAI

        load_dotenv()
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            log.error(
                "OPENAI_API_KEY not found!\n"
                "Create .env with:  OPENAI_API_KEY=sk-your-key-here"
            )
            sys.exit(1)

        _openai_client = OpenAI(api_key=api_key)
        log.info("OpenAI client initialised")
    return _openai_client


def _is_reasoning_model(model: str) -> bool:
    prefixes = ["o1", "o3", "o4", "gpt-5", "gpt-5.1", "gpt-5.2"]
    return any(model.startswith(p) for p in prefixes)


def _format_officers(officers: list[dict]) -> str:
    """Format officers list for the prompt."""
    if not officers:
        return "(No officers data scraped)"
    lines = []
    for o in officers:
        parts = [o.get("name", "?")]
        if o.get("role"):
            parts.append(f"Role: {o['role']}")
        if o.get("appointed"):
            parts.append(f"Appointed: {o['appointed']}")
        if o.get("resigned"):
            parts.append(f"Resigned: {o['resigned']}")
        if o.get("service_address"):
            parts.append(f"Service Addr: {o['service_address']}")
        if o.get("nationality"):
            parts.append(f"Nationality: {o['nationality']}")
        if o.get("occupation"):
            parts.append(f"Occupation: {o['occupation']}")
        if o.get("country_of_residence"):
            parts.append(f"Country: {o['country_of_residence']}")
        if o.get("dob"):
            parts.append(f"DOB: {o['dob']}")
        lines.append("  " + " | ".join(parts))
    return "\n".join(lines)


def _format_pscs(pscs: list[dict]) -> str:
    """Format PSC list for the prompt."""
    if not pscs:
        return "(No PSC data scraped)"
    lines = []
    for p in pscs:
        parts = [p.get("name", "?")]
        if p.get("nature_of_control"):
            parts.append(f"Control: {p['nature_of_control']}")
        if p.get("address"):
            parts.append(f"Addr: {p['address']}")
        if p.get("notified_on"):
            parts.append(f"Notified: {p['notified_on']}")
        if p.get("nationality"):
            parts.append(f"Nationality: {p['nationality']}")
        lines.append("  " + " | ".join(parts))
    return "\n".join(lines)


def _format_charges(charges: list[dict]) -> str:
    """Format charges for the prompt."""
    if not charges:
        return "(No charges registered)"
    lines = []
    for c in charges:
        parts = [c.get("description", "?")[:80]]
        if c.get("created"):
            parts.append(f"Created: {c['created']}")
        if c.get("status"):
            parts.append(f"Status: {c['status']}")
        if c.get("persons_entitled"):
            parts.append(f"Entitled: {c['persons_entitled'][:60]}")
        if c.get("charge_link"):
            parts.append(f"Link: {c['charge_link']}")
        lines.append("  " + " | ".join(parts))
    return "\n".join(lines)


def _format_overview(overview: dict) -> str:
    """Format overview data for the prompt."""
    if not overview:
        return "(No overview data scraped)"
    lines = []
    for k, v in overview.items():
        if isinstance(v, list):
            v = "; ".join(str(x) for x in v)
        lines.append(f"  {k}: {v}")
    return "\n".join(lines)


def _build_deep_prompt(rec: dict, overview: dict, officers: list[dict],
                       pscs: list[dict], charges: list[dict],
                       filings: list[dict], doc_texts: list[str]) -> str:
    """Build the comprehensive LLM prompt with all scraped data."""

    # Filing history summary
    filing_lines = []
    for f in filings[:MAX_FILINGS_TO_LIST]:
        has_doc = "[DOC]" if f.get("pdf_url") or f.get("ixbrl_url") else ""
        filing_lines.append(f"  {f['date']}  [{f['type']}]  {f['description'][:80]}  {has_doc}")
    filings_block = "\n".join(filing_lines)

    # Document excerpts
    doc_block = "\n\n".join(doc_texts) if doc_texts else "(No documents could be extracted)"

    return f"""You are a UK company intelligence analyst. You have been given comprehensive
Companies House data for a company. Your job is to extract EVERY useful detail
and produce two outputs.

====================== COMPANY RECORD ======================
Company Name:     {rec.get('company_name', 'Unknown')}
Company Number:   {rec.get('company_number', 'Unknown')}
Director:         {rec.get('director_name', 'Unknown')}
Status:           {rec.get('company_status', 'Unknown')}
Incorporated:     {rec.get('date_of_creation', 'Unknown')}
SIC Codes:        {rec.get('sic_descriptions', 'Unknown')[:150]}
Registered Addr:  {rec.get('registered_address', 'Unknown')}
Director Addr:    {rec.get('director_address', 'Unknown')}

====================== OVERVIEW PAGE DATA ======================
{_format_overview(overview)}

====================== OFFICERS ======================
{_format_officers(officers)}

====================== PERSONS WITH SIGNIFICANT CONTROL ======================
{_format_pscs(pscs)}

====================== CHARGES / MORTGAGES ======================
{_format_charges(charges)}

====================== FILING HISTORY ({len(filings)} filings) ======================
{filings_block}

====================== EXTRACTED DOCUMENT CONTENT ======================
(These are text excerpts from inside the actual PDF/iXBRL documents filed with Companies House)

{doc_block}

====================== YOUR TASK ======================

Produce THREE sections, separated by the exact markers shown below:

SECTION 1 (ai_notes): Detailed extracted facts. Go through ALL the document
excerpts and scraped data carefully. Extract and list:

  - ALL addresses found: registered office (current + historical), service addresses
    for directors, trading addresses, correspondence addresses
  - ALL people: directors (current + former), secretaries, PSCs, shareholders,
    with their appointment/resignation dates and service addresses
  - Financial data from accounts: turnover, profit/loss, net assets, cash,
    total assets, share capital, employee count, auditor name
  - Key dates: incorporation, address changes, director changes, name changes
  - Charges/mortgages: who holds them, amounts if visible, status
  - Any phone numbers, email addresses, or website URLs found in documents
  - Trading names or business names different from the company name
  - Any mention of parent companies, subsidiaries, or related entities

---SUMMARY---

SECTION 2 (ai_summary): Write a concise 2-3 sentence summary of what this
company is, what it does, and its current health/status. Quick executive overview.

---FINANCIAL_HISTORY---

SECTION 3 (financial_history): Output a JSON object with year-by-year financial
data extracted from the accounts documents. Use this exact structure:
{{
  "YYYY-MM-DD": {{
    "period_end": "YYYY-MM-DD",
    "turnover": null or number,
    "gross_profit": null or number,
    "operating_profit": null or number,
    "profit_before_tax": null or number,
    "net_profit": null or number,
    "fixed_assets": null or number,
    "current_assets": null or number,
    "total_assets": null or number,
    "net_assets": null or number,
    "cash_at_bank": null or number,
    "creditors_within_1yr": null or number,
    "creditors_after_1yr": null or number,
    "share_capital": null or number,
    "net_current_assets": null or number,
    "capital_and_reserves": null or number,
    "employees": null or number
  }}
}}
Use the period end date (e.g. "2022-05-31") as the key for each year.
Include ALL years you can find in the documents. Use plain numbers (no currency
symbols, no commas). Use null for values not disclosed. Output ONLY the JSON
object in this section, nothing else.

IMPORTANT:
- Extract EVERY address, name, date, and number you can find in the documents.
- Be factual - only report what is actually in the data provided.
- Sections 1 and 2 must be plain text (no markdown, no JSON).
- Section 3 MUST be valid JSON only.
- The three sections MUST be separated by exactly: ---SUMMARY--- and ---FINANCIAL_HISTORY---"""


def call_llm(prompt: str, provider: str, model: str) -> str:
    """Send prompt to LLM and return the response text."""
    try:
        if provider == "openai":
            client = _get_openai_client()
            kwargs = {
                "model": model,
                "messages": [
                    {
                        "role": "system",
                        "content": (
                            "You are a UK company intelligence analyst. "
                            "Extract every useful fact from Companies House data. "
                            "Be thorough and precise. Plain text only."
                        ),
                    },
                    {"role": "user", "content": prompt},
                ],
            }
            if _is_reasoning_model(model):
                kwargs["max_completion_tokens"] = 3000
            else:
                kwargs["temperature"] = 0.15
                kwargs["max_tokens"] = 3000

            response = client.chat.completions.create(**kwargs)
            text = response.choices[0].message.content or ""

            usage = response.usage
            if usage:
                log.info(
                    f"    LLM tokens - "
                    f"in: {usage.prompt_tokens:,}, "
                    f"out: {usage.completion_tokens:,}"
                )
            return text.strip()

        else:  # ollama
            import ollama
            response = ollama.chat(
                model=model,
                messages=[{"role": "user", "content": prompt}],
                options={"temperature": 0.15, "num_predict": 3000},
            )
            return (response["message"]["content"] or "").strip()

    except Exception as e:
        log.error(f"LLM call failed: {e}")
        return ""


def parse_llm_response(response: str) -> tuple[str, str, str]:
    """Split LLM response into (ai_notes, ai_summary, financial_history)
    using the ---SUMMARY--- and ---FINANCIAL_HISTORY--- markers."""

    ai_notes = ""
    ai_summary = ""
    financial_history = ""

    # Split on ---FINANCIAL_HISTORY--- first (if present)
    if "---FINANCIAL_HISTORY---" in response:
        before_fin, fin_part = response.split("---FINANCIAL_HISTORY---", 1)
        financial_raw = fin_part.strip()

        # Extract just the JSON part (between first { and last })
        json_start = financial_raw.find("{")
        json_end = financial_raw.rfind("}")
        if json_start != -1 and json_end != -1:
            json_str = financial_raw[json_start:json_end + 1]
            try:
                # Validate it parses
                json.loads(json_str)
                financial_history = json_str
            except json.JSONDecodeError:
                log.warning("  Financial history JSON failed to parse, storing raw")
                financial_history = json_str
        else:
            financial_history = financial_raw
    else:
        before_fin = response

    # Split notes/summary on ---SUMMARY---
    if "---SUMMARY---" in before_fin:
        parts = before_fin.split("---SUMMARY---", 1)
        ai_notes = parts[0].strip()
        ai_summary = parts[1].strip()
    else:
        ai_notes = before_fin.strip()
        paragraphs = [p.strip() for p in ai_notes.split("\n\n") if p.strip()]
        if len(paragraphs) > 1:
            ai_summary = paragraphs[-1]

    # Strip any "SECTION N (label):" prefixes the LLM may have included
    import re
    section_re = re.compile(r"^SECTION\s*\d+\s*\([^)]*\)\s*:\s*", re.IGNORECASE)
    ai_notes = section_re.sub("", ai_notes).strip()
    ai_summary = section_re.sub("", ai_summary).strip()

    return ai_notes, ai_summary, financial_history


# ---------------------------------------------------------------------------
# Record processor
# ---------------------------------------------------------------------------

def _build_filing_links(filings: list[dict]) -> str:
    """Build a JSON string mapping 'date - type - description' to its document URL."""
    links = {}
    for f in filings:
        key = f"{f['date']} - {f['type']} - {f['description'][:80]}"
        url = f.get("ixbrl_url") or f.get("pdf_url")
        if url:
            links[key] = url
        else:
            # Still record the filing even without a downloadable doc
            links[key] = None
    return json.dumps(links, ensure_ascii=False)


def process_record(rec: dict, provider: str, model: str) -> dict:
    """
    Full deep-enrichment pipeline for one record:
      1. Scrape company overview page
      2. Scrape officers page
      3. Scrape PSC page
      4. Scrape charges page
      5. Scrape filing history
      6. Download and extract text from key documents
      7. Send ALL data to LLM for analysis
      8. Return dict with ai_notes, ai_summary, financial_history, filing_links, data_enrichment_last

    Returns: {"ai_notes": str, "ai_summary": str, "financial_history": str, "filing_links": str, "data_enrichment_last": str}
    """
    company = rec.get("company_name") or "?"
    row = rec["_row"]
    company_link = rec.get("company_link")

    if not company_link:
        log.info(f"[Row {row}] {company} - no company_link, skipping")
        from datetime import datetime
        return {
            "ai_notes": "",
            "ai_summary": "",
            "financial_history": "",
            "filing_links": "",
            "data_enrichment_last": datetime.now().strftime("%Y-%m-%d")
        }

    log.info(f"[Row {row}] === {company} ===")

    # ── Step 1: Scrape company overview ───────────────────────────────────
    log.info(f"[Row {row}]   Step 1/6: Scraping company overview...")
    overview = scrape_company_overview(company_link)
    time.sleep(DELAY_BETWEEN_REQUESTS)

    # ── Step 2: Scrape officers ───────────────────────────────────────────
    log.info(f"[Row {row}]   Step 2/6: Scraping officers...")
    officers = scrape_officers(company_link)
    time.sleep(DELAY_BETWEEN_REQUESTS)

    # ── Step 3: Scrape PSC ────────────────────────────────────────────────
    log.info(f"[Row {row}]   Step 3/6: Scraping PSC...")
    pscs = scrape_psc(company_link)
    time.sleep(DELAY_BETWEEN_REQUESTS)

    # ── Step 4: Scrape charges ────────────────────────────────────────────
    log.info(f"[Row {row}]   Step 4/6: Scraping charges...")
    charges = scrape_charges(company_link)
    time.sleep(DELAY_BETWEEN_REQUESTS)

    # ── Step 5: Scrape filing history ─────────────────────────────────────
    log.info(f"[Row {row}]   Step 5/6: Scraping filing history...")
    filings = scrape_filing_history(company_link)
    time.sleep(DELAY_BETWEEN_REQUESTS)

    # ── Step 6: Extract documents ─────────────────────────────────────────
    log.info(f"[Row {row}]   Step 6/7: Extracting document content...")
    doc_texts = []          # formatted for LLM prompt
    doc_extractions = []    # raw metadata + full text for the dump
    docs_extracted = 0

    def _try_extract(filing: dict):
        """Extract a document and track it for both the LLM prompt and raw dump."""
        nonlocal docs_extracted
        if docs_extracted >= MAX_DOCS_PER_COMPANY:
            return
        if not filing.get("pdf_url") and not filing.get("ixbrl_url"):
            return

        log.info(f"[Row {row}]     {filing['type']} ({filing['date']}) - {filing['description'][:50]}")

        # Determine which source was used
        source = None
        url_used = None
        text = None

        if filing.get("ixbrl_url"):
            log.info(f"      -> iXBRL")
            text = extract_ixbrl_text(filing["ixbrl_url"])
            if text:
                source = "ixbrl"
                url_used = filing["ixbrl_url"]

        if not text and filing.get("pdf_url"):
            log.info(f"      -> PDF")
            text = extract_pdf_text(filing["pdf_url"])
            if text:
                source = "pdf"
                url_used = filing["pdf_url"]

        if text:
            # For the LLM prompt (truncated)
            doc_texts.append(
                f"--- {filing['date']} | {filing['type']} | {filing['description'][:80]} ---\n{text}"
            )

            # For the raw dump (full text, all metadata)
            doc_extractions.append({
                "filing_date": filing["date"],
                "filing_type": filing["type"],
                "description": filing["description"],
                "source": source,
                "url": url_used,
                "pdf_url": filing.get("pdf_url"),
                "ixbrl_url": filing.get("ixbrl_url"),
                "chars_extracted": len(text),
                "raw_text": text,
            })
            docs_extracted += 1

        time.sleep(DELAY_BETWEEN_REQUESTS)

    # Priority pass: important filing types first
    for f in filings:
        if docs_extracted >= MAX_DOCS_PER_COMPANY:
            break
        if f["type"] in IMPORTANT_FILING_TYPES or docs_extracted < 3:
            _try_extract(f)

    # Second pass: anything else with a downloadable document
    already_tried = {d["url"] for d in doc_extractions if d.get("url")}
    if docs_extracted < MAX_DOCS_PER_COMPANY:
        for f in filings:
            if docs_extracted >= MAX_DOCS_PER_COMPANY:
                break
            # Skip if we already grabbed this one
            urls = [f.get("pdf_url"), f.get("ixbrl_url")]
            if any(u in already_tried for u in urls if u):
                continue
            if f["type"] in IMPORTANT_FILING_TYPES:
                continue  # already tried in priority pass
            _try_extract(f)

    total_chars = sum(len(t) for t in doc_texts)
    log.info(
        f"[Row {row}]   Extracted {docs_extracted} documents, "
        f"{total_chars:,} chars total"
    )

    # ── Step 6b: Save raw dump ────────────────────────────────────────────
    log.info(f"[Row {row}]   Saving raw data dump...")
    save_raw_dump(rec, overview, officers, pscs, charges, filings, doc_extractions)

    # ── Build filing_links JSON ───────────────────────────────────────────
    filing_links_json = _build_filing_links(filings)
    log.info(f"[Row {row}]   Filing links: {len(filings)} entries")

    # ── Step 7: LLM analysis ─────────────────────────────────────────────
    log.info(f"[Row {row}]   Step 7/7: Analysing with {model}...")
    prompt = _build_deep_prompt(rec, overview, officers, pscs, charges, filings, doc_texts)
    response = call_llm(prompt, provider, model)

    ai_notes, ai_summary, financial_history = parse_llm_response(response)

    if ai_notes:
        log.info(f"[Row {row}]   ai_notes: {len(ai_notes)} chars")
    if ai_summary:
        log.info(f"[Row {row}]   ai_summary: {len(ai_summary)} chars")
    if financial_history:
        log.info(f"[Row {row}]   financial_history: {len(financial_history)} chars")

    if not ai_notes and not ai_summary:
        log.warning(f"[Row {row}]   No analysis generated")

    from datetime import datetime
    enrichment_date = datetime.now().strftime("%Y-%m-%d")

    return {
        "ai_notes": ai_notes,
        "ai_summary": ai_summary,
        "financial_history": financial_history,
        "filing_links": filing_links_json,
        "data_enrichment_last": enrichment_date,
    }


# ---------------------------------------------------------------------------
# Progress helpers
# ---------------------------------------------------------------------------

def _apply_progress_to_record(rec: dict, progress: dict):
    """Copy saved progress data (all enriched fields) into a record dict."""
    rk = str(rec["_row"])
    if rk not in progress:
        return
    p = progress[rk]
    if isinstance(p, dict):
        rec["ai_notes"] = p.get("ai_notes", "")
        rec["ai_summary"] = p.get("ai_summary", "")
        rec["financial_history"] = p.get("financial_history", "")
        rec[FILING_LINKS_COLUMN] = p.get("filing_links", "")
        rec["data_enrichment_last"] = p.get("data_enrichment_last", "")
    else:
        # Backward compat: old progress was just a string
        rec["ai_notes"] = p
        rec["ai_summary"] = ""
        rec["financial_history"] = ""
        rec[FILING_LINKS_COLUMN] = ""
        rec["data_enrichment_last"] = ""


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="Deep enrichment of company records from Companies House filings & documents"
    )

    # Provider
    parser.add_argument(
        "--openai", action="store_true",
        help="Use OpenAI ChatGPT (reads OPENAI_API_KEY from .env)"
    )
    parser.add_argument(
        "--openai-model", default=DEFAULT_OPENAI_MODEL,
        help=f"OpenAI model (default: {DEFAULT_OPENAI_MODEL})"
    )
    parser.add_argument(
        "--model", default=DEFAULT_OLLAMA_MODEL,
        help=f"Ollama model (default: {DEFAULT_OLLAMA_MODEL})"
    )

    # Record selection
    parser.add_argument("--start", type=int, default=1, help="Start from row N")
    parser.add_argument("--only", type=int, default=None, help="Process only row N")
    parser.add_argument("--max", type=int, default=None, help="Max records to process")
    parser.add_argument("--reset", action="store_true", help="Ignore saved progress, re-analyse all")

    # I/O
    parser.add_argument("--input", default=INPUT_CSV, help=f"Input CSV (default: {INPUT_CSV})")
    parser.add_argument("--output", default=None, help="Output CSV (default: same as input)")

    args = parser.parse_args()

    input_csv = args.input
    output_csv = args.output or input_csv

    # ── Validate provider ──────────────────────────────────────────────────
    if args.openai:
        provider = "openai"
        model = args.openai_model
        _get_openai_client()
        log.info(f"Provider: OpenAI  |  Model: {model}")
    else:
        provider = "ollama"
        model = args.model
        import ollama
        try:
            models_resp = ollama.list()
            available = [m.model for m in models_resp.models]
            log.info(f"Ollama models available: {available}")
            if not any(model in m for m in available):
                log.error(f"Model '{model}' not found. Pull it with: ollama pull {model}")
                sys.exit(1)
        except Exception as e:
            log.error(f"Cannot connect to Ollama: {e}")
            log.error("Make sure Ollama is running (ollama serve)")
            sys.exit(1)
        log.info(f"Provider: Ollama  |  Model: {model}")

    # ── Check PyPDF2 ──────────────────────────────────────────────────────
    try:
        import PyPDF2  # noqa: F401
        log.info("PyPDF2 available for PDF extraction")
    except ImportError:
        log.warning("PyPDF2 not installed - PDFs will be skipped. Install: pip install PyPDF2")

    # ── Read CSV ──────────────────────────────────────────────────────────
    log.info(f"Reading {input_csv}...")
    records = read_csv_records(input_csv)
    log.info(f"Loaded {len(records)} records")

    # ── Load progress ─────────────────────────────────────────────────────
    progress = {} if args.reset else load_progress()
    log.info(f"Previously analysed: {len(progress)} records")

    # ── Filter records ────────────────────────────────────────────────────
    to_process = []
    for rec in records:
        row = rec["_row"]
        if args.only is not None and row != args.only:
            continue
        if row < args.start:
            continue
        if str(row) in progress and not args.reset:
            continue
        if not rec.get("company_link"):
            continue
        to_process.append(rec)

    if args.max:
        to_process = to_process[:args.max]

    log.info(f"Records to process: {len(to_process)}")

    if not to_process:
        log.info("Nothing to do! All records already analysed (use --reset to redo).")
        for rec in records:
            _apply_progress_to_record(rec, progress)
        write_csv_enriched(records, output_csv)
        return

    # ── Cost estimate (OpenAI) ────────────────────────────────────────────
    if provider == "openai":
        est = len(to_process) * 0.008  # ~$0.008 per record (more data now)
        log.info(f"Estimated OpenAI cost: ~${est:.2f} for {len(to_process)} records")

    # ── Process ───────────────────────────────────────────────────────────
    processed = 0
    for rec in to_process:
        row = rec["_row"]
        try:
            result = process_record(rec, provider, model)

            # Save to progress (all enriched fields)
            progress[str(row)] = {
                "ai_notes": result["ai_notes"],
                "ai_summary": result["ai_summary"],
                "financial_history": result["financial_history"],
                "filing_links": result["filing_links"],
                "data_enrichment_last": result["data_enrichment_last"],
            }
            save_progress(progress)

            processed += 1
            remaining = len(to_process) - processed
            log.info(
                f"[Row {row}] DONE ({processed}/{len(to_process)}, "
                f"{remaining} remaining)"
            )

        except KeyboardInterrupt:
            log.info("\nInterrupted! Progress saved. Resume by re-running.")
            break
        except Exception as e:
            log.error(f"[Row {row}] Error: {e}")
            from datetime import datetime
            progress[str(row)] = {
                "ai_notes": f"ERROR: {e}",
                "ai_summary": "",
                "financial_history": "",
                "filing_links": "",
                "data_enrichment_last": datetime.now().strftime("%Y-%m-%d"),
            }
            save_progress(progress)

        if processed < len(to_process):
            time.sleep(DELAY_BETWEEN_RECORDS)

    # ── Apply all progress to records and write CSV ───────────────────────
    for rec in records:
        _apply_progress_to_record(rec, progress)

    write_csv_enriched(records, output_csv)

    log.info(f"\n{'='*60}")
    log.info(f"Complete! Deep-analysed {processed} records.")
    log.info(f"  Progress file: {PROGRESS_FILE}")
    log.info(f"  Output CSV:    {output_csv}")
    log.info(f"  Columns added: filing_links, ai_notes, ai_summary, financial_history, data_enrichment_last")
    log.info(f"{'='*60}")


if __name__ == "__main__":
    main()
