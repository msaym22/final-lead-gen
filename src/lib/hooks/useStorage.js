// src/lib/hooks/useStorage.js
import { useState, useEffect, useCallback } from 'react';
import localStorageManager from '../localStorageManager';
import appStore from '../store';

// Hook for direct localStorage access with MongoDB sync
export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(initialValue);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const value = localStorageManager.getItem(key);
    if (value !== null) {
      try {
        setStoredValue(JSON.parse(value));
      } catch {
        setStoredValue(value);
      }
    }
    setIsLoaded(true);
  }, [key]);

  const setValue = useCallback((value) => {
    try {
      setStoredValue(value);
      const valueToStore = typeof value === 'string' ? value : JSON.stringify(value);
      localStorageManager.setItem(key, valueToStore);
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key]);

  return [storedValue, setValue, isLoaded];
}

// Hook for app store with reactive updates
export function useAppStore(selector) {
  const [state, setState] = useState(() => {
    if (selector) {
      return selector(appStore.data);
    }
    return appStore.data;
  });

  useEffect(() => {
    const unsubscribe = appStore.subscribe((newData) => {
      if (selector) {
        setState(selector(newData));
      } else {
        setState(newData);
      }
    });

    return unsubscribe;
  }, [selector]);

  return state;
}

// Hook for leads management
export function useLeads() {
  const [leads, setLeads] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadedLeads = appStore.getLeads();
    setLeads(loadedLeads);
    setIsLoaded(true);

    const unsubscribe = appStore.subscribe(() => {
      setLeads(appStore.getLeads());
    });

    return unsubscribe;
  }, []);

  const updateLeads = useCallback((newLeads) => {
    appStore.setLeads(newLeads);
  }, []);

  const addLead = useCallback((lead) => {
    return appStore.addLead(lead);
  }, []);

  const updateLead = useCallback((leadId, updates) => {
    appStore.updateLead(leadId, updates);
  }, []);

  const removeLead = useCallback((leadId) => {
    appStore.removeLead(leadId);
  }, []);

  const searchLeads = useCallback((query) => {
    if (!query) return leads;
    
    const lowercaseQuery = query.toLowerCase();
    return leads.filter(lead => 
      (lead.name && lead.name.toLowerCase().includes(lowercaseQuery)) ||
      (lead.email && lead.email.toLowerCase().includes(lowercaseQuery)) ||
      (lead.company && lead.company.toLowerCase().includes(lowercaseQuery))
    );
  }, [leads]);

  return {
    leads,
    setLeads: updateLeads,
    addLead,
    updateLead,
    removeLead,
    searchLeads,
    isLoaded
  };
}

// Hook for campaigns management
export function useCampaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadedCampaigns = appStore.getCampaigns();
    setCampaigns(loadedCampaigns);
    setIsLoaded(true);

    const unsubscribe = appStore.subscribe(() => {
      setCampaigns(appStore.getCampaigns());
    });

    return unsubscribe;
  }, []);

  const updateCampaigns = useCallback((newCampaigns) => {
    appStore.setCampaigns(newCampaigns);
  }, []);

  const addCampaign = useCallback((campaign) => {
    return appStore.addCampaign(campaign);
  }, []);

  const updateCampaign = useCallback((campaignId, updates) => {
    appStore.updateCampaign(campaignId, updates);
  }, []);

  const getActiveCampaigns = useCallback(() => {
    return campaigns.filter(campaign => campaign.status === 'active');
  }, [campaigns]);

  return {
    campaigns,
    setCampaigns: updateCampaigns,
    addCampaign,
    updateCampaign,
    getActiveCampaigns,
    isLoaded
  };
}

// Hook for analytics
export function useAnalytics() {
  const [analytics, setAnalytics] = useState({});
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadedAnalytics = appStore.getAnalytics();
    setAnalytics(loadedAnalytics);
    setIsLoaded(true);

    const unsubscribe = appStore.subscribe(() => {
      setAnalytics(appStore.getAnalytics());
    });

    return unsubscribe;
  }, []);

  const updateAnalytics = useCallback((updates) => {
    appStore.updateAnalytics(updates);
  }, []);

  const recordEvent = useCallback((eventName, eventData) => {
    const currentAnalytics = appStore.getAnalytics();
    const events = currentAnalytics.events || [];
    
    const newEvent = {
      name: eventName,
      data: eventData,
      timestamp: new Date().toISOString()
    };
    
    const updatedEvents = [...events, newEvent];
    appStore.updateAnalytics({ events: updatedEvents });
  }, []);

  return {
    analytics,
    setAnalytics: updateAnalytics,
    updateAnalytics,
    recordEvent,
    isLoaded
  };
}

// Hook for user preferences
export function useUserPreferences() {
  const [preferences, setPreferences] = useState({});
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadedPreferences = appStore.getUserPreferences();
    setPreferences(loadedPreferences);
    setIsLoaded(true);

    const unsubscribe = appStore.subscribe(() => {
      setPreferences(appStore.getUserPreferences());
    });

    return unsubscribe;
  }, []);

  const updatePreferences = useCallback((newPreferences) => {
    appStore.updateUserPreferences(newPreferences);
  }, []);

  const toggleTheme = useCallback(() => {
    const currentTheme = preferences.theme || 'light';
    updatePreferences({ theme: currentTheme === 'light' ? 'dark' : 'light' });
  }, [preferences.theme, updatePreferences]);

  return {
    preferences,
    setPreferences: updatePreferences,
    updatePreferences,
    toggleTheme,
    isLoaded
  };
}

// Hook for dashboard data
export function useDashboard() {
  const [dashboardData, setDashboardData] = useState({});
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadedData = appStore.getDashboardData();
    setDashboardData(loadedData);
    setIsLoaded(true);

    const unsubscribe = appStore.subscribe(() => {
      setDashboardData(appStore.getDashboardData());
    });

    return unsubscribe;
  }, []);

  const updateDashboard = useCallback((updates) => {
    const currentData = appStore.getDashboardData();
    const updatedData = { ...currentData, ...updates };
    appStore.setDashboardData(updatedData);
  }, []);

  return {
    dashboardData,
    updateDashboard,
    isLoaded
  };
}

// Hook for messages
export function useMessages() {
  const [messages, setMessages] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadedMessages = appStore.getMessages();
    setMessages(loadedMessages);
    setIsLoaded(true);

    const unsubscribe = appStore.subscribe(() => {
      setMessages(appStore.getMessages());
    });

    return unsubscribe;
  }, []);

  const addMessage = useCallback((message) => {
    return appStore.addMessage(message);
  }, []);

  const markAsRead = useCallback((messageId) => {
    const updatedMessages = messages.map(msg => 
      msg.id === messageId ? { ...msg, read: true } : msg
    );
    appStore.setMessages(updatedMessages);
  }, [messages]);

  const getUnreadCount = useCallback(() => {
    return messages.filter(msg => !msg.read).length;
  }, [messages]);

  return {
    messages,
    addMessage,
    markAsRead,
    getUnreadCount,
    isLoaded
  };
}

// Hook for sync status and control
export function useSyncStatus() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [syncError, setSyncError] = useState(null);

  const forceSync = useCallback(async () => {
    setIsSyncing(true);
    setSyncError(null);
    
    try {
      await appStore.forceSync();
      setLastSync(new Date());
    } catch (error) {
      console.error('Force sync failed:', error);
      setSyncError(error.message);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  const getStorageInfo = useCallback(() => {
    return localStorageManager.getStorageInfo();
  }, []);

  const clearAllData = useCallback(async () => {
    try {
      appStore.clear();
      return true;
    } catch (error) {
      console.error('Failed to clear data:', error);
      return false;
    }
  }, []);

  return {
    isSyncing,
    lastSync,
    syncError,
    forceSync,
    getStorageInfo,
    clearAllData
  };
}

// Hook for data export/import
export function useDataManagement() {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const exportData = useCallback(async () => {
    setIsExporting(true);
    try {
      const data = appStore.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `lead-software-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return true;
    } catch (error) {
      console.error('Export failed:', error);
      return false;
    } finally {
      setIsExporting(false);
    }
  }, []);

  const importData = useCallback(async (file) => {
    setIsImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const success = appStore.importData(data);
      return success;
    } catch (error) {
      console.error('Import failed:', error);
      return false;
    } finally {
      setIsImporting(false);
    }
  }, []);

  return {
    isExporting,
    isImporting,
    exportData,
    importData
  };
}

// Hook for store initialization status
export function useStoreInitialization() {
  const [isInitialized, setIsInitialized] = useState(appStore.isInitialized);

  useEffect(() => {
    if (!appStore.isInitialized) {
      const checkInitialization = () => {
        if (appStore.isInitialized) {
          setIsInitialized(true);
        }
      };

      const interval = setInterval(checkInitialization, 100);
      return () => clearInterval(interval);
    }
  }, []);

  return isInitialized;
}

// Hook for search functionality across all data
export function useGlobalSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({
    leads: [],
    campaigns: [],
    messages: []
  });

  const leads = useAppStore(state => state.leads) || [];
  const campaigns = useAppStore(state => state.campaigns) || [];
  const messages = useAppStore(state => state.messages) || [];

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults({ leads: [], campaigns: [], messages: [] });
      return;
    }

    const query = searchQuery.toLowerCase();
    
    const filteredLeads = leads.filter(lead => 
      (lead.name && lead.name.toLowerCase().includes(query)) ||
      (lead.email && lead.email.toLowerCase().includes(query)) ||
      (lead.company && lead.company.toLowerCase().includes(query))
    );

    const filteredCampaigns = campaigns.filter(campaign =>
      (campaign.name && campaign.name.toLowerCase().includes(query)) ||
      (campaign.description && campaign.description.toLowerCase().includes(query))
    );

    const filteredMessages = messages.filter(message =>
      (message.subject && message.subject.toLowerCase().includes(query)) ||
      (message.content && message.content.toLowerCase().includes(query))
    );

    setSearchResults({
      leads: filteredLeads,
      campaigns: filteredCampaigns,
      messages: filteredMessages
    });
  }, [searchQuery, leads, campaigns, messages]);

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    totalResults: searchResults.leads.length + searchResults.campaigns.length + searchResults.messages.length
  };
}