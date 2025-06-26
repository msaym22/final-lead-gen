
// Instagram Lead Hunter Content Script
(function() {
  'use strict';

  const API_ENDPOINT = 'http://localhost:3000/api/extension/data';

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
    notification.style.cssText = `
      position: fixed; top: 20px; right: 20px; background: #E1306C; color: white;
      padding: 12px 20px; border-radius: 8px; z-index: 10000; font-size: 14px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3); font-family: Arial, sans-serif;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  }

  // Add extraction button for profiles
  function addExtractionButton() {
    if (document.getElementById('instagram-extractor-btn')) return;
    if (!window.location.pathname.match(/^/[^/]+/?$/)) return;

    const button = document.createElement('button');
    button.id = 'instagram-extractor-btn';
    button.innerHTML = '📸 Extract Lead';
    button.style.cssText = `
      position: fixed; bottom: 20px; right: 20px; background: #E1306C; color: white;
      border: none; padding: 12px 20px; border-radius: 25px; cursor: pointer;
      z-index: 10000; font-size: 14px; font-weight: 600;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;

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

})();