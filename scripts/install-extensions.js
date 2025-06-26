// STEP 2: Updated scripts/install-extensions.js
const fs = require('fs');
const path = require('path');

async function downloadAndInstallExtensions() {
  // Your existing extensions
  const existingExtensions = [
    {
      name: 'wappalyzer',
      id: 'gppongmhjkpfnbhagpmjfkannfbllamg',
      url: 'https://chrome.google.com/webstore/detail/wappalyzer/gppongmhjkpfnbhagpmjfkannfbllamg',
      type: 'external'
    },
    {
      name: 'hunter',
      id: 'hgmhmanijnjhaffoampdlllchpolkdnj',
      url: 'https://chrome.google.com/webstore/detail/hunter/hgmhmanijnjhaffoampdlllchpolkdnj',
      type: 'external'
    }
  ];

  // New custom extensions for your lead software
  const customExtensions = [
    {
      name: 'LinkedIn Lead Extractor',
      id: 'linkedin-lead-extractor',
      description: 'Extract lead data from LinkedIn profiles and search results',
      type: 'custom'
    },
    {
      name: 'Instagram Lead Hunter',
      id: 'instagram-lead-hunter',
      description: 'Discover and extract leads from Instagram profiles and posts',
      type: 'custom'
    },
    {
      name: 'Website Contact Finder',
      id: 'website-contact-finder',
      description: 'Find contact information and analyze websites for lead generation',
      type: 'custom'
    }
  ];

  console.log('📦 Setting up browser extensions for automation...\n');
  
  // Create extensions directory
  const extensionsDir = path.join(process.cwd(), 'extensions');
  if (!fs.existsSync(extensionsDir)) {
    fs.mkdirSync(extensionsDir);
  }

  // Handle existing extensions
  console.log('🔗 External Extensions (Chrome Web Store):');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  for (const ext of existingExtensions) {
    console.log(`📥 ${ext.name}`);
    console.log(`   Install from: ${ext.url}`);
    console.log(`   Purpose: Website technology detection and email finding\n`);
  }

  // Generate custom extensions
  console.log('🛠️  Custom Extensions (Generated):');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  for (const ext of customExtensions) {
    const extDir = path.join(extensionsDir, ext.id);
    if (!fs.existsSync(extDir)) {
      fs.mkdirSync(extDir, { recursive: true });
    }

    // Create manifest.json
    const manifest = {
      manifest_version: 3,
      name: ext.name,
      version: '1.0.0',
      description: ext.description,
      permissions: ['activeTab', 'storage', 'scripting'],
      host_permissions: getHostPermissions(ext.id),
      content_scripts: [{
        matches: getHostPermissions(ext.id),
        js: ['content.js'],
        run_at: 'document_end'
      }],
      action: {
        default_popup: 'popup.html',
        default_title: ext.name
      },
      background: {
        service_worker: 'background.js'
      },
      icons: {
        16: 'icon16.png',
        48: 'icon48.png',
        128: 'icon128.png'
      }
    };

    fs.writeFileSync(
      path.join(extDir, 'manifest.json'),
      JSON.stringify(manifest, null, 2)
    );

    // Create content script
    const contentScript = generateContentScript(ext.id);
    fs.writeFileSync(path.join(extDir, 'content.js'), contentScript);

    // Create popup
    const popup = generatePopupHTML(ext);
    fs.writeFileSync(path.join(extDir, 'popup.html'), popup);

    // Create popup script
    const popupScript = generatePopupScript(ext);
    fs.writeFileSync(path.join(extDir, 'popup.js'), popupScript);

    // Create background script
    const backgroundScript = generateBackgroundScript(ext);
    fs.writeFileSync(path.join(extDir, 'background.js'), backgroundScript);

    // Create simple icons (you can replace with actual icons)
    createSimpleIcons(extDir);

    console.log(`✅ Generated ${ext.name}`);
    console.log(`   Location: ${extDir}`);
    console.log(`   Purpose: ${ext.description}\n`);
  }

  console.log('🎉 Extension setup complete!\n');
  
  // Integration instructions
  console.log('📋 Integration Instructions:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('1. Install External Extensions:');
  existingExtensions.forEach(ext => {
    console.log(`   • Open: ${ext.url}`);
  });
  
  console.log('\n2. Install Custom Extensions:');
  console.log('   • Open Chrome: chrome://extensions/');
  console.log('   • Enable "Developer mode"');
  console.log('   • Click "Load unpacked"');
  customExtensions.forEach(ext => {
    console.log(`   • Select: extensions/${ext.id}`);
  });
  
  console.log('\n3. Configure All Extensions:');
  console.log('   • Set API Endpoint: http://localhost:3000/api/extension/data');
  console.log('   • Create campaign in your software');
  console.log('   • Set Campaign ID in each extension');
  console.log('   • Test connections');
  
  console.log('\n4. Start Collecting Leads:');
  console.log('   • Visit LinkedIn profiles → Auto-extract');
  console.log('   • Browse Instagram → Click extract buttons');
  console.log('   • Visit websites → Auto-analyze');
  console.log('   • Check your dashboard for new leads!\n');
}

function getHostPermissions(extensionId) {
  switch (extensionId) {
    case 'linkedin-lead-extractor':
      return ['*://*.linkedin.com/*'];
    case 'instagram-lead-hunter':
      return ['*://*.instagram.com/*'];
    case 'website-contact-finder':
      return ['*://*/*'];
    default:
      return ['*://*/*'];
  }
}

function generateContentScript(extensionId) {
  const API_ENDPOINT = 'http://localhost:3000/api/extension/data';
  
  switch (extensionId) {
    case 'linkedin-lead-extractor':
      return `
// LinkedIn Lead Extractor Content Script
(function() {
  'use strict';

  const API_ENDPOINT = '${API_ENDPOINT}';
  let isExtracting = false;

  function extractLinkedInProfile() {
    if (isExtracting) return;
    isExtracting = true;

    try {
      const profileData = {
        name: document.querySelector('h1')?.textContent?.trim() || '',
        headline: document.querySelector('.top-card-layout__headline, .top-card__headline')?.textContent?.trim() || '',
        location: document.querySelector('.top-card-layout__first-subline, .top-card__subline-item')?.textContent?.trim() || '',
        profileUrl: window.location.href,
        extractedAt: new Date().toISOString()
      };

      // Get company info if available
      const companyElement = document.querySelector('.top-card-layout__company, .top-card__company a');
      if (companyElement) {
        profileData.company = companyElement.textContent?.trim() || '';
      }

      sendDataToSoftware('linkedin_profile', profileData);
      showNotification('✅ LinkedIn profile extracted!');

    } catch (error) {
      console.error('LinkedIn extraction error:', error);
      showNotification('❌ Failed to extract profile');
    } finally {
      isExtracting = false;
    }
  }

  async function sendDataToSoftware(type, data) {
    try {
      const campaignId = await getCampaignId();
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          data,
          campaignId,
          extensionId: 'linkedin-lead-extractor',
          source: 'linkedin_extension',
          timestamp: new Date().toISOString()
        })
      });

      if (response.ok) {
        console.log('✅ Data sent to lead software');
      }
    } catch (error) {
      console.error('Failed to send data:', error);
    }
  }

  function getCampaignId() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['campaignId'], (result) => {
        resolve(result.campaignId || 'default_campaign');
      });
    });
  }

  function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = \`
      position: fixed; top: 20px; right: 20px; background: #0073b1; color: white;
      padding: 12px 20px; border-radius: 8px; z-index: 10000; font-size: 14px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3); font-family: Arial, sans-serif;
    \`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  }

  // Add extraction button
  function addExtractionButton() {
    if (document.getElementById('linkedin-extractor-btn')) return;

    const button = document.createElement('button');
    button.id = 'linkedin-extractor-btn';
    button.innerHTML = '📊 Extract Lead';
    button.style.cssText = \`
      position: fixed; bottom: 20px; right: 20px; background: #0073b1; color: white;
      border: none; padding: 12px 20px; border-radius: 25px; cursor: pointer;
      z-index: 10000; font-size: 14px; font-weight: 600;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    \`;

    button.addEventListener('click', extractLinkedInProfile);
    document.body.appendChild(button);
  }

  // Initialize
  setTimeout(addExtractionButton, 2000);

  // Monitor for navigation changes
  let currentUrl = window.location.href;
  setInterval(() => {
    if (window.location.href !== currentUrl) {
      currentUrl = window.location.href;
      setTimeout(addExtractionButton, 1000);
    }
  }, 1000);

})();`;

    case 'instagram-lead-hunter':
      return `
// Instagram Lead Hunter Content Script
(function() {
  'use strict';

  const API_ENDPOINT = '${API_ENDPOINT}';

  function extractInstagramProfile() {
    try {
      const profileData = {
        username: window.location.pathname.split('/')[1],
        displayName: document.querySelector('h2')?.textContent?.trim() || '',
        bio: getBio(),
        followerCount: getFollowerCount(),
        isVerified: !!document.querySelector('[aria-label="Verified"]'),
        profileUrl: window.location.href,
        extractedAt: new Date().toISOString()
      };

      sendDataToSoftware('instagram_profile', profileData);
      showNotification('✅ Instagram profile extracted!');

    } catch (error) {
      console.error('Instagram extraction error:', error);
      showNotification('❌ Failed to extract profile');
    }
  }

  function getBio() {
    const bioSelectors = ['h1 + div + div span', 'header section div span'];
    for (const selector of bioSelectors) {
      const bio = document.querySelector(selector)?.textContent?.trim();
      if (bio) return bio;
    }
    return '';
  }

  function getFollowerCount() {
    const followerText = Array.from(document.querySelectorAll('a'))
      .find(a => a.textContent.includes('followers'))?.textContent;
    if (followerText) {
      const match = followerText.match(/([0-9,]+)/);
      return match ? parseInt(match[1].replace(/,/g, '')) : 0;
    }
    return 0;
  }

  async function sendDataToSoftware(type, data) {
    try {
      const campaignId = await getCampaignId();
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          data,
          campaignId,
          extensionId: 'instagram-lead-hunter',
          source: 'instagram_extension',
          timestamp: new Date().toISOString()
        })
      });

      if (response.ok) {
        console.log('✅ Data sent to lead software');
      }
    } catch (error) {
      console.error('Failed to send data:', error);
    }
  }

  function getCampaignId() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['campaignId'], (result) => {
        resolve(result.campaignId || 'default_campaign');
      });
    });
  }

  function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = \`
      position: fixed; top: 20px; right: 20px; background: #E1306C; color: white;
      padding: 12px 20px; border-radius: 8px; z-index: 10000; font-size: 14px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3); font-family: Arial, sans-serif;
    \`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  }

  // Add extraction button for profiles
  function addExtractionButton() {
    if (document.getElementById('instagram-extractor-btn')) return;
    if (!window.location.pathname.match(/^\/[^\/]+\/?$/)) return;

    const button = document.createElement('button');
    button.id = 'instagram-extractor-btn';
    button.innerHTML = '📸 Extract Lead';
    button.style.cssText = \`
      position: fixed; bottom: 20px; right: 20px; background: #E1306C; color: white;
      border: none; padding: 12px 20px; border-radius: 25px; cursor: pointer;
      z-index: 10000; font-size: 14px; font-weight: 600;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    \`;

    button.addEventListener('click', extractInstagramProfile);
    document.body.appendChild(button);
  }

  // Initialize
  setTimeout(addExtractionButton, 3000);

  // Monitor for navigation changes
  let currentUrl = window.location.href;
  setInterval(() => {
    if (window.location.href !== currentUrl) {
      currentUrl = window.location.href;
      setTimeout(addExtractionButton, 2000);
    }
  }, 1000);

})();`;

    case 'website-contact-finder':
      return `
// Website Contact Finder Content Script
(function() {
  'use strict';

  const API_ENDPOINT = '${API_ENDPOINT}';

  function analyzeWebsite() {
    try {
      const websiteData = {
        url: window.location.href,
        domain: window.location.hostname,
        title: document.title,
        emails: findEmails(),
        phones: findPhones(),
        socialLinks: findSocialLinks(),
        technologies: detectTechnologies(),
        analyzedAt: new Date().toISOString()
      };

      sendDataToSoftware('website_analysis', websiteData);
      
      const totalContacts = websiteData.emails.length + websiteData.phones.length;
      if (totalContacts > 0) {
        showNotification(\`✅ Found \${totalContacts} contact(s)!\`);
      } else {
        showNotification('ℹ️ Website analyzed - No contacts found');
      }

    } catch (error) {
      console.error('Website analysis error:', error);
    }
  }

  function findEmails() {
    const emailRegex = /\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b/g;
    const pageText = document.body.innerText;
    const emails = [...new Set(pageText.match(emailRegex) || [])];
    
    return emails.filter(email => 
      !email.includes('example.com') && 
      !email.includes('test@') &&
      !email.includes('placeholder')
    );
  }

  function findPhones() {
    const phoneRegex = /(?:\\+?1[-.\s]?)?\\(?[0-9]{3}\\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/g;
    const pageText = document.body.innerText;
    return [...new Set(pageText.match(phoneRegex) || [])];
  }

  function findSocialLinks() {
    const socialLinks = {};
    const links = document.querySelectorAll('a[href]');
    
    links.forEach(link => {
      const href = link.href.toLowerCase();
      if (href.includes('linkedin.com')) socialLinks.linkedin = link.href;
      if (href.includes('twitter.com')) socialLinks.twitter = link.href;
      if (href.includes('facebook.com')) socialLinks.facebook = link.href;
      if (href.includes('instagram.com')) socialLinks.instagram = link.href;
    });
    
    return socialLinks;
  }

  function detectTechnologies() {
    const technologies = [];
    
    if (window.Shopify || document.querySelector('[data-shopify]')) {
      technologies.push('Shopify');
    }
    if (window.wp || document.querySelector('#wpadminbar')) {
      technologies.push('WordPress');
    }
    if (window.ga || window.gtag) {
      technologies.push('Google Analytics');
    }
    
    return technologies;
  }

  async function sendDataToSoftware(type, data) {
    try {
      const campaignId = await getCampaignId();
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          data,
          campaignId,
          extensionId: 'website-contact-finder',
          source: 'website_extension',
          timestamp: new Date().toISOString()
        })
      });

      if (response.ok) {
        console.log('✅ Data sent to lead software');
      }
    } catch (error) {
      console.error('Failed to send data:', error);
    }
  }

  function getCampaignId() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['campaignId'], (result) => {
        resolve(result.campaignId || 'default_campaign');
      });
    });
  }

  function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = \`
      position: fixed; top: 20px; right: 20px; background: #10b981; color: white;
      padding: 12px 20px; border-radius: 8px; z-index: 10000; font-size: 14px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3); font-family: Arial, sans-serif;
    \`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 4000);
  }

  // Auto-analyze after page loads
  setTimeout(analyzeWebsite, 3000);

})();`;

    default:
      return '// Default content script';
  }
}

function generatePopupHTML(extension) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { 
      width: 350px; 
      padding: 20px; 
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      margin: 0;
    }
    .header { 
      text-align: center; 
      margin-bottom: 20px; 
      padding-bottom: 15px;
      border-bottom: 1px solid #eee;
    }
    .status { 
      padding: 12px; 
      border-radius: 8px; 
      margin-bottom: 15px; 
      text-align: center;
      font-weight: 500;
    }
    .connected { 
      background: #d1fae5; 
      color: #065f46; 
      border: 1px solid #10b981;
    }
    .disconnected { 
      background: #fee2e2; 
      color: #991b1b;
      border: 1px solid #ef4444;
    }
    .button { 
      width: 100%; 
      padding: 12px; 
      border: none; 
      border-radius: 8px; 
      cursor: pointer; 
      margin: 8px 0;
      font-size: 14px;
      font-weight: 500;
      transition: all 0.2s;
    }
    .primary { 
      background: #3b82f6; 
      color: white; 
    }
    .primary:hover {
      background: #2563eb;
    }
    .secondary { 
      background: #f3f4f6; 
      color: #374151;
      border: 1px solid #d1d5db;
    }
    .secondary:hover {
      background: #e5e7eb;
    }
    .input { 
      width: 100%; 
      padding: 10px; 
      border: 1px solid #d1d5db; 
      border-radius: 6px; 
      margin: 8px 0;
      font-size: 14px;
      box-sizing: border-box;
    }
    .label {
      font-weight: 500;
      margin-bottom: 4px;
      display: block;
      color: #374151;
    }
    .info {
      background: #f0f9ff;
      border: 1px solid #0ea5e9;
      color: #0c4a6e;
      padding: 10px;
      border-radius: 6px;
      font-size: 12px;
      margin-top: 15px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h3 style="margin: 0; color: #1f2937;">${extension.name}</h3>
    <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 12px;">${extension.description}</p>
  </div>
  
  <div id="status" class="status disconnected">
    Status: Checking connection...
  </div>
  
  <div>
    <label class="label">API Endpoint:</label>
    <input type="text" id="apiEndpoint" class="input" value="http://localhost:3000/api/extension/data">
  </div>
  
  <div>
    <label class="label">Campaign ID:</label>
    <input type="text" id="campaignId" class="input" placeholder="Enter campaign ID">
  </div>
  
  <button id="saveConfig" class="button primary">Save Configuration</button>
  <button id="testConnection" class="button secondary">Test Connection</button>
  
  <div class="info">
    💡 <strong>Setup:</strong><br>
    1. Start your Next.js app<br>
    2. Create a campaign<br>
    3. Enter campaign ID above<br>
    4. Save and test connection
  </div>
  
  <script src="popup.js"></script>
</body>
</html>`;
}

function generatePopupScript(extension) {
  return `
// Popup script for ${extension.name}
document.addEventListener('DOMContentLoaded', function() {
  const statusDiv = document.getElementById('status');
  const apiEndpointInput = document.getElementById('apiEndpoint');
  const campaignIdInput = document.getElementById('campaignId');
  const saveBtn = document.getElementById('saveConfig');
  const testBtn = document.getElementById('testConnection');

  // Load saved configuration
  chrome.storage.sync.get(['apiEndpoint', 'campaignId'], function(result) {
    if (result.apiEndpoint) apiEndpointInput.value = result.apiEndpoint;
    if (result.campaignId) campaignIdInput.value = result.campaignId;
    updateStatus();
  });

  // Save configuration
  saveBtn.addEventListener('click', function() {
    const config = {
      apiEndpoint: apiEndpointInput.value,
      campaignId: campaignIdInput.value
    };
    
    chrome.storage.sync.set(config, function() {
      statusDiv.textContent = '✅ Configuration saved!';
      statusDiv.className = 'status connected';
      
      // Auto-test connection after saving
      setTimeout(testConnection, 500);
    });
  });

  // Test connection
  testBtn.addEventListener('click', testConnection);

  async function testConnection() {
    const endpoint = apiEndpointInput.value;
    statusDiv.textContent = 'Testing connection...';
    statusDiv.className = 'status disconnected';
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'test_connection',
          data: { 
            test: true, 
            extensionName: '${extension.name}',
            timestamp: new Date().toISOString()
          },
          campaignId: campaignIdInput.value,
          extensionId: '${extension.id}',
          source: 'extension_test'
        })
      });

      if (response.ok) {
        const result = await response.json();
        statusDiv.textContent = '✅ Connection successful!';
        statusDiv.className = 'status connected';
        console.log('Test result:', result);
      } else {
        throw new Error(\`HTTP \${response.status}\`);
      }
    } catch (error) {
      statusDiv.textContent = \`❌ Connection failed: \${error.message}\`;
      statusDiv.className = 'status disconnected';
      console.error('Connection test failed:', error);
    }
  }

  function updateStatus() {
    // Check if configuration is complete
    if (apiEndpointInput.value && campaignIdInput.value) {
      statusDiv.textContent = '⚡ Ready to extract leads';
      statusDiv.className = 'status connected';
    } else {
      statusDiv.textContent = '⚠️ Configuration needed';
      statusDiv.className = 'status disconnected';
    }
  }

  // Update status when inputs change
  apiEndpointInput.addEventListener('input', updateStatus);
  campaignIdInput.addEventListener('input', updateStatus);
});`;
}

function generateBackgroundScript(extension) {
  return `
// Background script for ${extension.name}
chrome.runtime.onInstalled.addListener(() => {
  console.log('${extension.name} installed and ready');
  
  // Set default configuration
  chrome.storage.sync.get(['apiEndpoint'], (result) => {
    if (!result.apiEndpoint) {
      chrome.storage.sync.set({
        apiEndpoint: 'http://localhost:3000/api/extension/data'
      });
    }
  });
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getConfig') {
    chrome.storage.sync.get(['apiEndpoint', 'campaignId'], (result) => {
      sendResponse(result);
    });
    return true; // Keep message channel open for async response
  }
  
  if (request.action === 'showNotification') {
    // Could show browser notification here if needed
    console.log('Extension notification:', request.message);
  }
});

// Monitor extension activity
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync') {
    console.log('Configuration updated:', changes);
  }
});`;
}

function createSimpleIcons(extDir) {
  // Create simple colored square icons (you can replace with actual icon files)
  const iconSVG = `
<svg width="128" height="128" xmlns="http://www.w3.org/2000/svg">
  <rect width="128" height="128" fill="#3b82f6"/>
  <text x="64" y="74" font-family="Arial" font-size="48" fill="white" text-anchor="middle">📊</text>
</svg>`;

  // For now, just create placeholder files
  // In a real implementation, you'd want actual .png files
  fs.writeFileSync(path.join(extDir, 'icon16.png'), '');
  fs.writeFileSync(path.join(extDir, 'icon48.png'), '');
  fs.writeFileSync(path.join(extDir, 'icon128.png'), '');
  
  // Create a readme for icons
  fs.writeFileSync(path.join(extDir, 'ICONS_README.txt'), 
    'Replace the empty .png files with actual icon images:\n' +
    '- icon16.png (16x16 pixels)\n' +
    '- icon48.png (48x48 pixels)\n' +
    '- icon128.png (128x128 pixels)\n\n' +
    'You can create these using any image editor or online icon generators.'
  );
}

// Run the installation
downloadAndInstallExtensions().catch(console.error);