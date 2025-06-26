import OpenAI from 'openai'

if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing OPENAI_API_KEY environment variable')
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Rate limiting and usage tracking
class AIUsageTracker {
  constructor() {
    this.dailyUsage = {
      date: new Date().toDateString(),
      tokens: 0,
      requests: 0,
      cost: 0
    }
  }

  trackUsage(tokens, model = 'gpt-3.5-turbo') {
    const today = new Date().toDateString()
    
    if (this.dailyUsage.date !== today) {
      this.dailyUsage = { date: today, tokens: 0, requests: 0, cost: 0 }
    }

    this.dailyUsage.tokens += tokens
    this.dailyUsage.requests += 1
    
    // Approximate cost calculation (update based on current pricing)
    const costPer1kTokens = model.includes('gpt-4') ? 0.03 : 0.002
    this.dailyUsage.cost += (tokens / 1000) * costPer1kTokens
  }

  getUsage() {
    return this.dailyUsage
  }
}

export const usageTracker = new AIUsageTracker()

// Helper function for safe AI calls with retry logic
export async function safeAICall(promptFunction, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await promptFunction()
      
      // Track usage if response includes usage data
      if (result.usage) {
        usageTracker.trackUsage(result.usage.total_tokens)
      }
      
      return result
    } catch (error) {
      console.error(`AI call attempt ${attempt} failed:`, error)
      
      if (attempt === maxRetries) {
        throw error
      }
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
    }
  }
}

// Predefined prompts for consistent AI behavior
export const prompts = {
  analyzeIndustry: (industry, videoData) => `
Analyze the following industry data and extract actionable marketing insights:

Industry: ${industry}
Data: ${JSON.stringify(videoData, null, 2)}

Extract:
1. Key pain points this industry faces
2. Effective marketing strategies mentioned
3. Psychology-based approaches that work
4. Common objections and how to overcome them
5. Optimal outreach timing and methods

Format as JSON with clear categories and confidence scores.
`,

  generateMessage: (leadData, industryInsights, approach) => `
Generate a personalized outreach message for this lead:

Lead Information:
${JSON.stringify(leadData, null, 2)}

Industry Insights:
${industryInsights}

Approach: ${approach}
Your Name: ${process.env.NEXT_PUBLIC_YOUR_NAME}
Your Website: ${process.env.NEXT_PUBLIC_YOUR_WEBSITE}
Your Calendly: ${process.env.NEXT_PUBLIC_YOUR_CALENDLY}

Requirements:
- Under 150 words
- Reference specific issues found
- Include estimated ROI
- End with soft CTA
- Sound consultative, not salesy
- Include 3 subject line options

Return as JSON with message, subjectLines, and reasoning.
`,

  analyzeWebsite: (websiteData, industry) => `
Analyze this website for marketing opportunities:

Website Data: ${JSON.stringify(websiteData, null, 2)}
Industry: ${industry}

Identify:
1. Marketing issues and gaps
2. Conversion optimization opportunities  
3. SEO and performance problems
4. Missing tracking/analytics
5. Estimated improvement potential

Score the opportunity 0-100 and provide specific recommendations.
`,

  optimizeMessage: (message, responseData) => `
Optimize this outreach message based on performance data:

Original Message: ${message}
Response Data: ${JSON.stringify(responseData, null, 2)}

Improve:
1. Subject line effectiveness
2. Opening hook strength
3. Value proposition clarity
4. Call-to-action power
5. Overall persuasiveness

Return optimized version with explanations.
`
}

// Specialized AI functions for common tasks
export async function analyzeLeadOpportunity(leadData, industryKnowledge) {
  try {
    const response = await safeAICall(() => 
      openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{
          role: "user", 
          content: prompts.analyzeWebsite(leadData, leadData.company?.industry)
        }],
        max_tokens: 800,
        temperature: 0.3
      })
    )

    return JSON.parse(response.choices[0].message.content)
  } catch (error) {
    console.error('Lead opportunity analysis failed:', error)
    return {
      opportunityScore: 50,
      issues: ['Analysis temporarily unavailable'],
      recommendations: ['Manual review recommended']
    }
  }
}

export async function generatePersonalizedMessage(leadData, industryInsights, approach = 'problem_focused') {
  try {
    const response = await safeAICall(() =>
      openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{
          role: "user",
          content: prompts.generateMessage(leadData, industryInsights, approach)
        }],
        max_tokens: 600,
        temperature: 0.7
      })
    )

    return JSON.parse(response.choices[0].message.content)
  } catch (error) {
    console.error('Message generation failed:', error)
    return {
      message: `Hi ${leadData.contact?.name || 'there'},\n\nI noticed some opportunities to improve ${leadData.company?.name}'s marketing performance. Would you be open to a brief conversation about your current challenges?\n\nBest regards,\n${process.env.NEXT_PUBLIC_YOUR_NAME}`,
      subjectLines: ['Marketing opportunity', 'Quick question', 'Noticed something interesting'],
      reasoning: 'Fallback message due to AI generation error'
    }
  }
}

export async function extractYouTubeInsights(transcript, industry) {
  try {
    const response = await safeAICall(() =>
      openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{
          role: "user",
          content: `
Extract marketing insights from this YouTube transcript for the ${industry} industry:

Transcript: ${transcript.substring(0, 6000)}

Extract:
1. Specific strategies mentioned
2. Industry pain points discussed
3. Psychology/persuasion techniques
4. Success stories or case studies
5. Tools or methods recommended

Rate each insight 1-10 for relevance to ${industry} outreach.
Format as JSON array with text, category, and relevanceScore.
`
        }],
        max_tokens: 1000,
        temperature: 0.4
      })
    )

    return JSON.parse(response.choices[0].message.content)
  } catch (error) {
    console.error('YouTube insight extraction failed:', error)
    return []
  }
}

// Message optimization based on performance data
export async function optimizeMessagePerformance(messageData, responseData) {
  try {
    const response = await safeAICall(() =>
      openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{
          role: "user",
          content: prompts.optimizeMessage(messageData.message, responseData)
        }],
        max_tokens: 600,
        temperature: 0.5
      })
    )

    return JSON.parse(response.choices[0].message.content)
  } catch (error) {
    console.error('Message optimization failed:', error)
    return {
      optimizedMessage: messageData.message,
      improvements: ['Optimization temporarily unavailable'],
      confidenceScore: 50
    }
  }
}

// Generate industry-specific insights summary
export async function generateIndustrySummary(industryData) {
  try {
    const response = await safeAICall(() =>
      openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{
          role: "user",
          content: `
Summarize key insights for outreach in this industry:

Data: ${JSON.stringify(industryData, null, 2)}

Generate:
1. Top 5 pain points to address
2. Most effective message approaches
3. Best timing and frequency
4. Psychology triggers that work
5. Value propositions that resonate

Keep it actionable for a marketing professional doing cold outreach.
`
        }],
        max_tokens: 800,
        temperature: 0.6
      })
    )

    return response.choices[0].message.content
  } catch (error) {
    console.error('Industry summary generation failed:', error)
    return 'Industry summary temporarily unavailable'
  }
}

export default openai