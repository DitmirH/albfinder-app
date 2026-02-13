import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, LogOut, Dice5, Building2, Users, TrendingUp,
  ChevronLeft, ChevronRight, X, ExternalLink, Filter,
  ArrowUpDown, ArrowUp, ArrowDown, LayoutGrid, List, Clock
} from 'lucide-react'
import StatsCards from './StatsCards'

const PAGE_SIZE_OPTIONS = [10, 25, 50]

export default function Dashboard({ data, loading, onLogout }) {
  const navigate = useNavigate()
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

  // Unique values for filters
  const nationalities = useMemo(() => {
    const set = new Set(data.map(r => r.nationality).filter(Boolean))
    return [...set].sort()
  }, [data])

  const grades = useMemo(() => {
    const set = new Set(data.map(r => r.financial_health_grade).filter(Boolean))
    return [...set].sort()
  }, [data])

  const statuses = useMemo(() => {
    const set = new Set(data.map(r => r.company_status).filter(Boolean))
    return [...set].sort()
  }, [data])

  // Find the most recent enrichment date across all records
  const lastEnriched = useMemo(() => {
    const dates = data.map(r => r.data_enrichment_last).filter(Boolean)
    if (dates.length === 0) return null
    return dates.sort().reverse()[0]
  }, [data])

  const enrichedCount = useMemo(() => {
    return data.filter(r => r.data_enrichment_last).length
  }, [data])

  // Filtered + searched data
  const filtered = useMemo(() => {
    let result = data

    if (search.trim()) {
      const q = search.toLowerCase().trim()
      result = result.filter(r =>
        (r.director_name && r.director_name.toLowerCase().includes(q)) ||
        (r.company_name && r.company_name.toLowerCase().includes(q)) ||
        (r.registered_postcode && r.registered_postcode.toLowerCase().includes(q)) ||
        (r.company_number && r.company_number.includes(q)) ||
        (r.sic_descriptions && r.sic_descriptions.toLowerCase().includes(q)) ||
        (r.nationality && r.nationality.toLowerCase().includes(q)) ||
        (r.registered_address && r.registered_address.toLowerCase().includes(q))
      )
    }

    if (filterNationality) {
      result = result.filter(r => r.nationality === filterNationality)
    }
    if (filterGrade) {
      result = result.filter(r => r.financial_health_grade === filterGrade)
    }
    if (filterStatus) {
      result = result.filter(r => r.company_status === filterStatus)
    }

    // Sorting
    if (sortField) {
      result = [...result].sort((a, b) => {
        let valA = a[sortField] || ''
        let valB = b[sortField] || ''

        // Numeric sort for score and employees
        if (sortField === 'financial_health_score' || sortField === 'average_number_of_employees') {
          valA = parseFloat(valA) || 0
          valB = parseFloat(valB) || 0
        } else {
          valA = valA.toString().toLowerCase()
          valB = valB.toString().toLowerCase()
        }

        if (valA < valB) return sortDir === 'asc' ? -1 : 1
        if (valA > valB) return sortDir === 'asc' ? 1 : -1
        return 0
      })
    }

    return result
  }, [data, search, filterNationality, filterGrade, filterStatus, sortField, sortDir])

  // Pagination
  const totalPages = Math.ceil(filtered.length / pageSize)
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize)

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

  const handleRandom = () => {
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
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
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
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
                onClick={onLogout}
                className="inline-flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all text-sm"
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
        <StatsCards data={data} />

        {/* Search & Filters Bar */}
        <div className="mt-6 bg-white rounded-xl border border-slate-200 shadow-sm">
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

                <div className="hidden sm:flex items-center border border-slate-200 rounded-lg overflow-hidden">
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
          <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-sm text-slate-500 rounded-b-xl">
            <div className="flex items-center gap-4">
              <span>
                Showing <strong className="text-slate-700">{((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, filtered.length)}</strong> of <strong className="text-slate-700">{filtered.length}</strong> records
              </span>
              {lastEnriched && (
                <span className="hidden md:inline-flex items-center gap-1.5 text-xs text-slate-400 border-l border-slate-200 pl-4">
                  <Clock className="w-3.5 h-3.5" />
                  Last updated: <strong className="text-slate-500">{lastEnriched}</strong>
                  <span className="text-slate-300">·</span>
                  {enrichedCount}/{data.length} updated
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline">Per page:</span>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1) }}
                className="px-2 py-1 bg-white border border-slate-200 rounded text-sm"
              >
                {PAGE_SIZE_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Data Display */}
        {view === 'table' ? (
          /* Table View */
          <div className="mt-4 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
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
                    <th className="text-center px-4 py-3 font-semibold text-slate-600 hidden lg:table-cell">
                      <button onClick={() => handleSort('financial_health_grade')} className="inline-flex items-center gap-1 hover:text-slate-900">
                        Grade <SortIcon field="financial_health_grade" />
                      </button>
                    </th>
                    <th className="text-center px-4 py-3 font-semibold text-slate-600 hidden xl:table-cell">
                      <button onClick={() => handleSort('financial_health_score')} className="inline-flex items-center gap-1 hover:text-slate-900">
                        Score <SortIcon field="financial_health_score" />
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
                      className="hover:bg-indigo-50/50 cursor-pointer transition-colors"
                      style={{ animationDelay: `${i * 20}ms` }}
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{record.director_name}</div>
                        <div className="text-xs text-slate-500 lg:hidden">{record.nationality}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-slate-700 max-w-xs truncate">{record.company_name}</div>
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
                        {record.financial_health_grade ? (
                          <span className={`inline-flex w-8 h-8 items-center justify-center rounded-lg text-xs font-bold ${gradeColor(record.financial_health_grade)}`}>
                            {record.financial_health_grade}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden xl:table-cell text-center">
                        {record.financial_health_score ? (
                          <span className="font-semibold text-slate-700">{record.financial_health_score}</span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden 2xl:table-cell text-center">
                        {record.data_enrichment_last ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-xs font-medium">
                            <Clock className="w-3 h-3" /> {record.data_enrichment_last}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
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
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {paged.map((record) => (
              <div
                key={record.id}
                onClick={() => navigate(`/director/${record.id}`)}
                className="bg-white rounded-xl border border-slate-200 p-5 hover:border-indigo-300 hover:shadow-md cursor-pointer transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-slate-900 group-hover:text-indigo-700 transition-colors">{record.director_name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{record.nationality}</p>
                  </div>
                  {record.financial_health_grade && (
                    <span className={`inline-flex w-8 h-8 items-center justify-center rounded-lg text-xs font-bold ${gradeColor(record.financial_health_grade)}`}>
                      {record.financial_health_grade}
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-700 font-medium truncate">{record.company_name}</p>
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
                {record.financial_health_score && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-500">Health Score</span>
                      <span className="font-semibold text-slate-700">{record.financial_health_score}/100</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          parseInt(record.financial_health_score) >= 70 ? 'bg-emerald-500' :
                          parseInt(record.financial_health_score) >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${record.financial_health_score}%` }}
                      />
                    </div>
                  </div>
                )}
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex gap-2">
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
                  </div>
                  {record.data_enrichment_last && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-slate-400">
                      <Clock className="w-3 h-3" /> {record.data_enrichment_last}
                    </span>
                  )}
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
              className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
                        : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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

