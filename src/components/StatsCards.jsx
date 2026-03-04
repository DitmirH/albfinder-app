import { useMemo } from 'react'
import { Building2, Users, Search } from 'lucide-react'

export default function StatsCards({ data, stats: statsFromApi }) {
  const stats = useMemo(() => {
    if (statsFromApi) {
      return [
        { label: 'Total Records', value: (statsFromApi.totalCount ?? 0).toLocaleString(), icon: Users, bgColor: 'bg-indigo-50', textColor: 'text-indigo-600' },
        { label: 'Unique Companies', value: (statsFromApi.uniqueCompanies ?? 0).toLocaleString(), icon: Building2, bgColor: 'bg-emerald-50', textColor: 'text-emerald-600' },
        { label: 'Unique Directors', value: (statsFromApi.uniqueDirectors ?? 0).toLocaleString(), icon: Users, bgColor: 'bg-amber-50', textColor: 'text-amber-600' },
        { label: 'Enriched', value: (statsFromApi.enrichedCount ?? 0).toLocaleString(), icon: Search, bgColor: 'bg-violet-50', textColor: 'text-violet-600' },
      ]
    }
    const uniqueCompanies = new Set(data.map(r => r.company_number)).size
    const uniqueDirectors = new Set(data.map(r => r.director_name)).size
    const enrichedCount = data.filter(r => r.data_enrichment_last).length

    return [
      {
        label: 'Total Records',
        value: data.length.toLocaleString(),
        icon: Users,
        bgColor: 'bg-indigo-50',
        textColor: 'text-indigo-600',
      },
      {
        label: 'Unique Companies',
        value: uniqueCompanies.toLocaleString(),
        icon: Building2,
        bgColor: 'bg-emerald-50',
        textColor: 'text-emerald-600',
      },
      {
        label: 'Unique Directors',
        value: uniqueDirectors.toLocaleString(),
        icon: Users,
        bgColor: 'bg-amber-50',
        textColor: 'text-amber-600',
      },
      {
        label: 'Enriched',
        value: enrichedCount.toLocaleString(),
        icon: Search,
        bgColor: 'bg-violet-50',
        textColor: 'text-violet-600',
      },
    ]
  }, [data, statsFromApi])

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <div
          key={stat.label}
          className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm animate-fade-in"
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

