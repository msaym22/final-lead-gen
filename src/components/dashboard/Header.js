'use client'

import { useState, useEffect } from 'react'
import { Search, Bell, Play, Pause, RefreshCw } from 'lucide-react'

export function Header() {
  const [searchQuery, setSearchQuery] = useState('')
  const [notifications, setNotifications] = useState([])
  const [systemStatus, setSystemStatus] = useState('running')
  const [lastUpdate, setLastUpdate] = useState(null) // Start with null
  const [mounted, setMounted] = useState(false) // Track if component is mounted

  useEffect(() => {
    setMounted(true) // Set mounted to true after component mounts
    setLastUpdate(new Date()) // Set initial time

    // Update timestamp every minute
    const interval = setInterval(() => {
      setLastUpdate(new Date())
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    console.log('Searching for:', searchQuery)
  }

  const toggleSystem = () => {
    setSystemStatus(prev => prev === 'running' ? 'paused' : 'running')
  }

  const refreshData = async () => {
    setLastUpdate(new Date())
  }

  // Don't render time until component is mounted to avoid hydration mismatch
  const displayTime = mounted && lastUpdate ? lastUpdate.toLocaleTimeString() : '--:--:--'

  return (
    <header className="bg-background-secondary border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Search */}
        <div className="flex-1 max-w-md">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-foreground-muted" />
            <input
              type="text"
              placeholder="Search leads, campaigns, messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-10 w-full"
            />
          </form>
        </div>

        {/* Status & Controls */}
        <div className="flex items-center gap-4">
          {/* System Status */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              systemStatus === 'running' 
                ? 'bg-accent-500 animate-pulse' 
                : 'bg-yellow-500'
            }`}></div>
            <span className="text-sm text-foreground-secondary">
              {systemStatus === 'running' ? 'Active' : 'Paused'}
            </span>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleSystem}
              className={`p-2 rounded-lg transition-colors ${
                systemStatus === 'running'
                  ? 'hover:bg-yellow-600/20 text-yellow-400'
                  : 'hover:bg-accent-600/20 text-accent-400'
              }`}
              title={systemStatus === 'running' ? 'Pause System' : 'Start System'}
            >
              {systemStatus === 'running' ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </button>

            <button
              onClick={refreshData}
              className="p-2 rounded-lg hover:bg-background-tertiary text-foreground-muted hover:text-foreground transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Notifications */}
          <div className="relative">
            <button className="p-2 rounded-lg hover:bg-background-tertiary text-foreground-muted hover:text-foreground transition-colors relative">
              <Bell className="w-5 h-5" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full text-xs flex items-center justify-center text-white">
                  {notifications.length}
                </span>
              )}
            </button>
          </div>

          {/* Last Update */}
          <div className="text-xs text-foreground-muted">
            Last sync: {displayTime}
          </div>
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div className="mt-4 flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-foreground-muted">Today:</span>
          <span className="font-medium text-accent-400">47 leads</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-foreground-muted">Response rate:</span>
          <span className="font-medium text-accent-400">12.3%</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-foreground-muted">AI insights:</span>
          <span className="font-medium text-secondary-400">23 new</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-foreground-muted">Active campaigns:</span>
          <span className="font-medium text-primary-400">5</span>
        </div>
      </div>
    </header>
  )
}