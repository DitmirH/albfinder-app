-- AlbFinder: records table (company-director data)
-- Run this in Supabase SQL Editor: Dashboard → SQL Editor → New query → paste → Run

CREATE TABLE IF NOT EXISTS records (
  id bigint PRIMARY KEY,
  director_name text,
  company_name text,
  nationality text,
  company_number text,
  company_status text,
  company_type text,
  sic_codes text,
  sic_descriptions text,
  date_of_creation text,
  accounts_next_due text,
  accounts_last_made_up_to text,
  registered_postcode text,
  company_link text,
  officer_link text,
  director_dob text,
  director_address text,
  occupation text,
  country_of_residence text,
  company_size text,
  previous_company_names text,
  accounts_type text,
  company_charges text,
  company_category text,
  registered_address text,
  period_end_date text,
  turnover text,
  net_profit_loss text,
  gross_profit text,
  operating_profit text,
  profit_before_tax text,
  net_assets text,
  cash_at_bank text,
  total_assets text,
  current_assets text,
  working_capital text,
  debtors text,
  creditors_due_within_one_year text,
  share_capital text,
  average_number_of_employees text,
  financial_health_grade text,
  financial_health_score text,
  website_verified text,
  confidence_score text,
  ai_input text,
  filing_links text,
  ai_notes text,
  ai_summary text,
  financial_history text,
  data_enrichment_last text,
  data_quality jsonb,
  google_kp jsonb,
  ebitda text,
  fixed_assets text
);

-- Indexes for common filters and sort
CREATE INDEX IF NOT EXISTS idx_records_nationality ON records(nationality);
CREATE INDEX IF NOT EXISTS idx_records_company_status ON records(company_status);
CREATE INDEX IF NOT EXISTS idx_records_financial_health_grade ON records(financial_health_grade);
CREATE INDEX IF NOT EXISTS idx_records_id ON records(id);
CREATE INDEX IF NOT EXISTS idx_records_director_company ON records(director_name, company_name);

-- RPC: get filter options for dashboard dropdowns
CREATE OR REPLACE FUNCTION get_dashboard_filters()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'nationalities', (SELECT COALESCE(json_agg(n ORDER BY n), '[]'::json) FROM (SELECT DISTINCT nationality AS n FROM records WHERE nationality IS NOT NULL AND nationality != '') t),
    'grades', (SELECT COALESCE(json_agg(g ORDER BY g), '[]'::json) FROM (SELECT DISTINCT financial_health_grade AS g FROM records WHERE financial_health_grade IN ('A','B','C','D','F')) t),
    'statuses', (SELECT COALESCE(json_agg(s ORDER BY s), '[]'::json) FROM (SELECT DISTINCT company_status AS s FROM records WHERE company_status IS NOT NULL AND company_status != '') t)
  ) INTO result;
  RETURN result;
END;
$$;

-- RPC: get dashboard stats (counts and last enriched date)
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
  total_count bigint;
  enriched_count bigint;
  last_enriched text;
  unique_companies bigint;
  unique_directors bigint;
BEGIN
  SELECT COUNT(*) INTO total_count FROM records;
  SELECT COUNT(*) INTO enriched_count FROM records WHERE data_enrichment_last IS NOT NULL AND data_enrichment_last != '';
  SELECT MAX(data_enrichment_last) INTO last_enriched FROM records WHERE data_enrichment_last IS NOT NULL AND data_enrichment_last != '';
  SELECT COUNT(DISTINCT company_number) INTO unique_companies FROM records WHERE company_number IS NOT NULL AND company_number != '';
  SELECT COUNT(DISTINCT director_name) INTO unique_directors FROM records WHERE director_name IS NOT NULL AND director_name != '';
  result := json_build_object(
    'totalCount', total_count,
    'enrichedCount', enriched_count,
    'lastEnriched', last_enriched,
    'uniqueCompanies', unique_companies,
    'uniqueDirectors', unique_directors
  );
  RETURN result;
END;
$$;

-- Enable RLS (optional): allow read for anon by default so the app can read with anon key
ALTER TABLE records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON records
  FOR SELECT USING (true);

-- RPC: get one random record id (for "Random record" button)
CREATE OR REPLACE FUNCTION get_random_record_id()
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT id FROM records ORDER BY random() LIMIT 1;
$$;
