import { PhantomBusterAutomation } from '@/lib/phantombuster-automation'

export async function POST(request) {
  try {
    const { campaignId } = await request.json()
    const campaign = appStore.getCampaign(campaignId)
    
    const phantom = new PhantomBusterAutomation()
    const result = await phantom.launchLinkedInAutomation(campaign)
    
    // Store automation job ID for later retrieval
    appStore.updateCampaign(campaignId, {
      phantomBusterJob: {
        containerId: result.containerId,
        status: 'running',
        startedAt: new Date()
      }
    })

    return Response.json({
      success: true,
      containerId: result.containerId,
      message: 'PhantomBuster automation started'
    })

  } catch (error) {
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}