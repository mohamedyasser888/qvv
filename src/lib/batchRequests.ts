/**
 * Request Batching Utility
 * Batches multiple database requests into single calls to reduce network overhead
 */

type BatchRequest<T> = {
  key: string
  resolver: (value: T) => void
  rejector: (error: Error) => void
}

class RequestBatcher<T> {
  private queue: BatchRequest<T>[] = []
  private timeout: NodeJS.Timeout | null = null
  private batchDelay: number

  constructor(
    private executor: (keys: string[]) => Promise<Map<string, T>>,
    batchDelay = 10 // ms
  ) {
    this.batchDelay = batchDelay
  }

  /**
   * Add request to batch queue
   */
  request(key: string): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push({
        key,
        resolver: resolve,
        rejector: reject,
      })

      // Clear existing timeout
      if (this.timeout) {
        clearTimeout(this.timeout)
      }

      // Schedule batch execution
      this.timeout = setTimeout(() => {
        this.executeBatch()
      }, this.batchDelay)
    })
  }

  /**
   * Execute batched requests
   */
  private async executeBatch() {
    if (this.queue.length === 0) return

    const currentQueue = [...this.queue]
    this.queue = []
    this.timeout = null

    // Extract unique keys
    const keys = [...new Set(currentQueue.map(r => r.key))]

    try {
      // Execute batch request
      const results = await this.executor(keys)

      // Resolve all promises
      currentQueue.forEach(request => {
        const result = results.get(request.key)
        if (result !== undefined) {
          request.resolver(result)
        } else {
          request.rejector(new Error(`No result for key: ${request.key}`))
        }
      })
    } catch (error) {
      // Reject all promises on error
      currentQueue.forEach(request => {
        request.rejector(error as Error)
      })
    }
  }
}

/**
 * Profile data batcher - reduces multiple profile queries to single batch
 */
export const profileBatcher = new RequestBatcher<any>(async (userIds: string[]) => {
  const { createClient } = await import('./supabase/client')
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .in('id', userIds)

  if (error) throw error

  // Convert array to Map for O(1) lookup
  const resultsMap = new Map()
  data?.forEach(profile => {
    resultsMap.set(profile.id, profile)
  })

  return resultsMap
})

/**
 * Achievement data batcher
 */
export const achievementBatcher = new RequestBatcher<any>(async (achievementIds: string[]) => {
  const { createClient } = await import('./supabase/client')
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('achievements')
    .select('*')
    .in('id', achievementIds)

  if (error) throw error

  const resultsMap = new Map()
  data?.forEach(achievement => {
    resultsMap.set(achievement.id, achievement)
  })

  return resultsMap
})

/**
 * Generic batch loader factory
 */
export function createBatchLoader<T>(
  tableName: string,
  batchDelay = 10
): RequestBatcher<T> {
  return new RequestBatcher<T>(async (ids: string[]) => {
    const { createClient } = await import('./supabase/client')
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .in('id', ids)

    if (error) throw error

    const resultsMap = new Map()
    data?.forEach((item: any) => {
      resultsMap.set(item.id, item)
    })

    return resultsMap
  }, batchDelay)
}

/**
 * Debounce utility for reducing API calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }

    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(later, wait)
  }
}

/**
 * Throttle utility for rate limiting
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => {
        inThrottle = false
      }, limit)
    }
  }
}
