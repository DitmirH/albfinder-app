-- Paginated records with correct numeric sort for currency/score columns.
-- Text columns (current_assets, turnover, etc.) are stored as text; this RPC
-- sorts them by numeric value so e.g. 345000 comes before 100000 when descending.

CREATE OR REPLACE FUNCTION get_records_paginated(
  p_page int DEFAULT 1,
  p_page_size int DEFAULT 10,
  p_search text DEFAULT '',
  p_nationality text DEFAULT NULL,
  p_grade text DEFAULT NULL,
  p_status text DEFAULT NULL,
  p_sort_field text DEFAULT 'id',
  p_sort_dir text DEFAULT 'asc'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_from int;
  v_order_clause text;
  v_sql text;
  v_result json;
  v_asc boolean;
BEGIN
  v_from := (p_page - 1) * GREATEST(p_page_size, 1);
  v_asc := COALESCE(LOWER(TRIM(p_sort_dir)), 'asc') = 'asc';

  -- ORDER BY: numeric cast for currency/score columns (select from filtered = no "r." prefix).
  -- Whitelist p_sort_field to avoid SQL injection.
  v_order_clause := CASE
    WHEN p_sort_field IN ('current_assets', 'turnover', 'working_capital', 'debtors', 'gross_profit', 'net_assets', 'net_profit_loss', 'operating_profit', 'profit_before_tax', 'cash_at_bank', 'total_assets', 'share_capital', 'creditors_due_within_one_year', 'fixed_assets') THEN
      '(NULLIF(REGEXP_REPLACE(TRIM(COALESCE(' || quote_ident(p_sort_field) || ', '''')), ''[^0-9.-]'', '''', ''g''), '''')::numeric) ' || CASE WHEN v_asc THEN 'ASC' ELSE 'DESC' END || ' NULLS LAST'
    WHEN p_sort_field IN ('financial_health_score', 'average_number_of_employees') THEN
      '(NULLIF(REGEXP_REPLACE(TRIM(COALESCE(' || quote_ident(p_sort_field) || ', '''')), ''[^0-9.-]'', '''', ''g''), '''')::numeric) ' || CASE WHEN v_asc THEN 'ASC' ELSE 'DESC' END || ' NULLS LAST'
    WHEN p_sort_field = 'dq_overall_score' THEN
      '((data_quality->>''overall_score'')::numeric) ' || CASE WHEN v_asc THEN 'ASC' ELSE 'DESC' END || ' NULLS LAST'
    WHEN p_sort_field IN ('id', 'director_name', 'company_name', 'nationality', 'company_status', 'financial_health_grade', 'registered_postcode', 'data_enrichment_last', 'company_number', 'date_of_creation') THEN
      quote_ident(p_sort_field) || ' ' || CASE WHEN v_asc THEN 'ASC' ELSE 'DESC' END || ' NULLS LAST'
    ELSE
      'id ASC NULLS LAST'
  END;

  v_sql := format(
    'WITH filtered AS (
      SELECT r.* FROM records r
      WHERE (%L = '''' OR r.director_name ILIKE ''%%'' || %L || ''%%'' OR r.company_name ILIKE ''%%'' || %L || ''%%'' OR r.registered_postcode ILIKE ''%%'' || %L || ''%%'' OR r.company_number ILIKE ''%%'' || %L || ''%%'' OR r.sic_descriptions ILIKE ''%%'' || %L || ''%%'' OR r.nationality ILIKE ''%%'' || %L || ''%%'' OR r.registered_address ILIKE ''%%'' || %L || ''%%'')
      AND (%L IS NULL OR %L = '''' OR r.nationality = %L)
      AND (%L IS NULL OR %L = '''' OR r.financial_health_grade = %L)
      AND (%L IS NULL OR %L = '''' OR r.company_status = %L)
    )
    SELECT json_build_object(
      ''totalCount'', (SELECT COUNT(*)::bigint FROM filtered),
      ''rows'', (SELECT COALESCE(json_agg(row_to_json(t)), ''[]''::json) FROM (
        SELECT * FROM filtered ORDER BY %s LIMIT %s OFFSET %s
      ) t)
    ) FROM (SELECT 1) AS dummy',
    p_search, p_search, p_search, p_search, p_search, p_search, p_search, p_search,
    p_nationality, p_nationality, p_nationality,
    p_grade, p_grade, p_grade,
    p_status, p_status, p_status,
    v_order_clause, p_page_size, v_from
  );

  EXECUTE v_sql INTO v_result;
  RETURN v_result;
END;
$$;
