
// LinkedIn Lead Extractor Content Script
(function() {
  'use strict';

  const API_ENDPOINT = 'http://localhost:3000/api/extension/data';
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
    notification.style.cssText = `
      position: fixed; top: 20px; right: 20px; background: #0073b1; color: white;
      padding: 12px 20px; border-radius: 8px; z-index: 10000; font-size: 14px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3); font-family: Arial, sans-serif;
    `;
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
    button.style.cssText = `
      position: fixed; bottom: 20px; right: 20px; background: #0073b1; color: white;
      border: none; padding: 12px 20px; border-radius: 25px; cursor: pointer;
      z-index: 10000; font-size: 14px; font-weight: 600;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;

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

})();