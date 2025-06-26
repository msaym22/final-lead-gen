import axios from 'axios'
import { YoutubeTranscript } from 'youtube-transcript'

export class YoutubeResearcher {
  constructor() {
    this.apiKey = process.env.YOUTUBE_API_KEY || process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
    if (!this.apiKey) {
      console.warn('⚠️ YouTube API key not configured');
      // Don't throw error immediately - allow for testing
    }
    this.baseUrl = 'https://www.googleapis.com/youtube/v3';
    
    // Enhanced transcription service configurations
    this.transcriptionServices = {
      assemblyai: {
        apiKey: process.env.ASSEMBLYAI_API_KEY,
        baseUrl: 'https://api.assemblyai.com/v2',
        enabled: !!process.env.ASSEMBLYAI_API_KEY
      },
      deepgram: {
        apiKey: process.env.DEEPGRAM_API_KEY,
        baseUrl: 'https://api.deepgram.com/v1',
        enabled: !!process.env.DEEPGRAM_API_KEY
      },
      whisperapi: {
        apiKey: process.env.WHISPER_API_KEY || process.env.OPENAI_API_KEY,
        baseUrl: 'https://api.openai.com/v1',
        enabled: !!(process.env.WHISPER_API_KEY || process.env.OPENAI_API_KEY)
      },
      youtubeCaption: {
        enabled: true // Always try YouTube's built-in captions first
      }
    }
  }

  // FIXED: More permissive search method
  async searchVideos(query, maxResults = 15) {
    try {
      if (!this.apiKey) {
        throw new Error('YouTube API key not configured. Please add YOUTUBE_API_KEY to your .env.local file.')
      }

      console.log(`🔍 Searching YouTube for: "${query}"`)
      console.log(`🔑 API Key exists: ${!!this.apiKey}`)
      
      // Start with basic search parameters (removed restrictive filters)
      const searchParams = {
        key: this.apiKey,
        q: query,
        part: 'snippet',
        type: 'video',
        maxResults,
        order: 'relevance'
        // Removed: publishedAfter, videoDuration, videoDefinition - these were too restrictive
      }
      
      console.log(`📡 Search URL: ${this.baseUrl}/search`)
      console.log(`📋 Search params:`, { ...searchParams, key: '***' }) // Hide API key in logs
      
      const response = await axios.get(`${this.baseUrl}/search`, {
        params: searchParams,
        timeout: 15000 // 15 second timeout
      })

      console.log(`✅ API Response status: ${response.status}`)
      console.log(`📊 Found ${response.data.items?.length || 0} videos`)
      
      if (!response.data.items || response.data.items.length === 0) {
        console.warn(`⚠️ No videos found for query: "${query}"`)
        
        // Try a simplified query if no results
        if (query.includes(' ')) {
          const simpleQuery = query.split(' ')[0] // Use just first word
          console.log(`🔄 Retrying with simplified query: "${simpleQuery}"`)
          
          const retryResponse = await axios.get(`${this.baseUrl}/search`, {
            params: {
              ...searchParams,
              q: simpleQuery
            },
            timeout: 15000
          })
          
          if (retryResponse.data.items?.length > 0) {
            console.log(`✅ Simplified search found ${retryResponse.data.items.length} videos`)
            return this.formatVideoResults(retryResponse.data.items)
          }
        }
        
        return []
      }

      return this.formatVideoResults(response.data.items)
      
    } catch (error) {
      console.error(`❌ YouTube search error for "${query}":`, error)
      
      if (error.response) {
        console.error(`API Error Status: ${error.response.status}`)
        console.error(`API Error Data:`, error.response.data)
        
        // Check for specific API errors
        if (error.response.status === 403) {
          const errorMessage = error.response.data?.error?.message || 'Unknown API error'
          if (errorMessage.includes('quota')) {
            throw new Error('YouTube API quota exceeded. Try again tomorrow or upgrade your quota.')
          } else if (errorMessage.includes('key')) {
            throw new Error('Invalid YouTube API key. Please check your API key in .env.local')
          } else {
            throw new Error(`YouTube API access denied: ${errorMessage}`)
          }
        } else if (error.response.status === 400) {
          throw new Error(`Invalid search query parameters: ${error.response.data?.error?.message || 'Bad request'}`)
        }
      }
      
      throw new Error(`YouTube search failed: ${error.message}`)
    }
  }

  // Helper method to format video results
  formatVideoResults(items) {
    return items.map(item => ({
      id: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
      thumbnails: item.snippet.thumbnails
    }))
  }

  // ADDED: Simple connection test method
  async testYouTubeConnection() {
    try {
      console.log('🧪 Testing YouTube API connection...')
      
      if (!this.apiKey) {
        return {
          success: false,
          error: 'No API key configured',
          message: 'YouTube API key missing. Add YOUTUBE_API_KEY to .env.local'
        }
      }
      
      const testResults = await this.searchVideos('marketing', 5)
      
      return {
        success: true,
        videosFound: testResults.length,
        message: `YouTube API working! Found ${testResults.length} videos for test query.`,
        sampleTitles: testResults.slice(0, 3).map(v => v.title),
        apiKeyLength: this.apiKey.length
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'YouTube API test failed',
        apiKeyExists: !!this.apiKey
      }
    }
  }

  async getVideoDetails(videoId) {
    try {
      if (!this.apiKey) {
        throw new Error('YouTube API key not configured')
      }

      const response = await axios.get(`${this.baseUrl}/videos`, {
        params: {
          key: this.apiKey,
          id: videoId,
          part: 'snippet,statistics,contentDetails'
        },
        timeout: 10000
      })

      if (response.data.items.length === 0) {
        throw new Error('Video not found')
      }

      const video = response.data.items[0]
      return {
        id: videoId,
        title: video.snippet.title,
        description: video.snippet.description,
        channelTitle: video.snippet.channelTitle,
        publishedAt: video.snippet.publishedAt,
        duration: video.contentDetails.duration,
        viewCount: parseInt(video.statistics.viewCount),
        likeCount: parseInt(video.statistics.likeCount || 0),
        commentCount: parseInt(video.statistics.commentCount || 0),
        tags: video.snippet.tags || []
      }
    } catch (error) {
      console.error('Error fetching video details:', error)
      throw new Error(`Failed to get video details: ${error.message}`)
    }
  }

  // Enhanced transcript fetching with multiple fallback options
  async getTranscript(videoId, options = {}) {
    const { 
      preferredService = 'auto',
      includeSpeakerLabels = false,
      includeTimestamps = false,
      fallbackToAudio = true,
      minLength = 50,
      useCache = true
    } = options

    // Check cache first if enabled
    if (useCache) {
      const cached = await this.getCachedTranscript(videoId)
      if (cached) {
        console.log(`✅ Using cached transcript for ${videoId}`)
        return {
          videoId,
          transcript: cached,
          method: 'cached',
          processingTime: 0,
          fromCache: true
        }
      }
    }

    console.log(`🎬 Getting fresh transcript for video: ${videoId}`)

    const results = {
      videoId,
      transcript: null,
      method: null,
      metadata: {},
      processingTime: Date.now(),
      fromCache: false
    }

    // Try methods in order of preference and availability
    const methods = this.getTranscriptionMethods(preferredService)
    
    for (const method of methods) {
      try {
        console.log(`📝 Trying ${method} for video ${videoId}...`)
        
        const transcript = await this.tryTranscriptionMethod(videoId, method, options)
        
        if (transcript && transcript.length >= minLength) {
          results.transcript = transcript
          results.method = method
          results.processingTime = Date.now() - results.processingTime
          
          console.log(`✅ Success with ${method}: ${transcript.length} characters`)
          
          // Cache successful results
          if (useCache) {
            await this.cacheTranscript(videoId, transcript, method)
          }
          
          return results
        }
      } catch (error) {
        console.log(`❌ ${method} failed for ${videoId}: ${error.message}`)
        continue
      }
    }

    console.log(`❌ All transcription methods failed for video ${videoId}`)
    return results
  }

  getTranscriptionMethods(preferredService) {
    if (preferredService !== 'auto') {
      return [preferredService]
    }

    const methods = []
    
    // Always try YouTube captions first (free and fast)
    methods.push('youtube')
    
    // Add alternative free methods
    methods.push('youtube-alt', 'transcript-api')
    
    // Add paid services in order of preference
    if (this.transcriptionServices.assemblyai.enabled) methods.push('assemblyai')
    if (this.transcriptionServices.deepgram.enabled) methods.push('deepgram')
    if (this.transcriptionServices.whisperapi.enabled) methods.push('whisperapi')
    
    return methods
  }

  async tryTranscriptionMethod(videoId, method, options) {
    switch (method) {
      case 'youtube':
        return await this.getYouTubeTranscript(videoId)
      
      case 'youtube-alt':
        return await this.getYouTubeTranscriptAlt(videoId)
      
      case 'transcript-api':
        return await this.getTranscriptAPI(videoId)
      
      case 'assemblyai':
        return await this.getAssemblyAITranscript(videoId, options)
      
      case 'deepgram':
        return await this.getDeepgramTranscript(videoId, options)
      
      case 'whisperapi':
        return await this.getWhisperAPITranscript(videoId, options)
      
      default:
        throw new Error(`Unknown transcription method: ${method}`)
    }
  }

  async getCachedTranscript(videoId) {
    try {
      const response = await fetch(`/api/youtube-research/transcript/${videoId}`)
      if (response.ok) {
        const data = await response.json()
        return data.transcript
      }
    } catch (error) {
      console.log('Cache fetch failed:', error)
    }
    return null
  }

  async cacheTranscript(videoId, transcript, method) {
    try {
      await fetch('/api/youtube-research/cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId,
          transcript,
          method,
          length: transcript.length,
          cachedAt: new Date()
        })
      })
      console.log(`💾 Cached transcript for ${videoId} using ${method}`)
    } catch (error) {
      console.log('Cache save failed:', error)
    }
  }

  // Method 1: Original YouTube Transcript (Free)
  async getYouTubeTranscript(videoId) {
    try {
      const transcript = await YoutubeTranscript.fetchTranscript(videoId)
      
      if (!transcript || transcript.length === 0) {
        throw new Error('No transcript available')
      }

      return transcript
        .map(item => item.text)
        .join(' ')
        .replace(/\[.*?\]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
    } catch (error) {
      throw new Error(`YouTube transcript failed: ${error.message}`)
    }
  }

  // Method 2: Alternative YouTube transcript method
  async getYouTubeTranscriptAlt(videoId) {
    try {
      // Alternative approach using different parameters
      const transcript = await YoutubeTranscript.fetchTranscript(videoId, {
        lang: 'en',
        country: 'US'
      })
      
      if (!transcript || transcript.length === 0) {
        // Try with auto-generated captions
        const autoTranscript = await YoutubeTranscript.fetchTranscript(videoId, {
          lang: 'en-US'
        })
        
        if (!autoTranscript || autoTranscript.length === 0) {
          throw new Error('No auto-generated transcript available')
        }
        
        return autoTranscript
          .map(item => item.text)
          .join(' ')
          .replace(/\[.*?\]/g, '')
          .replace(/\s+/g, ' ')
          .trim()
      }

      return transcript
        .map(item => item.text)
        .join(' ')
        .replace(/\[.*?\]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
    } catch (error) {
      throw new Error(`YouTube alt transcript failed: ${error.message}`)
    }
  }

  // Method 3: Free transcript API services
  async getTranscriptAPI(videoId) {
    const freeAPIs = [
      // Free service 1
      {
        url: `https://youtube-transcript-api.vercel.app/api/transcript?videoId=${videoId}`,
        parser: (data) => {
          if (data.transcript && Array.isArray(data.transcript)) {
            return data.transcript.map(item => item.text || item).join(' ')
          }
          return null
        }
      },
      // Free service 2 - Alternative endpoint
      {
        url: `https://api.youtubetranscript.com/?video_id=${videoId}`,
        parser: (data) => {
          if (data.transcript) {
            return Array.isArray(data.transcript) 
              ? data.transcript.map(item => item.text || item).join(' ')
              : data.transcript
          }
          return null
        }
      }
    ]
    
    for (const api of freeAPIs) {
      try {
        const response = await axios.get(api.url, { 
          timeout: 15000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; TranscriptBot/1.0)'
          }
        })
        
        const transcript = api.parser(response.data)
        
        if (transcript && transcript.length > 50) {
          return transcript.replace(/\s+/g, ' ').trim()
        }
      } catch (error) {
        console.log(`Free API ${api.url} failed:`, error.message)
        continue
      }
    }
    
    throw new Error('All free transcript APIs failed')
  }

  // Enhanced search by industry with better transcript success rate
  async searchByIndustry(industry, options = {}) {
    const {
      depth = 'standard',
      timeRange = '1year',
      minViews = 1000,
      includeChannelInfo = false,
      transcriptionOptions = { preferredService: 'auto', fallbackToAudio: true },
      minTranscriptLength = 200,
      maxRetries = 2
    } = options

    console.log(`🔍 Enhanced search for ${industry}...`)

    const searchTerms = this.generateSearchTerms(industry)
    const videoLimit = depth === 'quick' ? 5 : depth === 'standard' ? 10 : 15

    const results = {
      industry,
      searchTerms,
      videos: [],
      channels: new Set(),
      totalVideosFound: 0,
      transcriptionStats: {
        attempted: 0,
        successful: 0,
        byMethod: {},
        averageLength: 0,
        failureReasons: [],
        successRate: 0
      },
      processingStats: {
        videosWithTranscripts: 0,
        videosProcessed: 0,
        errors: 0,
        totalProcessingTime: 0
      }
    }

    for (const term of searchTerms) {
      try {
        const videos = await this.searchVideos(term, videoLimit)
        
        for (const video of videos) {
          const startTime = Date.now()
          
          try {
            // Get detailed video info
            const details = await this.getVideoDetails(video.id)
            
            // Filter by view count
            if (details.viewCount < minViews) continue
            
            // Try to get transcript with enhanced method
            results.transcriptionStats.attempted++
            
            const transcriptResult = await this.getTranscript(video.id, transcriptionOptions)
            
            if (transcriptResult.transcript && transcriptResult.transcript.length >= minTranscriptLength) {
              results.transcriptionStats.successful++
              results.processingStats.videosWithTranscripts++
              
              // Track method success
              const method = transcriptResult.method
              results.transcriptionStats.byMethod[method] = (results.transcriptionStats.byMethod[method] || 0) + 1
              
              const videoData = {
                ...details,
                transcript: transcriptResult.transcript,
                transcriptionMethod: method,
                transcriptionMetadata: transcriptResult.metadata,
                searchTerm: term,
                relevanceScore: this.calculateRelevanceScore(details, industry),
                transcriptLength: transcriptResult.transcript.length
              }

              results.videos.push(videoData)
              results.channels.add(details.channelTitle)
              results.transcriptionStats.averageLength += transcriptResult.transcript.length
              
              console.log(`✅ Successfully processed ${video.id} with ${method}`)
            } else {
              results.transcriptionStats.failureReasons.push({
                videoId: video.id,
                reason: 'No transcript or too short',
                title: details.title
              })
            }
            
            results.processingStats.videosProcessed++
            results.processingStats.totalProcessingTime += Date.now() - startTime
            
          } catch (videoError) {
            results.processingStats.errors++
            results.transcriptionStats.failureReasons.push({
              videoId: video.id,
              reason: videoError.message,
              title: video.title
            })
            console.error(`❌ Error processing video ${video.id}:`, videoError.message)
          }
        }
        
        results.totalVideosFound += videos.length
        
        // Rate limiting - wait between searches
        await this.sleep(1000)
      } catch (searchError) {
        results.processingStats.errors++
        console.error(`❌ Error searching for term "${term}":`, searchError)
      }
    }

    // Calculate final stats
    if (results.transcriptionStats.successful > 0) {
      results.transcriptionStats.averageLength = Math.round(
        results.transcriptionStats.averageLength / results.transcriptionStats.successful
      )
    }

    results.transcriptionStats.successRate = results.transcriptionStats.attempted > 0
      ? Math.round((results.transcriptionStats.successful / results.transcriptionStats.attempted) * 100)
      : 0

    // Sort videos by relevance score
    results.videos.sort((a, b) => b.relevanceScore - a.relevanceScore)
    
    // Convert channels Set to Array
    results.channels = Array.from(results.channels)

    console.log(`🎯 Enhanced search complete: ${results.transcriptionStats.successful}/${results.transcriptionStats.attempted} transcripts (${results.transcriptionStats.successRate}%)`)

    return results
  }

  generateSearchTerms(industry) {
    const baseTerms = [
      `${industry} marketing strategies`,
      `${industry} paid advertising`,
      `${industry} email marketing`,
      `${industry} customer acquisition`,
      `${industry} sales funnel`,
      `${industry} conversion optimization`,
      `${industry} lead generation`,
      `${industry} digital marketing`,
      `${industry} growth hacking`,
      `${industry} marketing automation`
    ]

    // Add psychology and sales terms
    const psychologyTerms = [
      `sales psychology ${industry}`,
      `persuasion techniques ${industry}`,
      `consumer behavior ${industry}`,
      `buying psychology ${industry}`
    ]

    // Add competitor and case study terms
    const caseStudyTerms = [
      `${industry} marketing case study`,
      `${industry} success story marketing`,
      `${industry} marketing results`,
      `${industry} ROI marketing`
    ]

    return [...baseTerms, ...psychologyTerms, ...caseStudyTerms]
  }

  calculateRelevanceScore(video, industry) {
    let score = 0
    
    // Title relevance
    const titleLower = video.title.toLowerCase()
    const industryLower = industry.toLowerCase()
    
    if (titleLower.includes(industryLower)) score += 20
    if (titleLower.includes('marketing')) score += 15
    if (titleLower.includes('strategy')) score += 10
    if (titleLower.includes('case study')) score += 15
    if (titleLower.includes('results')) score += 10
    
    // Description relevance
    const descLower = video.description.toLowerCase()
    if (descLower.includes(industryLower)) score += 10
    if (descLower.includes('marketing')) score += 5
    
    // Engagement metrics (normalized)
    const engagementRatio = (video.likeCount + video.commentCount) / video.viewCount
    score += Math.min(engagementRatio * 1000, 20) // Cap at 20 points
    
    // View count (logarithmic scale)
    score += Math.min(Math.log10(video.viewCount) * 5, 25) // Cap at 25 points
    
    // Recency bonus (videos from last 6 months get bonus)
    const monthsOld = (Date.now() - new Date(video.publishedAt).getTime()) / (1000 * 60 * 60 * 24 * 30)
    if (monthsOld < 6) score += 10
    
    return Math.round(score)
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Validate API connection
  async validateConnection() {
    try {
      if (!this.apiKey) {
        return {
          success: false,
          error: 'No API key configured',
          message: 'YouTube API key missing'
        }
      }

      const response = await axios.get(`${this.baseUrl}/search`, {
        params: {
          key: this.apiKey,
          q: 'marketing',
          part: 'snippet',
          type: 'video',
          maxResults: 1
        },
        timeout: 10000
      })

      return {
        success: true,
        quotaUsed: response.headers['x-ratelimit-remaining'] ? 
          100 - parseInt(response.headers['x-ratelimit-remaining']) : 'unknown',
        message: 'YouTube API connection successful'
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'YouTube API connection failed'
      }
    }
  }

  // Get quota usage info
  getQuotaInfo() {
    return {
      searchCost: 100, // Search costs 100 quota units
      videoCost: 1,    // Video details cost 1 quota unit
      dailyLimit: 10000, // Default daily quota
      recommendations: [
        'Use search sparingly - each search costs 100 units',
        'Cache results to avoid repeated API calls',
        'Consider running research during off-peak hours',
        'Monitor quota usage in Google Cloud Console'
      ]
    }
  }

  // ADDED: Comprehensive debug method
  async debugYouTubeSetup() {
    console.log('🔍 YouTube Setup Debug Report')
    console.log('============================')
    
    const report = {
      timestamp: new Date().toISOString(),
      apiKey: {
        exists: !!this.apiKey,
        length: this.apiKey?.length || 0,
        prefix: this.apiKey?.substring(0, 6) || 'N/A',
        isValid: this.apiKey?.startsWith('AIza') || false
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasYoutubeKey: !!process.env.YOUTUBE_API_KEY,
        hasPublicYoutubeKey: !!process.env.NEXT_PUBLIC_YOUTUBE_API_KEY
      },
      tests: {}
    }

    // Test 1: API Key validation
    console.log('🔑 Testing API Key...')
    if (!this.apiKey) {
      report.tests.apiKey = { success: false, error: 'No API key found' }
    } else if (!this.apiKey.startsWith('AIza')) {
      report.tests.apiKey = { success: false, error: 'Invalid API key format (should start with AIza)' }
    } else {
      report.tests.apiKey = { success: true, message: 'API key format looks correct' }
    }

    // Test 2: Simple search
    console.log('🔍 Testing search functionality...')
    try {
      const searchResult = await this.testYouTubeConnection()
      report.tests.search = searchResult
    } catch (error) {
      report.tests.search = { success: false, error: error.message }
    }

    // Test 3: Direct API call
    console.log('📡 Testing direct API call...')
    try {
      const response = await fetch(`${this.baseUrl}/search?part=snippet&q=test&type=video&maxResults=1&key=${this.apiKey}`)
      const data = await response.json()
      
      if (response.ok) {
        report.tests.directAPI = { 
          success: true, 
          itemsFound: data.items?.length || 0,
          message: 'Direct API call successful'
        }
      } else {
        report.tests.directAPI = { 
          success: false, 
          error: data.error?.message || 'Unknown API error',
          status: response.status
        }
      }
    } catch (error) {
      report.tests.directAPI = { success: false, error: error.message }
    }

    console.log('📋 Debug Report:', report)
    return report
  }

  // Method 4: AssemblyAI (Free tier: 3 hours/month)
  async getAssemblyAITranscript(videoId, options = {}) {
    if (!this.transcriptionServices.assemblyai.enabled) {
      throw new Error('AssemblyAI not configured')
    }

    try {
      // Get the audio URL using youtube-dl info
      const audioUrl = await this.getVideoAudioURL(videoId)
      
      // Submit for transcription
      const uploadResponse = await axios.post(
        `${this.transcriptionServices.assemblyai.baseUrl}/transcript`,
        {
          audio_url: audioUrl,
          speaker_labels: options.includeSpeakerLabels,
          auto_chapters: true,
          sentiment_analysis: true,
          entity_detection: true
        },
        {
          headers: {
            'Authorization': this.transcriptionServices.assemblyai.apiKey,
            'Content-Type': 'application/json'
          }
        }
      )

      const transcriptId = uploadResponse.data.id
      
      // Poll for completion
      const transcript = await this.pollAssemblyAI(transcriptId)
      
      return transcript.text
    } catch (error) {
      throw new Error(`AssemblyAI failed: ${error.message}`)
    }
  }

  async pollAssemblyAI(transcriptId, maxAttempts = 60) {
    for (let i = 0; i < maxAttempts; i++) {
      const response = await axios.get(
        `${this.transcriptionServices.assemblyai.baseUrl}/transcript/${transcriptId}`,
        {
          headers: {
            'Authorization': this.transcriptionServices.assemblyai.apiKey
          }
        }
      )

      const { status } = response.data

      if (status === 'completed') {
        return response.data
      } else if (status === 'error') {
        throw new Error('AssemblyAI transcription failed')
      }

      // Wait 5 seconds before next poll
      await this.sleep(5000)
    }

    throw new Error('AssemblyAI transcription timeout')
  }

  // Method 5: Deepgram (Free tier: $200 credit)
  async getDeepgramTranscript(videoId, options = {}) {
    if (!this.transcriptionServices.deepgram.enabled) {
      throw new Error('Deepgram not configured')
    }

    try {
      const audioUrl = await this.getVideoAudioURL(videoId)
      
      const response = await axios.post(
        `${this.transcriptionServices.deepgram.baseUrl}/listen`,
        {
          url: audioUrl
        },
        {
          headers: {
            'Authorization': `Token ${this.transcriptionServices.deepgram.apiKey}`,
            'Content-Type': 'application/json'
          },
          params: {
            punctuate: true,
            utterances: options.includeSpeakerLabels,
            paragraphs: true,
            model: 'nova-2'
          }
        }
      )

      const transcript = response.data.results.channels[0].alternatives[0].transcript
      return transcript
    } catch (error) {
      throw new Error(`Deepgram failed: ${error.message}`)
    }
  }

  // Method 6: OpenAI Whisper API
  async getWhisperAPITranscript(videoId, options = {}) {
    if (!this.transcriptionServices.whisperapi.enabled) {
      throw new Error('Whisper API not configured')
    }

    try {
      // This requires audio extraction - simplified for demo
      const audioUrl = await this.getVideoAudioURL(videoId)
      
      // Download audio first (simplified)
      const audioResponse = await axios.get(audioUrl, { responseType: 'stream' })
      
      const formData = new FormData()
      formData.append('file', audioResponse.data, 'audio.mp3')
      formData.append('model', 'whisper-1')
      formData.append('response_format', 'text')
      
      const response = await axios.post(
        `${this.transcriptionServices.whisperapi.baseUrl}/audio/transcriptions`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${this.transcriptionServices.whisperapi.apiKey}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      )

      return response.data.text || response.data
    } catch (error) {
      throw new Error(`Whisper API failed: ${error.message}`)
    }
  }

  // Helper to get video audio URL (simplified - you may need youtube-dl)
  async getVideoAudioURL(videoId) {
    try {
      // This is a simplified version - in production you'd use youtube-dl or similar
      // For now, we'll use a service that can extract audio URLs
      const response = await axios.post(`https://api.cobalt.tools/api/json`, {
        url: `https://www.youtube.com/watch?v=${videoId}`,
        vQuality: 'max',
        aFormat: 'mp3',
        isAudioOnly: true
      }, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        timeout: 15000
      })
      
      if (response.data && response.data.url) {
        return response.data.url
      }
      
      throw new Error('Could not extract audio URL')
    } catch (error) {
      // Fallback: return YouTube URL (some services can handle this directly)
      return `https://www.youtube.com/watch?v=${videoId}`
    }
  }

  async getChannelInfo(channelId) {
    try {
      if (!this.apiKey) {
        throw new Error('YouTube API key not configured')
      }

      // Get channel's recent videos
      const response = await axios.get(`${this.baseUrl}/channels`, {
        params: {
          key: this.apiKey,
          id: channelId,
          part: 'snippet,statistics'
        },
        timeout: 10000
      })

      if (response.data.items.length === 0) {
        throw new Error('Channel not found')
      }

      const channel = response.data.items[0]
      return {
        id: channelId,
        title: channel.snippet.title,
        description: channel.snippet.description,
        subscriberCount: parseInt(channel.statistics.subscriberCount),
        videoCount: parseInt(channel.statistics.videoCount),
        viewCount: parseInt(channel.statistics.viewCount)
      }
    } catch (error) {
      console.error('Error fetching channel info:', error)
      throw new Error(`Failed to get channel info: ${error.message}`)
    }
  }

  // Method to test all transcription services
  async testTranscriptionServices(testVideoId = 'dQw4w9WgXcQ') {
    console.log('🧪 Testing all transcription services...')
    
    const results = {
      testVideoId,
      serviceResults: {},
      overallSuccess: false,
      recommendations: []
    }

    const methods = ['youtube', 'youtube-alt', 'transcript-api', 'assemblyai', 'deepgram', 'whisperapi']
    
    for (const method of methods) {
      console.log(`Testing ${method}...`)
      
      const startTime = Date.now()
      
      try {
        const transcript = await this.tryTranscriptionMethod(testVideoId, method, {})
        
        results.serviceResults[method] = {
          success: true,
          transcriptLength: transcript ? transcript.length : 0,
          responseTime: Date.now() - startTime,
          preview: transcript ? transcript.substring(0, 100) + '...' : null
        }
        
        if (transcript && transcript.length > 50) {
          results.overallSuccess = true
        }
        
      } catch (error) {
        results.serviceResults[method] = {
          success: false,
          error: error.message,
          responseTime: Date.now() - startTime
        }
      }
    }

    // Generate recommendations
    const workingServices = Object.entries(results.serviceResults)
      .filter(([, result]) => result.success)
      .map(([service]) => service)

    if (workingServices.length === 0) {
      results.recommendations.push('❌ No transcription services are working. Check API keys and network connectivity.')
    } else {
      results.recommendations.push(`✅ Working services: ${workingServices.join(', ')}`)
      
      if (workingServices.includes('youtube') || workingServices.includes('youtube-alt')) {
        results.recommendations.push('💡 YouTube captions are working - this is free and should be your primary method')
      }
      
      if (workingServices.includes('transcript-api')) {
        results.recommendations.push('🆓 Free transcript APIs are working - good fallback option')
      }
      
      const paidServices = workingServices.filter(s => ['assemblyai', 'deepgram', 'whisperapi'].includes(s))
      if (paidServices.length > 0) {
        results.recommendations.push(`💰 Paid services available: ${paidServices.join(', ')} - use for videos without captions`)
      }
    }

    return results
  }

  // Batch processing for large research operations
  async batchResearch(industries, options = {}) {
    const results = {}
    const { 
      concurrency = 2, 
      delayBetweenBatches = 5000,
      saveProgress = true 
    } = options

    console.log(`Starting batch research for ${industries.length} industries`)

    for (let i = 0; i < industries.length; i += concurrency) {
      const batch = industries.slice(i, i + concurrency)
      
      console.log(`Processing batch ${Math.floor(i/concurrency) + 1}: ${batch.join(', ')}`)
      
      const batchPromises = batch.map(async (industry) => {
        try {
          const industryResults = await this.searchByIndustry(industry, options)
          return { industry, data: industryResults, success: true }
        } catch (error) {
          console.error(`Batch research failed for ${industry}:`, error)
          return { industry, error: error.message, success: false }
        }
      })

      const batchResults = await Promise.all(batchPromises)
      
      batchResults.forEach(result => {
        results[result.industry] = result.success ? result.data : { error: result.error }
      })

      // Save progress if enabled
      if (saveProgress && typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('youtube_research_progress', JSON.stringify(results))
      }

      // Delay between batches to respect rate limits
      if (i + concurrency < industries.length) {
        console.log(`Waiting ${delayBetweenBatches/1000}s before next batch...`)
        await this.sleep(delayBetweenBatches)
      }
    }

    return results
  }

  // Get trending topics in an industry
  async getTrendingTopics(industry, region = 'US') {
  try {
    if (!this.apiKey) {
      throw new Error('YouTube API key not configured');
    }

    const response = await axios.get(`${this.baseUrl}/videos`, {
      params: {
        key: this.apiKey,
        part: 'snippet,statistics',
        chart: 'mostPopular',
        regionCode: region,
        maxResults: 50,
        videoCategoryId: 22
      },
      timeout: 15000
    });

    const industryVideos = response.data.items.filter(video => {
      const content = `${video.snippet.title} ${video.snippet.description}`.toLowerCase();
      const industryKeywords = [
        industry.toLowerCase(),
        'marketing',
        'business',
        'entrepreneur',
        'startup',
        'growth'
      ];
      return industryKeywords.some(keyword => content.includes(keyword));
    });

    return industryVideos.map(video => ({
      id: video.id,
      title: video.snippet.title,
      description: video.snippet.description,
      channelTitle: video.snippet.channelTitle,
      viewCount: parseInt(video.statistics.viewCount),
      publishedAt: video.snippet.publishedAt
    }));
  } catch (error) {
    console.error('Error fetching trending topics:', error);
    return [];
  }
}

  // Analyze competitor content
  async analyzeCompetitorContent(channelId, industry) {
    try {
      if (!this.apiKey) {
        throw new Error('YouTube API key not configured')
      }

      // Get channel's recent videos
      const response = await axios.get(`${this.baseUrl}/search`, {
        params: {
          key: this.apiKey,
          channelId,
          part: 'snippet',
          type: 'video',
          maxResults: 20,
          order: 'date'
        },
        timeout: 15000
      })

      const videos = response.data.items
      const analysis = {
        channelId,
        industry,
        totalVideos: videos.length,
        contentThemes: {},
        avgViewsEstimate: 0,
        recommendedTopics: []
      }

      for (const video of videos) {
        try {
          const details = await this.getVideoDetails(video.id.videoId)
          
          // Analyze title for themes
          const themes = this.extractThemes(details.title, industry)
          themes.forEach(theme => {
            analysis.contentThemes[theme] = (analysis.contentThemes[theme] || 0) + 1
          })

          analysis.avgViewsEstimate += details.viewCount
          
          // Rate limiting
          await this.sleep(500)
        } catch (error) {
          console.error(`Error analyzing video ${video.id.videoId}:`, error)
        }
      }

      analysis.avgViewsEstimate = Math.round(analysis.avgViewsEstimate / videos.length)
      
      // Generate topic recommendations based on successful themes
      analysis.recommendedTopics = Object.entries(analysis.contentThemes)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([theme, count]) => ({ theme, frequency: count }))

      return analysis
    } catch (error) {
      console.error('Error analyzing competitor content:', error)
      throw error
    }
  }

  extractThemes(title, industry) {
    const themes = []
    const titleLower = title.toLowerCase()
    
    const themeKeywords = {
      'strategy': ['strategy', 'plan', 'approach', 'method'],
      'tips': ['tips', 'tricks', 'hacks', 'secrets'],
      'case_study': ['case study', 'success story', 'results', 'how i'],
      'tutorial': ['how to', 'tutorial', 'guide', 'step by step'],
      'tools': ['tools', 'software', 'platform', 'app'],
      'psychology': ['psychology', 'mindset', 'behavior', 'persuasion'],
      'automation': ['automation', 'automated', 'ai', 'bot'],
      'optimization': ['optimization', 'optimize', 'improve', 'boost'],
      'analytics': ['analytics', 'data', 'metrics', 'tracking'],
      'conversion': ['conversion', 'convert', 'sales', 'revenue']
    }

    Object.entries(themeKeywords).forEach(([theme, keywords]) => {
      if (keywords.some(keyword => titleLower.includes(keyword))) {
        themes.push(theme)
      }
    })

    return themes
  }

  // Get service information and setup instructions
  getServiceInfo() {
    return {
      freeServices: {
        youtube: {
          description: 'YouTube built-in captions',
          cost: 'Free',
          limitations: 'Only works if video has captions (~60-70% of videos)',
          reliability: 'Medium (depends on video)',
          setup: 'No setup required',
          successRate: '60-70%'
        },
        'youtube-alt': {
          description: 'Alternative YouTube caption extraction',
          cost: 'Free',
          limitations: 'Backup method for YouTube captions',
          reliability: 'Medium',
          setup: 'No setup required',
          successRate: '50-60%'
        },
        'transcript-api': {
          description: 'Third-party free transcript APIs',
          cost: 'Free',
          limitations: 'Rate limited, may be unreliable',
          reliability: 'Low-Medium',
          setup: 'No setup required',
          successRate: '40-50%'
        }
      },
      
      paidServices: {
        assemblyai: {
          description: 'AI-powered transcription with speaker detection',
          cost: 'Free tier: 3 hours/month, then $0.37/hour',
          limitations: 'Requires audio extraction',
          reliability: 'High',
          setup: 'API key required: ASSEMBLYAI_API_KEY',
          signupUrl: 'https://www.assemblyai.com',
          successRate: '95%+'
        },
        deepgram: {
          description: 'Real-time speech recognition',
          cost: 'Free tier: $200 credit, then $0.0125/minute',
          limitations: 'Requires audio extraction',
          reliability: 'Very High',
          setup: 'API key required: DEEPGRAM_API_KEY',
          signupUrl: 'https://deepgram.com',
          successRate: '98%+'
        },
        whisperapi: {
          description: 'OpenAI Whisper API',
          cost: '$0.006/minute',
          limitations: 'Requires audio download',
          reliability: 'High',
          setup: 'OpenAI API key required: OPENAI_API_KEY',
          signupUrl: 'https://openai.com',
          successRate: '95%+'
        }
      },
      
      setupInstructions: {
        envVariables: [
          '# Add to your .env.local file:',
          '',
          '# Required for YouTube API',
          'YOUTUBE_API_KEY=your_youtube_api_key',
          '',
          '# Optional - Free tier transcription services',
          'ASSEMBLYAI_API_KEY=your_assemblyai_key  # 3 hours/month free',
          'DEEPGRAM_API_KEY=your_deepgram_key      # $200 free credit',
          '',
          '# Optional - Premium transcription',
          'OPENAI_API_KEY=your_openai_key          # Pay per use'
        ],
        quickStart: [
          '1. Start with YouTube captions (free) - covers ~60-70% of videos',
          '2. Add AssemblyAI for free tier (3 hours/month)',
          '3. Use Deepgram for high-volume needs ($200 free credit)',
          '4. Fallback to alternative APIs for edge cases',
          '5. Cache all transcripts to avoid re-processing'
        ]
      },
      
      recommendations: [
        '🆓 Use free YouTube captions first - they work for most popular videos',
        '💡 Sign up for AssemblyAI free tier - 3 hours/month is usually enough for testing',
        '🚀 Get Deepgram $200 credit for serious usage - best accuracy',
        '⚡ Cache all successful transcripts to avoid re-processing',
        '📊 Monitor success rates and adjust strategy accordingly'
      ]
    }
  }

  // Enhanced method to analyze transcript quality and extract insights
  async analyzeTranscriptContent(transcript, industry) {
    if (!transcript || transcript.length < 100) {
      return {
        quality: 'low',
        insights: [],
        keyPoints: [],
        marketingStrategies: [],
        painPoints: [],
        solutions: []
      }
    }

    const analysis = {
      quality: this.assessTranscriptQuality(transcript),
      wordCount: transcript.split(' ').length,
      insights: [],
      keyPoints: [],
      marketingStrategies: [],
      painPoints: [],
      solutions: [],
      industryRelevance: 0
    }

    // Extract key marketing terms
    const marketingTerms = [
      'conversion', 'roi', 'funnel', 'lead generation', 'customer acquisition',
      'email marketing', 'paid ads', 'social media', 'content marketing',
      'automation', 'analytics', 'optimization', 'split test', 'landing page'
    ]

    const transcriptLower = transcript.toLowerCase()
    const industryLower = industry.toLowerCase()

    // Calculate industry relevance
    if (transcriptLower.includes(industryLower)) {
      analysis.industryRelevance += 30
    }

    marketingTerms.forEach(term => {
      if (transcriptLower.includes(term)) {
        analysis.marketingStrategies.push(term)
        analysis.industryRelevance += 5
      }
    })

    // Extract pain points (common phrases)
    const painPointIndicators = [
      'problem', 'challenge', 'difficult', 'struggle', 'issue', 'pain',
      'frustrating', 'costly', 'time consuming', 'not working'
    ]

    const sentences = transcript.split(/[.!?]+/)
    
    sentences.forEach(sentence => {
      const sentenceLower = sentence.toLowerCase()
      
      // Look for pain points
      painPointIndicators.forEach(indicator => {
        if (sentenceLower.includes(indicator) && sentence.length > 20) {
          analysis.painPoints.push(sentence.trim())
        }
      })

      // Look for solutions
      if ((sentenceLower.includes('solution') || sentenceLower.includes('how to') || 
           sentenceLower.includes('strategy')) && sentence.length > 20) {
        analysis.solutions.push(sentence.trim())
      }

      // Extract key insights
      if ((sentenceLower.includes('important') || sentenceLower.includes('key') ||
           sentenceLower.includes('secret') || sentenceLower.includes('tip')) && 
           sentence.length > 20) {
        analysis.insights.push(sentence.trim())
      }
    })

    // Limit arrays to most relevant items
    analysis.painPoints = analysis.painPoints.slice(0, 5)
    analysis.solutions = analysis.solutions.slice(0, 5)
    analysis.insights = analysis.insights.slice(0, 10)
    analysis.keyPoints = [...analysis.insights, ...analysis.solutions].slice(0, 8)

    return analysis
  }

  assessTranscriptQuality(transcript) {
    if (!transcript) return 'none'
    
    const length = transcript.length
    const wordCount = transcript.split(' ').length
    const avgWordLength = length / wordCount
    
    // Check for common auto-generated transcript issues
    const hasRepeatedPhrases = /(.{10,})\1{2,}/.test(transcript)
    const hasProperPunctuation = /[.!?]/.test(transcript)
    const hasCapitalization = /[A-Z]/.test(transcript)
    
    if (length < 200) return 'low'
    if (hasRepeatedPhrases || !hasProperPunctuation) return 'medium'
    if (length > 1000 && hasCapitalization && avgWordLength > 3) return 'high'
    
    return 'medium'
  }

  // Method to get comprehensive industry insights
  async getIndustryInsights(industry, options = {}) {
    const { 
      depth = 'standard',
      includeCompetitorAnalysis = false,
      analyzeTrends = true 
    } = options

    console.log(`🔍 Getting comprehensive insights for ${industry}...`)

    const results = await this.searchByIndustry(industry, { 
      depth,
      transcriptionOptions: { preferredService: 'auto' }
    })

    // Analyze all transcripts for insights
    const insights = {
      industry,
      totalVideosAnalyzed: results.videos.length,
      overallInsights: {
        commonStrategies: [],
        painPoints: [],
        solutions: [],
        keyTerms: {},
        emergingTrends: []
      },
      topPerformingContent: [],
      recommendations: []
    }

    // Process each video's transcript
    for (const video of results.videos) {
      if (video.transcript) {
        const analysis = await this.analyzeTranscriptContent(video.transcript, industry)
        
        // Aggregate insights
        insights.overallInsights.commonStrategies.push(...analysis.marketingStrategies)
        insights.overallInsights.painPoints.push(...analysis.painPoints)
        insights.overallInsights.solutions.push(...analysis.solutions)

        // Track high-performing content
        if (video.viewCount > 50000 && analysis.quality === 'high') {
          insights.topPerformingContent.push({
            title: video.title,
            viewCount: video.viewCount,
            keyInsights: analysis.insights.slice(0, 3),
            relevanceScore: video.relevanceScore
          })
        }
      }
    }

    // Generate final recommendations
    insights.recommendations = this.generateIndustryRecommendations(insights, industry)

    return insights
  }

  generateIndustryRecommendations(insights, industry) {
    const recommendations = []

    if (insights.totalVideosAnalyzed === 0) {
      return [`No video data found for ${industry}. Consider broadening search terms.`]
    }

    recommendations.push(`Based on analysis of ${insights.totalVideosAnalyzed} ${industry} marketing videos:`)

    // Top strategies
    const topStrategies = this.getMostCommon(insights.overallInsights.commonStrategies, 3)
    if (topStrategies.length > 0) {
      recommendations.push(`🎯 Focus on: ${topStrategies.join(', ')}`)
    }

    // Common pain points
    const topPainPoints = this.getMostCommon(insights.overallInsights.painPoints, 2)
    if (topPainPoints.length > 0) {
      recommendations.push(`⚠️ Address these pain points: ${topPainPoints.join(', ')}`)
    }

    // High-performing content themes
    if (insights.topPerformingContent.length > 0) {
      const topContent = insights.topPerformingContent
        .sort((a, b) => b.viewCount - a.viewCount)
        .slice(0, 2)
      
      recommendations.push(`🔥 High-performing content types:`)
      topContent.forEach(content => {
        recommendations.push(`   • "${content.title}" (${content.viewCount.toLocaleString()} views)`)
      })
    }

    return recommendations
  }

  getMostCommon(array, limit = 5) {
    const frequency = {}
    array.forEach(item => {
      if (typeof item === 'string' && item.length > 3) {
        frequency[item] = (frequency[item] || 0) + 1
      }
    })

    return Object.entries(frequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([item]) => item)
  }

  // ENHANCED: Complete setup validation method
  async validateCompleteSetup() {
    console.log('🔧 Validating complete YouTube research setup...')
    
    const validation = {
      timestamp: new Date().toISOString(),
      overall: { success: false, score: 0, maxScore: 100 },
      components: {
        youtubeAPI: { tested: false, working: false, score: 0, maxScore: 40 },
        transcription: { tested: false, workingMethods: [], score: 0, maxScore: 30 },
        caching: { tested: false, working: false, score: 0, maxScore: 15 },
        search: { tested: false, working: false, score: 0, maxScore: 15 }
      },
      recommendations: [],
      nextSteps: []
    }

    // Test 1: YouTube API (40 points)
    console.log('🎯 Testing YouTube API...')
    try {
      const apiTest = await this.testYouTubeConnection()
      validation.components.youtubeAPI.tested = true
      validation.components.youtubeAPI.working = apiTest.success
      
      if (apiTest.success) {
        validation.components.youtubeAPI.score = 40
        validation.recommendations.push('✅ YouTube API is working perfectly')
      } else {
        validation.recommendations.push(`❌ YouTube API failed: ${apiTest.error}`)
        validation.nextSteps.push('Fix YouTube API key configuration')
      }
    } catch (error) {
      validation.recommendations.push(`❌ YouTube API test failed: ${error.message}`)
      validation.nextSteps.push('Add valid YOUTUBE_API_KEY to .env.local')
    }

    // Test 2: Transcription services (30 points)
    console.log('📝 Testing transcription services...')
    try {
      const transcriptTest = await this.testTranscriptionServices()
      validation.components.transcription.tested = true
      
      const workingServices = Object.entries(transcriptTest.serviceResults)
        .filter(([, result]) => result.success)
        .map(([service]) => service)
      
      validation.components.transcription.workingMethods = workingServices
      
      if (workingServices.length > 0) {
        validation.components.transcription.score = Math.min(workingServices.length * 10, 30)
        validation.recommendations.push(`✅ Working transcription: ${workingServices.join(', ')}`)
      } else {
        validation.recommendations.push('⚠️ No transcription services working')
        validation.nextSteps.push('Set up at least YouTube captions or paid transcription service')
      }
    } catch (error) {
      validation.recommendations.push(`❌ Transcription test failed: ${error.message}`)
    }

    // Test 3: Caching system (15 points)
    console.log('💾 Testing caching system...')
    try {
      // Test cache write/read
      await this.cacheTranscript('test123', 'test transcript', 'test')
      const cached = await this.getCachedTranscript('test123')
      
      validation.components.caching.tested = true
      validation.components.caching.working = !!cached
      
      if (cached) {
        validation.components.caching.score = 15
        validation.recommendations.push('✅ Caching system working')
      } else {
        validation.recommendations.push('⚠️ Caching system not working')
        validation.nextSteps.push('Check cache API endpoints')
      }
    } catch (error) {
      validation.recommendations.push(`❌ Caching test failed: ${error.message}`)
    }

    // Test 4: Search functionality (15 points)
    console.log('🔍 Testing search functionality...')
    try {
      const searchResults = await this.searchVideos('marketing tips', 5)
      
      validation.components.search.tested = true
      validation.components.search.working = searchResults.length > 0
      
      if (searchResults.length > 0) {
        validation.components.search.score = 15
        validation.recommendations.push(`✅ Search working: found ${searchResults.length} videos`)
      } else {
        validation.recommendations.push('⚠️ Search not returning results')
        validation.nextSteps.push('Check search parameters and API quota')
      }
    } catch (error) {
      validation.recommendations.push(`❌ Search test failed: ${error.message}`)
    }

    // Calculate overall score
    validation.overall.score = Object.values(validation.components)
      .reduce((sum, component) => sum + component.score, 0)
    
    validation.overall.success = validation.overall.score >= 70 // 70% threshold

    // Generate final recommendations
    if (validation.overall.success) {
      validation.recommendations.unshift('🎉 YouTube research system is ready for production!')
    } else {
      validation.recommendations.unshift(`⚠️ Setup incomplete (${validation.overall.score}/100). Address the issues below:`)
    }

    console.log('📊 Setup validation complete:', validation)
    return validation
  }

  // ENHANCED: Industry-specific search optimization
  async optimizedIndustrySearch(industry, options = {}) {
    const { 
      maxVideosPerTerm = 8,
      prioritizeRecent = true,
      includeCompetitorAnalysis = false,
      minViewCount = 5000,
      maxProcessingTime = 300000 // 5 minutes max
    } = options

    console.log(`🎯 Starting optimized search for ${industry}...`)
    
    const startTime = Date.now()
    const results = {
      industry,
      searchStrategy: 'optimized',
      totalSearchTerms: 0,
      videosFound: [],
      processingStats: {
        timeSpent: 0,
        apiCallsMade: 0,
        transcriptsSuccessful: 0,
        quotaUsed: 0
      },
      qualityMetrics: {
        avgRelevanceScore: 0,
        highQualityVideos: 0,
        transcriptQualityDistribution: { high: 0, medium: 0, low: 0 }
      }
    }

    // Generate optimized search terms
    const searchTerms = this.generateOptimizedSearchTerms(industry)
    results.totalSearchTerms = searchTerms.length

    for (const term of searchTerms) {
      // Check time limit
      if (Date.now() - startTime > maxProcessingTime) {
        console.log('⏰ Max processing time reached, stopping search')
        break
      }

      try {
        console.log(`🔍 Searching: "${term}"`)
        const videos = await this.searchVideos(term, maxVideosPerTerm)
        results.processingStats.apiCallsMade++
        results.processingStats.quotaUsed += 100 // Search costs 100 quota units

        for (const video of videos) {
          // Skip if already processed
          if (results.videosFound.some(v => v.id === video.id)) continue

          try {
            // Get detailed info
            const details = await this.getVideoDetails(video.id)
            results.processingStats.apiCallsMade++
            results.processingStats.quotaUsed += 1

            // Apply filters
            if (details.viewCount < minViewCount) continue

            // Calculate relevance early
            const relevanceScore = this.calculateRelevanceScore(details, industry)
            if (relevanceScore < 30) continue // Skip low relevance videos

            // Try to get transcript
            const transcriptResult = await this.getTranscript(video.id, { 
              preferredService: 'auto',
              useCache: true,
              minLength: 100 
            })

            if (transcriptResult.transcript) {
              results.processingStats.transcriptsSuccessful++
              
              // Analyze transcript quality
              const quality = this.assessTranscriptQuality(transcriptResult.transcript)
              results.qualityMetrics.transcriptQualityDistribution[quality]++

              const videoData = {
                ...details,
                transcript: transcriptResult.transcript,
                transcriptionMethod: transcriptResult.method,
                searchTerm: term,
                relevanceScore,
                quality,
                processingDate: new Date().toISOString()
              }

              results.videosFound.push(videoData)

              // Track high quality videos
              if (quality === 'high' && relevanceScore > 60) {
                results.qualityMetrics.highQualityVideos++
              }

              console.log(`✅ Added: "${details.title}" (relevance: ${relevanceScore}, quality: ${quality})`)
            }

            // Rate limiting
            await this.sleep(500)

          } catch (videoError) {
            console.log(`❌ Error processing video ${video.id}: ${videoError.message}`)
          }
        }

        // Rate limiting between search terms
        await this.sleep(1000)

      } catch (searchError) {
        console.error(`❌ Search failed for "${term}": ${searchError.message}`)
      }
    }

    // Calculate final metrics
    results.processingStats.timeSpent = Date.now() - startTime
    
    if (results.videosFound.length > 0) {
      results.qualityMetrics.avgRelevanceScore = Math.round(
        results.videosFound.reduce((sum, v) => sum + v.relevanceScore, 0) / results.videosFound.length
      )
      
      // Sort by relevance score
      results.videosFound.sort((a, b) => b.relevanceScore - a.relevanceScore)
    }

    console.log(`🎯 Optimized search complete: ${results.videosFound.length} videos, ${results.processingStats.transcriptsSuccessful} transcripts, ${results.qualityMetrics.highQualityVideos} high-quality`)

    return results
  }

  generateOptimizedSearchTerms(industry) {
    // High-value search terms optimized for quality results
    const coreTerms = [
      `${industry} marketing strategy 2024`,
      `${industry} digital marketing case study`,
      `${industry} advertising best practices`,
      `${industry} customer acquisition strategy`,
      `${industry} marketing funnel optimization`
    ]

    const specificTerms = [
      `${industry} email marketing campaigns`,
      `${industry} social media strategy`,
      `${industry} content marketing tips`,
      `${industry} paid advertising ROI`,
      `${industry} conversion optimization`
    ]

    const expertTerms = [
      `${industry} marketing expert interview`,
      `${industry} business growth strategy`,
      `${industry} sales psychology`,
      `${industry} customer retention strategies`,
      `${industry} marketing automation tools`
    ]

    // Return prioritized terms (most specific first)
    return [...coreTerms, ...specificTerms, ...expertTerms]
  }

  // ENHANCED: Smart caching with expiration and validation
  async smartCacheTranscript(videoId, transcript, method, options = {}) {
    const { 
      ttl = 30 * 24 * 60 * 60 * 1000, // 30 days default
      quality = null,
      metadata = {}
    } = options

    try {
      const cacheData = {
        videoId,
        transcript,
        method,
        quality: quality || this.assessTranscriptQuality(transcript),
        length: transcript.length,
        metadata,
        cachedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + ttl).toISOString(),
        version: '2.0' // Cache version for future migrations
      }

      await fetch('/api/youtube-research/cache/smart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cacheData)
      })

      console.log(`💾 Smart cached transcript for ${videoId} (${transcript.length} chars, quality: ${cacheData.quality})`)
      return true
    } catch (error) {
      console.log('Smart cache save failed:', error)
      return false
    }
  }

  async getSmartCachedTranscript(videoId) {
    try {
      const response = await fetch(`/api/youtube-research/cache/smart/${videoId}`)
      if (response.ok) {
        const data = await response.json()
        
        // Check if cache is expired
        if (new Date(data.expiresAt) < new Date()) {
          console.log(`⏰ Cached transcript for ${videoId} has expired`)
          return null
        }
        
        return data
      }
    } catch (error) {
      console.log('Smart cache fetch failed:', error)
    }
    return null
  }

  // ENHANCED: Comprehensive research pipeline
  async comprehensiveIndustryResearch(industry, options = {}) {
    const {
      depth = 'comprehensive', // 'quick', 'standard', 'comprehensive', 'deep'
      includeCompetitorAnalysis = true,
      includeTrendAnalysis = true,
      generateReport = true,
      maxTimeMinutes = 15,
      targetVideoCount = 50
    } = options

    console.log(`🚀 Starting comprehensive research for ${industry} (${depth} mode)`)
    
    const research = {
      industry,
      depth,
      startTime: new Date().toISOString(),
      phases: {
        discovery: { status: 'pending', results: null },
        transcription: { status: 'pending', results: null },
        analysis: { status: 'pending', results: null },
        insights: { status: 'pending', results: null },
        reporting: { status: 'pending', results: null }
      },
      summary: {
        totalVideos: 0,
        transcriptsObtained: 0,
        keyInsights: [],
        actionableStrategies: [],
        competitorIntelligence: [],
        marketTrends: []
      }
    }

    const maxTime = maxTimeMinutes * 60 * 1000
    const startTime = Date.now()

    try {
      // Phase 1: Discovery
      research.phases.discovery.status = 'running'
      console.log('📡 Phase 1: Video Discovery')
      
      const discoveryResults = await this.optimizedIndustrySearch(industry, {
        maxVideosPerTerm: depth === 'quick' ? 5 : depth === 'standard' ? 8 : 12,
        minViewCount: depth === 'quick' ? 10000 : 5000,
        maxProcessingTime: maxTime * 0.6 // 60% of time for discovery
      })
      
      research.phases.discovery.status = 'completed'
      research.phases.discovery.results = discoveryResults
      research.summary.totalVideos = discoveryResults.videosFound.length
      research.summary.transcriptsObtained = discoveryResults.processingStats.transcriptsSuccessful

      // Phase 2: Enhanced Analysis
      research.phases.analysis.status = 'running'
      console.log('🧠 Phase 2: Content Analysis')
      
      const analysisResults = await this.analyzeVideoCollection(discoveryResults.videosFound, industry)
      research.phases.analysis.status = 'completed'
      research.phases.analysis.results = analysisResults

      // Phase 3: Insights Generation
      research.phases.insights.status = 'running'
      console.log('💡 Phase 3: Insights Generation')
      
      const insights = await this.generateAdvancedInsights(analysisResults, industry)
      research.phases.insights.status = 'completed'
      research.phases.insights.results = insights
      
      research.summary.keyInsights = insights.keyInsights
      research.summary.actionableStrategies = insights.strategies
      research.summary.marketTrends = insights.trends

      // Phase 4: Competitor Analysis (if enabled)
      if (includeCompetitorAnalysis && Date.now() - startTime < maxTime * 0.8) {
        console.log('🎯 Phase 4: Competitor Analysis')
        const competitorData = await this.analyzeCompetitorLandscape(discoveryResults.videosFound, industry)
        research.summary.competitorIntelligence = competitorData.insights
      }

      // Phase 5: Report Generation
      if (generateReport) {
        research.phases.reporting.status = 'running'
        console.log('📊 Phase 5: Report Generation')
        
        const report = await this.generateComprehensiveReport(research, industry)
        research.phases.reporting.status = 'completed'
        research.phases.reporting.results = report
      }

      research.endTime = new Date().toISOString()
      research.totalTimeMinutes = Math.round((Date.now() - startTime) / 60000)
      
      console.log(`✅ Comprehensive research completed in ${research.totalTimeMinutes} minutes`)
      console.log(`📊 Results: ${research.summary.totalVideos} videos, ${research.summary.transcriptsObtained} transcripts, ${research.summary.keyInsights.length} insights`)

      return research

    } catch (error) {
      console.error('❌ Comprehensive research failed:', error)
      research.error = error.message
      research.endTime = new Date().toISOString()
      return research
    }
  }

  // Helper: Analyze video collection
  async analyzeVideoCollection(videos, industry) {
    const analysis = {
      totalVideos: videos.length,
      contentThemes: {},
      performanceMetrics: {
        avgViews: 0,
        avgLikes: 0,
        avgComments: 0,
        topPerformers: []
      },
      transcriptAnalysis: {
        totalWords: 0,
        avgWordsPerVideo: 0,
        commonTopics: {},
        sentimentDistribution: {}
      }
    }

    for (const video of videos) {
      // Performance metrics
      analysis.performanceMetrics.avgViews += video.viewCount
      analysis.performanceMetrics.avgLikes += video.likeCount
      analysis.performanceMetrics.avgComments += video.commentCount

      // High performers
      if (video.viewCount > 100000) {
        analysis.performanceMetrics.topPerformers.push({
          title: video.title,
          views: video.viewCount,
          relevanceScore: video.relevanceScore
        })
      }

      // Transcript analysis
      if (video.transcript) {
        const wordCount = video.transcript.split(' ').length
        analysis.transcriptAnalysis.totalWords += wordCount

        // Extract themes from title and transcript
        const themes = this.extractThemes(video.title, industry)
        themes.forEach(theme => {
          analysis.contentThemes[theme] = (analysis.contentThemes[theme] || 0) + 1
        })
      }
    }

    // Calculate averages
    if (videos.length > 0) {
      analysis.performanceMetrics.avgViews = Math.round(analysis.performanceMetrics.avgViews / videos.length)
      analysis.performanceMetrics.avgLikes = Math.round(analysis.performanceMetrics.avgLikes / videos.length)
      analysis.performanceMetrics.avgComments = Math.round(analysis.performanceMetrics.avgComments / videos.length)
      analysis.transcriptAnalysis.avgWordsPerVideo = Math.round(analysis.transcriptAnalysis.totalWords / videos.length)
    }

    // Sort top performers
    analysis.performanceMetrics.topPerformers.sort((a, b) => b.views - a.views)
    analysis.performanceMetrics.topPerformers = analysis.performanceMetrics.topPerformers.slice(0, 10)

    return analysis
  }

  // Helper: Generate advanced insights
  async generateAdvancedInsights(analysisResults, industry) {
    const insights = {
      keyInsights: [],
      strategies: [],
      trends: [],
      opportunities: [],
      recommendations: []
    }

    // Analyze content themes
    const topThemes = Object.entries(analysisResults.contentThemes)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)

    topThemes.forEach(([theme, count]) => {
      insights.keyInsights.push({
        type: 'content_theme',
        insight: `${theme} is a dominant theme in ${industry} marketing content`,
        frequency: count,
        actionable: `Consider creating content around ${theme} strategies`
      })
    })

    // Performance insights
    const { avgViews, topPerformers } = analysisResults.performanceMetrics
    
    if (topPerformers.length > 0) {
      insights.strategies.push({
        type: 'high_performance_analysis',
        strategy: 'Analyze top performing content patterns',
        data: topPerformers.slice(0, 3),
        implementation: 'Study these high-performing videos for content ideas and strategies'
      })
    }

    // Trend analysis
    if (analysisResults.transcriptAnalysis.avgWordsPerVideo > 1000) {
      insights.trends.push({
        trend: 'Long-form content dominance',
        evidence: `Average ${analysisResults.transcriptAnalysis.avgWordsPerVideo} words per video`,
        implication: 'Detailed, educational content performs well in this industry'
      })
    }

    // Opportunities
    const underrepresentedThemes = Object.entries(analysisResults.contentThemes)
      .filter(([,count]) => count === 1)
      .map(([theme]) => theme)

    if (underrepresentedThemes.length > 0) {
      insights.opportunities.push({
        opportunity: 'Underexplored content areas',
        themes: underrepresentedThemes.slice(0, 3),
        potential: 'Low competition topics with content gap opportunities'
      })
    }

    return insights
  }

  // Helper: Analyze competitor landscape
  async analyzeCompetitorLandscape(videos, industry) {
    const competitors = {
      topChannels: {},
      insights: [],
      marketShare: {},
      contentGaps: []
    }

    // Group by channel
    videos.forEach(video => {
      const channel = video.channelTitle
      if (!competitors.topChannels[channel]) {
        competitors.topChannels[channel] = {
          videos: 0,
          totalViews: 0,
          avgViews: 0,
          topics: []
        }
      }
      
      competitors.topChannels[channel].videos++
      competitors.topChannels[channel].totalViews += video.viewCount
      competitors.topChannels[channel].topics.push(...this.extractThemes(video.title, industry))
    })

    // Calculate averages and insights
    Object.values(competitors.topChannels).forEach(channel => {
      channel.avgViews = Math.round(channel.totalViews / channel.videos)
    })

    // Top competitors by performance
    const topCompetitors = Object.entries(competitors.topChannels)
      .sort(([,a], [,b]) => b.avgViews - a.avgViews)
      .slice(0, 5)

    topCompetitors.forEach(([channelName, data]) => {
      competitors.insights.push({
        channel: channelName,
        performance: data.avgViews,
        videoCount: data.videos,
        strengths: data.topics.slice(0, 3)
      })
    })

    return competitors
  }

  // Helper: Generate comprehensive report
  async generateComprehensiveReport(research, industry) {
    const report = {
      title: `${industry} Marketing Research Report`,
      generatedAt: new Date().toISOString(),
      executiveSummary: {},
      methodology: {},
      findings: {},
      recommendations: {},
      appendix: {}
    }

    // Executive Summary
    report.executiveSummary = {
      overview: `Comprehensive analysis of ${industry} marketing content based on ${research.summary.totalVideos} videos`,
      keyMetrics: {
        videosAnalyzed: research.summary.totalVideos,
        transcriptsProcessed: research.summary.transcriptsObtained,
        insightsGenerated: research.summary.keyInsights.length,
        researchDuration: research.totalTimeMinutes
      },
      topFindings: research.summary.keyInsights.slice(0, 3)
    }

    // Methodology
    report.methodology = {
      approach: 'Multi-phase AI-powered content analysis',
      phases: Object.keys(research.phases),
      dataCollection: 'YouTube Data API v3 + Advanced transcript analysis',
      qualityControls: 'Relevance scoring, transcript quality assessment, content validation'
    }

    // Findings
    report.findings = {
      contentAnalysis: research.phases.analysis?.results,
      marketInsights: research.phases.insights?.results,
      competitorIntelligence: research.summary.competitorIntelligence
    }

    // Recommendations
    report.recommendations = {
      immediate: research.summary.actionableStrategies.slice(0, 3),
      strategic: research.summary.marketTrends,
      competitive: research.summary.competitorIntelligence.slice(0, 2)
    }

    return report
  }

  // UTILITY: Export research data
  async exportResearchData(researchData, format = 'json') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `youtube-research-${researchData.industry}-${timestamp}`

    switch (format) {
      case 'json':
        return {
          filename: `${filename}.json`,
          data: JSON.stringify(researchData, null, 2),
          mimeType: 'application/json'
        }
      
      case 'csv':
        const csvData = this.convertToCSV(researchData)
        return {
          filename: `${filename}.csv`,
          data: csvData,
          mimeType: 'text/csv'
        }
      
      case 'summary':
        const summary = this.generateTextSummary(researchData)
        return {
          filename: `${filename}-summary.txt`,
          data: summary,
          mimeType: 'text/plain'
        }
      
      default:
        throw new Error(`Unsupported export format: ${format}`)
    }
  }

  convertToCSV(researchData) {
    const videos = researchData.phases?.discovery?.results?.videosFound || []
    
    const headers = [
      'Title', 'Channel', 'Views', 'Likes', 'Comments', 'Published', 
      'Relevance Score', 'Transcript Quality', 'Search Term', 'Duration'
    ]

    const rows = videos.map(video => [
      `"${video.title.replace(/"/g, '""')}"`,
      `"${video.channelTitle}"`,
      video.viewCount,
      video.likeCount,
      video.commentCount,
      video.publishedAt,
      video.relevanceScore,
      video.quality || 'unknown',
      `"${video.searchTerm}"`,
      video.duration || 'unknown'
    ])

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
  }

  generateTextSummary(researchData) {
    const summary = []
    const { industry, summary: dataSummary, phases } = researchData

    summary.push(`${industry.toUpperCase()} MARKETING RESEARCH SUMMARY`)
    summary.push('='.repeat(50))
    summary.push('')
    
    summary.push(`Research Date: ${new Date(researchData.startTime).toLocaleDateString()}`)
    summary.push(`Total Videos Analyzed: ${dataSummary.totalVideos}`)
    summary.push(`Transcripts Obtained: ${dataSummary.transcriptsObtained}`)
    summary.push(`Research Duration: ${researchData.totalTimeMinutes} minutes`)
    summary.push('')

    // Key Insights
    summary.push('KEY INSIGHTS:')
    summary.push('-'.repeat(20))
    dataSummary.keyInsights.slice(0, 5).forEach((insight, i) => {
      summary.push(`${i + 1}. ${insight.insight || insight}`)
    })
    summary.push('')

    // Actionable Strategies
    if (dataSummary.actionableStrategies.length > 0) {
      summary.push('ACTIONABLE STRATEGIES:')
      summary.push('-'.repeat(25))
      dataSummary.actionableStrategies.slice(0, 5).forEach((strategy, i) => {
        summary.push(`${i + 1}. ${strategy.strategy || strategy}`)
      })
      summary.push('')
    }

    // Top Performing Content
    const topPerformers = phases?.analysis?.results?.performanceMetrics?.topPerformers || []
    if (topPerformers.length > 0) {
      summary.push('TOP PERFORMING CONTENT:')
      summary.push('-'.repeat(25))
      topPerformers.slice(0, 3).forEach((video, i) => {
        summary.push(`${i + 1}. "${video.title}" (${video.views.toLocaleString()} views)`)
      })
    }

    return summary.join('\n')
  }
}