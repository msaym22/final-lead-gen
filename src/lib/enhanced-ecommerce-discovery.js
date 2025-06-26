// Enhanced E-commerce Lead Discovery with YouTube Research
// File: lib/enhanced-ecommerce-discovery.js

import { YoutubeResearcher } from './youtube'

export class EnhancedEcommerceDiscovery {
  constructor() {
    this.youtubeResearcher = new YoutubeResearcher()
    this.freeTrialTools = {
      clearbit: {
        baseUrl: 'https://person.clearbit.com/v1/people/email/',
        freeLimit: 50,
        used: 0
      },
      apollo: {
        baseUrl: 'https://api.apollo.io/v1',
        freeLimit: 60,
        used: 0
      },
      builtwith: {
        baseUrl: 'https://api.builtwith.com/v20/api.json',
        freeLimit: 200,
        used: 0
      }
    }
  }

  // Main enhanced discovery function
  async discoverEcommerceStoresWithResearch(campaign) {
    console.log(`🚀 Starting enhanced e-commerce discovery for ${campaign.targetIndustry}...`)
    
    const results = {
      stores: [],
      youtubeInsights: null,
      industryTrends: {},
      competitorAnalysis: {},
      messagingInsights: [],
      totalCost: 0
    }

    try {
      // Step 1: Run YouTube research for industry insights
      console.log('📺 Gathering YouTube insights for industry trends...')
      const youtubeData = await this.youtubeResearcher.searchByIndustry(
        campaign.targetIndustry,
        {
          depth: 'standard',
          minViews: 5000,
          includeChannelInfo: true
        }
      )
      
      results.youtubeInsights = youtubeData
      results.industryTrends = this.extractIndustryTrends(youtubeData)
      results.messagingInsights = this.generateMessagingInsights(youtubeData, campaign.targetIndustry)

      // Step 2: Traditional e-commerce store discovery
      console.log('🛍️ Discovering e-commerce stores...')
      const stores = await this.discoverEcommerceStores(campaign)
      
      // Step 3: Enhance stores with free trial data
      console.log('🔍 Enhancing store data with free tools...')
      const enhancedStores = await this.enhanceStoresWithFreeTools(stores)
      
      results.stores = enhancedStores
      results.totalCost = this.calculateEnhancedCost(stores.length, youtubeData.videos.length)

      // Step 4: Generate enhanced messaging based on YouTube insights
      console.log('💡 Creating insight-driven messaging...')
      results.enhancedMessages = this.generateEnhancedMessages(enhancedStores, results.messagingInsights, campaign)

      return results

    } catch (error) {
      console.error('Enhanced discovery failed:', error)
      throw error
    }
  }

  // Extract industry trends from YouTube data
  extractIndustryTrends(youtubeData) {
    const trends = {
      popularTopics: {},
      commonPainPoints: [],
      successStrategies: [],
      contentGaps: [],
      averageEngagement: 0
    }

    youtubeData.videos.forEach(video => {
      // Extract topics from titles
      const topics = this.extractTopicsFromTitle(video.title)
      topics.forEach(topic => {
        trends.popularTopics[topic] = (trends.popularTopics[topic] || 0) + 1
      })

      // Analyze transcript for pain points and strategies
      if (video.transcript) {
        const painPoints = this.extractPainPoints(video.transcript)
        const strategies = this.extractSuccessStrategies(video.transcript)
        
        trends.commonPainPoints.push(...painPoints)
        trends.successStrategies.push(...strategies)
      }

      // Calculate engagement
      const engagement = (video.likeCount + video.commentCount) / video.viewCount
      trends.averageEngagement += engagement
    })

    trends.averageEngagement = trends.averageEngagement / youtubeData.videos.length
    trends.commonPainPoints = [...new Set(trends.commonPainPoints)].slice(0, 10)
    trends.successStrategies = [...new Set(trends.successStrategies)].slice(0, 10)

    return trends
  }

  // Generate messaging insights from YouTube research
  generateMessagingInsights(youtubeData, industry) {
    const insights = []

    // Analyze successful video titles for messaging patterns
    const highEngagementVideos = youtubeData.videos
      .filter(video => video.relevanceScore > 70)
      .slice(0, 10)

    highEngagementVideos.forEach(video => {
      insights.push({
        type: 'successful_headline',
        pattern: this.extractHeadlinePattern(video.title),
        engagement: video.viewCount,
        example: video.title,
        applicableFor: this.determineApplicability(video.title, industry)
      })
    })

    // Extract common value propositions
    const valueProps = this.extractValuePropositions(youtubeData.videos)
    insights.push({
      type: 'value_propositions',
      propositions: valueProps,
      industry: industry
    })

    return insights
  }

  // Enhance stores with free trial tools
  async enhanceStoresWithFreeTools(stores) {
    const enhancedStores = []

    for (const store of stores) {
      try {
        const enhanced = { ...store }

        // Use Clearbit for company enrichment (if under free limit)
        if (this.freeTrialTools.clearbit.used < this.freeTrialTools.clearbit.freeLimit) {
          const clearbitData = await this.enrichWithClearbit(store)
          if (clearbitData) {
            enhanced.company = { ...enhanced.company, ...clearbitData }
            this.freeTrialTools.clearbit.used++
          }
        }

        // Use BuiltWith for technology detection
        if (this.freeTrialTools.builtwith.used < this.freeTrialTools.builtwith.freeLimit) {
          const techStack = await this.detectTechnologyStack(store.company.website)
          if (techStack) {
            enhanced.company.technologies = techStack
            this.freeTrialTools.builtwith.used++
          }
        }

        // Calculate enhanced opportunity score
        enhanced.opportunity.enhancedScore = this.calculateEnhancedOpportunityScore(enhanced)
        
        enhancedStores.push(enhanced)
        
        // Rate limiting for free APIs
        await this.sleep(1000)

      } catch (error) {
        console.error(`Error enhancing store ${store.company.name}:`, error)
        enhancedStores.push(store) // Add original if enhancement fails
      }
    }

    return enhancedStores
  }

  // Clearbit enrichment (free tier)
  async enrichWithClearbit(store) {
    try {
      if (!store.contact?.email) return null

      // Note: This would use Clearbit's free tier
      // For demo purposes, we'll simulate the response
      const mockClearbitData = {
        employeeCount: Math.floor(Math.random() * 50) + 1,
        annualRevenue: Math.floor(Math.random() * 90000) + 10000,
        industry: store.company.industry,
        location: {
          city: 'Unknown',
          state: 'Unknown',
          country: 'US'
        },
        socialProfiles: {
          linkedin: null,
          facebook: `https://facebook.com/${store.company.name.toLowerCase().replace(/\s+/g, '')}`
        }
      }

      return mockClearbitData
    } catch (error) {
      console.error('Clearbit enrichment failed:', error)
      return null
    }
  }

  // Technology stack detection using BuiltWith-style analysis
  async detectTechnologyStack(website) {
    try {
      // This would normally call BuiltWith API
      // For demo, we'll simulate technology detection
      const commonEcommerceTech = [
        'Shopify', 'WooCommerce', 'BigCommerce', 'Magento',
        'Google Analytics', 'Facebook Pixel', 'Klaviyo',
        'Stripe', 'PayPal', 'Mailchimp'
      ]

      const detectedTech = commonEcommerceTech
        .filter(() => Math.random() > 0.7) // Simulate detection
        .slice(0, Math.floor(Math.random() * 4) + 2)

      return {
        ecommercePlatform: detectedTech.find(tech => 
          ['Shopify', 'WooCommerce', 'BigCommerce', 'Magento'].includes(tech)
        ) || 'Unknown',
        analytics: detectedTech.filter(tech => 
          ['Google Analytics', 'Facebook Pixel'].includes(tech)
        ),
        emailMarketing: detectedTech.filter(tech => 
          ['Klaviyo', 'Mailchimp'].includes(tech)
        ),
        payments: detectedTech.filter(tech => 
          ['Stripe', 'PayPal'].includes(tech)
        )
      }
    } catch (error) {
      console.error('Technology detection failed:', error)
      return null
    }
  }

  // Generate enhanced messages using YouTube insights
  generateEnhancedMessages(stores, messagingInsights, campaign) {
    return stores.map((store, index) => {
      const insights = this.selectBestInsights(messagingInsights, store, campaign)
      const template = this.createInsightDrivenTemplate(store, insights, campaign)
      
      return {
        id: `enhanced_msg_${campaign.id}_${Date.now()}_${index}`,
        leadId: store.id,
        campaignId: campaign.id,
        leadName: store.contact?.name || 'Store Owner',
        company: store.company.name,
        subject: template.subject,
        message: template.message,
        approach: 'youtube_insight_driven',
        score: store.opportunity?.enhancedScore || 85,
        status: 'draft',
        generatedAt: new Date(),
        insights: insights,
        personalizedElements: template.personalizedElements
      }
    })
  }

  // Create insight-driven message templates
  createInsightDrivenTemplate(store, insights, campaign) {
    const firstName = store.contact?.firstName || 'there'
    const industry = campaign.targetIndustry
    
    // Use YouTube insights for messaging
    const commonPainPoint = insights.painPoints?.[0] || 'low conversion rates'
    const successStrategy = insights.strategies?.[0] || 'optimized ad targeting'
    const popularTopic = insights.popularTopics?.[0] || 'email marketing'

    const templates = {
      subject: `${store.company.name} - ${industry} stores are solving ${commonPainPoint} with this approach`,
      message: `Hi ${firstName},

I was researching successful ${industry} stores and noticed that many are struggling with ${commonPainPoint}.

Recently analyzed 15+ ${industry} marketing case studies and found that stores like yours are getting great results with ${successStrategy}.

${store.company.name} has strong potential - I noticed you're using ${store.company.technologies?.ecommercePlatform || 'a solid platform'}, which is perfect for the optimization strategies that are working right now.

The approach I'm seeing work best for ${industry} stores:
• ${successStrategy}
• Improved ${popularTopic} automation
• ${insights.valueProps?.[0] || 'Better customer targeting'}

Most clients see 25-40% improvement in the first 30 days.

Would a brief conversation about what's working in ${industry} right now make sense?

Best regards,
Muhammad Saim

P.S. I just put together a case study analysis from successful ${industry} stores - happy to share the key insights if helpful.`,
      personalizedElements: [
        `Industry research: ${industry}`,
        `Pain point: ${commonPainPoint}`,
        `Success strategy: ${successStrategy}`,
        `Platform: ${store.company.technologies?.ecommercePlatform || 'Unknown'}`,
        `Popular topic: ${popularTopic}`
      ]
    }

    return templates
  }

  // Helper methods
  extractTopicsFromTitle(title) {
    const topicKeywords = [
      'email marketing', 'facebook ads', 'google ads', 'seo',
      'conversion', 'automation', 'customer retention', 'sales funnel',
      'influencer marketing', 'content marketing', 'social media',
      'paid advertising', 'organic growth', 'analytics'
    ]
    
    const titleLower = title.toLowerCase()
    return topicKeywords.filter(topic => titleLower.includes(topic))
  }

  extractPainPoints(transcript) {
    const painPointIndicators = [
      'struggling with', 'problem with', 'difficult to', 'hard to',
      'failing at', 'not working', 'low conversion', 'poor performance',
      'expensive', 'wasting money', 'not profitable'
    ]
    
    const painPoints = []
    painPointIndicators.forEach(indicator => {
      if (transcript.toLowerCase().includes(indicator)) {
        painPoints.push(indicator.replace(/ing$/, '').replace(/ult$/, 'y'))
      }
    })
    
    return painPoints
  }

  extractSuccessStrategies(transcript) {
    const strategyIndicators = [
      'increased conversion', 'improved roi', 'better targeting',
      'automated email', 'optimized ads', 'higher engagement',
      'more sales', 'better results', 'growth strategy'
    ]
    
    return strategyIndicators.filter(strategy => 
      transcript.toLowerCase().includes(strategy)
    )
  }

  extractValuePropositions(videos) {
    const valueProps = [
      'increase revenue', 'reduce costs', 'save time', 'improve efficiency',
      'better targeting', 'higher conversion', 'more leads', 'automated processes'
    ]
    
    const foundProps = []
    videos.forEach(video => {
      const content = `${video.title} ${video.description}`.toLowerCase()
      valueProps.forEach(prop => {
        if (content.includes(prop) && !foundProps.includes(prop)) {
          foundProps.push(prop)
        }
      })
    })
    
    return foundProps.slice(0, 5)
  }

  selectBestInsights(messagingInsights, store, campaign) {
    // Select most relevant insights for this specific store
    return {
      painPoints: messagingInsights.find(i => i.type === 'pain_points')?.points || [],
      strategies: messagingInsights.find(i => i.type === 'success_strategies')?.strategies || [],
      popularTopics: Object.keys(messagingInsights.find(i => i.type === 'popular_topics')?.topics || {}).slice(0, 3),
      valueProps: messagingInsights.find(i => i.type === 'value_propositions')?.propositions || []
    }
  }

  calculateEnhancedOpportunityScore(store) {
    let score = store.opportunity?.score || 0
    
    // Bonus for technology stack detection
    if (store.company.technologies) {
      if (store.company.technologies.analytics?.length > 0) score += 5
      if (store.company.technologies.emailMarketing?.length === 0) score += 10 // Opportunity
      if (store.company.technologies.ecommercePlatform === 'Shopify') score += 5
    }
    
    // Bonus for company enrichment data
    if (store.company.employeeCount && store.company.employeeCount <= 25) score += 5
    if (store.company.annualRevenue && store.company.annualRevenue <= 100000) score += 5
    
    return Math.min(score, 100)
  }

  calculateEnhancedCost(storeCount, videoCount) {
    const baseCost = 2.10 // Original e-commerce discovery
    const youtubeCost = Math.min(videoCount * 0.01, 0.50) // YouTube API usage
    const enrichmentCost = Math.min(storeCount * 0.02, 0.30) // Free tool usage
    
    return (baseCost + youtubeCost + enrichmentCost).toFixed(2)
  }

  extractHeadlinePattern(title) {
    // Extract patterns like "How [X] increased [Y] by [Z]%"
    const patterns = [
      /how .+ increased .+ by \d+%/i,
      /\d+ ways to .+/i,
      /the secret to .+/i,
      /.+ that generated \$[\d,]+/i,
      /from \$[\d,]+ to \$[\d,]+/i
    ]
    
    for (const pattern of patterns) {
      if (pattern.test(title)) {
        return pattern.source
      }
    }
    
    return 'standard'
  }

  determineApplicability(title, industry) {
    if (title.toLowerCase().includes(industry.toLowerCase())) {
      return 'direct'
    } else if (title.toLowerCase().includes('ecommerce') || title.toLowerCase().includes('online store')) {
      return 'ecommerce_general'
    }
    return 'marketing_general'
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Traditional e-commerce discovery (from your existing code)
  async discoverEcommerceStores(campaign) {
    // This would call your existing EcommerceLeadDiscovery class
    // Placeholder for integration with your existing discovery logic
    const mockStores = [
      {
        id: `store_${Date.now()}_1`,
        company: {
          name: `Sample ${campaign.targetIndustry} Store`,
          website: 'https://example-store.com',
          industry: campaign.targetIndustry,
          platform: 'Shopify',
          monthlyRevenue: Math.floor(Math.random() * 5000) + 1000,
          storeSize: 'growing'
        },
        contact: {
          name: 'Store Owner',
          firstName: 'Store',
          email: 'owner@example-store.com',
          title: 'Owner',
          verified: true
        },
        opportunity: {
          score: Math.floor(Math.random() * 20) + 80,
          potentialMonthlyValue: Math.floor(Math.random() * 1000) + 500,
          urgencyLevel: 'high'
        },
        dataQuality: 'ecommerce_qualified_lead'
      }
    ]
    
    return mockStores
  }
}