'use client'

import { useState, useEffect } from 'react'
import { Clock, User, MessageSquare, TrendingUp } from 'lucide-react'

export function RecentActivity() {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate loading recent activities
    setTimeout(() => {
      setActivities([
        {
          id: 1,
          type: 'lead',
          title: 'New lead discovered',
          description: 'TechStart Solutions - High opportunity score (85)',
          time: '2 minutes ago',
          icon: User,
          color: 'text-blue-400'
        },
        {
          id: 2,
          type: 'message',
          title: 'Message generated',
          description: 'Personalized outreach for GrowthCo Marketing',
          time: '5 minutes ago',
          icon: MessageSquare,
          color: 'text-green-400'
        },
        {
          id: 3,
          type: 'insight',
          title: 'AI insight generated',
          description: 'SaaS industry trends updated with 15 new strategies',
          time: '12 minutes ago',
          icon: TrendingUp,
          color: 'text-purple-400'
        },
        {
          id: 4,
          type: 'lead',
          title: 'Lead qualified',
          description: 'MarketingPro Inc - Website analysis completed',
          time: '25 minutes ago',
          icon: User,
          color: 'text-blue-400'
        }
      ])
      setLoading(false)
    }, 1000)
  }, [])

  if (loading) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-8 h-8 bg-background-tertiary rounded-lg"></div>
              <div className="flex-1">
                <div className="h-4 bg-background-tertiary rounded mb-2"></div>
                <div className="h-3 bg-background-tertiary rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
      <div className="space-y-4">
        {activities.map(activity => {
          const Icon = activity.icon
          return (
            <div key={activity.id} className="flex items-start gap-3 p-3 hover:bg-background-tertiary rounded-lg transition-colors">
              <div className={`${activity.color} bg-background-tertiary p-2 rounded-lg`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground">{activity.title}</p>
                <p className="text-sm text-foreground-muted">{activity.description}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Clock className="w-3 h-3 text-foreground-muted" />
                  <span className="text-xs text-foreground-muted">{activity.time}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      <button className="w-full mt-4 text-sm text-primary-400 hover:text-primary-300 transition-colors">
        View all activity
      </button>
    </div>
  )
}