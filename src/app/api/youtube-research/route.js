import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { openai } from '@/lib/ai'
import { YoutubeResearcher } from '@/lib/youtube'

export async function POST(request) {
  try {
    const { industry, depth = 'standard', useCache = true } = await request.json()

    if (!industry) {
      return NextResponse.json(
        { error: 'Industry is required' },
        { status: 400 }
      )
    }

    const db = await connectDB()
    const researcher = new YoutubeResearcher()

    // Check if we have recent cached research (within 24 hours)
    if (useCache) {
      const cached = await db.collection('research').findOne({
        industry: { $regex: new RegExp(`^${industry}$`, 'i') },
        timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      })
      
      if (cached) {
        console.log(`✅ Using cached research for ${industry}`)
        return NextResponse.json({
          success: true,
          data: cached,
          fromCache: true,
          message: `Using cached research for ${industry}. Found ${cached.insights?.length || 0} insights.`
        })
      }
    }

    console.log(`🔍 Starting fresh research for ${industry}...`)

    // Define search queries based on industry
    const searchQueries = [
      `${industry} marketing strategies`,
      `${industry} paid advertising tips`,
      `${industry} email marketing best practices`,
      `sales psychology for ${industry}`,
      `outreach techniques for ${industry}`,
      `customer acquisition for ${industry}`
    ]

    const researchResults = {
      industry,
      timestamp: new Date(),
      insights: [],
      strategies: [],
      painPoints: [],
      approaches: [],
      videosSources: [],
      transcriptionStats: {
        attempted: 0,
        successful: 0,
        cached: 0,
        methods: {}
      }
    }

    // Process each search query
    for (const query of searchQueries) {
      try {
        console.log(`Researching: ${query}`)
        
        // Search YouTube for videos
        const videos = await researcher.searchVideos(query, 15)
        
        if (videos.length === 0) {
          console.log(`No videos found for query: ${query}`)
          continue
        }

        // Process top videos
        for (const video of videos.slice(0, depth === 'deep' ? 15 : 10)) {
          try {
            researchResults.transcriptionStats.attempted++
            
            // Get video transcript with caching
            const transcriptResult = await researcher.getTranscript(video.id, {
              useCache: true,
              minLength: 100
            })
            
            if (!transcriptResult.transcript) {
              console.log(`No transcript available for video: ${video.title}`)
              continue
            }

            // Track transcript stats
            researchResults.transcriptionStats.successful++
            if (transcriptResult.fromCache) {
              researchResults.transcriptionStats.cached++
            }
            
            const method = transcriptResult.method || 'unknown'
            researchResults.transcriptionStats.methods[method] = 
              (researchResults.transcriptionStats.methods[method] || 0) + 1

            console.log(`📝 Got transcript for "${video.title}" via ${method} (${transcriptResult.fromCache ? 'cached' : 'fresh'})`)

            // Analyze transcript with AI
            const analysis = await analyzeVideoContent(transcriptResult.transcript, industry, video)
            
            if (analysis) {
              researchResults.insights.push(...analysis.insights)
              researchResults.strategies.push(...analysis.strategies)
              researchResults.painPoints.push(...analysis.painPoints)
              researchResults.approaches.push(...analysis.approaches)
              
              researchResults.videosSources.push({
                id: video.id,
                title: video.title,
                channel: video.channelTitle,
                url: `https://youtube.com/watch?v=${video.id}`,
                relevanceScore: analysis.relevanceScore,
                keyInsights: analysis.insights.slice(0, 3),
                transcriptMethod: method,
                transcriptCached: transcriptResult.fromCache
              })
            }
          } catch (videoError) {
            console.error(`Error processing video ${video.id}:`, videoError)
            continue
          }
        }
      } catch (queryError) {
        console.error(`Error processing query "${query}":`, queryError)
        continue
      }
    }

    // Calculate success rate
    researchResults.transcriptionStats.successRate = researchResults.transcriptionStats.attempted > 0 
      ? Math.round((researchResults.transcriptionStats.successful / researchResults.transcriptionStats.attempted) * 100)
      : 0

    console.log(`📊 Transcription Stats: ${researchResults.transcriptionStats.successful}/${researchResults.transcriptionStats.attempted} successful (${researchResults.transcriptionStats.successRate}%), ${researchResults.transcriptionStats.cached} from cache`)

    // Remove duplicates and rank insights
    researchResults.insights = removeDuplicateInsights(researchResults.insights)
    researchResults.strategies = removeDuplicateStrategies(researchResults.strategies)
    researchResults.painPoints = removeDuplicatePainPoints(researchResults.painPoints)

    // Generate AI summary and recommendations
    const aiSummary = await generateResearchSummary(researchResults, industry)
    researchResults.aiSummary = aiSummary

    // Save to database
    await db.collection('research').insertOne(researchResults)

    // Update industry knowledge base
    await updateIndustryKnowledge(db, industry, researchResults)

    return NextResponse.json({
      success: true,
      data: researchResults,
      fromCache: false,
      message: `Research completed for ${industry}. Found ${researchResults.insights.length} insights from ${researchResults.videosSources.length} videos. Transcription success rate: ${researchResults.transcriptionStats.successRate}%`
    })

  } catch (error) {
    console.error('YouTube research error:', error)
    return NextResponse.json(
      { error: 'Failed to complete research', details: error.message },
      { status: 500 }
    )
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const industry = searchParams.get('industry')
    const limit = parseInt(searchParams.get('limit')) || 10
    const includeStats = searchParams.get('stats') === 'true'

    const db = await connectDB()
    
    let query = {}
    if (industry) {
      query.industry = { $regex: industry, $options: 'i' }
    }

    const research = await db.collection('research')
      .find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray()

    const response = {
      success: true,
      data: research
    }

    // Include cache stats if requested
    if (includeStats) {
      const cacheStats = await db.collection('youtube_transcripts').aggregate([
        {
          $group: {
            _id: null,
            totalCached: { $sum: 1 },
            totalLength: { $sum: '$length' },
            methods: { $addToSet: '$method' },
            avgLength: { $avg: '$length' }
          }
        }
      ]).toArray()

      response.cacheStats = cacheStats[0] || { 
        totalCached: 0, 
        totalLength: 0, 
        methods: [], 
        avgLength: 0 
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error fetching research:', error)
    return NextResponse.json(
      { error: 'Failed to fetch research data' },
      { status: 500 }
    )
  }
}

// Cache management endpoints
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const videoId = searchParams.get('videoId')
    const industry = searchParams.get('industry')
    
    const db = await connectDB()
    
    if (videoId) {
      // Delete specific transcript cache
      const result = await db.collection('youtube_transcripts').deleteOne({ videoId })
      return NextResponse.json({
        success: true,
        message: `Deleted cache for video ${videoId}`,
        deleted: result.deletedCount > 0
      })
    }
    
    if (industry) {
      // Delete research cache for industry
      const result = await db.collection('research').deleteMany({ 
        industry: { $regex: new RegExp(`^${industry}$`, 'i') }
      })
      return NextResponse.json({
        success: true,
        message: `Deleted ${result.deletedCount} research entries for ${industry}`
      })
    }
    
    return NextResponse.json(
      { error: 'videoId or industry parameter required' },
      { status: 400 }
    )
    
  } catch (error) {
    console.error('Error deleting cache:', error)
    return NextResponse.json(
      { error: 'Failed to delete cache' },
      { status: 500 }
    )
  }
}

async function analyzeVideoContent(transcript, industry, videoMetadata) {
  try {
    const prompt = `
Analyze this YouTube video transcript for marketing insights relevant to the ${industry} industry.

Video Title: ${videoMetadata.title}
Channel: ${videoMetadata.channelTitle}

Transcript: ${transcript.substring(0, 8000)} // Limit for API

Extract and categorize the following:

1. MARKETING INSIGHTS: Specific actionable marketing tactics or strategies mentioned
2. INDUSTRY STRATEGIES: Approaches specifically for ${industry} businesses
3. PAIN POINTS: Problems or challenges mentioned that ${industry} companies face
4. OUTREACH APPROACHES: Sales/outreach techniques that could work for ${industry}

For each item, provide:
- The insight/strategy/pain point
- Why it's relevant to ${industry}
- How it could be applied in outreach messages
- Confidence score (1-10)

Focus on psychology-based approaches, conversion optimization, and persuasion techniques.

Return as JSON with this structure:
{
  "insights": [{"text": "", "relevance": "", "application": "", "confidence": 0}],
  "strategies": [{"text": "", "relevance": "", "application": "", "confidence": 0}],
  "painPoints": [{"text": "", "relevance": "", "application": "", "confidence": 0}],
  "approaches": [{"text": "", "relevance": "", "application": "", "confidence": 0}],
  "relevanceScore": 0
}
`

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1500,
      temperature: 0.3
    })

    const analysis = JSON.parse(response.choices[0].message.content)
    
    // Filter by confidence score
    analysis.insights = analysis.insights.filter(item => item.confidence >= 6)
    analysis.strategies = analysis.strategies.filter(item => item.confidence >= 6)
    analysis.painPoints = analysis.painPoints.filter(item => item.confidence >= 6)
    analysis.approaches = analysis.approaches.filter(item => item.confidence >= 6)

    return analysis
  } catch (error) {
    console.error('Error analyzing video content:', error)
    return null
  }
}

async function generateResearchSummary(researchResults, industry) {
  try {
    const prompt = `
Based on the following research data for the ${industry} industry, generate a comprehensive summary and actionable recommendations for cold outreach and lead generation.

Research Data:
- Insights: ${researchResults.insights.length} insights discovered
- Strategies: ${researchResults.strategies.length} strategies identified  
- Pain Points: ${researchResults.painPoints.length} pain points found
- Videos Analyzed: ${researchResults.videosSources.length} sources
- Transcription Success: ${researchResults.transcriptionStats.successRate}%

Top Insights: ${researchResults.insights.slice(0, 10).map(i => i.text).join('; ')}
Top Pain Points: ${researchResults.painPoints.slice(0, 10).map(p => p.text).join('; ')}

Generate:
1. INDUSTRY OVERVIEW: Key characteristics and challenges in ${industry}
2. OUTREACH STRATEGY: Best approaches for reaching ${industry} prospects
3. MESSAGE TEMPLATES: 3 different message frameworks optimized for this industry
4. PSYCHOLOGY INSIGHTS: Psychological triggers that work best for ${industry}
5. TIMING & FREQUENCY: Optimal outreach timing and follow-up sequences
6. VALUE PROPOSITIONS: What resonates most with ${industry} decision makers

Make it actionable and specific to paid advertising and email marketing services.
`

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 2000,
      temperature: 0.4
    })

    return response.choices[0].message.content
  } catch (error) {
    console.error('Error generating research summary:', error)
    return "Summary generation failed. Please review individual insights."
  }
}

function removeDuplicateInsights(insights) {
  const seen = new Set()
  return insights.filter(insight => {
    const key = insight.text.toLowerCase().substring(0, 50)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  }).sort((a, b) => b.confidence - a.confidence)
}

function removeDuplicateStrategies(strategies) {
  const seen = new Set()
  return strategies.filter(strategy => {
    const key = strategy.text.toLowerCase().substring(0, 50)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  }).sort((a, b) => b.confidence - a.confidence)
}

function removeDuplicatePainPoints(painPoints) {
  const seen = new Set()
  return painPoints.filter(pain => {
    const key = pain.text.toLowerCase().substring(0, 50)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  }).sort((a, b) => b.confidence - a.confidence)
}

async function updateIndustryKnowledge(db, industry, researchResults) {
  try {
    const knowledgeBase = {
      industry,
      lastUpdated: new Date(),
      totalInsights: researchResults.insights.length,
      totalStrategies: researchResults.strategies.length,
      totalPainPoints: researchResults.painPoints.length,
      topInsights: researchResults.insights.slice(0, 20),
      topStrategies: researchResults.strategies.slice(0, 15),
      topPainPoints: researchResults.painPoints.slice(0, 15),
      researchSummary: researchResults.aiSummary,
      transcriptionStats: researchResults.transcriptionStats
    }

    await db.collection('industry_knowledge').replaceOne(
      { industry },
      knowledgeBase,
      { upsert: true }
    )
  } catch (error) {
    console.error('Error updating industry knowledge:', error)
  }
}