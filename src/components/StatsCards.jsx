import { useMemo } from 'react'
import { Building2, Users, TrendingUp, Shield } from 'lucide-react'

export default function StatsCards({ data }) {
  const stats = useMemo(() => {
    const uniqueCompanies = new Set(data.map(r => r.company_number)).size
    const uniqueDirectors = new Set(data.map(r => r.director_name)).size
    const withFinancials = data.filter(r => r.financial_health_grade).length
    const avgScore = data.reduce((sum, r) => {
      const score = parseInt(r.financial_health_score)
      return !isNaN(score) ? sum + score : sum
    }, 0) / (withFinancials || 1)

    return [
      {
        label: 'Total Records',
        value: data.length,
        icon: Users,
        color: 'from-indigo-500 to-indigo-600',
        bgColor: 'bg-indigo-50',
        textColor: 'text-indigo-600',
      },
      {
        label: 'Unique Companies',
        value: uniqueCompanies,
        icon: Building2,
        color: 'from-emerald-500 to-emerald-600',
        bgColor: 'bg-emerald-50',
        textColor: 'text-emerald-600',
      },
      {
        label: 'Unique Directors',
        value: uniqueDirectors,
        icon: Users,
        color: 'from-amber-500 to-amber-600',
        bgColor: 'bg-amber-50',
        textColor: 'text-amber-600',
      },
      {
        label: 'Avg Health Score',
        value: Math.round(avgScore),
        icon: TrendingUp,
        color: 'from-rose-500 to-rose-600',
        bgColor: 'bg-rose-50',
        textColor: 'text-rose-600',
        suffix: '/100',
      },
    ]
  }, [data])

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <div
          key={stat.label}
          className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm animate-fade-in"
          style={{ animationDelay: `${i * 50}ms` }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`w-5 h-5 ${stat.textColor}`} />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {stat.value}
            {stat.suffix && <span className="text-sm font-normal text-slate-400 ml-0.5">{stat.suffix}</span>}
          </div>
          <div className="text-sm text-slate-500 mt-0.5">{stat.label}</div>
        </div>
      ))}
    </div>
  )
}

