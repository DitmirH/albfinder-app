import { createContext, useContext, useState, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabase'

const DataContext = createContext(null)

export function DataProvider({ children }) {
  const [records, setRecords] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [initialLoadDone, setInitialLoadDone] = useState(false)
  const [filterOptions, setFilterOptions] = useState({ nationalities: [], grades: [], statuses: [] })
  const [stats, setStats] = useState({ totalCount: 0, enrichedCount: 0, lastEnriched: null, uniqueCompanies: 0, uniqueDirectors: 0 })
  const [filtersLoaded, setFiltersLoaded] = useState(false)
  const [statsLoaded, setStatsLoaded] = useState(false)

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
      console.error('Failed to load filter options:', e)
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
      console.error('Failed to load stats:', e)
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
      console.error('Failed to load records:', e)
      setRecords([])
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }, [])

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
