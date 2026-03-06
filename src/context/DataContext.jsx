import { createContext, useContext, useState, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'

const DataContext = createContext(null)

function normalizeText(value) {
  return String(value || '').trim()
}

function parseNumericLike(value) {
  if (value == null) return Number.NEGATIVE_INFINITY
  const cleaned = String(value).replace(/[^0-9.-]/g, '')
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : Number.NEGATIVE_INFINITY
}

function sortRecordsClient(rows, sortField, sortDir) {
  if (!Array.isArray(rows) || rows.length === 0 || !sortField) return rows
  const asc = sortDir === 'asc'
  const numericFields = new Set([
    'current_assets',
    'turnover',
    'working_capital',
    'debtors',
    'gross_profit',
    'net_assets',
    'net_profit_loss',
    'operating_profit',
    'profit_before_tax',
    'cash_at_bank',
    'total_assets',
    'share_capital',
    'creditors_due_within_one_year',
    'fixed_assets',
    'financial_health_score',
    'average_number_of_employees',
  ])

  const sorted = [...rows].sort((a, b) => {
    let va
    let vb
    if (sortField === 'dq_overall_score') {
      va = parseNumericLike(a?.data_quality?.overall_score)
      vb = parseNumericLike(b?.data_quality?.overall_score)
    } else if (numericFields.has(sortField)) {
      va = parseNumericLike(a?.[sortField])
      vb = parseNumericLike(b?.[sortField])
    } else {
      va = normalizeText(a?.[sortField]).toLowerCase()
      vb = normalizeText(b?.[sortField]).toLowerCase()
    }
    if (va < vb) return asc ? -1 : 1
    if (va > vb) return asc ? 1 : -1
    return 0
  })
  return sorted
}

export function DataProvider({ children }) {
  const [records, setRecords] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [initialLoadDone, setInitialLoadDone] = useState(false)
  const [filterOptions, setFilterOptions] = useState({ nationalities: [], grades: [], statuses: [] })
  const [stats, setStats] = useState({ totalCount: 0, enrichedCount: 0, lastEnriched: null, uniqueCompanies: 0, uniqueDirectors: 0 })
  const [filtersLoaded, setFiltersLoaded] = useState(false)
  const [statsLoaded, setStatsLoaded] = useState(false)
  const [localFallbackRecords, setLocalFallbackRecords] = useState(null)

  const loadLocalFallbackRecords = useCallback(async () => {
    if (Array.isArray(localFallbackRecords)) return localFallbackRecords
    const res = await fetch('/data.json')
    if (!res.ok) throw new Error(`Failed to load data.json (${res.status})`)
    const json = await res.json()
    const arr = Array.isArray(json) ? json : []
    setLocalFallbackRecords(arr)
    return arr
  }, [localFallbackRecords])

  const loadFilters = useCallback(async () => {
    if (!supabase || filtersLoaded) return
    try {
      const { data, error } = await supabase.rpc('get_dashboard_filters')
      if (error) throw error
      setFilterOptions({
        nationalities: data?.nationalities || [],
        grades: data?.grades || [],
        statuses: data?.statuses || [],
      })
      setFiltersLoaded(true)
    } catch (e) {
      console.error('Failed to load filter options via RPC, falling back to direct query:', e)
      try {
        const { data: rows, error: qError } = await supabase
          .from('records')
          .select('nationality,financial_health_grade,company_status')
          .limit(50000)
        if (qError) throw qError

        const nationalities = [...new Set((rows || []).map(r => normalizeText(r.nationality)).filter(Boolean))].sort()
        const grades = [...new Set((rows || []).map(r => normalizeText(r.financial_health_grade).toUpperCase()).filter(g => ['A', 'B', 'C', 'D', 'F'].includes(g)))].sort()
        const statuses = [...new Set((rows || []).map(r => normalizeText(r.company_status)).filter(Boolean))].sort()

        setFilterOptions({ nationalities, grades, statuses })
        setFiltersLoaded(true)
      } catch (fallbackError) {
        console.error('Failed to load filter options (fallback):', fallbackError)
      }
    }
  }, [filtersLoaded])

  const loadStats = useCallback(async () => {
    if (!supabase || statsLoaded) return
    try {
      const { data, error } = await supabase.rpc('get_dashboard_stats')
      if (error) throw error
      setStats({
        totalCount: data?.totalCount ?? 0,
        enrichedCount: data?.enrichedCount ?? 0,
        lastEnriched: data?.lastEnriched ?? null,
        uniqueCompanies: data?.uniqueCompanies ?? 0,
        uniqueDirectors: data?.uniqueDirectors ?? 0,
      })
      setStatsLoaded(true)
    } catch (e) {
      console.error('Failed to load stats via RPC, falling back to direct query:', e)
      try {
        const { data: rows, error: qError } = await supabase
          .from('records')
          .select('id,company_number,director_name,data_enrichment_last')
          .limit(50000)
        if (qError) throw qError
        const list = rows || []
        const uniqueCompanies = new Set(list.map(r => normalizeText(r.company_number)).filter(Boolean)).size
        const uniqueDirectors = new Set(list.map(r => normalizeText(r.director_name)).filter(Boolean)).size
        const enrichedRows = list.filter(r => normalizeText(r.data_enrichment_last))
        const lastEnriched = enrichedRows
          .map(r => normalizeText(r.data_enrichment_last))
          .sort()
          .reverse()[0] || null

        setStats({
          totalCount: list.length,
          enrichedCount: enrichedRows.length,
          lastEnriched,
          uniqueCompanies,
          uniqueDirectors,
        })
        setStatsLoaded(true)
      } catch (fallbackError) {
        console.error('Failed to load stats (fallback):', fallbackError)
      }
    }
  }, [statsLoaded])

  const loadPage = useCallback(async (params) => {
    if (!supabase) return
    const {
      page = 1,
      pageSize = 10,
      search = '',
      filterNationality = '',
      filterGrade = '',
      filterStatus = '',
      sortField = null,
      sortDir = 'asc',
    } = params || {}

    setLoading(true)
    try {
      const { data, error } = await supabase.rpc('get_records_paginated', {
        p_page: page,
        p_page_size: pageSize,
        p_search: search.trim(),
        p_nationality: filterNationality || null,
        p_grade: filterGrade || null,
        p_status: filterStatus || null,
        p_sort_field: sortField || 'id',
        p_sort_dir: sortDir,
      })
      if (error) throw error
      const totalCount = data?.totalCount ?? 0
      const rows = Array.isArray(data?.rows) ? data.rows : []
      setRecords(rows)
      setTotalCount(totalCount)
      if (!initialLoadDone) setInitialLoadDone(true)
    } catch (e) {
      console.error('Failed to load records via RPC, falling back to direct query:', e)
      try {
        let query = supabase
          .from('records')
          .select('*', { count: 'exact' })

        const q = search.trim()
        if (q) {
          const escaped = q.replace(/[%]/g, '')
          query = query.or([
            `director_name.ilike.%${escaped}%`,
            `company_name.ilike.%${escaped}%`,
            `registered_postcode.ilike.%${escaped}%`,
            `company_number.ilike.%${escaped}%`,
            `sic_descriptions.ilike.%${escaped}%`,
            `nationality.ilike.%${escaped}%`,
            `registered_address.ilike.%${escaped}%`,
          ].join(','))
        }

        if (filterNationality) query = query.eq('nationality', filterNationality)
        if (filterGrade) query = query.eq('financial_health_grade', filterGrade)
        if (filterStatus) query = query.eq('company_status', filterStatus)

        const sortableDirectFields = new Set([
          'id',
          'director_name',
          'company_name',
          'nationality',
          'company_status',
          'financial_health_grade',
          'registered_postcode',
          'data_enrichment_last',
          'company_number',
          'date_of_creation',
          'current_assets',
          'turnover',
          'working_capital',
          'debtors',
          'gross_profit',
          'net_assets',
          'net_profit_loss',
          'operating_profit',
          'profit_before_tax',
          'cash_at_bank',
          'total_assets',
          'share_capital',
          'creditors_due_within_one_year',
          'fixed_assets',
          'financial_health_score',
          'average_number_of_employees',
        ])

        const effectiveSortField = sortableDirectFields.has(sortField) ? sortField : 'id'
        query = query.order(effectiveSortField, { ascending: sortDir === 'asc', nullsFirst: false })

        const from = (page - 1) * pageSize
        const to = from + pageSize - 1
        const { data: pageRows, error: qError, count } = await query.range(from, to)
        if (qError) throw qError

        const sortedRows = sortField === 'dq_overall_score'
          ? sortRecordsClient(pageRows || [], sortField, sortDir)
          : (pageRows || [])

        setRecords(sortedRows)
        setTotalCount(count ?? 0)
      } catch (fallbackError) {
        console.error('Failed to load records (fallback):', fallbackError)
        try {
          const all = await loadLocalFallbackRecords()
          const q = search.trim().toLowerCase()
          let filtered = all
          if (q) {
            filtered = filtered.filter(r =>
              normalizeText(r.director_name).toLowerCase().includes(q) ||
              normalizeText(r.company_name).toLowerCase().includes(q) ||
              normalizeText(r.registered_postcode).toLowerCase().includes(q) ||
              normalizeText(r.company_number).toLowerCase().includes(q) ||
              normalizeText(r.sic_descriptions).toLowerCase().includes(q) ||
              normalizeText(r.nationality).toLowerCase().includes(q) ||
              normalizeText(r.registered_address).toLowerCase().includes(q)
            )
          }
          if (filterNationality) filtered = filtered.filter(r => r.nationality === filterNationality)
          if (filterGrade) filtered = filtered.filter(r => normalizeText(r.financial_health_grade).toUpperCase() === filterGrade)
          if (filterStatus) filtered = filtered.filter(r => r.company_status === filterStatus)

          const sorted = sortRecordsClient(filtered, sortField || 'id', sortDir)
          const from = (page - 1) * pageSize
          const to = from + pageSize
          setTotalCount(sorted.length)
          setRecords(sorted.slice(from, to))
        } catch (localError) {
          console.error('Failed to load records (local data fallback):', localError)
          setRecords([])
          setTotalCount(0)
        }
      }
    } finally {
      // Avoid permanent first-load spinner when the first request fails.
      setInitialLoadDone(true)
      setLoading(false)
    }
  }, [loadLocalFallbackRecords])

  const getRecordById = useCallback(async (id) => {
    if (!supabase) return null
    const { data, error } = await supabase.from('records').select('*').eq('id', Number(id)).single()
    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data
  }, [])

  const getRandomRecordId = useCallback(async () => {
    if (!supabase) return null
    const { data, error } = await supabase.rpc('get_random_record_id')
    if (error) throw error
    return data
  }, [])

  const value = useMemo(() => ({
    records,
    totalCount,
    loading,
    initialLoadDone,
    filterOptions,
    stats,
    loadPage,
    loadFilters,
    loadStats,
    getRecordById,
    getRandomRecordId,
    filtersLoaded,
    statsLoaded,
  }), [records, totalCount, loading, initialLoadDone, filterOptions, stats, loadPage, loadFilters, loadStats, getRecordById, getRandomRecordId, filtersLoaded, statsLoaded])

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}

/** Use when component can run with or without DataProvider (e.g. static vs Supabase). Returns null when not in provider. */
export function useDataOptional() {
  return useContext(DataContext)
}
