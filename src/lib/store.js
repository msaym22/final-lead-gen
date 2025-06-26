// src/lib/store.js
import localStorageManager from './localStorageManager';

// Enhanced global store with YouTube automation integration and localStorage manager
class AppStore {
  constructor() {
    this.data = {
      campaigns: [],
      leads: [],
      messages: [],
      research: [],
      alerts: [],
      videos: [],
      replyMonitoring: [],
      followUps: [],
      
      analytics: {
        totalLeads: 0,
        responseRate: 0,
        activeCampaigns: 0,
        totalMessages: 0,
        avgLeadScore: 0,
        totalCostSpent: 0,
        verifiedLeads: 0,
        tier1Leads: 0,
        videosGenerated: 0,
        professionalCampaigns: 0,
        youtubeQuotaUsed: 0
      },

      automationStats: {
        totalAutomatedCampaigns: 0,
        totalExtensionEnhancements: 0,
        totalAutomationTime: 0,
        puppeteerAvailable: false,
        hybridCampaigns: 0,
        fullAutomationCampaigns: 0,
        youtubeResearchSessions: 0,
        freeToolUsage: {
          clearbit: 0,
          apollo: 0,
          builtwith: 0
        },
        totalApiCalls: 0,
        averageAutomationSuccess: 0,
        totalEnhancedStores: 0,
        youtubeQuotaUsed: 0
      }
    };
    
    this.listeners = [];
    this.isInitialized = false;
    
    // Initialize with localStorage manager
    this.initialize();
  }

  // ==================== CORE METHODS WITH LOCALSTORAGE MANAGER ====================

    // STEP 4: Add Extension Data Processing to Your Store
  // Add these methods to your existing store.js file

  // Extension Data Processing Methods (Add to your AppStore class)

  // Process extension data and convert to leads
  processExtensionData(extensionData) {
    const { type, data, campaignId, source, timestamp } = extensionData;

    console.log(`📨 Processing ${type} data from ${source}`);

    try {
      switch (type) {
        case 'linkedin_profile':
          return this.processLinkedInProfile(data, campaignId, timestamp);
        
        case 'instagram_profile':
          return this.processInstagramProfile(data, campaignId, timestamp);
        
        case 'website_analysis':
          return this.processWebsiteAnalysis(data, campaignId, timestamp);
        
        case 'wappalyzer_data':
          return this.processWappalyzerData(data, campaignId, timestamp);
        
        case 'hunter_data':
          return this.processHunterData(data, campaignId, timestamp);
        
        case 'test_connection':
          console.log('✅ Extension connection test successful');
          return null;
        
        default:
          console.warn('Unknown extension data type:', type);
          return null;
      }
    } catch (error) {
      console.error('Error processing extension data:', error);
      return null;
    }
  }

  // Process LinkedIn profile data into lead format
  processLinkedInProfile(profileData, campaignId, timestamp) {
    const lead = {
      id: `linkedin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      campaignId,
      company: {
        name: profileData.company || 'Unknown Company',
        industry: this.inferIndustryFromTitle(profileData.headline),
        platform: 'LinkedIn',
        size: 'Unknown'
      },
      contact: {
        name: profileData.name || 'Unknown Contact',
        title: profileData.headline || 'Unknown Title',
        linkedin: profileData.profileUrl,
        location: profileData.location
      },
      opportunity: {
        score: this.calculateLinkedInScore(profileData),
        potentialValue: this.estimateLinkedInValue(profileData),
        urgency: 'medium',
        painPoints: this.inferPainPointsFromTitle(profileData.headline)
      },
      linkedinData: {
        profileUrl: profileData.profileUrl,
        headline: profileData.headline,
        location: profileData.location,
        extractedAt: profileData.extractedAt
      },
      source: 'linkedin_extension',
      discoveredAt: timestamp,
      status: 'new',
      platform: 'LinkedIn'
    };

    // Add the lead to store
    this.addLead(lead);
    console.log('✅ LinkedIn lead created:', lead.contact.name);
    
    return lead;
  }

  // Process Instagram profile data into lead format
  processInstagramProfile(profileData, campaignId, timestamp) {
    const lead = {
      id: `instagram_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      campaignId,
      company: {
        name: profileData.displayName || profileData.username,
        industry: this.inferIndustryFromBio(profileData.bio),
        platform: 'Instagram',
        size: this.estimateCompanySizeFromFollowers(profileData.followerCount)
      },
      contact: {
        name: profileData.displayName || profileData.username,
        instagram: profileData.profileUrl,
        isVerified: profileData.isVerified
      },
      opportunity: {
        score: this.calculateInstagramScore(profileData),
        potentialValue: this.estimateInstagramValue(profileData),
        urgency: profileData.followerCount > 10000 ? 'high' : 'medium',
        painPoints: this.inferPainPointsFromBio(profileData.bio)
      },
      instagramData: {
        username: profileData.username,
        followerCount: profileData.followerCount,
        isVerified: profileData.isVerified,
        bio: profileData.bio,
        extractedAt: profileData.extractedAt
      },
      source: 'instagram_extension',
      discoveredAt: timestamp,
      status: 'new',
      platform: 'Instagram'
    };

    this.addLead(lead);
    console.log('✅ Instagram lead created:', lead.contact.name);
    
    return lead;
  }

  // Process website analysis data
  processWebsiteAnalysis(websiteData, campaignId, timestamp) {
    const lead = {
      id: `website_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      campaignId,
      company: {
        name: this.extractCompanyNameFromDomain(websiteData.domain),
        website: websiteData.url,
        domain: websiteData.domain,
        industry: 'Business',
        technologies: websiteData.technologies || []
      },
      contact: {
        emails: websiteData.emails || [],
        phones: websiteData.phones || []
      },
      opportunity: {
        score: this.calculateWebsiteScore(websiteData),
        potentialValue: this.estimateWebsiteValue(websiteData),
        urgency: websiteData.emails?.length > 0 ? 'high' : 'low',
        painPoints: this.inferWebsitePainPoints(websiteData)
      },
      websiteData: {
        title: websiteData.title,
        technologies: websiteData.technologies,
        socialLinks: websiteData.socialLinks,
        emails: websiteData.emails,
        phones: websiteData.phones,
        analyzedAt: websiteData.analyzedAt
      },
      source: 'website_extension',
      discoveredAt: timestamp,
      status: 'new',
      platform: 'Website'
    };

    // Only add if we found useful contact info
    if (websiteData.emails?.length > 0 || websiteData.phones?.length > 0) {
      this.addLead(lead);
      console.log('✅ Website lead created:', lead.company.name);
      return lead;
    }
    
    console.log('ℹ️ Website analyzed but no contact info found');
    return null;
  }

  // Process Wappalyzer technology data
  processWappalyzerData(wappalyzerData, campaignId, timestamp) {
    // Find existing lead for this domain or create new one
    const domain = wappalyzerData.domain || new URL(wappalyzerData.url).hostname;
    let existingLead = this.data.leads.find(lead => 
      lead.company?.domain === domain || lead.company?.website?.includes(domain)
    );

    if (existingLead) {
      // Update existing lead with technology data
      existingLead.company.technologies = [
        ...(existingLead.company.technologies || []),
        ...(wappalyzerData.technologies || [])
      ];
      existingLead.wappalyzerData = wappalyzerData;
      
      // Recalculate score with new tech data
      existingLead.opportunity.score = this.calculateWebsiteScore({
        ...existingLead.websiteData,
        technologies: existingLead.company.technologies
      });
      
      this.updateLead(existingLead.id, existingLead);
      console.log('✅ Updated lead with Wappalyzer data:', existingLead.company.name);
      return existingLead;
    } else {
      // Create new lead from Wappalyzer data
      const lead = {
        id: `wappalyzer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        campaignId,
        company: {
          name: this.extractCompanyNameFromDomain(domain),
          website: wappalyzerData.url,
          domain: domain,
          technologies: wappalyzerData.technologies || [],
          industry: this.inferIndustryFromTechnologies(wappalyzerData.technologies)
        },
        opportunity: {
          score: this.calculateTechnologyScore(wappalyzerData.technologies),
          potentialValue: this.estimateTechValue(wappalyzerData.technologies),
          urgency: 'medium',
          painPoints: this.inferTechPainPoints(wappalyzerData.technologies)
        },
        wappalyzerData: wappalyzerData,
        source: 'wappalyzer_extension',
        discoveredAt: timestamp,
        status: 'new',
        platform: 'Website'
      };

      this.addLead(lead);
      console.log('✅ Wappalyzer lead created:', lead.company.name);
      return lead;
    }
  }

  // Process Hunter email data
  processHunterData(hunterData, campaignId, timestamp) {
    // Find existing lead or create new one
    const domain = hunterData.domain;
    let existingLead = this.data.leads.find(lead => 
      lead.company?.domain === domain || lead.company?.website?.includes(domain)
    );

    if (existingLead) {
      // Update existing lead with Hunter email data
      existingLead.contact.emails = [
        ...(existingLead.contact.emails || []),
        ...(hunterData.emails || [])
      ];
      existingLead.hunterData = hunterData;
      
      // Increase score for verified emails
      existingLead.opportunity.score += hunterData.emails?.length * 10;
      existingLead.opportunity.urgency = 'high'; // Emails make it high priority
      
      this.updateLead(existingLead.id, existingLead);
      console.log('✅ Updated lead with Hunter emails:', existingLead.company.name);
      return existingLead;
    } else {
      // Create new lead from Hunter data
      const lead = {
        id: `hunter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        campaignId,
        company: {
          name: this.extractCompanyNameFromDomain(domain),
          domain: domain,
          website: `https://${domain}`
        },
        contact: {
          emails: hunterData.emails || []
        },
        opportunity: {
          score: 60 + (hunterData.emails?.length * 10),
          potentialValue: 3000,
          urgency: 'high',
          painPoints: ['Email marketing optimization needed']
        },
        hunterData: hunterData,
        source: 'hunter_extension',
        discoveredAt: timestamp,
        status: 'new',
        platform: 'Website'
      };

      if (hunterData.emails?.length > 0) {
        this.addLead(lead);
        console.log('✅ Hunter lead created:', lead.company.name);
        return lead;
      }
    }
    
    return null;
  }

  // Helper methods for data processing

  // Calculate LinkedIn lead score
  calculateLinkedInScore(profileData) {
    let score = 40; // Base score
    
    if (profileData.name) score += 15;
    if (profileData.headline) score += 15;
    if (profileData.company) score += 20;
    if (profileData.location) score += 10;
    
    // Boost for decision-maker titles
    const headline = (profileData.headline || '').toLowerCase();
    if (headline.includes('ceo') || headline.includes('founder')) score += 25;
    if (headline.includes('director') || headline.includes('manager')) score += 15;
    if (headline.includes('vp') || headline.includes('president')) score += 20;
    
    return Math.min(score, 100);
  }

  // Calculate Instagram lead score
  calculateInstagramScore(profileData) {
    let score = 30; // Base score
    
    if (profileData.followerCount > 1000) score += 15;
    if (profileData.followerCount > 10000) score += 20;
    if (profileData.followerCount > 100000) score += 25;
    if (profileData.isVerified) score += 20;
    if (profileData.bio) score += 10;
    
    return Math.min(score, 100);
  }

  // Calculate website lead score
  calculateWebsiteScore(websiteData) {
    let score = 20; // Base score
    
    if (websiteData.emails?.length > 0) score += 30;
    if (websiteData.phones?.length > 0) score += 20;
    if (websiteData.socialLinks && Object.keys(websiteData.socialLinks).length > 0) score += 15;
    if (websiteData.technologies?.length > 0) score += 15;
    
    return Math.min(score, 100);
  }

  // Calculate technology-based score
  calculateTechnologyScore(technologies) {
    let score = 40;
    
    if (!technologies) return score;
    
    // E-commerce platforms
    if (technologies.includes('Shopify')) score += 25;
    if (technologies.includes('WooCommerce')) score += 20;
    if (technologies.includes('Magento')) score += 20;
    
    // Marketing tools
    if (technologies.includes('Google Analytics')) score += 10;
    if (technologies.includes('Facebook Pixel')) score += 15;
    if (technologies.includes('Google Ads')) score += 15;
    
    // Business indicators
    if (technologies.includes('Salesforce')) score += 20;
    if (technologies.includes('HubSpot')) score += 15;
    
    return Math.min(score, 100);
  }

  // Estimate potential values
  estimateLinkedInValue(profileData) {
    let baseValue = 2000;
    
    const headline = (profileData.headline || '').toLowerCase();
    if (headline.includes('ceo') || headline.includes('founder')) baseValue += 3000;
    if (headline.includes('director')) baseValue += 2000;
    if (headline.includes('manager')) baseValue += 1000;
    
    return baseValue;
  }

  estimateInstagramValue(profileData) {
    let baseValue = 1500;
    
    if (profileData.followerCount > 10000) baseValue += 2000;
    if (profileData.followerCount > 100000) baseValue += 4000;
    if (profileData.isVerified) baseValue += 1500;
    
    return baseValue;
  }

  estimateWebsiteValue(websiteData) {
    let baseValue = 2500;
    
    if (websiteData.emails?.length > 0) baseValue += 1500;
    if (websiteData.technologies?.includes('Shopify')) baseValue += 2000;
    if (websiteData.technologies?.includes('Salesforce')) baseValue += 3000;
    
    return baseValue;
  }

  estimateTechValue(technologies) {
    let baseValue = 2000;
    
    if (!technologies) return baseValue;
    
    // High-value tech stacks
    if (technologies.includes('Salesforce')) baseValue += 4000;
    if (technologies.includes('HubSpot')) baseValue += 3000;
    if (technologies.includes('Shopify Plus')) baseValue += 3500;
    if (technologies.includes('Magento Enterprise')) baseValue += 3000;
    
    return baseValue;
  }

  // Industry inference methods
  inferIndustryFromTitle(title) {
    if (!title) return 'Business';
    
    const titleLower = title.toLowerCase();
    
    if (titleLower.includes('marketing')) return 'Marketing';
    if (titleLower.includes('sales')) return 'Sales';
    if (titleLower.includes('tech') || titleLower.includes('software')) return 'Technology';
    if (titleLower.includes('retail') || titleLower.includes('ecommerce')) return 'E-commerce';
    if (titleLower.includes('finance') || titleLower.includes('accounting')) return 'Finance';
    if (titleLower.includes('health') || titleLower.includes('medical')) return 'Healthcare';
    
    return 'Business';
  }

  inferIndustryFromBio(bio) {
    if (!bio) return 'Social Media';
    
    const bioLower = bio.toLowerCase();
    
    if (bioLower.includes('business') || bioLower.includes('entrepreneur')) return 'Business';
    if (bioLower.includes('fitness') || bioLower.includes('health')) return 'Health & Fitness';
    if (bioLower.includes('fashion') || bioLower.includes('style')) return 'Fashion';
    if (bioLower.includes('food') || bioLower.includes('restaurant')) return 'Food & Beverage';
    if (bioLower.includes('travel')) return 'Travel';
    if (bioLower.includes('tech') || bioLower.includes('digital')) return 'Technology';
    
    return 'Social Media';
  }

  inferIndustryFromTechnologies(technologies) {
    if (!technologies) return 'Business';
    
    if (technologies.includes('Shopify') || technologies.includes('WooCommerce')) return 'E-commerce';
    if (technologies.includes('WordPress')) return 'Content/Media';
    if (technologies.includes('Salesforce') || technologies.includes('HubSpot')) return 'B2B Services';
    if (technologies.includes('Stripe') || technologies.includes('PayPal')) return 'Financial Services';
    
    return 'Business';
  }

  // Pain point inference methods
  inferPainPointsFromTitle(title) {
    if (!title) return ['General business growth opportunities'];
    
    const painPoints = [];
    const titleLower = title.toLowerCase();
    
    if (titleLower.includes('marketing')) {
      painPoints.push('Marketing optimization needed');
    }
    if (titleLower.includes('sales')) {
      painPoints.push('Sales process improvement opportunities');
    }
    if (titleLower.includes('founder') || titleLower.includes('ceo')) {
      painPoints.push('Business scaling challenges');
    }
    
    return painPoints.length > 0 ? painPoints : ['Lead generation optimization needed'];
  }

  inferPainPointsFromBio(bio) {
    if (!bio) return ['Social media marketing opportunities'];
    
    const painPoints = [];
    const bioLower = bio.toLowerCase();
    
    if (bioLower.includes('grow') || bioLower.includes('scale')) {
      painPoints.push('Business growth challenges');
    }
    if (bioLower.includes('new') || bioLower.includes('startup')) {
      painPoints.push('Early-stage business development needs');
    }
    if (bioLower.includes('marketing') || bioLower.includes('brand')) {
      painPoints.push('Marketing and branding optimization');
    }
    
    return painPoints.length > 0 ? painPoints : ['Social media optimization opportunities'];
  }

  inferWebsitePainPoints(websiteData) {
    const painPoints = [];
    
    if (!websiteData.emails || websiteData.emails.length === 0) {
      painPoints.push('Contact information optimization needed');
    }
    if (!websiteData.technologies || websiteData.technologies.length === 0) {
      painPoints.push('Technology stack modernization opportunities');
    }
    if (!websiteData.socialLinks || Object.keys(websiteData.socialLinks).length === 0) {
      painPoints.push('Social media integration missing');
    }
    
    return painPoints.length > 0 ? painPoints : ['Website optimization opportunities'];
  }

  inferTechPainPoints(technologies) {
    if (!technologies) return ['Technology assessment needed'];
    
    const painPoints = [];
    
    // Outdated or missing technologies
    if (!technologies.includes('Google Analytics')) {
      painPoints.push('Analytics tracking missing');
    }
    if (!technologies.includes('SSL') && !technologies.includes('HTTPS')) {
      painPoints.push('Security improvements needed');
    }
    if (technologies.includes('jQuery') && !technologies.includes('React')) {
      painPoints.push('Frontend modernization opportunities');
    }
    
    return painPoints.length > 0 ? painPoints : ['Technology optimization opportunities'];
  }

  // Utility methods
  extractCompanyNameFromDomain(domain) {
    if (!domain) return 'Unknown Company';
    
    // Remove www and common TLDs to get company name
    return domain
      .replace(/^www\./, '')
      .replace(/\.(com|org|net|io|co|biz)$/, '')
      .split('.')[0]
      .replace(/[-_]/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  estimateCompanySizeFromFollowers(followerCount) {
    if (!followerCount) return 'Unknown';
    
    if (followerCount < 1000) return 'Small (1-10)';
    if (followerCount < 10000) return 'Medium (10-50)';
    if (followerCount < 100000) return 'Large (50-200)';
    return 'Enterprise (200+)';
  }

  // Method to manually process extension data (for testing)
  async processExtensionDataFromAPI() {
    try {
      const response = await fetch('/api/extension/data?campaignId=all');
      const result = await response.json();
      
      if (result.success && result.data.length > 0) {
        let processedCount = 0;
        
        result.data.forEach(extensionData => {
          const lead = this.processExtensionData(extensionData);
          if (lead) processedCount++;
        });
        
        console.log(`✅ Processed ${processedCount} extension data entries`);
        this.updateAnalytics();
        this.save();
        this.notify();
        
        return processedCount;
      }
    } catch (error) {
      console.error('Failed to process extension data:', error);
    }
    
    return 0;
  }

  // Auto-process extension data every 30 seconds
  startExtensionDataProcessor() {
    setInterval(() => {
      this.processExtensionDataFromAPI();
    }, 30000); // Check every 30 seconds
  }

// Call this method in your store initialization
// this.startExtensionDataProcessor();


  async initialize() {
    try {
      // Load data from MongoDB to localStorage first
      await localStorageManager.loadFromMongoDB();
      
      // Then load from localStorage to memory
      this.loadFromStorage();
      
      this.isInitialized = true;
      this.notify();
    } catch (error) {
      console.error('Failed to initialize store:', error);
      this.isInitialized = true;
    }
  }

  save() {
    try {
      // Use localStorage manager instead of direct localStorage
      localStorageManager.setItem('ecommerce-app-store', JSON.stringify(this.data));
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  }

  loadFromStorage() {
    try {
      // Use localStorage manager instead of direct localStorage
      const saved = localStorageManager.getItem('ecommerce-app-store');
      if (saved) {
        const parsedData = JSON.parse(saved);
        this.data = { ...this.data, ...parsedData };
        this.updateAnalytics();
        this.updateAutomationAnalytics();
      }
    } catch (error) {
      console.warn('Failed to load from localStorage:', error);
    }
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(listener => {
      try {
        listener(this.data);
      } catch (error) {
        console.error('Error in store listener:', error);
      }
    });
  }

  // Force sync to MongoDB
  async forceSync() {
    return await localStorageManager.forceSync();
  }

  // ==================== YOUTUBE INTEGRATION ====================
  trackYoutubeResearch(campaignId, results) {
    const campaign = this.data.campaigns.find(c => c.id === campaignId);
    if (campaign) {
      campaign.youtubeResearch = {
        enabled: true,
        lastExecuted: new Date(),
        quotaUsed: results.quotaUsed || 0,
        videos: results.videos.map(video => ({
          id: video.id,
          title: video.title,
          channel: video.channelTitle,
          relevanceScore: video.relevanceScore,
          transcript: video.transcript?.substring(0, 500) + '...'
        })),
        stats: {
          videosProcessed: results.processingStats?.videosProcessed || 0,
          videosWithTranscripts: results.processingStats?.videosWithTranscripts || 0
        }
      };
      this.updateAnalytics();
      this.save();
      this.notify();
    }
  }

  getYoutubeResearchStatus(campaignId) {
    const campaign = this.data.campaigns.find(c => c.id === campaignId);
    return campaign?.youtubeResearch || null;
  }

  updateYoutubeQuota(campaignId, quotaUsed) {
    const campaign = this.data.campaigns.find(c => c.id === campaignId);
    if (campaign?.youtubeResearch) {
      campaign.youtubeResearch.quotaUsed += quotaUsed;
      this.updateAnalytics();
      this.save();
      this.notify();
    }
  }

  getYoutubeEnabledCampaigns() {
    return this.data.campaigns.filter(c => c.youtubeResearch?.enabled);
  }

  getTotalYoutubeQuotaUsed() {
    return this.data.campaigns.reduce((sum, c) => 
      sum + (c.youtubeResearch?.quotaUsed || 0), 0);
  }

  isYoutubeEnabled(campaignId) {
    const campaign = this.data.campaigns.find(c => c.id === campaignId);
    return campaign?.youtubeResearch?.enabled || false;
  }

  async cacheTranscript(videoId, transcript, method) {
    try {
      const response = await fetch('/api/youtube-research/cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId,
          transcript,
          method,
          cachedAt: new Date(),
          length: transcript.length
        })
      });
      return response.ok;
    } catch (error) {
      console.error('Cache save failed:', error);
      return false;
    }
  }

  async getCachedTranscript(videoId) {
    try {
      const response = await fetch(`/api/youtube-research/transcript/${videoId}`);
      if (response.ok) {
        const data = await response.json();
        return data.transcript;
      }
    } catch (error) {
      console.error('Cache fetch failed:', error);
    }
    return null;
  }

  async saveYouTubeResearch(industry, results) {
    try {
      const response = await fetch('/api/youtube-research/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          industry, 
          results,
          savedAt: new Date()
        })
      });
      return response.ok;
    } catch (error) {
      console.error('YouTube research save failed:', error);
      return false;
    }
  }

  // ==================== CAMPAIGN METHODS ====================
  updateCampaigns(campaigns) {
    this.data.campaigns = campaigns;
    this.updateAnalytics();
    this.save();
    this.notify();
  }

  addCampaign(campaign) {
    const newCampaign = {
      ...campaign,
      id: campaign.id || Date.now().toString(),
      createdAt: campaign.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.data.campaigns = [newCampaign, ...this.data.campaigns];
    this.updateAnalytics();
    this.save();
    this.notify();
    return newCampaign;
  }

  updateCampaign(campaignId, updates) {
    this.data.campaigns = this.data.campaigns.map(campaign => 
      campaign.id === campaignId ? { 
        ...campaign, 
        ...updates,
        updatedAt: new Date().toISOString(),
        youtubeResearch: updates.youtubeResearch !== undefined ? 
          updates.youtubeResearch : 
          campaign.youtubeResearch
      } : campaign
    );
    this.updateAnalytics();
    this.save();
    this.notify();
  }

  deleteCampaignData(campaignId) {
    this.data.leads = this.data.leads.filter(lead => lead.campaignId !== campaignId);
    this.data.messages = this.data.messages.filter(msg => msg.campaignId !== campaignId);
    this.data.campaigns = this.data.campaigns.filter(campaign => campaign.id !== campaignId);
    this.data.research = this.data.research.filter(research => research.campaignId !== campaignId);
    this.data.videos = this.data.videos.filter(video => video.campaignId !== campaignId);
    this.data.alerts = this.data.alerts.filter(alert => alert.campaignId !== campaignId);
    this.data.replyMonitoring = this.data.replyMonitoring.filter(monitor => monitor.campaignId !== campaignId);
    this.data.followUps = this.data.followUps.filter(followUp => followUp.campaignId !== campaignId);
    this.updateAnalytics();
    this.save();
    this.notify();
  }

  getCampaigns() {
    return this.data.campaigns || [];
  }

  getCampaignById(campaignId) {
    return this.data.campaigns.find(campaign => campaign.id === campaignId);
  }

  // ==================== LEAD METHODS ====================
  addLeads(newLeads, campaignId) {
    const leadsWithCampaign = newLeads.map(lead => ({
      ...lead,
      id: lead.id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
      campaignId: campaignId || lead.campaignId,
      createdAt: lead.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
    this.data.leads = [...this.data.leads, ...leadsWithCampaign];
    this.updateAnalytics();
    this.save();
    this.notify();
    return leadsWithCampaign;
  }

  addLead(lead) {
    const newLead = {
      ...lead,
      id: lead.id || Date.now().toString(),
      createdAt: lead.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.data.leads = [...this.data.leads, newLead];
    this.updateAnalytics();
    this.save();
    this.notify();
    return newLead;
  }

  updateLead(leadId, updates) {
    this.data.leads = this.data.leads.map(lead => 
      lead.id === leadId ? { 
        ...lead, 
        ...updates,
        updatedAt: new Date().toISOString()
      } : lead
    );
    this.updateAnalytics();
    this.save();
    this.notify();
  }

  removeLead(leadId) {
    this.data.leads = this.data.leads.filter(lead => lead.id !== leadId);
    this.updateAnalytics();
    this.save();
    this.notify();
  }

  getLeads() {
    return this.data.leads || [];
  }

  getLeadsByCampaign(campaignId) {
    return this.data.leads.filter(lead => lead.campaignId === campaignId);
  }

  getLeadById(leadId) {
    return this.data.leads.find(lead => lead.id === leadId);
  }

  bulkUpdateLeads(leadIds, updates) {
    this.data.leads = this.data.leads.map(lead => 
      leadIds.includes(lead.id) ? { 
        ...lead, 
        ...updates,
        updatedAt: new Date().toISOString()
      } : lead
    );
    this.updateAnalytics();
    this.save();
    this.notify();
  }

  // ==================== MESSAGE METHODS ====================
  addMessages(newMessages, campaignId) {
    const messagesWithCampaign = newMessages.map(msg => ({
      ...msg,
      id: msg.id || Date.now().toString() + Math.random().toString(36).substr(2, 9),
      campaignId: campaignId || msg.campaignId,
      timestamp: msg.timestamp || new Date().toISOString()
    }));
    this.data.messages = [...this.data.messages, ...messagesWithCampaign];
    this.updateAnalytics();
    this.save();
    this.notify();
    return messagesWithCampaign;
  }

  addMessage(message) {
    const newMessage = {
      ...message,
      id: message.id || Date.now().toString(),
      timestamp: message.timestamp || new Date().toISOString()
    };
    this.data.messages = [...this.data.messages, newMessage];
    this.updateAnalytics();
    this.save();
    this.notify();
    return newMessage;
  }

  getMessages() {
    return this.data.messages || [];
  }

  getMessagesByCampaign(campaignId) {
    return this.data.messages.filter(msg => msg.campaignId === campaignId);
  }

  markMessageAsRead(messageId) {
    this.data.messages = this.data.messages.map(msg => 
      msg.id === messageId ? { ...msg, read: true } : msg
    );
    this.save();
    this.notify();
  }

  // ==================== RESEARCH METHODS ====================
  addResearch(research) {
    const newResearch = {
      ...research,
      id: research.id || Date.now().toString(),
      createdAt: research.createdAt || new Date().toISOString()
    };
    this.data.research = [newResearch, ...this.data.research];
    this.save();
    this.notify();
    return newResearch;
  }

  getResearch() {
    return this.data.research || [];
  }

  getResearchByIndustry(industry) {
    return this.data.research.find(r => r.industry.toLowerCase() === industry.toLowerCase());
  }

  // ==================== VIDEO METHODS ====================
  addVideo(video) {
    const newVideo = {
      ...video,
      id: video.id || Date.now().toString(),
      createdAt: video.createdAt || new Date().toISOString()
    };
    this.data.videos = [...this.data.videos, newVideo];
    this.updateAnalytics();
    this.save();
    this.notify();
    return newVideo;
  }

  updateVideo(videoId, updates) {
    this.data.videos = this.data.videos.map(video => 
      video.id === videoId ? { 
        ...video, 
        ...updates,
        updatedAt: new Date().toISOString()
      } : video
    );
    this.save();
    this.notify();
  }

  getVideos() {
    return this.data.videos || [];
  }

  getVideosByCampaign(campaignId) {
    return this.data.videos.filter(video => video.campaignId === campaignId);
  }

  // ==================== ALERT METHODS ====================
  addAlert(alert) {
    const newAlert = {
      ...alert,
      id: alert.id || Date.now().toString(),
      timestamp: alert.timestamp || new Date().toISOString()
    };
    this.data.alerts = [...this.data.alerts, newAlert];
    this.save();
    this.notify();
    return newAlert;
  }

  clearAlert(alertId) {
    this.data.alerts = this.data.alerts.filter(alert => alert.id !== alertId);
    this.save();
    this.notify();
  }

  getAlerts() {
    return this.data.alerts || [];
  }

  getHighIntentAlerts() {
    return this.data.alerts.filter(alert => alert.priority === 'high' || alert.type === 'high-intent');
  }

  // ==================== REPLY MONITORING ====================
  setupReplyMonitoring(monitoring) {
    const newMonitoring = {
      ...monitoring,
      id: monitoring.id || Date.now().toString(),
      createdAt: monitoring.createdAt || new Date().toISOString()
    };
    this.data.replyMonitoring = [...this.data.replyMonitoring, newMonitoring];
    this.save();
    this.notify();
    return newMonitoring;
  }

  getReplyMonitoring(campaignId) {
    return this.data.replyMonitoring.find(monitor => monitor.campaignId === campaignId);
  }

  getAllReplyMonitoring() {
    return this.data.replyMonitoring || [];
  }

  // ==================== FOLLOW UP METHODS ====================
  scheduleFollowUp(followUp) {
    const newFollowUp = {
      ...followUp,
      id: followUp.id || Date.now().toString(),
      createdAt: followUp.createdAt || new Date().toISOString()
    };
    this.data.followUps = [...this.data.followUps, newFollowUp];
    this.save();
    this.notify();
    return newFollowUp;
  }

  updateFollowUp(followUpId, updates) {
    this.data.followUps = this.data.followUps.map(followUp => 
      followUp.id === followUpId ? { 
        ...followUp, 
        ...updates,
        updatedAt: new Date().toISOString()
      } : followUp
    );
    this.save();
    this.notify();
  }

  getFollowUps() {
    return this.data.followUps || [];
  }

  getFollowUpsByLead(leadId) {
    return this.data.followUps.filter(followUp => followUp.leadId === leadId);
  }

  // ==================== ANALYTICS METHODS ====================
  updateAnalytics() {
    const totalSent = this.data.messages.filter(msg => msg.status === 'sent').length;
    const totalReplies = this.data.leads.filter(lead => 
      lead.engagementHistory?.some(eng => eng.type === 'reply')
    ).length;
    
    this.data.analytics = {
      totalLeads: this.data.leads.length,
      responseRate: totalSent > 0 ? Math.round((totalReplies / totalSent) * 100) : 0,
      activeCampaigns: this.data.campaigns.filter(c => c.status === 'active').length,
      totalMessages: this.data.messages.length,
      avgLeadScore: this.data.leads.length > 0 
        ? Math.round(this.data.leads.reduce((sum, lead) => sum + (lead.opportunity?.score || lead.aiScore || 0), 0) / this.data.leads.length)
        : 0,
      totalCostSpent: this.data.campaigns.reduce((sum, campaign) => sum + parseFloat(campaign.actualCost || campaign.estimatedCost || 0), 0),
      verifiedLeads: this.data.leads.filter(lead => lead.contact?.verified || lead.dataQuality === 'professional_verified').length,
      tier1Leads: this.data.leads.filter(lead => lead.tier === 1).length,
      videosGenerated: this.data.videos.length,
      professionalCampaigns: this.data.campaigns.filter(c => c.type === 'ecommerce' || c.features?.salesNavigator).length,
      youtubeQuotaUsed: this.getTotalYoutubeQuotaUsed()
    };
  }

  getAnalytics() {
    return this.data.analytics || {};
  }

  updateAutomationAnalytics() {
    const automatedCampaigns = this.data.campaigns.filter(c => 
      c.automationConfig || c.serviceType?.includes('automation') || c.enhanced
    );
    
    const hybridCampaigns = this.data.campaigns.filter(c => 
      c.automationConfig?.level === 'hybrid' || c.enhanced?.youtubeResearch
    );
    
    const fullAutomationCampaigns = this.data.campaigns.filter(c => 
      c.automationConfig?.level === 'full' || c.automationConfig?.fullAutomation
    );

    const youtubeResearchSessions = this.data.campaigns.filter(c => 
      c.youtubeResearch?.enabled
    ).length;

    const enhancedStores = this.data.leads.filter(lead => 
      lead.company?.technologies || lead.company?.enhancedData
    ).length;

    const totalAutomationTime = this.data.campaigns.reduce((sum, campaign) => 
      sum + (campaign.automationMetrics?.timeSpent || 0), 0
    );

    const successfulCampaigns = this.data.campaigns.filter(c => 
      c.status === 'active' && (c.automationConfig || c.enhanced)
    ).length;

    this.data.automationStats = {
      totalAutomatedCampaigns: automatedCampaigns.length,
      totalExtensionEnhancements: this.data.campaigns.reduce((sum, c) => 
        sum + (c.extensionEnhancements?.totalEnhancements || 0), 0),
      totalAutomationTime,
      puppeteerAvailable: this.data.campaigns.some(c => 
        c.automationConfig?.availableTools?.includes('puppeteer')
      ),
      hybridCampaigns: hybridCampaigns.length,
      fullAutomationCampaigns: fullAutomationCampaigns.length,
      youtubeResearchSessions,
      freeToolUsage: {
        clearbit: this.data.campaigns.reduce((sum, c) => 
          sum + (c.automationResults?.freeAPIUsage?.clearbit || 0), 0),
        apollo: this.data.campaigns.reduce((sum, c) => 
          sum + (c.automationResults?.freeAPIUsage?.apollo || 0), 0),
        builtwith: this.data.campaigns.reduce((sum, c) => 
          sum + (c.automationResults?.freeAPIUsage?.builtwith || 0), 0)
      },
      totalApiCalls: this.data.campaigns.reduce((sum, c) => 
        sum + (c.automationResults?.totalApiCalls || 0), 0),
      averageAutomationSuccess: automatedCampaigns.length > 0 ? 
        Math.round((successfulCampaigns / automatedCampaigns.length) * 100) : 0,
      totalEnhancedStores: enhancedStores,
      youtubeQuotaUsed: this.getTotalYoutubeQuotaUsed()
    };
  }

  getAutomationStats() {
    return this.data.automationStats || {};
  }

  // ==================== AUTOMATION TRACKING ====================
  trackAutomationUsage(campaignId, automationType, timeSpent, additionalMetrics = {}) {
    const campaign = this.data.campaigns.find(c => c.id === campaignId);
    if (campaign) {
      campaign.automationMetrics = {
        type: automationType,
        timeSpent,
        enhancementsApplied: campaign.totalLeads || 0,
        completedAt: new Date(),
        ...additionalMetrics
      };
      this.updateAutomationAnalytics();
      this.save();
      this.notify();
    }
  }

  trackExtensionUsage(campaignId, extensionType, dataEnhanced) {
    const campaign = this.data.campaigns.find(c => c.id === campaignId);
    if (campaign) {
      if (!campaign.extensionMetrics) {
        campaign.extensionMetrics = {};
      }
      campaign.extensionMetrics[extensionType] = {
        dataEnhanced,
        timestamp: new Date()
      };
      this.updateAutomationAnalytics();
      this.save();
      this.notify();
    }
  }

  trackFreeToolUsage(campaignId, toolName, requestsUsed) {
    const campaign = this.data.campaigns.find(c => c.id === campaignId);
    if (campaign) {
      if (!campaign.freeToolMetrics) {
        campaign.freeToolMetrics = {};
      }
      campaign.freeToolMetrics[toolName] = {
        requestsUsed,
        timestamp: new Date()
      };
      this.updateAutomationAnalytics();
      this.save();
      this.notify();
    }
  }

  // ==================== USER PREFERENCES ====================
  setUserPreferences(preferences) {
    this.data.userPreferences = preferences;
    localStorageManager.setItem('user-preferences', JSON.stringify(preferences));
    this.save();
    this.notify();
  }

  getUserPreferences() {
    return this.data.userPreferences || {
      theme: 'light',
      notifications: true,
      autoSync: true,
      dashboardLayout: 'default'
    };
  }

  updateUserPreferences(updates) {
    const currentPrefs = this.getUserPreferences();
    const updatedPrefs = { ...currentPrefs, ...updates };
    this.setUserPreferences(updatedPrefs);
  }

  // ==================== UTILITY METHODS ====================
  getData() {
    return this.data;
  }

  getProfessionalLeads() {
    return this.data.leads.filter(lead => 
      lead.dataQuality === 'professional_verified' || 
      lead.contact?.verified ||
      lead.aiScore
    );
  }

  getTier1Leads() {
    return this.data.leads.filter(lead => lead.tier === 1);
  }

  getLeadsByTier(tier) {
    return this.data.leads.filter(lead => lead.tier === tier);
  }

  searchLeads(query) {
    const searchTerm = query.toLowerCase();
    return this.data.leads.filter(lead => 
      lead.company?.name?.toLowerCase().includes(searchTerm) ||
      lead.contact?.name?.toLowerCase().includes(searchTerm) ||
      lead.contact?.email?.toLowerCase().includes(searchTerm) ||
      lead.company?.domain?.toLowerCase().includes(searchTerm)
    );
  }

  filterLeadsByPlatform(platform) {
    return this.data.leads.filter(lead => 
      lead.company?.platform?.toLowerCase() === platform.toLowerCase()
    );
  }

  filterLeadsByAutomationLevel(level) {
    return this.data.leads.filter(lead => 
      lead.automationLevel === level || 
      lead.company?.automationLevel === level
    );
  }

  // ==================== EXPORT METHODS ====================
  exportLeadsToCSV(campaignId = null) {
    const leads = campaignId ? this.getLeadsByCampaign(campaignId) : this.data.leads;
    
    return leads.map(lead => ({
      'Company': lead.company?.name || '',
      'Contact Name': lead.contact?.name || '',
      'Email': lead.contact?.email || '',
      'Title': lead.contact?.title || '',
      'Platform': lead.company?.platform || '',
      'AI Score': lead.aiScore || lead.opportunity?.score || '',
      'Tier': lead.tier || '',
      'Verified': lead.contact?.verified ? 'Yes' : 'No',
      'Discovery Method': lead.company?.discoveryMethod || '',
      'Potential Value': lead.opportunity?.potentialValue || '',
      'Enhanced': lead.company?.technologies ? 'Yes' : 'No',
      'Automation Level': lead.automationLevel || '',
      'Created': lead.discoveredAt || lead.createdAt || ''
    }));
  }

  // Export data for backup
  exportData() {
    return {
      ...this.data,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };
  }

  // Import data from backup
  importData(importedData) {
    if (importedData && typeof importedData === 'object') {
      // Remove metadata
      const { exportedAt, version, ...data } = importedData;
      this.data = { ...this.data, ...data };
      this.updateAnalytics();
      this.updateAutomationAnalytics();
      this.save();
      this.notify();
      return true;
    }
    return false;
  }

  // ==================== PROFESSIONAL ANALYTICS ====================
  getProfessionalAnalytics() {
    const professionalLeads = this.getProfessionalLeads();
    const tier1Leads = this.getTier1Leads();
    
    return {
      totalProfessionalLeads: professionalLeads.length,
      verificationRate: this.data.leads.length > 0 ? 
        Math.round((professionalLeads.length / this.data.leads.length) * 100) : 0,
      tier1Count: tier1Leads.length,
      avgAIScore: professionalLeads.length > 0 ? 
        Math.round(professionalLeads.reduce((sum, lead) => sum + (lead.aiScore || 0), 0) / professionalLeads.length) : 0,
      videosGenerated: this.data.videos.length,
      activeAlerts: this.data.alerts.filter(alert => 
        alert.timestamp > Date.now() - 3600000
      ).length,
      professionalCampaigns: this.data.campaigns.filter(c => 
        c.type === 'ecommerce' || c.features?.salesNavigator
      ).length,
      automationInsights: this.getAutomationInsights()
    };
  }

  getAutomationInsights() {
    const stats = this.data.automationStats;
    const totalCampaigns = this.data.campaigns.length;
    
    return {
      automationAdoption: totalCampaigns > 0 ? 
        Math.round((stats.totalAutomatedCampaigns / totalCampaigns) * 100) : 0,
      averageTimePerCampaign: stats.totalAutomatedCampaigns > 0 ? 
        Math.round(stats.totalAutomationTime / stats.totalAutomatedCampaigns) : 0,
      enhancementRate: this.data.leads.length > 0 ? 
        Math.round((stats.totalEnhancedStores / this.data.leads.length) * 100) : 0,
      preferredAutomationLevel: this.getPreferredAutomationLevel(),
      costEfficiency: this.calculateAutomationCostEfficiency(),
      topPerformingTools: this.getTopPerformingTools()
    };
  }

  getPreferredAutomationLevel() {
    const stats = this.data.automationStats;
    if (stats.fullAutomationCampaigns > stats.hybridCampaigns) {
      return 'full';
    } else if (stats.hybridCampaigns > 0) {
      return 'hybrid';
    } else {
      return 'basic';
    }
  }

  calculateAutomationCostEfficiency() {
    const automatedCampaigns = this.data.campaigns.filter(c => 
      c.automationConfig || c.enhanced
    );
    
    if (automatedCampaigns.length === 0) return 0;
    
    const totalCost = automatedCampaigns.reduce((sum, c) => 
      sum + parseFloat(c.actualCost || c.estimatedCost || 0), 0);
    
    const totalLeads = automatedCampaigns.reduce((sum, c) => 
      sum + (c.totalLeads || 0), 0);
    
    return totalLeads > 0 ? Math.round((totalLeads / totalCost) * 100) / 100 : 0;
  }

  getTopPerformingTools() {
    const toolUsage = {};
    
    this.data.campaigns.forEach(campaign => {
      if (campaign.automationConfig?.availableTools) {
        campaign.automationConfig.availableTools.forEach(tool => {
          toolUsage[tool] = (toolUsage[tool] || 0) + 1;
        });
      }
    });
    
    return Object.entries(toolUsage)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([tool, count]) => ({ tool, count }));
  }

  // ==================== BATCH OPERATIONS ====================
  setBulkData(dataObject) {
    Object.entries(dataObject).forEach(([key, value]) => {
      this.data[key] = value;
    });
    this.updateAnalytics();
    this.updateAutomationAnalytics();
    this.save();
    this.notify();
  }

  // ==================== STORAGE STATUS ====================
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      dataKeys: Object.keys(this.data),
      listenerCount: this.listeners.length,
      storageInfo: localStorageManager.getStorageInfo?.() || null,
      totalCampaigns: this.data.campaigns.length,
      totalLeads: this.data.leads.length,
      totalMessages: this.data.messages.length,
      lastUpdated: new Date().toISOString()
    };
  }

  // ==================== CLEAR DATA ====================
  clearAllData() {
    this.data = {
      campaigns: [],
      leads: [],
      messages: [],
      research: [],
      alerts: [],
      videos: [],
      replyMonitoring: [],
      followUps: [],
      analytics: {
        totalLeads: 0,
        responseRate: 0,
        activeCampaigns: 0,
        totalMessages: 0,
        avgLeadScore: 0,
        totalCostSpent: 0,
        verifiedLeads: 0,
        tier1Leads: 0,
        videosGenerated: 0,
        professionalCampaigns: 0,
        youtubeQuotaUsed: 0
      },
      automationStats: {
        totalAutomatedCampaigns: 0,
        totalExtensionEnhancements: 0,
        totalAutomationTime: 0,
        puppeteerAvailable: false,
        hybridCampaigns: 0,
        fullAutomationCampaigns: 0,
        youtubeResearchSessions: 0,
        freeToolUsage: {
          clearbit: 0,
          apollo: 0,
          builtwith: 0
        },
        totalApiCalls: 0,
        averageAutomationSuccess: 0,
        totalEnhancedStores: 0,
        youtubeQuotaUsed: 0
      }
    };
    this.save();
    this.notify();
  }

  // ==================== SEARCH FUNCTIONALITY ====================
  globalSearch(query) {
    const searchTerm = query.toLowerCase();
    
    const searchResults = {
      campaigns: this.data.campaigns.filter(campaign =>
        campaign.name?.toLowerCase().includes(searchTerm) ||
        campaign.description?.toLowerCase().includes(searchTerm) ||
        campaign.industry?.toLowerCase().includes(searchTerm)
      ),
      leads: this.searchLeads(query),
      messages: this.data.messages.filter(message =>
        message.subject?.toLowerCase().includes(searchTerm) ||
        message.content?.toLowerCase().includes(searchTerm)
      ),
      research: this.data.research.filter(research =>
        research.industry?.toLowerCase().includes(searchTerm) ||
        research.description?.toLowerCase().includes(searchTerm)
      ),
      videos: this.data.videos.filter(video =>
        video.title?.toLowerCase().includes(searchTerm) ||
        video.description?.toLowerCase().includes(searchTerm)
      )
    };

    return {
      ...searchResults,
      totalResults: Object.values(searchResults).reduce((sum, arr) => sum + arr.length, 0)
    };
  }

  // ==================== DASHBOARD DATA ====================
  getDashboardData() {
    return {
      summary: {
        totalCampaigns: this.data.campaigns.length,
        activeCampaigns: this.data.campaigns.filter(c => c.status === 'active').length,
        totalLeads: this.data.leads.length,
        totalMessages: this.data.messages.length,
        responseRate: this.data.analytics.responseRate,
        avgLeadScore: this.data.analytics.avgLeadScore
      },
      recentActivity: {
        recentCampaigns: this.data.campaigns.slice(0, 5),
        recentLeads: this.data.leads.slice(0, 10),
        recentMessages: this.data.messages.slice(0, 10),
        recentAlerts: this.data.alerts.slice(0, 5)
      },
      performance: {
        topCampaigns: this.data.campaigns
          .sort((a, b) => (b.totalLeads || 0) - (a.totalLeads || 0))
          .slice(0, 5),
        topPerformingIndustries: this.getTopPerformingIndustries(),
        automationStats: this.data.automationStats,
        youtubeStats: {
          enabledCampaigns: this.getYoutubeEnabledCampaigns().length,
          totalQuotaUsed: this.getTotalYoutubeQuotaUsed(),
          videosProcessed: this.data.videos.length
        }
      }
    };
  }

  getTopPerformingIndustries() {
    const industryStats = {};
    
    this.data.campaigns.forEach(campaign => {
      if (campaign.industry) {
        if (!industryStats[campaign.industry]) {
          industryStats[campaign.industry] = {
            industry: campaign.industry,
            campaigns: 0,
            totalLeads: 0,
            avgScore: 0
          };
        }
        
        industryStats[campaign.industry].campaigns += 1;
        industryStats[campaign.industry].totalLeads += campaign.totalLeads || 0;
      }
    });

    // Calculate average scores
    Object.keys(industryStats).forEach(industry => {
      const industryLeads = this.data.leads.filter(lead => {
        const campaign = this.data.campaigns.find(c => c.id === lead.campaignId);
        return campaign?.industry === industry;
      });
      
      if (industryLeads.length > 0) {
        industryStats[industry].avgScore = Math.round(
          industryLeads.reduce((sum, lead) => sum + (lead.aiScore || 0), 0) / industryLeads.length
        );
      }
    });

    return Object.values(industryStats)
      .sort((a, b) => b.totalLeads - a.totalLeads)
      .slice(0, 5);
  }

  // ==================== UNREAD COUNTS ====================
  getUnreadCounts() {
    return {
      messages: this.data.messages.filter(msg => !msg.read).length,
      alerts: this.data.alerts.filter(alert => !alert.read).length,
      followUps: this.data.followUps.filter(fu => !fu.completed && new Date(fu.scheduledFor) <= new Date()).length
    };
  }

  // ==================== VALIDATION METHODS ====================
  validateData() {
    const issues = [];
    
    // Check for campaigns without IDs
    const campaignsWithoutIds = this.data.campaigns.filter(c => !c.id);
    if (campaignsWithoutIds.length > 0) {
      issues.push(`${campaignsWithoutIds.length} campaigns missing IDs`);
    }
    
    // Check for leads without campaign IDs
    const orphanLeads = this.data.leads.filter(lead => 
      !lead.campaignId || !this.data.campaigns.find(c => c.id === lead.campaignId)
    );
    if (orphanLeads.length > 0) {
      issues.push(`${orphanLeads.length} leads without valid campaign IDs`);
    }
    
    // Check for messages without campaign IDs
    const orphanMessages = this.data.messages.filter(msg => 
      !msg.campaignId || !this.data.campaigns.find(c => c.id === msg.campaignId)
    );
    if (orphanMessages.length > 0) {
      issues.push(`${orphanMessages.length} messages without valid campaign IDs`);
    }
    
    return {
      isValid: issues.length === 0,
      issues
    };
  }

  // ==================== CLEANUP METHODS ====================
  cleanupOrphanedData() {
    const campaignIds = new Set(this.data.campaigns.map(c => c.id));
    
    // Remove leads without valid campaign IDs
    const originalLeadsCount = this.data.leads.length;
    this.data.leads = this.data.leads.filter(lead => 
      lead.campaignId && campaignIds.has(lead.campaignId)
    );
    
    // Remove messages without valid campaign IDs
    const originalMessagesCount = this.data.messages.length;
    this.data.messages = this.data.messages.filter(msg => 
      msg.campaignId && campaignIds.has(msg.campaignId)
    );
    
    // Remove other orphaned data
    this.data.research = this.data.research.filter(research => 
      !research.campaignId || campaignIds.has(research.campaignId)
    );
    
    this.data.videos = this.data.videos.filter(video => 
      !video.campaignId || campaignIds.has(video.campaignId)
    );
    
    this.data.alerts = this.data.alerts.filter(alert => 
      !alert.campaignId || campaignIds.has(alert.campaignId)
    );
    
    this.data.replyMonitoring = this.data.replyMonitoring.filter(monitor => 
      !monitor.campaignId || campaignIds.has(monitor.campaignId)
    );
    
    this.data.followUps = this.data.followUps.filter(followUp => 
      !followUp.campaignId || campaignIds.has(followUp.campaignId)
    );
    
    const removedLeads = originalLeadsCount - this.data.leads.length;
    const removedMessages = originalMessagesCount - this.data.messages.length;
    
    if (removedLeads > 0 || removedMessages > 0) {
      this.updateAnalytics();
      this.updateAutomationAnalytics();
      this.save();
      this.notify();
    }
    
    return {
      removedLeads,
      removedMessages,
      totalRemoved: removedLeads + removedMessages
    };
  }
}

// Create and export singleton instance
const appStore = new AppStore();

// Also export the class for testing
export { AppStore, appStore };
export default appStore;