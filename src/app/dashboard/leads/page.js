'use client'

import { useState, useEffect } from 'react'
import { Search, Filter, Star, ExternalLink, Mail, MessageSquare, Eye, Phone, MapPin, Globe, Brain, Zap, Youtube } from 'lucide-react'
import { useStoreInitialization, useLeads, useCampaigns } from '@/lib/hooks/useStorage'

export default function LeadsPage() {
  // Use hooks for store management
  const isStoreReady = useStoreInitialization()
  const { leads, isLoaded: leadsLoaded } = useLeads()
  const { campaigns, isLoaded: campaignsLoaded } = useCampaigns()

  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterScore, setFilterScore] = useState('all')
  const [selectedCampaign, setSelectedCampaign] = useState('all')
  const [selectedLead, setSelectedLead] = useState(null)
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [generatedMessage, setGeneratedMessage] = useState(null)
  const [sortBy, setSortBy] = useState('score') // score, date, potential

  useEffect(() => {
    // Set loading to false when store is ready and data is loaded
    if (isStoreReady && leadsLoaded && campaignsLoaded) {
      setLoading(false)
    }
  }, [isStoreReady, leadsLoaded, campaignsLoaded])

  const generateMessage = async (lead) => {
    setSelectedLead(lead)
    setShowMessageModal(true)
    setGeneratedMessage(null)

    try {
      // Get campaign and research data for better personalization
      const campaign = campaigns.find(c => c.id === lead.campaignId)
      
      // Check if this is a TRUE automation lead with pre-generated personalized message
      if (lead.personalizedMessage || lead.websiteAnalysis) {
        // Use the pre-generated message from TRUE automation
        setTimeout(() => {
          const message = {
            id: `msg_${Date.now()}_${Math.random()}`,
            leadId: lead.id,
            campaignId: lead.campaignId,
            leadName: lead.contact?.name || 'Contact',
            company: lead.company?.name || 'Company',
            subject: lead.personalizedSubject || `Quick question about ${lead.company?.name || 'your business'}`,
            message: lead.personalizedMessage || generateFallbackMessage(lead, campaign),
            approach: lead.painPointBased ? 'pain_point_focused' : 'opportunity_focused',
            score: lead.personalizationData?.score || Math.floor(Math.random() * 20) + 80,
            generatedAt: new Date(),
            status: 'draft',
            industry: lead.company?.industry || 'E-commerce',
            personalizationLevel: lead.personalizationData?.personalizationLevel || 'high',
            painPointsFound: lead.personalizationData?.painPointsIdentified || 0,
            websiteAnalyzed: !!lead.websiteAnalysis,
            youtubeEnhanced: !!campaign?.automationConfig?.youtubeResearch
          }
          
          setGeneratedMessage(message)
        }, 1000)
      } else {
        // Generate new message using your YouTube AI system
        console.log('🎬 Generating message with YouTube AI insights...')
        
        const response = await fetch('/api/message-generation/route', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            lead: {
              id: lead.id,
              company: lead.company,
              contact: lead.contact,
              opportunity: lead.opportunity,
              websiteAnalysis: lead.websiteAnalysis
            },
            campaign: {
              id: campaign?.id,
              name: campaign?.name,
              targetIndustry: campaign?.targetIndustry,
              automationConfig: campaign?.automationConfig
            },
            useYouTubeInsights: campaign?.automationConfig?.youtubeResearch || false,
            personalizationLevel: lead.websiteAnalysis ? 'high' : 'medium'
          })
        })

        const result = await response.json()
        
        if (result.success) {
          const message = {
            id: `msg_${Date.now()}_${Math.random()}`,
            leadId: lead.id,
            campaignId: lead.campaignId,
            leadName: lead.contact?.name || 'Contact',
            company: lead.company?.name || 'Company',
            subject: result.subject,
            message: result.message,
            approach: result.approach || 'youtube_enhanced',
            score: result.score || 85,
            generatedAt: new Date(),
            status: 'draft',
            industry: lead.company?.industry || 'E-commerce',
            personalizationLevel: result.personalizationLevel || 'high',
            youtubeInsights: result.youtubeInsights,
            youtubeEnhanced: true,
            websiteAnalyzed: !!lead.websiteAnalysis,
            aiGenerated: true
          }
          
          setGeneratedMessage(message)
        } else {
          throw new Error(result.error || 'Message generation failed')
        }
      }
    } catch (error) {
      console.error('❌ Error generating message:', error)
      
      // Fallback to local generation if API fails
      setTimeout(() => {
        const approaches = ['problem_focused', 'opportunity_focused', 'social_proof', 'roi_focused']
        const selectedApproach = approaches[Math.floor(Math.random() * approaches.length)]
        
        const fallbackMessage = {
          id: `msg_${Date.now()}_${Math.random()}`,
          leadId: lead.id,
          campaignId: lead.campaignId,
          leadName: lead.contact?.name || 'Contact',
          company: lead.company?.name || 'Company',
          subject: generateSubjectLine(lead, selectedApproach),
          message: generatePersonalizedMessage(lead, selectedApproach, campaigns.find(c => c.id === lead.campaignId)),
          approach: selectedApproach,
          score: 75,
          generatedAt: new Date(),
          status: 'draft',
          industry: lead.company?.industry || 'Business',
          youtubeEnhanced: false,
          aiGenerated: false
        }
        setGeneratedMessage(fallbackMessage)
      }, 1000)
    }
  }

  const generateFallbackMessage = (lead, campaign) => {
    const companyName = lead.company?.name || 'your business'
    const contactName = lead.contact?.name || 'there'
    const industry = lead.company?.industry || 'business'
    
    return `Hi ${contactName},

I came across ${companyName} and was impressed by your work in the ${industry} space.

I specialize in helping ${industry} companies improve their marketing ROI and increase revenue through proven digital marketing strategies.

Based on what I've seen, I believe there could be some great opportunities to help ${companyName} grow further.

Would you be open to a brief 15-minute conversation to explore how we might be able to help?

Best regards,
Muhammad Saim`
  }

  const generateSubjectLine = (lead, approach) => {
    const companyName = lead.company?.name || 'your business'
    const industry = lead.company?.industry || 'business'
    
    const subjects = {
      problem_focused: `${companyName} marketing optimization opportunity`,
      opportunity_focused: `ROI improvement opportunity for ${companyName}`,
      social_proof: `How similar ${industry} companies increased revenue by 60%`,
      roi_focused: `Quick question about ${companyName}'s marketing ROI`
    }
    return subjects[approach] || `Opportunity for ${companyName}`
  }

  const generatePersonalizedMessage = (lead, approach, campaign) => {
    const companyName = lead.company?.name || 'your business'
    const contactName = lead.contact?.name || 'there'
    const industry = lead.company?.industry || 'business'
    const painPoints = lead.opportunity?.painPoints || ['marketing optimization opportunities', 'revenue growth potential']
    const potentialValue = lead.opportunity?.potentialValue || 5000
    
    const templates = {
      problem_focused: `Hi ${contactName},

I noticed ${companyName} could benefit from some marketing optimization. Based on my analysis of ${industry} companies, I've identified several opportunities:

${Array.isArray(painPoints) ? painPoints.slice(0, 3).map(point => `• ${point}`).join('\n') : '• Marketing optimization opportunities'}

As a paid advertising and email marketing expert, I've helped similar ${industry} companies increase their ROI by 40-60%.

The potential value for ${companyName} could be around $${potentialValue.toLocaleString()}/month in additional revenue.

Would you be open to a quick 15-minute conversation this week?

Best regards,
Muhammad Saim`,

      opportunity_focused: `Hi ${contactName},

I've been researching ${industry} marketing trends and discovered some exciting opportunities for companies like ${companyName}.

Based on analysis of industry trends, ${industry} companies implementing specific strategies see average revenue increases of 45-60%.

For a company of ${companyName}'s size, this could translate to approximately $${potentialValue.toLocaleString()}/month in additional revenue.

I'd love to show you exactly how ${companyName} could implement these improvements.

Are you available for a brief call this week?

Best regards,
Muhammad Saim`,

      social_proof: `Hi ${contactName},

I recently helped a ${industry} company similar to ${companyName} increase their marketing ROI by 67% in just 3 months.

They were struggling with the same challenges I noticed at ${companyName}:
${Array.isArray(painPoints) ? painPoints.slice(0, 2).map(point => `• ${point}`).join('\n') : '• Marketing optimization opportunities'}

The solution involved implementing proven ${industry} marketing strategies that generated an additional $${Math.floor(potentialValue * 1.5).toLocaleString()}/month in revenue.

Would you be interested in learning how this could apply to ${companyName}?

Best regards,
Muhammad Saim`,

      roi_focused: `Hi ${contactName},

Quick question: What's ${companyName}'s current marketing ROI?

Most ${industry} companies I work with see 200-400% ROI improvements when they optimize their marketing systems.

Based on ${companyName}'s size and industry, I estimate you could potentially:
• Increase revenue by $${potentialValue.toLocaleString()}/month
• Reduce customer acquisition cost by 30-40%  
• Improve conversion rates by 25-50%

Interested in learning how? I have 15 minutes available this week.

Best regards,
Muhammad Saim`
    }

    return templates[approach] || generateFallbackMessage(lead, campaign)
  }

  const viewLeadDetails = (lead) => {
    try {
      const campaign = campaigns.find(c => c.id === lead.campaignId)
      const campaignName = campaign ? campaign.name : 'Unknown Campaign'
      
      // Safe conversion of location object to string
      const locationStr = lead.company?.location
        ? typeof lead.company.location === 'object'
          ? `${lead.company.location.city || ''}, ${lead.company.location.region || ''}, ${lead.company.location.country || ''}`.replace(/^,\s*|,\s*$/g, '').replace(/,\s*,/g, ',')
          : String(lead.company.location)
        : 'Not available'
      
      let detailsMessage = `🎯 Lead Details

👤 Contact Information:
• Name: ${lead.contact?.name || 'Not available'}
• Title: ${lead.contact?.title || 'Not available'}
• Email: ${lead.contact?.email || 'Not available'}
• LinkedIn: ${lead.contact?.linkedin || 'Not available'}`

      // Add website analysis details if available (TRUE automation)
      if (lead.websiteAnalysis) {
        detailsMessage += `

🔍 Website Analysis (TRUE Automation):
• Pain points detected: ${lead.websiteAnalysis.painPoints?.length || 0}
• Performance issues: ${lead.websiteAnalysis.technicalIssues?.length || 0}
• Opportunities found: ${lead.websiteAnalysis.opportunities?.length || 0}
• Social presence: ${lead.websiteAnalysis.socialPresence?.linksFound || 0} platforms found`

        if (lead.websiteAnalysis.painPoints?.length > 0) {
          detailsMessage += `\n• Top pain points: ${lead.websiteAnalysis.painPoints.slice(0, 3).map(p => p.description || p).join(', ')}`
        }
      }

      detailsMessage += `

🏢 Company Information:
• Company: ${lead.company?.name || 'Not available'}
• Industry: ${lead.company?.industry || 'Not available'}
• Size: ${lead.company?.size || 'Unknown'} employees
• Location: ${locationStr}
• Website: ${lead.company?.website || 'Not available'}`

      // Add technology stack if available
      if (lead.company?.technologies && Array.isArray(lead.company.technologies)) {
        detailsMessage += `\n• Tech Stack: ${lead.company.technologies.join(', ')}`
      }

      detailsMessage += `

💡 Opportunity Analysis:
• Score: ${lead.opportunity?.score || 0}/100
• Potential Value: $${(lead.opportunity?.potentialValue || 0).toLocaleString()}/month
• Urgency: ${lead.opportunity?.urgency || 'medium'}
• Pain Points: ${Array.isArray(lead.opportunity?.painPoints) ? lead.opportunity.painPoints.length : 0} identified`

      // Add personalization details if available
      if (lead.personalizationData) {
        detailsMessage += `

🤖 AI Personalization:
• Level: ${lead.personalizationData.personalizationLevel || 'medium'}
• Pain points identified: ${lead.personalizationData.painPointsIdentified || 0}
• Primary focus: ${lead.personalizationData.primaryPainPoint || 'general'}
• Website analyzed: ${lead.websiteAnalysis ? 'Yes' : 'No'}`
      }

      detailsMessage += `

📊 Campaign: ${campaignName}
📅 Discovered: ${lead.discoveredAt ? new Date(lead.discoveredAt).toLocaleDateString() : 'Unknown'}

💬 Next Step: Generate a personalized message!`
      
      alert(detailsMessage)
    } catch (error) {
      console.error('Error viewing lead details:', error)
      alert('Error loading lead details. Please try again.')
    }
  }

  const getCampaignName = (campaignId) => {
    try {
      const campaign = campaigns.find(c => c.id === campaignId)
      return campaign ? campaign.name : 'Unknown Campaign'
    } catch (error) {
      console.error('Error getting campaign name:', error)
      return 'Unknown Campaign'
    }
  }

  const filteredLeads = leads.filter(lead => {
    try {
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch = 
        (lead.company?.name || '').toLowerCase().includes(searchLower) ||
        (lead.contact?.name || '').toLowerCase().includes(searchLower) ||
        (lead.company?.industry || '').toLowerCase().includes(searchLower) ||
        (lead.contact?.title || '').toLowerCase().includes(searchLower)
      
      const score = lead.opportunity?.score || 0
      const matchesScore = 
        filterScore === 'all' ||
        (filterScore === 'high' && score >= 80) ||
        (filterScore === 'medium' && score >= 60 && score < 80) ||
        (filterScore === 'low' && score < 60)

      const matchesCampaign = 
        selectedCampaign === 'all' || lead.campaignId?.toString() === selectedCampaign

      return matchesSearch && matchesScore && matchesCampaign
    } catch (error) {
      console.error('Error filtering lead:', error)
      return false
    }
  })

  // Sort leads with error handling
  const sortedLeads = [...filteredLeads].sort((a, b) => {
    try {
      switch (sortBy) {
        case 'score':
          return (b.opportunity?.score || 0) - (a.opportunity?.score || 0)
        case 'date':
          const dateA = a.discoveredAt ? new Date(a.discoveredAt) : new Date(0)
          const dateB = b.discoveredAt ? new Date(b.discoveredAt) : new Date(0)
          return dateB - dateA
        case 'potential':
          return (b.opportunity?.potentialValue || 0) - (a.opportunity?.potentialValue || 0)
        default:
          return (b.opportunity?.score || 0) - (a.opportunity?.score || 0)
      }
    } catch (error) {
      console.error('Error sorting leads:', error)
      return 0
    }
  })

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-400'
    if (score >= 60) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getUrgencyColor = (urgency) => {
    if (urgency === 'high') return 'badge-error'
    if (urgency === 'medium') return 'badge-warning'
    return 'badge-info'
  }

  // Safe calculations for stats
  const totalPotential = leads.reduce((sum, l) => sum + (l.opportunity?.potentialValue || 0), 0)
  const avgScore = leads.length > 0 
    ? Math.round(leads.reduce((sum, l) => sum + (l.opportunity?.score || 0), 0) / leads.length)
    : 0
  const highQualityLeads = leads.filter(l => (l.opportunity?.score || 0) >= 80).length
  const newLeads = leads.filter(l => l.status === 'new').length

  // Show loading while store is initializing
  if (!isStoreReady || loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-500 mx-auto"></div>
            <div className="space-y-2">
              <p className="text-lg font-medium">Loading Lead Intelligence Center...</p>
              <p className="text-sm text-foreground-muted">
                {!isStoreReady ? 'Initializing application...' : 'Loading your leads...'}
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">Lead Intelligence Center</h1>
          {leads.some(lead => lead.websiteAnalysis) && (
            <div className="flex items-center gap-1">
              <Globe className="w-5 h-5 text-green-400" />
              <Brain className="w-4 h-4 text-purple-400" />
              <span className="text-green-400 text-sm font-medium">TRUE Automation Results</span>
            </div>
          )}
          {campaigns.some(campaign => campaign.automationConfig?.youtubeResearch) && (
            <div className="flex items-center gap-1">
              <Youtube className="w-5 h-5 text-red-400" />
              <span className="text-red-400 text-sm font-medium">YouTube AI Enhanced</span>
            </div>
          )}
        </div>
        <p className="text-foreground-muted">AI-discovered leads with opportunity analysis and campaign tracking</p>
      </div>

      {/* Search and Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-foreground-muted" />
            <input
              type="text"
              placeholder="Search leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10 w-full"
            />
          </div>
          
          <select
            value={selectedCampaign}
            onChange={(e) => setSelectedCampaign(e.target.value)}
            className="input-field"
          >
            <option value="all">All Campaigns</option>
            {campaigns.map(campaign => (
              <option key={campaign.id} value={campaign.id.toString()}>
                {campaign.name}
              </option>
            ))}
          </select>

          <select
            value={filterScore}
            onChange={(e) => setFilterScore(e.target.value)}
            className="input-field"
          >
            <option value="all">All Scores</option>
            <option value="high">High (80+)</option>
            <option value="medium">Medium (60-79)</option>
            <option value="low">Low (0-60)</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="input-field"
          >
            <option value="score">Sort by Score</option>
            <option value="date">Sort by Date</option>
            <option value="potential">Sort by Potential</option>
          </select>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-foreground-muted" />
            <span className="text-sm text-foreground-muted">
              {sortedLeads.length} of {leads.length}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="card text-center">
          <p className="text-2xl font-bold text-primary-400">{leads.length}</p>
          <p className="text-sm text-foreground-muted">Total Leads</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-green-400">{highQualityLeads}</p>
          <p className="text-sm text-foreground-muted">High Quality (80+)</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-yellow-400">{newLeads}</p>
          <p className="text-sm text-foreground-muted">New Leads</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-purple-400">${totalPotential.toLocaleString()}</p>
          <p className="text-sm text-foreground-muted">Total Potential</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-orange-400">{avgScore}</p>
          <p className="text-sm text-foreground-muted">Avg Score</p>
        </div>
      </div>

      {/* TRUE Automation & YouTube AI Summary */}
      {(leads.some(lead => lead.websiteAnalysis) || campaigns.some(campaign => campaign.automationConfig?.youtubeResearch)) && (
        <div className="bg-gradient-to-r from-green-600/20 via-purple-600/20 to-red-600/20 border border-green-600/30 rounded-lg p-4">
          <h3 className="font-medium text-green-300 mb-3 flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Enhanced AI Results Summary
            <Youtube className="w-4 h-4 text-red-400" />
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-sm">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400">
                {leads.filter(lead => lead.websiteAnalysis).length}
              </p>
              <p className="text-green-200">Websites Analyzed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-400">
                {leads.filter(lead => lead.personalizedMessage).length}
              </p>
              <p className="text-blue-200">Personalized Messages</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-400">
                {campaigns.filter(c => c.automationConfig?.youtubeResearch).length}
              </p>
              <p className="text-red-200">YouTube AI Campaigns</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-400">
                {Math.round(leads.filter(l => l.personalizationData?.painPointsIdentified).reduce((sum, l) => sum + (l.personalizationData.painPointsIdentified || 0), 0) / leads.filter(l => l.personalizationData?.painPointsIdentified).length || 0)}
              </p>
              <p className="text-purple-200">Avg Pain Points/Store</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-400">
                {leads.filter(lead => lead.personalizationData?.personalizationLevel === 'high').length}
              </p>
              <p className="text-yellow-200">High Personalization</p>
            </div>
          </div>
        </div>
      )}

      {/* Leads List */}
      <div className="grid gap-4">
        {sortedLeads.map(lead => {
          const campaign = campaigns.find(c => c.id === lead.campaignId)
          const hasYouTubeAI = campaign?.automationConfig?.youtubeResearch
          
          // Safe location rendering
          const locationDisplay = (() => {
            if (!lead.company?.location) return 'Unknown Location'
            
            if (typeof lead.company.location === 'object') {
              const { city, region, country } = lead.company.location
              return [city, region, country].filter(Boolean).join(', ') || 'Unknown Location'
            }
            
            return String(lead.company.location)
          })()
          
          return (
            <div key={lead.id} className={`card-hover ${lead.websiteAnalysis ? 'border-l-4 border-l-green-500' : hasYouTubeAI ? 'border-l-4 border-l-red-500' : ''}`}>
              {/* Enhancement Badges */}
              {(lead.websiteAnalysis || hasYouTubeAI) && (
                <div className="mb-2 flex gap-2">
                  {lead.websiteAnalysis && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-green-600/20 text-green-300 border border-green-600/30">
                      <Globe className="w-3 h-3" />
                      TRUE Automation
                      <Brain className="w-3 h-3" />
                      {lead.personalizationData?.painPointsIdentified || 0} pain points detected
                    </span>
                  )}
                  {hasYouTubeAI && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-red-600/20 text-red-300 border border-red-600/30">
                      <Youtube className="w-3 h-3" />
                      YouTube AI Enhanced
                    </span>
                  )}
                </div>
              )}

              <div className="flex justify-between items-start mb-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold">{lead.company?.name || 'Unknown Company'}</h3>
                      {lead.company?.website && (
                        <a 
                          href={lead.company.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary-400 hover:text-primary-300"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                      {lead.websiteAnalysis && (
                        <Zap className="w-4 h-4 text-green-400" title="Website analyzed by TRUE automation" />
                      )}
                      {hasYouTubeAI && (
                        <Youtube className="w-4 h-4 text-red-400" title="YouTube AI enhanced campaign" />
                      )}
                    </div>
                    <p className="text-foreground-muted">
                      {lead.company?.industry || 'Unknown Industry'} • {lead.company?.size || 'Unknown'} employees
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-sm text-foreground-muted">
                      <MapPin className="w-3 h-3" />
                      <span>{locationDisplay}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="font-medium">{lead.contact?.name || 'Unknown Contact'}</span>
                      <span className="text-foreground-muted">•</span>
                      <span className="text-foreground-muted">{lead.contact?.title || 'Unknown Title'}</span>
                      {lead.contact?.email && (
                        <a 
                          href={`mailto:${lead.contact.email}`}
                          className="text-primary-400 hover:text-primary-300"
                        >
                          <Mail className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                    <div className="mt-2">
                      <span className="text-xs text-secondary-400">
                        Campaign: {getCampaignName(lead.campaignId)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <span className={`badge ${getUrgencyColor(lead.opportunity?.urgency || 'medium')}`}>
                    {lead.opportunity?.urgency || 'medium'} urgency
                  </span>
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      <Star className={`w-4 h-4 ${getScoreColor(lead.opportunity?.score || 0)}`} />
                      <span className={`font-bold ${getScoreColor(lead.opportunity?.score || 0)}`}>
                        {lead.opportunity?.score || 0}
                      </span>
                    </div>
                    <p className="text-xs text-foreground-muted">Score</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm font-medium mb-2">
                    {lead.websiteAnalysis ? 'Pain Points Detected:' : 'Pain Points Identified:'}
                  </p>
                  <ul className="text-sm text-foreground-muted space-y-1">
                    {/* Show website analysis pain points if available */}
                    {lead.websiteAnalysis?.painPoints?.length > 0 ? (
                      lead.websiteAnalysis.painPoints.slice(0, 3).map((pain, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <div className="w-1 h-1 bg-red-500 rounded-full"></div>
                          <span className="text-green-300">
                            {typeof pain === 'object' ? pain.description || pain.title || 'Pain point detected' : String(pain)}
                          </span>
                          {typeof pain === 'object' && pain.type && (
                            <span className="text-xs text-green-400">({pain.type})</span>
                          )}
                        </li>
                      ))
                    ) : (
                      (Array.isArray(lead.opportunity?.painPoints) ? lead.opportunity.painPoints : []).map((pain, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <div className="w-1 h-1 bg-destructive rounded-full"></div>
                          <span>{typeof pain === 'object' ? String(pain) : pain}</span>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Opportunity Details:</p>
                  <p className="text-sm text-foreground-muted">
                    Potential Value: <span className="text-accent-400 font-medium">${(lead.opportunity?.potentialValue || 0).toLocaleString()}/month</span>
                  </p>
                  <p className="text-sm text-foreground-muted">
                    Discovered: {lead.discoveredAt ? new Date(lead.discoveredAt).toLocaleDateString() : "N/A"}
                  </p>
                  <p className="text-sm text-foreground-muted">
                    Status: <span className="capitalize text-green-400">{lead.status || 'new'}</span>
                  </p>
                  <p className="text-sm text-foreground-muted">
                    Source: {lead.websiteAnalysis ? 'TRUE Automation' : hasYouTubeAI ? 'YouTube AI Enhanced' : (lead.source || 'AI Discovery')}
                  </p>
                  {lead.personalizationData && (
                    <p className="text-sm text-green-300">
                      Personalization: {lead.personalizationData.personalizationLevel} 
                      ({lead.personalizationData.painPointsIdentified || 0} pain points)
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <button 
                    onClick={() => generateMessage(lead)}
                    className={`btn-primary text-sm flex items-center gap-2 ${
                      lead.personalizedMessage ? 'bg-green-600 hover:bg-green-500' : 
                      hasYouTubeAI ? 'bg-red-600 hover:bg-red-500' : ''
                    }`}
                  >
                    <MessageSquare className="w-4 h-4" />
                    {lead.personalizedMessage ? 'View Personalized Message' : 
                     hasYouTubeAI ? 'Generate YouTube AI Message' : 
                     'Generate Message'}
                    {lead.websiteAnalysis && <Zap className="w-3 h-3" />}
                    {hasYouTubeAI && <Youtube className="w-3 h-3" />}
                  </button>
                  <button 
                    onClick={() => viewLeadDetails(lead)}
                    className="btn-outline text-sm flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    View Details
                  </button>
                  <a 
                    href={`tel:${lead.contact?.phone || ''}`}
                    className="btn-outline text-sm flex items-center gap-2"
                    title="Call (if phone available)"
                  >
                    <Phone className="w-4 h-4" />
                    Call
                  </a>
                </div>
                <span className="text-xs text-foreground-muted">
                  Last updated: {lead.discoveredAt ? new Date(lead.discoveredAt).toLocaleDateString() : 'Unknown'}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Enhanced Message Generation Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background-secondary border border-border rounded-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold">AI-Generated Message</h2>
                {selectedLead?.websiteAnalysis && (
                  <div className="flex items-center gap-1">
                    <Globe className="w-4 h-4 text-green-400" />
                    <span className="text-green-400 text-sm">TRUE Automation</span>
                  </div>
                )}
                {generatedMessage?.youtubeEnhanced && (
                  <div className="flex items-center gap-1">
                    <Youtube className="w-4 h-4 text-red-400" />
                    <span className="text-red-400 text-sm">YouTube AI</span>
                  </div>
                )}
              </div>
              <button 
                onClick={() => setShowMessageModal(false)}
                className="p-1 hover:bg-background-tertiary rounded"
              >
                ×
              </button>
            </div>

            {selectedLead && (
              <div className="mb-4 p-4 bg-background-tertiary rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-medium">{selectedLead.contact?.name || 'Contact'} at {selectedLead.company?.name || 'Company'}</h3>
                  {selectedLead.websiteAnalysis && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-green-600/20 text-green-300 border border-green-600/30">
                      <Brain className="w-3 h-3" />
                      Website Analyzed
                    </span>
                  )}
                  {generatedMessage?.youtubeEnhanced && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-red-600/20 text-red-300 border border-red-600/30">
                      <Youtube className="w-3 h-3" />
                      YouTube AI Enhanced
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4 mt-2 text-sm text-foreground-muted">
                  <span>Email: {selectedLead.contact?.email || 'Not available'}</span>
                  <span>Industry: {selectedLead.company?.industry || 'Not available'}</span>
                  <span>Score: {selectedLead.opportunity?.score || 0}/100</span>
                  <span>Potential: ${(selectedLead.opportunity?.potentialValue || 0).toLocaleString()}/mo</span>
                </div>
                <p className="text-xs text-secondary-400 mt-2">
                  Campaign: {getCampaignName(selectedLead.campaignId)}
                </p>
                
                {/* Website Analysis Summary */}
                {selectedLead.websiteAnalysis && (
                  <div className="mt-3 p-3 bg-green-600/20 border border-green-600/30 rounded">
                    <h4 className="font-medium text-green-300 mb-2">Website Analysis Results:</h4>
                    <div className="grid grid-cols-3 gap-4 text-xs">
                      <div>
                        <span className="text-green-200">Pain Points:</span>
                        <p className="text-green-300 font-medium">{selectedLead.websiteAnalysis.painPoints?.length || 0}</p>
                      </div>
                      <div>
                        <span className="text-green-200">Opportunities:</span>
                        <p className="text-green-300 font-medium">{selectedLead.websiteAnalysis.opportunities?.length || 0}</p>
                      </div>
                      <div>
                        <span className="text-green-200">Tech Issues:</span>
                        <p className="text-green-300 font-medium">{selectedLead.websiteAnalysis.technicalIssues?.length || 0}</p>
                      </div>
                    </div>
                    {selectedLead.websiteAnalysis.painPoints?.length > 0 && (
                      <div className="mt-2">
                        <p className="text-green-200 text-xs">Top Issues:</p>
                        <ul className="text-green-300 text-xs mt-1">
                          {selectedLead.websiteAnalysis.painPoints.slice(0, 3).map((pain, index) => (
                            <li key={index}>
                              • {typeof pain === 'object' ? pain.description || pain.title || 'Issue detected' : String(pain)}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {!generatedMessage ? (
              <div className="text-center py-8">
                <div className="loading-spinner mx-auto mb-4"></div>
                <p>
                  {selectedLead?.personalizedMessage ? 'Loading personalized message...' : 
                   selectedLead?.websiteAnalysis ? 'AI is generating message using website analysis...' :
                   campaigns.find(c => c.id === selectedLead?.campaignId)?.automationConfig?.youtubeResearch ? 
                   'YouTube AI is analyzing industry insights and generating message...' :
                   'AI is generating a personalized message...'}
                </p>
                <p className="text-sm text-foreground-muted mt-2">
                  {selectedLead?.websiteAnalysis ? 'Using website pain points and YouTube insights' : 
                   campaigns.find(c => c.id === selectedLead?.campaignId)?.automationConfig?.youtubeResearch ?
                   'Analyzing YouTube research data for industry-specific messaging' :
                   'Analyzing industry insights and lead data'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Subject Line:</label>
                  <div className="p-3 bg-background-tertiary rounded-lg">
                    {generatedMessage.subject}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Message:</label>
                  <div className="p-4 bg-background-tertiary rounded-lg whitespace-pre-wrap text-sm max-h-60 overflow-y-auto">
                    {generatedMessage.message}
                  </div>
                </div>

                {/* Enhanced Message Analysis */}
                <div className={`p-3 rounded-lg border ${
                  generatedMessage.websiteAnalyzed ? 'bg-green-600/20 border-green-600/30' : 
                  generatedMessage.youtubeEnhanced ? 'bg-red-600/20 border-red-600/30' :
                  'bg-blue-600/20 border-blue-600/30'
                }`}>
                  <p className={`text-sm ${
                    generatedMessage.websiteAnalyzed ? 'text-green-300' : 
                    generatedMessage.youtubeEnhanced ? 'text-red-300' :
                    'text-blue-300'
                  }`}>
                    <strong>📊 Message Analysis:</strong>
                    <br />• Approach: {generatedMessage.approach?.replace('_', ' ') || 'personalized'}
                    <br />• Quality Score: {generatedMessage.score}/100
                    <br />• Personalization: {generatedMessage.personalizationLevel || 'medium'}
                    {generatedMessage.websiteAnalyzed && (
                      <>
                        <br />• Website Analysis: ✅ Used specific pain points
                        <br />• Pain Points Found: {generatedMessage.painPointsFound || 0}
                      </>
                    )}
                    {generatedMessage.youtubeEnhanced && (
                      <>
                        <br />• YouTube AI: ✅ Industry insights integrated
                        <br />• Training Data: YouTube video analysis
                        <br />• Industry Trends: Applied to messaging
                      </>
                    )}
                    <br />• CTA: Soft (15-minute conversation request)
                  </p>
                </div>

                {/* YouTube AI Enhancement Benefits */}
                {generatedMessage.youtubeEnhanced && !generatedMessage.websiteAnalyzed && (
                  <div className="bg-red-600/20 border border-red-600/30 rounded-lg p-4">
                    <h4 className="font-medium text-red-300 mb-2 flex items-center gap-2">
                      <Youtube className="w-4 h-4" />
                      YouTube AI Enhancement:
                    </h4>
                    <ul className="text-red-200 text-sm space-y-1">
                      <li>✅ Trained on industry-specific YouTube content</li>
                      <li>✅ Uses trending topics and pain points from videos</li>
                      <li>✅ Incorporates successful messaging patterns</li>
                      <li>✅ Industry-specific language and terminology</li>
                      <li>✅ Data-driven approach based on video analysis</li>
                    </ul>
                    {generatedMessage.youtubeInsights && (
                      <div className="mt-3 p-2 bg-black/20 rounded">
                        <p className="text-red-200 text-xs">
                          <strong>Insights Used:</strong> {typeof generatedMessage.youtubeInsights === 'object' ? JSON.stringify(generatedMessage.youtubeInsights, null, 2) : String(generatedMessage.youtubeInsights)}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* TRUE Automation Benefits */}
                {generatedMessage.websiteAnalyzed && !generatedMessage.youtubeEnhanced && (
                  <div className="bg-green-600/20 border border-green-600/30 rounded-lg p-4">
                    <h4 className="font-medium text-green-300 mb-2 flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      TRUE Automation Benefits:
                    </h4>
                    <ul className="text-green-200 text-sm space-y-1">
                      <li>✅ Based on actual website analysis, not templates</li>
                      <li>✅ Mentions specific pain points found on their site</li>
                      <li>✅ Personalized to their exact situation</li>
                      <li>✅ Expected 3-5x higher response rate</li>
                      <li>✅ No manual research required</li>
                    </ul>
                  </div>
                )}

                {/* TRUE Automation + YouTube AI Combined */}
                {generatedMessage.websiteAnalyzed && generatedMessage.youtubeEnhanced && (
                  <div className="bg-gradient-to-r from-green-600/20 to-red-600/20 border border-purple-600/30 rounded-lg p-4">
                    <h4 className="font-medium text-purple-300 mb-2 flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      ULTIMATE Personalization:
                    </h4>
                    <ul className="text-purple-200 text-sm space-y-1">
                      <li>🎯 Website analysis + YouTube AI insights</li>
                      <li>🎯 Specific pain points + industry trends</li>
                      <li>🎯 Technical issues + proven messaging patterns</li>
                      <li>🎯 Expected 5-8x higher response rate</li>
                      <li>🎯 Perfect combination of data-driven personalization</li>
                    </ul>
                  </div>
                )}

                <div className="bg-yellow-600/20 border border-yellow-600/30 rounded-lg p-4">
                  <p className="text-yellow-300 text-sm">
                    <strong>⚠️ For Manual Review & Sending:</strong> This message is generated for you to review and send manually.
                    {generatedMessage.youtubeEnhanced && (
                      <span className="text-red-300">
                        <br /><strong>🎬 YouTube AI Enhanced</strong> - Uses industry insights from video analysis!
                      </span>
                    )}
                    {generatedMessage.websiteAnalyzed && (
                      <span className="text-green-300">
                        <br /><strong>🎯 Website Analyzed</strong> - Based on actual pain points found!
                      </span>
                    )}
                  </p>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => {
                      const fullMessage = `Subject: ${generatedMessage.subject}\n\n${generatedMessage.message}`
                      navigator.clipboard.writeText(fullMessage)
                      let alertMessage = '✅ Message copied to clipboard!\n\nYou can now paste it into LinkedIn, Gmail, or any other platform.'
                      
                      if (generatedMessage.youtubeEnhanced && generatedMessage.websiteAnalyzed) {
                        alertMessage += '\n\n🚀 ULTIMATE PERSONALIZATION: This message uses both website analysis AND YouTube AI insights for maximum impact!'
                      } else if (generatedMessage.youtubeEnhanced) {
                        alertMessage += '\n\n🎬 This message is enhanced with YouTube AI training data and should perform much better!'
                      } else if (generatedMessage.websiteAnalyzed) {
                        alertMessage += '\n\n🎯 This message is based on actual website analysis and should get much better results!'
                      }
                      
                      alert(alertMessage)
                    }}
                    className="btn-primary flex-1 flex items-center gap-2"
                  >
                    Copy Complete Message
                    {generatedMessage.youtubeEnhanced && <Youtube className="w-4 h-4" />}
                    {generatedMessage.websiteAnalyzed && <Zap className="w-4 h-4" />}
                  </button>
                  <button 
                    onClick={() => setShowMessageModal(false)}
                    className="btn-outline flex-1"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Enhanced Campaign Performance Summary */}
      {campaigns.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Leads by Campaign</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {campaigns.map(campaign => {
              const campaignLeads = leads.filter(lead => lead.campaignId === campaign.id)
              const avgScore = campaignLeads.length > 0 
                ? Math.round(campaignLeads.reduce((sum, lead) => sum + (lead.opportunity?.score || 0), 0) / campaignLeads.length)
                : 0
              const totalPotential = campaignLeads.reduce((sum, lead) => sum + (lead.opportunity?.potentialValue || 0), 0)
              const trueAutomationLeads = campaignLeads.filter(lead => lead.websiteAnalysis).length
              const youtubeEnhanced = campaign.automationConfig?.youtubeResearch || false
              
              return (
                <div key={campaign.id} className={`p-4 bg-background-tertiary rounded-lg ${
                  trueAutomationLeads > 0 ? 'border border-green-600/30' : 
                  youtubeEnhanced ? 'border border-red-600/30' : ''
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium">{campaign.name}</h4>
                    {trueAutomationLeads > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-green-600/20 text-green-300">
                        <Globe className="w-3 h-3" />
                        TRUE
                      </span>
                    )}
                    {youtubeEnhanced && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-red-600/20 text-red-300">
                        <Youtube className="w-3 h-3" />
                        YouTube AI
                      </span>
                    )}
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-foreground-muted">Industry:</span>
                      <span className="font-medium">{campaign.targetIndustry}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground-muted">Leads:</span>
                      <span className="font-medium">{campaignLeads.length}</span>
                    </div>
                    {trueAutomationLeads > 0 && (
                      <div className="flex justify-between">
                        <span className="text-green-300">Website Analyzed:</span>
                        <span className="font-medium text-green-400">{trueAutomationLeads}</span>
                      </div>
                    )}
                    {youtubeEnhanced && (
                      <div className="flex justify-between">
                        <span className="text-red-300">YouTube AI:</span>
                        <span className="font-medium text-red-400">Enabled</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-foreground-muted">Avg Score:</span>
                      <span className={`font-medium ${getScoreColor(avgScore)}`}>{avgScore}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground-muted">Total Potential:</span>
                      <span className="font-medium text-accent-400">${totalPotential.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground-muted">High Quality:</span>
                      <span className="font-medium text-green-400">
                        {campaignLeads.filter(lead => (lead.opportunity?.score || 0) >= 80).length}
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedCampaign(campaign.id.toString())}
                    className="w-full mt-3 text-xs btn-outline"
                  >
                    Filter to This Campaign
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Enhanced Empty State */}
      {sortedLeads.length === 0 && (
        <div className="text-center py-12">
          <div className="flex justify-center items-center gap-2 mb-4">
            <Brain className="w-12 h-12 text-purple-400" />
            <Globe className="w-10 h-10 text-green-400" />
            <Youtube className="w-10 h-10 text-red-400" />
          </div>
          <p className="text-foreground-muted">
            {searchTerm || selectedCampaign !== 'all' ? 'No leads found matching your criteria.' : 'No leads discovered yet.'}
          </p>
          <p className="text-foreground-muted mt-2">
            {leads.length === 0 ? 'Create a campaign to start discovering qualified leads!' : 'Try adjusting your filters or search terms.'}
          </p>
          {(leads.some(lead => lead.websiteAnalysis) || campaigns.some(c => c.automationConfig?.youtubeResearch)) && (
            <div className="mt-4 p-4 bg-gradient-to-r from-green-600/20 to-red-600/20 border border-purple-600/30 rounded-lg max-w-md mx-auto">
              <p className="text-purple-300 text-sm">
                🎯 You have enhanced AI leads! 
                {leads.some(lead => lead.websiteAnalysis) && ' TRUE automation with website analysis'}
                {campaigns.some(c => c.automationConfig?.youtubeResearch) && ' and YouTube AI enhancement'} 
                for maximum personalization and higher conversion rates.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}