'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Target, 
  Users, 
  MessageSquare, 
  BarChart3, 
  Brain, 
  Settings, 
  Zap,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

const navigationItems = [
  { title: 'Dashboard', href: '/', icon: LayoutDashboard },
  { title: 'Campaigns', href: '/dashboard/campaigns', icon: Target },
  { title: 'Leads', href: '/dashboard/leads', icon: Users },
  { title: 'Messages', href: '/dashboard/messages', icon: MessageSquare },
  { title: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { title: 'AI Research', href: '/dashboard/research', icon: Brain }
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  const isActive = (href) => {
    if (href === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(href)
  }

  return (
    <div className={`
      ${collapsed ? 'w-16' : 'w-64'} 
      bg-background-secondary border-r border-border flex flex-col transition-all duration-300
    `}>
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg">AI Lead Gen</h1>
                <p className="text-xs text-foreground-muted">Smart Automation</p>
              </div>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 hover:bg-background-tertiary rounded-lg transition-colors"
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  ${active ? 'sidebar-item-active' : 'sidebar-item'}
                  ${collapsed ? 'justify-center px-2' : ''}
                  group relative
                `}
                title={collapsed ? item.title : ''}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && (
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{item.title}</div>
                    <div className="text-xs text-foreground-muted truncate">
                      {item.description}
                    </div>
                  </div>
                )}
                
                {/* Tooltip for collapsed state */}
                {collapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-background-tertiary text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                    {item.title}
                  </div>
                )}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Status Indicator */}
      <div className="p-4 border-t border-border">
        {!collapsed ? (
          <div className="bg-background-tertiary rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-accent-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">System Active</span>
            </div>
            <div className="text-xs text-foreground-muted">
              AI researching 3 industries
            </div>
            <div className="text-xs text-foreground-muted">
              Processing 127 leads
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-2 h-2 bg-accent-500 rounded-full animate-pulse"></div>
          </div>
        )}
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-border">
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-secondary rounded-full flex items-center justify-center">
              <span className="text-white font-medium text-sm">
                {process.env.NEXT_PUBLIC_YOUR_NAME?.charAt(0) || 'M'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">
                {process.env.NEXT_PUBLIC_YOUR_NAME || 'Muhammad Saim'}
              </div>
              <div className="text-xs text-foreground-muted">
                Marketing Expert
              </div>
            </div>
            <Settings className="w-4 h-4 text-foreground-muted hover:text-foreground cursor-pointer" />
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-8 h-8 bg-gradient-secondary rounded-full flex items-center justify-center">
              <span className="text-white font-medium text-sm">
                {process.env.NEXT_PUBLIC_YOUR_NAME?.charAt(0) || 'M'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}