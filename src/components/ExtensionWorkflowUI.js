// components/ExtensionWorkflowUI.js
// UI component for managing extension-based data enhancement

'use client'
import { useState } from 'react'
import { Download, Upload, CheckCircle, Clock, ExternalLink, FileText, 
         Users, Settings, Play, Pause, RefreshCw } from 'lucide-react'

export function ExtensionWorkflowUI({ campaign, onDataImport, onWorkflowUpdate }) {
  const [activeTab, setActiveTab] = useState('overview')
  const [importData, setImportData] = useState('')
  const [importType, setImportType] = useState('wappalyzer')
  const [workflow, setWorkflow] = useState(null)
  const [importing, setImporting] = useState(false)

  // Mock workflow data (replace with actual workflow from your system)
  const mockWorkflow = {
    totalSites: 23,
    wappalyzerSites: 23,
    hunterSites: 18,
    linkedinSites: 15,
    estimatedTime: 45,
    completedSteps: 0,
    status: 'pending'
  }

  const handleDataImport = async () => {
    if (!importData.trim()) {
      alert('Please paste your CSV data')
      return
    }

    setImporting(true)
    try {
      const result = await onDataImport(importType, importData, campaign.id)
      alert(`✅ Import successful!\n\n${result.importedRecords} records imported\n${result.mergedRecords} leads enhanced\nAverage score increase: +${result.enhancementSummary?.averageScoreIncrease || 0} points`)
      setImportData('')
      onWorkflowUpdate()
    } catch (error) {
      alert(`❌ Import failed: ${error.message}`)
    } finally {
      setImporting(false)
    }
  }

  const downloadWorkflowInstructions = () => {
    const instructions = generateDetailedInstructions(mockWorkflow)
    const blob = new Blob([instructions], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${campaign.name}_extension_workflow.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const generateDetailedInstructions = (workflow) => {
    return `
EXTENSION ENHANCEMENT WORKFLOW
Campaign: ${campaign.name}
Industry: ${campaign.targetIndustry}
Generated: ${new Date().toLocaleString()}

═══════════════════════════════════════════════════════════════════

📋 OVERVIEW:
• Total sites to enhance: ${workflow.totalSites}
• Estimated time: ${workflow.estimatedTime} minutes
• Enhancement steps: 3 (Wappalyzer, Hunter, LinkedIn)

═══════════════════════════════════════════════════════════════════

🔧 STEP 1: WAPPALYZER TECHNOLOGY DETECTION (${workflow.wappalyzerSites} sites)

1. Install Wappalyzer browser extension:
   https://chrome.google.com/webstore/detail/wappalyzer/gppongmhjkpfnbhagpmjfkannfbllamg

2. Visit each website and collect technology data:
   ${campaign.leads?.slice(0, 5).map(lead => `   • ${lead.company?.website || 'N/A'} (${lead.company?.name})`).join('\n') || '   • Sites will be provided after discovery'}

3. For each site, note:
   - E-commerce platform (Shopify, WooCommerce, etc.)
   - Analytics tools (Google Analytics, Facebook Pixel)
   - Email marketing (Klaviyo, Mailchimp, etc.)
   - Payment processors (Stripe, PayPal, etc.)

4. Create CSV with columns:
   Domain, E-commerce, Analytics, Email_Marketing, Payments

5. Import data using the "Import Wappalyzer Data" button

Expected enhancement: +15 opportunity score per store

═══════════════════════════════════════════════════════════════════

📧 STEP 2: HUNTER.IO EMAIL ENHANCEMENT (${workflow.hunterSites} sites)

1. Install Hunter.io browser extension:
   https://chrome.google.com/webstore/detail/hunter/hgmhmanijnjhaffoampdlllchpolkdnj

2. Visit each company website and:
   - Click Hunter extension icon
   - Find Owner/Founder/Marketing Manager emails
   - Verify existing email addresses
   - Note confidence scores

3. Create CSV with columns:
   Domain, Email, First_Name, Last_Name, Title, Confidence, Verified

4. Import using "Import Hunter Data" button

Expected enhancement: +10-20 opportunity score per verified contact

═══════════════════════════════════════════════════════════════════

👔 STEP 3: LINKEDIN CONTACT RESEARCH (${workflow.linkedinSites} sites)

1. Use LinkedIn Sales Navigator or regular LinkedIn

2. For each company, search for:
   - Company name + "Owner"
   - Company name + "Founder"  
   - Company name + "Marketing Manager"
   - Company name + "E-commerce Manager"

3. Collect data:
   - Name, Title, LinkedIn URL
   - Location, Experience level
   - Direct contact info if available

4. Create CSV with columns:
   Company, Name, Title, LinkedIn_URL, Location, Experience

5. Import using "Import LinkedIn Data" button

Expected enhancement: +8-15 opportunity score per LinkedIn contact

═══════════════════════════════════════════════════════════════════

📊 IMPORT INSTRUCTIONS:

After collecting data from each extension:

1. Format as CSV (comma-separated values)
2. Include headers as specified above
3. Go to campaign page > Extension Workflow tab
4. Select data type (Wappalyzer, Hunter, or LinkedIn)
5. Paste CSV data in the text area
6. Click "Import Data"

The system will automatically:
• Match data to existing leads by domain/company name
• Enhance opportunity scores based on new data
• Generate improved personalized messages
• Identify new business opportunities

═══════════════════════════════════════════════════════════════════

⚡ TIME-SAVING TIPS:

1. Use browser bookmarks for quick access to extension features
2. Open multiple tabs and work in batches
3. Use keyboard shortcuts for faster data collection
4. Focus on highest-revenue potential stores first
5. Take screenshots for complex technology stacks

═══════════════════════════════════════════════════════════════════

📈 EXPECTED RESULTS:

After completing all steps:
• 40-60% increase in lead quality scores
• Platform-specific messaging insights
• Missing tool opportunities identified
• Verified contact information
• LinkedIn connections for outreach

Investment: ~${workflow.estimatedTime} minutes manual work
Return: 2-3x better response rates from enhanced personalization

═══════════════════════════════════════════════════════════════════

Need help? Check the campaign dashboard for real-time import status
and enhancement results.
`
  }

  return (
    <div className="bg-background-secondary border border-purple-600/30 rounded-lg">
      {/* Header */}
      <div className="p-4 border-b border-background-tertiary">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-semibold">Extension Enhancement Workflow</h3>
            <span className="text-xs bg-purple-600/20 text-purple-400 px-2 py-1 rounded">
              Hybrid System
            </span>
          </div>
          <button
            onClick={downloadWorkflowInstructions}
            className="btn-outline text-xs flex items-center gap-1"
          >
            <Download className="w-3 h-3" />
            Download Instructions
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-background-tertiary">
        {['overview', 'wappalyzer', 'hunter', 'linkedin', 'import'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
              activeTab === tab
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-foreground-muted hover:text-foreground'
            }`}
          >
            {tab === 'import' ? 'Import Data' : tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-4">
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="card text-center border-blue-600/30">
                <p className="text-2xl font-bold text-blue-400">{mockWorkflow.totalSites}</p>
                <p className="text-sm text-foreground-muted">Sites to Enhance</p>
              </div>
              <div className="card text-center border-purple-600/30">
                <p className="text-2xl font-bold text-purple-400">{mockWorkflow.estimatedTime}m</p>
                <p className="text-sm text-foreground-muted">Estimated Time</p>
              </div>
              <div className="card text-center border-green-600/30">
                <p className="text-2xl font-bold text-green-400">{mockWorkflow.completedSteps}/3</p>
                <p className="text-sm text-foreground-muted">Steps Completed</p>
              </div>
              <div className="card text-center border-yellow-600/30">
                <p className="text-2xl font-bold text-yellow-400">+25%</p>
                <p className="text-sm text-foreground-muted">Expected Score Boost</p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-600/30 rounded-lg p-4">
              <h4 className="font-medium text-purple-300 mb-3">🔄 Hybrid Enhancement Process</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h5 className="text-sm font-medium text-green-300 mb-2">✅ Already Automated:</h5>
                  <ul className="text-xs text-green-200 space-y-1">
                    <li>• Store discovery (Serper API)</li>
                    <li>• Email verification (Hunter API)</li>
                    <li>• Company logos (Clearbit)</li>
                    <li>• YouTube industry research</li>
                    <li>• Basic technology simulation</li>
                  </ul>
                </div>
                <div>
                  <h5 className="text-sm font-medium text-purple-300 mb-2">🔧 Manual Enhancement:</h5>
                  <ul className="text-xs text-purple-200 space-y-1">
                    <li>• Real technology detection (Wappalyzer)</li>
                    <li>• Additional email discovery (Hunter ext)</li>
                    <li>• LinkedIn contact research</li>
                    <li>• Technology gap analysis</li>
                    <li>• Decision maker identification</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-600/10 border border-blue-600/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Settings className="w-4 h-4 text-blue-400" />
                  <h4 className="font-medium text-blue-300">Step 1: Wappalyzer</h4>
                </div>
                <p className="text-xs text-blue-200 mb-3">Detect real technology stacks on {mockWorkflow.wappalyzerSites} stores</p>
                <div className="text-xs">
                  <p className="text-blue-300">Expected finds:</p>
                  <ul className="text-blue-200 mt-1 space-y-1">
                    <li>• E-commerce platforms</li>
                    <li>• Missing analytics tools</li>
                    <li>• Email marketing gaps</li>
                    <li>• Payment processors</li>
                  </ul>
                </div>
                <button className="btn-outline w-full mt-3 text-xs">
                  Start Wappalyzer Workflow
                </button>
              </div>

              <div className="bg-green-600/10 border border-green-600/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-green-400" />
                  <h4 className="font-medium text-green-300">Step 2: Hunter.io</h4>
                </div>
                <p className="text-xs text-green-200 mb-3">Find additional contacts for {mockWorkflow.hunterSites} companies</p>
                <div className="text-xs">
                  <p className="text-green-300">Expected finds:</p>
                  <ul className="text-green-200 mt-1 space-y-1">
                    <li>• Owner/founder emails</li>
                    <li>• Marketing managers</li>
                    <li>• Higher confidence scores</li>
                    <li>• Verified contacts</li>
                  </ul>
                </div>
                <button className="btn-outline w-full mt-3 text-xs">
                  Start Hunter Workflow
                </button>
              </div>

              <div className="bg-purple-600/10 border border-purple-600/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ExternalLink className="w-4 h-4 text-purple-400" />
                  <h4 className="font-medium text-purple-300">Step 3: LinkedIn</h4>
                </div>
                <p className="text-xs text-purple-200 mb-3">Research decision makers at {mockWorkflow.linkedinSites} companies</p>
                <div className="text-xs">
                  <p className="text-purple-300">Expected finds:</p>
                  <ul className="text-purple-200 mt-1 space-y-1">
                    <li>• LinkedIn profiles</li>
                    <li>• Job titles & experience</li>
                    <li>• Company insights</li>
                    <li>• Direct connections</li>
                  </ul>
                </div>
                <button className="btn-outline w-full mt-3 text-xs">
                  Start LinkedIn Research
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'wappalyzer' && (
          <div className="space-y-4">
            <div className="bg-blue-600/20 border border-blue-600/30 rounded-lg p-4">
              <h4 className="font-medium text-blue-300 mb-3 flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Wappalyzer Technology Detection
              </h4>
              <p className="text-sm text-blue-200 mb-4">
                Visit each store website with the Wappalyzer extension to detect real technology stacks and identify opportunities.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h5 className="font-medium text-blue-300 mb-2">🔧 Setup Instructions:</h5>
                  <ol className="text-xs text-blue-200 space-y-1">
                    <li>1. Install Wappalyzer browser extension</li>
                    <li>2. Visit each store website below</li>
                    <li>3. Click Wappalyzer icon for each site</li>
                    <li>4. Record technology data</li>
                    <li>5. Export as CSV and import here</li>
                  </ol>
                </div>
                <div>
                  <h5 className="font-medium text-blue-300 mb-2">📊 Data to Collect:</h5>
                  <ul className="text-xs text-blue-200 space-y-1">
                    <li>• E-commerce platform (Shopify, WooCommerce)</li>
                    <li>• Analytics (Google Analytics, Facebook Pixel)</li>
                    <li>• Email marketing (Klaviyo, Mailchimp)</li>
                    <li>• Payments (Stripe, PayPal, etc.)</li>
                  </ul>
                </div>
              </div>

              <div className="mt-4 bg-black/20 rounded p-3">
                <h5 className="font-medium text-blue-300 mb-2">🎯 Sites to Analyze:</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                  {campaign.leads?.slice(0, 10).map((lead, index) => (
                    <div key={index} className="flex items-center justify-between text-xs bg-blue-600/10 p-2 rounded">
                      <span>{lead.company?.name || `Store ${index + 1}`}</span>
                      <a 
                        href={lead.company?.website || '#'} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )) || (
                    <p className="text-xs text-blue-300 col-span-2">Sites will be available after discovery completes</p>
                  )}
                </div>
              </div>

              <div className="mt-4 p-3 bg-green-600/20 rounded border border-green-600/30">
                <h5 className="font-medium text-green-300 mb-2">📝 CSV Format Example:</h5>
                <pre className="text-xs text-green-200 bg-black/20 p-2 rounded overflow-x-auto">
{`Domain,E-commerce,Analytics,Email_Marketing,Payments
example-store.com,Shopify,Google Analytics,None,Shopify Payments
fashion-shop.com,WooCommerce,Facebook Pixel,Mailchimp,Stripe`}
                </pre>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'hunter' && (
          <div className="space-y-4">
            <div className="bg-green-600/20 border border-green-600/30 rounded-lg p-4">
              <h4 className="font-medium text-green-300 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Hunter.io Email Enhancement
              </h4>
              <p className="text-sm text-green-200 mb-4">
                Use the Hunter.io browser extension to find additional contacts and verify email addresses for better outreach.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h5 className="font-medium text-green-300 mb-2">📧 Contact Discovery Process:</h5>
                  <ol className="text-xs text-green-200 space-y-1">
                    <li>1. Install Hunter.io browser extension</li>
                    <li>2. Visit each company website</li>
                    <li>3. Click Hunter extension icon</li>
                    <li>4. Find Owner/Marketing Manager emails</li>
                    <li>5. Verify existing contacts</li>
                    <li>6. Export and import data</li>
                  </ol>
                </div>
                <div>
                  <h5 className="font-medium text-green-300 mb-2">🎯 Target Roles:</h5>
                  <ul className="text-xs text-green-200 space-y-1">
                    <li>• Owner / Founder</li>
                    <li>• Marketing Manager</li>
                    <li>• E-commerce Manager</li>
                    <li>• Store Manager</li>
                    <li>• Operations Manager</li>
                  </ul>
                </div>
              </div>

              <div className="mt-4 bg-black/20 rounded p-3">
                <h5 className="font-medium text-green-300 mb-2">🏢 Companies to Research:</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                  {campaign.leads?.slice(0, 10).map((lead, index) => (
                    <div key={index} className="flex items-center justify-between text-xs bg-green-600/10 p-2 rounded">
                      <div>
                        <span className="font-medium">{lead.company?.name || `Company ${index + 1}`}</span>
                        <p className="text-green-300">{lead.company?.domain || 'domain.com'}</p>
                      </div>
                      <span className="text-green-400">
                        {lead.contact?.email ? '📧' : '❓'}
                      </span>
                    </div>
                  )) || (
                    <p className="text-xs text-green-300 col-span-2">Companies will be available after discovery completes</p>
                  )}
                </div>
              </div>

              <div className="mt-4 p-3 bg-blue-600/20 rounded border border-blue-600/30">
                <h5 className="font-medium text-blue-300 mb-2">📝 CSV Format Example:</h5>
                <pre className="text-xs text-blue-200 bg-black/20 p-2 rounded overflow-x-auto">
{`Domain,Email,First_Name,Last_Name,Title,Confidence,Verified
example-store.com,john@example-store.com,John,Smith,Owner,95,true
fashion-shop.com,sarah@fashion-shop.com,Sarah,Johnson,Marketing Manager,87,true`}
                </pre>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'linkedin' && (
          <div className="space-y-4">
            <div className="bg-purple-600/20 border border-purple-600/30 rounded-lg p-4">
              <h4 className="font-medium text-purple-300 mb-3 flex items-center gap-2">
                <ExternalLink className="w-4 h-4" />
                LinkedIn Contact Research
              </h4>
              <p className="text-sm text-purple-200 mb-4">
                Research decision makers on LinkedIn to build relationships and gather insights for personalized outreach.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h5 className="font-medium text-purple-300 mb-2">🔍 Research Strategy:</h5>
                  <ol className="text-xs text-purple-200 space-y-1">
                    <li>1. Search "[Company Name] owner" on LinkedIn</li>
                    <li>2. Look for Founder, Owner, Marketing roles</li>
                    <li>3. Check company size and recent posts</li>
                    <li>4. Note connection level and mutual connections</li>
                    <li>5. Gather insights for personalization</li>
                  </ol>
                </div>
                <div>
                  <h5 className="font-medium text-purple-300 mb-2">📋 Data to Collect:</h5>
                  <ul className="text-xs text-purple-200 space-y-1">
                    <li>• Full name and job title</li>
                    <li>• LinkedIn profile URL</li>
                    <li>• Location and experience level</li>
                    <li>• Recent activity/posts</li>
                    <li>• Mutual connections</li>
                  </ul>
                </div>
              </div>

              <div className="mt-4 bg-black/20 rounded p-3">
                <h5 className="font-medium text-purple-300 mb-2">🎯 Companies for LinkedIn Research:</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                  {campaign.leads?.slice(0, 10).map((lead, index) => (
                    <div key={index} className="text-xs bg-purple-600/10 p-2 rounded">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{lead.company?.name || `Company ${index + 1}`}</span>
                        <a 
                          href={`https://linkedin.com/search/results/people/?keywords=${encodeURIComponent(lead.company?.name + ' owner')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-purple-400 hover:text-purple-300"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      <p className="text-purple-300 mt-1">
                        Industry: {campaign.targetIndustry} • Size: {campaign.targetCompanySize} employees
                      </p>
                    </div>
                  )) || (
                    <p className="text-xs text-purple-300 col-span-2">Companies will be available after discovery completes</p>
                  )}
                </div>
              </div>

              <div className="mt-4 p-3 bg-yellow-600/20 rounded border border-yellow-600/30">
                <h5 className="font-medium text-yellow-300 mb-2">📝 CSV Format Example:</h5>
                <pre className="text-xs text-yellow-200 bg-black/20 p-2 rounded overflow-x-auto">
{`Company,Name,Title,LinkedIn_URL,Location,Experience
Example Store,John Smith,Owner,linkedin.com/in/johnsmith,New York,5+ years
Fashion Shop,Sarah Johnson,Marketing Manager,linkedin.com/in/sarahjohnson,California,3+ years`}
                </pre>
              </div>

              <div className="mt-4 p-3 bg-green-600/20 rounded border border-green-600/30">
                <h5 className="font-medium text-green-300 mb-2">💡 Pro Tips:</h5>
                <ul className="text-xs text-green-200 space-y-1">
                  <li>• Use LinkedIn Sales Navigator for better filtering</li>
                  <li>• Check for recent posts about business challenges</li>
                  <li>• Note if they're hiring (growth indicator)</li>
                  <li>• Look for technology mentions in their content</li>
                  <li>• Save profiles for future relationship building</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'import' && (
          <div className="space-y-4">
            <div className="bg-gray-600/20 border border-gray-600/30 rounded-lg p-4">
              <h4 className="font-medium text-gray-300 mb-3 flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Import Extension Data
              </h4>
              <p className="text-sm text-gray-200 mb-4">
                After collecting data with browser extensions, import it here to enhance your campaign leads.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Data Type</label>
                  <select
                    value={importType}
                    onChange={(e) => setImportType(e.target.value)}
                    className="input-field w-full md:w-48"
                  >
                    <option value="wappalyzer">Wappalyzer (Technology)</option>
                    <option value="hunter">Hunter.io (Contacts)</option>
                    <option value="linkedin">LinkedIn (Profiles)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">CSV Data</label>
                  <textarea
                    value={importData}
                    onChange={(e) => setImportData(e.target.value)}
                    placeholder={`Paste your ${importType} CSV data here...

Example for ${importType}:
${importType === 'wappalyzer' ? 'Domain,E-commerce,Analytics,Email_Marketing,Payments\nexample.com,Shopify,Google Analytics,None,Stripe' :
  importType === 'hunter' ? 'Domain,Email,First_Name,Last_Name,Title,Confidence,Verified\nexample.com,john@example.com,John,Smith,Owner,95,true' :
  'Company,Name,Title,LinkedIn_URL,Location,Experience\nExample Store,John Smith,Owner,linkedin.com/in/johnsmith,New York,5+ years'}`}
                    className="input-field w-full h-40 font-mono text-xs"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleDataImport}
                    disabled={importing || !importData.trim()}
                    className="btn-primary flex items-center gap-2 disabled:opacity-50"
                  >
                    {importing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Import {importType} Data
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setImportData('')}
                    className="btn-outline"
                  >
                    Clear
                  </button>
                </div>

                {importData && (
                  <div className="bg-blue-600/20 border border-blue-600/30 rounded p-3">
                    <p className="text-xs text-blue-300">
                      Preview: {importData.split('\n').length - 1} data rows detected
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Import History */}
            <div className="bg-green-600/10 border border-green-600/20 rounded-lg p-4">
              <h5 className="font-medium text-green-300 mb-3">📊 Enhancement Results</h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-lg font-bold text-green-400">0</p>
                  <p className="text-xs text-green-300">Wappalyzer Imports</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-blue-400">0</p>
                  <p className="text-xs text-blue-300">Hunter Imports</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-purple-400">0</p>
                  <p className="text-xs text-purple-300">LinkedIn Imports</p>
                </div>
              </div>
              <p className="text-xs text-foreground-muted mt-3 text-center">
                Import data from extensions to see enhancement statistics here
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}