// Offline Cache Service for Blood Bank Management System
// Provides offline storage and sync capabilities for critical data

interface CacheItem<T> {
  data: T;
  timestamp: number;
  version: number;
}

interface CacheConfig {
  maxAge: number; // in milliseconds
  maxItems: number;
}

class OfflineCache {
  private cache = new Map<string, CacheItem<any>>();
  private config: CacheConfig = {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    maxItems: 1000
  };

  // Set data in cache
  set<T>(key: string, data: T, version: number = 1): void {
    // Clean up old items if we're at capacity
    if (this.cache.size >= this.config.maxItems) {
      this.cleanup();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      version
    });

    // Also store in localStorage for persistence
    try {
      localStorage.setItem(`cache_${key}`, JSON.stringify({
        data,
        timestamp: Date.now(),
        version
      }));
    } catch (e) {
      console.warn('Failed to store cache in localStorage:', e);
    }
  }

  // Get data from cache
  get<T>(key: string): T | null {
    // First try memory cache
    const memoryItem = this.cache.get(key);
    if (memoryItem && this.isValid(memoryItem)) {
      return memoryItem.data;
    }

    // Then try localStorage
    try {
      const stored = localStorage.getItem(`cache_${key}`);
      if (stored) {
        const item: CacheItem<T> = JSON.parse(stored);
        if (this.isValid(item)) {
          // Restore to memory cache
          this.cache.set(key, item);
          return item.data;
        }
      }
    } catch (e) {
      console.warn('Failed to retrieve cache from localStorage:', e);
    }

    return null;
  }

  // Check if cache item is still valid
  private isValid(item: CacheItem<any>): boolean {
    return Date.now() - item.timestamp < this.config.maxAge;
  }

  // Clean up expired items
  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    this.cache.forEach((item, key) => {
      if (now - item.timestamp >= this.config.maxAge) {
        expiredKeys.push(key);
      }
    });

    expiredKeys.forEach(key => {
      this.cache.delete(key);
      localStorage.removeItem(`cache_${key}`);
    });
  }

  // Clear all cache
  clear(): void {
    this.cache.clear();
    
    // Clear localStorage cache items
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('cache_')) {
        localStorage.removeItem(key);
      }
    });
  }

  // Get cache statistics
  getStats() {
    let validItems = 0;
    let expiredItems = 0;

    this.cache.forEach((item) => {
      if (this.isValid(item)) {
        validItems++;
      } else {
        expiredItems++;
      }
    });

    return {
      totalItems: this.cache.size,
      validItems,
      expiredItems,
      memoryUsage: this.cache.size
    };
  }

  // Check if we're online
  isOnline(): boolean {
    return navigator.onLine;
  }

  // Get cached data with fallback
  async getWithFallback<T>(
    key: string, 
    fetchFn: () => Promise<T>, 
    version: number = 1
  ): Promise<T> {
    // Try cache first
    const cached = this.get<T>(key);
    if (cached) {
      return cached;
    }

    // If online, fetch fresh data
    if (this.isOnline()) {
      try {
        const freshData = await fetchFn();
        this.set(key, freshData, version);
        return freshData;
      } catch (error) {
        console.warn(`Failed to fetch fresh data for ${key}:`, error);
        // Return cached data even if expired
        const expiredCached = this.cache.get(key)?.data;
        if (expiredCached) {
          return expiredCached;
        }
        throw error;
      }
    }

    // If offline and no cache, throw error
    throw new Error('No cached data available and offline');
  }
}

// Create singleton instance
const offlineCache = new OfflineCache();

// Cache keys for different data types
export const CACHE_KEYS = {
  INVENTORY: 'blood_inventory',
  DONORS: 'donors',
  TRANSFERS: 'blood_transfers',
  FACILITIES: 'facilities',
  REQUESTS: 'blood_requests'
} as const;

// Helper functions for common operations
export const cacheInventory = (data: any[]) => {
  offlineCache.set(CACHE_KEYS.INVENTORY, data);
};

export const getCachedInventory = () => {
  return offlineCache.get<any[]>(CACHE_KEYS.INVENTORY);
};

export const cacheDonors = (data: any[]) => {
  offlineCache.set(CACHE_KEYS.DONORS, data);
};

export const getCachedDonors = () => {
  return offlineCache.get<any[]>(CACHE_KEYS.DONORS);
};

export const cacheTransfers = (data: any[]) => {
  offlineCache.set(CACHE_KEYS.TRANSFERS, data);
};

export const getCachedTransfers = () => {
  return offlineCache.get<any[]>(CACHE_KEYS.TRANSFERS);
};

export const cacheFacilities = (data: any[]) => {
  offlineCache.set(CACHE_KEYS.FACILITIES, data);
};

export const getCachedFacilities = () => {
  return offlineCache.get<any[]>(CACHE_KEYS.FACILITIES);
};

export const cacheRequests = (data: any[]) => {
  offlineCache.set(CACHE_KEYS.REQUESTS, data);
};

export const getCachedRequests = () => {
  return offlineCache.get<any[]>(CACHE_KEYS.REQUESTS);
};

// Generic cache with fallback
export const getCachedData = async <T>(
  key: string,
  fetchFn: () => Promise<T>,
  version: number = 1
): Promise<T> => {
  return offlineCache.getWithFallback(key, fetchFn, version);
};

// Clear all cache
export const clearAllCache = () => {
  offlineCache.clear();
};

// Get cache statistics
export const getCacheStats = () => {
  return offlineCache.getStats();
};

// Check online status
export const isOnline = () => {
  return offlineCache.isOnline();
};

export default offlineCache;
