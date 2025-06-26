'use client'

import { useState, useEffect } from 'react'
import { Play, Pause, MoreHorizontal, Target } from 'lucide-react'

export function CampaignOverview() {
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate loading campaigns
    setTimeout(() => {
      setCampaigns([
        {
          id: 1,
          name: 'SaaS Startup Outreach',
          industry: 'SaaS',
          status: 'active',
          leadsGenerated: 147,
          responseRate: 12.3,
          targetDaily: 25,
          progress: 68
        },
        {
          id: 2,
          name: 'E-commerce Growth',
          industry: 'E-commerce',
          status: 'active',
          leadsGenerated: 89,
          responseRate: 8.7,
          targetDaily: 20,
          progress: 45
        },
        {
          id: 3,
          name: 'Healthcare Marketing',
          industry: 'Healthcare',
          status: 'paused',
          leadsGenerated: 203,
          responseRate: 15.2,
          targetDaily: 30,
          progress: 85
        }
      ])
      setLoading(false)
    }, 800)
  }, [])

  if (loading) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Active Campaigns</h3>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse">
              <div className="h-6 bg-background-tertiary rounded mb-2"></div>
              <div className="h-4 bg-background-tertiary rounded mb-2"></div>
              <div className="h-2 bg-background-tertiary rounded"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Active Campaigns</h3>
        <button className="btn-primary text-sm">New Campaign</button>
      </div>
      
      <div className="space-y-4">
        {campaigns.map(campaign => (
          <div key={campaign.id} className="border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary-400" />
                  <h4 className="font-medium">{campaign.name}</h4>
                </div>
                <span className={`badge ${
                  campaign.status === 'active' ? 'badge-success' : 'badge-warning'
                }`}>
                  {campaign.status}
                </span>
              </div>
              <button className="p-1 hover:bg-background-tertiary rounded">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mb-3">
              <div>
                <p className="text-xs text-foreground-muted">Leads</p>
                <p className="font-semibold">{campaign.leadsGenerated}</p>
              </div>
              <div>
                <p className="text-xs text-foreground-muted">Response Rate</p>
                <p className="font-semibold text-accent-400">{campaign.responseRate}%</p>
              </div>
              <div>
                <p className="text-xs text-foreground-muted">Daily Target</p>
                <p className="font-semibold">{campaign.targetDaily}</p>
              </div>
            </div>
            
            <div className="mb-3">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-foreground-muted">Progress</span>
                <span className="text-foreground">{campaign.progress}%</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${campaign.progress}%` }}
                ></div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button className={`p-2 rounded-lg ${
                campaign.status === 'active' 
                  ? 'hover:bg-yellow-600/20 text-yellow-400' 
                  : 'hover:bg-green-600/20 text-green-400'
              }`}>
                {campaign.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              <span className="text-sm text-foreground-muted">{campaign.industry} Industry</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}