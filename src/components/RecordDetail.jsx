import { useEffect } from 'react'
import {
  X, ExternalLink, Building2, Users, MapPin, Calendar,
  CreditCard, TrendingUp, Hash, Briefcase, Globe, FileText
} from 'lucide-react'

const gradeInfo = {
  'A': { label: 'Excellent', color: 'bg-emerald-500', textColor: 'text-emerald-700', bgColor: 'bg-emerald-50' },
  'B': { label: 'Good', color: 'bg-blue-500', textColor: 'text-blue-700', bgColor: 'bg-blue-50' },
  'C': { label: 'Fair', color: 'bg-yellow-500', textColor: 'text-yellow-700', bgColor: 'bg-yellow-50' },
  'D': { label: 'Poor', color: 'bg-orange-500', textColor: 'text-orange-700', bgColor: 'bg-orange-50' },
  'F': { label: 'Failing', color: 'bg-red-500', textColor: 'text-red-700', bgColor: 'bg-red-50' },
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

export default function RecordDetail({ record, onClose }) {
  const grade = gradeInfo[record.financial_health_grade]
  const score = parseInt(record.financial_health_score)

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEscape)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[5vh]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-slide-up">
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-slate-200 px-6 py-4 flex items-start justify-between z-10 rounded-t-2xl">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{record.director_name}</h2>
            <p className="text-sm text-slate-500 mt-0.5">{record.company_name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* Health Score Banner */}
          {grade && (
            <div className={`${grade.bgColor} rounded-xl p-4 flex items-center gap-4`}>
              <div className={`w-14 h-14 ${grade.color} rounded-xl flex items-center justify-center text-white text-2xl font-bold shadow-lg`}>
                {record.financial_health_grade}
              </div>
              <div className="flex-1">
                <div className={`text-sm font-semibold ${grade.textColor}`}>
                  Financial Health: {grade.label}
                </div>
                {!isNaN(score) && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className={grade.textColor}>Score</span>
                      <span className={`font-bold ${grade.textColor}`}>{score}/100</span>
                    </div>
                    <div className="w-full h-2 bg-white/60 rounded-full overflow-hidden">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Company Info */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2">
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
                <FieldRow label="Charges" value={record.company_charges} />
                <FieldRow label="Accounts Type" value={record.accounts_type} />
                <FieldRow label="Accounts Next Due" value={record.accounts_next_due} icon={Calendar} />
                <FieldRow label="Accounts Last Made Up" value={record.accounts_last_made_up_to} />
              </div>
            </div>

            {/* Director Info */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2">
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

              {/* Links section */}
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
              </div>
            </div>
          </div>

          {/* Financial Data */}
          {record.period_end_date && (
            <div>
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-indigo-500" /> Financial Data
                <span className="text-xs font-normal text-slate-400 normal-case">(Period ending {record.period_end_date})</span>
              </h3>
              <div className="bg-slate-50 rounded-xl p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                  <div>
                    <FinancialRow label="Turnover (Revenue)" value={record.turnover} />
                    <FinancialRow label="Gross Profit" value={record.gross_profit} />
                    <FinancialRow label="Operating Profit" value={record.operating_profit} />
                    <FinancialRow label="Profit Before Tax" value={record.profit_before_tax} />
                    <FinancialRow label="Net Profit/Loss" value={record.net_profit_loss} />
                    <FinancialRow label="EBITDA" value={record.ebitda} />
                  </div>
                  <div>
                    <FinancialRow label="Net Assets" value={record.net_assets} />
                    <FinancialRow label="Total Assets" value={record.total_assets} />
                    <FinancialRow label="Current Assets" value={record.current_assets} />
                    <FinancialRow label="Fixed Assets" value={record.fixed_assets} />
                    <FinancialRow label="Cash at Bank" value={record.cash_at_bank} />
                    <FinancialRow label="Working Capital" value={record.working_capital} />
                    <FinancialRow label="Debtors" value={record.debtors} />
                    <FinancialRow label="Creditors (Within 1yr)" value={record.creditors_due_within_one_year} />
                    <FinancialRow label="Share Capital" value={record.share_capital} />
                  </div>
                </div>
                {record.average_number_of_employees && (
                  <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between">
                    <span className="text-sm text-slate-500">Average Employees</span>
                    <span className="text-sm font-semibold text-slate-900">{record.average_number_of_employees}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

