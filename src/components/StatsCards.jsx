import { useMemo, memo } from 'react'
import { Building2, Users, Search, TrendingUp } from 'lucide-react'

export default memo(function StatsCards({ data, stats: statsFromApi }) {
  const stats = useMemo(() => {
    if (statsFromApi) {
      return [
        { label: 'Total Records', value: (statsFromApi.totalCount ?? 0).toLocaleString(), icon: Users, color: 'accent' },
        { label: 'Companies', value: (statsFromApi.uniqueCompanies ?? 0).toLocaleString(), icon: Building2, color: 'info' },
        { label: 'Directors', value: (statsFromApi.uniqueDirectors ?? 0).toLocaleString(), icon: Users, color: 'success' },
        { label: 'Enriched', value: (statsFromApi.enrichedCount ?? 0).toLocaleString(), icon: Search, color: 'warning' },
      ]
    }
    const uniqueCompanies = new Set(data.map(r => r.company_number)).size
    const uniqueDirectors = new Set(data.map(r => r.director_name)).size
    const enrichedCount = data.filter(r => r.data_enrichment_last).length

    return [
      { label: 'Total Records', value: data.length.toLocaleString(), icon: Users, color: 'accent' },
      { label: 'Companies', value: uniqueCompanies.toLocaleString(), icon: Building2, color: 'info' },
      { label: 'Directors', value: uniqueDirectors.toLocaleString(), icon: Users, color: 'success' },
      { label: 'Enriched', value: enrichedCount.toLocaleString(), icon: Search, color: 'warning' },
    ]
  }, [data, statsFromApi])

  const colorMap = {
    accent: { bg: 'bg-accent-soft', icon: 'text-accent', dark: 'dark:bg-accent-dark-soft dark:text-accent-dark' },
    info: { bg: 'bg-semantic-info-soft', icon: 'text-semantic-info', dark: 'dark:bg-semantic-dark-info-soft dark:text-semantic-dark-info' },
    success: { bg: 'bg-semantic-success-soft', icon: 'text-semantic-success', dark: 'dark:bg-semantic-dark-success-soft dark:text-semantic-dark-success' },
    warning: { bg: 'bg-semantic-warning-soft', icon: 'text-semantic-warning', dark: 'dark:bg-semantic-dark-warning-soft dark:text-semantic-dark-warning' },
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {stats.map((stat, i) => {
        const colors = colorMap[stat.color] || colorMap.accent
        return (
          <div
            key={stat.label}
            className="bg-surface border border-border-subtle rounded-card p-3 sm:p-4 transition-all duration-150 hover:shadow-card-hover animate-fade-in"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className={`p-2 rounded-lg ${colors.bg}`}>
                <stat.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${colors.icon}`} />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-primary tabular-nums">
              {stat.value}
            </div>
            <div className="text-caption sm:text-body-sm text-secondary mt-0.5">{stat.label}</div>
          </div>
        )
      })}
    </div>
  )
})
