/**
 * Service Worker for Quidditch Academy
 * Provides instant loading, offline support, and aggressive caching
 */

const CACHE_VERSION = 'v1.0.0'
const CACHE_NAME = `quidditch-academy-${CACHE_VERSION}`
const RUNTIME_CACHE = `runtime-${CACHE_VERSION}`

// Cache strategies
const CACHE_FIRST = 'cache-first'
const NETWORK_FIRST = 'network-first'
const NETWORK_ONLY = 'network-only'

// Resources to cache immediately on install
const STATIC_ASSETS = [
  '/',
  '/quid.webp',
  '/snitch.webp',
  '/manifest.json',
]

// Cache strategies by URL pattern
const CACHE_STRATEGIES = [
  { pattern: /\.webp$/, strategy: CACHE_FIRST, maxAge: 365 * 24 * 60 * 60 }, // 1 year
  { pattern: /\.png$/, strategy: CACHE_FIRST, maxAge: 365 * 24 * 60 * 60 },
  { pattern: /\.svg$/, strategy: CACHE_FIRST, maxAge: 30 * 24 * 60 * 60 }, // 30 days
  { pattern: /_next\/static\//, strategy: CACHE_FIRST, maxAge: 365 * 24 * 60 * 60 },
  { pattern: /\/api\//, strategy: NETWORK_ONLY },
  { pattern: /supabase\.co/, strategy: NETWORK_FIRST, maxAge: 5 * 60 }, // 5 minutes
]

/**
 * Install event - cache static assets
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...')
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets')
      return cache.addAll(STATIC_ASSETS)
    }).then(() => {
      console.log('[SW] Service worker installed successfully')
      return self.skipWaiting() // Activate immediately
    })
  )
})

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...')
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            console.log('[SW] Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    }).then(() => {
      console.log('[SW] Service worker activated')
      return self.clients.claim() // Take control immediately
    })
  )
})

/**
 * Fetch event - intercept network requests
 */
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // Skip chrome-extension and other protocols
  if (!url.protocol.startsWith('http')) {
    return
  }

  // Determine cache strategy
  const strategy = getCacheStrategy(request.url)

  if (strategy === NETWORK_ONLY) {
    return // Let browser handle it
  }

  if (strategy === CACHE_FIRST) {
    event.respondWith(cacheFirst(request))
  } else if (strategy === NETWORK_FIRST) {
    event.respondWith(networkFirst(request))
  } else {
    event.respondWith(staleWhileRevalidate(request))
  }
})

/**
 * Get cache strategy for URL
 */
function getCacheStrategy(url) {
  for (const { pattern, strategy } of CACHE_STRATEGIES) {
    if (pattern.test(url)) {
      return strategy
    }
  }
  return NETWORK_FIRST // Default
}

/**
 * Cache First strategy - instant loading from cache
 */
async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME)
  const cached = await cache.match(request)

  if (cached) {
    return cached
  }

  try {
    const response = await fetch(request)
    if (response.ok) {
      cache.put(request, response.clone())
    }
    return response
  } catch (error) {
    console.error('[SW] Cache first failed:', error)
    return new Response('Offline', { status: 503 })
  }
}

/**
 * Network First strategy - fresh data when online
 */
async function networkFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE)

  try {
    const response = await fetch(request)
    if (response.ok) {
      cache.put(request, response.clone())
    }
    return response
  } catch (error) {
    const cached = await cache.match(request)
    if (cached) {
      return cached
    }
    throw error
  }
}

/**
 * Stale While Revalidate - instant with background update
 */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE)
  const cached = await cache.match(request)

  // Fetch in background
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone())
    }
    return response
  })

  // Return cached immediately, or wait for fetch
  return cached || fetchPromise
}

/**
 * Message handler for cache control
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    const urls = event.data.urls || []
    caches.open(CACHE_NAME).then((cache) => {
      cache.addAll(urls)
    })
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => caches.delete(cacheName))
      )
    })
  }
})
