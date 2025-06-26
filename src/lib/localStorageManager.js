// src/lib/localStorageManager.js
class LocalStorageManager {
  constructor() {
    this.isClient = typeof window !== 'undefined';
    this.syncQueue = [];
    this.syncInProgress = false;
    this.syncInterval = null;
    
    // Auto-sync every 30 seconds
    if (this.isClient) {
      this.startAutoSync();
    }
  }

  // Drop-in replacement for localStorage.getItem
  getItem(key) {
    if (!this.isClient) {
      return null;
    }
    
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error(`Error getting item ${key}:`, error);
      return null;
    }
  }

  // Drop-in replacement for localStorage.setItem with auto-sync
  setItem(key, value) {
    if (!this.isClient) {
      return;
    }
    
    try {
      localStorage.setItem(key, value);
      
      // Add to sync queue
      this.addToSyncQueue(key, value);
      
      return true;
    } catch (error) {
      console.error(`Error setting item ${key}:`, error);
      return false;
    }
  }

  // Drop-in replacement for localStorage.removeItem
  removeItem(key) {
    if (!this.isClient) {
      return;
    }
    
    try {
      localStorage.removeItem(key);
      
      // Add removal to sync queue
      this.addToSyncQueue(key, null, 'remove');
      
      return true;
    } catch (error) {
      console.error(`Error removing item ${key}:`, error);
      return false;
    }
  }

  // Add item to sync queue
  addToSyncQueue(key, value, operation = 'set') {
    const syncItem = {
      key,
      value,
      operation,
      timestamp: new Date().toISOString(),
      userId: this.getCurrentUserId()
    };

    // Remove existing entries for the same key to avoid duplicates
    this.syncQueue = this.syncQueue.filter(item => item.key !== key);
    
    // Add new entry
    this.syncQueue.push(syncItem);

    // Trigger immediate sync for critical data
    if (this.isCriticalData(key)) {
      this.syncToMongoDB();
    }
  }

  // Check if data is critical and needs immediate sync
  isCriticalData(key) {
    const criticalKeys = [
      'leads-data',
      'campaign-data',
      'user-preferences',
      'analytics-data'
    ];
    return criticalKeys.some(criticalKey => key.includes(criticalKey));
  }

  // Get current user ID (implement based on your auth system)
  getCurrentUserId() {
    if (this.isClient) {
      try {
        const userSession = localStorage.getItem('user-session');
        return userSession ? JSON.parse(userSession).userId : 'anonymous';
      } catch {
        return 'anonymous';
      }
    }
    return 'anonymous';
  }

  // Sync data to MongoDB
  async syncToMongoDB() {
    if (this.syncInProgress || this.syncQueue.length === 0) {
      return;
    }

    this.syncInProgress = true;
    const itemsToSync = [...this.syncQueue];
    
    try {
      const response = await fetch('/api/sync-storage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: itemsToSync
        })
      });

      if (response.ok) {
        // Clear synced items from queue
        this.syncQueue = [];
        console.log(`Synced ${itemsToSync.length} items to MongoDB`);
      } else {
        console.error('Failed to sync to MongoDB:', response.statusText);
      }
    } catch (error) {
      console.error('Error syncing to MongoDB:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  // Load data from MongoDB to localStorage on app start
  async loadFromMongoDB() {
    if (!this.isClient) return;

    try {
      const userId = this.getCurrentUserId();
      const response = await fetch(`/api/load-storage?userId=${userId}`);
      
      if (response.ok) {
        const data = await response.json();
        
        // Load each item into localStorage
        Object.entries(data).forEach(([key, value]) => {
          if (value !== null) {
            localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
          }
        });
        
        console.log('Loaded data from MongoDB to localStorage');
      }
    } catch (error) {
      console.error('Error loading from MongoDB:', error);
    }
  }

  // Start auto-sync interval
  startAutoSync() {
    this.syncInterval = setInterval(() => {
      this.syncToMongoDB();
    }, 30000); // Sync every 30 seconds
  }

  // Stop auto-sync interval
  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  // Manual sync trigger
  forceSync() {
    return this.syncToMongoDB();
  }

  // Batch operations for better performance
  setMultipleItems(items) {
    if (!this.isClient) return;

    Object.entries(items).forEach(([key, value]) => {
      this.setItem(key, value);
    });
  }

  // Get all keys (useful for debugging)
  getAllKeys() {
    if (!this.isClient) return [];
    
    try {
      return Object.keys(localStorage);
    } catch (error) {
      console.error('Error getting all keys:', error);
      return [];
    }
  }

  // Clear all data and sync deletion
  clear() {
    if (!this.isClient) return;
    
    try {
      const keys = this.getAllKeys();
      localStorage.clear();
      
      // Add all keys to sync queue for deletion
      keys.forEach(key => {
        this.addToSyncQueue(key, null, 'remove');
      });
      
      return true;
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      return false;
    }
  }

  // Get storage info
  getStorageInfo() {
    if (!this.isClient) return null;
    
    try {
      return {
        length: localStorage.length,
        keys: this.getAllKeys(),
        syncQueueLength: this.syncQueue.length,
        isSyncing: this.syncInProgress
      };
    } catch (error) {
      console.error('Error getting storage info:', error);
      return null;
    }
  }
}

// Create singleton instance
const localStorageManager = new LocalStorageManager();

// Export both the class and instance
export { LocalStorageManager };
export default localStorageManager;