import { memo, useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

export const StatusBadge = memo(function StatusBadge({ status, className = '' }) {
  const isActive = status?.toLowerCase() === 'active'
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-label font-medium ${
      isActive 
        ? 'bg-semantic-success-soft text-semantic-success' 
        : 'bg-subtle text-tertiary'
    } ${className}`}>
      {isActive && <span className="w-1.5 h-1.5 rounded-full bg-semantic-success" />}
      {status || '—'}
    </span>
  )
})

export const ScoreBadge = memo(function ScoreBadge({ score, maxScore = 100, size = 'sm', showLabel = false }) {
  const numScore = parseInt(score) || 0
  const percentage = Math.min((numScore / maxScore) * 100, 100)
  
  let colorClass = 'bg-semantic-danger-soft text-semantic-danger'
  if (percentage >= 60) colorClass = 'bg-semantic-success-soft text-semantic-success'
  else if (percentage >= 40) colorClass = 'bg-semantic-warning-soft text-semantic-warning'
  
  const sizeClass = size === 'lg' ? 'px-3 py-1 text-body-sm' : 'px-2 py-0.5 text-label'
  
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-semibold ${colorClass} ${sizeClass}`}>
      {showLabel && <span className="opacity-70">DQ:</span>}
      {numScore}
    </span>
  )
})

export const GradeBadge = memo(function GradeBadge({ grade, showLabel = false, size = 'sm' }) {
  const g = String(grade || '').trim().toUpperCase()
  if (!['A', 'B', 'C', 'D', 'F'].includes(g)) return null
  
  const labels = { A: 'Excellent', B: 'Good', C: 'Fair', D: 'Poor', F: 'Failing' }
  const sizeClass = size === 'lg' 
    ? 'w-10 h-10 text-lg' 
    : 'w-7 h-7 text-xs'
  
  return (
    <div className="flex items-center gap-2">
      <span className={`inline-flex items-center justify-center rounded-lg font-bold border grade-${g} ${sizeClass}`}>
        {g}
      </span>
      {showLabel && <span className="text-body-sm text-secondary">{labels[g]}</span>}
    </div>
  )
})

export const MetricCard = memo(function MetricCard({ label, value, icon: Icon, trend, className = '' }) {
  return (
    <div className={`card p-4 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-label text-tertiary">{label}</span>
        {Icon && (
          <div className="w-8 h-8 rounded-lg bg-accent-soft flex items-center justify-center">
            <Icon className="w-4 h-4 text-accent" />
          </div>
        )}
      </div>
      <div className="metric-value">{value}</div>
      {trend && (
        <div className={`text-caption mt-1 ${trend > 0 ? 'text-semantic-success' : 'text-semantic-danger'}`}>
          {trend > 0 ? '+' : ''}{trend}%
        </div>
      )}
    </div>
  )
})

export const InfoRow = memo(function InfoRow({ label, value, icon: Icon, link }) {
  if (!value) return null
  
  const content = link ? (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className="text-body text-accent hover:underline"
    >
      {value}
    </a>
  ) : (
    <span className="text-body text-primary">{value}</span>
  )
  
  return (
    <div className="flex items-start gap-3 py-3 border-b border-border-subtle last:border-0">
      {Icon && <Icon className="w-4 h-4 text-tertiary mt-0.5 flex-shrink-0" />}
      <div className="flex-1 min-w-0">
        <div className="text-caption text-muted uppercase tracking-wider mb-0.5">{label}</div>
        {content}
      </div>
    </div>
  )
})

export const Accordion = memo(function Accordion({ 
  title, 
  icon: Icon, 
  badge, 
  defaultOpen = true, 
  children 
}) {
  const [open, setOpen] = useState(defaultOpen)
  
  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 sm:p-5 hover:bg-surface-hover transition-colors duration-150 text-left touch-target"
      >
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-accent" />}
          <span className="section-title">{title}</span>
          {badge}
        </div>
        {open ? (
          <ChevronUp className="w-4 h-4 text-tertiary" />
        ) : (
          <ChevronDown className="w-4 h-4 text-tertiary" />
        )}
      </button>
      {open && (
        <div className="px-4 sm:px-5 pb-4 sm:pb-5 animate-fade-in">
          {children}
        </div>
      )}
    </div>
  )
})

export const EmptyState = memo(function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action 
}) {
  return (
    <div className="text-center py-12 px-4">
      {Icon && (
        <div className="w-16 h-16 rounded-2xl bg-subtle flex items-center justify-center mx-auto mb-4">
          <Icon className="w-8 h-8 text-muted" />
        </div>
      )}
      <h3 className="section-title mb-1">{title}</h3>
      {description && <p className="text-body text-secondary mb-4">{description}</p>}
      {action}
    </div>
  )
})

export const LoadingState = memo(function LoadingState({ message = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      <span className="text-body-sm text-secondary">{message}</span>
    </div>
  )
})

export const Skeleton = memo(function Skeleton({ className = '', ...props }) {
  return (
    <div 
      className={`bg-subtle rounded animate-pulse-subtle ${className}`}
      {...props}
    />
  )
})

export const MobileResultCard = memo(function MobileResultCard({ 
  record, 
  onClick,
  formatDate 
}) {
  return (
    <div 
      onClick={onClick}
      className="card-interactive p-4 touch-target"
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
        <div className="flex items-center justify-between py-2 border-t border-border-subtle">
          <span className="text-caption text-muted">Current Assets</span>
          <span className="text-body-sm font-semibold text-primary tabular-nums">
            {record.current_assets}
          </span>
        </div>
      )}
      
      <div className="flex items-center justify-between pt-2 border-t border-border-subtle text-caption text-muted">
        <span>Updated {formatDate?.(record.data_enrichment_last) || '—'}</span>
        {record.data_quality?.overall_score && (
          <ScoreBadge score={record.data_quality.overall_score} />
        )}
      </div>
    </div>
  )
})

