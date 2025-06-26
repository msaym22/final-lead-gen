'use client'

import { useState, useEffect } from 'react'
import { useStoreInitialization, useAnalytics, useSyncStatus } from '@/lib/hooks/useStorage'
import appStore from '@/lib/store'
import { DashboardStats } from '@/components/dashboard/DashboardStats'
import { RecentActivity } from '@/components/dashboard/RecentActivity'
import { CampaignOverview } from '@/components/dashboard/CampaignOverview'
import { AIInsights } from '@/components/dashboard/AIInsights'
import { QuickActions } from '@/components/dashboard/QuickActions'
import { PerformanceChart } from '@/components/charts/PerformanceChart'

export default function Dashboard() {
  // Add mounted state to prevent hydration issues
  const [mounted, setMounted] = useState(false)
  
  // Use store initialization hook to ensure store is ready
  const isStoreReady = useStoreInitialization()
  const { analytics, isLoaded: analyticsLoaded } = useAnalytics()
  const { isSyncing, lastSync } = useSyncStatus()
  
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalLeads: 0,
      responseRate: 0,
      activeCampaigns: 0,
      totalMessages: 0,
      avgLeadScore: 0,
      totalCostSpent: 0,
      verifiedLeads: 0,
      tier1Leads: 0,
      videosGenerated: 0,
      professionalCampaigns: 0,
      youtubeQuotaUsed: 0
    },
    loading: true,
    error: null
  })

  // Set mounted state after component mounts
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || !isStoreReady) return

    const initializeDashboard = async () => {
      try {
        // Get initial data from store
        const storeData = appStore.getData()
        
        setDashboardData({
          stats: storeData.analytics || dashboardData.stats,
          loading: false,
          error: null
        })

        // Subscribe to store updates
        const unsubscribe = appStore.subscribe((data) => {
          setDashboardData(prev => ({
            ...prev,
            stats: data.analytics || prev.stats,
            loading: false,
            error: null
          }))
        })

        return unsubscribe
      } catch (error) {
        console.error('Dashboard initialization error:', error)
        setDashboardData(prev => ({
          ...prev,
          loading: false,
          error: 'Failed to load dashboard data'
        }))
      }
    }

    const unsubscribe = initializeDashboard()
    
    // Cleanup subscription on unmount
    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe()
      }
    }
  }, [mounted, isStoreReady])

  // Don't render anything during SSR to prevent hydration mismatch
  if (!mounted) {
    return null
  }

  // Show loading state while store is initializing
  if (!isStoreReady || dashboardData.loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-500 mx-auto"></div>
          <div className="space-y-2">
            <p className="text-lg font-medium">Loading Dashboard...</p>
            <p className="text-sm text-foreground-muted">
              Initializing your lead generation system...
            </p>
            {isSyncing && (
              <p className="text-xs text-accent-400 flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-accent-400 rounded-full animate-pulse"></div>
                Syncing with database...
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Show error state if data loading failed
  if (dashboardData.error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-red-600">Dashboard Error</h2>
            <p className="text-foreground-muted mt-2">{dashboardData.error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
              Reload Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-600/20 to-secondary-600/20 rounded-xl p-6 border border-border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent">
              Welcome back, Muhammad Saim
            </h1>
            <p className="text-foreground-muted mt-2">
              Your AI-powered lead generation system is working 24/7 to grow your business
            </p>
            {/* Sync Status Indicator */}
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-2 text-xs">
                <div className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`}></div>
                <span className="text-foreground-muted">
                  {isSyncing ? 'Syncing...' : 'Data synchronized'}
                </span>
              </div>
              {lastSync && (
                <div className="text-xs text-foreground-muted">
                  Last sync: {lastSync.toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>
          <div className="hidden md:block">
            <div className="bg-background-secondary rounded-lg p-4">
              <div className="text-sm text-foreground-muted">Today's Performance</div>
              <div className="text-2xl font-bold text-accent-400">
                {dashboardData.stats.responseRate || 0}%
              </div>
              <div className="text-xs text-foreground-muted">Response Rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <DashboardStats 
        stats={dashboardData.stats} 
        loading={!analyticsLoaded} 
      />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          {/* Performance Chart */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Performance Overview</h2>
              {isSyncing && (
                <div className="flex items-center gap-2 text-sm text-foreground-muted">
                  <div className="w-3 h-3 border-2 border-accent-400 border-t-transparent rounded-full animate-spin"></div>
                  <span>Updating...</span>
                </div>
              )}
            </div>
            <PerformanceChart />
          </div>

          {/* Campaign Overview */}
          <CampaignOverview />

          {/* Recent Activity */}
          <RecentActivity />
        </div>

        {/* Right Column - 1/3 width */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <QuickActions />

          {/* AI Insights */}
          <AIInsights />

          {/* Enhanced System Status */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">System Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-foreground-secondary">AI Research</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-accent-500 rounded-full animate-pulse"></div>
                  <span className="text-accent-400 text-sm">Active</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-foreground-secondary">Lead Discovery</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-accent-500 rounded-full animate-pulse"></div>
                  <span className="text-accent-400 text-sm">Running</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-foreground-secondary">Database</span>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-yellow-400 animate-pulse' : 'bg-accent-500'}`}></div>
                  <span className="text-accent-400 text-sm">
                    {isSyncing ? 'Syncing' : 'Connected'}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-foreground-secondary">Data Storage</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-accent-500 rounded-full"></div>
                  <span className="text-accent-400 text-sm">
                    {isStoreReady ? 'Ready' : 'Loading'}
                  </span>
                </div>
              </div>
              
              {/* Storage Stats */}
              <div className="pt-3 border-t border-border mt-4">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="text-center">
                    <div className="font-medium text-foreground">
                      {dashboardData.stats.totalLeads || 0}
                    </div>
                    <div className="text-foreground-muted">Total Leads</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-foreground">
                      {dashboardData.stats.activeCampaigns || 0}
                    </div>
                    <div className="text-foreground-muted">Active</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* YouTube Integration Status */}
          {dashboardData.stats.youtubeQuotaUsed > 0 && (
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">YouTube Research</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-foreground-secondary">Quota Used</span>
                  <span className="text-accent-400 text-sm">
                    {dashboardData.stats.youtubeQuotaUsed}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-foreground-secondary">Videos Generated</span>
                  <span className="text-accent-400 text-sm">
                    {dashboardData.stats.videosGenerated || 0}
                  </span>
                </div>
                <div className="w-full bg-background-secondary rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-primary-400 to-secondary-400 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${Math.min((dashboardData.stats.youtubeQuotaUsed / 10000) * 100, 100)}%` 
                    }}
                  ></div>
                </div>
                <div className="text-xs text-foreground-muted text-center">
                  Daily quota usage
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}