// lib/hybrid-extension-system.js
// Hybrid system that combines automated APIs with manual extension data

import { YoutubeResearcher } from './youtube.js'

export class HybridExtensionSystem {
  constructor() {
    // Initialize automated APIs with proper environment variables
    this.automatedAPIs = {
      serper: process.env.NEXT_PUBLIC_SERPER_API_KEY,
      hunter: process.env.NEXT_PUBLIC_HUNTER_API_KEY,
      youtube: process.env.NEXT_PUBLIC_YOUTUBE_API_KEY, // Fixed variable name
      ipstack: process.env.NEXT_PUBLIC_IPSTACK_API_KEY,
      whois: process.env.NEXT_PUBLIC_WHOIS_API_KEY
    }
    
    // Initialize YouTube researcher if API key exists
    this.youtubeResearcher = this.initializeYouTube();

    this.youtubeResearcher = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY 
      ? new YoutubeResearcher() 
      : null;

    // Initialize extension data
    this.extensionData = {
      wappalyzer: null,
      hunterExtension: null,
      linkedinSalesNav: null,
      similarweb: null
    }
    
    this.dataQueue = [] // Stores discovered sites for manual enhancement
  }

  initializeYouTube() {
    try {
      return new YoutubeResearcher();
    } catch (error) {
      console.warn('YouTube initialization failed:', error.message);
      return null;
    }
  }

  // PHASE 1: Automated Discovery with APIs
  async runAutomatedDiscovery(campaign) {
    console.log('🤖 Phase 1: Automated Discovery...')
    
    const results = {
      stores: [],
      manualEnhancementQueue: [],
      automatedEnhancements: 0,
      youtubeResearch: null,
      readyForExtensions: false
    }

    try {
      // Step 1: Discover stores automatically (Serper API)
      const stores = await this.discoverStoresWithSerper(campaign)
      if (campaign.targetIndustry) {
        results.youtubeResearch = await this.researchIndustryVideos(campaign.targetIndustry)
      }

      if (this.youtubeResearcher && campaign.researchVideos) {
        results.youtubeResearch = await this.youtubeResearcher.searchByIndustry(
          campaign.targetIndustry,
          { depth: 'standard' }
        );
        
        // Track quota usage (100 units per search + 1 per video)
        const quotaUsed = 100 + (results.youtubeResearch.videos.length * 1);
        appStore.updateYoutubeQuota(campaign.id, quotaUsed);
      }
      
      // Step 2: Enhance automatically with available APIs
      for (const store of stores) {
        const enhanced = await this.enhanceWithAutomatedAPIs(store)
        results.stores.push(enhanced)
        
        // Add to manual enhancement queue
        results.manualEnhancementQueue.push({
          id: enhanced.id,
          domain: enhanced.company.domain,
          website: enhanced.company.website,
          name: enhanced.company.name,
          platform: enhanced.company.platform,
          needsEnhancement: this.determineManualEnhancementNeeds(enhanced)
        })
      }

      // Step 3: Prepare extension workflow
      results.readyForExtensions = true
      this.dataQueue = results.manualEnhancementQueue
      youtubeResearch: await this.getYouTubeResearch(campaign)
      return results

    } catch (error) {
      console.error('Automated discovery failed:', error)
      throw error
    }
  }

  async getYouTubeResearch(campaign) {
    if (!this.youtubeResearcher || !campaign.researchVideos) return null;
    
    try {
      return await this.youtubeResearcher.searchByIndustry(
        campaign.targetIndustry,
        { depth: 'standard' }
      );
    } catch (error) {
      console.error('YouTube research failed:', error);
      return { error: error.message };
    }
  }

  async researchIndustryVideos(industry) {
    try {
      return await this.youtubeResearcher.searchByIndustry(industry)
    } catch (error) {
      console.error('YouTube research failed:', error)
      return null
    }
  }

  // PHASE 2: Manual Extension Enhancement Workflow
  async prepareExtensionWorkflow(stores) {
    console.log('🔧 Phase 2: Preparing Extension Workflow...')
    
    const workflow = {
      totalSites: stores.length,
      wappalyzerSites: [],
      hunterSites: [],
      linkedinSites: [],
      instructions: [],
      estimatedTime: 0
    }

    stores.forEach(store => {
      // Sites that need technology detection
      if (!store.company.technologies || store.company.technologies.confidence === 'simulated') {
        workflow.wappalyzerSites.push({
          url: store.company.website,
          name: store.company.name,
          expectedTech: store.company.platform
        })
      }

      // Sites that need contact verification
      if (!store.contact?.verified || !store.contact?.hunterData) {
        workflow.hunterSites.push({
          domain: store.company.domain,
          name: store.company.name,
          currentEmail: store.contact?.email
        })
      }

      // Sites that need LinkedIn research
      if (!store.contact?.linkedinProfile) {
        workflow.linkedinSites.push({
          company: store.company.name,
          domain: store.company.domain,
          targetRoles: ['Owner', 'Founder', 'CEO', 'Marketing Manager']
        })
      }
    })

    // Generate step-by-step instructions
    workflow.instructions = this.generateExtensionInstructions(workflow)
    workflow.estimatedTime = this.calculateEstimatedTime(workflow)

    return workflow
  }

  // Generate detailed instructions for manual enhancement
  generateExtensionInstructions(workflow) {
    const instructions = []

    if (workflow.wappalyzerSites.length > 0) {
      instructions.push({
        step: 1,
        extension: 'Wappalyzer',
        action: 'Technology Detection',
        sites: workflow.wappalyzerSites.length,
        instruction: `
🔧 WAPPALYZER TECHNOLOGY DETECTION:

1. Install Wappalyzer browser extension (free)
2. Visit each of these ${workflow.wappalyzerSites.length} websites:
${workflow.wappalyzerSites.map(site => `   • ${site.url} (${site.name})`).join('\n')}

3. For each site:
   - Click Wappalyzer icon in browser
   - Note: E-commerce platform, Analytics, Email marketing, Payment processors
   - Take screenshot or copy data

4. Export data:
   - Use Wappalyzer's bulk export feature OR
   - Manual CSV: Domain, Platform, Analytics, Email_Tools, Payments

5. Import back into system using the "Import Wappalyzer Data" button

Expected time: ~${Math.ceil(workflow.wappalyzerSites.length * 0.5)} minutes
        `,
        expectedData: ['E-commerce platform', 'Analytics tools', 'Email marketing', 'Payment processors']
      })
    }

    if (workflow.hunterSites.length > 0) {
      instructions.push({
        step: 2,
        extension: 'Hunter.io',
        action: 'Email Discovery & Verification',
        sites: workflow.hunterSites.length,
        instruction: `
📧 HUNTER.IO EMAIL ENHANCEMENT:

1. Install Hunter.io browser extension (free)
2. Visit each company website:
${workflow.hunterSites.map(site => `   • ${site.domain} (${site.name})`).join('\n')}

3. For each site:
   - Click Hunter.io extension icon
   - Find additional emails (Owner, Marketing Manager, etc.)
   - Verify existing emails
   - Note confidence scores

4. Export data:
   - Use Hunter's export feature OR
   - Manual CSV: Domain, Email, Name, Title, Confidence, Verified

5. Import using "Import Hunter Data" button

Expected time: ~${Math.ceil(workflow.hunterSites.length * 1)} minutes
        `,
        expectedData: ['Additional emails', 'Contact names', 'Job titles', 'Verification status']
      })
    }

    if (workflow.linkedinSites.length > 0) {
      instructions.push({
        step: 3,
        extension: 'LinkedIn Sales Navigator',
        action: 'Contact Discovery',
        sites: workflow.linkedinSites.length,
        instruction: `
👔 LINKEDIN SALES NAVIGATOR:

1. Use LinkedIn Sales Navigator (or regular LinkedIn)
2. Search for contacts at each company:
${workflow.linkedinSites.map(site => `   • ${site.company} (${site.domain})`).join('\n')}

3. For each company, find:
   - Owners/Founders
   - Marketing Managers
   - E-commerce Managers
   - Decision makers

4. Collect data:
   - Name, Title, LinkedIn URL
   - Contact info if available
   - Company insights

5. Export as CSV or use PhantomBuster automation

Expected time: ~${Math.ceil(workflow.linkedinSites.length * 2)} minutes
        `,
        expectedData: ['Decision maker contacts', 'LinkedIn profiles', 'Job titles', 'Company insights']
      })
    }

    return instructions
  }

  // PHASE 3: Data Import and Merge System
  async importExtensionData(dataType, csvData, campaignId) {
    console.log(`📥 Importing ${dataType} data...`)
    
    try {
      let importedData = []
      
      switch (dataType) {
        case 'wappalyzer':
          importedData = await this.parseWappalyzerData(csvData)
          break
        case 'hunter':
          importedData = await this.parseHunterData(csvData)
          break
        case 'linkedin':
          importedData = await this.parseLinkedInData(csvData)
          break
        default:
          throw new Error(`Unknown data type: ${dataType}`)
      }

      // Merge with existing campaign data
      const mergeResults = await this.mergeExtensionDataWithCampaign(
        importedData, 
        dataType, 
        campaignId
      )

      return mergeResults

    } catch (error) {
      console.error(`Error importing ${dataType} data:`, error)
      throw error
    }
  }

  // Parse Wappalyzer CSV data
  async parseWappalyzerData(csvData) {
    const Papa = await import('papaparse')
    const parsed = Papa.parse(csvData, { header: true, skipEmptyLines: true })
    
    return parsed.data.map(row => ({
      domain: row.domain || row.url?.replace(/^https?:\/\/(www\.)?/, '').split('/')[0],
      technologies: {
        ecommercePlatform: row.ecommerce_platform || row['E-commerce'] || 'Unknown',
        analytics: this.parseCommaSeparated(row.analytics || row['Analytics']),
        emailMarketing: this.parseCommaSeparated(row.email_marketing || row['Email Marketing']),
        payments: this.parseCommaSeparated(row.payments || row['Payment Processors']),
        cms: row.cms || row['CMS'],
        javascript: this.parseCommaSeparated(row.javascript || row['JavaScript Libraries']),
        confidence: 'extension_verified'
      },
      source: 'wappalyzer_extension',
      collectedAt: new Date()
    }))
  }

  // Parse Hunter.io data
  async parseHunterData(csvData) {
    const Papa = await import('papaparse')
    const parsed = Papa.parse(csvData, { header: true, skipEmptyLines: true })
    
    return parsed.data.map(row => ({
      domain: row.domain || this.extractDomainFromEmail(row.email),
      email: row.email,
      firstName: row.first_name || row.firstName,
      lastName: row.last_name || row.lastName,
      name: row.name || `${row.first_name || ''} ${row.last_name || ''}`.trim(),
      title: row.title || row.position,
      confidence: parseInt(row.confidence) || 0,
      verified: row.verified === 'true' || row.verification === 'valid',
      source: 'hunter_extension',
      collectedAt: new Date()
    }))
  }

  // Parse LinkedIn data
  async parseLinkedInData(csvData) {
    const Papa = await import('papaparse')
    const parsed = Papa.parse(csvData, { header: true, skipEmptyLines: true })
    
    return parsed.data.map(row => ({
      company: row.company || row.companyName,
      name: row.name || row.fullName,
      title: row.title || row.position,
      linkedinUrl: row.linkedin_url || row.profileUrl,
      location: row.location,
      industry: row.industry,
      experience: row.experience,
      source: 'linkedin_extension',
      collectedAt: new Date()
    }))
  }

  // Merge extension data with existing campaign
  async mergeExtensionDataWithCampaign(importedData, dataType, campaignId) {
    const campaignLeads = this.getCampaignLeads(campaignId)
    let mergedCount = 0
    let newLeadsAdded = 0

    for (const lead of campaignLeads) {
      const domain = lead.company?.domain
      if (!domain) continue

      // Find matching extension data
      const matchingData = importedData.find(data => 
        data.domain === domain || 
        (data.company && data.company.toLowerCase().includes(lead.company.name.toLowerCase()))
      )

      if (matchingData) {
        // Merge based on data type
        switch (dataType) {
          case 'wappalyzer':
            lead.company.technologies = {
              ...lead.company.technologies,
              ...matchingData.technologies,
              enhancedWith: 'wappalyzer_extension'
            }
            break
            
          case 'hunter':
            if (matchingData.confidence > (lead.contact?.confidence || 0)) {
              lead.contact = {
                ...lead.contact,
                email: matchingData.email,
                name: matchingData.name,
                firstName: matchingData.firstName,
                lastName: matchingData.lastName,
                title: matchingData.title,
                verified: matchingData.verified,
                confidence: matchingData.confidence,
                enhancedWith: 'hunter_extension'
              }
            }
            break
            
          case 'linkedin':
            lead.contact = {
              ...lead.contact,
              linkedinUrl: matchingData.linkedinUrl,
              linkedinData: {
                title: matchingData.title,
                location: matchingData.location,
                experience: matchingData.experience
              },
              enhancedWith: 'linkedin_extension'
            }
            break
        }

        lead.opportunity.enhancedScore = this.recalculateEnhancedScore(lead)
        mergedCount++
      }
    }

    // Update campaign with enhanced data
    this.updateCampaignLeads(campaignId, campaignLeads)

    return {
      dataType,
      importedRecords: importedData.length,
      mergedRecords: mergedCount,
      newLeadsAdded,
      enhancementSummary: this.generateEnhancementSummary(campaignLeads, dataType)
    }
  }

  // PHASE 4: Automated Extension Workflow (Advanced)
  async createAutomatedExtensionWorkflow(campaign) {
    console.log('🚀 Creating automated extension workflow...')
    
    // This creates a workflow that can be executed with tools like:
    // - PhantomBuster (LinkedIn automation)
    // - Zapier (data connection)
    // - Browser automation scripts
    
    const workflow = {
      id: `workflow_${campaign.id}_${Date.now()}`,
      campaignId: campaign.id,
      steps: [],
      automationPossible: false,
      manualSteps: 0,
      estimatedSavings: 0
    }

    // Check if PhantomBuster is available for LinkedIn automation
    if (process.env.NEXT_PUBLIC_PHANTOM_BUSTER_API_KEY) {
      workflow.steps.push({
        type: 'automated',
        tool: 'PhantomBuster',
        action: 'LinkedIn Sales Navigator Scraping',
        setup: this.createPhantomBusterSetup(campaign),
        estimatedTime: '10 minutes',
        cost: '$5-10/month'
      })
      workflow.automationPossible = true
    }

    // Manual steps that can't be automated
    workflow.steps.push({
      type: 'manual',
      tool: 'Wappalyzer Extension',
      action: 'Technology Detection',
      estimatedTime: `${Math.ceil(campaign.dailyTarget * 0.5)} minutes`,
      instructions: 'Visit each store website with Wappalyzer extension'
    })

    workflow.steps.push({
      type: 'manual',
      tool: 'Hunter.io Extension',
      action: 'Email Discovery',
      estimatedTime: `${Math.ceil(campaign.dailyTarget * 1)} minutes`,
      instructions: 'Use Hunter extension on each store website'
    })

    workflow.manualSteps = workflow.steps.filter(step => step.type === 'manual').length
    workflow.estimatedSavings = this.calculateTimeSavings(workflow.steps)

    return workflow
  }

  // Helper methods
  parseCommaSeparated(str) {
    if (!str) return []
    return str.split(',').map(item => item.trim()).filter(item => item.length > 0)
  }

  extractDomainFromEmail(email) {
    if (!email) return null
    return email.split('@')[1]
  }

  determineManualEnhancementNeeds(store) {
    const needs = []
    
    if (!store.company.technologies || store.company.technologies.confidence === 'simulated') {
      needs.push('technology_detection')
    }
    
    if (!store.contact?.verified || store.contact?.confidence < 80) {
      needs.push('email_verification')
    }
    
    if (!store.contact?.linkedinUrl) {
      needs.push('linkedin_research')
    }
    
    return needs
  }

  calculateEstimatedTime(workflow) {
    const timePerSite = {
      wappalyzer: 0.5, // 30 seconds per site
      hunter: 1,       // 1 minute per site
      linkedin: 2      // 2 minutes per site
    }
    
    let totalMinutes = 0
    totalMinutes += workflow.wappalyzerSites.length * timePerSite.wappalyzer
    totalMinutes += workflow.hunterSites.length * timePerSite.hunter
    totalMinutes += workflow.linkedinSites.length * timePerSite.linkedin
    
    return Math.ceil(totalMinutes)
  }

  recalculateEnhancedScore(lead) {
    let score = lead.opportunity?.score || 75
    
    // Technology data bonus
    if (lead.company?.technologies?.enhancedWith === 'wappalyzer_extension') {
      score += 15 // Real tech data is much more valuable
      
      if (lead.company.technologies.emailMarketing?.length === 0) {
        score += 10 // Opportunity for email marketing setup
      }
      
      if (lead.company.technologies.analytics?.length === 0) {
        score += 8 // Opportunity for analytics setup
      }
    }
    
    // Email verification bonus
    if (lead.contact?.enhancedWith === 'hunter_extension') {
      score += 10
      if (lead.contact.verified) score += 5
      if (lead.contact.confidence > 90) score += 5
    }
    
    // LinkedIn data bonus
    if (lead.contact?.enhancedWith === 'linkedin_extension') {
      score += 8
      if (lead.contact.linkedinData?.experience) score += 5
    }
    
    return Math.min(score, 100)
  }

  generateEnhancementSummary(leads, dataType) {
    const enhanced = leads.filter(lead => 
      lead.company?.technologies?.enhancedWith === `${dataType}_extension` ||
      lead.contact?.enhancedWith === `${dataType}_extension`
    )
    
    return {
      totalLeads: leads.length,
      enhancedLeads: enhanced.length,
      enhancementRate: Math.round((enhanced.length / leads.length) * 100),
      averageScoreIncrease: this.calculateAverageScoreIncrease(enhanced),
      newOpportunities: this.identifyNewOpportunities(enhanced, dataType)
    }
  }

  calculateAverageScoreIncrease(enhancedLeads) {
    if (enhancedLeads.length === 0) return 0
    
    return enhancedLeads.reduce((sum, lead) => {
      const original = lead.opportunity?.score || 75
      const enhanced = lead.opportunity?.enhancedScore || original
      return sum + (enhanced - original)
    }, 0) / enhancedLeads.length
  }

  identifyNewOpportunities(enhancedLeads, dataType) {
    const opportunities = []
    
    enhancedLeads.forEach(lead => {
      if (dataType === 'wappalyzer') {
        if (lead.company?.technologies?.emailMarketing?.length === 0) {
          opportunities.push(`${lead.company.name}: Email marketing setup opportunity`)
        }
        if (lead.company?.technologies?.analytics?.length === 0) {
          opportunities.push(`${lead.company.name}: Analytics setup opportunity`)
        }
      }
    })
    
    return opportunities.slice(0, 10) // Top 10 opportunities
  }

  // Placeholder methods (integrate with your existing system)
  async discoverStoresWithSerper(campaign) {
    // Integrate with your existing Serper-based discovery
    return []
  }

  async enhanceWithAutomatedAPIs(store) {
    // Integrate with your existing API enhancement
    return store
  }

  getCampaignLeads(campaignId) {
    // Integrate with your appStore
    return []
  }

  updateCampaignLeads(campaignId, leads) {
    // Integrate with your appStore
  }

  createPhantomBusterSetup(campaign) {
    return {
      phantom: 'LinkedIn Sales Navigator Search Export',
      input: {
        searches: [`${campaign.targetIndustry} owner`],
        numberOfProfiles: campaign.dailyTarget * 2
      }
    }
  }

  calculateTimeSavings(steps) {
    // Calculate how much time automation saves vs manual work
    const manualTime = steps.filter(s => s.type === 'manual')
      .reduce((sum, step) => sum + parseInt(step.estimatedTime), 0)
    const automatedTime = steps.filter(s => s.type === 'automated')
      .reduce((sum, step) => sum + parseInt(step.estimatedTime), 0)
    
    return Math.max(0, manualTime - automatedTime)
  }
}