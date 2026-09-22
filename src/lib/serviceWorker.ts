/**
 * Service Worker Registration and Management
 * Handles SW lifecycle and provides utilities for cache management
 */

/**
 * Register service worker
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.log('[SW] Service workers not supported')
    return null
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    })

    console.log('[SW] Service worker registered successfully')

    // Handle updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing
      if (!newWorker) return

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // New version available
          console.log('[SW] New version available - reload to update')
          
          // Notify user about update
          if (confirm('New version available! Reload to update?')) {
            newWorker.postMessage({ type: 'SKIP_WAITING' })
            window.location.reload()
          }
        }
      })
    })

    return registration
  } catch (error) {
    console.error('[SW] Registration failed:', error)
    return null
  }
}

/**
 * Unregister service worker
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration()
    if (registration) {
      const success = await registration.unregister()
      console.log('[SW] Service worker unregistered:', success)
      return success
    }
    return false
  } catch (error) {
    console.error('[SW] Unregistration failed:', error)
    return false
  }
}

/**
 * Check for service worker updates
 */
export async function checkForUpdates(): Promise<void> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration()
    if (registration) {
      await registration.update()
      console.log('[SW] Checked for updates')
    }
  } catch (error) {
    console.error('[SW] Update check failed:', error)
  }
}

/**
 * Clear all caches
 */
export async function clearAllCaches(): Promise<void> {
  if (typeof window === 'undefined' || !('caches' in window)) {
    return
  }

  try {
    const cacheNames = await caches.keys()
    await Promise.all(cacheNames.map(name => caches.delete(name)))
    console.log('[SW] All caches cleared')
  } catch (error) {
    console.error('[SW] Cache clear failed:', error)
  }
}

/**
 * Precache URLs
 */
export async function precacheUrls(urls: string[]): Promise<void> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration()
    if (registration?.active) {
      registration.active.postMessage({
        type: 'CACHE_URLS',
        urls,
      })
      console.log('[SW] Precaching URLs:', urls)
    }
  } catch (error) {
    console.error('[SW] Precache failed:', error)
  }
}

/**
 * Get cache size
 */
export async function getCacheSize(): Promise<number> {
  if (typeof window === 'undefined' || !('caches' in window)) {
    return 0
  }

  try {
    const cacheNames = await caches.keys()
    let totalSize = 0

    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName)
      const keys = await cache.keys()
      
      for (const request of keys) {
        const response = await cache.match(request)
        if (response) {
          const blob = await response.blob()
          totalSize += blob.size
        }
      }
    }

    return totalSize
  } catch (error) {
    console.error('[SW] Cache size calculation failed:', error)
    return 0
  }
}

/**
 * Check if offline
 */
export function isOffline(): boolean {
  if (typeof window === 'undefined') return false
  return !navigator.onLine
}

/**
 * Listen for online/offline events
 */
export function setupOfflineListener(
  onOnline: () => void,
  onOffline: () => void
): () => void {
  if (typeof window === 'undefined') {
    return () => {}
  }

  window.addEventListener('online', onOnline)
  window.addEventListener('offline', onOffline)

  return () => {
    window.removeEventListener('online', onOnline)
    window.removeEventListener('offline', onOffline)
  }
}

/**
 * Get service worker status
 */
export async function getServiceWorkerStatus(): Promise<{
  supported: boolean
  registered: boolean
  active: boolean
  waiting: boolean
}> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return {
      supported: false,
      registered: false,
      active: false,
      waiting: false,
    }
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration()
    
    return {
      supported: true,
      registered: !!registration,
      active: !!registration?.active,
      waiting: !!registration?.waiting,
    }
  } catch {
    return {
      supported: true,
      registered: false,
      active: false,
      waiting: false,
    }
  }
}
