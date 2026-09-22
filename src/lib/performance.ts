/**
 * Performance Monitoring and Web Vitals Tracking
 * Tracks real user performance metrics
 */

// Web Vitals metric types
export interface Metric {
  id: string
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  delta: number
  entries: PerformanceEntry[]
}

// Performance thresholds (based on Google recommendations)
const THRESHOLDS = {
  // Largest Contentful Paint (LCP): measures loading performance
  LCP: {
    good: 2500,
    poor: 4000,
  },
  // First Input Delay (FID): measures interactivity
  FID: {
    good: 100,
    poor: 300,
  },
  // Cumulative Layout Shift (CLS): measures visual stability
  CLS: {
    good: 0.1,
    poor: 0.25,
  },
  // First Contentful Paint (FCP): measures perceived load speed
  FCP: {
    good: 1800,
    poor: 3000,
  },
  // Time to First Byte (TTFB): measures server response time
  TTFB: {
    good: 800,
    poor: 1800,
  },
  // Interaction to Next Paint (INP): measures overall responsiveness
  INP: {
    good: 200,
    poor: 500,
  },
}

// Get rating based on value and thresholds
function getRating(
  name: string,
  value: number
): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[name as keyof typeof THRESHOLDS]
  if (!threshold) return 'good'

  if (value <= threshold.good) return 'good'
  if (value <= threshold.poor) return 'needs-improvement'
  return 'poor'
}

// Format metric value for display
export function formatMetricValue(name: string, value: number): string {
  if (name === 'CLS') {
    return value.toFixed(3)
  }
  return `${Math.round(value)}ms`
}

// Report metric to analytics
function reportMetric(metric: Metric) {
  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    id: metric.id,
    delta: metric.delta,
  })

  // Send to analytics endpoint (if configured)
  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/analytics', body)
  } else {
    fetch('/api/analytics', {
      body,
      method: 'POST',
      keepalive: true,
      headers: {
        'Content-Type': 'application/json',
      },
    }).catch((error) => {
      // Silently fail if analytics endpoint doesn't exist
      console.warn('Analytics reporting failed:', error)
    })
  }

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Performance] ${metric.name}:`, {
      value: formatMetricValue(metric.name, metric.value),
      rating: metric.rating,
      id: metric.id,
    })
  }
}

// Track Web Vitals
export function trackWebVitals() {
  if (typeof window === 'undefined') return

  // Dynamic import to avoid bundling in server-side code
  import('web-vitals').then(({ onCLS, onFCP, onLCP, onTTFB, onINP }) => {
    onCLS(reportMetric)
    onFCP(reportMetric)
    onLCP(reportMetric)
    onTTFB(reportMetric)
    onINP(reportMetric)
  }).catch(() => {
    // web-vitals not available, skip tracking
  })
}

// Performance observer for custom metrics
export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private observers: Map<string, PerformanceObserver> = new Map()

  private constructor() {
    this.initializeObservers()
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  private initializeObservers() {
    if (typeof window === 'undefined') return

    try {
      // Observe long tasks (> 50ms)
      if ('PerformanceObserver' in window) {
        const longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) {
              this.reportLongTask(entry)
            }
          }
        })

        try {
          longTaskObserver.observe({ entryTypes: ['longtask'] })
          this.observers.set('longtask', longTaskObserver)
        } catch {
          // longtask not supported
        }

        // Observe navigation timing
        const navigationObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.reportNavigation(entry as PerformanceNavigationTiming)
          }
        })

        try {
          navigationObserver.observe({ entryTypes: ['navigation'] })
          this.observers.set('navigation', navigationObserver)
        } catch {
          // navigation not supported
        }

        // Observe resource timing
        const resourceObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.reportResource(entry as PerformanceResourceTiming)
          }
        })

        try {
          resourceObserver.observe({ entryTypes: ['resource'] })
          this.observers.set('resource', resourceObserver)
        } catch {
          // resource not supported
        }
      }
    } catch (error) {
      console.warn('Failed to initialize performance observers:', error)
    }
  }

  private reportLongTask(entry: PerformanceEntry) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[Performance] Long task detected: ${Math.round(entry.duration)}ms`)
    }
  }

  private reportNavigation(entry: PerformanceNavigationTiming) {
    const metrics = {
      dns: entry.domainLookupEnd - entry.domainLookupStart,
      tcp: entry.connectEnd - entry.connectStart,
      ttfb: entry.responseStart - entry.requestStart,
      download: entry.responseEnd - entry.responseStart,
      domInteractive: entry.domInteractive - entry.fetchStart,
      domComplete: entry.domComplete - entry.fetchStart,
      loadComplete: entry.loadEventEnd - entry.fetchStart,
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('[Performance] Navigation timing:', metrics)
    }
  }

  private reportResource(entry: PerformanceResourceTiming) {
    // Track slow resources (> 1s)
    const duration = entry.responseEnd - entry.startTime
    if (duration > 1000) {
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          `[Performance] Slow resource: ${entry.name} (${Math.round(duration)}ms)`
        )
      }
    }
  }

  // Track custom timing
  mark(name: string) {
    if (typeof window !== 'undefined' && 'performance' in window) {
      performance.mark(name)
    }
  }

  measure(name: string, startMark: string, endMark?: string) {
    if (typeof window !== 'undefined' && 'performance' in window) {
      try {
        const measure = performance.measure(name, startMark, endMark)
        if (process.env.NODE_ENV === 'development') {
          console.log(`[Performance] ${name}: ${Math.round(measure.duration)}ms`)
        }
        return measure.duration
      } catch {
        // Marks not found
        return 0
      }
    }
    return 0
  }

  // Disconnect all observers
  disconnect() {
    this.observers.forEach((observer) => observer.disconnect())
    this.observers.clear()
  }
}

// Memory monitoring
export function trackMemoryUsage() {
  if (typeof window === 'undefined') return
  
  // @ts-ignore - performance.memory is non-standard
  if (!performance.memory) return

  setInterval(() => {
    // @ts-ignore
    const memory = performance.memory
    const usedMB = Math.round(memory.usedJSHeapSize / 1048576)
    const totalMB = Math.round(memory.jsHeapSizeLimit / 1048576)
    const percentage = Math.round((usedMB / totalMB) * 100)

    if (percentage > 90) {
      console.warn(`[Performance] High memory usage: ${usedMB}MB / ${totalMB}MB (${percentage}%)`)
    } else if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] Memory: ${usedMB}MB / ${totalMB}MB (${percentage}%)`)
    }
  }, 30000) // Check every 30s
}

// Network information monitoring
export function trackNetworkQuality() {
  if (typeof window === 'undefined') return

  // @ts-ignore - navigator.connection is experimental
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection

  if (!connection) return

  const logNetworkInfo = () => {
    const info = {
      effectiveType: connection.effectiveType, // 4g, 3g, 2g, slow-2g
      downlink: connection.downlink, // Mbps
      rtt: connection.rtt, // Round trip time in ms
      saveData: connection.saveData, // Data saver enabled
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('[Performance] Network:', info)
    }

    // Warn on slow connections
    if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
      console.warn('[Performance] Slow network detected:', connection.effectiveType)
    }
  }

  logNetworkInfo()
  connection.addEventListener('change', logNetworkInfo)
}

// FPS monitoring
export function trackFPS(callback?: (fps: number) => void) {
  if (typeof window === 'undefined') return

  let lastTime = performance.now()
  let frames = 0
  let fps = 60

  const measureFPS = () => {
    frames++
    const currentTime = performance.now()
    
    if (currentTime >= lastTime + 1000) {
      fps = Math.round((frames * 1000) / (currentTime - lastTime))
      frames = 0
      lastTime = currentTime

      if (callback) {
        callback(fps)
      }

      if (fps < 30 && process.env.NODE_ENV === 'development') {
        console.warn(`[Performance] Low FPS: ${fps}`)
      }
    }

    requestAnimationFrame(measureFPS)
  }

  requestAnimationFrame(measureFPS)
}

// Initialize all performance tracking
export function initializePerformanceTracking() {
  if (typeof window === 'undefined') return

  // Track Web Vitals
  trackWebVitals()

  // Initialize performance monitor
  PerformanceMonitor.getInstance()

  // Track memory usage
  trackMemoryUsage()

  // Track network quality
  trackNetworkQuality()

  // Track FPS in development
  if (process.env.NODE_ENV === 'development') {
    trackFPS((fps) => {
      if (fps < 30) {
        console.warn(`[Performance] Low FPS: ${fps}`)
      }
    })
  }
}

// Export for use in _app.tsx or layout.tsx
export default {
  trackWebVitals,
  PerformanceMonitor,
  trackMemoryUsage,
  trackNetworkQuality,
  trackFPS,
  initializePerformanceTracking,
}
