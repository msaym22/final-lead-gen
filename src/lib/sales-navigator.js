export class SalesNavigatorIntegration {
  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_PHANTOM_BUSTER_API_KEY
    this.baseUrl = 'https://api.phantombuster.com/api/v2'
  }

  // Get list of available phantoms
  async getPhantoms() {
    const response = await fetch(`${this.baseUrl}/agents/fetch-all`, {
      headers: {
        'X-Phantombuster-Key': this.apiKey
      }
    })
    return await response.json()
  }

  // Launch Sales Navigator Search phantom
  async searchSalesNavigator(searchCriteria) {
    const phantom = await this.findSalesNavPhantom()
    if (!phantom) {
      throw new Error('Sales Navigator phantom not found. Please set it up in PhantomBuster.')
    }

    const response = await fetch(`${this.baseUrl}/agents/launch`, {
      method: 'POST',
      headers: {
        'X-Phantombuster-Key': this.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id: phantom.id,
        argument: this.buildSearchArgument(searchCriteria)
      })
    })

    const result = await response.json()
    return result
  }

  // Build search argument for Sales Navigator
  buildSearchArgument(criteria) {
    const searchUrl = this.buildSalesNavSearchUrl(criteria)
    
    return {
      searches: [searchUrl],
      numberOfLinesPerLaunch: criteria.maxResults || 25,
      numberOfResultsPerSearch: criteria.maxResults || 25,
      csvName: `sales_nav_${criteria.industry}_${Date.now()}`,
      hunterApiKey: process.env.NEXT_PUBLIC_HUNTER_API_KEY, // For email finding
      extractEmails: true,
      message: `Searching for ${criteria.industry} professionals`
    }
  }

  // Build Sales Navigator search URL
  buildSalesNavSearchUrl(criteria) {
    const baseUrl = 'https://www.linkedin.com/sales/search/people'
    const params = new URLSearchParams()

    // Industry filter
    if (criteria.industry) {
      params.append('industryIncluded', this.getIndustryCode(criteria.industry))
    }

    // Company size filter
    if (criteria.companySize) {
      params.append('companySize', this.getCompanySizeCode(criteria.companySize))
    }

    // Location filter
    if (criteria.location) {
      params.append('geoIncluded', this.getLocationCode(criteria.location))
    }

    // Job titles
    if (criteria.titles && criteria.titles.length > 0) {
      params.append('titleIncluded', criteria.titles.join(','))
    }

    // Keywords
    if (criteria.keywords) {
      params.append('keywords', criteria.keywords)
    }

    return `${baseUrl}?${params.toString()}`
  }

  // Find Sales Navigator phantom in user's account
  async findSalesNavPhantom() {
    const phantoms = await this.getPhantoms()
    return phantoms.data?.find(p => 
      p.name.toLowerCase().includes('sales navigator') ||
      p.name.toLowerCase().includes('linkedin sales')
    )
  }

  // Get phantom results
  async getResults(phantomId, containerId) {
    const response = await fetch(`${this.baseUrl}/agents/fetch-result-object`, {
      method: 'POST',
      headers: {
        'X-Phantombuster-Key': this.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id: phantomId,
        containerId: containerId
      })
    })

    return await response.json()
  }

  // Check phantom status
  async checkStatus(phantomId, containerId) {
    const response = await fetch(`${this.baseUrl}/agents/fetch-status`, {
      method: 'POST',
      headers: {
        'X-Phantombuster-Key': this.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id: phantomId,
        containerId: containerId
      })
    })

    return await response.json()
  }

  // Helper: Get industry codes for Sales Navigator
  getIndustryCode(industry) {
    const industryCodes = {
      'SaaS': '96,4',
      'Software': '96',
      'E-commerce': '27,96',
      'Healthcare': '14',
      'Real Estate': '44',
      'Fintech': '43,129',
      'Education': '69',
      'Manufacturing': '25',
      'Consulting': '104',
      'Professional Services': '104',
      'Food & Beverage': '34',
      'Fitness & Wellness': '124,14',
      'Legal Services': '10'
    }
    return industryCodes[industry] || '96'
  }

  // Helper: Get company size codes
  getCompanySizeCode(size) {
    const sizeCodes = {
      '1-10': 'A',
      '5-25': 'B', 
      '10-50': 'C',
      '20-100': 'D',
      '50-200': 'E',
      '100-500': 'F',
      '500-1000': 'G',
      '1000+': 'H,I,J'
    }
    return sizeCodes[size] || 'C'
  }

  // Helper: Get location codes (simplified)
  getLocationCode(location) {
    const locationCodes = {
      'United States': '103644278',
      'Canada': '101174742', 
      'United Kingdom': '101165590',
      'Australia': '101452733'
    }
    return locationCodes[location] || '103644278'
  }
}