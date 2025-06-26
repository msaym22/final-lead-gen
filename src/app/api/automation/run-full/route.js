// Replace entire file with this:
import { HybridExtensionSystem } from '@/lib/hybrid-extension-system';
import { appStore } from '@/lib/store';

export async function POST(request) {
  try {
    const { campaignId } = await request.json();
    const campaign = appStore.getCampaign(campaignId);
    
    if (!campaign) {
      return Response.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // const system = new HybridExtensionSystem();
    // Add near the top:
    const system = new HybridExtensionSystem();
    if (campaign.researchVideos) {
    results.youtubeResearch = await system.youtubeResearcher?.searchByIndustry(campaign.targetIndustry);
    }
    
    // YouTube pre-check
    if (campaign.researchVideos && !system.youtubeResearcher) {
      return Response.json({
        error: 'YouTube API key missing',
        solution: 'Add NEXT_PUBLIC_YOUTUBE_API_KEY to .env'
      }, { status: 400 });
    }

    const results = await system.runAutomatedDiscovery(campaign);
    
    // Store YouTube results
    if (results.youtubeResearch) {
      appStore.trackYoutubeResearch(campaignId, results.youtubeResearch);
    }

    return Response.json(results);
  } catch (error) {
    return Response.json({
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}