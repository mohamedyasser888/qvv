/**
 * Real-time WebSocket Optimizations
 * Advanced tuning for Supabase Realtime channels to minimize latency
 */

import type { RealtimeChannel } from '@supabase/supabase-js'
import { throttle } from './batchRequests'

/**
 * Optimized channel configuration
 */
export const OPTIMIZED_CHANNEL_CONFIG = {
  params: {
    eventsPerSecond: 20, // Increased from default 10 for faster updates
  },
  timeout: 10000, // 10 seconds
}

/**
 * Message batching for real-time updates
 * Batches multiple updates within a time window to reduce overhead
 */
export class RealtimeBatcher {
  private queue: any[] = []
  private timeout: NodeJS.Timeout | null = null
  private readonly batchWindow: number
  private readonly onFlush: (items: any[]) => void

  constructor(onFlush: (items: any[]) => void, batchWindow = 16) {
    // 16ms = ~60fps
    this.onFlush = onFlush
    this.batchWindow = batchWindow
  }

  /**
   * Add item to batch
   */
  add(item: any) {
    this.queue.push(item)

    if (this.timeout) {
      clearTimeout(this.timeout)
    }

    this.timeout = setTimeout(() => {
      this.flush()
    }, this.batchWindow)
  }

  /**
   * Flush batch immediately
   */
  flush() {
    if (this.queue.length === 0) return

    const items = [...this.queue]
    this.queue = []
    this.timeout = null

    this.onFlush(items)
  }

  /**
   * Clear pending batch
   */
  clear() {
    this.queue = []
    if (this.timeout) {
      clearTimeout(this.timeout)
      this.timeout = null
    }
  }
}

/**
 * Heartbeat manager to keep connection alive
 */
export class HeartbeatManager {
  private interval: NodeJS.Timeout | null = null
  private readonly intervalMs: number
  private readonly onHeartbeat: () => void

  constructor(onHeartbeat: () => void, intervalMs = 30000) {
    // 30 seconds default
    this.onHeartbeat = onHeartbeat
    this.intervalMs = intervalMs
  }

  start() {
    if (this.interval) return

    this.interval = setInterval(() => {
      this.onHeartbeat()
    }, this.intervalMs)
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }
  }

  reset() {
    this.stop()
    this.start()
  }
}

/**
 * Connection quality monitor
 */
export class ConnectionMonitor {
  private lastMessageTime = Date.now()
  private messageCount = 0
  private readonly onQualityChange: (quality: 'excellent' | 'good' | 'poor' | 'critical') => void

  constructor(onQualityChange: (quality: 'excellent' | 'good' | 'poor' | 'critical') => void) {
    this.onQualityChange = onQualityChange
    this.startMonitoring()
  }

  /**
   * Record message received
   */
  recordMessage() {
    this.lastMessageTime = Date.now()
    this.messageCount++
  }

  /**
   * Get current quality
   */
  getQuality(): 'excellent' | 'good' | 'poor' | 'critical' {
    const timeSinceLastMessage = Date.now() - this.lastMessageTime

    if (timeSinceLastMessage < 1000) return 'excellent' // < 1s
    if (timeSinceLastMessage < 5000) return 'good' // < 5s
    if (timeSinceLastMessage < 15000) return 'poor' // < 15s
    return 'critical' // > 15s
  }

  /**
   * Start monitoring
   */
  private startMonitoring() {
    setInterval(() => {
      const quality = this.getQuality()
      this.onQualityChange(quality)
    }, 2000) // Check every 2 seconds
  }

  /**
   * Get message rate (messages per second)
   */
  getMessageRate(windowMs = 10000): number {
    // Simplified - in production, track timestamps
    return this.messageCount / (windowMs / 1000)
  }

  /**
   * Reset statistics
   */
  reset() {
    this.lastMessageTime = Date.now()
    this.messageCount = 0
  }
}

/**
 * Adaptive reconnection strategy
 * Exponential backoff with jitter
 */
export class ReconnectionManager {
  private attempt = 0
  private readonly maxAttempts: number
  private readonly baseDelay: number
  private readonly maxDelay: number
  private timeout: NodeJS.Timeout | null = null

  constructor(
    private readonly onReconnect: () => void,
    maxAttempts = 10,
    baseDelay = 1000,
    maxDelay = 30000
  ) {
    this.maxAttempts = maxAttempts
    this.baseDelay = baseDelay
    this.maxDelay = maxDelay
  }

  /**
   * Schedule reconnection attempt
   */
  scheduleReconnect() {
    if (this.attempt >= this.maxAttempts) {
      console.error('[Realtime] Max reconnection attempts reached')
      return
    }

    // Exponential backoff: delay = baseDelay * 2^attempt + random jitter
    const exponentialDelay = this.baseDelay * Math.pow(2, this.attempt)
    const jitter = Math.random() * 1000 // Random 0-1000ms
    const delay = Math.min(exponentialDelay + jitter, this.maxDelay)

    console.log(`[Realtime] Reconnecting in ${Math.round(delay)}ms (attempt ${this.attempt + 1}/${this.maxAttempts})`)

    this.timeout = setTimeout(() => {
      this.attempt++
      this.onReconnect()
    }, delay)
  }

  /**
   * Cancel pending reconnection
   */
  cancel() {
    if (this.timeout) {
      clearTimeout(this.timeout)
      this.timeout = null
    }
  }

  /**
   * Reset reconnection state (on successful connection)
   */
  reset() {
    this.cancel()
    this.attempt = 0
  }
}

/**
 * Message deduplication
 * Prevents processing duplicate messages
 */
export class MessageDeduplicator {
  private readonly seen = new Set<string>()
  private readonly maxSize: number
  private readonly ttl: number

  constructor(maxSize = 1000, ttl = 60000) {
    // Keep last 1000 messages for 1 minute
    this.maxSize = maxSize
    this.ttl = ttl
  }

  /**
   * Check if message is duplicate
   */
  isDuplicate(messageId: string): boolean {
    if (this.seen.has(messageId)) {
      return true
    }

    this.seen.add(messageId)

    // Clean up old entries if size exceeded
    if (this.seen.size > this.maxSize) {
      const toRemove = this.seen.size - this.maxSize
      const iterator = this.seen.values()
      for (let i = 0; i < toRemove; i++) {
        const { value } = iterator.next()
        if (value) this.seen.delete(value)
      }
    }

    // Auto-remove after TTL
    setTimeout(() => {
      this.seen.delete(messageId)
    }, this.ttl)

    return false
  }

  /**
   * Clear all entries
   */
  clear() {
    this.seen.clear()
  }
}

/**
 * Channel presence optimization
 * Efficient tracking of online users
 */
export class PresenceOptimizer {
  private readonly presenceMap = new Map<string, any>()
  private readonly onChange: (users: any[]) => void
  private updateTimeout: NodeJS.Timeout | null = null

  constructor(onChange: (users: any[]) => void) {
    this.onChange = onChange
  }

  /**
   * Update presence (batched)
   */
  update(userId: string, data: any) {
    this.presenceMap.set(userId, {
      ...data,
      lastSeen: Date.now(),
    })

    // Batch updates
    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout)
    }

    this.updateTimeout = setTimeout(() => {
      this.flush()
    }, 100) // 100ms batch window
  }

  /**
   * Remove user
   */
  remove(userId: string) {
    this.presenceMap.delete(userId)
    this.flush()
  }

  /**
   * Flush changes
   */
  private flush() {
    const users = Array.from(this.presenceMap.values())
    this.onChange(users)
  }

  /**
   * Get all present users
   */
  getAll(): any[] {
    return Array.from(this.presenceMap.values())
  }

  /**
   * Clean up stale presence (users offline > 1 minute)
   */
  cleanup(staleThreshold = 60000) {
    const now = Date.now()
    let removed = 0

    for (const [userId, data] of this.presenceMap.entries()) {
      if (now - data.lastSeen > staleThreshold) {
        this.presenceMap.delete(userId)
        removed++
      }
    }

    if (removed > 0) {
      console.log(`[Presence] Cleaned up ${removed} stale users`)
      this.flush()
    }
  }
}

/**
 * Binary message compression (for large payloads)
 */
export function compressMessage(data: any): string {
  try {
    const json = JSON.stringify(data)
    // In production, use actual compression library like pako
    // For now, just return stringified (Next.js already does gzip)
    return json
  } catch (error) {
    console.error('[Realtime] Compression failed:', error)
    return JSON.stringify(data)
  }
}

/**
 * Binary message decompression
 */
export function decompressMessage(compressed: string): any {
  try {
    return JSON.parse(compressed)
  } catch (error) {
    console.error('[Realtime] Decompression failed:', error)
    return null
  }
}

/**
 * Throttled broadcast helper
 * Prevents flooding the channel with too many messages
 */
export function createThrottledBroadcast(
  channel: RealtimeChannel,
  event: string,
  limitMs = 50 // 20 messages per second max
) {
  return throttle((payload: any) => {
    channel.send({
      type: 'broadcast',
      event,
      payload,
    })
  }, limitMs)
}
