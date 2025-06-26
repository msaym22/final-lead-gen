// lib/ecommerce-lead-discovery.js - Enhanced with automation integration
// Complete E-commerce Store Discovery System with Automation Support

import { RealisticEnhancedDiscovery } from './realistic-enhanced-discovery'
import { YoutubeResearcher } from './youtube'

export class EcommerceLeadDiscovery {
  constructor() {
    this.serperApiKey = process.env.NEXT_PUBLIC_SERPER_API_KEY
    this.hunterApiKey = process.env.NEXT_PUBLIC_HUNTER_API_KEY
    this.openaiApiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY
    this.youtubeApiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY
    
    // Initialize enhanced discovery systems
    this.realisticEnhanced = new RealisticEnhancedDiscovery()
    this.youtubeResearcher = new YoutubeResearcher()
  }

  // Main discovery method with automation level selection
  async discoverEcommerceStores(campaign) {
    console.log(`🛍️ Starting e-commerce discovery (${campaign.automationLevel || 'basic'} mode)...`)
    
    // Route to appropriate discovery method based on automation level
    switch (campaign.automationLevel) {
      case 'full':
        return await this.discoverWithFullAutomation(campaign)
      case 'hybrid':
        return await this.discoverWithHybridEnhancement(campaign)
      default:
        return await this.discoverBasicEcommerceStores(campaign)
    }
  }

  // Full automation discovery (Puppeteer + Extensions)
  async discoverWithFullAutomation(campaign) {
    try {
      console.log('🤖 Running full automation discovery...')
      
      // Check if full automation is available
      const automationResponse = await fetch('/api/automation/check-capabilities')
      const capabilities = await automationResponse.json()
      
      if (!capabilities.success || !capabilities.capabilities.fullAutomation) {
        console.warn('Full automation not available, falling back to hybrid')
        return await this.discoverWithHybridEnhancement(campaign)
      }

      // Call full automation API
      const response = await fetch('/api/automation/run-full-discovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaign })
      })

      const result = await response.json()
      
      if (result.success) {
        return result.stores
      } else {
        throw new Error(result.error || 'Full automation failed')
      }

    } catch (error) {
      console.error('Full automation failed, falling back to hybrid:', error)
      return await this.discoverWithHybridEnhancement(campaign)
    }
  }

  // Hybrid enhancement discovery (APIs + YouTube + Manual workflow)
  async discoverWithHybridEnhancement(campaign) {
    try {
      console.log('🔄 Running hybrid enhanced discovery...')
      
      const results = await this.realisticEnhanced.discoverEcommerceStoresWithRealisticEnhancement(campaign)
      return results.stores
      
    } catch (error) {
      console.error('Hybrid enhancement failed, falling back to basic:', error)
      return await this.discoverBasicEcommerceStores(campaign)
    }
  }

  // Basic e-commerce discovery (original method)
  async discoverBasicEcommerceStores(campaign) {
    console.log(`🛍️ Finding small e-commerce stores ($10k-$100k revenue)...`)
    
    const allLeads = []
    
    try {
      // Method 1: Shopify stores with low sales (prime targets)
      const shopifyLeads = await this.findStrugglingShopifyStores(campaign)
      allLeads.push(...shopifyLeads)
      
      // Method 2: WooCommerce stores needing marketing help
      const wooLeads = await this.findWooCommerceStores(campaign)
      allLeads.push(...wooLeads)
      
      // Method 3: Stores with poor performing ads
      const poorAdLeads = await this.findStoresWithPoorAds(campaign)
      allLeads.push(...poorAdLeads)
      
      // Filter for perfect size and revenue
      const qualifiedStores = await this.filterForSmallStores(allLeads, campaign)
      
      console.log(`✅ Found ${qualifiedStores.length} qualified small e-commerce stores`)
      return qualifiedStores
      
    } catch (error) {
      console.error('Basic discovery failed:', error)
      throw error
    }
  }

  // Enhanced discovery with YouTube integration
  async discoverWithYouTubeResearch(campaign) {
    console.log('📺 Starting discovery with YouTube research integration...')
    
    try {
      // Step 1: Run YouTube industry research
      const youtubeData = await this.youtubeResearcher.searchByIndustry(
        campaign.targetIndustry,
        { depth: campaign.researchDepth || 'standard', minViews: 5000 }
      )
      
      // Step 2: Basic e-commerce discovery
      const stores = await this.discoverBasicEcommerceStores(campaign)
      
      // Step 3: Enhance messaging with YouTube insights
      const enhancedStores = stores.map(store => ({
        ...store,
        youtubeInsights: {
          industryTrends: this.extractIndustryTrends(youtubeData),
          messagingInsights: this.generateMessagingInsights(youtubeData, campaign.targetIndustry)
        }
      }))
      
      return {
        stores: enhancedStores,
        youtubeResearch: youtubeData,
        enhancementLevel: 'youtube_enhanced'
      }
      
    } catch (error) {
      console.error('YouTube enhanced discovery failed:', error)
      // Fallback to basic discovery
      const stores = await this.discoverBasicEcommerceStores(campaign)
      return { stores, enhancementLevel: 'basic' }
    }
  }

  // Method 1: Find struggling Shopify stores
  async findStrugglingShopifyStores(campaign) {
    const searchQueries = [
      `site:myshopify.com "${campaign.targetIndustry}" "need more sales"`,
      `site:myshopify.com "struggling with sales" "${campaign.targetIndustry}"`,
      `site:myshopify.com "not getting enough customers" "${campaign.targetIndustry}"`,
      `site:myshopify.com "small business" "${campaign.targetIndustry}"`
    ]

    const leads = []
    for (const query of searchQueries) {
      try {
        const searchResults = await this.performSerperSearch(query, { 
          dateRestrict: 'm6',
          gl: this.getCountryCode(campaign.targetLocation)
        })
        const processedLeads = await this.processShopifyStores(searchResults, campaign)
        leads.push(...processedLeads)
        await this.delay(1500)
      } catch (error) {
        console.warn(`Shopify search failed: ${query}`, error)
      }
    }

    return this.removeDuplicates(leads)
  }

  // Method 2: Find WooCommerce stores
  async findWooCommerceStores(campaign) {
    const searchQueries = [
      `"${campaign.targetIndustry}" "powered by woocommerce" "small business" site:*.com`,
      `"${campaign.targetIndustry}" "woocommerce" "online store" site:*.com`,
      `"${campaign.targetIndustry}" "wordpress" "ecommerce" site:*.com`
    ]

    const leads = []
    for (const query of searchQueries) {
      try {
        const searchResults = await this.performSerperSearch(query, {
          gl: this.getCountryCode(campaign.targetLocation)
        })
        const processedLeads = await this.processWooCommerceStores(searchResults, campaign)
        leads.push(...processedLeads)
        await this.delay(1500)
      } catch (error) {
        console.warn(`WooCommerce search failed: ${query}`, error)
      }
    }

    return this.removeDuplicates(leads)
  }

  // Method 3: Find stores with poor performing ads
  async findStoresWithPoorAds(campaign) {
    const searchQueries = [
      `"${campaign.targetIndustry}" "facebook ads expensive" "ecommerce" site:*.com`,
      `"${campaign.targetIndustry}" "google ads not working" "online store" site:*.com`,
      `"${campaign.targetIndustry}" "advertising problems" "shop" site:*.com`
    ]

    const leads = []
    for (const query of searchQueries) {
      try {
        const searchResults = await this.performSerperSearch(query, {
          dateRestrict: 'm9',
          gl: this.getCountryCode(campaign.targetLocation)
        })
        const processedLeads = await this.processPoorAdStores(searchResults, campaign)
        leads.push(...processedLeads)
        await this.delay(1500)
      } catch (error) {
        console.warn(`Poor ads search failed: ${query}`, error)
      }
    }

    return this.removeDuplicates(leads)
  }

  // Process Shopify stores
  async processShopifyStores(searchResults, campaign) {
    const leads = []
    
    for (const result of searchResults.organic || []) {
      const domain = this.extractDomain(result.link)
      if (!domain || !domain.includes('myshopify.com')) continue

      const storeData = await this.analyzeShopifyStore(domain, result, campaign)
      if (storeData.isQualified) {
        const lead = await this.createEcommerceLead(storeData, campaign, 'shopify_store', 90)
        if (lead) leads.push(lead)
      }
    }

    return leads
  }

  // Process WooCommerce stores
  async processWooCommerceStores(searchResults, campaign) {
    const leads = []
    
    for (const result of searchResults.organic || []) {
      const domain = this.extractDomain(result.link)
      if (!domain || !this.isSmallEcommerceStore(domain, result)) continue

      const storeData = await this.analyzeWooCommerceStore(domain, result, campaign)
      if (storeData.isQualified) {
        const lead = await this.createEcommerceLead(storeData, campaign, 'woocommerce_store', 85)
        if (lead) leads.push(lead)
      }
    }

    return leads
  }

  // Process poor ads stores
  async processPoorAdStores(searchResults, campaign) {
    const leads = []
    
    for (const result of searchResults.organic || []) {
      const domain = this.extractDomain(result.link)
      if (!domain || !this.isSmallEcommerceStore(domain, result)) continue

      const storeData = await this.analyzePoorAdStore(domain, result, campaign)
      if (storeData.isQualified) {
        const lead = await this.createEcommerceLead(storeData, campaign, 'poor_ad_performance', 92)
        if (lead) leads.push(lead)
      }
    }

    return leads
  }

  // Analyze Shopify store for qualification
  async analyzeShopifyStore(domain, searchResult, campaign) {
    const storeName = this.extractStoreName(searchResult.title, domain)
    const content = (searchResult.title + ' ' + searchResult.snippet).toLowerCase()
    
    // Check if it's too big or too small
    if (this.isLargeEcommerceStore(content)) {
      return { isQualified: false, reason: 'Store too large' }
    }

    // Estimate store performance
    const performanceEstimate = await this.estimateStorePerformance(domain, content)
    
    // Check if it fits our target revenue range ($10k-$100k)
    if (performanceEstimate.estimatedMonthlyRevenue < 1000 || 
        performanceEstimate.estimatedMonthlyRevenue > 8500) {
      return { isQualified: false, reason: 'Revenue outside target range' }
    }

    return {
      isQualified: true,
      storeName,
      domain,
      platform: 'Shopify',
      estimatedRevenue: performanceEstimate.estimatedMonthlyRevenue * 12,
      monthlyRevenue: performanceEstimate.estimatedMonthlyRevenue,
      storeSize: this.categorizeStoreSize(performanceEstimate.estimatedMonthlyRevenue),
      marketingNeeds: ['Paid advertising', 'Email marketing', 'Conversion optimization'],
      urgencyLevel: this.calculateEcommerceUrgency(content),
      growthPotential: 'good'
    }
  }

  // Analyze WooCommerce store
  async analyzeWooCommerceStore(domain, searchResult, campaign) {
    const storeName = this.extractStoreName(searchResult.title, domain)
    const content = (searchResult.title + ' ' + searchResult.snippet).toLowerCase()
    
    if (this.isLargeEcommerceStore(content)) {
      return { isQualified: false, reason: 'Store too large' }
    }

    const performanceEstimate = await this.estimateStorePerformance(domain, content)
    
    if (performanceEstimate.estimatedMonthlyRevenue < 1000 || 
        performanceEstimate.estimatedMonthlyRevenue > 8500) {
      return { isQualified: false, reason: 'Revenue outside target range' }
    }

    return {
      isQualified: true,
      storeName,
      domain,
      platform: 'WooCommerce',
      estimatedRevenue: performanceEstimate.estimatedMonthlyRevenue * 12,
      monthlyRevenue: performanceEstimate.estimatedMonthlyRevenue,
      storeSize: this.categorizeStoreSize(performanceEstimate.estimatedMonthlyRevenue),
      marketingNeeds: ['WordPress optimization', 'Email marketing', 'SEO'],
      urgencyLevel: this.calculateEcommerceUrgency(content),
      growthPotential: 'good'
    }
  }

  // Analyze poor ad store
  async analyzePoorAdStore(domain, searchResult, campaign) {
    const storeName = this.extractStoreName(searchResult.title, domain)
    const content = (searchResult.title + ' ' + searchResult.snippet).toLowerCase()
    
    if (this.isLargeEcommerceStore(content)) {
      return { isQualified: false, reason: 'Store too large' }
    }

    const performanceEstimate = await this.estimateStorePerformance(domain, content)
    
    if (performanceEstimate.estimatedMonthlyRevenue < 1000 || 
        performanceEstimate.estimatedMonthlyRevenue > 8500) {
      return { isQualified: false, reason: 'Revenue outside target range' }
    }

    return {
      isQualified: true,
      storeName,
      domain,
      platform: this.detectPlatformFromContent(content),
      estimatedRevenue: performanceEstimate.estimatedMonthlyRevenue * 12,
      monthlyRevenue: performanceEstimate.estimatedMonthlyRevenue,
      storeSize: this.categorizeStoreSize(performanceEstimate.estimatedMonthlyRevenue),
      marketingNeeds: ['Ad optimization', 'ROAS improvement', 'Conversion tracking'],
      urgencyLevel: 'very_high',
      growthPotential: 'immediate'
    }
  }

  // Create qualified e-commerce lead with automation enhancement
  async createEcommerceLead(storeData, campaign, discoveryMethod, baseScore) {
    try {
      console.log(`🛍️ Verifying e-commerce store: ${storeData.storeName}`)

      // Get store owner contact info
      const cleanDomain = storeData.domain.replace('.myshopify.com', '.com')
      
      let contacts = []
      if (this.hunterApiKey) {
        try {
          const hunterResponse = await fetch(
            `https://api.hunter.io/v2/domain-search?domain=${cleanDomain}&department=management&limit=5&api_key=${this.hunterApiKey}`
          )
          if (hunterResponse.ok) {
            const hunterData = await hunterResponse.json()
            contacts = hunterData.data?.emails || []
          }
        } catch (error) {
          console.warn(`Hunter.io failed for ${cleanDomain}:`, error)
        }
      }

      // If no Hunter contacts, create estimated contact
      if (contacts.length === 0) {
        contacts = [{
          first_name: storeData.storeName.split(' ')[0],
          last_name: 'Owner',
          value: `info@${cleanDomain}`,
          position: 'Store Owner',
          confidence: 70,
          verified: false
        }]
      }

      const bestContact = this.findBestStoreOwnerContact(contacts)
      
      const lead = {
        id: `ecommerce_${discoveryMethod}_${storeData.domain.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`,
        campaignId: campaign.id,
        
        company: {
          name: storeData.storeName,
          domain: storeData.domain,
          website: `https://${storeData.domain}`,
          industry: campaign.targetIndustry,
          platform: storeData.platform,
          storeSize: storeData.storeSize,
          estimatedRevenue: storeData.estimatedRevenue,
          monthlyRevenue: storeData.monthlyRevenue,
          location: campaign.targetLocation,
          confidence: 85,
          discoveryMethod: discoveryMethod,
          urgencyLevel: storeData.urgencyLevel,
          marketingNeeds: storeData.marketingNeeds,
          growthPotential: storeData.growthPotential,
          // Add automation enhancement placeholder
          automationEnhanced: false,
          enhancementLevel: campaign.automationLevel || 'basic'
        },
        
        contact: {
          name: `${bestContact.first_name || ''} ${bestContact.last_name || ''}`.trim() || `${storeData.storeName} Owner`,
          firstName: bestContact.first_name || '',
          lastName: bestContact.last_name || 'Owner',
          email: bestContact.value || `info@${cleanDomain}`,
          title: bestContact.position || 'Store Owner',
          department: 'Management',
          verified: bestContact.verified || false,
          confidence: bestContact.confidence || 75
        },
        
        opportunity: {
          score: this.calculateEcommerceOpportunityScore(baseScore, storeData),
          potentialMonthlyValue: this.estimateMonthlyServiceValue(storeData),
          immediateOpportunities: this.identifyEcommerceOpportunities(storeData),
          urgencyFactors: this.calculateEcommerceUrgencyFactors(storeData),
          bestApproach: this.determineEcommerceBestApproach(storeData),
          automationEnhanced: false // Will be updated by automation systems
        },
        
        discoveredAt: new Date(),
        source: `E-commerce Discovery (${discoveryMethod})`,
        dataQuality: 'ecommerce_qualified_lead',
        automationData: {
          discoveryMethod: campaign.automationLevel || 'basic',
          enhancementApplied: false,
          lastEnhanced: null
        }
      }

      console.log(`✅ E-commerce lead created: ${lead.contact.name} - ${lead.company.name} ($${lead.company.monthlyRevenue}/mo)`)
      return lead

    } catch (error) {
      console.error(`E-commerce lead creation failed for ${storeData.storeName}:`, error)
      return null
    }
  }

  // YouTube research integration methods
  extractIndustryTrends(youtubeData) {
    const trends = {
      popularTopics: {},
      commonPainPoints: [],
      successStrategies: [],
      averageEngagement: 0
    }

    if (!youtubeData?.videos) return trends

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

  generateMessagingInsights(youtubeData, industry) {
    const insights = []

    if (!youtubeData?.videos) return insights

    // Analyze successful video titles for messaging patterns
    const highEngagementVideos = youtubeData.videos
      .filter(video => video.relevanceScore > 70)
      .slice(0, 10)

    const painPoints = []
    const strategies = []
    const valueProps = []

    highEngagementVideos.forEach(video => {
      if (video.transcript) {
        painPoints.push(...this.extractPainPoints(video.transcript))
        strategies.push(...this.extractSuccessStrategies(video.transcript))
        valueProps.push(...this.extractValuePropositions(video.title, video.description))
      }
    })

    insights.push({
      type: 'messaging_data',
      painPoints: [...new Set(painPoints)].slice(0, 5),
      strategies: [...new Set(strategies)].slice(0, 5),
      valueProps: [...new Set(valueProps)].slice(0, 5),
      industry: industry
    })

    return insights
  }

  extractTopicsFromTitle(title) {
    const topicKeywords = [
      'email marketing', 'facebook ads', 'google ads', 'seo', 'conversion',
      'automation', 'customer retention', 'sales funnel', 'influencer marketing',
      'content marketing', 'social media', 'paid advertising', 'organic growth',
      'analytics', 'shopify', 'ecommerce', 'online store', 'dropshipping'
    ]
    
    const titleLower = title.toLowerCase()
    return topicKeywords.filter(topic => titleLower.includes(topic))
  }

  extractPainPoints(transcript) {
    const painPointIndicators = [
      'struggling with', 'problem with', 'difficult to', 'hard to',
      'failing at', 'not working', 'low conversion', 'poor performance',
      'expensive ads', 'wasting money', 'not profitable', 'low roi',
      'cart abandonment', 'high bounce rate', 'poor traffic'
    ]
    
    const painPoints = []
    const transcriptLower = transcript.toLowerCase()
    
    painPointIndicators.forEach(indicator => {
      if (transcriptLower.includes(indicator)) {
        painPoints.push(this.cleanPainPoint(indicator))
      }
    })
    
    return [...new Set(painPoints)]
  }

  extractSuccessStrategies(transcript) {
    const strategyIndicators = [
      'increased conversion', 'improved roi', 'better targeting', 'automated email',
      'optimized ads', 'higher engagement', 'more sales', 'better results',
      'growth strategy', 'scaling', 'profitable campaigns', 'higher roas',
      'better email open rates', 'improved click through'
    ]
    
    const strategies = []
    const transcriptLower = transcript.toLowerCase()
    
    strategyIndicators.forEach(strategy => {
      if (transcriptLower.includes(strategy)) {
        strategies.push(this.cleanStrategy(strategy))
      }
    })
    
    return [...new Set(strategies)]
  }

  extractValuePropositions(title, description) {
    const valueProps = []
    const content = `${title} ${description}`.toLowerCase()
    
    const valuePatterns = [
      /(\d+)% increase/g,
      /(\d+)x more/g,
      /save \$?(\d+)/g,
      /reduce.*by (\d+)%/g,
      /improve.*by (\d+)%/g
    ]
    
    valuePatterns.forEach(pattern => {
      const matches = content.match(pattern)
      if (matches) {
        valueProps.push(...matches.slice(0, 2))
      }
    })
    
    return valueProps
  }

  cleanPainPoint(painPoint) {
    return painPoint
      .replace(/ing$/, '')
      .replace(/ult$/, 'y')
      .replace(/with$/, '')
      .trim()
  }

  cleanStrategy(strategy) {
    return strategy
      .replace(/^(increased|improved|better|higher|more)/, '')
      .trim()
  }

  // Helper methods (keeping existing ones)
  isSmallEcommerceStore(domain, result) {
    const excludeDomains = [
      'amazon.com', 'ebay.com', 'walmart.com', 'target.com', 'bestbuy.com'
    ]
    
    const content = (result.title + ' ' + result.snippet).toLowerCase()
    const largeStoreIndicators = [
      'million in sales', 'billion revenue', 'enterprise', 'corporation'
    ]
    
    return !excludeDomains.some(excluded => domain.includes(excluded)) &&
           !largeStoreIndicators.some(indicator => content.includes(indicator))
  }

  isLargeEcommerceStore(content) {
    const largeStoreIndicators = [
      'million in sales', 'billion revenue', 'enterprise', 'corporation',
      'publicly traded', 'fortune 500', 'international', 'worldwide'
    ]
    
    return largeStoreIndicators.some(indicator => content.includes(indicator))
  }

  async estimateStorePerformance(domain, content) {
    let monthlyRevenue = 3000 // Default middle estimate
    
    if (content.includes('growing') || content.includes('expanding')) monthlyRevenue *= 1.5
    if (content.includes('successful') || content.includes('profitable')) monthlyRevenue *= 1.3
    if (content.includes('struggling') || content.includes('need help')) monthlyRevenue *= 0.7
    if (content.includes('new') || content.includes('startup')) monthlyRevenue *= 0.8
    
    if (domain.includes('myshopify.com')) monthlyRevenue *= 1.1
    
    return {
      estimatedMonthlyRevenue: Math.round(monthlyRevenue)
    }
  }

  categorizeStoreSize(monthlyRevenue) {
    if (monthlyRevenue < 2000) return 'micro'
    if (monthlyRevenue < 5000) return 'small'
    if (monthlyRevenue < 8000) return 'growing'
    return 'established'
  }

  calculateEcommerceUrgency(content) {
    if (content.includes('struggling') || content.includes('problems')) return 'very_high'
    if (content.includes('growing') || content.includes('expanding')) return 'high'
    return 'medium'
  }

  detectPlatformFromContent(content) {
    if (content.includes('shopify') || content.includes('myshopify')) return 'Shopify'
    if (content.includes('woocommerce') || content.includes('wordpress')) return 'WooCommerce'
    if (content.includes('bigcommerce')) return 'BigCommerce'
    return 'E-commerce Platform'
  }

  findBestStoreOwnerContact(contacts) {
    if (!contacts || contacts.length === 0) return null
    
    const scoredContacts = contacts.map(contact => {
      let score = contact.confidence || 50
      
      if (contact.position) {
        const position = contact.position.toLowerCase()
        if (position.includes('owner') || position.includes('founder')) score += 30
        if (position.includes('ceo') || position.includes('president')) score += 25
      }
      
      return { ...contact, totalScore: score }
    })
    
    return scoredContacts.sort((a, b) => b.totalScore - a.totalScore)[0]
  }

  calculateEcommerceOpportunityScore(baseScore, storeData) {
    let score = baseScore
    
    if (storeData.storeSize === 'growing') score += 10
    if (storeData.urgencyLevel === 'very_high') score += 15
    if (storeData.platform === 'Shopify') score += 5
    if (storeData.monthlyRevenue >= 2000 && storeData.monthlyRevenue <= 6000) score += 10
    
    return Math.min(Math.max(score, 0), 100)
  }

  estimateMonthlyServiceValue(storeData) {
    const basePrice = Math.min(storeData.monthlyRevenue * 0.15, 1500)
    const minPrice = 500
    return Math.max(basePrice, minPrice)
  }

  identifyEcommerceOpportunities(storeData) {
    const opportunities = ['Facebook & Google ads optimization']
    
    if (storeData.platform === 'Shopify') {
      opportunities.push('Shopify email marketing setup')
    } else {
      opportunities.push('WooCommerce optimization')
    }
    
    opportunities.push('Conversion rate improvement')
    
    return opportunities
  }

  calculateEcommerceUrgencyFactors(storeData) {
    const factors = []
    
    if (storeData.urgencyLevel === 'very_high') {
      factors.push('Critical marketing problems affecting daily revenue')
    }
    if (storeData.discoveryMethod === 'poor_ad_performance') {
      factors.push('Currently losing money on ineffective advertising')
    }
    
    factors.push('Peak season approaching - timing is critical')
    
    return factors
  }

  determineEcommerceBestApproach(storeData) {
    if (storeData.urgencyLevel === 'very_high') {
      return 'Problem-solving approach: Address immediate pain points first'
    }
    return 'Revenue optimization approach: Focus on improving current performance'
  }

  async filterForSmallStores(leads, campaign) {
    return leads.filter(lead => {
      const revenueOk = lead.company.estimatedRevenue >= 10000 && 
                       lead.company.estimatedRevenue <= 100000
      const monthlyOk = lead.company.monthlyRevenue >= 1000 && 
                       lead.company.monthlyRevenue <= 8500
      const hasContact = lead.contact && lead.contact.email
      const sizeOk = ['micro', 'small', 'growing'].includes(lead.company.storeSize)
      
      return revenueOk && monthlyOk && hasContact && sizeOk
    })
  }

  // Standard helper methods
  getCountryCode(location) {
    const codes = {
      'United States': 'us',
      'Canada': 'ca', 
      'United Kingdom': 'gb',
      'Australia': 'au'
    }
    return codes[location] || 'us'
  }

  async performSerperSearch(query, options = {}) {
    if (!this.serperApiKey) {
      throw new Error('Serper API key is required')
    }

    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': this.serperApiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        q: query,
        num: 10,
        ...options
      })
    })
    
    if (!response.ok) {
      throw new Error(`Serper API failed: ${response.status}`)
    }
    
    return await response.json()
  }

  extractDomain(url) {
    try {
      return new URL(url).hostname.replace('www.', '')
    } catch {
      return null
    }
  }

  extractStoreName(title, domain) {
    if (domain.includes('myshopify.com')) {
      return domain.split('.')[0].replace(/-/g, ' ')
    }
    return title.replace(/\s*-\s*.*$/, '').replace(/\s*\|\s*.*$/, '').trim()
  }

  removeDuplicates(leads) {
    const seen = new Set()
    return leads.filter(lead => {
      const key = lead.company?.domain
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Automation enhancement methods
  async enhanceLeadWithAutomation(lead, automationLevel = 'basic') {
    switch (automationLevel) {
      case 'full':
        return await this.enhanceWithFullAutomation(lead)
      case 'hybrid':
        return await this.enhanceWithHybridAutomation(lead)
      default:
        return lead // No additional enhancement for basic
    }
  }

  async enhanceWithFullAutomation(lead) {
    try {
      // Call full automation enhancement API
      const response = await fetch('/api/automation/enhance-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead, automationLevel: 'full' })
      })

      const result = await response.json()
      
      if (result.success) {
        return {
          ...lead,
          company: {
            ...lead.company,
            automationEnhanced: true,
            technologies: result.technologies,
            enhancementLevel: 'full_automation'
          },
          contact: {
            ...lead.contact,
            ...result.enhancedContact,
            verified: result.enhancedContact?.verified || lead.contact.verified
          },
          opportunity: {
            ...lead.opportunity,
            score: result.enhancedScore || lead.opportunity.score,
            automationEnhanced: true
          },
          automationData: {
            ...lead.automationData,
            enhancementApplied: true,
            lastEnhanced: new Date(),
            enhancementMethod: 'full_automation',
            dataCollected: result.dataCollected || []
          }
        }
      }
    } catch (error) {
      console.error('Full automation enhancement failed:', error)
    }
    
    return lead
  }

  async enhanceWithHybridAutomation(lead) {
    try {
      // Use realistic enhanced discovery for hybrid enhancement
      const enhanced = await this.realisticEnhanced.enhanceStoreWithFreeAPIs(lead, {})
      
      return {
        ...enhanced,
        automationData: {
          ...lead.automationData,
          enhancementApplied: true,
          lastEnhanced: new Date(),
          enhancementMethod: 'hybrid_automation'
        }
      }
    } catch (error) {
      console.error('Hybrid automation enhancement failed:', error)
      return lead
    }
  }

  // Batch processing for automation
  async batchProcessStores(stores, campaign) {
    const batchSize = 5
    const results = []
    
    for (let i = 0; i < stores.length; i += batchSize) {
      const batch = stores.slice(i, i + batchSize)
      
      const batchPromises = batch.map(async (store) => {
        try {
          return await this.enhanceLeadWithAutomation(store, campaign.automationLevel)
        } catch (error) {
          console.error(`Batch processing failed for ${store.company?.name}:`, error)
          return store
        }
      })
      
      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults)
      
      // Rate limiting between batches
      if (i + batchSize < stores.length) {
        await this.delay(2000)
      }
    }
    
    return results
  }

  // Export methods for external automation tools
  async exportForPhantomBuster(campaign, stores) {
    const exportData = {
      campaign: {
        id: campaign.id,
        name: campaign.name,
        industry: campaign.targetIndustry,
        location: campaign.targetLocation
      },
      stores: stores.map(store => ({
        company: store.company.name,
        domain: store.company.domain,
        platform: store.company.platform,
        monthlyRevenue: store.company.monthlyRevenue,
        linkedinSearchUrl: `https://linkedin.com/search/results/people/?keywords=${encodeURIComponent(store.company.name + ' owner')}`
      })),
      totalStores: stores.length,
      exportedAt: new Date()
    }
    
    return exportData
  }

  // Integration with automation APIs
  async checkAutomationCapabilities() {
    const capabilities = {
      serper: !!this.serperApiKey,
      hunter: !!this.hunterApiKey,
      youtube: !!this.youtubeApiKey,
      openai: !!this.openaiApiKey,
      phantomBuster: !!process.env.NEXT_PUBLIC_PHANTOM_BUSTER_API_KEY,
      puppeteer: false // Will be checked by server
    }
    
    try {
      const response = await fetch('/api/automation/check-capabilities')
      const serverCapabilities = await response.json()
      
      if (serverCapabilities.success) {
        return { ...capabilities, ...serverCapabilities.capabilities }
      }
    } catch (error) {
      console.error('Failed to check server capabilities:', error)
    }
    
    return capabilities
  }

  // Generate automation workflow
  generateAutomationWorkflow(campaign, stores) {
    const workflow = {
      campaignId: campaign.id,
      automationLevel: campaign.automationLevel || 'basic',
      totalStores: stores.length,
      estimatedTime: this.calculateAutomationTime(campaign.automationLevel, stores.length),
      steps: [],
      requirements: []
    }
    
    switch (campaign.automationLevel) {
      case 'full':
        workflow.steps = [
          { step: 1, action: 'Launch browser automation', time: '2 minutes' },
          { step: 2, action: 'Visit each store website', time: `${Math.ceil(stores.length * 0.5)} minutes` },
          { step: 3, action: 'Extract technology data', time: '1 minute' },
          { step: 4, action: 'Verify contact information', time: '1 minute' },
          { step: 5, action: 'Process and enhance leads', time: '1 minute' }
        ]
        workflow.requirements = ['Puppeteer', 'Browser extensions', 'Stable internet']
        break
        
      case 'hybrid':
        workflow.steps = [
          { step: 1, action: 'API-based discovery', time: '2 minutes' },
          { step: 2, action: 'YouTube industry research', time: '1 minute' },
          { step: 3, action: 'Free API enhancement', time: '2 minutes' },
          { step: 4, action: 'Manual extension workflow', time: `${Math.ceil(stores.length * 1)} minutes` },
          { step: 5, action: 'Data integration', time: '1 minute' }
        ]
        workflow.requirements = ['Hunter API', 'YouTube API', 'Browser extensions']
        break
        
      default:
        workflow.steps = [
          { step: 1, action: 'Serper API discovery', time: '2 minutes' },
          { step: 2, action: 'Hunter email verification', time: '1 minute' },
          { step: 3, action: 'Basic lead processing', time: '1 minute' }
        ]
        workflow.requirements = ['Serper API', 'Hunter API (optional)']
    }
    
    return workflow
  }

  calculateAutomationTime(automationLevel, storeCount) {
    const baseTimes = {
      basic: 4, // 4 minutes base
      hybrid: 6 + Math.ceil(storeCount * 1), // 6 minutes + 1 min per store
      full: 5 + Math.ceil(storeCount * 0.5) // 5 minutes + 0.5 min per store
    }
    
    return baseTimes[automationLevel] || baseTimes.basic
  }

  // Performance monitoring
  trackAutomationPerformance(campaign, results) {
    const performance = {
      campaignId: campaign.id,
      automationLevel: campaign.automationLevel,
      startTime: campaign.createdAt,
      endTime: new Date(),
      duration: Date.now() - new Date(campaign.createdAt).getTime(),
      storesDiscovered: results.stores?.length || 0,
      enhancementsApplied: results.stores?.filter(s => s.automationData?.enhancementApplied).length || 0,
      cost: results.totalCost || campaign.estimatedCost,
      successRate: this.calculateSuccessRate(results),
      timestamp: new Date()
    }
    
    return performance
  }

  calculateSuccessRate(results) {
    if (!results.stores || results.stores.length === 0) return 0
    
    const successfulEnhancements = results.stores.filter(store => 
      store.automationData?.enhancementApplied && 
      store.opportunity?.score > 80
    ).length
    
    return Math.round((successfulEnhancements / results.stores.length) * 100)
  }
}