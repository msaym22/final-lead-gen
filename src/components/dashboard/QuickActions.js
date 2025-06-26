'use client'

import { Plus, Search, MessageSquare, BarChart3, RefreshCw } from 'lucide-react'

export function QuickActions() {
  const actions = [
    {
      title: 'New Campaign',
      description: 'Start AI lead generation',
      icon: Plus,
      color: 'bg-primary-600 hover:bg-primary-700',
      onClick: () => console.log('New campaign')
    },
    {
      title: 'Discover Leads',
      description: 'Find new opportunities',
      icon: Search,
      color: 'bg-green-600 hover:bg-green-700',
      onClick: () => console.log('Discover leads')
    },
    {
      title: 'Generate Messages',
      description: 'Create outreach content',
      icon: MessageSquare,
      color: 'bg-purple-600 hover:bg-purple-700',
      onClick: () => console.log('Generate messages')
    },
    {
      title: 'View Analytics',
      description: 'Check performance',
      icon: BarChart3,
      color: 'bg-orange-600 hover:bg-orange-700',
      onClick: () => console.log('View analytics')
    },
    {
      title: 'Refresh Data',
      description: 'Update AI insights',
      icon: RefreshCw,
      color: 'bg-blue-600 hover:bg-blue-700',
      onClick: () => console.log('Refresh data')
    }
  ]

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
      <div className="space-y-3">
        {actions.map((action, index) => {
          const Icon = action.icon
          return (
            <button
              key={index}
              onClick={action.onClick}
              className={`w-full ${action.color} text-white p-3 rounded-lg transition-colors duration-200 flex items-center gap-3 text-left`}
            >
              <Icon className="w-5 h-5" />
              <div>
                <div className="font-medium">{action.title}</div>
                <div className="text-sm opacity-90">{action.description}</div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}