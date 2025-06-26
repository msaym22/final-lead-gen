export class PhantomBusterAutomation {
  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_PHANTOM_BUSTER_API_KEY
    this.baseUrl = 'https://api.phantombuster.com/api/v2'
  }

  async launchLinkedInAutomation(campaign) {
    const response = await fetch(`${this.baseUrl}/agents/launch`, {
      method: 'POST',
      headers: {
        'X-Phantombuster-Key': this.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id: process.env.NEXT_PUBLIC_PHANTOM_SALES_NAV_AGENT_ID,
        argument: {
          searches: [`${campaign.targetIndustry} owner`],
          numberOfProfiles: campaign.dailyTarget * 2
        }
      })
    })

    return await response.json()
  }

  async getAutomationResults(containerId) {
    const response = await fetch(`${this.baseUrl}/containers/fetch-result-object?id=${containerId}`, {
      headers: {
        'X-Phantombuster-Key': this.apiKey
      }
    })

    return await response.json()
  }
}