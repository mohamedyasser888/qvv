/**
 * Query Cache Utility
 * Caches database queries in memory to avoid redundant requests
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  expiresAt: number
}

class QueryCache {
  private cache = new Map<string, CacheEntry<any>>()
  private defaultTTL = 60000 // 1 minute default

  /**
   * Get cached data or execute query
   */
  async get<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = this.defaultTTL
  ): Promise<T> {
    const now = Date.now()
    const cached = this.cache.get(key)

    // Return cached data if valid
    if (cached && cached.expiresAt > now) {
      return cached.data as T
    }

    // Fetch fresh data
    const data = await fetcher()

    // Cache the result
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + ttl,
    })

    // Clean up old entries periodically
    this.cleanup()

    return data
  }

  /**
   * Invalidate cache entry
   */
  invalidate(key: string) {
    this.cache.delete(key)
  }

  /**
   * Invalidate all entries matching pattern
   */
  invalidatePattern(pattern: RegExp) {
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Clear all cache
   */
  clear() {
    this.cache.clear()
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size
  }

  /**
   * Clean up expired entries
   */
  private cleanup() {
    const now = Date.now()
    let cleaned = 0

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt < now) {
        this.cache.delete(key)
        cleaned++
      }
    }

    // Log cleanup in development
    if (cleaned > 0 && process.env.NODE_ENV === 'development') {
      console.log(`🧹 Cleaned ${cleaned} expired cache entries`)
    }
  }

  /**
   * Prefetch data (cache warming)
   */
  async prefetch<T>(key: string, fetcher: () => Promise<T>, ttl?: number) {
    await this.get(key, fetcher, ttl)
  }
}

// Export singleton instance
export const queryCache = new QueryCache()

/**
 * Hook for using query cache in React components
 */
export function useCachedQuery<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl?: number
) {
  return queryCache.get(key, fetcher, ttl)
}

/**
 * Generate cache key from parameters
 */
export function cacheKey(base: string, ...params: (string | number | boolean)[]): string {
  return `${base}:${params.join(':')}`
}

/**
 * Profile cache helper
 */
export async function getCachedProfile(userId: string) {
  const { createClient } = await import('./supabase/client')
  const supabase = createClient()

  return queryCache.get(
    cacheKey('profile', userId),
    async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      return data
    },
    300000 // 5 minutes TTL
  )
}

/**
 * Room cache helper
 */
export async function getCachedRoom(roomCode: string) {
  const { createClient } = await import('./supabase/client')
  const supabase = createClient()

  return queryCache.get(
    cacheKey('room', roomCode),
    async () => {
      const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('room_code', roomCode)
        .single()

      if (error) throw error
      return data
    },
    30000 // 30 seconds TTL (rooms change frequently)
  )
}

/**
 * Achievements cache helper
 */
export async function getCachedAchievements() {
  const { createClient } = await import('./supabase/client')
  const supabase = createClient()

  return queryCache.get(
    'achievements:all',
    async () => {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .order('rarity', { ascending: true })

      if (error) throw error
      return data
    },
    600000 // 10 minutes TTL (achievements rarely change)
  )
}

/**
 * Leaderboard cache helper
 */
export async function getCachedLeaderboard() {
  const { createClient } = await import('./supabase/client')
  const supabase = createClient()

  return queryCache.get(
    'leaderboard:global',
    async () => {
      const { data, error } = await supabase.rpc('get_global_leaderboard')

      if (error) throw error
      return data
    },
    60000 // 1 minute TTL (leaderboard changes frequently)
  )
}
