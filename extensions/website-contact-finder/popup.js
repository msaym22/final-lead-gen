
// Popup script for Website Contact Finder
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
            extensionName: 'Website Contact Finder',
            timestamp: new Date().toISOString()
          },
          campaignId: campaignIdInput.value,
          extensionId: 'website-contact-finder',
          source: 'extension_test'
        })
      });

      if (response.ok) {
        const result = await response.json();
        statusDiv.textContent = '✅ Connection successful!';
        statusDiv.className = 'status connected';
        console.log('Test result:', result);
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      statusDiv.textContent = `❌ Connection failed: ${error.message}`;
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
});