
// Background script for Instagram Lead Hunter
chrome.runtime.onInstalled.addListener(() => {
  console.log('Instagram Lead Hunter installed and ready');
  
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
});