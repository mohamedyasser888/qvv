/**
 * Route Preloading Utility
 * Prefetches critical routes for instant navigation
 */

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

/**
 * Preload critical routes on app load
 */
export function usePreloadRoutes() {
  const router = useRouter()

  useEffect(() => {
    // Preload likely next routes
    const criticalRoutes = [
      '/home',
      '/play',
      '/achievements',
    ]

    // Prefetch routes after a short delay to not block initial render
    const timeout = setTimeout(() => {
      criticalRoutes.forEach(route => {
        router.prefetch(route)
      })
    }, 1000)

    return () => clearTimeout(timeout)
  }, [router])
}

/**
 * Preload game route when hovering over room
 */
export function preloadGameRoute(roomCode: string) {
  const router = useRouter()
  router.prefetch(`/game/${roomCode}`)
}

/**
 * Preload room route when hovering over join button
 */
export function preloadRoomRoute(roomCode: string) {
  const router = useRouter()
  router.prefetch(`/room/${roomCode}`)
}
