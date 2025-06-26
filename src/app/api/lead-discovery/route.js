import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { WebScraper } from '@/lib/scraper'
import { openai } from '@/lib/ai'

export async function POST(request) {
  try {
    const { 
      industry, 
      companySize = '1-500', 
      targetRoles = ['CEO', 'Marketing Director', 'CTO', 'Founder'],
      leadCount = 50,
      analysisDepth = 'standard'
    } = await request.json()

    if (!industry) {
      return NextResponse.json(
        { error: 'Industry is required' },
        { status: 400 }
      )
    }

    const db = await connectDB()
    const scraper = new WebScraper()

    console.log(`Starting lead discovery for ${industry} industry...`)

    // Generate search queries for lead discovery
    const searchQueries = generateLeadSearchQueries(industry, companySize)
    
    const discoveryResults = {
      industry,
      targetRoles,
      companySize,
      timestamp: new Date(),
      leads: [],
      companiesAnalyzed: 0,
      leadsScored: 0,
      totalOpportunities: 0
    }

    // Process each search query
    for (const query of searchQueries) {
      try {
        console.log(`Searching: ${query.term}`)
        
        // Find companies using multiple sources
        const companies = await findCompanies(query, leadCount / searchQueries.length)
        
        for (const company of companies) {
          try {
            // Analyze company website and marketing
            const analysis = await analyzeCompanyOpportunity(company, industry, scraper)
            
            if (analysis && analysis.opportunityScore >= 60) {
              // Find decision makers
              const contacts = await findDecisionMakers(company, targetRoles, scraper)
              
              // Create lead entries
              for (const contact of contacts) {
                const lead = {
                  id: generateLeadId(),
                  company: {
                    name: company.name,
                    website: company.website,
                    domain: company.domain,
                    industry: company.industry,
                    size: company.estimatedSize,
                    location: company.location,
                    description: company.description
                  },
                  contact: {
                    name: contact.name,
                    title: contact.title,
                    email: contact.email,
                    linkedin: contact.linkedin,
                    department: contact.department
                  },
                  opportunity: {
                    score: analysis.opportunityScore,
                    potentialValue: analysis.estimatedValue,
                    painPoints: analysis.painPoints,
                    marketingIssues: analysis.marketingIssues,
                    recommendations: analysis.recommendations,
                    urgency: analysis.urgency
                  },
                  research: {
                    competitorAnalysis: analysis.competitors,
                    adSpendEstimate: analysis.adSpendEstimate,
                    techStack: analysis.techStack,
                    socialPresence: analysis.socialPresence
                  },
                  discoveredAt: new Date(),
                  source: query.source,
                  status: 'new'
                }

                discoveryResults.leads.push(lead)
                discoveryResults.leadsScored++
              }
            }
            
            discoveryResults.companiesAnalyzed++
          } catch (companyError) {
            console.error(`Error analyzing company ${company.name}:`, companyError)
            continue
          }
        }
      } catch (queryError) {
        console.error(`Error processing query "${query.term}":`, queryError)
        continue
      }
    }

    // Sort leads by opportunity score
    discoveryResults.leads.sort((a, b) => b.opportunity.score - a.opportunity.score)
    
    // Limit results
    discoveryResults.leads = discoveryResults.leads.slice(0, leadCount)
    discoveryResults.totalOpportunities = discoveryResults.leads.length

    // Save leads to database
    if (discoveryResults.leads.length > 0) {
      await db.collection('leads').insertMany(discoveryResults.leads)
    }

    // Update discovery stats
    await updateDiscoveryStats(db, industry, discoveryResults)

    return NextResponse.json({
      success: true,
      data: discoveryResults,
      message: `Discovered ${discoveryResults.totalOpportunities} qualified leads from ${discoveryResults.companiesAnalyzed} companies analyzed`
    })

  } catch (error) {
    console.error('Lead discovery error:', error)
    return NextResponse.json(
      { error: 'Failed to discover leads', details: error.message },
      { status: 500 }
    )
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const industry = searchParams.get('industry')
    const minScore = parseInt(searchParams.get('minScore')) || 60
    const limit = parseInt(searchParams.get('limit')) || 50
    const status = searchParams.get('status') || 'new'

    const db = await connectDB()
    
    let query = { 'opportunity.score': { $gte: minScore } }
    if (industry) {
      query['company.industry'] = { $regex: industry, $options: 'i' }
    }
    if (status !== 'all') {
      query.status = status
    }

    const leads = await db.collection('leads')
      .find(query)
      .sort({ 'opportunity.score': -1, discoveredAt: -1 })
      .limit(limit)
      .toArray()

    const stats = await db.collection('discovery_stats')
      .findOne({ industry }, { sort: { timestamp: -1 } })

    return NextResponse.json({
      success: true,
      data: {
        leads,
        stats,
        total: leads.length
      }
    })

  } catch (error) {
    console.error('Error fetching leads:', error)
    return NextResponse.json(
      { error: 'Failed to fetch leads' },
      { status: 500 }
    )
  }
}

function generateLeadSearchQueries(industry, companySize) {
  const sizeQueries = {
    '1-10': ['startup', 'small business', 'new company'],
    '11-50': ['growing company', 'scale up', 'expanding business'],
    '51-200': ['mid size company', 'established business'],
    '201-500': ['medium enterprise', 'larger company'],
    '1-500': ['startup', 'small business', 'growing company', 'scale up']
  }

  const sizes = sizeQueries[companySize] || sizeQueries['1-500']
  
  return [
    {
      term: `${industry} companies need marketing help`,
      source: 'general_search',
      intent: 'marketing_need'
    },
    {
      term: `${industry} startup poor website performance`,
      source: 'performance_issues',
      intent: 'technical_issues'
    },
    {
      term: `${industry} companies low online visibility`,
      source: 'visibility_issues',
      intent: 'seo_issues'
    },
    {
      term: `new ${industry} businesses launched`,
      source: 'new_businesses',
      intent: 'new_market_entry'
    },
    ...sizes.map(size => ({
      term: `${size} ${industry} company`,
      source: 'size_specific',
      intent: 'company_discovery'
    }))
  ]
}

async function findCompanies(query, limit) {
  try {
    // This would integrate with various sources:
    // 1. Google Search API
    // 2. Business directories
    // 3. Industry databases
    // 4. LinkedIn Sales Navigator (if available)
    // 5. Crunchbase API
    
    // For now, we'll simulate company discovery
    // In production, you'd integrate with real APIs
    
    const simulatedCompanies = [
      {
        name: 'TechStart Solutions',
        website: 'https://techstartsolutions.com',
        domain: 'techstartsolutions.com',
        industry: query.term.includes('SaaS') ? 'SaaS' : 'Technology',
        estimatedSize: '15-25',
        location: 'San Francisco, CA',
        description: 'Cloud-based business solutions for small enterprises'
      },
      {
        name: 'GrowthCo Marketing',
        website: 'https://growthcomarketing.com',
        domain: 'growthcomarketing.com',
        industry: 'Marketing Services',
        estimatedSize: '5-15',
        location: 'Austin, TX',
        description: 'Digital marketing agency for B2B companies'
      },
      // Add more simulated companies...
    ]

    return simulatedCompanies.slice(0, limit)
  } catch (error) {
    console.error('Error finding companies:', error)
    return []
  }
}

async function analyzeCompanyOpportunity(company, industry, scraper) {
  try {
    // Scrape and analyze company website
    const websiteAnalysis = await scraper.analyzeWebsite(company.website)
    
    // AI analysis of marketing opportunities
    const opportunityAnalysis = await analyzeMarketingOpportunities(
      company, 
      websiteAnalysis, 
      industry
    )

    return {
      ...opportunityAnalysis,
      websiteData: websiteAnalysis
    }
  } catch (error) {
    console.error(`Error analyzing opportunity for ${company.name}:`, error)
    return null
  }
}

async function analyzeMarketingOpportunities(company, websiteData, industry) {
  try {
    const prompt = `
Analyze this company for marketing and advertising opportunities:

Company: ${company.name}
Industry: ${industry}
Website: ${company.website}
Description: ${company.description}

Website Analysis:
- Page Speed: ${websiteData.pageSpeed || 'Unknown'}
- SEO Score: ${websiteData.seoScore || 'Unknown'}
- Mobile Friendly: ${websiteData.mobileFriendly || 'Unknown'}
- Has Analytics: ${websiteData.hasAnalytics || 'Unknown'}
- Has Marketing Pixels: ${websiteData.hasMarketingPixels || 'Unknown'}
- Social Media Links: ${websiteData.socialLinks?.length || 0}
- Blog/Content: ${websiteData.hasBlog || 'Unknown'}
- Lead Magnets: ${websiteData.hasLeadMagnets || 'Unknown'}

As a paid advertising and email marketing expert, evaluate:

1. OPPORTUNITY SCORE (0-100): Overall marketing opportunity rating
2. PAIN POINTS: Specific marketing problems identified
3. ESTIMATED VALUE: Potential monthly ad spend and service value
4. MARKETING ISSUES: Technical and strategic problems found
5. RECOMMENDATIONS: Specific services they need
6. URGENCY: How urgently they need marketing help (low/medium/high)

Focus on issues that Muhammad Saim's services can solve:
- Paid advertising setup and optimization
- Email marketing automation
- Campaign auditing and strategy
- Remarketing and retargeting
- Competitive analysis
- Conversion optimization

Return as JSON:
{
  "opportunityScore": 0,
  "estimatedValue": 0,
  "painPoints": [],
  "marketingIssues": [],
  "recommendations": [],
  "urgency": "",
  "adSpendEstimate": 0,
  "competitors": [],
  "techStack": [],
  "socialPresence": {}
}
`

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1000,
      temperature: 0.3
    })

    return JSON.parse(response.choices[0].message.content)
  } catch (error) {
    console.error('Error analyzing marketing opportunities:', error)
    return {
      opportunityScore: 50,
      estimatedValue: 1000,
      painPoints: ['Unknown marketing setup'],
      marketingIssues: ['Needs marketing audit'],
      recommendations: ['Comprehensive marketing review'],
      urgency: 'medium',
      adSpendEstimate: 500,
      competitors: [],
      techStack: [],
      socialPresence: {}
    }
  }
}

async function findDecisionMakers(company, targetRoles, scraper) {
  try {
    // This would integrate with:
    // 1. LinkedIn Sales Navigator
    // 2. ZoomInfo API
    // 3. Clearbit API
    // 4. Company website scraping
    // 5. Email finding services (Hunter.io, etc.)
    
    // For now, simulate contact discovery
    const simulatedContacts = [
      {
        name: 'John Smith',
        title: 'CEO',
        email: 'john@' + company.domain,
        linkedin: 'https://linkedin.com/in/johnsmith',
        department: 'Executive'
      },
      {
        name: 'Sarah Johnson',
        title: 'Marketing Director',
        email: 'sarah@' + company.domain,
        linkedin: 'https://linkedin.com/in/sarahjohnson',
        department: 'Marketing'
      }
    ]

    return simulatedContacts.filter(contact => 
      targetRoles.some(role => contact.title.includes(role))
    )
  } catch (error) {
    console.error(`Error finding decision makers for ${company.name}:`, error)
    return []
  }
}

function generateLeadId() {
  return 'lead_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
}

async function updateDiscoveryStats(db, industry, results) {
  try {
    const stats = {
      industry,
      timestamp: new Date(),
      companiesAnalyzed: results.companiesAnalyzed,
      leadsDiscovered: results.totalOpportunities,
      averageOpportunityScore: results.leads.length > 0 
        ? results.leads.reduce((sum, lead) => sum + lead.opportunity.score, 0) / results.leads.length 
        : 0,
      topOpportunities: results.leads.slice(0, 10).map(lead => ({
        company: lead.company.name,
        score: lead.opportunity.score,
        value: lead.opportunity.potentialValue
      }))
    }

    await db.collection('discovery_stats').insertOne(stats)
  } catch (error) {
    console.error('Error updating discovery stats:', error)
  }
}