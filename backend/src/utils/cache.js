/**
 * Simple In-Memory Cache for Node.js
 * Used to cache high-traffic public data (banners, product sections)
 * to reduce database load and improve response time.
 */

class Cache {
  constructor(ttl = 600000) { // Default 10 minutes (600,000 ms)
    this.cache = new Map();
    this.ttl = ttl;
  }

  set(key, value, customTtl = null) {
    const expiresAt = Date.now() + (customTtl || this.ttl);
    this.cache.set(key, { value, expiresAt });
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  delete(key) {
    this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  /**
   * Middleware/Wrapper to cache a function result
   */
  async getOrSet(key, fn, customTtl = null) {
    const cached = this.get(key);
    if (cached) {
      console.log(`[Cache] HIT: ${key}`);
      return cached;
    }

    console.log(`[Cache] MISS: ${key}`);
    const value = await fn();
    this.set(key, value, customTtl);
    return value;
  }
}

// Global instances for different data types
export const publicCache = new Cache(1000 * 60 * 5); // 5 minutes for public data
export const productCache = new Cache(1000 * 60 * 2); // 2 minutes for products
