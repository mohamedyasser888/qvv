/**
 * Development Logger Utility
 * Logs are automatically removed in production builds by Next.js compiler
 * Only console.error and console.warn are kept in production for debugging
 */

const isDev = process.env.NODE_ENV === 'development'

export const logger = {
  // Development-only logs (removed in production)
  log: (...args: unknown[]) => {
    if (isDev) console.log(...args)
  },
  
  info: (...args: unknown[]) => {
    if (isDev) console.info(...args)
  },
  
  debug: (...args: unknown[]) => {
    if (isDev) console.debug(...args)
  },
  
  // Production logs (kept for debugging critical issues)
  warn: (...args: unknown[]) => {
    console.warn(...args)
  },
  
  error: (...args: unknown[]) => {
    console.error(...args)
  },
}

// Game-specific logger with team prefix
export const createGameLogger = (team: number | null) => {
  const prefix = team ? `[Team ${team}]` : '[Spectator]'
  
  return {
    log: (...args: unknown[]) => logger.log(prefix, ...args),
    info: (...args: unknown[]) => logger.info(prefix, ...args),
    debug: (...args: unknown[]) => logger.debug(prefix, ...args),
    warn: (...args: unknown[]) => logger.warn(prefix, ...args),
    error: (...args: unknown[]) => logger.error(prefix, ...args),
  }
}
