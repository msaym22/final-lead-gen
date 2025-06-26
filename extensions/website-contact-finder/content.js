
// Website Contact Finder Content Script
(function() {
  'use strict';

  const API_ENDPOINT = 'http://localhost:3000/api/extension/data';

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
        showNotification(`✅ Found ${totalContacts} contact(s)!`);
      } else {
        showNotification('ℹ️ Website analyzed - No contacts found');
      }

    } catch (error) {
      console.error('Website analysis error:', error);
    }
  }

  function findEmails() {
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const pageText = document.body.innerText;
    const emails = [...new Set(pageText.match(emailRegex) || [])];
    
    return emails.filter(email => 
      !email.includes('example.com') && 
      !email.includes('test@') &&
      !email.includes('placeholder')
    );
  }

  function findPhones() {
    const phoneRegex = /(?:\+?1[-.s]?)?\(?[0-9]{3}\)?[-.s]?[0-9]{3}[-.s]?[0-9]{4}/g;
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
    notification.style.cssText = `
      position: fixed; top: 20px; right: 20px; background: #10b981; color: white;
      padding: 12px 20px; border-radius: 8px; z-index: 10000; font-size: 14px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3); font-family: Arial, sans-serif;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 4000);
  }

  // Auto-analyze after page loads
  setTimeout(analyzeWebsite, 3000);

})();