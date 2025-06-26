// lib/realistic-enhanced-discovery.js
// Enhanced E-commerce Discovery using ONLY truly free APIs

import { YoutubeResearcher } from './youtube';

export class RealisticEnhancedDiscovery {
  constructor(hybridSystem) {
    this.hybridSystem = hybridSystem;
    this.youtubeResearcher = this.initializeYouTube();
    this.freeAPIs = {
      hunter: process.env.NEXT_PUBLIC_HUNTER_API_KEY,
      youtube: process.env.NEXT_PUBLIC_YOUTUBE_API_KEY,
      serper: process.env.NEXT_PUBLIC_SERPER_API_KEY,
      openai: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
      ipstack: process.env.NEXT_PUBLIC_IPSTACK_API_KEY,
      whois: process.env.NEXT_PUBLIC_WHOIS_API_KEY,
    };
    
    this.usageTracking = {
      hunter: { used: 0, limit: 75 },
      ipstack: { used: 0, limit: 1000 },
      whois: { used: 0, limit: 1000 },
      youtube: { used: 0, limit: 10000 }
    };
  }

  initializeYouTube() {
    try {
      if (process.env.NEXT_PUBLIC_YOUTUBE_API_KEY) {
        return new YoutubeResearcher();
      }
      console.warn('YouTube API key missing - video research disabled');
      return null;
    } catch (error) {
      console.error('YouTube initialization failed:', error);
      return null;
    }
  }

  async discoverEcommerceStoresWithRealisticEnhancement(campaign) {
    console.log(`🚀 Starting realistic enhanced discovery for ${campaign.targetIndustry}...`);
    
    const results = {
      stores: [],
      youtubeInsights: null,
      industryTrends: {},
      messagingInsights: [],
      enhancementStats: {
        emailsVerified: 0,
        logosFound: 0,
        domainDataEnriched: 0,
        locationDataAdded: 0,
        techStackSimulated: 0
      },
      totalCost: 0,
      freeAPIUsage: {}
    };

    try {
      // Step 1: YouTube industry research
      if (this.youtubeResearcher) {
        console.log('📺 Gathering YouTube insights...');
        const youtubeResearch = await this.getYouTubeResearch(campaign);
        
        if (youtubeResearch && !youtubeResearch.error) {
          results.youtubeInsights = youtubeResearch;
          results.industryTrends = this.extractIndustryTrends(youtubeResearch);
          results.messagingInsights = this.generateMessagingInsights(youtubeResearch, campaign.targetIndustry);
          this.usageTracking.youtube.used += youtubeResearch.videos.length * 7;
        }
      }

      // Step 2: Traditional e-commerce store discovery
      console.log('🛍️ Discovering e-commerce stores...');
      const stores = await this.discoverEcommerceStores(campaign);
      
      // Step 3: Enhance stores with FREE APIs only
      console.log('🔍 Enhancing stores with free APIs...');
      const enhancedStores = [];
      
      for (const store of stores) {
        const enhanced = await this.enhanceStoreWithFreeAPIs(store, results.enhancementStats);
        enhancedStores.push(enhanced);
        await this.sleep(500); // Rate limiting
      }
      
      results.stores = enhancedStores;
      results.freeAPIUsage = this.usageTracking;

      // Step 4: Generate enhanced messaging
      console.log('💡 Creating enhanced messaging...');
      results.enhancedMessages = this.generateRealisticEnhancedMessages(
        enhancedStores, 
        results.messagingInsights, 
        campaign
      );

      results.totalCost = this.calculateRealisticCost(stores.length, results.youtubeInsights?.videos?.length || 0);
      return results;

    } catch (error) {
      console.error('Realistic enhanced discovery failed:', error);
      throw error;
    }
  }

  async getYouTubeResearch(campaign) {
    try {
      // Try getting from hybrid system first
      if (this.hybridSystem?.getYoutubeResearchStatus) {
        const existingResearch = this.hybridSystem.getYoutubeResearchStatus(campaign.id);
        if (existingResearch) return existingResearch;
      }
      
      // Fall back to direct research
      return await this.youtubeResearcher.searchByIndustry(
        campaign.targetIndustry,
        { depth: 'standard', minViews: 5000 }
      );
    } catch (error) {
      console.error('YouTube research failed:', error);
      return { error: error.message };
    }
  }

  async enhanceStoreWithFreeAPIs(store, stats) {
    const enhanced = { ...store };
    
    try {
      // 1. Company logo (Clearbit - completely free, no API key needed)
      if (store.company?.website) {
        const domain = this.extractDomain(store.company.website);
        enhanced.company.logo = `https://logo.clearbit.com/${domain}`;
        enhanced.company.domain = domain;
        stats.logosFound++;
      }

      // 2. Email verification with Hunter.io
      if (this.freeAPIs.hunter && store.contact?.email && this.usageTracking.hunter.used < this.usageTracking.hunter.limit) {
        const emailData = await this.verifyEmailWithHunter(store.contact.email);
        if (emailData) {
          enhanced.contact.verified = emailData.result === 'deliverable';
          enhanced.contact.confidence = emailData.score || 0;
          enhanced.contact.hunterData = emailData;
          stats.emailsVerified++;
          this.usageTracking.hunter.used++;
        }
      }

      // 3. Domain information with Whois API
      if (this.freeAPIs.whois && enhanced.company?.domain && this.usageTracking.whois.used < this.usageTracking.whois.limit) {
        const domainInfo = await this.getWhoisData(enhanced.company.domain);
        if (domainInfo) {
          enhanced.company.domainInfo = domainInfo;
          stats.domainDataEnriched++;
          this.usageTracking.whois.used++;
        }
      }

      // 4. Location data with IPStack
      if (this.freeAPIs.ipstack && enhanced.company?.domain && this.usageTracking.ipstack.used < this.usageTracking.ipstack.limit) {
        const locationData = await this.getLocationData(enhanced.company.domain);
        if (locationData) {
          enhanced.company.location = locationData;
          stats.locationDataAdded++;
          this.usageTracking.ipstack.used++;
        }
      }

      // 5. Technology stack simulation
      enhanced.company.technologies = this.simulateTechStackDetection(enhanced.company.domain, store.company.platform);
      stats.techStackSimulated++;

      // 6. Enhanced opportunity scoring
      enhanced.opportunity = enhanced.opportunity || {};
      enhanced.opportunity.enhancedScore = this.calculateEnhancedOpportunityScore(enhanced);
      enhanced.opportunity.enhancementLevel = this.determineEnhancementLevel(enhanced);

      return enhanced;

    } catch (error) {
      console.error(`Error enhancing store ${store.company.name}:`, error);
      return store;
    }
  }

  async verifyEmailWithHunter(email) {
    try {
      const response = await fetch(
        `https://api.hunter.io/v2/email-verifier?email=${email}&api_key=${this.freeAPIs.hunter}`
      );
      
      if (!response.ok) {
        throw new Error(`Hunter API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Hunter email verification failed:', error);
      return null;
    }
  }

  async getWhoisData(domain) {
    try {
      const response = await fetch(`https://api.whoisjsonapi.com/v1/${domain}`);
      if (!response.ok) return null;
      
      const data = await response.json();
      return {
        registrar: data.registrar || 'Unknown',
        creationDate: data.creation_date || null,
        expirationDate: data.expiration_date || null,
        registrantCountry: data.registrant_country || null,
        nameServers: data.name_servers || [],
        domainAge: this.calculateDomainAge(data.creation_date)
      };
    } catch (error) {
      console.error('Whois lookup failed:', error);
      return null;
    }
  }

  async getLocationData(domain) {
    try {
      const response = await fetch(
        `http://api.ipstack.com/${domain}?access_key=${this.freeAPIs.ipstack}`
      );
      if (!response.ok) return null;
      
      const data = await response.json();
      return {
        country: data.country_name || 'Unknown',
        countryCode: data.country_code || null,
        region: data.region_name || null,
        city: data.city || null,
        timezone: data.time_zone?.id || null,
        latitude: data.latitude || null,
        longitude: data.longitude || null
      };
    } catch (error) {
      console.error('Location lookup failed:', error);
      return null;
    }
  }

  simulateTechStackDetection(domain, platformHint) {
    const tech = {
      ecommercePlatform: platformHint || 'Unknown',
      analytics: [],
      emailMarketing: [],
      payments: [],
      socialMedia: [],
      other: [],
      confidence: 'simulated'
    };

    if (domain) {
      const domainLower = domain.toLowerCase();
      
      if (domainLower.includes('shopify') || domainLower.includes('myshopify')) {
        tech.ecommercePlatform = 'Shopify';
        tech.payments.push('Shopify Payments', 'Stripe');
        tech.analytics.push('Google Analytics');
      } else if (domainLower.includes('wordpress') || domainLower.includes('wp-')) {
        tech.ecommercePlatform = 'WooCommerce';
        tech.payments.push('WooCommerce Payments', 'PayPal');
      } else if (domainLower.includes('bigcommerce')) {
        tech.ecommercePlatform = 'BigCommerce';
        tech.payments.push('BigCommerce Payments');
      }
      
      tech.analytics.push('Google Analytics');
      tech.socialMedia.push('Facebook Pixel');
      
      const missingTools = [];
      if (!tech.emailMarketing.length) missingTools.push('Email Marketing Automation');
      if (!tech.analytics.includes('Google Tag Manager')) missingTools.push('Advanced Analytics Setup');
      
      tech.opportunities = missingTools;
    }

    return tech;
  }

  calculateEnhancedOpportunityScore(store) {
    let score = store.opportunity?.score || 75;
    
    if (store.contact?.verified) score += 10;
    if (store.contact?.confidence > 80) score += 5;
    
    if (store.company?.domainInfo?.domainAge) {
      const age = store.company.domainInfo.domainAge;
      if (age >= 1 && age <= 5) score += 10;
      if (age > 5) score += 5;
    }
    
    if (store.company?.technologies?.opportunities?.length > 0) {
      score += store.company.technologies.opportunities.length * 5;
    }
    
    if (store.company?.location?.countryCode === 'US') score += 8;
    if (store.company?.location?.countryCode === 'CA') score += 6;
    if (store.company?.location?.countryCode === 'GB') score += 6;
    
    if (store.company?.technologies?.ecommercePlatform === 'Shopify') score += 5;
    
    return Math.min(score, 100);
  }

  determineEnhancementLevel(store) {
    let level = 'basic';
    let features = [];
    
    if (store.contact?.verified) features.push('email-verified');
    if (store.company?.logo) features.push('logo');
    if (store.company?.domainInfo) features.push('domain-data');
    if (store.company?.location) features.push('location');
    if (store.company?.technologies) features.push('tech-stack');
    
    if (features.length >= 4) level = 'premium';
    else if (features.length >= 2) level = 'enhanced';
    
    return { level, features };
  }

  generateRealisticEnhancedMessages(stores, messagingInsights, campaign) {
    return stores.map((store, index) => {
      const template = this.createEnhancedTemplate(store, messagingInsights, campaign);
      
      return {
        id: `enhanced_msg_${campaign.id}_${Date.now()}_${index}`,
        leadId: store.id,
        campaignId: campaign.id,
        leadName: store.contact?.name || 'Store Owner',
        company: store.company.name,
        subject: template.subject,
        message: template.message,
        approach: 'realistic_enhanced',
        score: store.opportunity?.enhancedScore || 85,
        status: 'draft',
        generatedAt: new Date(),
        enhancementLevel: store.opportunity?.enhancementLevel?.level || 'basic',
        personalizedElements: template.personalizedElements
      };
    });
  }

  createEnhancedTemplate(store, insights, campaign) {
    const firstName = store.contact?.firstName || 'there';
    const industry = campaign.targetIndustry;
    const platform = store.company?.technologies?.ecommercePlatform || 'your platform';
    const location = store.company?.location?.country ? ` in ${store.company.location.country}` : '';
    
    const commonPainPoint = insights?.[0]?.painPoints?.[0] || 'low conversion rates';
    const successStrategy = insights?.[0]?.strategies?.[0] || 'optimized marketing campaigns';
    const opportunities = store.company?.technologies?.opportunities || [];
    const mainOpportunity = opportunities[0] || 'marketing optimization';
    
    return {
      subject: `${store.company.name} - ${industry} stores${location} are solving ${commonPainPoint}`,
      message: `Hi ${firstName},

I was researching successful ${industry} stores${location} and came across ${store.company.name}.

${platform !== 'Unknown' ? `I noticed you're using ${platform}, which is great for the optimization strategies that are working right now for ${industry} businesses.` : ''}

Recent analysis of ${industry} marketing trends shows that stores like yours are getting excellent results with ${successStrategy}.

${opportunities.length > 0 ? `I also noticed there might be an opportunity to enhance your ${mainOpportunity} setup, which typically increases revenue by 25-40% for ${industry} stores.` : ''}

Most clients see improvement within the first 30 days, especially with:
• Better ad targeting and optimization
• Email marketing automation
• Conversion rate improvements

Would a brief conversation about what's working in ${industry} right now make sense?

Best regards,
Muhammad Saim

P.S. ${store.contact?.verified ? 'I verified this email address for accuracy.' : 'I found this through industry research.'} Happy to share specific ${industry} case studies if helpful.`,
      personalizedElements: [
        `Industry: ${industry}`,
        `Platform: ${platform}`,
        `Location: ${location || 'Not specified'}`,
        `Email verified: ${store.contact?.verified ? 'Yes' : 'No'}`,
        `Opportunities: ${opportunities.join(', ') || 'General optimization'}`,
        `Enhancement level: ${store.opportunity?.enhancementLevel?.level || 'basic'}`
      ]
    };
  }

  extractDomain(url) {
    try {
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0];
    }
  }

  calculateDomainAge(creationDate) {
    if (!creationDate) return null;
    const created = new Date(creationDate);
    const now = new Date();
    return Math.round((now - created) / (1000 * 60 * 60 * 24 * 365 * 10)) / 10;
  }

  extractIndustryTrends(youtubeData) {
    const trends = {
      popularTopics: {},
      commonPainPoints: [],
      successStrategies: [],
      averageEngagement: 0
    };

    if (!youtubeData?.videos) return trends;

    youtubeData.videos.forEach(video => {
      this.extractTopicsFromTitle(video.title).forEach(topic => {
        trends.popularTopics[topic] = (trends.popularTopics[topic] || 0) + 1;
      });

      if (video.transcript) {
        trends.commonPainPoints.push(...this.extractPainPoints(video.transcript));
        trends.successStrategies.push(...this.extractSuccessStrategies(video.transcript));
      }

      trends.averageEngagement += (video.likeCount + video.commentCount) / video.viewCount;
    });

    trends.averageEngagement = trends.averageEngagement / youtubeData.videos.length;
    trends.commonPainPoints = [...new Set(trends.commonPainPoints)].slice(0, 10);
    trends.successStrategies = [...new Set(trends.successStrategies)].slice(0, 10);

    return trends;
  }

  generateMessagingInsights(youtubeData, industry) {
    if (!youtubeData?.videos) return [];

    const highEngagementVideos = youtubeData.videos
      .filter(video => video.relevanceScore > 70)
      .slice(0, 10);

    const painPoints = [];
    const strategies = [];
    const valueProps = [];

    highEngagementVideos.forEach(video => {
      if (video.transcript) {
        painPoints.push(...this.extractPainPoints(video.transcript));
        strategies.push(...this.extractSuccessStrategies(video.transcript));
        valueProps.push(...this.extractValuePropositions(video.title, video.description));
      }
    });

    return [{
      type: 'messaging_data',
      painPoints: [...new Set(painPoints)].slice(0, 5),
      strategies: [...new Set(strategies)].slice(0, 5),
      valueProps: [...new Set(valueProps)].slice(0, 5),
      industry: industry
    }];
  }

  extractTopicsFromTitle(title) {
    const topicKeywords = [
      'email marketing', 'facebook ads', 'google ads', 'seo', 'conversion',
      'automation', 'customer retention', 'sales funnel', 'influencer marketing',
      'content marketing', 'social media', 'paid advertising', 'organic growth',
      'analytics', 'shopify', 'ecommerce', 'online store', 'dropshipping'
    ];
    const titleLower = title.toLowerCase();
    return topicKeywords.filter(topic => titleLower.includes(topic));
  }

  extractPainPoints(transcript) {
    const painPointIndicators = [
      'struggling with', 'problem with', 'difficult to', 'hard to',
      'failing at', 'not working', 'low conversion', 'poor performance',
      'expensive ads', 'wasting money', 'not profitable', 'low roi',
      'cart abandonment', 'high bounce rate', 'poor traffic'
    ];
    
    const painPoints = [];
    const transcriptLower = transcript.toLowerCase();
    
    painPointIndicators.forEach(indicator => {
      if (transcriptLower.includes(indicator)) {
        painPoints.push(this.cleanPainPoint(indicator));
      }
    });
    
    return [...new Set(painPoints)];
  }

  extractSuccessStrategies(transcript) {
    const strategyIndicators = [
      'increased conversion', 'improved roi', 'better targeting', 'automated email',
      'optimized ads', 'higher engagement', 'more sales', 'better results',
      'growth strategy', 'scaling', 'profitable campaigns', 'higher roas',
      'better email open rates', 'improved click through'
    ];
    
    const strategies = [];
    const transcriptLower = transcript.toLowerCase();
    
    strategyIndicators.forEach(strategy => {
      if (transcriptLower.includes(strategy)) {
        strategies.push(this.cleanStrategy(strategy));
      }
    });
    
    return [...new Set(strategies)];
  }

  extractValuePropositions(title, description) {
    const content = `${title} ${description}`.toLowerCase();
    const valuePatterns = [
      /(\d+)% increase/g,
      /(\d+)x more/g,
      /save \$?(\d+)/g,
      /reduce.*by (\d+)%/g,
      /improve.*by (\d+)%/g
    ];
    
    const valueProps = [];
    valuePatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) valueProps.push(...matches.slice(0, 2));
    });
    
    return valueProps;
  }

  cleanPainPoint(painPoint) {
    return painPoint
      .replace(/ing$/, '')
      .replace(/ult$/, 'y')
      .replace(/with$/, '')
      .trim();
  }

  cleanStrategy(strategy) {
    return strategy
      .replace(/^(increased|improved|better|higher|more)/, '')
      .trim();
  }

  calculateRealisticCost(storeCount, videoCount) {
    const serperCost = 0.60;
    const youtubeCost = Math.min((videoCount || 0) * 0.01, 0.50);
    const freeAPICost = 0.00;
    const processingCost = 0.50;
    return (serperCost + youtubeCost + freeAPICost + processingCost).toFixed(2);
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async discoverEcommerceStores(campaign) {
    // Mock data - replace with your actual implementation
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
          title: 'Owner'
        },
        opportunity: {
          score: Math.floor(Math.random() * 20) + 80,
          potentialMonthlyValue: Math.floor(Math.random() * 1000) + 500,
          urgencyLevel: 'high'
        },
        dataQuality: 'ecommerce_qualified_lead'
      }
    ];
    
    await this.sleep(2000);
    return mockStores;
  }

  getUsageStats() {
    return {
      ...this.usageTracking,
      summary: {
        totalAPIsUsed: Object.keys(this.freeAPIs).filter(key => this.freeAPIs[key]).length,
        enhancementsPossible: Math.min(
          this.usageTracking.hunter.limit - this.usageTracking.hunter.used,
          this.usageTracking.ipstack.limit - this.usageTracking.ipstack.used,
          this.usageTracking.whois.limit - this.usageTracking.whois.used
        )
      }
    };
  }

  canEnhanceStore() {
    return (
      this.usageTracking.hunter.used < this.usageTracking.hunter.limit &&
      this.usageTracking.ipstack.used < this.usageTracking.ipstack.limit &&
      this.usageTracking.whois.used < this.usageTracking.whois.limit
    );
  }

  resetMonthlyUsage() {
    Object.keys(this.usageTracking).forEach(api => {
      this.usageTracking[api].used = 0;
    });
  }
}