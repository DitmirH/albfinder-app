import { useState, useMemo, useEffect, useRef, memo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, LogOut, Shuffle, Building2, Users, 
  ChevronLeft, ChevronRight, X, ExternalLink, Filter,
  ArrowUpDown, ArrowUp, ArrowDown, LayoutGrid, List, Clock,
  Sun, Moon, TrendingUp
} from 'lucide-react'
import StatsCards from './StatsCards'
import { useDataOptional } from '../context/DataContext'
import { StatusBadge, ScoreBadge, GradeBadge, Skeleton } from './ui'

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

function sanitizeUrl(url) {
  if (!url) return null
  const trimmed = String(url).trim()
  if (/^javascript:/i.test(trimmed) || /^data:/i.test(trimmed) || /^vbscript:/i.test(trimmed)) {
    return null
  }
  return trimmed
}

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

const MobileResultCard = memo(function MobileResultCard({ record, onClick }) {
  return (
    <div 
      onClick={onClick}
      className="bg-surface border border-border-subtle rounded-card p-4 cursor-pointer transition-all duration-150 hover:shadow-card-hover hover:border-border active:scale-[0.99] touch-target"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-body font-semibold text-primary truncate">
            {record.director_name}
          </h3>
          <p className="text-body-sm text-secondary truncate mt-0.5">
            {record.company_name}
          </p>
        </div>
        <GradeBadge grade={record.financial_health_grade} />
      </div>
      
      <div className="flex items-center gap-2 flex-wrap mb-3">
        <StatusBadge status={record.company_status} />
        <span className="text-caption text-muted">{record.registered_postcode}</span>
      </div>
      
      {record.current_assets && (
        <div className="flex items-center justify-between py-2.5 border-t border-border-subtle">
          <span className="text-caption text-muted">Current Assets</span>
          <span className="text-body-sm font-semibold text-primary tabular-nums">
            {record.current_assets}
          </span>
        </div>
      )}
      
      <div className="flex items-center justify-between pt-2.5 border-t border-border-subtle">
        <span className="text-caption text-muted flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {formatEnrichmentDate(record.data_enrichment_last)}
        </span>
        {record.data_quality?.overall_score && (
          <ScoreBadge score={record.data_quality.overall_score} />
        )}
      </div>
    </div>
  )
})

const TableRow = memo(function TableRow({ record, onClick, formatDate }) {
  return (
    <tr
      onClick={onClick}
      className="hover:bg-surface-hover cursor-pointer transition-colors duration-150 border-b border-border-subtle last:border-0"
    >
      <td className="px-4 py-3.5">
        <div className="font-medium text-primary">{record.director_name}</div>
      </td>
      <td className="px-4 py-3.5">
        <div className="text-primary max-w-xs truncate">{record.company_name}</div>
        <div className="text-caption text-muted mt-0.5">
          {record.company_type?.toUpperCase()} · #{record.company_number}
        </div>
      </td>
      <td className="px-4 py-3.5 hidden md:table-cell">
        <StatusBadge status={record.company_status} />
      </td>
      <td className="px-4 py-3.5 hidden lg:table-cell text-secondary">
        {record.registered_postcode}
      </td>
      <td className="px-4 py-3.5 hidden lg:table-cell text-right">
        {record.current_assets ? (
          <span className="font-medium text-primary tabular-nums">{record.current_assets}</span>
        ) : (
          <span className="text-muted">—</span>
        )}
      </td>
      <td className="px-4 py-3.5 hidden xl:table-cell text-center">
        {record.data_quality?.overall_score ? (
          <ScoreBadge score={record.data_quality.overall_score} />
        ) : (
          <span className="text-muted">—</span>
        )}
      </td>
      <td className="px-4 py-3.5 hidden xl:table-cell text-center">
        <span className="text-caption text-muted">
          {formatDate(record.data_enrichment_last)}
        </span>
      </td>
      <td className="px-4 py-3.5 text-center">
        <div className="flex items-center justify-center gap-1">
          {sanitizeUrl(record.company_link) && (
            <a
              href={sanitizeUrl(record.company_link)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-2 text-muted hover:text-accent hover:bg-accent-soft rounded-lg transition-colors touch-target"
              title="Companies House"
            >
              <Building2 className="w-4 h-4" />
            </a>
          )}
          {sanitizeUrl(record.officer_link) && (
            <a
              href={sanitizeUrl(record.officer_link)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-2 text-muted hover:text-accent hover:bg-accent-soft rounded-lg transition-colors touch-target"
              title="Officer Record"
            >
              <Users className="w-4 h-4" />
            </a>
          )}
        </div>
      </td>
    </tr>
  )
})

export default function Dashboard({ data: staticData, loading: staticLoading, useSupabase, onLogout, darkMode, toggleDarkMode }) {
  const navigate = useNavigate()
  const dataContext = useDataOptional()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(() => {
    const saved = Number(sessionStorage.getItem('albfinder_page_size'))
    return PAGE_SIZE_OPTIONS.includes(saved) ? saved : 10
  })
  const [sortField, setSortField] = useState(null)
  const [sortDir, setSortDir] = useState('asc')
  const [filterNationality, setFilterNationality] = useState('')
  const [filterGrade, setFilterGrade] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [view, setView] = useState('table')

  useEffect(() => { setPage(1) }, [search, filterNationality, filterGrade, filterStatus])

  const debouncedSearch = useDebounce(search, 400)
  const data = useSupabase ? (dataContext?.records ?? []) : staticData
  const isInitialLoad = useSupabase ? !dataContext?.initialLoadDone : staticLoading
  const loading = useSupabase ? (dataContext?.loading ?? true) : staticLoading

  useEffect(() => {
    sessionStorage.setItem('albfinder_page_size', String(pageSize))
  }, [pageSize])

  useEffect(() => {
    if (!useSupabase || !dataContext?.loadFilters || !dataContext?.loadStats) return
    if (!dataContext.filtersLoaded) dataContext.loadFilters()
    if (!dataContext.statsLoaded) dataContext.loadStats()
  }, [useSupabase, dataContext?.loadFilters, dataContext?.loadStats, dataContext?.filtersLoaded, dataContext?.statsLoaded])

  const lastPageRequestRef = useRef('')
  useEffect(() => {
    if (!useSupabase || !dataContext?.loadPage) return
    const request = { page, pageSize, search: debouncedSearch, filterNationality, filterGrade, filterStatus, sortField, sortDir }
    const requestKey = JSON.stringify(request)
    if (requestKey === lastPageRequestRef.current) return
    lastPageRequestRef.current = requestKey
    dataContext.loadPage(request)
  }, [useSupabase, dataContext?.loadPage, page, pageSize, debouncedSearch, filterNationality, filterGrade, filterStatus, sortField, sortDir])

  const nationalities = useMemo(() => {
    if (useSupabase && dataContext?.filterOptions?.nationalities?.length) return dataContext.filterOptions.nationalities
    const set = new Set((staticData || []).map(r => r.nationality).filter(Boolean))
    return [...set].sort()
  }, [useSupabase, dataContext?.filterOptions?.nationalities, staticData])

  const grades = useMemo(() => {
    if (useSupabase && dataContext?.filterOptions?.grades?.length) return dataContext.filterOptions.grades
    const set = new Set((staticData || []).map(r => String(r.financial_health_grade || '').trim().toUpperCase()).filter(g => ['A','B','C','D','F'].includes(g)))
    return [...set].sort()
  }, [useSupabase, dataContext?.filterOptions?.grades, staticData])

  const statuses = useMemo(() => {
    if (useSupabase && dataContext?.filterOptions?.statuses?.length) return dataContext.filterOptions.statuses
    const set = new Set((staticData || []).map(r => r.company_status).filter(Boolean))
    return [...set].sort()
  }, [useSupabase, dataContext?.filterOptions?.statuses, staticData])

  const lastEnriched = useMemo(() => {
    if (useSupabase && dataContext?.stats?.lastEnriched) return dataContext.stats.lastEnriched
    const dates = (staticData || []).map(r => r.data_enrichment_last).filter(Boolean)
    return dates.length ? dates.sort().reverse()[0] : null
  }, [useSupabase, dataContext?.stats?.lastEnriched, staticData])

  const enrichedCount = useMemo(() => {
    if (useSupabase && dataContext?.stats?.enrichedCount != null) return dataContext.stats.enrichedCount
    return (staticData || []).filter(r => r.data_enrichment_last).length
  }, [useSupabase, dataContext?.stats?.enrichedCount, staticData])

  const filtered = useMemo(() => {
    if (useSupabase) return data
    let result = staticData || []
    if (search.trim()) {
      const q = search.toLowerCase().trim()
      result = result.filter(r =>
        (r.director_name?.toLowerCase().includes(q)) ||
        (r.company_name?.toLowerCase().includes(q)) ||
        (r.registered_postcode?.toLowerCase().includes(q)) ||
        (r.company_number?.includes(q))
      )
    }
    if (filterNationality) result = result.filter(r => r.nationality === filterNationality)
    if (filterGrade) result = result.filter(r => String(r.financial_health_grade || '').trim().toUpperCase() === filterGrade)
    if (filterStatus) result = result.filter(r => r.company_status === filterStatus)
    if (sortField) {
      const CURRENCY_FIELDS = ['current_assets', 'turnover', 'working_capital', 'debtors']
      result = [...result].sort((a, b) => {
        let valA = sortField === 'dq_overall_score' ? parseFloat(a.data_quality?.overall_score) || 0 : a[sortField] || ''
        let valB = sortField === 'dq_overall_score' ? parseFloat(b.data_quality?.overall_score) || 0 : b[sortField] || ''
        if (CURRENCY_FIELDS.includes(sortField)) { valA = parseFinancial(valA) ?? 0; valB = parseFinancial(valB) ?? 0 }
        else if (typeof valA === 'string') { valA = valA.toLowerCase(); valB = String(valB).toLowerCase() }
        return sortDir === 'asc' ? (valA < valB ? -1 : valA > valB ? 1 : 0) : (valA > valB ? -1 : valA < valB ? 1 : 0)
      })
    }
    return result
  }, [useSupabase, data, staticData, search, filterNationality, filterGrade, filterStatus, sortField, sortDir])

  const totalCount = useSupabase ? (dataContext?.totalCount ?? 0) : (staticData?.length ?? 0)
  const totalPages = useSupabase ? Math.ceil(totalCount / pageSize) : Math.ceil(filtered.length / pageSize)
  const paged = useSupabase ? data : filtered.slice((page - 1) * pageSize, page * pageSize)

  const handleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('asc') }
  }

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3.5 h-3.5 text-muted" />
    return sortDir === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-accent" /> : <ArrowDown className="w-3.5 h-3.5 text-accent" />
  }

  const handleRandom = async () => {
    if (useSupabase && dataContext?.getRandomRecordId) {
      try {
        const id = await dataContext.getRandomRecordId()
        if (id != null) navigate(`/director/${id}`)
      } catch (e) { console.error('Random:', e) }
      return
    }
    if (data.length) navigate(`/director/${data[Math.floor(Math.random() * data.length)].id}`)
  }

  const clearFilters = () => {
    setSearch(''); setFilterNationality(''); setFilterGrade(''); setFilterStatus(''); setPage(1)
  }

  const hasActiveFilters = search || filterNationality || filterGrade || filterStatus

  if (isInitialLoad) {
    return (
      <div className="min-h-screen bg-canvas">
        <header className="bg-surface border-b border-border-subtle sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-control bg-accent flex items-center justify-center">
                  <span className="text-sm font-bold text-white">AF</span>
                </div>
                <div>
                  <h1 className="text-body font-bold text-primary">AlbFinder</h1>
                  <p className="text-caption text-muted hidden sm:block">UK Company Directors</p>
                </div>
              </div>
              <Skeleton className="w-24 h-8 rounded-control" />
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {[1,2,3,4].map(i => (
              <div key={i} className="bg-surface border border-border-subtle rounded-card p-4">
                <Skeleton className="h-4 w-20 mb-3" />
                <Skeleton className="h-8 w-16" />
              </div>
            ))}
          </div>
          <div className="bg-surface border border-border-subtle rounded-card p-8">
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              <span className="text-body-sm text-secondary">Loading data...</span>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-canvas">
      {/* Header */}
      <header className="bg-surface border-b border-border-subtle sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-control bg-accent flex items-center justify-center">
                <span className="text-xs sm:text-sm font-bold text-white">AF</span>
              </div>
              <div>
                <h1 className="text-body font-bold text-primary leading-tight">AlbFinder</h1>
                <p className="text-caption text-muted hidden sm:block">Company Director Intelligence</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={handleRandom} className="btn-primary hidden sm:inline-flex">
                <Shuffle className="w-4 h-4" />
                <span className="hidden md:inline">Random</span>
              </button>
              <button onClick={handleRandom} className="sm:hidden p-2 bg-accent text-white rounded-control touch-target">
                <Shuffle className="w-4 h-4" />
              </button>

              <button onClick={toggleDarkMode} className="btn-ghost touch-target" title={darkMode ? 'Light mode' : 'Dark mode'}>
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              <button onClick={onLogout} className="btn-ghost text-semantic-danger hover:bg-semantic-danger-soft">
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Stats */}
        <StatsCards data={data} stats={useSupabase ? dataContext?.stats : undefined} />

        {/* Search & Filters */}
        <div className="mt-5 bg-surface border border-border-subtle rounded-card">
          <div className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search director, company, postcode..."
                  className="input-field pl-10 pr-10"
                />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary touch-target">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`btn-secondary flex-1 sm:flex-none ${showFilters || hasActiveFilters ? 'border-accent text-accent' : ''}`}
                >
                  <Filter className="w-4 h-4" />
                  <span>Filters</span>
                  {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-accent" />}
                </button>

                <div className="hidden sm:flex border border-border rounded-control overflow-hidden">
                  <button onClick={() => setView('table')} className={`p-2.5 transition-colors ${view === 'table' ? 'bg-accent-soft text-accent' : 'text-muted hover:text-primary'}`}>
                    <List className="w-4 h-4" />
                  </button>
                  <button onClick={() => setView('grid')} className={`p-2.5 transition-colors ${view === 'grid' ? 'bg-accent-soft text-accent' : 'text-muted hover:text-primary'}`}>
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {showFilters && (
              <div className="mt-3 pt-3 border-t border-border-subtle flex flex-wrap gap-2 sm:gap-3 animate-fade-in">
                <select value={filterNationality} onChange={(e) => setFilterNationality(e.target.value)} className="input-field w-full sm:w-auto">
                  <option value="">All Nationalities</option>
                  {nationalities.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                <select value={filterGrade} onChange={(e) => setFilterGrade(e.target.value)} className="input-field w-full sm:w-auto">
                  <option value="">All Grades</option>
                  {grades.map(g => <option key={g} value={g}>Grade {g}</option>)}
                </select>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="input-field w-full sm:w-auto">
                  <option value="">All Statuses</option>
                  {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="btn-ghost text-semantic-danger">Clear all</button>
                )}
              </div>
            )}
          </div>

          {/* Results info */}
          <div className="px-3 sm:px-4 py-2.5 bg-subtle border-t border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-body-sm text-secondary rounded-b-card">
            <div className="flex items-center gap-3 flex-wrap">
              <span>
                <strong className="text-primary">{((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, useSupabase ? totalCount : filtered.length)}</strong> of <strong className="text-primary">{useSupabase ? totalCount.toLocaleString() : filtered.length.toLocaleString()}</strong>
              </span>
              <span className="hidden md:inline-flex items-center gap-1.5 text-caption text-muted">
                <Clock className="w-3 h-3" />
                Updated: {formatEnrichmentDate(lastEnriched)}
                <span className="mx-1">·</span>
                {enrichedCount.toLocaleString()}/{(useSupabase ? totalCount : data.length).toLocaleString()} enriched
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-caption text-muted">Per page:</span>
              <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1) }} className="input-field py-1 px-2 w-auto">
                {PAGE_SIZE_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="mt-4 relative">
          {loading && !isInitialLoad && (
            <div className="absolute inset-0 bg-canvas/60 z-10 flex items-center justify-center backdrop-blur-[1px] rounded-card">
              <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* Mobile: Always cards */}
          <div className="sm:hidden space-y-3">
            {paged.map((record) => (
              <MobileResultCard key={record.id} record={record} onClick={() => navigate(`/director/${record.id}`)} />
            ))}
          </div>

          {/* Desktop: Table or Grid */}
          <div className="hidden sm:block">
            {view === 'table' ? (
              <div className="bg-surface border border-border-subtle rounded-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-body">
                    <thead>
                      <tr className="bg-subtle border-b border-border-subtle">
                        <th className="text-left px-4 py-3 font-semibold text-secondary">
                          <button onClick={() => handleSort('director_name')} className="inline-flex items-center gap-1 hover:text-primary">
                            Director <SortIcon field="director_name" />
                          </button>
                        </th>
                        <th className="text-left px-4 py-3 font-semibold text-secondary">
                          <button onClick={() => handleSort('company_name')} className="inline-flex items-center gap-1 hover:text-primary">
                            Company <SortIcon field="company_name" />
                          </button>
                        </th>
                        <th className="text-left px-4 py-3 font-semibold text-secondary hidden md:table-cell">Status</th>
                        <th className="text-left px-4 py-3 font-semibold text-secondary hidden lg:table-cell">Postcode</th>
                        <th className="text-right px-4 py-3 font-semibold text-secondary hidden lg:table-cell">
                          <button onClick={() => handleSort('current_assets')} className="inline-flex items-center gap-1 hover:text-primary">
                            Assets <SortIcon field="current_assets" />
                          </button>
                        </th>
                        <th className="text-center px-4 py-3 font-semibold text-secondary hidden xl:table-cell">
                          <button onClick={() => handleSort('dq_overall_score')} className="inline-flex items-center gap-1 hover:text-primary">
                            DQ <SortIcon field="dq_overall_score" />
                          </button>
                        </th>
                        <th className="text-center px-4 py-3 font-semibold text-secondary hidden xl:table-cell">Updated</th>
                        <th className="text-center px-4 py-3 font-semibold text-secondary">Links</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paged.map((record) => (
                        <TableRow 
                          key={record.id} 
                          record={record} 
                          onClick={() => navigate(`/director/${record.id}`)}
                          formatDate={formatEnrichmentDate}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {paged.map((record) => (
                  <MobileResultCard key={record.id} record={record} onClick={() => navigate(`/director/${record.id}`)} />
                ))}
              </div>
            )}
          </div>

          {/* Empty state */}
          {paged.length === 0 && !loading && (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-subtle flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-muted" />
              </div>
              <h3 className="section-title mb-1">No records found</h3>
              <p className="text-body text-secondary mb-4">Try adjusting your search or filters</p>
              <button onClick={clearFilters} className="btn-secondary">Clear all filters</button>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-secondary p-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .reduce((acc, p, i, arr) => {
                if (i > 0 && p - arr[i - 1] > 1) acc.push('...')
                acc.push(p)
                return acc
              }, [])
              .map((p, i) =>
                p === '...' ? (
                  <span key={`dots-${i}`} className="px-2 text-muted">...</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-9 h-9 rounded-control text-body-sm font-medium transition-colors ${
                      page === p ? 'bg-accent text-white' : 'btn-secondary'
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn-secondary p-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
