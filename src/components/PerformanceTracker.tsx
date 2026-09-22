'use client'

import { useEffect } from 'react'
import { initializePerformanceTracking } from '@/lib/performance'

/**
 * Performance Tracker Component
 * Initializes all performance monitoring on mount
 */
export default function PerformanceTracker() {
  useEffect(() => {
    // Initialize performance tracking
    initializePerformanceTracking()

    // Report to Next.js for display in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Performance] Tracking initialized')
    }
  }, [])

  // This component doesn't render anything
  return null
}
