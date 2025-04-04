export type CacheKey = string
export type CacheEntry<T> = {
  value: T
  timestamp: number
}

export class PoorManCache<T> {
  private cache: Map<CacheKey, CacheEntry<T>>
  private duration: number

  /**
   * Create a new cache instance
   * @param duration Cache duration in milliseconds
   */
  constructor(duration: number) {
    this.cache = new Map<CacheKey, CacheEntry<T>>()
    this.duration = duration
  }

  /**
   * Get a value from the cache
   * @param key Cache key
   * @returns The cached value or undefined if not found or expired
   */
  get(key: CacheKey): T | undefined {
    const entry = this.cache.get(key)

    if (!entry) {
      return undefined
    }

    // Check if entry is expired
    if (Date.now() - entry.timestamp > this.duration) {
      this.cache.delete(key)
      return undefined
    }

    return entry.value
  }

  /**
   * Set a value in the cache
   * @param key Cache key
   * @param value Value to cache
   */
  set(key: CacheKey, value: T): void {
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
    })
  }

  /**
   * Check if a key exists in the cache and is not expired
   * @param key Cache key
   * @returns True if the key exists and is not expired
   */
  has(key: CacheKey): boolean {
    const entry = this.cache.get(key)

    if (!entry) {
      return false
    }

    // Check if entry is expired
    if (Date.now() - entry.timestamp > this.duration) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  /**
   * Remove a key from the cache
   * @param key Cache key
   */
  delete(key: CacheKey): void {
    this.cache.delete(key)
  }

  /**
   * Clear all expired entries from the cache
   */
  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.duration) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Get the current size of the cache
   * @returns Number of entries in the cache
   */
  size(): number {
    return this.cache.size
  }

  /**
   * Clear all entries from the cache
   */
  clear(): void {
    this.cache.clear()
  }
}
