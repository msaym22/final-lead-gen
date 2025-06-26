// lib/video-generation.js
'use client'

// 🎥 AI VIDEO GENERATION FOR E-COMMERCE LEADS
// Integrates with HeyGen and ScreenAPI for automated video creation

// 🎬 Main Video Generation Function
export const generateAIVideo = async (lead, campaign) => {
  try {
    console.log(`🎥 Generating AI video for ${lead.company.name}...`)
    
    // Check if high-tier lead qualifies for video
    if (lead.tier > 2) {
      console.log('Lead tier too low for video generation')
      return null
    }

    // 1. Generate screen recording of their website
    const screenRecording = await captureWebsiteScreen(lead.company.domain)
    
    // 2. Generate AI script based on pain points
    const script = await generateVideoScript(lead, campaign)
    
    // 3. Create AI face video with HeyGen
    const aiVideo = await generateHeyGenVideo(script, lead)
    
    // 4. Merge screen recording + AI face
    const finalVideo = await mergeVideoComponents(screenRecording, aiVideo, lead)
    
    // 5. Upload and get shareable link
    const videoData = await uploadVideoToStorage(finalVideo, lead)
    
    console.log(`✅ AI video generated for ${lead.company.name}: ${videoData.url}`)
    
    return {
      id: `video_${lead.id}_${Date.now()}`,
      leadId: lead.id,
      url: videoData.url,
      script: script,
      tier: lead.tier,
      painPoints: lead.opportunity.painPoints.slice(0, 2),
      createdAt: new Date(),
      status: 'ready',
      views: 0,
      engagement: {
        opened: false,
        watchTime: 0,
        clicked: false
      }
    }
  } catch (error) {
    console.error(`Video generation failed for ${lead.company.name}:`, error)
    return null
  }
}

// 📱 Website Screen Capture
const captureWebsiteScreen = async (domain) => {
  try {
    // Using ScreenAPI or similar service
    const SCREEN_API_KEY = process.env.NEXT_PUBLIC_SCREEN_API_KEY
    
    if (!SCREEN_API_KEY) {
      console.warn('Screen API key not available, using placeholder')
      return { url: `https://placeholder-screen.com/${domain}`, duration: 15 }
    }

    const response = await fetch('https://api.screenshotapi.net/screenshot', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SCREEN_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: `https://${domain}`,
        width: 1920,
        height: 1080,
        format: 'mp4',
        duration: 15,
        scroll: true,
        highlights: [
          { selector: 'header', color: '#ff6b6b' },
          { selector: '.cart, .checkout', color: '#4ecdc4' },
          { selector: '.discount, .sale', color: '#ffe66d' }
        ]
      })
    })

    if (response.ok) {
      const data = await response.json()
      return {
        url: data.screenshot_url,
        duration: 15,
        highlights: data.highlights || []
      }
    }
    
    // Fallback to static screenshot
    return {
      url: `https://api.screenshotlayer.com/api/capture?access_key=${SCREEN_API_KEY}&url=https://${domain}`,
      duration: 5,
      isStatic: true
    }
  } catch (error) {
    console.error('Screen capture failed:', error)
    return null
  }
}

// 🎯 AI Video Script Generation
const generateVideoScript = async (lead, campaign) => {
  const OPENAI_API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY
  
  if (!OPENAI_API_KEY) {
    return generateTemplateScript(lead, campaign)
  }

  try {
    const prompt = createVideoScriptPrompt(lead, campaign)
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a video script expert for e-commerce cold outreach. Create 30-second scripts that convert viewers into meetings. Use specific pain points and competitor references.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 400,
        temperature: 0.7
      })
    })

    if (response.ok) {
      const data = await response.json()
      return parseVideoScript(data.choices[0].message.content, lead)
    }
  } catch (error) {
    console.error('AI script generation failed:', error)
  }

  return generateTemplateScript(lead, campaign)
}

const createVideoScriptPrompt = (lead, campaign) => {
  return `Create a 30-second video script for ${lead.contact.firstName} at ${lead.company.name}:

🛒 STORE ANALYSIS:
• Platform: ${lead.company.platform}
• Tier: ${lead.tier}/3 (1=urgent, 3=low priority)
• Discovery Method: ${lead.company.discoveryMethod}
• Pain Points: ${lead.opportunity.painPoints.slice(0, 3).join(', ')}
• Tech Stack: Email=${lead.company.techStack?.emailProvider}, Platform=${lead.company.platform}

🎯 REQUIREMENTS:
1. Hook: Reference their specific pain point in first 5 seconds
2. Screen time: 15 seconds showing their website issues
3. Face time: 10 seconds with solution + social proof
4. Call to action: "Want a free audit?" 
5. Competitor reference: Use successful ${lead.company.platform} store example
6. Keep under 150 words total

🎬 FORMAT:
[SCENE 1 - Face to camera]: Opening hook with pain point
[SCENE 2 - Screen recording]: Show their website issue
[SCENE 3 - Face to camera]: Solution + proof + CTA

Pain points to address: ${lead.opportunity.painPoints.join(', ')}`
}

const parseVideoScript = (aiScript, lead) => {
  const scenes = aiScript.split(/\[SCENE \d+.*?\]:/i).filter(scene => scene.trim())
  
  return {
    hook: scenes[0]?.trim() || `Hi ${lead.contact.firstName}, quick question about ${lead.company.name}...`,
    screenNarration: scenes[1]?.trim() || `I noticed this issue on your website...`,
    solution: scenes[2]?.trim() || `Here's how we can fix this quickly...`,
    fullScript: aiScript,
    estimatedDuration: 30,
    scenes: scenes.length
  }
}

const generateTemplateScript = (lead, campaign) => {
  const templates = {
    'shopify_store': {
      hook: `Hi ${lead.contact.firstName}, I'm checking out ${lead.company.name} and noticed something that could be costing you sales...`,
      screenNarration: `See this? Your checkout process has a few friction points that successful Shopify stores like Gymshark have optimized...`,
      solution: `Here's a quick fix that recovered $28k/month for a similar store. Want a free audit?`
    },
    'poor_ad_performance': {
      hook: `Hi ${lead.contact.firstName}, noticed your ads might not be performing as well as they could...`,
      screenNarration: `Looking at your site, I can see why your ROAS might be declining. This issue cost another ${lead.company.platform} store 40% of their ad budget...`,
      solution: `We helped them fix this and improve ROAS by 60%. Want to see how?`
    },
    'cart_abandonment': {
      hook: `Hi ${lead.contact.firstName}, quick question about ${lead.company.name}'s cart abandonment...`,
      screenNarration: `I'm seeing some red flags here that typically lead to 70%+ abandonment rates. Compare this to how successful stores handle it...`,
      solution: `This simple change recovered 41% of lost revenue for a similar business. Free audit?`
    }
  }

  const template = templates[lead.company.discoveryMethod] || templates['shopify_store']
  
  return {
    hook: template.hook,
    screenNarration: template.screenNarration,
    solution: template.solution,
    fullScript: `${template.hook} ${template.screenNarration} ${template.solution}`,
    estimatedDuration: 25,
    scenes: 3
  }
}

// 🤖 HeyGen AI Video Generation
const generateHeyGenVideo = async (script, lead) => {
  const HEYGEN_API_KEY = process.env.NEXT_PUBLIC_HEYGEN_API_KEY
  
  if (!HEYGEN_API_KEY) {
    console.warn('HeyGen API key not available, using placeholder')
    return {
      url: `https://placeholder-video.com/ai-face-${lead.id}`,
      duration: 20,
      isPlaceholder: true
    }
  }

  try {
    // Create HeyGen video with trained avatar
    const response = await fetch('https://api.heygen.com/v2/video/generate', {
      method: 'POST',
      headers: {
        'X-API-KEY': HEYGEN_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        video_inputs: [
          {
            character: {
              type: 'avatar',
              avatar_id: process.env.NEXT_PUBLIC_HEYGEN_AVATAR_ID || 'default_avatar',
              scale: 1.0,
              offset: { x: 0, y: 0 }
            },
            voice: {
              type: 'text',
              input_text: `${script.hook} ${script.solution}`,
              voice_id: process.env.NEXT_PUBLIC_HEYGEN_VOICE_ID || 'default_voice',
              speed: 1.0
            },
            background: {
              type: 'color',
              value: '#f8f9fa'
            }
          }
        ],
        dimension: {
          width: 1920,
          height: 1080
        },
        aspect_ratio: '16:9'
      })
    })

    if (response.ok) {
      const data = await response.json()
      
      // Poll for completion
      const videoUrl = await pollForVideoCompletion(data.video_id, HEYGEN_API_KEY)
      
      return {
        url: videoUrl,
        duration: 20,
        videoId: data.video_id,
        status: 'completed'
      }
    }
  } catch (error) {
    console.error('HeyGen video generation failed:', error)
  }

  // Fallback placeholder
  return {
    url: `https://placeholder-video.com/ai-face-${lead.id}`,
    duration: 20,
    isPlaceholder: true
  }
}

const pollForVideoCompletion = async (videoId, apiKey) => {
  const maxAttempts = 30
  let attempts = 0

  while (attempts < maxAttempts) {
    try {
      const response = await fetch(`https://api.heygen.com/v1/video_status/${videoId}`, {
        headers: { 'X-API-KEY': apiKey }
      })

      if (response.ok) {
        const data = await response.json()
        
        if (data.status === 'completed') {
          return data.video_url
        } else if (data.status === 'failed') {
          throw new Error('Video generation failed')
        }
      }

      await new Promise(resolve => setTimeout(resolve, 2000))
      attempts++
    } catch (error) {
      console.error('Polling error:', error)
      break
    }
  }

  throw new Error('Video generation timeout')
}

// 🎬 Video Merging and Composition
const mergeVideoComponents = async (screenRecording, aiVideo, lead) => {
  // This would typically use FFmpeg or similar video processing
  // For now, we'll create a composition plan
  
  const composition = {
    duration: 30,
    scenes: [
      {
        type: 'ai_face',
        start: 0,
        duration: 5,
        source: aiVideo.url,
        text: 'Hook delivery',
        position: 'center'
      },
      {
        type: 'screen_recording',
        start: 5,
        duration: 15,
        source: screenRecording.url,
        overlay: {
          type: 'voiceover',
          text: 'Screen analysis narration'
        },
        highlights: screenRecording.highlights || []
      },
      {
        type: 'ai_face',
        start: 20,
        duration: 10,
        source: aiVideo.url,
        text: 'Solution and CTA',
        position: 'center',
        cta: {
          text: 'Free Audit →',
          link: `https://calendly.com/your-calendar?lead=${lead.id}`
        }
      }
    ],
    transitions: [
      { type: 'fade', duration: 0.5 },
      { type: 'slide', duration: 0.3 }
    ]
  }

  // In production, this would actually merge the videos
  // For now, return the composition plan
  return {
    url: `https://generated-video.com/final-${lead.id}`,
    composition: composition,
    duration: 30,
    status: 'ready'
  }
}

// 📤 Video Upload and Storage
const uploadVideoToStorage = async (videoData, lead) => {
  // This would upload to your preferred storage (AWS S3, Cloudinary, etc.)
  // For now, simulate the upload
  
  const videoUrl = `https://your-storage.com/videos/lead-${lead.id}-${Date.now()}.mp4`
  
  return {
    url: videoUrl,
    thumbnailUrl: `https://your-storage.com/thumbnails/lead-${lead.id}.jpg`,
    duration: videoData.duration,
    size: '2.5MB',
    format: 'mp4',
    uploadedAt: new Date()
  }
}

// 📊 Video Analytics and Tracking
export const trackVideoEngagement = async (videoId, eventType, data = {}) => {
  try {
    // Track video interactions
    const analytics = {
      videoId: videoId,
      event: eventType, // 'view', 'play', 'pause', 'complete', 'click'
      timestamp: new Date(),
      data: data
    }

    // Send to analytics service
    await fetch('/api/video-analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(analytics)
    })

    console.log(`📊 Video event tracked: ${eventType} for ${videoId}`)
  } catch (error) {
    console.error('Video tracking failed:', error)
  }
}

// 🎯 Video Trigger Logic
export const shouldGenerateVideo = (lead) => {
  // Only generate videos for high-value leads
  if (lead.tier > 2) return false
  if (lead.opportunity.score < 80) return false
  if (!lead.contact.email) return false

  // Check if lead has high-urgency pain points
  const urgentPainPoints = [
    'cart_abandonment',
    'poor_ad_performance', 
    'revenue_loss'
  ]

  const hasUrgentPain = lead.opportunity.painPoints.some(pain => 
    urgentPainPoints.some(urgent => pain.toLowerCase().includes(urgent))
  )

  return hasUrgentPain
}

// 📧 Video Email Integration
export const createVideoEmail = (lead, videoData) => {
  const subject = lead.tier === 1 
    ? `${lead.company.name} - 1 step away from 2X revenue` 
    : `Quick ${lead.company.platform} optimization for ${lead.company.name}`

  const emailTemplate = `Hi ${lead.contact.firstName},

I noticed ${lead.company.name} ${lead.opportunity.painPoints[0]?.toLowerCase() || 'could optimize their conversion rate'}.

I recorded a quick video showing exactly what I found and how to fix it:

[VIDEO THUMBNAIL - CLICK TO PLAY]
${videoData.url}

This specific issue cost another ${lead.company.platform} store $18k/month until we fixed it.

Want a free audit of your full funnel?

Best regards,
Muhammad Saim

P.S. The fix takes about 10 minutes to implement.`

  return {
    to: lead.contact.email,
    subject: subject,
    body: emailTemplate,
    videoUrl: videoData.url,
    videoThumbnail: videoData.thumbnailUrl,
    trackingId: `video_${lead.id}_${Date.now()}`
  }
}

// Export main functions
export {
  generateAIVideo,
  shouldGenerateVideo,
  createVideoEmail,
  trackVideoEngagement
}