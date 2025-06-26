import { YoutubeResearcher } from '@/lib/youtube.js';

export async function GET() {
  try {
    // Check YouTube API connection
    let youtubeStatus = {
      connected: false,
      error: null
    };
    
    if (process.env.NEXT_PUBLIC_YOUTUBE_API_KEY) {
      try {
        const youtube = new YoutubeResearcher();
        const validation = await youtube.validateConnection();
        youtubeStatus = {
          connected: validation.success,
          quotaUsed: validation.quotaUsed,
          error: validation.error
        };
      } catch (e) {
        youtubeStatus.error = e.message;
      }
    }

    const capabilities = {
      youtube: youtubeStatus.connected,
      serper: !!process.env.NEXT_PUBLIC_SERPER_API_KEY,
      hunter: !!process.env.NEXT_PUBLIC_HUNTER_API_KEY,
      phantomBuster: !!process.env.NEXT_PUBLIC_PHANTOM_BUSTER_API_KEY,
      automationReady: false // Will be set below
    };

    capabilities.automationReady = (
      capabilities.youtube &&
      capabilities.serper &&
      capabilities.hunter
    );

    return Response.json({
      success: true,
      capabilities,
      details: {
        youtube: youtubeStatus,
        recommendations: [
          ...(!capabilities.youtube ? ['Add YouTube API key to enable video research'] : []),
          ...(!capabilities.serper ? ['Serper API key required for search automation'] : []),
          ...(!capabilities.hunter ? ['Hunter.io API key required for email automation'] : [])
        ]
      }
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}