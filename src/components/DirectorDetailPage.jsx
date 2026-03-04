import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState, useMemo, useRef } from 'react'
import {
  ArrowLeft, ExternalLink, Building2, Users, MapPin, Calendar,
  CreditCard, Hash, Briefcase, Globe, FileText, Mail, Phone,
  Link as LinkIcon, CheckCircle, XCircle, MessageSquare,
  Shield, TrendingUp, TrendingDown, Clock, AlertTriangle,
  ChevronDown, ChevronUp, ScrollText, BarChart3, Info,
  CircleHelp, Wallet, PiggyBank, Landmark,
  BadgePoundSterling, CircleDollarSign, Star, Search as SearchIcon,
  ShieldCheck, Gauge, Sun, Moon
} from 'lucide-react'

const gradeInfo = {
  'A': { label: 'Excellent', color: 'bg-emerald-500', textColor: 'text-emerald-700', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200' },
  'B': { label: 'Good', color: 'bg-blue-500', textColor: 'text-blue-700', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
  'C': { label: 'Fair', color: 'bg-yellow-500', textColor: 'text-yellow-700', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200' },
  'D': { label: 'Poor', color: 'bg-orange-500', textColor: 'text-orange-700', bgColor: 'bg-orange-50', borderColor: 'border-orange-200' },
  'F': { label: 'Failing', color: 'bg-red-500', textColor: 'text-red-700', bgColor: 'bg-red-50', borderColor: 'border-red-200' },
}

/* ---- tiny brand icons (inline SVG so we don't need extra deps) ---- */
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
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
)

/* ── Tooltip component ── */
function Tooltip({ text, children }) {
  const [show, setShow] = useState(false)
  const ref = useRef(null)

  return (
    <span
      className="relative inline-flex items-center"
      ref={ref}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg shadow-lg whitespace-normal w-56 text-center z-50 leading-relaxed pointer-events-none">
          {text}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
        </span>
      )}
    </span>
  )
}

/* ── Financial field tooltips ── */
const FINANCIAL_TOOLTIPS = {
  'Turnover': 'Total revenue or sales income generated by the company before any costs are deducted.',
  'Gross Profit': 'Revenue minus the direct cost of goods/services sold. Shows how efficiently the company produces its products.',
  'Operating Profit': 'Profit from core business operations after deducting operating expenses, but before interest and tax.',
  'Profit Before Tax': 'Total profit before corporation tax is applied. Includes income from all sources.',
  'Net Profit/Loss': 'The bottom line — profit remaining after all expenses, interest, and taxes have been deducted.',
  'EBITDA': 'Earnings Before Interest, Tax, Depreciation & Amortisation. A measure of core operational performance.',
  'Net Assets': 'Total assets minus total liabilities. Represents the overall net worth of the company.',
  'Total Assets': 'Everything the company owns — property, equipment, cash, and money owed to it.',
  'Current Assets': 'Short-term assets that can be converted to cash within a year — cash, stock, and debtors.',
  'Fixed Assets': 'Long-term assets like property, vehicles, and equipment used to run the business.',
  'Cash at Bank': 'Liquid cash the company holds in bank accounts. A key indicator of short-term financial health.',
  'Working Capital': 'Current Assets minus Current Liabilities. Shows the company\'s ability to meet short-term obligations.',
  'Debtors': 'Money owed to the company by customers or clients — also known as accounts receivable.',
  'Creditors': 'Money the company owes to suppliers and lenders due within one year.',
  'Share Capital': 'The total value of shares issued by the company. Represents the equity base invested by shareholders.',
  'Employees': 'Average number of people employed by the company during the accounting period.',
}

/* ── Financial metric with tooltip ── */
function FinancialMetricCard({ label, value, tooltip, icon: Icon, accentColor = 'indigo' }) {
  if (!value && value !== 0) return null
  const displayVal = typeof value === 'string' ? value : fmtCurrency(value)
  const isNeg = (typeof value === 'string' && (value.startsWith('-') || value.startsWith('"-'))) ||
                (typeof value === 'number' && value < 0)

  const colorMap = {
    indigo: { bg: 'bg-indigo-50', icon: 'text-indigo-400', border: 'border-indigo-100' },
    emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-400', border: 'border-emerald-100' },
    violet: { bg: 'bg-violet-50', icon: 'text-violet-400', border: 'border-violet-100' },
    blue: { bg: 'bg-blue-50', icon: 'text-blue-400', border: 'border-blue-100' },
    amber: { bg: 'bg-amber-50', icon: 'text-amber-400', border: 'border-amber-100' },
  }
  const colors = colorMap[accentColor] || colorMap.indigo

  return (
    <div className={`rounded-xl border ${colors.border} ${colors.bg} p-4 flex flex-col gap-1.5 transition-all hover:shadow-sm`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
          {Icon && <Icon className={`w-3.5 h-3.5 ${colors.icon}`} />}
          {label}
        </span>
        {tooltip && (
          <Tooltip text={tooltip}>
            <CircleHelp className="w-3.5 h-3.5 text-slate-300 hover:text-slate-500 cursor-help transition-colors" />
          </Tooltip>
        )}
      </div>
      <span className={`text-lg font-bold ${isNeg ? 'text-red-600' : 'text-slate-900'}`}>
        {displayVal}
      </span>
    </div>
  )
}

function FieldRow({ label, value, link, icon: Icon }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-3 py-2.5">
      {Icon && <Icon className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />}
      <div className="min-w-0 flex-1">
        <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</div>
        {link ? (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline inline-flex items-center gap-1 mt-0.5"
          >
            {value} <ExternalLink className="w-3 h-3" />
          </a>
        ) : (
          <div className="text-sm text-slate-700 mt-0.5">{value}</div>
        )}
      </div>
    </div>
  )
}

function FinancialRow({ label, value }) {
  if (!value) return null
  const isNegative = value.startsWith('-') || value.startsWith('"-')
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span className={`text-sm font-semibold ${isNegative ? 'text-red-600' : 'text-slate-900'}`}>
        {value}
      </span>
    </div>
  )
}

/* ── Collapsible section wrapper ── */
function CollapsibleSection({ title, icon: Icon, iconColor = 'text-indigo-500', badge, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-6 pb-4 hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors text-left"
      >
        <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          {Icon && <Icon className={`w-4 h-4 ${iconColor}`} />} {title}
          {badge}
        </h3>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>
      {open && <div className="px-6 pb-6">{children}</div>}
    </div>
  )
}

/* ── Enrichment date: dd-mm-yyyy, default 04-03-2026 when empty ── */
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

/* ── Format currency helper ── */
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

export default function DirectorDetailPage({ data, darkMode, toggleDarkMode }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [record, setRecord] = useState(null)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [id])

  useEffect(() => {
    if (data && data.length > 0) {
      const found = data.find(r => String(r.id) === String(id))
      setRecord(found || null)
    }
  }, [id, data])

  // Parse enriched AI data (contact details from enrich.py)
  const enrichedData = useMemo(() => {
    if (!record || !record.ai_input) return null
    try {
      return typeof record.ai_input === 'string'
        ? JSON.parse(record.ai_input)
        : record.ai_input
    } catch (e) {
      console.error('Failed to parse ai_input:', e)
      return null
    }
  }, [record])

  // Parse filing links JSON
  const filingLinks = useMemo(() => {
    if (!record || !record.filing_links) return null
    try {
      const parsed = typeof record.filing_links === 'string'
        ? JSON.parse(record.filing_links)
        : record.filing_links
      return parsed
    } catch (e) {
      console.error('Failed to parse filing_links:', e)
      return null
    }
  }, [record])

  // Parse financial history JSON
  const financialHistory = useMemo(() => {
    if (!record || !record.financial_history) return null
    try {
      const parsed = typeof record.financial_history === 'string'
        ? JSON.parse(record.financial_history)
        : record.financial_history
      // Convert to sorted array (newest first)
      const entries = Object.entries(parsed)
        .map(([period, data]) => ({ period, ...data }))
        .sort((a, b) => (b.period_end || b.period || '').localeCompare(a.period_end || a.period || ''))
      return entries
    } catch (e) {
      console.error('Failed to parse financial_history:', e)
      return null
    }
  }, [record])

  const googleKp = record?.google_kp || null
  const dataQuality = record?.data_quality || null

  if (!data || data.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg mb-4 animate-pulse">
            <span className="text-2xl font-extrabold text-slate-900">AF</span>
          </div>
          <p className="text-slate-500 animate-pulse">Loading data...</p>
        </div>
      </div>
    )
  }

  if (!record) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Record not found</h2>
          <button
            onClick={() => navigate('/')}
            className="mt-2 inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Go back to dashboard
          </button>
        </div>
      </div>
    )
  }

  const grade = gradeInfo[record.financial_health_grade]
  const score = parseInt(record.financial_health_score)
  const hasCharges = record.company_charges && record.company_charges !== 'No charges' && record.company_charges !== 'No charges registered'

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Sticky header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-4">
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors text-sm font-medium"
            >
              <ArrowLeft className="w-4 h-4" /> Dashboard
            </button>
            <div className="h-6 w-px bg-slate-200" />
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-bold text-slate-900 truncate">{record.director_name}</h1>
              <p className="text-xs text-slate-500 -mt-0.5 truncate">{record.company_name}</p>
            </div>
            <div className="hidden sm:flex items-center gap-3">
              {grade && (
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${grade.bgColor} ${grade.textColor} border ${grade.borderColor}`}>
                  {record.financial_health_grade} · {!isNaN(score) ? `${score}/100` : grade.label}
                </span>
              )}
              {dataQuality?.overall_score && (
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                  parseInt(dataQuality.overall_score) >= 60 ? 'bg-emerald-50 text-emerald-600' :
                  parseInt(dataQuality.overall_score) >= 40 ? 'bg-amber-50 text-amber-600' :
                  'bg-slate-100 text-slate-500'
                }`}>
                  <ShieldCheck className="w-3 h-3" /> DQ: {dataQuality.overall_score}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                <Clock className="w-3.5 h-3.5" />
                Last updated: {formatEnrichmentDate(record.data_enrichment_last || '')}
              </span>
              <button
                onClick={toggleDarkMode}
                className="p-2 text-slate-500 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-lg transition-all"
                title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">

          {/* ═══════════════════════════════════════════════════════════
              AI SUMMARY BANNER
             ═══════════════════════════════════════════════════════════ */}
          {record.ai_summary && (
            <div className="bg-gradient-to-r from-indigo-50 via-blue-50 to-purple-50 dark:from-indigo-950/50 dark:via-blue-950/50 dark:to-purple-950/50 rounded-xl border border-indigo-100 dark:border-indigo-800/50 p-6">
              <h3 className="text-sm font-semibold text-indigo-900 uppercase tracking-wider mb-3">
                Summary
              </h3>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {record.ai_summary.replace(/^SECTION\s*\d+\s*\([^)]*\)\s*:\s*/i, '').trim()}
              </p>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════
              GOOGLE KNOWLEDGE PANEL
             ═══════════════════════════════════════════════════════════ */}
          {googleKp && (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="p-6 pb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <GoogleIcon className="w-4 h-4" /> Google Business Profile
                </h3>
                <div className="flex items-center gap-2">
                  {googleKp.match && (
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                      parseFloat(googleKp.match) >= 0.8 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      parseFloat(googleKp.match) >= 0.6 ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                      'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      <Gauge className="w-3 h-3" />
                      {Math.round(parseFloat(googleKp.match) * 100)}% match
                    </span>
                  )}
                </div>
              </div>
              <div className="px-6 pb-6">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Left: Name, category, rating */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xl font-bold text-slate-900">{googleKp.name}</h4>
                    {googleKp.category && (
                      <p className="text-sm text-slate-500 mt-1">{googleKp.category}</p>
                    )}
                    {googleKp.rating && (
                      <div className="flex items-center gap-2 mt-3">
                        {(() => {
                          const ratingVal = parseFloat(googleKp.rating)
                          if (!isNaN(ratingVal) && ratingVal <= 5) {
                            return (
                              <>
                                <div className="flex items-center gap-0.5">
                                  {[1,2,3,4,5].map(s => (
                                    <Star key={s} className={`w-4 h-4 ${s <= Math.round(ratingVal) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
                                  ))}
                                </div>
                                <span className="text-sm font-bold text-slate-700">{ratingVal}</span>
                              </>
                            )
                          }
                          return null
                        })()}
                        {googleKp.reviews && (
                          <span className="text-xs text-slate-400">
                            ({googleKp.reviews})
                          </span>
                        )}
                      </div>
                    )}
                    {googleKp.description && (
                      <p className="text-sm text-slate-600 mt-3 leading-relaxed">{googleKp.description}</p>
                    )}
                  </div>

                  {/* Right: Details grid */}
                  <div className="lg:w-80 space-y-3">
                    {googleKp.address && (
                      <div className="flex items-start gap-2.5">
                        <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-slate-700">{googleKp.address}</span>
                      </div>
                    )}
                    {googleKp.phone && (
                      <div className="flex items-center gap-2.5">
                        <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <a href={`tel:${googleKp.phone}`} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">{googleKp.phone}</a>
                      </div>
                    )}
                    {googleKp.website && (
                      <div className="flex items-center gap-2.5">
                        <Globe className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <a href={googleKp.website.startsWith('http') ? googleKp.website : `https://${googleKp.website}`}
                          target="_blank" rel="noopener noreferrer"
                          className="text-sm text-indigo-600 hover:text-indigo-800 font-medium truncate">
                          {googleKp.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                        </a>
                      </div>
                    )}
                    {googleKp.hours && (
                      <div className="flex items-center gap-2.5">
                        <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <span className="text-sm text-slate-700">{googleKp.hours}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* KP Social Media */}
                {(googleKp.social_instagram || googleKp.social_facebook || googleKp.social_linkedin || googleKp.social_twitter) && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <div className="flex flex-wrap gap-2">
                      {googleKp.social_facebook && (
                        <a href={googleKp.social_facebook} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-2 bg-[#1877F2]/10 text-[#1877F2] rounded-lg text-xs font-medium hover:bg-[#1877F2]/20 transition-colors">
                          <FacebookIcon className="w-3.5 h-3.5" /> Facebook
                        </a>
                      )}
                      {googleKp.social_instagram && (
                        <a href={googleKp.social_instagram} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-2 bg-pink-50 text-pink-600 rounded-lg text-xs font-medium hover:bg-pink-100 transition-colors">
                          <InstagramIcon className="w-3.5 h-3.5" /> Instagram
                        </a>
                      )}
                      {googleKp.social_twitter && (
                        <a href={googleKp.social_twitter} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-200 transition-colors">
                          <TwitterIcon className="w-3.5 h-3.5" /> X / Twitter
                        </a>
                      )}
                      {googleKp.social_linkedin && (
                        <a href={googleKp.social_linkedin} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-3 py-2 bg-[#0A66C2]/10 text-[#0A66C2] rounded-lg text-xs font-medium hover:bg-[#0A66C2]/20 transition-colors">
                          <LinkedinIcon className="w-3.5 h-3.5" /> LinkedIn
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Health Score Banner */}
          {grade && (
            <div className={`${grade.bgColor} rounded-xl p-5 flex items-center gap-4`}>
              <div className={`w-16 h-16 ${grade.color} rounded-xl flex items-center justify-center text-white text-3xl font-bold shadow-lg`}>
                {record.financial_health_grade}
              </div>
              <div className="flex-1">
                <div className={`text-sm font-semibold ${grade.textColor}`}>
                  Financial Health: {grade.label}
                </div>
                {!isNaN(score) && (
                  <div className="mt-2 max-w-xs">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className={grade.textColor}>Score</span>
                      <span className={`font-bold ${grade.textColor}`}>{score}/100</span>
                    </div>
                    <div className="w-full h-2.5 bg-white/60 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${grade.color} rounded-full transition-all duration-500`}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Company Info */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-500" /> Company Details
              </h3>
              <div className="divide-y divide-slate-100">
                <FieldRow label="Company Name" value={record.company_name} link={record.company_link} icon={Building2} />
                <FieldRow label="Company Number" value={record.company_number ? `#${record.company_number}` : null} icon={Hash} />
                <FieldRow label="Status" value={record.company_status} icon={FileText} />
                <FieldRow label="Type" value={record.company_type?.toUpperCase()} icon={Briefcase} />
                <FieldRow label="Category" value={record.company_category} />
                <FieldRow label="Size" value={record.company_size} />
                <FieldRow label="Created" value={record.date_of_creation} icon={Calendar} />
                <FieldRow label="SIC Codes" value={record.sic_codes} />
                <FieldRow label="SIC Descriptions" value={record.sic_descriptions} />
                <FieldRow label="Registered Address" value={record.registered_address} icon={MapPin} />
                <FieldRow label="Postcode" value={record.registered_postcode} />
                <FieldRow label="Previous Names" value={record.previous_company_names} />
                <FieldRow label="Accounts Type" value={record.accounts_type} />
                <FieldRow label="Accounts Next Due" value={record.accounts_next_due} icon={Calendar} />
                <FieldRow label="Accounts Last Made Up" value={record.accounts_last_made_up_to} />
              </div>
            </div>

            {/* Director Info */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-500" /> Director Details
              </h3>
              <div className="divide-y divide-slate-100">
                <FieldRow label="Director Name" value={record.director_name} />
                <FieldRow label="Officer Record" value="View Appointments" link={record.officer_link} icon={ExternalLink} />
                <FieldRow label="Nationality" value={record.nationality} icon={Globe} />
                <FieldRow label="Country of Residence" value={record.country_of_residence} icon={Globe} />
                <FieldRow label="Date of Birth" value={record.director_dob} icon={Calendar} />
                <FieldRow label="Address" value={record.director_address} icon={MapPin} />
                <FieldRow label="Occupation" value={record.occupation} icon={Briefcase} />
              </div>

              {/* Quick Links section */}
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mt-6 mb-3 flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-indigo-500" /> Quick Links
              </h3>
              <div className="flex flex-wrap gap-2">
                {record.company_link && (
                  <a
                    href={record.company_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors"
                  >
                    <Building2 className="w-4 h-4" /> Companies House
                  </a>
                )}
                {record.officer_link && (
                  <a
                    href={record.officer_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors"
                  >
                    <Users className="w-4 h-4" /> Officer Record
                  </a>
                )}
                {record.company_link && (
                  <a
                    href={record.company_link + '/filing-history'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors"
                  >
                    <ScrollText className="w-4 h-4" /> Filing History
                  </a>
                )}
                {record.company_link && (
                  <a
                    href={record.company_link + '/charges'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors"
                  >
                    <Shield className="w-4 h-4" /> Charges
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════
              CHARGES SECTION
             ═══════════════════════════════════════════════════════════ */}
          <div className={`rounded-xl border p-6 ${hasCharges ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${hasCharges ? 'bg-red-100' : 'bg-emerald-100'}`}>
                <Shield className={`w-5 h-5 ${hasCharges ? 'text-red-600' : 'text-emerald-600'}`} />
              </div>
              <div className="flex-1">
                <h3 className={`text-sm font-semibold uppercase tracking-wider ${hasCharges ? 'text-red-900' : 'text-emerald-900'}`}>
                  Company Charges
                </h3>
                <p className={`text-sm mt-1 ${hasCharges ? 'text-red-700' : 'text-emerald-700'}`}>
                  {record.company_charges || 'No charges registered'}
                </p>
              </div>
              {hasCharges ? (
                <AlertTriangle className="w-6 h-6 text-red-400" />
              ) : (
                <CheckCircle className="w-6 h-6 text-emerald-400" />
              )}
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════
              FINANCIAL DATA (current period)
             ═══════════════════════════════════════════════════════════ */}
          {record.period_end_date && (
            <CollapsibleSection
              title="Financial Snapshot"
              icon={CreditCard}
              badge={
                <span className="text-xs font-normal text-slate-400 normal-case ml-1">
                  Period ending {record.period_end_date}
                </span>
              }
            >
              {/* Profitability Row */}
              {(record.turnover || record.gross_profit || record.operating_profit || record.profit_before_tax || record.net_profit_loss || record.ebitda) && (
                <div className="mb-5">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5" /> Profitability
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3">
                    <FinancialMetricCard label="Turnover" value={record.turnover} tooltip={FINANCIAL_TOOLTIPS['Turnover']} icon={BadgePoundSterling} accentColor="emerald" />
                    <FinancialMetricCard label="Gross Profit" value={record.gross_profit} tooltip={FINANCIAL_TOOLTIPS['Gross Profit']} icon={TrendingUp} accentColor="emerald" />
                    <FinancialMetricCard label="Operating Profit" value={record.operating_profit} tooltip={FINANCIAL_TOOLTIPS['Operating Profit']} icon={TrendingUp} accentColor="emerald" />
                    <FinancialMetricCard label="Profit Before Tax" value={record.profit_before_tax} tooltip={FINANCIAL_TOOLTIPS['Profit Before Tax']} icon={CircleDollarSign} accentColor="emerald" />
                    <FinancialMetricCard label="Net Profit/Loss" value={record.net_profit_loss} tooltip={FINANCIAL_TOOLTIPS['Net Profit/Loss']} icon={Wallet} accentColor="emerald" />
                    <FinancialMetricCard label="EBITDA" value={record.ebitda} tooltip={FINANCIAL_TOOLTIPS['EBITDA']} icon={BarChart3} accentColor="emerald" />
                  </div>
                </div>
              )}

              {/* Assets & Liabilities Row */}
              {(record.net_assets || record.total_assets || record.current_assets || record.fixed_assets || record.cash_at_bank || record.working_capital || record.debtors || record.creditors_due_within_one_year || record.share_capital) && (
                <div className="mb-5">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Landmark className="w-3.5 h-3.5" /> Assets & Liabilities
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3">
                    <FinancialMetricCard label="Net Assets" value={record.net_assets} tooltip={FINANCIAL_TOOLTIPS['Net Assets']} icon={PiggyBank} accentColor="indigo" />
                    <FinancialMetricCard label="Total Assets" value={record.total_assets} tooltip={FINANCIAL_TOOLTIPS['Total Assets']} icon={Landmark} accentColor="indigo" />
                    <FinancialMetricCard label="Current Assets" value={record.current_assets} tooltip={FINANCIAL_TOOLTIPS['Current Assets']} icon={Wallet} accentColor="indigo" />
                    <FinancialMetricCard label="Fixed Assets" value={record.fixed_assets} tooltip={FINANCIAL_TOOLTIPS['Fixed Assets']} icon={Building2} accentColor="indigo" />
                    <FinancialMetricCard label="Cash at Bank" value={record.cash_at_bank} tooltip={FINANCIAL_TOOLTIPS['Cash at Bank']} icon={BadgePoundSterling} accentColor="blue" />
                    <FinancialMetricCard label="Working Capital" value={record.working_capital} tooltip={FINANCIAL_TOOLTIPS['Working Capital']} icon={TrendingUp} accentColor="blue" />
                    <FinancialMetricCard label="Debtors" value={record.debtors} tooltip={FINANCIAL_TOOLTIPS['Debtors']} icon={Users} accentColor="amber" />
                    <FinancialMetricCard label="Creditors" value={record.creditors_due_within_one_year} tooltip={FINANCIAL_TOOLTIPS['Creditors']} icon={CreditCard} accentColor="amber" />
                    <FinancialMetricCard label="Share Capital" value={record.share_capital} tooltip={FINANCIAL_TOOLTIPS['Share Capital']} icon={CircleDollarSign} accentColor="violet" />
                  </div>
                </div>
              )}

              {/* Employees */}
              {record.average_number_of_employees && (
                <div className="pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-4">
                    <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                      <Users className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <div className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                        Average Employees
                        <Tooltip text={FINANCIAL_TOOLTIPS['Employees']}>
                          <CircleHelp className="w-3 h-3 text-slate-300 hover:text-slate-500 cursor-help" />
                        </Tooltip>
                      </div>
                      <div className="text-xl font-bold text-slate-900">{record.average_number_of_employees}</div>
                    </div>
                  </div>
                </div>
              )}
            </CollapsibleSection>
          )}

          {/* ═══════════════════════════════════════════════════════════
              FINANCIAL HISTORY (from filings analysis)
             ═══════════════════════════════════════════════════════════ */}
          {financialHistory && financialHistory.length > 0 && (
            <CollapsibleSection
              title="Financial History"
              icon={BarChart3}
              iconColor="text-violet-500"
              badge={
                <span className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 bg-violet-50 text-violet-600 rounded-full text-xs font-medium normal-case">
                  {financialHistory.length} periods
                </span>
              }
              defaultOpen={true}
            >
              {/* Trend indicator at top */}
              {financialHistory.length >= 2 && (() => {
                const latest = financialHistory[0]?.net_assets
                const prev = financialHistory[1]?.net_assets
                if (latest !== null && latest !== undefined && prev !== null && prev !== undefined) {
                  const diff = latest - prev
                  const improving = diff > 0
                  const pctChange = prev !== 0 ? Math.abs((diff / prev) * 100).toFixed(1) : null
                  return (
                    <div className={`mb-5 p-4 rounded-xl flex items-center gap-3 ${improving ? 'bg-emerald-50 border border-emerald-100' : 'bg-red-50 border border-red-100'}`}>
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${improving ? 'bg-emerald-100' : 'bg-red-100'}`}>
                        {improving ? <TrendingUp className="w-5 h-5 text-emerald-600" /> : <TrendingDown className="w-5 h-5 text-red-600" />}
                      </div>
                      <div>
                        <span className={`text-sm font-semibold ${improving ? 'text-emerald-800' : 'text-red-800'}`}>
                          Net assets {improving ? 'increased' : 'decreased'} by {fmtCurrency(Math.abs(diff))}
                          {pctChange && <span className="font-normal opacity-75"> ({pctChange}%)</span>}
                        </span>
                        <p className={`text-xs mt-0.5 ${improving ? 'text-emerald-600' : 'text-red-600'}`}>
                          Compared to the previous filing period
                        </p>
                      </div>
                    </div>
                  )
                }
                return null
              })()}

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="text-left py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Period
                      </th>
                      <th className="text-right py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        <span className="inline-flex items-center gap-1">
                          Net Assets
                          <Tooltip text={FINANCIAL_TOOLTIPS['Net Assets']}>
                            <CircleHelp className="w-3 h-3 text-slate-300 hover:text-slate-500 cursor-help" />
                          </Tooltip>
                        </span>
                      </th>
                      <th className="text-right py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        <span className="inline-flex items-center gap-1">
                          Total Assets
                          <Tooltip text={FINANCIAL_TOOLTIPS['Total Assets']}>
                            <CircleHelp className="w-3 h-3 text-slate-300 hover:text-slate-500 cursor-help" />
                          </Tooltip>
                        </span>
                      </th>
                      <th className="text-right py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        <span className="inline-flex items-center gap-1">
                          Current Assets
                          <Tooltip text={FINANCIAL_TOOLTIPS['Current Assets']}>
                            <CircleHelp className="w-3 h-3 text-slate-300 hover:text-slate-500 cursor-help" />
                          </Tooltip>
                        </span>
                      </th>
                      <th className="text-right py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        <span className="inline-flex items-center gap-1">
                          Fixed Assets
                          <Tooltip text={FINANCIAL_TOOLTIPS['Fixed Assets']}>
                            <CircleHelp className="w-3 h-3 text-slate-300 hover:text-slate-500 cursor-help" />
                          </Tooltip>
                        </span>
                      </th>
                      <th className="text-right py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">
                        <span className="inline-flex items-center gap-1">
                          Working Capital
                          <Tooltip text={FINANCIAL_TOOLTIPS['Working Capital']}>
                            <CircleHelp className="w-3 h-3 text-slate-300 hover:text-slate-500 cursor-help" />
                          </Tooltip>
                        </span>
                      </th>
                      <th className="text-right py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">
                        <span className="inline-flex items-center gap-1">
                          Creditors
                          <Tooltip text={FINANCIAL_TOOLTIPS['Creditors']}>
                            <CircleHelp className="w-3 h-3 text-slate-300 hover:text-slate-500 cursor-help" />
                          </Tooltip>
                        </span>
                      </th>
                      <th className="text-right py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">
                        <span className="inline-flex items-center gap-1">
                          Share Capital
                          <Tooltip text={FINANCIAL_TOOLTIPS['Share Capital']}>
                            <CircleHelp className="w-3 h-3 text-slate-300 hover:text-slate-500 cursor-help" />
                          </Tooltip>
                        </span>
                      </th>
                      <th className="text-right py-3.5 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">
                        <span className="inline-flex items-center gap-1">
                          Employees
                          <Tooltip text={FINANCIAL_TOOLTIPS['Employees']}>
                            <CircleHelp className="w-3 h-3 text-slate-300 hover:text-slate-500 cursor-help" />
                          </Tooltip>
                        </span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {financialHistory.map((entry, idx) => {
                      const netAssets = entry.net_assets
                      const isNeg = netAssets !== null && netAssets !== undefined && netAssets < 0
                      // Calculate trend arrow vs previous period
                      const prevEntry = financialHistory[idx + 1]
                      let trendIcon = null
                      if (prevEntry && netAssets !== null && netAssets !== undefined && prevEntry.net_assets !== null && prevEntry.net_assets !== undefined) {
                        const diff = netAssets - prevEntry.net_assets
                        if (diff > 0) trendIcon = <TrendingUp className="w-3.5 h-3.5 text-emerald-500 inline ml-1.5" />
                        else if (diff < 0) trendIcon = <TrendingDown className="w-3.5 h-3.5 text-red-500 inline ml-1.5" />
                      }
                      return (
                        <tr key={idx} className={`border-b border-slate-100 last:border-0 hover:bg-indigo-50/30 transition-colors ${idx === 0 ? 'bg-indigo-50/20' : ''}`}>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${idx === 0 ? 'bg-indigo-500' : 'bg-slate-300'}`} />
                              <span className={`font-medium ${idx === 0 ? 'text-indigo-700' : 'text-slate-700'}`}>
                                {entry.period_end || entry.period}
                              </span>
                              {idx === 0 && <span className="text-[10px] font-semibold bg-indigo-100 text-indigo-600 rounded px-1.5 py-0.5">LATEST</span>}
                            </div>
                          </td>
                          <td className={`py-3.5 px-4 text-right font-bold ${isNeg ? 'text-red-600' : 'text-emerald-600'}`}>
                            {netAssets !== null && netAssets !== undefined ? fmtCurrency(netAssets) : '—'}
                            {trendIcon}
                          </td>
                          <td className="py-3.5 px-4 text-right text-slate-700 font-medium">
                            {entry.total_assets !== null && entry.total_assets !== undefined ? fmtCurrency(entry.total_assets) : '—'}
                          </td>
                          <td className="py-3.5 px-4 text-right text-slate-700 font-medium">
                            {entry.current_assets !== null && entry.current_assets !== undefined ? fmtCurrency(entry.current_assets) : '—'}
                          </td>
                          <td className="py-3.5 px-4 text-right text-slate-700 font-medium">
                            {entry.fixed_assets !== null && entry.fixed_assets !== undefined ? fmtCurrency(entry.fixed_assets) : '—'}
                          </td>
                          <td className="py-3.5 px-4 text-right text-slate-700 font-medium hidden md:table-cell">
                            {entry.working_capital !== null && entry.working_capital !== undefined
                              ? <span className={entry.working_capital < 0 ? 'text-red-600' : ''}>{fmtCurrency(entry.working_capital)}</span>
                              : '—'}
                          </td>
                          <td className="py-3.5 px-4 text-right text-slate-700 font-medium hidden md:table-cell">
                            {entry.creditors_within_one_year !== null && entry.creditors_within_one_year !== undefined
                              ? fmtCurrency(entry.creditors_within_one_year)
                              : '—'}
                          </td>
                          <td className="py-3.5 px-4 text-right text-slate-700 font-medium hidden md:table-cell">
                            {entry.share_capital !== null && entry.share_capital !== undefined
                              ? fmtCurrency(entry.share_capital)
                              : '—'}
                          </td>
                          <td className="py-3.5 px-4 text-right text-slate-700 font-medium hidden lg:table-cell">
                            {entry.employees !== null && entry.employees !== undefined ? entry.employees : '—'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Summary cards for key metrics across time */}
              {financialHistory.length >= 2 && (() => {
                const latest = financialHistory[0]
                const oldest = financialHistory[financialHistory.length - 1]
                const metrics = []
                if (latest?.net_assets != null && oldest?.net_assets != null) {
                  metrics.push({
                    label: 'Net Assets Change',
                    from: fmtCurrency(oldest.net_assets),
                    to: fmtCurrency(latest.net_assets),
                    positive: latest.net_assets >= oldest.net_assets,
                  })
                }
                if (latest?.current_assets != null && oldest?.current_assets != null) {
                  metrics.push({
                    label: 'Liquidity Change',
                    from: fmtCurrency(oldest.current_assets),
                    to: fmtCurrency(latest.current_assets),
                    positive: latest.current_assets >= oldest.current_assets,
                  })
                }
                if (metrics.length === 0) return null
                return (
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {metrics.map((m, i) => (
                      <div key={i} className={`rounded-xl p-4 border ${m.positive ? 'bg-emerald-50/50 border-emerald-100' : 'bg-red-50/50 border-red-100'}`}>
                        <div className="text-xs font-medium text-slate-500 mb-2">{m.label} (oldest → latest)</div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-slate-500 font-medium">{m.from}</span>
                          <span className="text-slate-300">→</span>
                          <span className={`font-bold ${m.positive ? 'text-emerald-700' : 'text-red-700'}`}>{m.to}</span>
                          {m.positive ? <TrendingUp className="w-4 h-4 text-emerald-500" /> : <TrendingDown className="w-4 h-4 text-red-500" />}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })()}
            </CollapsibleSection>
          )}

          {/* ═══════════════════════════════════════════════════════════
              CONTACT DETAILS SECTION (from AI enrichment)
             ═══════════════════════════════════════════════════════════ */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-5 flex items-center gap-2 flex-wrap">
              <Phone className="w-4 h-4 text-indigo-500" /> Contact Details
              {enrichedData && (
                <>
                  <span className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full text-xs font-medium normal-case">
                    <CheckCircle className="w-3 h-3" /> Enriched
                  </span>
                  {(record.confidence_score != null && record.confidence_score !== '') ? (
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold normal-case ${
                        parseInt(record.confidence_score) >= 70
                          ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                          : parseInt(record.confidence_score) >= 50
                            ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                            : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                      }`}
                      title="Enrichment confidence: higher means the contact details are more likely to be specific to this business rather than generic (e.g. support@domain)."
                    >
                      Confidence: {record.confidence_score}%
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium normal-case bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400" title="Confidence score not stored for this record">
                      Confidence: n/a
                    </span>
                  )}
                </>
              )}
            </h3>

            {enrichedData ? (
              <div className="space-y-6">

                {/* Emails */}
                <div>
                  <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5" /> Email Addresses
                  </div>
                  {enrichedData.emails && enrichedData.emails.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {enrichedData.emails.map((email, idx) => (
                        <a
                          key={idx}
                          href={`mailto:${email}`}
                          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors group"
                        >
                          <Mail className="w-4 h-4 group-hover:scale-110 transition-transform" /> {email}
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400 italic">No email addresses found</p>
                  )}
                </div>

                {/* Phone Numbers */}
                <div>
                  <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5" /> Phone Numbers
                  </div>
                  {enrichedData.phones && enrichedData.phones.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {enrichedData.phones.map((phone, idx) => (
                        <a
                          key={idx}
                          href={`tel:${phone}`}
                          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium hover:bg-emerald-100 transition-colors group"
                        >
                          <Phone className="w-4 h-4 group-hover:scale-110 transition-transform" /> {phone}
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400 italic">No phone numbers found</p>
                  )}
                </div>

                {/* Website */}
                <div>
                  <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5" /> Website
                  </div>
                  {enrichedData.website ? (
                    <div className="flex items-center gap-3 flex-wrap">
                      <a
                        href={enrichedData.website.startsWith('http') ? enrichedData.website : `https://${enrichedData.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors group"
                      >
                        <Globe className="w-4 h-4 group-hover:scale-110 transition-transform" /> {enrichedData.website}
                        <ExternalLink className="w-3 h-3 opacity-50" />
                      </a>
                      {record.website_verified === 'True' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-medium">
                          <CheckCircle className="w-3 h-3" /> Verified
                        </span>
                      )}
                      {record.website_verified === 'False' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-600 rounded-full text-xs font-medium">
                          <AlertTriangle className="w-3 h-3" /> Unverified
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400 italic">No website found</p>
                  )}
                </div>

                {/* Social Media */}
                <div>
                  <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Users className="w-3.5 h-3.5" /> Social Media
                  </div>
                  {enrichedData.social_media && Object.values(enrichedData.social_media).some(v => v) ? (
                    <div className="flex flex-wrap gap-2">
                      {enrichedData.social_media.facebook && (
                        <a href={enrichedData.social_media.facebook} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#1877F2] text-white rounded-lg text-sm font-medium hover:bg-[#166FE5] transition-colors">
                          <FacebookIcon className="w-4 h-4" /> Facebook
                        </a>
                      )}
                      {enrichedData.social_media.instagram && (
                        <a href={enrichedData.social_media.instagram} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 text-white rounded-lg text-sm font-medium hover:from-purple-600 hover:via-pink-600 hover:to-orange-500 transition-colors">
                          <InstagramIcon className="w-4 h-4" /> Instagram
                        </a>
                      )}
                      {enrichedData.social_media.twitter && (
                        <a href={enrichedData.social_media.twitter} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2.5 bg-black text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors">
                          <TwitterIcon className="w-4 h-4" /> X / Twitter
                        </a>
                      )}
                      {enrichedData.social_media.linkedin && (
                        <a href={enrichedData.social_media.linkedin} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0A66C2] text-white rounded-lg text-sm font-medium hover:bg-[#004182] transition-colors">
                          <LinkedinIcon className="w-4 h-4" /> LinkedIn
                        </a>
                      )}
                      {enrichedData.social_media.tiktok && (
                        <a href={enrichedData.social_media.tiktok} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2.5 bg-black text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors">
                          <TiktokIcon className="w-4 h-4" /> TikTok
                        </a>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400 italic">No social media profiles found</p>
                  )}
                </div>

                {/* Listing URLs */}
                <div>
                  <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <LinkIcon className="w-3.5 h-3.5" /> Business Listings
                  </div>
                  {enrichedData.listing_urls && enrichedData.listing_urls.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {enrichedData.listing_urls.map((url, idx) => {
                        let hostname = url
                        try { hostname = new URL(url).hostname.replace('www.', '') } catch {}
                        return (
                          <a
                            key={idx}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors group"
                          >
                            <LinkIcon className="w-4 h-4 text-slate-400 group-hover:text-slate-600" /> {hostname}
                            <ExternalLink className="w-3 h-3 opacity-40" />
                          </a>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400 italic">No business listings found</p>
                  )}
                </div>

                {/* Trading Premises Status */}
                <div>
                  <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                    Trading Premises
                  </div>
                  {enrichedData.address_is_trading_premises === true ? (
                    <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-medium">
                      <CheckCircle className="w-4 h-4" /> Confirmed Trading Premises
                    </div>
                  ) : enrichedData.address_is_trading_premises === false ? (
                    <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 rounded-lg text-sm font-medium">
                      <XCircle className="w-4 h-4" /> Not a Trading Premises
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-500 rounded-lg text-sm font-medium">
                      Unknown
                    </div>
                  )}
                </div>

                {/* Notes */}
                {enrichedData.notes && enrichedData.notes.trim() !== '' && (
                  <div>
                    <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <MessageSquare className="w-3.5 h-3.5" /> Notes
                    </div>
                    <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-4 border border-slate-100">
                      {enrichedData.notes}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <Mail className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-400 font-medium">No contact details available yet</p>
                <p className="text-xs text-slate-300 mt-1">Contact information will appear here once AI enrichment is complete for this record</p>
              </div>
            )}
          </div>

          {/* ═══════════════════════════════════════════════════════════
              DATA QUALITY & ENRICHMENT CONFIDENCE
             ═══════════════════════════════════════════════════════════ */}
          {(dataQuality || record.confidence_score) && (
            <CollapsibleSection
              title="Data Quality"
              icon={ShieldCheck}
              iconColor="text-teal-500"
              defaultOpen={false}
              badge={
                dataQuality?.overall_score ? (
                  <span className={`ml-auto inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold normal-case ${
                    parseInt(dataQuality.overall_score) >= 60 ? 'bg-emerald-50 text-emerald-700' :
                    parseInt(dataQuality.overall_score) >= 40 ? 'bg-amber-50 text-amber-700' :
                    'bg-red-50 text-red-700'
                  }`}>
                    Score: {dataQuality.overall_score}/100
                  </span>
                ) : null
              }
            >
              <div className="space-y-4">
                {/* Score visual */}
                {dataQuality?.overall_score && (
                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-slate-500 font-medium">Overall Data Quality</span>
                      <span className="font-bold text-slate-900">{dataQuality.overall_score}/100</span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          parseInt(dataQuality.overall_score) >= 60 ? 'bg-emerald-500' :
                          parseInt(dataQuality.overall_score) >= 40 ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(parseInt(dataQuality.overall_score), 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Metric pills */}
                <div className="flex flex-wrap gap-3">
                  {record.confidence_score && (
                    <div className="bg-indigo-50 rounded-xl p-4 flex-1 min-w-[140px]">
                      <div className="text-xs font-medium text-indigo-400 uppercase tracking-wider">Confidence</div>
                      <div className="text-2xl font-bold text-indigo-700 mt-1">{record.confidence_score}%</div>
                    </div>
                  )}
                  {dataQuality?.kp_name_match && (
                    <div className={`rounded-xl p-4 flex-1 min-w-[140px] ${dataQuality.kp_name_match === 'Y' ? 'bg-emerald-50' : 'bg-slate-50'}`}>
                      <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">KP Name Match</div>
                      <div className={`text-lg font-bold mt-1 ${dataQuality.kp_name_match === 'Y' ? 'text-emerald-700' : 'text-slate-500'}`}>
                        {dataQuality.kp_name_match === 'Y' ? 'Yes' : 'No'}
                      </div>
                    </div>
                  )}
                  {dataQuality?.kp_name_similarity && (
                    <div className="bg-slate-50 rounded-xl p-4 flex-1 min-w-[140px]">
                      <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Name Similarity</div>
                      <div className="text-2xl font-bold text-slate-700 mt-1">{Math.round(parseFloat(dataQuality.kp_name_similarity) * 100)}%</div>
                    </div>
                  )}
                  {dataQuality?.kp_is_accountant && (
                    <div className={`rounded-xl p-4 flex-1 min-w-[140px] ${dataQuality.kp_is_accountant === 'Y' ? 'bg-amber-50' : 'bg-slate-50'}`}>
                      <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">Is Accountant</div>
                      <div className={`text-lg font-bold mt-1 ${dataQuality.kp_is_accountant === 'Y' ? 'text-amber-700' : 'text-slate-500'}`}>
                        {dataQuality.kp_is_accountant === 'Y' ? 'Yes' : 'No'}
                      </div>
                    </div>
                  )}
                </div>

                {/* Score breakdown */}
                {dataQuality?.score_breakdown && (
                  <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                    <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Score Breakdown</div>
                    <div className="flex flex-wrap gap-2">
                      {dataQuality.score_breakdown.split(' | ').map((part, idx) => (
                        <span key={idx} className="inline-flex items-center px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs text-slate-600 font-medium">
                          {part.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CollapsibleSection>
          )}

          {/* ═══════════════════════════════════════════════════════════
              AI NOTES (detailed filing analysis)
             ═══════════════════════════════════════════════════════════ */}
          {record.ai_notes && (
            <CollapsibleSection
              title="Filing Analysis Notes"
              icon={ScrollText}
              iconColor="text-amber-500"
              defaultOpen={false}
              badge={
                <span className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full text-xs font-medium normal-case">
                  <FileText className="w-3 h-3" /> From Filings
                </span>
              }
            >
              <div className="bg-slate-50 rounded-lg p-5 border border-slate-100">
                <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-line max-h-[600px] overflow-y-auto pr-2">
                  {record.ai_notes.replace(/^SECTION\s*\d+\s*\([^)]*\)\s*:\s*/i, '').trim()}
                </div>
              </div>
            </CollapsibleSection>
          )}

          {/* ═══════════════════════════════════════════════════════════
              FILING LINKS
             ═══════════════════════════════════════════════════════════ */}
          {filingLinks && Object.keys(filingLinks).length > 0 && (
            <CollapsibleSection
              title="Filing History Documents"
              icon={FileText}
              iconColor="text-blue-500"
              defaultOpen={false}
              badge={
                <span className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-xs font-medium normal-case">
                  {Object.keys(filingLinks).length} filings
                </span>
              }
            >
              <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-2">
                {Object.entries(filingLinks).map(([desc, url], idx) => {
                  // Parse date from description (e.g. "10 Oct 2023 - SOAS(A) - ...")
                  const parts = desc.split(' - ')
                  const date = parts[0] || ''
                  const type = parts[1] || ''
                  const detail = parts.slice(2).join(' - ') || ''

                  return (
                    <a
                      key={idx}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors group border border-transparent hover:border-slate-200"
                    >
                      <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
                        <Calendar className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-bold text-slate-900">{date}</span>
                          {type && (
                            <span className="inline-flex px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-semibold">
                              {type}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-700 truncate group-hover:text-indigo-700 transition-colors">
                          {detail || desc}
                        </p>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-500 flex-shrink-0 mt-1 transition-colors" />
                    </a>
                  )
                })}
              </div>
            </CollapsibleSection>
          )}

        </div>
      </div>
    </div>
  )
}
