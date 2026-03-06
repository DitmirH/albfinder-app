import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState, useMemo, useRef, memo } from 'react'
import { useDataOptional } from '../context/DataContext'
import {
  ArrowLeft, ExternalLink, Building2, Users, MapPin, Calendar,
  CreditCard, Hash, Briefcase, Globe, FileText, Mail, Phone,
  Link as LinkIcon, CheckCircle, XCircle, MessageSquare,
  Shield, TrendingUp, TrendingDown, Clock, AlertTriangle,
  ChevronDown, ChevronUp, BarChart3,
  CircleHelp, Wallet, PiggyBank, Landmark,
  BadgePoundSterling, CircleDollarSign, Star, 
  ShieldCheck, Gauge, Sun, Moon
} from 'lucide-react'
import { StatusBadge, ScoreBadge, GradeBadge, Skeleton } from './ui'

const gradeInfo = {
  'A': { label: 'Excellent', color: 'semantic-success' },
  'B': { label: 'Good', color: 'semantic-info' },
  'C': { label: 'Fair', color: 'semantic-warning' },
  'D': { label: 'Poor', color: 'orange' },
  'F': { label: 'Failing', color: 'semantic-danger' },
}

const FacebookIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
)
const InstagramIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
  </svg>
)
const TwitterIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
)
const LinkedinIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
)
const TiktokIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
  </svg>
)
const GoogleIcon = (props) => (
  <svg viewBox="0 0 24 24" {...props}>
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
)

const DEFAULT_ENRICHMENT_DATE = '04-03-2026'
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

function fmtCurrency(val) {
  if (val === null || val === undefined) return null
  if (typeof val === 'number') {
    const neg = val < 0
    const abs = Math.abs(val)
    const formatted = abs >= 1000 ? `£${abs.toLocaleString('en-GB')}` : `£${abs}`
    return neg ? `-${formatted}` : formatted
  }
  return String(val)
}

const Accordion = memo(function Accordion({ title, icon: Icon, badge, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="bg-surface border border-border-subtle rounded-card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-surface-hover transition-colors duration-150 text-left touch-target"
      >
        <div className="flex items-center gap-2 min-w-0">
          {Icon && <Icon className="w-4 h-4 text-accent flex-shrink-0" />}
          <span className="section-title truncate">{title}</span>
          {badge}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-tertiary flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-tertiary flex-shrink-0" />}
      </button>
      {open && <div className="px-4 sm:px-5 pb-4 sm:pb-5 animate-fade-in">{children}</div>}
    </div>
  )
})

const InfoRow = memo(function InfoRow({ label, value, icon: Icon, link }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border-subtle last:border-0">
      {Icon && <Icon className="w-4 h-4 text-muted mt-0.5 flex-shrink-0" />}
      <div className="min-w-0 flex-1">
        <div className="text-caption text-muted uppercase tracking-wider mb-0.5">{label}</div>
        {link ? (
          <a href={link} target="_blank" rel="noopener noreferrer" className="text-body text-accent hover:underline inline-flex items-center gap-1">
            {value} <ExternalLink className="w-3 h-3" />
          </a>
        ) : (
          <div className="text-body text-primary">{value}</div>
        )}
      </div>
    </div>
  )
})

const MetricCard = memo(function MetricCard({ label, value, icon: Icon }) {
  if (!value && value !== 0) return null
  const displayVal = typeof value === 'string' ? value : fmtCurrency(value)
  const isNeg = (typeof value === 'string' && value.startsWith('-')) || (typeof value === 'number' && value < 0)
  
  return (
    <div className="bg-subtle rounded-lg p-3 sm:p-4 border border-border-subtle">
      <div className="flex items-center gap-1.5 mb-1">
        {Icon && <Icon className="w-3.5 h-3.5 text-muted" />}
        <span className="text-caption text-muted">{label}</span>
      </div>
      <span className={`text-body sm:text-lg font-bold tabular-nums ${isNeg ? 'text-semantic-danger' : 'text-primary'}`}>
        {displayVal}
      </span>
    </div>
  )
})

export default function DirectorDetailPage({ data: staticData, useSupabase, darkMode, toggleDarkMode }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [record, setRecord] = useState(null)
  const [loadingRecord, setLoadingRecord] = useState(!!useSupabase)
  const dataContext = useDataOptional()

  useEffect(() => { window.scrollTo(0, 0) }, [id])

  useEffect(() => {
    if (useSupabase && dataContext?.getRecordById) {
      setLoadingRecord(true)
      dataContext.getRecordById(id)
        .then(r => { setRecord(r); setLoadingRecord(false) })
        .catch(() => { setRecord(null); setLoadingRecord(false) })
      return
    }
    if (staticData?.length) {
      const found = staticData.find(r => String(r.id) === String(id))
      setRecord(found || null)
    }
  }, [id, useSupabase, dataContext, staticData])

  const enrichedData = useMemo(() => {
    if (!record?.ai_input) return null
    try { return typeof record.ai_input === 'string' ? JSON.parse(record.ai_input) : record.ai_input }
    catch { return null }
  }, [record])

  const financialHistory = useMemo(() => {
    if (!record?.financial_history) return null
    try {
      const parsed = typeof record.financial_history === 'string' ? JSON.parse(record.financial_history) : record.financial_history
      return Object.entries(parsed).map(([period, data]) => ({ period, ...data })).sort((a, b) => (b.period_end || b.period || '').localeCompare(a.period_end || a.period || ''))
    } catch { return null }
  }, [record])

  const filingHistory = useMemo(() => {
    if (!record?.filing_links) return null
    try {
      const parsed = typeof record.filing_links === 'string' ? JSON.parse(record.filing_links) : record.filing_links
      return Object.entries(parsed).map(([desc, url]) => {
        const dateMatch = desc.match(/^(\d{1,2}\s+\w+\s+\d{4})/)
        const typeMatch = desc.match(/^\d{1,2}\s+\w+\s+\d{4}\s+-\s+(\w+)/)
        return {
          date: dateMatch ? dateMatch[1] : '',
          type: typeMatch ? typeMatch[1] : '',
          description: desc,
          url
        }
      }).sort((a, b) => {
        const parseDate = (str) => {
          if (!str) return new Date(0)
          const [d, m, y] = str.split(' ')
          return new Date(`${m} ${d}, ${y}`)
        }
        return parseDate(b.date) - parseDate(a.date)
      })
    } catch { return null }
  }, [record])

  const aiAnalysis = useMemo(() => {
    if (!record?.ai_notes) return null
    const notes = record.ai_notes
    const sections = {}
    const addressMatch = notes.match(/Addresses:([\s\S]*?)(?=People:|Financial Data:|Key Dates:|Charges|Contact details:|Trading names:|Related entities:|---|\n\n\n|$)/i)
    if (addressMatch) sections.addresses = addressMatch[1].trim()
    const peopleMatch = notes.match(/People:([\s\S]*?)(?=Financial Data:|Key Dates:|Charges|Contact details:|Trading names:|Related entities:|---|\n\n\n|$)/i)
    if (peopleMatch) sections.people = peopleMatch[1].trim()
    const financialMatch = notes.match(/Financial Data:([\s\S]*?)(?=Key Dates:|Charges|Contact details:|Trading names:|Related entities:|---|\n\n\n|$)/i)
    if (financialMatch) sections.financial = financialMatch[1].trim()
    const datesMatch = notes.match(/Key Dates:([\s\S]*?)(?=Charges|Contact details:|Trading names:|Related entities:|---|\n\n\n|$)/i)
    if (datesMatch) sections.dates = datesMatch[1].trim()
    const chargesMatch = notes.match(/Charges\/Mortgages:([\s\S]*?)(?=Occupation|Contact details:|Trading names:|Related entities:|---|\n\n\n|$)/i)
    if (chargesMatch) sections.charges = chargesMatch[1].trim()
    const summaryMatch = notes.match(/SECTION\s*2[^:]*:\s*([\s\S]*?)$/i)
    if (summaryMatch) sections.summary = summaryMatch[1].trim()
    return Object.keys(sections).length > 0 ? sections : null
  }, [record])

  const googleKp = record?.google_kp || null
  const dataQuality = record?.data_quality || null

  if (useSupabase && loadingRecord) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-body-sm text-secondary">Loading record...</p>
        </div>
      </div>
    )
  }

  if (!useSupabase && (!staticData || staticData.length === 0)) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-body-sm text-secondary">Loading data...</p>
        </div>
      </div>
    )
  }

  if (!record) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <div className="text-center">
          <h2 className="section-title mb-2">Record not found</h2>
          <button onClick={() => navigate('/')} className="btn-secondary">
            <ArrowLeft className="w-4 h-4" /> Back to dashboard
          </button>
        </div>
      </div>
    )
  }

  const grade = record.financial_health_grade ? gradeInfo[String(record.financial_health_grade).trim().toUpperCase()] : null
  const score = parseInt(record.financial_health_score)
  const hasCharges = record.company_charges && record.company_charges !== 'No charges' && record.company_charges !== 'No charges registered'

  return (
    <div className="min-h-screen bg-canvas">
      {/* Header */}
      <header className="bg-surface border-b border-border-subtle sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-14 sm:h-16 gap-3 sm:gap-4">
            <button onClick={() => navigate('/')} className="btn-ghost -ml-2 touch-target">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </button>
            <div className="h-6 w-px bg-border-subtle hidden sm:block" />
            <div className="min-w-0 flex-1">
              <h1 className="text-body font-bold text-primary truncate">{record.director_name}</h1>
              <p className="text-caption text-muted truncate">{record.company_name}</p>
            </div>
            <button onClick={toggleDarkMode} className="btn-ghost touch-target" title={darkMode ? 'Light mode' : 'Dark mode'}>
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="space-y-4 sm:space-y-6">

          {/* Hero Summary Card */}
          <div className="bg-surface border border-border-subtle rounded-card p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6">
              {/* Left: Main info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-card bg-accent flex items-center justify-center flex-shrink-0">
                    <span className="text-lg sm:text-xl font-bold text-white">
                      {record.director_name?.split(' ').map(n => n[0]).slice(0, 2).join('')}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h1 className="text-lg sm:text-xl font-bold text-primary">{record.director_name}</h1>
                    <p className="text-body text-secondary truncate">{record.company_name}</p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <StatusBadge status={record.company_status} />
                      {record.registered_postcode && (
                        <span className="text-caption text-muted">{record.registered_postcode}</span>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Quick stats row */}
                <div className="flex flex-wrap gap-3 sm:gap-4">
                  {grade && (
                    <div className="flex items-center gap-2">
                      <GradeBadge grade={record.financial_health_grade} size="lg" />
                      <div>
                        <div className="text-caption text-muted">Health</div>
                        <div className="text-body-sm font-semibold text-primary">{grade.label}</div>
                      </div>
                    </div>
                  )}
                  {dataQuality?.overall_score && (
                    <div className="flex items-center gap-2">
                      <ScoreBadge score={dataQuality.overall_score} size="lg" />
                      <div>
                        <div className="text-caption text-muted">Data Quality</div>
                        <div className="text-body-sm font-semibold text-primary">{dataQuality.overall_score}/100</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Actions & meta */}
              <div className="flex flex-col gap-3 sm:items-end">
                <div className="flex gap-2 flex-wrap">
                  {record.company_link && (
                    <a href={record.company_link} target="_blank" rel="noopener noreferrer" className="btn-secondary touch-target">
                      <Building2 className="w-4 h-4" /> <span className="hidden sm:inline">Companies House</span>
                    </a>
                  )}
                  {record.officer_link && (
                    <a href={record.officer_link} target="_blank" rel="noopener noreferrer" className="btn-secondary touch-target">
                      <Users className="w-4 h-4" /> <span className="hidden sm:inline">Officer</span>
                    </a>
                  )}
                </div>
                <div className="text-caption text-muted flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Updated: {formatEnrichmentDate(record.data_enrichment_last)}
                </div>
              </div>
            </div>

            {/* Score bar */}
            {!isNaN(score) && score >= 0 && score <= 100 && (
              <div className="mt-4 pt-4 border-t border-border-subtle">
                <div className="flex items-center justify-between text-body-sm mb-2">
                  <span className="text-secondary">Financial Health Score</span>
                  <span className="font-bold text-primary">{score}/100</span>
                </div>
                <div className="w-full h-2 bg-subtle rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      score >= 70 ? 'bg-semantic-success' : score >= 50 ? 'bg-semantic-warning' : 'bg-semantic-danger'
                    }`}
                    style={{ width: `${score}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* AI Summary - Enhanced */}
          {(record.ai_summary || aiAnalysis?.summary) && (
            <div className="bg-accent-soft border border-accent/20 rounded-card p-4 sm:p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-accent" />
                </div>
                <h3 className="text-label font-semibold text-accent">Summary</h3>
              </div>
              <p className="text-body text-primary leading-relaxed">
                {(record.ai_summary || aiAnalysis?.summary || '').replace(/^SECTION\s*\d+\s*\([^)]*\)\s*:\s*/i, '').trim()}
              </p>
            </div>
          )}

          {/* Google Business Profile */}
          {googleKp && (
            <Accordion title="Google Business Profile" icon={Star} defaultOpen={true}
              badge={googleKp.match && (
                <span className={`ml-2 badge ${parseFloat(googleKp.match) >= 0.7 ? 'badge-success' : 'badge-warning'}`}>
                  {Math.round(parseFloat(googleKp.match) * 100)}% match
                </span>
              )}
            >
              <div className="space-y-4">
                <div>
                  <h4 className="text-body font-semibold text-primary">{googleKp.name}</h4>
                  {googleKp.category && <p className="text-body-sm text-secondary mt-0.5">{googleKp.category}</p>}
                  {googleKp.rating && (
                    <div className="flex items-center gap-2 mt-2">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} className={`w-4 h-4 ${s <= Math.round(parseFloat(googleKp.rating)) ? 'text-semantic-warning fill-semantic-warning' : 'text-muted'}`} />
                      ))}
                      <span className="text-body-sm font-semibold text-primary">{googleKp.rating}</span>
                      {googleKp.reviews && <span className="text-caption text-muted">({googleKp.reviews})</span>}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {googleKp.address && (
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-muted mt-0.5 flex-shrink-0" />
                      <span className="text-body-sm text-primary">{googleKp.address}</span>
                    </div>
                  )}
                  {googleKp.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted flex-shrink-0" />
                      <a href={`tel:${googleKp.phone}`} className="text-body-sm text-accent">{googleKp.phone}</a>
                    </div>
                  )}
                  {googleKp.website && (
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-muted flex-shrink-0" />
                      <a href={googleKp.website.startsWith('http') ? googleKp.website : `https://${googleKp.website}`} target="_blank" rel="noopener noreferrer" className="text-body-sm text-accent truncate">
                        {googleKp.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                      </a>
                    </div>
                  )}
                  {googleKp.hours && (
                    <div className="flex items-start gap-2 col-span-full">
                      <Clock className="w-4 h-4 text-muted mt-0.5 flex-shrink-0" />
                      <span className="text-body-sm text-secondary">{googleKp.hours}</span>
                    </div>
                  )}
                </div>

                {/* Google KP Summary */}
                {googleKp.summary && (
                  <div className="bg-subtle rounded-lg p-3 mt-3">
                    <p className="text-body-sm text-secondary">{googleKp.summary}</p>
                  </div>
                )}

                {/* Google KP Social Links */}
                {(googleKp.social_facebook || googleKp.social_instagram) && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {googleKp.social_facebook && (
                      <a href={googleKp.social_facebook} target="_blank" rel="noopener noreferrer" className="btn-secondary touch-target text-body-sm">
                        <FacebookIcon className="w-4 h-4" /> Facebook
                      </a>
                    )}
                    {googleKp.social_instagram && (
                      <a href={googleKp.social_instagram} target="_blank" rel="noopener noreferrer" className="btn-secondary touch-target text-body-sm">
                        <InstagramIcon className="w-4 h-4" /> Instagram
                      </a>
                    )}
                  </div>
                )}
              </div>
            </Accordion>
          )}

          {/* Company & Director Details - Side by side on desktop, stacked on mobile */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <Accordion title="Company Details" icon={Building2} defaultOpen={true}>
              <InfoRow label="Company Name" value={record.company_name} link={record.company_link} icon={Building2} />
              <InfoRow label="Company Number" value={record.company_number ? `#${record.company_number}` : null} icon={Hash} />
              <InfoRow label="Status" value={record.company_status} icon={FileText} />
              <InfoRow label="Type" value={record.company_type?.toUpperCase()} icon={Briefcase} />
              <InfoRow label="Category" value={record.company_category} />
              <InfoRow label="Company Size" value={record.company_size} />
              <InfoRow label="Created" value={record.date_of_creation} icon={Calendar} />
              <InfoRow label="Accounts Type" value={record.accounts_type} />
              <InfoRow label="Accounts Last Made Up" value={record.accounts_last_made_up_to} icon={Calendar} />
              <InfoRow label="Accounts Next Due" value={record.accounts_next_due} icon={Calendar} />
              <InfoRow label="SIC Codes" value={record.sic_descriptions} />
              <InfoRow label="Address" value={record.registered_address} icon={MapPin} />
              <InfoRow label="Postcode" value={record.registered_postcode} />
            </Accordion>

            <Accordion title="Director Details" icon={Users} defaultOpen={true}>
              <InfoRow label="Name" value={record.director_name} />
              <InfoRow label="Officer Record" value="View Appointments" link={record.officer_link} icon={ExternalLink} />
              <InfoRow label="Nationality" value={record.nationality} icon={Globe} />
              <InfoRow label="Country" value={record.country_of_residence} icon={Globe} />
              <InfoRow label="Date of Birth" value={record.director_dob} icon={Calendar} />
              <InfoRow label="Address" value={record.director_address} icon={MapPin} />
              <InfoRow label="Occupation" value={record.occupation} icon={Briefcase} />
            </Accordion>
          </div>

          {/* Charges Banner */}
          <div className={`rounded-card p-4 flex items-center gap-3 ${hasCharges ? 'bg-semantic-danger-soft border border-semantic-danger/20' : 'bg-semantic-success-soft border border-semantic-success/20'}`}>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${hasCharges ? 'bg-semantic-danger/10' : 'bg-semantic-success/10'}`}>
              <Shield className={`w-5 h-5 ${hasCharges ? 'text-semantic-danger' : 'text-semantic-success'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className={`text-body-sm font-semibold ${hasCharges ? 'text-semantic-danger' : 'text-semantic-success'}`}>
                Company Charges
              </div>
              <p className={`text-body-sm ${hasCharges ? 'text-semantic-danger' : 'text-semantic-success'}`}>
                {record.company_charges || 'No charges registered'}
              </p>
            </div>
            {hasCharges ? <AlertTriangle className="w-5 h-5 text-semantic-danger flex-shrink-0" /> : <CheckCircle className="w-5 h-5 text-semantic-success flex-shrink-0" />}
          </div>

          {/* Financial Snapshot */}
          {record.period_end_date && (
            <Accordion title="Financial Snapshot" icon={CreditCard} 
              badge={<span className="ml-2 text-caption text-muted font-normal">Period ending {record.period_end_date}</span>}
              defaultOpen={true}
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <MetricCard label="Turnover" value={record.turnover} icon={BadgePoundSterling} />
                <MetricCard label="Gross Profit" value={record.gross_profit} icon={TrendingUp} />
                <MetricCard label="Net Assets" value={record.net_assets} icon={PiggyBank} />
                <MetricCard label="Current Assets" value={record.current_assets} icon={Wallet} />
                <MetricCard label="Cash at Bank" value={record.cash_at_bank} icon={Landmark} />
                <MetricCard label="Working Capital" value={record.working_capital} icon={TrendingUp} />
                <MetricCard label="Debtors" value={record.debtors} icon={Users} />
                <MetricCard label="Creditors" value={record.creditors_due_within_one_year} icon={CreditCard} />
                {record.average_number_of_employees && (
                  <MetricCard label="Employees" value={record.average_number_of_employees} icon={Users} />
                )}
              </div>
            </Accordion>
          )}

          {/* Financial History with Trends */}
          {financialHistory && financialHistory.length > 0 && (() => {
            const calcTrend = (curr, prev) => {
              if (curr == null || prev == null || prev === 0) return null
              return ((curr - prev) / Math.abs(prev) * 100).toFixed(1)
            }
            const latestPrev = financialHistory.length > 1 ? financialHistory[1] : null
            const latest = financialHistory[0]
            const netAssetsTrend = latestPrev ? calcTrend(latest.net_assets, latestPrev.net_assets) : null

            return (
              <Accordion title="Financial History" icon={BarChart3}
                badge={
                  <div className="flex items-center gap-2">
                    <span className="ml-2 badge badge-info">{financialHistory.length} periods</span>
                    {netAssetsTrend !== null && (
                      <span className={`flex items-center gap-0.5 text-caption font-medium ${parseFloat(netAssetsTrend) >= 0 ? 'text-semantic-success' : 'text-semantic-danger'}`}>
                        {parseFloat(netAssetsTrend) >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {Math.abs(parseFloat(netAssetsTrend))}%
                      </span>
                    )}
                  </div>
                }
                defaultOpen={true}
              >
                <div className="space-y-4">
                  {/* Mobile-friendly cards */}
                  <div className="block sm:hidden space-y-3">
                    {financialHistory.slice(0, 5).map((entry, idx) => {
                      const prevEntry = financialHistory[idx + 1]
                      const trend = prevEntry ? calcTrend(entry.net_assets, prevEntry.net_assets) : null
                      return (
                        <div key={idx} className={`rounded-lg p-4 border ${idx === 0 ? 'bg-accent-soft border-accent/20' : 'bg-subtle border-border-subtle'}`}>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-body-sm font-semibold text-primary">{entry.period_end || entry.period}</span>
                            <div className="flex items-center gap-2">
                              {idx === 0 && <span className="badge badge-success text-[10px]">Latest</span>}
                              {trend !== null && (
                                <span className={`flex items-center gap-0.5 text-caption font-medium ${parseFloat(trend) >= 0 ? 'text-semantic-success' : 'text-semantic-danger'}`}>
                                  {parseFloat(trend) >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                  {Math.abs(parseFloat(trend))}%
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3 text-body-sm">
                            {entry.net_assets != null && (
                              <div>
                                <div className="text-caption text-muted">Net Assets</div>
                                <div className={`font-semibold tabular-nums ${entry.net_assets < 0 ? 'text-semantic-danger' : 'text-primary'}`}>
                                  {fmtCurrency(entry.net_assets)}
                                </div>
                              </div>
                            )}
                            {entry.current_assets != null && (
                              <div>
                                <div className="text-caption text-muted">Current Assets</div>
                                <div className="tabular-nums text-secondary">{fmtCurrency(entry.current_assets)}</div>
                              </div>
                            )}
                            {entry.turnover != null && (
                              <div>
                                <div className="text-caption text-muted">Turnover</div>
                                <div className="tabular-nums text-secondary">{fmtCurrency(entry.turnover)}</div>
                              </div>
                            )}
                            {entry.net_profit != null && (
                              <div>
                                <div className="text-caption text-muted">Net Profit</div>
                                <div className={`tabular-nums ${entry.net_profit < 0 ? 'text-semantic-danger' : 'text-secondary'}`}>
                                  {fmtCurrency(entry.net_profit)}
                                </div>
                              </div>
                            )}
                            {entry.creditors_within_1yr != null && (
                              <div>
                                <div className="text-caption text-muted">Creditors (&lt;1yr)</div>
                                <div className="tabular-nums text-semantic-warning">{fmtCurrency(entry.creditors_within_1yr)}</div>
                              </div>
                            )}
                            {entry.employees != null && (
                              <div>
                                <div className="text-caption text-muted">Employees</div>
                                <div className="tabular-nums text-secondary">{entry.employees}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Desktop table */}
                  <div className="hidden sm:block overflow-x-auto -mx-4 sm:mx-0">
                    <table className="w-full text-body-sm min-w-[700px]">
                      <thead>
                        <tr className="border-b border-border-subtle">
                          <th className="text-left py-3 px-3 text-caption font-semibold text-muted">Period</th>
                          <th className="text-right py-3 px-3 text-caption font-semibold text-muted">Net Assets</th>
                          <th className="text-right py-3 px-3 text-caption font-semibold text-muted">Current Assets</th>
                          <th className="text-right py-3 px-3 text-caption font-semibold text-muted">Creditors</th>
                          <th className="text-right py-3 px-3 text-caption font-semibold text-muted">Employees</th>
                          <th className="text-right py-3 px-3 text-caption font-semibold text-muted">Trend</th>
                        </tr>
                      </thead>
                      <tbody>
                        {financialHistory.slice(0, 5).map((entry, idx) => {
                          const prevEntry = financialHistory[idx + 1]
                          const trend = prevEntry ? calcTrend(entry.net_assets, prevEntry.net_assets) : null
                          return (
                            <tr key={idx} className={`border-b border-border-subtle last:border-0 ${idx === 0 ? 'bg-accent-soft' : ''}`}>
                              <td className="py-3 px-3">
                                <span className="font-medium text-primary">{entry.period_end || entry.period}</span>
                                {idx === 0 && <span className="ml-2 badge badge-success text-[10px]">Latest</span>}
                              </td>
                              <td className={`py-3 px-3 text-right font-semibold tabular-nums ${entry.net_assets < 0 ? 'text-semantic-danger' : 'text-primary'}`}>
                                {entry.net_assets != null ? fmtCurrency(entry.net_assets) : '—'}
                              </td>
                              <td className="py-3 px-3 text-right tabular-nums text-secondary">
                                {entry.current_assets != null ? fmtCurrency(entry.current_assets) : '—'}
                              </td>
                              <td className="py-3 px-3 text-right tabular-nums text-semantic-warning">
                                {entry.creditors_within_1yr != null ? fmtCurrency(entry.creditors_within_1yr) : '—'}
                              </td>
                              <td className="py-3 px-3 text-right tabular-nums text-secondary">
                                {entry.employees != null ? entry.employees : '—'}
                              </td>
                              <td className="py-3 px-3 text-right">
                                {trend !== null ? (
                                  <span className={`inline-flex items-center gap-0.5 text-caption font-medium ${parseFloat(trend) >= 0 ? 'text-semantic-success' : 'text-semantic-danger'}`}>
                                    {parseFloat(trend) >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                    {Math.abs(parseFloat(trend))}%
                                  </span>
                                ) : '—'}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </Accordion>
            )
          })()}

          {/* Analysis - Detailed Insights */}
          {aiAnalysis && (aiAnalysis.addresses || aiAnalysis.people || aiAnalysis.dates) && (
            <Accordion title="Analysis" icon={FileText} 
              badge={<span className="ml-2 badge badge-info">Enriched</span>}
              defaultOpen={false}
            >
              <div className="space-y-5">
                {aiAnalysis.addresses && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-4 h-4 text-accent" />
                      <h4 className="text-body-sm font-semibold text-primary">Addresses</h4>
                    </div>
                    <div className="bg-subtle rounded-lg p-3 text-body-sm text-secondary whitespace-pre-line">
                      {aiAnalysis.addresses}
                    </div>
                  </div>
                )}
                {aiAnalysis.people && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-4 h-4 text-accent" />
                      <h4 className="text-body-sm font-semibold text-primary">People & Officers</h4>
                    </div>
                    <div className="bg-subtle rounded-lg p-3 text-body-sm text-secondary whitespace-pre-line">
                      {aiAnalysis.people}
                    </div>
                  </div>
                )}
                {aiAnalysis.financial && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 className="w-4 h-4 text-accent" />
                      <h4 className="text-body-sm font-semibold text-primary">Financial Analysis</h4>
                    </div>
                    <div className="bg-subtle rounded-lg p-3 text-body-sm text-secondary whitespace-pre-line">
                      {aiAnalysis.financial}
                    </div>
                  </div>
                )}
                {aiAnalysis.dates && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-accent" />
                      <h4 className="text-body-sm font-semibold text-primary">Key Dates</h4>
                    </div>
                    <div className="bg-subtle rounded-lg p-3 text-body-sm text-secondary whitespace-pre-line">
                      {aiAnalysis.dates}
                    </div>
                  </div>
                )}
              </div>
            </Accordion>
          )}

          {/* Filing History */}
          {filingHistory && filingHistory.length > 0 && (
            <Accordion title="Filing History" icon={FileText}
              badge={<span className="ml-2 badge badge-info">{filingHistory.length} filings</span>}
              defaultOpen={false}
            >
              <div className="space-y-2">
                {filingHistory.map((filing, idx) => {
                  const typeColors = {
                    'AA': 'bg-semantic-info/10 text-semantic-info',
                    'CS01': 'bg-semantic-success/10 text-semantic-success',
                    'AD01': 'bg-semantic-warning/10 text-semantic-warning',
                    'NEWINC': 'bg-accent/10 text-accent',
                  }
                  const typeLabels = {
                    'AA': 'Accounts',
                    'CS01': 'Confirmation',
                    'AD01': 'Address Change',
                    'NEWINC': 'Incorporation',
                  }
                  const colorClass = typeColors[filing.type] || 'bg-subtle text-muted'
                  const label = typeLabels[filing.type] || filing.type

                  return (
                    <a
                      key={idx}
                      href={filing.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-3 p-3 rounded-lg bg-subtle hover:bg-surface-hover border border-border-subtle transition-colors group touch-target"
                    >
                      <div className="flex-shrink-0 flex flex-col items-center">
                        <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${colorClass}`}>
                          {label}
                        </div>
                        {filing.date && (
                          <span className="text-caption text-muted mt-1">{filing.date}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-body-sm text-primary group-hover:text-accent transition-colors line-clamp-2">
                          {filing.description.replace(/^\d{1,2}\s+\w+\s+\d{4}\s+-\s+\w+\s+-\s*/, '')}
                        </p>
                      </div>
                      <ExternalLink className="w-4 h-4 text-muted group-hover:text-accent flex-shrink-0 mt-0.5" />
                    </a>
                  )
                })}
              </div>
            </Accordion>
          )}

          {/* Contact Details */}
          <Accordion title="Contact Details" icon={Phone} 
            badge={enrichedData && <span className="ml-2 badge badge-success">Enriched</span>}
            defaultOpen={true}
          >
            {enrichedData ? (
              <div className="space-y-5">
                {/* Emails */}
                {enrichedData.emails?.length > 0 && (
                  <div>
                    <div className="text-caption text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5" /> Email Addresses
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {enrichedData.emails.map((email, idx) => (
                        <a key={idx} href={`mailto:${email}`} className="btn-secondary touch-target">
                          <Mail className="w-4 h-4" /> {email}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Phones */}
                {enrichedData.phones?.length > 0 && (
                  <div>
                    <div className="text-caption text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5" /> Phone Numbers
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {enrichedData.phones.map((phone, idx) => (
                        <a key={idx} href={`tel:${phone}`} className="btn-secondary touch-target">
                          <Phone className="w-4 h-4" /> {phone}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Website */}
                {enrichedData.website && (
                  <div>
                    <div className="text-caption text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5" /> Website
                    </div>
                    <a href={enrichedData.website.startsWith('http') ? enrichedData.website : `https://${enrichedData.website}`} 
                      target="_blank" rel="noopener noreferrer" className="btn-secondary touch-target">
                      <Globe className="w-4 h-4" /> {enrichedData.website} <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}

                {/* Social Media */}
                {enrichedData.social_media && Object.values(enrichedData.social_media).some(v => v) && (
                  <div>
                    <div className="text-caption text-muted uppercase tracking-wider mb-2">Social Media</div>
                    <div className="flex flex-wrap gap-2">
                      {enrichedData.social_media.facebook && (
                        <a href={enrichedData.social_media.facebook} target="_blank" rel="noopener noreferrer" className="btn-secondary touch-target">
                          <FacebookIcon className="w-4 h-4" /> Facebook
                        </a>
                      )}
                      {enrichedData.social_media.instagram && (
                        <a href={enrichedData.social_media.instagram} target="_blank" rel="noopener noreferrer" className="btn-secondary touch-target">
                          <InstagramIcon className="w-4 h-4" /> Instagram
                        </a>
                      )}
                      {enrichedData.social_media.twitter && (
                        <a href={enrichedData.social_media.twitter} target="_blank" rel="noopener noreferrer" className="btn-secondary touch-target">
                          <TwitterIcon className="w-4 h-4" /> X
                        </a>
                      )}
                      {enrichedData.social_media.linkedin && (
                        <a href={enrichedData.social_media.linkedin} target="_blank" rel="noopener noreferrer" className="btn-secondary touch-target">
                          <LinkedinIcon className="w-4 h-4" /> LinkedIn
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Mail className="w-10 h-10 text-muted mx-auto mb-2" />
                <p className="text-body-sm text-secondary">No contact details available yet</p>
              </div>
            )}
          </Accordion>

          {/* Data Quality */}
          {dataQuality && (
            <Accordion title="Data Quality" icon={ShieldCheck} defaultOpen={false}
              badge={dataQuality.overall_score && <ScoreBadge score={dataQuality.overall_score} />}
            >
              <div className="space-y-4">
                {dataQuality.overall_score && (
                  <div>
                    <div className="flex items-center justify-between text-body-sm mb-2">
                      <span className="text-secondary">Overall Quality</span>
                      <span className="font-bold text-primary">{dataQuality.overall_score}/100</span>
                    </div>
                    <div className="w-full h-2.5 bg-subtle rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          parseInt(dataQuality.overall_score) >= 60 ? 'bg-semantic-success' :
                          parseInt(dataQuality.overall_score) >= 40 ? 'bg-semantic-warning' : 'bg-semantic-danger'
                        }`}
                        style={{ width: `${Math.min(parseInt(dataQuality.overall_score), 100)}%` }}
                      />
                    </div>
                  </div>
                )}
                {record.confidence_score && (
                  <div className="bg-subtle rounded-lg p-3 flex items-center justify-between">
                    <span className="text-body-sm text-secondary">Enrichment Confidence</span>
                    <span className="text-body font-bold text-primary">{record.confidence_score}%</span>
                  </div>
                )}
              </div>
            </Accordion>
          )}

        </div>
      </main>
    </div>
  )
}
