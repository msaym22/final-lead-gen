// STEP 3: Create Extension Manager Component
// File: src/components/extensions/ExtensionManager.js

'use client';

import { useState, useEffect } from 'react';
import { Chrome, Linkedin, Mail, Globe, Zap, Download, ExternalLink, Instagram, Settings, Activity } from 'lucide-react';

export default function ExtensionManager() {
  const [extensions, setExtensions] = useState({});
  const [loading, setLoading] = useState(true);
  const [extensionData, setExtensionData] = useState([]);
  const [stats, setStats] = useState({
    totalExtracted: 0,
    activeExtensions: 0,
    lastActivity: null
  });

  useEffect(() => {
    checkExtensionStatus();
    loadExtensionData();
    
    // Check status every 30 seconds
    const interval = setInterval(() => {
      checkExtensionStatus();
      loadExtensionData();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const checkExtensionStatus = async () => {
    try {
      const response = await fetch('/api/extension/status');
      const result = await response.json();
      
      if (result.success) {
        setExtensions(result.extensions);
        
        // Calculate stats
        const activeCount = Object.values(result.extensions).filter(ext => ext.connected).length;
        const lastActivity = Object.values(result.extensions)
          .map(ext => ext.lastActivity)
          .filter(Boolean)
          .sort()
          .pop();
        
        setStats(prev => ({
          ...prev,
          activeExtensions: activeCount,
          lastActivity: lastActivity ? new Date(lastActivity) : null
        }));
      }
      setLoading(false);
    } catch (error) {
      console.error('Error checking extension status:', error);
      setLoading(false);
    }
  };

  const loadExtensionData = async () => {
    try {
      const response = await fetch('/api/extension/data?campaignId=all');
      const result = await response.json();
      
      if (result.success) {
        setExtensionData(result.data.slice(0, 20)); // Show latest 20
        setStats(prev => ({
          ...prev,
          totalExtracted: result.count
        }));
      }
    } catch (error) {
      console.error('Error loading extension data:', error);
    }
  };

  const testExtension = async (extensionId) => {
    try {
      const response = await fetch('/api/extension/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'test_connection',
          data: { test: true, extensionId },
          campaignId: 'test',
          extensionId,
          source: 'manual_test'
        })
      });

      if (response.ok) {
        alert('✅ Extension connection test successful!');
      } else {
        alert('❌ Extension connection test failed');
      }
    } catch (error) {
      alert('❌ Test failed: ' + error.message);
    }
  };

  const extensionConfig = {
    wappalyzer: {
      name: 'Wappalyzer',
      icon: Globe,
      description: 'Website technology detection and analysis',
      color: 'text-blue-400',
      bgColor: 'bg-blue-600/20',
      borderColor: 'border-blue-600/30',
      installUrl: 'https://chrome.google.com/webstore/detail/wappalyzer/gppongmhjkpfnbhagpmjfkannfbllamg',
      type: 'external'
    },
    hunter: {
      name: 'Hunter',
      icon: Mail,
      description: 'Email finder and verification tool',
      color: 'text-green-400',
      bgColor: 'bg-green-600/20',
      borderColor: 'border-green-600/30',
      installUrl: 'https://chrome.google.com/webstore/detail/hunter/hgmhmanijnjhaffoampdlllchpolkdnj',
      type: 'external'
    },
    linkedin: {
      name: 'LinkedIn Lead Extractor',
      icon: Linkedin,
      description: 'Extract lead data from LinkedIn profiles and search results',
      color: 'text-blue-400',
      bgColor: 'bg-blue-600/20',
      borderColor: 'border-blue-600/30',
      type: 'custom',
      path: 'extensions/linkedin-lead-extractor'
    },
    instagram: {
      name: 'Instagram Lead Hunter',
      icon: Instagram,
      description: 'Discover and extract leads from Instagram profiles',
      color: 'text-pink-400',
      bgColor: 'bg-pink-600/20',
      borderColor: 'border-pink-600/30',
      type: 'custom',
      path: 'extensions/instagram-lead-hunter'
    },
    website: {
      name: 'Website Contact Finder',
      icon: Zap,
      description: 'Find contact information and analyze websites',
      color: 'text-purple-400',
      bgColor: 'bg-purple-600/20',
      borderColor: 'border-purple-600/30',
      type: 'custom',
      path: 'extensions/website-contact-finder'
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-background-tertiary rounded w-1/3"></div>
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-32 bg-background-tertiary rounded-lg"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Browser Extensions</h1>
          <p className="text-foreground-muted">Automate lead discovery with browser extensions</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-2xl font-bold text-primary-400">{stats.activeExtensions}/5</div>
            <div className="text-sm text-foreground-muted">Active Extensions</div>
          </div>
          <Chrome className="w-8 h-8 text-foreground-muted" />
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card text-center">
          <div className="text-2xl font-bold text-green-400">{stats.totalExtracted}</div>
          <div className="text-sm text-foreground-muted">Total Data Extracted</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-blue-400">{stats.activeExtensions}</div>
          <div className="text-sm text-foreground-muted">Connected Extensions</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-purple-400">
            {stats.lastActivity ? stats.lastActivity.toLocaleDateString() : 'Never'}
          </div>
          <div className="text-sm text-foreground-muted">Last Activity</div>
        </div>
      </div>

      {/* Extension Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(extensionConfig).map(([key, config]) => {
          const extension = extensions[key] || {};
          const isConnected = extension.connected;
          const Icon = config.icon;

          return (
            <div 
              key={key}
              className={`card border-2 transition-all duration-200 ${
                isConnected 
                  ? `${config.borderColor} ${config.bgColor}` 
                  : 'border-border hover:border-border-muted'
              }`}
            >
              {/* Extension Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-lg ${config.bgColor}`}>
                    <Icon className={`w-6 h-6 ${config.color}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold flex items-center gap-2">
                      {config.name}
                      {config.type === 'external' && (
                        <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                          External
                        </span>
                      )}
                      {config.type === 'custom' && (
                        <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded">
                          Custom
                        </span>
                      )}
                    </h3>
                    <p className="text-sm text-foreground-muted">{config.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div 
                    className={`w-3 h-3 rounded-full ${
                      isConnected ? 'bg-green-400' : 'bg-red-400'
                    }`}
                  ></div>
                  <span className="text-xs text-foreground-muted">
                    {isConnected ? 'Connected' : 'Not Connected'}
                  </span>
                </div>
              </div>

              {/* Extension Details */}
              {isConnected ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-foreground-muted">Last Activity:</span>
                      <div className="font-medium">
                        {extension.lastActivity 
                          ? new Date(extension.lastActivity).toLocaleString() 
                          : 'Never'
                        }
                      </div>
                    </div>
                    <div>
                      <span className="text-foreground-muted">Version:</span>
                      <div className="font-medium">{extension.version || 'Unknown'}</div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={() => testExtension(key)}
                      className="btn-outline text-sm flex-1 flex items-center gap-2"
                    >
                      <Activity className="w-4 h-4" />
                      Test Connection
                    </button>
                    <button className="btn-outline text-sm flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      Configure
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-foreground-muted">
                    {config.type === 'external' 
                      ? 'Install this extension from the Chrome Web Store'
                      : 'Load this custom extension in Chrome Developer Mode'
                    }
                  </p>
                  
                  {config.type === 'external' ? (
                    <a
                      href={config.installUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary text-sm w-full flex items-center gap-2 justify-center"
                    >
                      <Download className="w-4 h-4" />
                      Install from Web Store
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-xs text-foreground-muted bg-background-tertiary p-2 rounded">
                        📁 Path: {config.path}
                      </div>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(`chrome://extensions/`);
                          alert('✅ Copied chrome://extensions/ to clipboard!\n\n1. Paste in Chrome address bar\n2. Enable Developer mode\n3. Click "Load unpacked"\n4. Select the extension folder');
                        }}
                        className="btn-primary text-sm w-full flex items-center gap-2"
                      >
                        📋 Copy Installation URL
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Extension Permissions */}
              <div className="mt-4 pt-3 border-t border-border">
                <details className="text-sm">
                  <summary className="cursor-pointer text-foreground-muted hover:text-foreground">
                    Permissions & Features
                  </summary>
                  <ul className="mt-2 space-y-1 text-xs text-foreground-muted ml-4">
                    {extension.permissions?.map((permission, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <div className="w-1 h-1 bg-foreground-muted rounded-full"></div>
                        {permission}
                      </li>
                    ))}
                  </ul>
                </details>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Extension Activity */}
      {extensionData.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Recent Extension Activity</h3>
            <button 
              onClick={loadExtensionData}
              className="btn-outline text-sm"
            >
              Refresh
            </button>
          </div>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {extensionData.map((activity, index) => {
              const config = Object.values(extensionConfig).find(c => 
                activity.source?.includes(c.name.toLowerCase().replace(/\s+/g, '_')) ||
                activity.extensionId?.includes(c.name.toLowerCase().replace(/\s+/g, '-'))
              ) || extensionConfig.website;
              
              const Icon = config.icon;

              return (
                <div key={index} className="flex items-center justify-between p-3 bg-background-tertiary rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${config.bgColor}`}>
                      <Icon className={`w-4 h-4 ${config.color}`} />
                    </div>
                    <div>
                      <p className="font-medium">{activity.type.replace(/_/g, ' ')}</p>
                      <p className="text-sm text-foreground-muted">
                        {config.name} • Campaign: {activity.campaignId}
                      </p>
                      {activity.data && typeof activity.data === 'object' && (
                        <p className="text-xs text-foreground-muted">
                          {activity.data.name || activity.data.username || activity.data.url || 'Data extracted'}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-foreground-muted">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                    <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded">
                      Success
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Setup Instructions */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Quick Setup Guide</h3>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">1</div>
            <div>
              <h4 className="font-medium">Run Extension Generator</h4>
              <p className="text-sm text-foreground-muted">Execute <code className="bg-background-tertiary px-2 py-1 rounded">npm run install-extensions</code> to generate custom extensions</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">2</div>
            <div>
              <h4 className="font-medium">Install Extensions</h4>
              <p className="text-sm text-foreground-muted">Load custom extensions via Developer Mode and install external ones from Web Store</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">3</div>
            <div>
              <h4 className="font-medium">Configure & Test</h4>
              <p className="text-sm text-foreground-muted">Set API endpoint and campaign ID in each extension, then test connections</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">4</div>
            <div>
              <h4 className="font-medium">Start Collecting</h4>
              <p className="text-sm text-foreground-muted">Browse LinkedIn, Instagram, or websites to automatically collect lead data</p>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h5 className="font-medium text-blue-900 mb-2">🚀 Pro Tips:</h5>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Create specific campaigns for different lead sources</li>
            <li>• Check extension status regularly for optimal performance</li>
            <li>• Use the Test Connection feature to troubleshoot issues</li>
            <li>• Monitor the Recent Activity feed to track data collection</li>
          </ul>
        </div>
      </div>
    </div>
  );
}