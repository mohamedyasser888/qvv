import { createBrowserClient } from '@supabase/ssr'
import { OPTIMIZED_CHANNEL_CONFIG } from '../realtimeOptimizations'

// Singleton client for connection reuse
let clientInstance: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  // Reuse existing client (connection pooling)
  if (clientInstance) {
    return clientInstance
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl) {
    throw new Error('Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL. Please check your .env.local file.')
  }
  
  if (!supabaseAnonKey) {
    throw new Error('Missing required environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY. Please check your .env.local file.')
  }

  clientInstance = createBrowserClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce', // More secure
    },
    global: {
      headers: {
        'x-client-info': 'quidditch-academy@1.0.0',
      },
    },
    realtime: OPTIMIZED_CHANNEL_CONFIG,
  })

  return clientInstance
}

/**
 * Reset client instance (useful for testing or auth changes)
 */
export function resetClient() {
  clientInstance = null
}
