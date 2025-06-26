'use client'

import { useState, useEffect } from 'react'
import { MessageSquare, Edit, Copy, Star, Eye, Trash2, Filter, Search } from 'lucide-react'
import { appStore } from '@/lib/store'

export default function MessagesPage() {
  const [messages, setMessages] = useState([])
  const [campaigns, setCampaigns] = useState([])
  const [selectedMessage, setSelectedMessage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCampaign, setSelectedCampaign] = useState('all')
  const [selectedApproach, setSelectedApproach] = useState('all')

  useEffect(() => {
    // Get messages and campaigns from store
    const storeData = appStore.getData()
    setMessages(storeData.messages)
    setCampaigns(storeData.campaigns)
    setLoading(false)

    // Subscribe to store updates
    const unsubscribe = appStore.subscribe((data) => {
      setMessages(data.messages)
      setCampaigns(data.campaigns)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const copyMessage = (message) => {
    const fullMessage = `Subject: ${message.subject}\n\n${message.message}`
    navigator.clipboard.writeText(fullMessage)
    alert('✅ Message copied to clipboard!\n\nYou can now paste it into LinkedIn, email, or any other platform.')
  }

  const deleteMessage = (messageId) => {
    if (confirm('Are you sure you want to delete this message?')) {
      const updatedMessages = messages.filter(msg => msg.id !== messageId)
      setMessages(updatedMessages)
      // Update store
      appStore.data.messages = updatedMessages
      appStore.notify()
      
      // Clear selection if deleted message was selected
      if (selectedMessage?.id === messageId) {
        setSelectedMessage(null)
      }
    }
  }

  const editMessage = (messageId) => {
    // For now, just show alert - you can implement editing later
    alert('Message editing feature coming soon! For now, you can copy the message and edit it manually.')
  }

  const markMessageAsSent = (messageId) => {
    const updatedMessages = messages.map(msg => 
      msg.id === messageId 
        ? { ...msg, status: 'sent', sentAt: new Date() }
        : msg
    )
    setMessages(updatedMessages)
    appStore.data.messages = updatedMessages
    appStore.notify()
  }

  const getScoreColor = (score) => {
    if (score >= 85) return 'text-green-400'
    if (score >= 70) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getApproachColor = (approach) => {
    switch (approach) {
      case 'problem_focused': return 'badge-error'
      case 'opportunity_focused': return 'badge-info'
      case 'social_proof': return 'badge-success'
      case 'roi_focused': return 'badge-warning'
      default: return 'badge-info'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'sent': return 'badge-success'
      case 'draft': return 'badge-warning'
      case 'scheduled': return 'badge-info'
      default: return 'badge-warning'
    }
  }

  const filteredMessages = messages.filter(message => {
    const matchesSearch = 
      message.leadName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.industry?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCampaign = 
      selectedCampaign === 'all' || message.campaignId?.toString() === selectedCampaign

    const matchesApproach = 
      selectedApproach === 'all' || message.approach === selectedApproach

    return matchesSearch && matchesCampaign && matchesApproach
  })

  const getCampaignName = (campaignId) => {
    const campaign = campaigns.find(c => c.id.toString() === campaignId?.toString())
    return campaign ? campaign.name : 'Unknown Campaign'
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Message Generation Engine</h1>
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="card animate-pulse">
              <div className="h-6 bg-background-tertiary rounded mb-4"></div>
              <div className="h-4 bg-background-tertiary rounded mb-2"></div>
              <div className="h-4 bg-background-tertiary rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MessageSquare className="w-8 h-8 text-blue-400" />
          Message Generation Engine
        </h1>
        <p className="text-foreground-muted">AI-generated personalized outreach messages by campaign</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="card text-center">
          <p className="text-2xl font-bold text-blue-400">{messages.length}</p>
          <p className="text-sm text-foreground-muted">Total Messages</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-green-400">
            {messages.filter(m => m.score >= 85).length}
          </p>
          <p className="text-sm text-foreground-muted">High Quality (85+)</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-yellow-400">
            {messages.filter(m => m.status === 'draft').length}
          </p>
          <p className="text-sm text-foreground-muted">Ready to Send</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-purple-400">
            {messages.filter(m => m.status === 'sent').length}
          </p>
          <p className="text-sm text-foreground-muted">Sent</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-orange-400">
            {messages.length > 0 ? Math.round(messages.reduce((sum, m) => sum + m.score, 0) / messages.length) : 0}
          </p>
          <p className="text-sm text-foreground-muted">Avg Score</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-foreground-muted" />
            <input
              type="text"
              placeholder="Search messages..."
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
            value={selectedApproach}
            onChange={(e) => setSelectedApproach(e.target.value)}
            className="input-field"
          >
            <option value="all">All Approaches</option>
            <option value="problem_focused">Problem Focused</option>
            <option value="opportunity_focused">Opportunity Focused</option>
            <option value="social_proof">Social Proof</option>
            <option value="roi_focused">ROI Focused</option>
          </select>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-foreground-muted" />
            <span className="text-sm text-foreground-muted">
              Showing {filteredMessages.length} of {messages.length}
            </span>
          </div>
        </div>
      </div>

      {/* Messages Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Messages List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">
            Generated Messages ({filteredMessages.length})
          </h2>
          
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {filteredMessages.map(message => (
              <div 
                key={message.id} 
                className={`card-hover cursor-pointer transition-all duration-200 ${
                  selectedMessage?.id === message.id 
                    ? 'ring-2 ring-primary-600 scale-[1.02]' 
                    : ''
                }`}
                onClick={() => setSelectedMessage(message)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-medium">{message.leadName}</h3>
                    <p className="text-sm text-foreground-muted">{message.company}</p>
                    <p className="text-xs text-foreground-muted mt-1">
                      Campaign: {getCampaignName(message.campaignId)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <div className="flex items-center gap-1">
                      <Star className={`w-4 h-4 ${getScoreColor(message.score)}`} />
                      <span className={`text-sm font-medium ${getScoreColor(message.score)}`}>
                        {message.score}
                      </span>
                    </div>
                  </div>
                </div>
                
                <p className="text-sm font-medium mb-3 line-clamp-2">{message.subject}</p>
                
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`badge ${getApproachColor(message.approach)}`}>
                      {message.approach.replace('_', ' ')}
                    </span>
                    <span className={`badge ${getStatusColor(message.status)}`}>
                      {message.status}
                    </span>
                  </div>
                  <span className="text-xs text-foreground-muted">
                    {message.generatedAt.toLocaleDateString()}
                  </span>
                </div>

                {message.industry && (
                  <p className="text-xs text-secondary-400">
                    Industry: {message.industry}
                  </p>
                )}
              </div>
            ))}
          </div>

          {filteredMessages.length === 0 && (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-foreground-muted mx-auto mb-3" />
              <p className="text-foreground-muted">
                {searchTerm || selectedCampaign !== 'all' ? 'No messages match your filters.' : 'No messages generated yet.'}
              </p>
              <p className="text-foreground-muted text-sm mt-1">
                Create campaigns to start generating personalized messages!
              </p>
            </div>
          )}
        </div>

        {/* Message Preview */}
        <div className="card sticky top-6">
          <h2 className="text-xl font-semibold mb-4">Message Preview</h2>
          {selectedMessage ? (
            <div className="space-y-4">
              {/* Message Header */}
              <div className="p-4 bg-background-tertiary rounded-lg">
                <h3 className="font-medium">{selectedMessage.leadName} at {selectedMessage.company}</h3>
                <div className="grid grid-cols-2 gap-4 mt-2 text-sm text-foreground-muted">
                  <span>Campaign: {getCampaignName(selectedMessage.campaignId)}</span>
                  <span>Industry: {selectedMessage.industry}</span>
                  <span>Score: {selectedMessage.score}/100</span>
                  <span>Approach: {selectedMessage.approach.replace('_', ' ')}</span>
                </div>
                <div className="mt-2">
                  <span className={`badge ${getStatusColor(selectedMessage.status)}`}>
                    {selectedMessage.status}
                  </span>
                  {selectedMessage.sentAt && (
                    <span className="text-xs text-green-400 ml-2">
                      Sent: {selectedMessage.sentAt.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>

              {/* Subject Line */}
              <div>
                <label className="block text-sm font-medium mb-2">Subject Line:</label>
                <div className="p-3 bg-background-tertiary rounded-lg">
                  {selectedMessage.subject}
                </div>
              </div>
              
              {/* Message Content */}
              <div>
                <label className="block text-sm font-medium mb-2">Message:</label>
                <div className="p-4 bg-background-tertiary rounded-lg whitespace-pre-wrap text-sm max-h-80 overflow-y-auto">
                  {selectedMessage.message}
                </div>
              </div>

              {/* Usage Instructions */}
              <div className="bg-blue-600/20 border border-blue-600/30 rounded-lg p-4">
                <p className="text-blue-300 text-sm">
                  <strong>💡 How to Use:</strong>
                  <br />1. Copy the complete message below
                  <br />2. Send manually via LinkedIn, Email, or other platforms
                  <br />3. Mark as "Sent" to track your outreach
                  <br />4. Follow up based on response
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button 
                  onClick={() => copyMessage(selectedMessage)}
                  className="btn-primary flex items-center gap-2 flex-1"
                >
                  <Copy className="w-4 h-4" />
                  Copy Message
                </button>
                {selectedMessage.status === 'draft' && (
                  <button 
                    onClick={() => markMessageAsSent(selectedMessage.id)}
                    className="btn-outline hover:bg-green-600/20 hover:text-green-400 flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    Mark Sent
                  </button>
                )}
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => editMessage(selectedMessage.id)}
                  className="btn-outline flex items-center gap-2 flex-1"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button 
                  onClick={() => deleteMessage(selectedMessage.id)}
                  className="btn-outline text-destructive hover:bg-destructive/20 flex items-center gap-2 flex-1"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <MessageSquare className="w-16 h-16 text-foreground-muted mx-auto mb-4" />
              <p className="text-foreground-muted">Select a message to preview</p>
              <p className="text-foreground-muted text-sm mt-1">
                Click on any message from the list to see details
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats by Campaign */}
      {campaigns.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Messages by Campaign</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {campaigns.map(campaign => {
              const campaignMessages = messages.filter(msg => msg.campaignId === campaign.id)
              const avgScore = campaignMessages.length > 0 
                ? Math.round(campaignMessages.reduce((sum, msg) => sum + msg.score, 0) / campaignMessages.length)
                : 0
              
              return (
                <div key={campaign.id} className="p-4 bg-background-tertiary rounded-lg">
                  <h4 className="font-medium mb-2">{campaign.name}</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-foreground-muted">Messages:</span>
                      <span className="font-medium">{campaignMessages.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground-muted">Avg Score:</span>
                      <span className={`font-medium ${getScoreColor(avgScore)}`}>{avgScore}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-foreground-muted">Sent:</span>
                      <span className="font-medium text-green-400">
                        {campaignMessages.filter(msg => msg.status === 'sent').length}
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
    </div>
  )
}