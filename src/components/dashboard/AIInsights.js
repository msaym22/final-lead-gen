'use client'

import { useState, useEffect } from 'react'
import { Brain, Lightbulb, TrendingUp, AlertCircle } from 'lucide-react'

export function AIInsights() {
  const [insights, setInsights] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate loading AI insights
    setTimeout(() => {
      setInsights([
        {
          id: 1,
          type: 'strategy',
          title: 'SaaS Outreach Optimization',
          description: 'ROI-focused messages show 23% higher response rates',
          confidence: 92,
          icon: TrendingUp,
          color: 'text-green-400'
        },
        {
          id: 2,
          type: 'timing',
          title: 'Optimal Send Times',
          description: 'Tuesday 10-11 AM performs 18% better for your industry',
          confidence: 87,
          icon: Lightbulb,
          color: 'text-yellow-400'
        },
        {
          id: 3,
          type: 'warning',
          title: 'Market Saturation Alert',
          description: 'E-commerce leads becoming more competitive',
          confidence: 78,
          icon: AlertCircle,
          color: 'text-orange-400'
        }
      ])
      setLoading(false)
    }, 1200)
  }, [])

  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-5 h-5 text-secondary-400" />
          <h3 className="text-lg font-semibold">AI Insights</h3>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse">
              <div className="h-5 bg-background-tertiary rounded mb-2"></div>
              <div className="h-4 bg-background-tertiary rounded"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-5 h-5 text-secondary-400" />
        <h3 className="text-lg font-semibold">AI Insights</h3>
      </div>
      
      <div className="space-y-4">
        {insights.map(insight => {
          const Icon = insight.icon
          return (
            <div key={insight.id} className="p-3 bg-background-tertiary rounded-lg">
              <div className="flex items-start gap-3">
                <div className={`${insight.color} p-1`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm">{insight.title}</h4>
                  <p className="text-xs text-foreground-muted mt-1">{insight.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="progress-bar flex-1 h-1">
                      <div 
                        className="progress-fill h-1" 
                        style={{ width: `${insight.confidence}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-foreground-muted">{insight.confidence}%</span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      
      <button className="w-full mt-4 text-sm text-secondary-400 hover:text-secondary-300 transition-colors">
        View all insights
      </button>
    </div>
  )
}