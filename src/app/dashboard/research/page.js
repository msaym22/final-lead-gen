'use client'

import { useState, useEffect } from 'react'
import { Brain, Search, Play, Video, BookOpen, TrendingUp, Lightbulb } from 'lucide-react'
import { appStore } from '@/lib/store'

export default function ResearchPage() {
  const [industry, setIndustry] = useState('')
  const [researching, setResearching] = useState(false)
  const [researchResults, setResearchResults] = useState([])
  const [recentResearch, setRecentResearch] = useState([])
  const [insights, setInsights] = useState([])

  useEffect(() => {
    // Load initial research data
    loadRecentResearch()
    loadInsights()
  }, [])

  const loadRecentResearch = () => {
    setRecentResearch([
      {
        id: 1,
        industry: 'SaaS',
        videosAnalyzed: 45,
        strategiesFound: 23,
        painPointsIdentified: 18,
        completedAt: new Date('2024-01-20'),
        status: 'completed'
      },
      {
        id: 2,
        industry: 'E-commerce',
        videosAnalyzed: 38,
        strategiesFound: 19,
        painPointsIdentified: 15,
        completedAt: new Date('2024-01-18'),
        status: 'completed'
      },
      {
        id: 3,
        industry: 'Healthcare',
        videosAnalyzed: 42,
        strategiesFound: 21,
        painPointsIdentified: 16,
        completedAt: new Date('2024-01-15'),
        status: 'completed'
      }
    ])
  }

  const loadInsights = () => {
    setInsights([
      {
        id: 1,
        title: 'ROI-focused messages show 23% higher response rates',
        description: 'Analysis of 150+ SaaS marketing videos reveals ROI messaging performs best',
        industry: 'SaaS',
        confidence: 92,
        source: 'YouTube Research',
        type: 'strategy'
      },
      {
        id: 2,
        title: 'Tuesday 10-11 AM performs 18% better for B2B outreach',
        description: 'Timing analysis across multiple industries shows consistent peak performance',
        industry: 'General',
        confidence: 87,
        source: 'Performance Analysis',
        type: 'timing'
      },
      {
        id: 3,
        title: 'Problem-solution approach works best for Healthcare',
        description: 'Healthcare decision makers respond better to problem identification than feature lists',
        industry: 'Healthcare',
        confidence: 89,
        source: 'YouTube Research',
        type: 'messaging'
      },
      {
        id: 4,
        title: 'E-commerce companies prefer visual case studies',
        description: 'Video testimonials and before/after metrics significantly improve engagement',
        industry: 'E-commerce',
        confidence: 84,
        source: 'YouTube Research',
        type: 'content'
      }
    ])
  }

  const handleResearch = async () => {
    if (!industry.trim()) {
      alert('Please enter an industry to research')
      return
    }

    setResearching(true)
    
    // Simulate AI research process
    try {
      console.log(`🔬 Starting YouTube research for ${industry}...`)
      
      // Simulate progress updates
      setTimeout(() => console.log('📺 Analyzing YouTube videos...'), 1000)
      setTimeout(() => console.log('📊 Extracting marketing strategies...'), 2000)
      setTimeout(() => console.log('🎯 Identifying pain points...'), 3000)
      
      // Complete research after 5 seconds
      setTimeout(() => {
        const newResearch = {
          id: Date.now(),
          industry: industry,
          videosAnalyzed: Math.floor(Math.random() * 20) + 35,
          strategiesFound: Math.floor(Math.random() * 10) + 15,
          painPointsIdentified: Math.floor(Math.random() * 8) + 12,
          completedAt: new Date(),
          status: 'completed'
        }
        
        setRecentResearch(prev => [newResearch, ...prev])
        
        // Add new insights
        const newInsights = [
          {
            id: Date.now() + 1,
            title: `${industry} companies need better conversion tracking`,
            description: `Analysis of ${newResearch.videosAnalyzed} ${industry} videos reveals gap in analytics setup`,
            industry: industry,
            confidence: Math.floor(Math.random() * 20) + 80,
            source: 'YouTube Research',
            type: 'strategy'
          },
          {
            id: Date.now() + 2,
            title: `${industry} decision makers prefer specific ROI examples`,
            description: `Video analysis shows concrete numbers perform better than generic benefits`,
            industry: industry,
            confidence: Math.floor(Math.random() * 15) + 85,
            source: 'YouTube Research',
            type: 'messaging'
          }
        ]
        
        setInsights(prev => [...newInsights, ...prev])
        setResearching(false)
        setIndustry('')
        
        console.log(`✅ Research completed for ${industry}!`)
        alert(`Research completed! Analyzed ${newResearch.videosAnalyzed} videos and found ${newResearch.strategiesFound} strategies.`)
      }, 5000)
      
    } catch (error) {
      console.error('Research failed:', error)
      setResearching(false)
    }
  }

  const getInsightIcon = (type) => {
    switch (type) {
      case 'strategy': return TrendingUp
      case 'timing': return Play
      case 'messaging': return BookOpen
      case 'content': return Video
      default: return Lightbulb
    }
  }

  const getInsightColor = (type) => {
    switch (type) {
      case 'strategy': return 'text-blue-400'
      case 'timing': return 'text-green-400'
      case 'messaging': return 'text-purple-400'
      case 'content': return 'text-orange-400'
      default: return 'text-yellow-400'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Brain className="w-8 h-8 text-purple-400" />
          AI Research Dashboard
        </h1>
        <p className="text-foreground-muted">YouTube research engine for industry insights and strategies</p>
      </div>

      {/* Research Controls */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Start New Research</h2>
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Enter industry (e.g., SaaS, E-commerce, Healthcare)"
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            className="input-field flex-1"
            disabled={researching}
          />
          <button 
            onClick={handleResearch}
            disabled={!industry.trim() || researching}
            className="btn-primary flex items-center gap-2 min-w-[140px]"
          >
            {researching ? (
              <>
                <div className="loading-spinner w-4 h-4"></div>
                Researching...
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                Start Research
              </>
            )}
          </button>
        </div>
        <p className="text-sm text-foreground-muted mt-2">
          AI will analyze YouTube videos to extract marketing strategies, pain points, and insights for your industry.
        </p>
      </div>

      {/* Research Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card text-center">
          <p className="text-2xl font-bold text-purple-400">{recentResearch.length}</p>
          <p className="text-sm text-foreground-muted">Industries Researched</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-blue-400">
            {recentResearch.reduce((sum, r) => sum + r.videosAnalyzed, 0)}
          </p>
          <p className="text-sm text-foreground-muted">Videos Analyzed</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-green-400">
            {recentResearch.reduce((sum, r) => sum + r.strategiesFound, 0)}
          </p>
          <p className="text-sm text-foreground-muted">Strategies Found</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-orange-400">{insights.length}</p>
          <p className="text-sm text-foreground-muted">AI Insights Generated</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Research */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Recent Research</h3>
          <div className="space-y-3">
            {recentResearch.slice(0, 5).map((research) => (
              <div key={research.id} className="p-4 bg-background-tertiary rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{research.industry} Marketing</h4>
                  <span className="badge badge-success">Completed</span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-foreground-muted">Videos:</span>
                    <span className="ml-1 font-medium">{research.videosAnalyzed}</span>
                  </div>
                  <div>
                    <span className="text-foreground-muted">Strategies:</span>
                    <span className="ml-1 font-medium">{research.strategiesFound}</span>
                  </div>
                  <div>
                    <span className="text-foreground-muted">Pain Points:</span>
                    <span className="ml-1 font-medium">{research.painPointsIdentified}</span>
                  </div>
                </div>
                <p className="text-xs text-foreground-muted mt-2">
                  {research.completedAt.toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* AI Insights */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">AI Insights</h3>
          <div className="space-y-3">
            {insights.slice(0, 5).map((insight) => {
              const Icon = getInsightIcon(insight.type)
              return (
                <div key={insight.id} className="p-4 bg-background-tertiary rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className={`${getInsightColor(insight.type)} mt-1`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium mb-1">{insight.title}</h4>
                      <p className="text-sm text-foreground-muted mb-2">{insight.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-foreground-muted">{insight.industry} • {insight.source}</span>
                        <div className="flex items-center gap-1">
                          <div className="progress-bar w-16 h-1">
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
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Research Process */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">How AI Research Works</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Search className="w-6 h-6 text-blue-400" />
            </div>
            <h4 className="font-medium mb-2">1. Discover Videos</h4>
            <p className="text-sm text-foreground-muted">Searches YouTube for industry-specific marketing content</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Video className="w-6 h-6 text-green-400" />
            </div>
            <h4 className="font-medium mb-2">2. Analyze Content</h4>
            <p className="text-sm text-foreground-muted">Extracts transcripts and analyzes top-performing videos</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Brain className="w-6 h-6 text-purple-400" />
            </div>
            <h4 className="font-medium mb-2">3. Extract Insights</h4>
            <p className="text-sm text-foreground-muted">Identifies strategies, pain points, and psychology triggers</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-orange-600/20 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Lightbulb className="w-6 h-6 text-orange-400" />
            </div>
            <h4 className="font-medium mb-2">4. Generate Recommendations</h4>
            <p className="text-sm text-foreground-muted">Creates actionable insights for your outreach campaigns</p>
          </div>
        </div>
      </div>
    </div>
  )
}