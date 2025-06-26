'use client'

import { TrendingUp, Users, MessageSquare, Brain } from 'lucide-react'

export function DashboardStats({ stats, loading }) {
  const statItems = [
    {
      title: 'Total Leads',
      value: stats.totalLeads || 0,
      change: '+12%',
      icon: Users,
      color: 'text-blue-400',
      bgColor: 'bg-blue-600/10'
    },
    {
      title: 'Response Rate',
      value: `${stats.responseRate || 0}%`,
      change: '+2.1%',
      icon: TrendingUp,
      color: 'text-green-400',
      bgColor: 'bg-green-600/10'
    },
    {
      title: 'Active Campaigns',
      value: stats.activeCampaigns || 0,
      change: '+1',
      icon: MessageSquare,
      color: 'text-purple-400',
      bgColor: 'bg-purple-600/10'
    },
    {
      title: 'AI Insights',
      value: stats.aiInsights || 0,
      change: '+5',
      icon: Brain,
      color: 'text-orange-400',
      bgColor: 'bg-orange-600/10'
    }
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="card animate-pulse">
            <div className="h-4 bg-background-tertiary rounded mb-4"></div>
            <div className="h-8 bg-background-tertiary rounded mb-2"></div>
            <div className="h-3 bg-background-tertiary rounded w-16"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statItems.map((item, index) => {
        const Icon = item.icon
        return (
          <div key={index} className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-foreground-muted text-sm">{item.title}</p>
                <p className="text-2xl font-bold text-foreground mt-1">{item.value}</p>
                <p className="text-accent-400 text-sm mt-1">{item.change} from last month</p>
              </div>
              <div className={`${item.bgColor} ${item.color} p-3 rounded-lg`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}