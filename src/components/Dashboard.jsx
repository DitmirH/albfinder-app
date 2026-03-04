import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, LogOut, Dice5, Building2, Users, TrendingUp,
  ChevronLeft, ChevronRight, X, ExternalLink, Filter,
  ArrowUpDown, ArrowUp, ArrowDown, LayoutGrid, List, Clock,
  Star, ShieldCheck, Sun, Moon, BadgePoundSterling, Wallet, Landmark
} from 'lucide-react'
import StatsCards from './StatsCards'
import { useDataOptional } from '../context/DataContext'

function useDebounce(value, delay = 350) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

const PAGE_SIZE_OPTIONS = [10, 25, 50]
const DEFAULT_ENRICHMENT_DATE = '04-03-2026'
const VALID_GRADES = ['A', 'B', 'C', 'D', 'F']

/** Format date to dd-mm-yyyy; return default if empty */
function formatEnrichmentDate(date) {
  if (!date || !String(date).trim()) return DEFAULT_ENRICHMENT_DATE
  const s = String(date).trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split('-')
    return `${d}-${m}-${y}`
  }
  if (/^\d{2}-\d{2}-\d{4}$/.test(s)) return s
  return s
}

/** Parse a financial value (string or number) to number for aggregation */
function parseFinancial(val) {
  if (val == null) return null
  if (typeof val === 'number' && !isNaN(val)) return val
  const s = String(val).replace(/[£,\s]/g, '')
  const n = parseFloat(s)
  return isNaN(n) ? null : n
}

function fmtCurrency(val) {
  if (val == null || isNaN(val)) return '—'
  const abs = Math.abs(val)
  const formatted = abs >= 1000 ? `£${abs.toLocaleString('en-GB')}` : `£${abs}`
  return val < 0 ? `-${formatted}` : formatted
}

export default function Dashboard({ data: staticData, loading: staticLoading, useSupabase, onLogout, darkMode, toggleDarkMode }) {
  const navigate = useNavigate()
  const dataContext = useDataOptional()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [sortField, setSortField] = useState(null)
  const [sortDir, setSortDir] = useState('asc')
  const [filterNationality, setFilterNationality] = useState('')
  const [filterGrade, setFilterGrade] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [view, setView] = useState('table') // 'table' or 'grid'

  // Reset page to 1 when search/filters change
  useEffect(() => { setPage(1) }, [search, filterNationality, filterGrade, filterStatus])

  const debouncedSearch = useDebounce(search, 400)
  const data = useSupabase ? (dataContext?.records ?? []) : staticData
  const isInitialLoad = useSupabase ? !dataContext?.initialLoadDone : staticLoading
  const loading = useSupabase ? (dataContext?.loading ?? true) : staticLoading

  // Load Supabase filters/stats once
  useEffect(() => {
    if (!useSupabase || !dataContext?.loadFilters) return
    dataContext.loadFilters()
    dataContext.loadStats()
  }, [useSupabase, dataContext?.loadFilters, dataContext?.loadStats])

  // Load Supabase page when params change (search is debounced)
  useEffect(() => {
    if (!useSupabase || !dataContext?.loadPage) return
    dataContext.loadPage({
      page,
      pageSize,
      search: debouncedSearch,
      filterNationality,
      filterGrade,
      filterStatus,
      sortField,
      sortDir,
    })
  }, [useSupabase, dataContext?.loadPage, page, pageSize, debouncedSearch, filterNationality, filterGrade, filterStatus, sortField, sortDir])

  // Unique values for filters (static: from data; Supabase: from context)
  const nationalities = useMemo(() => {
    if (useSupabase && dataContext?.filterOptions?.nationalities?.length) return dataContext.filterOptions.nationalities
    const set = new Set((staticData || []).map(r => r.nationality).filter(Boolean))
    return [...set].sort()
  }, [useSupabase, dataContext?.filterOptions?.nationalities, staticData])

  const grades = useMemo(() => {
    if (useSupabase && dataContext?.filterOptions?.grades?.length) return dataContext.filterOptions.grades
    const set = new Set(
      (staticData || []).map(r => String(r.financial_health_grade || '').trim().toUpperCase())
        .filter(g => VALID_GRADES.includes(g))
    )
    return [...set].sort()
  }, [useSupabase, dataContext?.filterOptions?.grades, staticData])

  const statuses = useMemo(() => {
    if (useSupabase && dataContext?.filterOptions?.statuses?.length) return dataContext.filterOptions.statuses
    const set = new Set((staticData || []).map(r => r.company_status).filter(Boolean))
    return [...set].sort()
  }, [useSupabase, dataContext?.filterOptions?.statuses, staticData])

  // Find the most recent enrichment date (static) or from Supabase stats
  const lastEnriched = useMemo(() => {
    if (useSupabase && dataContext?.stats?.lastEnriched) return dataContext.stats.lastEnriched
    const dates = (staticData || []).map(r => r.data_enrichment_last).filter(Boolean)
    if (dates.length === 0) return null
    return dates.sort().reverse()[0]
  }, [useSupabase, dataContext?.stats?.lastEnriched, staticData])

  const enrichedCount = useMemo(() => {
    if (useSupabase && dataContext?.stats?.enrichedCount != null) return dataContext.stats.enrichedCount
    return (staticData || []).filter(r => r.data_enrichment_last).length
  }, [useSupabase, dataContext?.stats?.enrichedCount, staticData])

  // Overall financial totals (static only; Supabase mode skips this section)
  const financialTotals = useMemo(() => {
    const emptyAgg = {
      turnover: { total: 0, count: 0 },
      grossProfit: { total: 0, count: 0 },
      currentAssets: { total: 0, count: 0 },
      workingCapital: { total: 0, count: 0 },
      debtors: { total: 0, count: 0 },
      employees: { total: 0, count: 0 },
    }
    if (useSupabase) return { agg: emptyAgg, gradeDist: { A: 0, B: 0, C: 0, D: 0, F: 0 }, totalGraded: 0 }
    const d = staticData || []
    const agg = {
      turnover: { total: 0, count: 0 },
      grossProfit: { total: 0, count: 0 },
      currentAssets: { total: 0, count: 0 },
      workingCapital: { total: 0, count: 0 },
      debtors: { total: 0, count: 0 },
      employees: { total: 0, count: 0 },
    }
    const gradeDist = { A: 0, B: 0, C: 0, D: 0, F: 0 }
    d.forEach(r => {
      const map = [
        ['turnover', r.turnover],
        ['grossProfit', r.gross_profit],
        ['currentAssets', r.current_assets],
        ['workingCapital', r.working_capital],
        ['debtors', r.debtors],
      ]
      map.forEach(([key, val]) => {
        const n = parseFinancial(val)
        if (n != null) { agg[key].total += n; agg[key].count++ }
      })
      const emp = r.average_number_of_employees != null ? parseInt(r.average_number_of_employees) : NaN
      if (!isNaN(emp)) { agg.employees.total += emp; agg.employees.count++ }
      const g = String(r.financial_health_grade || '').trim().toUpperCase()
      if (gradeDist[g] !== undefined) gradeDist[g]++
    })
    return { agg, gradeDist, totalGraded: Object.values(gradeDist).reduce((a, b) => a + b, 0) }
  }, [useSupabase, staticData])

  // Filtered + searched data (static: client-side; Supabase: already the current page)
  const filtered = useMemo(() => {
    if (useSupabase) return data
    let result = staticData || []
    if (search.trim()) {
      const q = search.toLowerCase().trim()
      result = result.filter(r =>
        (r.director_name && r.director_name.toLowerCase().includes(q)) ||
        (r.company_name && r.company_name.toLowerCase().includes(q)) ||
        (r.registered_postcode && r.registered_postcode.toLowerCase().includes(q)) ||
        (r.company_number && r.company_number.includes(q)) ||
        (r.sic_descriptions && r.sic_descriptions.toLowerCase().includes(q)) ||
        (r.nationality && r.nationality.toLowerCase().includes(q)) ||
        (r.registered_address && r.registered_address.toLowerCase().includes(q)) ||
        (r.google_kp?.name && r.google_kp.name.toLowerCase().includes(q)) ||
        (r.google_kp?.category && r.google_kp.category.toLowerCase().includes(q))
      )
    }
    if (filterNationality) result = result.filter(r => r.nationality === filterNationality)
    if (filterGrade) result = result.filter(r => String(r.financial_health_grade || '').trim().toUpperCase() === filterGrade)
    if (filterStatus) result = result.filter(r => r.company_status === filterStatus)
    if (sortField) {
      const NUMERIC_SORT_FIELDS = ['financial_health_score', 'average_number_of_employees', 'dq_overall_score']
      const CURRENCY_SORT_FIELDS = ['current_assets', 'turnover', 'working_capital', 'debtors']
      result = [...result].sort((a, b) => {
        let valA = sortField === 'dq_overall_score' ? parseFloat(a.data_quality?.overall_score) || 0 : a[sortField] || ''
        let valB = sortField === 'dq_overall_score' ? parseFloat(b.data_quality?.overall_score) || 0 : b[sortField] || ''
        if (CURRENCY_SORT_FIELDS.includes(sortField)) { valA = parseFinancial(valA) ?? 0; valB = parseFinancial(valB) ?? 0 }
        else if (NUMERIC_SORT_FIELDS.includes(sortField)) { valA = parseFloat(valA) || 0; valB = parseFloat(valB) || 0 }
        else { valA = valA.toString().toLowerCase(); valB = valB.toString().toLowerCase() }
        if (valA < valB) return sortDir === 'asc' ? -1 : 1
        if (valA > valB) return sortDir === 'asc' ? 1 : -1
        return 0
      })
    }
    return result
  }, [useSupabase, data, staticData, search, filterNationality, filterGrade, filterStatus, sortField, sortDir])

  const totalCount = useSupabase ? (dataContext?.totalCount ?? 0) : (staticData?.length ?? 0)
  const totalPages = useSupabase ? Math.ceil(totalCount / pageSize) : Math.ceil(filtered.length / pageSize)
  const paged = useSupabase ? data : filtered.slice((page - 1) * pageSize, page * pageSize)

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
    return sortDir === 'asc'
      ? <ArrowUp className="w-3.5 h-3.5 text-indigo-500" />
      : <ArrowDown className="w-3.5 h-3.5 text-indigo-500" />
  }

  const handleRandom = async () => {
    if (useSupabase && dataContext?.getRandomRecordId) {
      try {
        const id = await dataContext.getRandomRecordId()
        if (id != null) navigate(`/director/${id}`)
      } catch (e) {
        console.error('Random record:', e)
      }
      return
    }
    if (data.length === 0) return
    const randomRecord = data[Math.floor(Math.random() * data.length)]
    navigate(`/director/${randomRecord.id}`)
  }

  const clearFilters = () => {
    setSearch('')
    setFilterNationality('')
    setFilterGrade('')
    setFilterStatus('')
    setPage(1)
  }

  const hasActiveFilters = search || filterNationality || filterGrade || filterStatus

  const gradeColor = (grade) => {
    const colors = {
      'A': 'bg-emerald-100 text-emerald-700 border border-emerald-200',
      'B': 'bg-blue-100 text-blue-700 border border-blue-200',
      'C': 'bg-yellow-100 text-yellow-700 border border-yellow-200',
      'D': 'bg-orange-100 text-orange-700 border border-orange-200',
      'F': 'bg-red-100 text-red-700 border border-red-200',
    }
    return colors[grade] || 'bg-slate-100 text-slate-600'
  }

  if (isInitialLoad) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg mb-4 animate-pulse">
            <span className="text-2xl font-extrabold text-slate-900">AF</span>
          </div>
          <p className="text-slate-500 animate-pulse">Loading data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-30">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-sm">
                <span className="text-sm font-extrabold text-slate-900">AF</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900 leading-tight">AlbFinder</h1>
                <p className="text-xs text-slate-500 -mt-0.5 hidden sm:block">Company Director Intelligence</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleRandom}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-900 font-semibold text-sm rounded-lg transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
              >
                <Dice5 className="w-4 h-4" />
                <span className="hidden sm:inline">Random Record</span>
              </button>

              <button
                onClick={toggleDarkMode}
                className="p-2 text-slate-500 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-lg transition-all"
                title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              <button
                onClick={onLogout}
                className="inline-flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all text-sm"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats */}
        <StatsCards data={data} stats={useSupabase ? dataContext?.stats : undefined} />

        {/* Overall financial overview (Albanian business totals) */}
        {(financialTotals.agg.turnover.count > 0 || financialTotals.agg.currentAssets.count > 0 || financialTotals.totalGraded > 0) && (
          <div className="mt-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Landmark className="w-4 h-4 text-indigo-500" /> Overall financial overview (Albanian business)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {financialTotals.agg.turnover.count > 0 && (
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-100 dark:border-slate-700">
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <BadgePoundSterling className="w-3.5 h-3.5" /> Total turnover
                  </div>
                  <div className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">{fmtCurrency(financialTotals.agg.turnover.total)}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{financialTotals.agg.turnover.count.toLocaleString()} companies</div>
                </div>
              )}
              {financialTotals.agg.currentAssets.count > 0 && (
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-100 dark:border-slate-700">
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Wallet className="w-3.5 h-3.5" /> Total current assets
                  </div>
                  <div className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">{fmtCurrency(financialTotals.agg.currentAssets.total)}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{financialTotals.agg.currentAssets.count.toLocaleString()} companies</div>
                </div>
              )}
              {financialTotals.agg.workingCapital.count > 0 && (
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-100 dark:border-slate-700">
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5" /> Total working capital
                  </div>
                  <div className={`text-xl font-bold mt-1 ${financialTotals.agg.workingCapital.total >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                    {fmtCurrency(financialTotals.agg.workingCapital.total)}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">{financialTotals.agg.workingCapital.count.toLocaleString()} companies</div>
                </div>
              )}
              {financialTotals.agg.debtors.count > 0 && (
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-100 dark:border-slate-700">
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" /> Total debtors
                  </div>
                  <div className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">{fmtCurrency(financialTotals.agg.debtors.total)}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{financialTotals.agg.debtors.count.toLocaleString()} companies</div>
                </div>
              )}
              {financialTotals.agg.employees.count > 0 && (
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-100 dark:border-slate-700">
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" /> Total employees
                  </div>
                  <div className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">{financialTotals.agg.employees.total.toLocaleString()}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{financialTotals.agg.employees.count.toLocaleString()} companies reporting</div>
                </div>
              )}
              {financialTotals.totalGraded > 0 && (
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-100 dark:border-slate-700 col-span-2 md:col-span-1">
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Health grades</div>
                  <div className="flex items-center gap-1.5">
                    {['A', 'B', 'C', 'D', 'F'].map(g => (
                      <div key={g} className="text-center flex-1">
                        <span className={`inline-flex w-7 h-7 items-center justify-center rounded text-xs font-bold ${gradeColor(g)}`}>
                          {g}
                        </span>
                        <div className="text-[10px] text-slate-500 mt-1">{financialTotals.gradeDist[g].toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                  <div className="text-xs text-slate-400 mt-1.5">{financialTotals.totalGraded.toLocaleString()} graded</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Search & Filters Bar */}
        <div className="mt-6 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                  placeholder="Search by director, company, postcode, SIC code..."
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
                />
                {search && (
                  <button onClick={() => { setSearch(''); setPage(1) }} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 border rounded-lg text-sm font-medium transition-all ${
                    showFilters || hasActiveFilters
                      ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  Filters
                  {hasActiveFilters && (
                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                  )}
                </button>

                <div className="hidden sm:flex items-center border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setView('table')}
                    className={`p-2.5 transition-colors ${view === 'table' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setView('grid')}
                    className={`p-2.5 transition-colors ${view === 'grid' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Filter dropdowns */}
            {showFilters && (
              <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-3 animate-fade-in">
                <select
                  value={filterNationality}
                  onChange={(e) => { setFilterNationality(e.target.value); setPage(1) }}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="">All Nationalities</option>
                  {nationalities.map(n => <option key={n} value={n}>{n}</option>)}
                </select>

                <select
                  value={filterGrade}
                  onChange={(e) => { setFilterGrade(e.target.value); setPage(1) }}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="">All Grades</option>
                  {grades.map(g => <option key={g} value={g}>Grade {g}</option>)}
                </select>

                <select
                  value={filterStatus}
                  onChange={(e) => { setFilterStatus(e.target.value); setPage(1) }}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="">All Statuses</option>
                  {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>

                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Clear all
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Results info bar */}
          <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-sm text-slate-500 rounded-b-xl">
            <div className="flex items-center gap-4">
              <span>
                Showing <strong className="text-slate-700">{((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, useSupabase ? totalCount : filtered.length)}</strong> of <strong className="text-slate-700">{useSupabase ? totalCount : filtered.length}</strong> records
              </span>
              <span className="hidden md:inline-flex items-center gap-1.5 text-xs text-slate-400 border-l border-slate-200 dark:border-slate-600 pl-4">
                <Clock className="w-3.5 h-3.5" />
                Last updated: <strong className="text-slate-500 dark:text-slate-300">{formatEnrichmentDate(lastEnriched || '')}</strong>
                <span className="text-slate-300">·</span>
                {enrichedCount}/{useSupabase ? totalCount : data.length} updated
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline">Per page:</span>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1) }}
                className="px-2 py-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-sm"
              >
                {PAGE_SIZE_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Data Display */}
        {view === 'table' ? (
          /* Table View */
          <div className="mt-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden relative">
            {loading && !isInitialLoad && (
              <div className="absolute inset-0 bg-white/60 dark:bg-slate-800/60 z-10 flex items-center justify-center backdrop-blur-[1px]">
                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">
                      <button onClick={() => handleSort('director_name')} className="inline-flex items-center gap-1 hover:text-slate-900">
                        Director <SortIcon field="director_name" />
                      </button>
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600">
                      <button onClick={() => handleSort('company_name')} className="inline-flex items-center gap-1 hover:text-slate-900">
                        Company <SortIcon field="company_name" />
                      </button>
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600 hidden lg:table-cell">
                      <button onClick={() => handleSort('nationality')} className="inline-flex items-center gap-1 hover:text-slate-900">
                        Nationality <SortIcon field="nationality" />
                      </button>
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600 hidden md:table-cell">Status</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600 hidden xl:table-cell">Postcode</th>
                    <th className="text-center px-4 py-3 font-semibold text-slate-600 hidden lg:table-cell" title="Financial health grade A (best) to F (worst)">
                      <button onClick={() => handleSort('financial_health_grade')} className="inline-flex items-center gap-1 hover:text-slate-900">
                        Grade (A–F) <SortIcon field="financial_health_grade" />
                      </button>
                    </th>
                    <th className="text-center px-4 py-3 font-semibold text-slate-600 hidden xl:table-cell" title="Financial health score 0–100">
                      <button onClick={() => handleSort('financial_health_score')} className="inline-flex items-center gap-1 hover:text-slate-900">
                        Score (0–100) <SortIcon field="financial_health_score" />
                      </button>
                    </th>
                    <th className="text-right px-4 py-3 font-semibold text-slate-600 hidden xl:table-cell" title="Current Assets (Liquidity)">
                      <button onClick={() => handleSort('current_assets')} className="inline-flex items-center gap-1 hover:text-slate-900">
                        Current Assets <SortIcon field="current_assets" />
                      </button>
                    </th>
                    <th className="text-center px-4 py-3 font-semibold text-slate-600 hidden xl:table-cell">
                      <button onClick={() => handleSort('dq_overall_score')} className="inline-flex items-center gap-1 hover:text-slate-900">
                        DQ <SortIcon field="dq_overall_score" />
                      </button>
                    </th>
                    <th className="text-center px-4 py-3 font-semibold text-slate-600 hidden 2xl:table-cell">
                      <button onClick={() => handleSort('data_enrichment_last')} className="inline-flex items-center gap-1 hover:text-slate-900">
                        Last Updated <SortIcon field="data_enrichment_last" />
                      </button>
                    </th>
                    <th className="text-center px-4 py-3 font-semibold text-slate-600">Links</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paged.map((record, i) => (
                    <tr
                      key={record.id}
                      onClick={() => navigate(`/director/${record.id}`)}
                      className="hover:bg-indigo-50/50 dark:hover:bg-indigo-500/10 cursor-pointer transition-colors"
                      style={{ animationDelay: `${i * 20}ms` }}
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{record.director_name}</div>
                        <div className="text-xs text-slate-500 lg:hidden">{record.nationality}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-slate-700 max-w-xs truncate flex items-center gap-1.5">
                          {record.company_name}
                          {record.google_kp && (
                            <span title={`Google: ${record.google_kp.name} — ${record.google_kp.category || ''}`} className="flex-shrink-0">
                              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400">{record.company_type?.toUpperCase()} · #{record.company_number}</div>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-slate-600">{record.nationality}</span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          record.company_status === 'active'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {record.company_status}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden xl:table-cell text-slate-600">{record.registered_postcode}</td>
                      <td className="px-4 py-3 hidden lg:table-cell text-center">
                        {record.financial_health_grade && VALID_GRADES.includes(String(record.financial_health_grade).trim().toUpperCase()) ? (
                          <span className={`inline-flex w-8 h-8 items-center justify-center rounded-lg text-xs font-bold ${gradeColor(String(record.financial_health_grade).trim().toUpperCase())}`}>
                            {String(record.financial_health_grade).trim().toUpperCase()}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden xl:table-cell text-center">
                        {(() => {
                          const raw = record.financial_health_score
                          const num = raw != null ? parseFloat(String(raw).replace(/[£,\s]/g, '')) : NaN
                          if (isNaN(num) || num < 0 || num > 100) return <span className="text-slate-300">—</span>
                          return <span className="font-semibold text-slate-700 dark:text-slate-200">{Math.round(num)}</span>
                        })()}
                      </td>
                      <td className="px-4 py-3 hidden xl:table-cell text-right">
                        {record.current_assets ? (
                          <span className="text-slate-700 dark:text-slate-200 font-medium text-xs">{record.current_assets}</span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden xl:table-cell text-center">
                        {record.data_quality?.overall_score ? (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                            parseInt(record.data_quality.overall_score) >= 60 ? 'bg-emerald-50 text-emerald-700' :
                            parseInt(record.data_quality.overall_score) >= 40 ? 'bg-amber-50 text-amber-700' :
                            'bg-slate-100 text-slate-500'
                          }`}>
                            {record.data_quality.overall_score}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden 2xl:table-cell text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full text-xs font-medium">
                          <Clock className="w-3 h-3" /> {formatEnrichmentDate(record.data_enrichment_last || '')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {record.company_link && (
                            <a
                              href={record.company_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="View company on Companies House"
                            >
                              <Building2 className="w-4 h-4" />
                            </a>
                          )}
                          {record.officer_link && (
                            <a
                              href={record.officer_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="View officer appointments"
                            >
                              <Users className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Grid View */
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 relative">
            {loading && !isInitialLoad && (
              <div className="absolute inset-0 bg-white/60 dark:bg-slate-800/60 z-10 flex items-center justify-center backdrop-blur-[1px] rounded-xl">
                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {paged.map((record) => (
              <div
                key={record.id}
                onClick={() => navigate(`/director/${record.id}`)}
                className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:shadow-md cursor-pointer transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-slate-900 group-hover:text-indigo-700 transition-colors">{record.director_name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{record.nationality}</p>
                  </div>
                  {record.financial_health_grade && VALID_GRADES.includes(String(record.financial_health_grade).trim().toUpperCase()) && (
                    <span className={`inline-flex w-8 h-8 items-center justify-center rounded-lg text-xs font-bold ${gradeColor(String(record.financial_health_grade).trim().toUpperCase())}`}>
                      {String(record.financial_health_grade).trim().toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <p className="text-sm text-slate-700 font-medium truncate">{record.company_name}</p>
                  {record.google_kp && <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 flex-shrink-0" />}
                </div>
                {record.google_kp?.category && (
                  <p className="text-xs text-indigo-500 mt-0.5 truncate">{record.google_kp.category}</p>
                )}
                <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                  <span className={`inline-flex px-2 py-0.5 rounded-full font-medium ${
                    record.company_status === 'active'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {record.company_status}
                  </span>
                  <span>{record.company_type?.toUpperCase()}</span>
                  <span>·</span>
                  <span>{record.registered_postcode}</span>
                </div>
                {(() => {
                  const raw = record.financial_health_score
                  const num = raw != null ? parseFloat(String(raw).replace(/[£,\s]/g, '')) : NaN
                  if (isNaN(num) || num < 0 || num > 100) return null
                  const score = Math.round(num)
                  return (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-500">Health Score (0–100)</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-200">{score}/100</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            score >= 70 ? 'bg-emerald-500' : score >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                    </div>
                  )
                })()}
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex gap-2 items-center">
                    {record.company_link && (
                      <a
                        href={record.company_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800"
                      >
                        <Building2 className="w-3.5 h-3.5" /> Company
                      </a>
                    )}
                    {record.officer_link && (
                      <a
                        href={record.officer_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800"
                      >
                        <Users className="w-3.5 h-3.5" /> Officer
                      </a>
                    )}
                    {record.data_quality?.overall_score && (
                      <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                        parseInt(record.data_quality.overall_score) >= 60 ? 'bg-emerald-50 text-emerald-600' :
                        parseInt(record.data_quality.overall_score) >= 40 ? 'bg-amber-50 text-amber-600' :
                        'bg-slate-50 text-slate-400'
                      }`}>
                        <ShieldCheck className="w-2.5 h-2.5" /> {record.data_quality.overall_score}
                      </span>
                    )}
                  </div>
                  <span className="inline-flex items-center gap-1 text-[10px] text-slate-400">
                    <Clock className="w-3 h-3" /> {formatEnrichmentDate(record.data_enrichment_last || '')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
              .reduce((acc, p, i, arr) => {
                if (i > 0 && p - arr[i - 1] > 1) acc.push('...')
                acc.push(p)
                return acc
              }, [])
              .map((p, i) =>
                p === '...' ? (
                  <span key={`dots-${i}`} className="px-2 text-slate-400">...</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                      page === p
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'border border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="mt-12 text-center animate-fade-in">
            <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-600">No records found</h3>
            <p className="text-slate-400 mt-1">Try adjusting your search or filters</p>
            <button
              onClick={clearFilters}
              className="mt-4 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors"
            >
              Clear all filters
            </button>
          </div>
        )}
      </main>

    </div>
  )
}

