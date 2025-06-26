import puppeteer from 'puppeteer'
import cheerio from 'cheerio'
import axios from 'axios'

export class WebScraper {
  constructor() {
    this.browser = null
    this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  }

  async initBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-features=VizDisplayCompositor'
        ]
      })
    }
    return this.browser
  }

  async closeBrowser() {
    if (this.browser) {
      await this.browser.close()
      this.browser = null
    }
  }

  async analyzeWebsite(url) {
    try {
      console.log(`Analyzing website: ${url}`)
      
      const browser = await this.initBrowser()
      const page = await browser.newPage()
      
      await page.setUserAgent(this.userAgent)
      await page.setViewport({ width: 1366, height: 768 })

      // Performance timing
      const startTime = Date.now()
      
      try {
        await page.goto(url, { 
          waitUntil: 'domcontentloaded', 
          timeout: 30000 
        })
      } catch (error) {
        console.error(`Failed to load ${url}:`, error)
        return this.getErrorAnalysis(url, error.message)
      }

      const loadTime = Date.now() - startTime

      // Extract page content
      const content = await page.content()
      const $ = cheerio.load(content)

      // Analyze various aspects
      const analysis = {
        url,
        analyzedAt: new Date(),
        pageSpeed: {
          loadTime,
          score: this.calculateSpeedScore(loadTime)
        },
        seo: await this.analyzeSEO($, page),
        marketing: await this.analyzeMarketing($, page),
        technical: await this.analyzeTechnical($, page),
        content: await this.analyzeContent($),
        social: this.analyzeSocialPresence($),
        competitors: await this.findCompetitorSigns($),
        opportunities: []
      }

      // Generate opportunity insights
      analysis.opportunities = this.generateOpportunities(analysis)
      
      // Calculate overall scores
      analysis.overallScore = this.calculateOverallScore(analysis)

      await page.close()
      
      return analysis

    } catch (error) {
      console.error(`Website analysis error for ${url}:`, error)
      return this.getErrorAnalysis(url, error.message)
    }
  }

  async analyzeSEO($, page) {
    try {
      const seoAnalysis = {
        title: $('title').text() || '',
        metaDescription: $('meta[name="description"]').attr('content') || '',
        h1Tags: $('h1').length,
        h2Tags: $('h2').length,
        images: $('img').length,
        imagesWithAlt: $('img[alt]').length,
        internalLinks: $('a[href^="/"], a[href*="' + page.url() + '"]').length,
        externalLinks: $('a[href^="http"]:not([href*="' + page.url() + '"])').length,
        hasRobotsMeta: $('meta[name="robots"]').length > 0,
        hasCanonical: $('link[rel="canonical"]').length > 0,
        hasSchema: $('script[type="application/ld+json"]').length > 0
      }

      // Calculate SEO score
      let score = 0
      if (seoAnalysis.title.length > 30 && seoAnalysis.title.length < 60) score += 20
      if (seoAnalysis.metaDescription.length > 120 && seoAnalysis.metaDescription.length < 160) score += 20
      if (seoAnalysis.h1Tags === 1) score += 15
      if (seoAnalysis.h2Tags >= 2) score += 10
      if (seoAnalysis.imagesWithAlt / seoAnalysis.images > 0.8) score += 15
      if (seoAnalysis.hasCanonical) score += 10
      if (seoAnalysis.hasSchema) score += 10

      seoAnalysis.score = Math.min(score, 100)
      seoAnalysis.issues = this.identifySEOIssues(seoAnalysis)

      return seoAnalysis
    } catch (error) {
      console.error('SEO analysis error:', error)
      return { score: 0, issues: ['Failed to analyze SEO'] }
    }
  }

  async analyzeMarketing($, page) {
    try {
      const marketingAnalysis = {
        hasGoogleAnalytics: false,
        hasGoogleTagManager: false,
        hasFacebookPixel: false,
        hasLinkedInInsight: false,
        hasHotjar: false,
        hasIntercom: false,
        hasEmailSignup: false,
        hasLeadMagnets: false,
        hasChatWidget: false,
        hasRetargeting: false,
        conversionElements: 0,
        ctaButtons: 0
      }

      const htmlContent = $.html()
      
      // Check for tracking scripts
      marketingAnalysis.hasGoogleAnalytics = /gtag|google-analytics|ga\.js/i.test(htmlContent)
      marketingAnalysis.hasGoogleTagManager = /googletagmanager/i.test(htmlContent)
      marketingAnalysis.hasFacebookPixel = /facebook\.net\/tr|fbq\(/i.test(htmlContent)
      marketingAnalysis.hasLinkedInInsight = /linkedin\.com\/li\.lms-analytics/i.test(htmlContent)
      marketingAnalysis.hasHotjar = /hotjar/i.test(htmlContent)
      marketingAnalysis.hasIntercom = /intercom/i.test(htmlContent)

      // Check for conversion elements
      marketingAnalysis.hasEmailSignup = $('input[type="email"], input[name*="email"]').length > 0
      marketingAnalysis.hasLeadMagnets = $('*:contains("download"), *:contains("free"), *:contains("ebook")').length > 3
      marketingAnalysis.hasChatWidget = $('[class*="chat"], [id*="chat"], [class*="messenger"]').length > 0
      
      // Count CTA buttons
      marketingAnalysis.ctaButtons = $('button, input[type="submit"], a[class*="btn"], a[class*="button"]').length

      // Check for retargeting pixels
      marketingAnalysis.hasRetargeting = marketingAnalysis.hasFacebookPixel || 
        /bing\.com|doubleclick\.net|googlesyndication/i.test(htmlContent)

      // Calculate marketing score
      let score = 0
      if (marketingAnalysis.hasGoogleAnalytics) score += 15
      if (marketingAnalysis.hasGoogleTagManager) score += 10
      if (marketingAnalysis.hasFacebookPixel) score += 15
      if (marketingAnalysis.hasEmailSignup) score += 20
      if (marketingAnalysis.hasLeadMagnets) score += 15
      if (marketingAnalysis.ctaButtons >= 3) score += 15
      if (marketingAnalysis.hasRetargeting) score += 10

      marketingAnalysis.score = Math.min(score, 100)
      marketingAnalysis.issues = this.identifyMarketingIssues(marketingAnalysis)

      return marketingAnalysis
    } catch (error) {
      console.error('Marketing analysis error:', error)
      return { score: 0, issues: ['Failed to analyze marketing setup'] }
    }
  }

  async analyzeTechnical($, page) {
    try {
      const technicalAnalysis = {
        isHttps: page.url().startsWith('https://'),
        hasSSLCert: true, // Assume true if HTTPS works
        mobileFriendly: false,
        hasServiceWorker: false,
        pageSize: 0,
        resourceCount: 0,
        jsErrors: 0
      }

      // Check viewport meta tag for mobile friendliness
      technicalAnalysis.mobileFriendly = $('meta[name="viewport"]').length > 0

      // Count resources
      technicalAnalysis.resourceCount = $('script, link[rel="stylesheet"], img').length

      // Check for service worker
      const htmlContent = $.html()
      technicalAnalysis.hasServiceWorker = /serviceWorker|sw\.js/i.test(htmlContent)

      // Calculate technical score
      let score = 0
      if (technicalAnalysis.isHttps) score += 25
      if (technicalAnalysis.mobileFriendly) score += 25
      if (technicalAnalysis.resourceCount < 50) score += 25
      if (technicalAnalysis.hasServiceWorker) score += 25

      technicalAnalysis.score = Math.min(score, 100)
      technicalAnalysis.issues = this.identifyTechnicalIssues(technicalAnalysis)

      return technicalAnalysis
    } catch (error) {
      console.error('Technical analysis error:', error)
      return { score: 0, issues: ['Failed to analyze technical setup'] }
    }
  }

  async analyzeContent($) {
    try {
      const contentAnalysis = {
        wordCount: 0,
        headingStructure: {
          h1: $('h1').length,
          h2: $('h2').length,
          h3: $('h3').length
        },
        hasBlog: false,
        hasTestimonials: false,
        hasCaseStudies: false,
        hasAboutPage: false,
        hasContactPage: false,
        hasPricing: false
      }

      // Count words in main content
      const textContent = $('body').text().replace(/\s+/g, ' ').trim()
      contentAnalysis.wordCount = textContent.split(' ').length

      // Check for key pages and content types
      const links = $('a').map((i, el) => $(el).attr('href')).get()
      const linkText = $('a').map((i, el) => $(el).text().toLowerCase()).get()
      
      contentAnalysis.hasBlog = links.some(href => 
        href && (href.includes('/blog') || href.includes('/news') || href.includes('/articles'))
      )
      
      contentAnalysis.hasAboutPage = linkText.some(text => 
        text.includes('about') || text.includes('our story')
      )
      
      contentAnalysis.hasContactPage = linkText.some(text => 
        text.includes('contact') || text.includes('get in touch')
      )
      
      contentAnalysis.hasPricing = linkText.some(text => 
        text.includes('pricing') || text.includes('plans')
      )

      // Check for testimonials and case studies
      const bodyText = $('body').text().toLowerCase()
      contentAnalysis.hasTestimonials = /testimonial|review|feedback|".*said/i.test(bodyText)
      contentAnalysis.hasCaseStudies = /case study|success story|customer story/i.test(bodyText)

      // Calculate content score
      let score = 0
      if (contentAnalysis.wordCount > 300) score += 15
      if (contentAnalysis.hasBlog) score += 20
      if (contentAnalysis.hasTestimonials) score += 15
      if (contentAnalysis.hasAboutPage) score += 10
      if (contentAnalysis.hasContactPage) score += 10
      if (contentAnalysis.hasPricing) score += 15
      if (contentAnalysis.headingStructure.h1 === 1) score += 15

      contentAnalysis.score = Math.min(score, 100)
      contentAnalysis.issues = this.identifyContentIssues(contentAnalysis)

      return contentAnalysis
    } catch (error) {
      console.error('Content analysis error:', error)
      return { score: 0, issues: ['Failed to analyze content'] }
    }
  }

  analyzeSocialPresence($) {
    try {
      const socialAnalysis = {
        platforms: [],
        socialLinks: 0,
        hasOpenGraph: false,
        hasTwitterCards: false
      }

      // Find social media links
      const socialPlatforms = {
        facebook: /facebook\.com/i,
        twitter: /twitter\.com|x\.com/i,
        linkedin: /linkedin\.com/i,
        instagram: /instagram\.com/i,
        youtube: /youtube\.com/i,
        tiktok: /tiktok\.com/i
      }

      $('a[href]').each((i, el) => {
        const href = $(el).attr('href')
        Object.entries(socialPlatforms).forEach(([platform, regex]) => {
          if (regex.test(href) && !socialAnalysis.platforms.includes(platform)) {
            socialAnalysis.platforms.push(platform)
            socialAnalysis.socialLinks++
          }
        })
      })

      // Check for Open Graph and Twitter Cards
      socialAnalysis.hasOpenGraph = $('meta[property^="og:"]').length > 0
      socialAnalysis.hasTwitterCards = $('meta[name^="twitter:"]').length > 0

      return socialAnalysis
    } catch (error) {
      console.error('Social analysis error:', error)
      return { platforms: [], socialLinks: 0 }
    }
  }

  async findCompetitorSigns($) {
    try {
      const bodyText = $('body').text().toLowerCase()
      const competitors = []

      // Look for mentions of competitor tools or platforms
      const competitorKeywords = [
        'hubspot', 'salesforce', 'marketo', 'mailchimp', 'constant contact',
        'google ads', 'facebook ads', 'linkedin ads', 'shopify', 'wordpress'
      ]

      competitorKeywords.forEach(keyword => {
        if (bodyText.includes(keyword)) {
          competitors.push(keyword)
        }
      })

      return competitors
    } catch (error) {
      console.error('Competitor analysis error:', error)
      return []
    }
  }

  calculateSpeedScore(loadTime) {
    if (loadTime < 2000) return 100
    if (loadTime < 3000) return 85
    if (loadTime < 4000) return 70
    if (loadTime < 5000) return 55
    return 30
  }

  calculateOverallScore(analysis) {
    const weights = {
      seo: 0.25,
      marketing: 0.30,
      technical: 0.25,
      content: 0.20
    }

    return Math.round(
      (analysis.seo.score * weights.seo) +
      (analysis.marketing.score * weights.marketing) +
      (analysis.technical.score * weights.technical) +
      (analysis.content.score * weights.content)
    )
  }

  generateOpportunities(analysis) {
    const opportunities = []

    // SEO opportunities
    if (analysis.seo.score < 70) {
      opportunities.push({
        category: 'SEO',
        priority: 'high',
        issue: 'Poor SEO optimization',
        opportunity: 'Improve search engine visibility',
        estimatedImpact: 'High',
        details: analysis.seo.issues
      })
    }

    // Marketing opportunities
    if (!analysis.marketing.hasGoogleAnalytics) {
      opportunities.push({
        category: 'Analytics',
        priority: 'high',
        issue: 'No Google Analytics tracking',
        opportunity: 'Implement proper analytics tracking',
        estimatedImpact: 'High'
      })
    }

    if (!analysis.marketing.hasFacebookPixel) {
      opportunities.push({
        category: 'Retargeting',
        priority: 'medium',
        issue: 'No Facebook Pixel installed',
        opportunity: 'Setup retargeting campaigns',
        estimatedImpact: 'Medium'
      })
    }

    if (!analysis.marketing.hasEmailSignup) {
      opportunities.push({
        category: 'Lead Generation',
        priority: 'high',
        issue: 'No email capture system',
        opportunity: 'Implement email marketing funnel',
        estimatedImpact: 'High'
      })
    }

    // Technical opportunities
    if (analysis.pageSpeed.score < 70) {
      opportunities.push({
        category: 'Performance',
        priority: 'medium',
        issue: 'Slow page load speed',
        opportunity: 'Optimize website performance',
        estimatedImpact: 'Medium'
      })
    }

    return opportunities
  }

  identifySEOIssues(seoAnalysis) {
    const issues = []
    if (!seoAnalysis.title || seoAnalysis.title.length < 30) issues.push('Title tag too short or missing')
    if (!seoAnalysis.metaDescription || seoAnalysis.metaDescription.length < 120) issues.push('Meta description missing or too short')
    if (seoAnalysis.h1Tags !== 1) issues.push('Should have exactly one H1 tag')
    if (seoAnalysis.imagesWithAlt / seoAnalysis.images < 0.8) issues.push('Many images missing alt text')
    if (!seoAnalysis.hasCanonical) issues.push('Missing canonical URL')
    return issues
  }

  identifyMarketingIssues(marketingAnalysis) {
    const issues = []
    if (!marketingAnalysis.hasGoogleAnalytics) issues.push('Google Analytics not installed')
    if (!marketingAnalysis.hasFacebookPixel) issues.push('Facebook Pixel missing')
    if (!marketingAnalysis.hasEmailSignup) issues.push('No email capture system')
    if (marketingAnalysis.ctaButtons < 3) issues.push('Insufficient call-to-action buttons')
    if (!marketingAnalysis.hasRetargeting) issues.push('No retargeting pixels found')
    return issues
  }

  identifyTechnicalIssues(technicalAnalysis) {
    const issues = []
    if (!technicalAnalysis.isHttps) issues.push('Not using HTTPS')
    if (!technicalAnalysis.mobileFriendly) issues.push('Not mobile-friendly')
    if (technicalAnalysis.resourceCount > 50) issues.push('Too many resources loading')
    return issues
  }

  identifyContentIssues(contentAnalysis) {
    const issues = []
    if (contentAnalysis.wordCount < 300) issues.push('Insufficient content')
    if (!contentAnalysis.hasBlog) issues.push('No blog or content section')
    if (!contentAnalysis.hasTestimonials) issues.push('No social proof/testimonials')
    if (!contentAnalysis.hasAboutPage) issues.push('Missing about page')
    if (!contentAnalysis.hasContactPage) issues.push('Missing contact information')
    return issues
  }

  getErrorAnalysis(url, errorMessage) {
    return {
      url,
      error: true,
      errorMessage,
      analyzedAt: new Date(),
      overallScore: 0,
      opportunities: [{
        category: 'Technical',
        priority: 'critical',
        issue: 'Website inaccessible',
        opportunity: 'Fix website accessibility issues',
        estimatedImpact: 'Critical'
      }]
    }
  }
}