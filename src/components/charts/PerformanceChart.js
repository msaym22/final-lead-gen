'use client'

import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'

export function PerformanceChart() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30d')

  useEffect(() => {
    // Simulate loading chart data
    setTimeout(() => {
      const generateData = () => {
        const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90
        const data = []
        
        for (let i = days; i >= 0; i--) {
          const date = new Date()
          date.setDate(date.getDate() - i)
          
          data.push({
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            leads: Math.floor(Math.random() * 50) + 20,
            messages: Math.floor(Math.random() * 30) + 10,
            responses: Math.floor(Math.random() * 8) + 2,
            responseRate: Math.floor(Math.random() * 20) + 5
          })
        }
        
        return data
      }
      
      setData(generateData())
      setLoading(false)
    }, 500)
  }, [timeRange])

  if (loading) {
    return (
      <div className="w-full h-80 flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    )
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background-secondary border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
              {entry.name === 'Response Rate' ? '%' : ''}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="w-full">
      <div className="mb-4 flex gap-2">
        {['7d', '30d', '90d'].map(range => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              timeRange === range 
                ? 'bg-primary-600 text-white' 
                : 'bg-background-tertiary text-foreground-muted hover:text-foreground'
            }`}
          >
            {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
          <XAxis 
            dataKey="date" 
            stroke="#a1a1aa"
            fontSize={12}
            tickLine={false}
          />
          <YAxis 
            stroke="#a1a1aa"
            fontSize={12}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line 
            type="monotone" 
            dataKey="leads" 
            stroke="#3b82f6" 
            strokeWidth={2}
            name="Leads"
            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
          />
          <Line 
            type="monotone" 
            dataKey="messages" 
            stroke="#10b981" 
            strokeWidth={2}
            name="Messages"
            dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
          />
          <Line 
            type="monotone" 
            dataKey="responses" 
            stroke="#f59e0b" 
            strokeWidth={2}
            name="Responses"
            dot={{ fill: '#f59e0b', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#f59e0b', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Performance Summary */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-400">
            {data.reduce((sum, d) => sum + d.leads, 0)}
          </p>
          <p className="text-sm text-foreground-muted">Total Leads</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-green-400">
            {data.reduce((sum, d) => sum + d.messages, 0)}
          </p>
          <p className="text-sm text-foreground-muted">Messages Sent</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-yellow-400">
            {data.reduce((sum, d) => sum + d.responses, 0)}
          </p>
          <p className="text-sm text-foreground-muted">Responses</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-purple-400">
            {Math.round(
              data.reduce((sum, d) => sum + d.responseRate, 0) / data.length
            )}%
          </p>
          <p className="text-sm text-foreground-muted">Avg Response Rate</p>
        </div>
      </div>
    </div>
  )
}