/**
 * Clear cache for a specific model
 */
export const clearModelSpecificCache = async (modelId: string): Promise<boolean> => {
  try {
    console.log(`🧹 Clearing cache for model: ${modelId}`);
    
    // Clear from Cache API
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      for (const cacheName of cacheNames) {
        if (cacheName.includes(modelId) || cacheName.includes('webllm') || cacheName.includes('mlc')) {
          const cache = await caches.open(cacheName);
          const requests = await cache.keys();
          for (const request of requests) {
            if (request.url.includes(modelId)) {
              await cache.delete(request);
              console.log(`Deleted cache entry: ${request.url}`);
            }
          }
        }
      }
    }
    
    // Clear from localStorage
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes(modelId) || key.includes('webllm') || key.includes('mlc'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      console.log(`Removed localStorage key: ${key}`);
    });
    
    console.log(`✅ Model cache cleared for: ${modelId}`);
    return true;
  } catch (error) {
    console.error(`❌ Error clearing model cache for ${modelId}:`, error);
    return false;
  }
};

/**
 * Comprehensive cache cleanup for WebLLM
 */
export const clearAllCaches = async (): Promise<boolean> => {
  try {
    console.log("🧹 Starting comprehensive cache cleanup...");
    
    // Clear Cache API
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      console.log(`Found ${cacheNames.length} cache(s):`, cacheNames);
      await Promise.all(cacheNames.map(async (name) => {
        console.log(`Deleting cache: ${name}`);
        return caches.delete(name);
      }));
    }
    
    // Clear localStorage
    const localStorageKeys = Object.keys(localStorage);
    console.log(`Clearing ${localStorageKeys.length} localStorage items`);
    localStorage.clear();
    
    // Clear sessionStorage
    const sessionStorageKeys = Object.keys(sessionStorage);
    console.log(`Clearing ${sessionStorageKeys.length} sessionStorage items`);
    sessionStorage.clear();
    
    // Clear IndexedDB databases
    if ('indexedDB' in window) {
      try {
        // Try to get databases list
        let databases = [];
        try {
          databases = await indexedDB.databases();
        } catch (e) {
          // Fallback to common database names if databases() is not supported
          databases = [
            { name: 'webllm-cache' },
            { name: 'model-cache' },
            { name: 'mlc-cache' },
            { name: 'transformers-cache' },
            { name: 'cache-storage' },
            { name: 'wasm-cache' }
          ];
        }
        
        for (const db of databases) {
          if (db.name) {
            try {
              const deleteReq = indexedDB.deleteDatabase(db.name);
              await new Promise((resolve, reject) => {
                deleteReq.onsuccess = () => {
                  console.log(`Deleted IndexedDB: ${db.name}`);
                  resolve(undefined);
                };
                deleteReq.onerror = () => reject(deleteReq.error);
                deleteReq.onblocked = () => {
                  console.warn(`IndexedDB ${db.name} deletion blocked`);
                  resolve(undefined);
                };
                // Timeout after 5 seconds
                setTimeout(() => resolve(undefined), 5000);
              });
            } catch (err) {
              console.log(`IndexedDB ${db.name} deletion failed:`, err);
            }
          }
        }
      } catch (err) {
        console.warn("IndexedDB cleanup failed:", err);
      }
    }

    // Clear Service Worker cache if available
    if ('serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
          console.log('Service worker unregistered');
        }
      } catch (e) {
        console.log('Service worker cleanup failed:', e);
      }
    }

    console.log("✅ Cache cleanup completed successfully");
    return true;
  } catch (error) {
    console.error("❌ Error during cache cleanup:", error);
    return false;
  }
};
