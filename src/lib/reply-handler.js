// lib/reply-handler.js
'use client'

// 🤖 AUTOMATED REPLY HANDLING & LEAD SCORING
// AI-powered email/DM response classification and automated follow-ups

// 📧 Main Reply Processing Function
export const processIncomingReply = async (replyData) => {
  try {
    console.log(`📧 Processing reply from ${replyData.fromEmail}...`)
    
    // 1. Classify the reply type
    const classification = await classifyReply(replyData.content, replyData.subject)
    
    // 2. Update lead score based on engagement
    const leadUpdate = await updateLeadScore(replyData.leadId, classification)
    
    // 3. Generate appropriate auto-response
    const autoResponse = await generateAutoResponse(classification, replyData, leadUpdate)
    
    // 4. Determine if human intervention needed
    const alertData = await checkHighIntentAlert(classification, leadUpdate)
    
    // 5. Schedule follow-up if needed
    const followUp = await scheduleFollowUp(classification, replyData, leadUpdate)

    console.log(`✅ Reply processed: ${classification.category} (Score: ${leadUpdate.newScore})`)
    
    return {
      classification,
      leadUpdate,
      autoResponse,
      alertData,
      followUp,
      processedAt: new Date()
    }
  } catch (error) {
    console.error('Reply processing failed:', error)
    return { error: error.message }
  }
}

// 🔍 AI Reply Classification
const classifyReply = async (content, subject = '') => {
  const OPENAI_API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY
  
  if (!OPENAI_API_KEY) {
    return classifyReplyWithRules(content, subject)
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are an email reply classifier for cold outreach. Classify replies into these exact categories:

1. "Interested" - Contains: "call", "talk", "demo", "meeting", "discuss", "interested", "yes", "when", "schedule"
2. "Not Now" - Contains: "later", "6 months", "next quarter", "not right now", "maybe later", "future"
3. "Objection" - Contains: "cost", "price", "expensive", "budget", "in-house", "already have", "satisfied"
4. "Unsubscribe" - Contains: "remove", "unsubscribe", "stop", "opt-out", "no longer interested"
5. "Question" - Contains: "?", "how", "what", "explain", "more info", "details", "curious"
6. "Positive" - General positive response without specific action request
7. "Negative" - Clear rejection or negative response

Respond with ONLY the category name and confidence score (1-10).
Format: "Category: Confidence"`
          },
          {
            role: 'user',
            content: `Classify this email reply:
Subject: ${subject}
Content: ${content}`
          }
        ],
        max_tokens: 50,
        temperature: 0.1
      })
    })

    if (response.ok) {
      const data = await response.json()
      const result = data.choices[0].message.content.trim()
      const [category, confidence] = result.split(':').map(s => s.trim())
      
      return {
        category: category.toLowerCase(),
        confidence: parseInt(confidence) || 5,
        method: 'ai_classification',
        keywords: extractKeywords(content),
        sentiment: analyzeSentiment(content)
      }
    }
  } catch (error) {
    console.error('AI classification failed:', error)
  }

  return classifyReplyWithRules(content, subject)
}

// 📋 Rule-based Reply Classification (Fallback)
const classifyReplyWithRules = (content, subject) => {
  const text = (content + ' ' + subject).toLowerCase()
  
  const rules = [
    {
      category: 'interested',
      keywords: ['call', 'talk', 'demo', 'meeting', 'discuss', 'interested', 'yes', 'when', 'schedule', 'available', 'calendar'],
      weight: 10
    },
    {
      category: 'not now',
      keywords: ['later', '6 months', 'next quarter', 'not right now', 'maybe later', 'future', 'busy', 'not the right time'],
      weight: 8
    },
    {
      category: 'objection',
      keywords: ['cost', 'price', 'expensive', 'budget', 'in-house', 'already have', 'satisfied', 'working with'],
      weight: 9
    },
    {
      category: 'unsubscribe',
      keywords: ['remove', 'unsubscribe', 'stop', 'opt-out', 'no longer interested', 'not interested'],
      weight: 10
    },
    {
      category: 'question',
      keywords: ['?', 'how', 'what', 'explain', 'more info', 'details', 'curious', 'tell me'],
      weight: 7
    },
    {
      category: 'positive',
      keywords: ['thanks', 'appreciate', 'helpful', 'interesting', 'good', 'great'],
      weight: 6
    },
    {
      category: 'negative',
      keywords: ['no', 'not interested', 'wrong person', 'don\'t need', 'spam'],
      weight: 8
    }
  ]

  let bestMatch = { category: 'question', confidence: 3 }
  let maxScore = 0

  for (const rule of rules) {
    const matches = rule.keywords.filter(keyword => text.includes(keyword))
    const score = matches.length * rule.weight

    if (score > maxScore) {
      maxScore = score
      bestMatch = {
        category: rule.category,
        confidence: Math.min(Math.floor(score / 2) + 3, 10),
        matchedKeywords: matches
      }
    }
  }

  return {
    ...bestMatch,
    method: 'rule_based',
    keywords: extractKeywords(content),
    sentiment: analyzeSentiment(content)
  }
}

// 📊 Lead Scoring System
export const updateLeadScore = async (leadId, classification) => {
  try {
    const lead = await appStore.getLeadById(leadId)
    if (!lead) return { error: 'Lead not found' }

    const currentScore = lead.opportunity?.score || 50
    let scoreChange = 0
    let newTier = lead.tier || 3

    // Score adjustments based on reply type
    const scoreAdjustments = {
      'interested': +25,
      'question': +15,
      'positive': +10,
      'not now': +5,
      'objection': -5,
      'negative': -15,
      'unsubscribe': -30
    }

    scoreChange = scoreAdjustments[classification.category] || 0
    
    // Confidence multiplier
    const confidenceMultiplier = classification.confidence / 10
    scoreChange = Math.round(scoreChange * confidenceMultiplier)

    const newScore = Math.max(0, Math.min(100, currentScore + scoreChange))

    // Update tier based on new score and engagement
    if (classification.category === 'interested' && newScore > 80) {
      newTier = 1
    } else if (['question', 'positive'].includes(classification.category) && newScore > 65) {
      newTier = Math.min(newTier, 2)
    }

    // Update lead in store
    const leadUpdate = {
      'opportunity.score': newScore,
      'tier': newTier,
      'lastEngagement': new Date(),
      'engagementHistory': [
        ...(lead.engagementHistory || []),
        {
          type: 'reply',
          category: classification.category,
          scoreChange: scoreChange,
          timestamp: new Date(),
          confidence: classification.confidence
        }
      ]
    }

    await appStore.updateLead(leadId, leadUpdate)

    return {
      leadId,
      oldScore: currentScore,
      newScore,
      scoreChange,
      oldTier: lead.tier,
      newTier,
      engagement: classification.category
    }
  } catch (error) {
    console.error('Lead score update failed:', error)
    return { error: error.message }
  }
}

// 🤖 Auto-Response Generation
const generateAutoResponse = async (classification, replyData, leadUpdate) => {
  const OPENAI_API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY
  
  // Check if auto-response is appropriate
  if (!shouldAutoRespond(classification, leadUpdate)) {
    return { shouldSend: false, reason: 'Human intervention recommended' }
  }

  const responseTemplates = getResponseTemplates(classification.category, leadUpdate)
  
  if (OPENAI_API_KEY && classification.category === 'interested') {
    // Generate personalized response for high-intent replies
    return await generateAIResponse(classification, replyData, leadUpdate)
  }

  return {
    shouldSend: true,
    subject: responseTemplates.subject,
    content: responseTemplates.content,
    delay: responseTemplates.delay || 300, // seconds
    method: 'template'
  }
}

const generateAIResponse = async (classification, replyData, leadUpdate) => {
  const OPENAI_API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY
  
  try {
    const lead = await appStore.getLeadById(replyData.leadId)
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are responding to an interested lead for an e-commerce optimization service. Keep responses professional, brief (under 100 words), and focused on scheduling a call. Always include a Calendly link.`
          },
          {
            role: 'user',
            content: `Lead replied: "${replyData.content}"

Lead context:
- Company: ${lead.company.name}
- Platform: ${lead.company.platform}  
- Tier: ${leadUpdate.newTier}
- Main pain point: ${lead.opportunity?.painPoints?.[0] || 'conversion optimization'}

Generate a response that:
1. Thanks them for their interest
2. References their specific situation
3. Proposes a specific meeting time
4. Includes calendly link
5. Keeps under 80 words`
          }
        ],
        max_tokens: 200,
        temperature: 0.7
      })
    })

    if (response.ok) {
      const data = await response.json()
      return {
        shouldSend: true,
        subject: `Re: ${replyData.subject}`,
        content: data.choices[0].message.content,
        delay: 180, // 3 minutes for interested leads
        method: 'ai_generated',
        calendlyLink: `https://calendly.com/your-calendar?lead=${replyData.leadId}`
      }
    }
  } catch (error) {
    console.error('AI response generation failed:', error)
  }

  // Fallback to template
  return getResponseTemplates('interested', leadUpdate)
}

// 📝 Response Templates
const getResponseTemplates = (category, leadUpdate) => {
  const templates = {
    'interested': {
      subject: 'Quick 15-min call?',
      content: `Thanks for your interest! I'd love to show you exactly how we can help ${leadUpdate.companyName || 'your store'}.

I have a few slots open this week - would Tuesday at 2pm or Wednesday at 10am work better?

Book directly: https://calendly.com/your-calendar?lead=${leadUpdate.leadId}

Looking forward to it!`,
      delay: 180
    },
    'question': {
      subject: 'Re: Your question',
      content: `Great question! I'd be happy to explain more about how this works specifically for ${leadUpdate.companyName || 'your business'}.

The easiest way is to show you a quick example on a 10-minute call. Would that work?

Calendar: https://calendly.com/your-calendar?lead=${leadUpdate.leadId}`,
      delay: 300
    },
    'positive': {
      subject: 'Glad it was helpful!',
      content: `Happy to help! If you'd like to see how this applies specifically to your situation, I'm happy to do a quick review.

No obligation - just want to make sure you get the best results.

Calendar: https://calendly.com/your-calendar?lead=${leadUpdate.leadId}`,
      delay: 600
    },
    'not now': {
      subject: 'Following up',
      content: `No problem at all! I'll check back in a few months.

In the meantime, here's a free tool that might help: [Free Tool Link]

Feel free to reach out when the timing is better.`,
      delay: 1800
    },
    'objection': {
      subject: 'No worries!',
      content: `Totally understand! Here's a free resource that might help with ${leadUpdate.painPoint || 'optimization'}: [Free Resource Link]

No strings attached - just want to help.

Good luck with everything!`,
      delay: 900
    }
  }

  return templates[category] || {
    shouldSend: false,
    reason: 'No template available'
  }
}

// 🚨 High-Intent Alert System
const checkHighIntentAlert = async (classification, leadUpdate) => {
  const shouldAlert = 
    classification.category === 'interested' ||
    (leadUpdate.newScore > 85) ||
    (leadUpdate.newTier === 1 && classification.confidence > 8)

  if (!shouldAlert) return { shouldAlert: false }

  const alertData = {
    shouldAlert: true,
    urgency: classification.category === 'interested' ? 'high' : 'medium',
    message: `🔥 High-intent lead: ${leadUpdate.companyName || 'Unknown'} replied "${classification.category}"`,
    leadId: leadUpdate.leadId,
    newScore: leadUpdate.newScore,
    tier: leadUpdate.newTier,
    replyCategory: classification.category,
    confidence: classification.confidence,
    actionRequired: classification.category === 'interested' ? 'Schedule call ASAP' : 'Review and respond',
    timestamp: new Date()
  }

  // Send alert (Slack, email, etc.)
  await sendHighIntentAlert(alertData)
  
  return alertData
}

// 📱 Send High-Intent Alerts
const sendHighIntentAlert = async (alertData) => {
  try {
    // Multiple alert channels
    const alertPromises = []

    // Slack alert
    if (process.env.NEXT_PUBLIC_SLACK_WEBHOOK) {
      alertPromises.push(sendSlackAlert(alertData))
    }

    // Email alert  
    if (process.env.NEXT_PUBLIC_ALERT_EMAIL) {
      alertPromises.push(sendEmailAlert(alertData))
    }

    // Browser notification
    if (typeof window !== 'undefined' && 'Notification' in window) {
      alertPromises.push(sendBrowserNotification(alertData))
    }

    await Promise.allSettled(alertPromises)
    console.log(`🚨 High-intent alert sent for lead ${alertData.leadId}`)
  } catch (error) {
    console.error('Alert sending failed:', error)
  }
}

const sendSlackAlert = async (alertData) => {
  const webhookUrl = process.env.NEXT_PUBLIC_SLACK_WEBHOOK
  
  const slackMessage = {
    text: "🔥 High-Intent Lead Alert!",
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "🔥 High-Intent Lead Reply!"
        }
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Company:* ${alertData.companyName || 'Unknown'}`
          },
          {
            type: "mrkdwn", 
            text: `*Reply Type:* ${alertData.replyCategory}`
          },
          {
            type: "mrkdwn",
            text: `*Score:* ${alertData.newScore}/100`
          },
          {
            type: "mrkdwn",
            text: `*Tier:* ${alertData.tier}`
          }
        ]
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Action Required:* ${alertData.actionRequired}`
        }
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "View Lead"
            },
            url: `https://your-app.com/leads/${alertData.leadId}`,
            style: "primary"
          },
          {
            type: "button", 
            text: {
              type: "plain_text",
              text: "Send Calendar"
            },
            url: `https://calendly.com/your-calendar?lead=${alertData.leadId}`
          }
        ]
      }
    ]
  }

  return fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(slackMessage)
  })
}

// 📅 Follow-up Scheduling
const scheduleFollowUp = async (classification, replyData, leadUpdate) => {
  const followUpRules = {
    'interested': { delay: 0, message: 'No follow-up needed - human taking over' },
    'question': { delay: 24, message: 'Did my response help answer your question?' },
    'positive': { delay: 72, message: 'Following up on our conversation...' },
    'not now': { delay: 2160, message: 'Checking back as requested...' }, // 3 days
    'objection': { delay: 10080, message: 'Hope the free resource was helpful!' }, // 1 week
    'negative': { delay: 0, message: 'No follow-up scheduled' },
    'unsubscribe': { delay: 0, message: 'Lead unsubscribed - no follow-up' }
  }

  const rule = followUpRules[classification.category]
  
  if (!rule || rule.delay === 0) {
    return { scheduled: false, reason: rule?.message || 'No follow-up needed' }
  }

  const followUp = {
    leadId: replyData.leadId,
    type: 'automated_followup',
    scheduledFor: new Date(Date.now() + (rule.delay * 60 * 1000)), // Convert hours to ms
    message: rule.message,
    triggerEvent: classification.category,
    priority: leadUpdate.newTier === 1 ? 'high' : 'normal',
    status: 'scheduled'
  }

  // Store follow-up in database/queue
  await appStore.scheduleFollowUp(followUp)
  
  return {
    scheduled: true,
    followUpId: `followup_${Date.now()}`,
    scheduledFor: followUp.scheduledFor,
    message: followUp.message
  }
}

// 🤔 Auto-Response Decision Logic
const shouldAutoRespond = (classification, leadUpdate) => {
  // Never auto-respond to unsubscribes
  if (classification.category === 'unsubscribe') return false
  
  // Always auto-respond to positive categories
  if (['interested', 'question', 'positive'].includes(classification.category)) return true
  
  // Auto-respond to objections and "not now" with helpful resources
  if (['objection', 'not now'].includes(classification.category)) return true
  
  // Don't auto-respond to negative or unclear replies
  if (['negative'].includes(classification.category) || classification.confidence < 6) return false
  
  return true
}

// 🔧 Helper Functions
const extractKeywords = (text) => {
  const keywords = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3)
    .slice(0, 10)
  
  return [...new Set(keywords)]
}

const analyzeSentiment = (text) => {
  const positiveWords = ['great', 'good', 'excellent', 'perfect', 'love', 'amazing', 'fantastic', 'yes', 'interested']
  const negativeWords = ['bad', 'terrible', 'hate', 'no', 'never', 'wrong', 'awful', 'spam', 'stop']
  
  const words = text.toLowerCase().split(/\s+/)
  const positiveCount = words.filter(word => positiveWords.includes(word)).length
  const negativeCount = words.filter(word => negativeWords.includes(word)).length
  
  if (positiveCount > negativeCount) return 'positive'
  if (negativeCount > positiveCount) return 'negative'
  return 'neutral'
}

// 📊 Reply Analytics
export const getReplyAnalytics = async (campaignId, timeframe = '7d') => {
  try {
    const leads = await appStore.getLeadsByCampaign(campaignId)
    const replies = leads.flatMap(lead => lead.engagementHistory || [])
      .filter(engagement => engagement.type === 'reply')
    
    const analytics = {
      totalReplies: replies.length,
      replyRate: replies.length / leads.length * 100,
      categories: {},
      averageScore: 0,
      tierDistribution: { 1: 0, 2: 0, 3: 0 },
      sentimentBreakdown: { positive: 0, neutral: 0, negative: 0 }
    }

    replies.forEach(reply => {
      // Category breakdown
      analytics.categories[reply.category] = (analytics.categories[reply.category] || 0) + 1
      
      // Sentiment tracking
      if (reply.sentiment) {
        analytics.sentimentBreakdown[reply.sentiment]++
      }
    })

    // Calculate average score change
    const scoreChanges = replies.map(r => r.scoreChange || 0)
    analytics.averageScoreChange = scoreChanges.reduce((a, b) => a + b, 0) / scoreChanges.length

    // Tier distribution
    leads.forEach(lead => {
      if (lead.tier >= 1 && lead.tier <= 3) {
        analytics.tierDistribution[lead.tier]++
      }
    })

    return analytics
  } catch (error) {
    console.error('Reply analytics failed:', error)
    return { error: error.message }
  }
}

// 🎯 Lead Scoring Rules Export
export const LEAD_SCORING_RULES = {
  reply_categories: {
    'interested': { score: +25, tier_boost: true, alert: true },
    'question': { score: +15, tier_boost: false, alert: false },
    'positive': { score: +10, tier_boost: false, alert: false },
    'not_now': { score: +5, tier_boost: false, alert: false },
    'objection': { score: -5, tier_boost: false, alert: false },
    'negative': { score: -15, tier_boost: false, alert: false },
    'unsubscribe': { score: -30, tier_boost: false, alert: false }
  },
  tier_thresholds: {
    tier_1: { min_score: 80, engagement_required: ['interested', 'question'] },
    tier_2: { min_score: 65, engagement_required: ['positive', 'question'] },
    tier_3: { min_score: 0, engagement_required: [] }
  },
  auto_response_delays: {
    'interested': 180,    // 3 minutes
    'question': 300,      // 5 minutes  
    'positive': 600,      // 10 minutes
    'not_now': 1800,      // 30 minutes
    'objection': 900      // 15 minutes
  }
}

// Main exports
export {
  processIncomingReply,
  updateLeadScore,
  checkHighIntentAlert,
  scheduleFollowUp,
  getReplyAnalytics,
  classifyReply
}