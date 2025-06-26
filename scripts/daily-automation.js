#!/usr/bin/env node

/**
 * Daily AI Lead Generation Automation Script
 * 
 * This script runs daily to:
 * 1. Discover new leads based on active campaigns
 * 2. Analyze discovered companies for marketing opportunities
 * 3. Generate personalized outreach messages
 * 4. Update industry research data
 * 5. Generate performance reports
 */

import { connectDB } from '../src/lib/db.js'
import { YoutubeResearcher } from '../src/lib/youtube.js'
import { WebScraper } from '../src/lib/scraper.js'
import { openai } from '../src/lib/ai.js'
import axios from 'axios'

const MAX_LEADS_PER_DAY = 50
const MAX_MESSAGES_PER_DAY = 100
const MAX_API_CALLS = 500

class DailyAutomation {
  constructor() {
    this.db = null
    this.youtubeResearcher = new YoutubeResearcher()
    this.webScraper = new WebScraper()
    this.stats = {
      leadsDiscovered: 0,
      messagesGenerated: 0,
      companiesAnalyzed: 0,
      apiCallsUsed: 0,
      errors: []
    }
  }

  async initialize() {
    try {
      console.log('🚀 Initializing daily automation...')
      this.db = await connectDB()
      console.log('✅ Database connected')
      
      // Validate API connections
      await this.validateAPIs()
      console.log('✅ API connections validated')
      
      return true
    } catch (error) {
      console.error('❌ Initialization failed:', error)
      return false
    }
  }

  async validateAPIs() {
    const validations = []
    
    // Test YouTube API
    try {
      const ytValidation = await this.youtubeResearcher.validateConnection()
      validations.push({ service: 'YouTube API', status: ytValidation.success })
    } catch (error) {
      validations.push({ service: 'YouTube API', status: false, error: error.message })
    }

    // Test OpenAI API
    try {
      await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: "test" }],
        max_tokens: 5
      })
      validations.push({ service: 'OpenAI API', status: true })
      this.stats.apiCallsUsed += 1
    } catch (error) {
      validations.push({ service: 'OpenAI API', status: false, error: error.message })
    }

    console.log('API Validation Results:', validations)
    
    const failedAPIs = validations.filter(v => !v.status)
    if (failedAPIs.length > 0) {
      throw new Error(`API validation failed for: ${failedAPIs.map(f => f.service).join(', ')}`)
    }
  }

  async run() {
    const startTime = Date.now()
    console.log('🤖 Starting daily AI lead generation automation...')

    try {
      // Step 1: Get active campaigns
      const activeCampaigns = await this.getActiveCampaigns()
      console.log(`📋 Found ${activeCampaigns.length} active campaigns`)

      // Step 2: Process each campaign
      for (const campaign of activeCampaigns) {
        try {
          await this.processCampaign(campaign)
        } catch (error) {
          console.error(`❌ Error processing campaign ${campaign.name}:`, error)
          this.stats.errors.push(`Campaign ${campaign.name}: ${error.message}`)
        }
      }

      // Step 3: Update industry research (weekly check)
      await this.updateIndustryResearch()

      // Step 4: Generate performance insights
      await this.generateDailyInsights()

      // Step 5: Cleanup and optimization
      await this.performMaintenance()

      const duration = Date.now() - startTime
      console.log(`✅ Daily automation completed in ${Math.round(duration / 1000)}s`)
      
      // Generate final report
      await this.generateReport(duration)

    } catch (error) {
      console.error('❌ Daily automation failed:', error)
      this.stats.errors.push(`Main process: ${error.message}`)
      throw error
    } finally {
      await this.cleanup()
    }
  }

  async getActiveCampaigns() {
    const campaigns = await this.db.collection('campaigns').find({
      status: 'active',
      endDate: { $gte: new Date() }
    }).toArray()

    return campaigns.map(campaign => ({
      id: campaign._id,
      name: campaign.name,
      industry: campaign.targetIndustry,
      companySize: campaign.targetCompanySize,
      targetRoles: campaign.targetRoles,
      dailyLeadTarget: campaign.dailyLeadTarget || 10,
      messageApproach: campaign.messageApproach || 'problem_focused'
    }))
  }

  async processCampaign(campaign) {
    console.log(`🎯 Processing campaign: ${campaign.name}`)

    const campaignStats = {
      leadsDiscovered: 0,
      messagesGenerated: 0,
      companiesAnalyzed: 0
    }

    try {
      // Discover new leads for this campaign
      const newLeads = await this.discoverLeads(campaign)
      campaignStats.leadsDiscovered = newLeads.length
      this.stats.leadsDiscovered += newLeads.length

      console.log(`  📊 Discovered ${newLeads.length} new leads`)

      // Generate messages for qualified leads
      for (const lead of newLeads.slice(0, campaign.dailyLeadTarget)) {
        if (this.stats.messagesGenerated >= MAX_MESSAGES_PER_DAY) {
          console.log('  ⚠️ Daily message limit reached')
          break
        }

        try {
          await this.generateLeadMessage(lead, campaign)
          campaignStats.messagesGenerated++
          this.stats.messagesGenerated++
        } catch (error) {
          console.error(`  ❌ Failed to generate message for lead ${lead.id}:`, error)
        }
      }

      // Update campaign stats
      await this.updateCampaignStats(campaign.id, campaignStats)

      console.log(`  ✅ Campaign processed: ${campaignStats.leadsDiscovered} leads, ${campaignStats.messagesGenerated} messages`)

    } catch (error) {
      console.error(`❌ Campaign processing failed:`, error)
      throw error
    }
  }

  async discoverLeads(campaign) {
    if (this.stats.leadsDiscovered >= MAX_LEADS_PER_DAY) {
      console.log('⚠️ Daily lead discovery limit reached')
      return []
    }

    try {
      // Call the lead discovery API endpoint
      const response = await axios.post('http://localhost:3000/api/lead-discovery', {
        industry: campaign.industry,
        companySize: campaign.companySize,
        targetRoles: campaign.targetRoles,
        leadCount: Math.min(campaign.dailyLeadTarget, MAX_LEADS_PER_DAY - this.stats.leadsDiscovered)
      })

      if (response.data.success) {
        return response.data.data.leads || []
      }

      throw new Error('Lead discovery API returned unsuccessful response')
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        // If API is not available, simulate lead discovery
        return await this.simulateLeadDiscovery(campaign)
      }
      throw error
    }
  }

  async simulateLeadDiscovery(campaign) {
    console.log('  🔄 Simulating lead discovery (API not available)')
    
    // Generate simulated leads for testing
    const simulatedLeads = []
    const leadCount = Math.min(5, campaign.dailyLeadTarget)

    for (let i = 0; i < leadCount; i++) {
      simulatedLeads.push({
        id: `sim_lead_${Date.now()}_${i}`,
        company: {
          name: `${campaign.industry} Company ${i + 1}`,
          website: `https://example-company-${i + 1}.com`,
          industry: campaign.industry,
          size: campaign.companySize.split('-')[0] + '-' + campaign.companySize.split('-')[1]
        },
        contact: {
          name: `Decision Maker ${i + 1}`,
          title: campaign.targetRoles[i % campaign.targetRoles.length],
          email: `contact${i + 1}@example-company-${i + 1}.com`
        },
        opportunity: {
          score: 70 + Math.floor(Math.random() * 30),
          painPoints: [`${campaign.industry} marketing challenges`, 'Poor online visibility'],
          potentialValue: 1000 + Math.floor(Math.random() * 4000)
        }
      })
    }

    return simulatedLeads
  }

  async generateLeadMessage(lead, campaign) {
    try {
      const response = await axios.post('http://localhost:3000/api/message-generation', {
        leadId: lead.id,
        messageType: 'initial_outreach',
        approach: campaign.messageApproach,
        generateVariants: true,
        variantCount: 2
      })

      if (response.data.success) {
        console.log(`    ✉️ Generated message for ${lead.contact.name} at ${lead.company.name}`)
        return response.data.data
      }

      throw new Error('Message generation API returned unsuccessful response')
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        // Simulate message generation
        return await this.simulateMessageGeneration(lead, campaign)
      }
      throw error
    }
  }

  async simulateMessageGeneration(lead, campaign) {
    console.log(`    🔄 Simulating message generation for ${lead.contact.name}`)
    
    const message = {
      id: `sim_msg_${Date.now()}`,
      approach: campaign.messageApproach,
      subjectLines: [
        `Quick question about ${lead.company.name}'s marketing`,
        `${lead.company.industry} marketing opportunity`,
        `Noticed something on your website`
      ],
      message: `Hi ${lead.contact.name},\n\nI noticed ${lead.company.name} could benefit from some marketing optimization. As a paid advertising expert, I've helped similar ${lead.company.industry} companies increase their ROI by 40-60%.\n\nWould you be open to a quick 15-minute conversation?\n\nBest regards,\n${process.env.NEXT_PUBLIC_YOUR_NAME}`,
      generatedAt: new Date()
    }

    // Save simulated message
    await this.db.collection('generated_messages').insertOne({
      leadId: lead.id,
      messages: [message],
      timestamp: new Date()
    })

    return message
  }

  async updateIndustryResearch() {
    try {
      // Check if any industry research needs updating (weekly basis)
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      
      const outdatedResearch = await this.db.collection('industry_knowledge').find({
        lastUpdated: { $lt: oneWeekAgo }
      }).limit(2).toArray() // Limit to 2 industries per day to manage API usage

      console.log(`🔬 Found ${outdatedResearch.length} industries needing research updates`)

      for (const research of outdatedResearch) {
        if (this.stats.apiCallsUsed >= MAX_API_CALLS) {
          console.log('⚠️ API call limit reached, skipping remaining research')
          break
        }

        try {
          console.log(`  📚 Updating research for ${research.industry}`)
          
          const response = await axios.post('http://localhost:3000/api/youtube-research', {
            industry: research.industry,
            depth: 'standard'
          })

          if (response.data.success) {
            console.log(`  ✅ Research updated for ${research.industry}`)
          }
        } catch (error) {
          console.error(`  ❌ Failed to update research for ${research.industry}:`, error)
          this.stats.errors.push(`Research update ${research.industry}: ${error.message}`)
        }
      }
    } catch (error) {
      console.error('❌ Industry research update failed:', error)
      this.stats.errors.push(`Industry research: ${error.message}`)
    }
  }

  async generateDailyInsights() {
    try {
      console.log('🧠 Generating daily AI insights...')

      // Get today's performance data
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const todayStats = await this.db.collection('leads').aggregate([
        { $match: { discoveredAt: { $gte: today } } },
        {
          $group: {
            _id: '$company.industry',
            totalLeads: { $sum: 1 },
            avgOpportunityScore: { $avg: '$opportunity.score' },
            totalPotentialValue: { $sum: '$opportunity.potentialValue' }
          }
        }
      ]).toArray()

      // Generate insights using AI
      const insights = await this.generateAIInsights(todayStats)

      // Save insights
      await this.db.collection('daily_insights').insertOne({
        date: today,
        stats: todayStats,
        insights,
        generatedAt: new Date()
      })

      console.log('  ✅ Daily insights generated')
    } catch (error) {
      console.error('❌ Daily insights generation failed:', error)
      this.stats.errors.push(`Daily insights: ${error.message}`)
    }
  }

  async generateAIInsights(stats) {
    try {
      const prompt = `
Analyze today's lead generation performance and provide actionable insights:

Performance Data:
${JSON.stringify(stats, null, 2)}

Generate insights about:
1. Top performing industries
2. Lead quality trends
3. Market opportunities
4. Recommendations for tomorrow

Keep insights concise and actionable for a marketing professional.
`

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 500,
        temperature: 0.6
      })

      this.stats.apiCallsUsed += 1
      return response.choices[0].message.content
    } catch (error) {
      console.error('AI insights generation failed:', error)
      return 'AI insights generation temporarily unavailable'
    }
  }

  async performMaintenance() {
    try {
      console.log('🧹 Performing daily maintenance...')

      // Delete old temporary data (older than 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      
      const cleanupResults = await Promise.all([
        this.db.collection('temp_data').deleteMany({ createdAt: { $lt: thirtyDaysAgo } }),
        this.db.collection('search_cache').deleteMany({ cachedAt: { $lt: thirtyDaysAgo } }),
        this.db.collection('error_logs').deleteMany({ timestamp: { $lt: thirtyDaysAgo } })
      ])

      console.log(`  🗑️ Cleaned up ${cleanupResults.reduce((sum, r) => sum + r.deletedCount, 0)} old records`)

      // Update database indexes
      await this.updateDatabaseIndexes()

      console.log('  ✅ Maintenance completed')
    } catch (error) {
      console.error('❌ Maintenance failed:', error)
      this.stats.errors.push(`Maintenance: ${error.message}`)
    }
  }

  async updateDatabaseIndexes() {
    try {
      // Ensure indexes exist for performance
      const indexOperations = [
        this.db.collection('leads').createIndex({ 'opportunity.score': -1, discoveredAt: -1 }),
        this.db.collection('campaigns').createIndex({ status: 1, endDate: 1 }),
        this.db.collection('generated_messages').createIndex({ timestamp: -1 }),
        this.db.collection('industry_knowledge').createIndex({ industry: 1, lastUpdated: -1 })
      ]

      await Promise.all(indexOperations)
    } catch (error) {
      console.error('Index update failed:', error)
    }
  }

  async updateCampaignStats(campaignId, stats) {
    try {
      await this.db.collection('campaigns').updateOne(
        { _id: campaignId },
        {
          $inc: {
            totalLeadsDiscovered: stats.leadsDiscovered,
            totalMessagesGenerated: stats.messagesGenerated
          },
          $set: { lastProcessed: new Date() }
        }
      )
    } catch (error) {
      console.error('Failed to update campaign stats:', error)
    }
  }

  async generateReport(duration) {
    const report = {
      date: new Date(),
      duration: Math.round(duration / 1000),
      stats: this.stats,
      summary: {
        totalLeads: this.stats.leadsDiscovered,
        totalMessages: this.stats.messagesGenerated,
        errorCount: this.stats.errors.length,
        apiEfficiency: this.stats.apiCallsUsed < MAX_API_CALLS ? 'Good' : 'At Limit'
      }
    }

    try {
      await this.db.collection('automation_reports').insertOne(report)
      console.log('📊 Daily report generated:', JSON.stringify(report.summary, null, 2))
    } catch (error) {
      console.error('Failed to save report:', error)
    }

    return report
  }

  async cleanup() {
    try {
      if (this.webScraper) {
        await this.webScraper.closeBrowser()
      }
      console.log('🧹 Cleanup completed')
    } catch (error) {
      console.error('Cleanup error:', error)
    }
  }
}

// Main execution
async function main() {
  const automation = new DailyAutomation()
  
  try {
    const initialized = await automation.initialize()
    if (!initialized) {
      process.exit(1)
    }

    await automation.run()
    console.log('🎉 Daily automation completed successfully!')
    process.exit(0)
  } catch (error) {
    console.error('💥 Daily automation failed:', error)
    process.exit(1)
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export default DailyAutomation