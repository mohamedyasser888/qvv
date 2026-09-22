/**
 * Password validation utility
 * Enforces strong password requirements
 */
export function validatePassword(password: string): string | null {
  if (password.length < 8) {
    return 'Password must be at least 8 characters long'
  }
  
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter'
  }
  
  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter'
  }
  
  if (!/[0-9]/.test(password)) {
    return 'Password must contain at least one number'
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return 'Password must contain at least one special character'
  }
  
  return null
}

/**
 * Magical name validation
 * Ensures unique, safe magical names
 */
export function validateMagicalName(name: string): string | null {
  if (!name || name.trim().length === 0) {
    return 'Magical name is required'
  }
  
  if (name.trim().length < 3) {
    return 'Magical name must be at least 3 characters'
  }
  
  if (name.length > 50) {
    return 'Magical name must be less than 50 characters'
  }
  
  // Allow letters, spaces, hyphens, apostrophes
  if (!/^[a-zA-Z\s'-]+$/.test(name)) {
    return 'Magical name can only contain letters, spaces, hyphens, and apostrophes'
  }
  
  return null
}

/**
 * Rate limiting helper for client-side
 * Returns time remaining in seconds, or null if not locked
 */
export interface RateLimitState {
  attempts: number
  lockoutUntil: number | null
}

export function checkRateLimit(state: RateLimitState, maxAttempts: number = 5): {
  isLocked: boolean
  secondsRemaining: number
  canAttempt: boolean
} {
  const now = Date.now()
  
  if (state.lockoutUntil && now < state.lockoutUntil) {
    const secondsRemaining = Math.ceil((state.lockoutUntil - now) / 1000)
    return {
      isLocked: true,
      secondsRemaining,
      canAttempt: false
    }
  }
  
  // Reset if lockout has expired
  if (state.lockoutUntil && now >= state.lockoutUntil) {
    return {
      isLocked: false,
      secondsRemaining: 0,
      canAttempt: true
    }
  }
  
  return {
    isLocked: false,
    secondsRemaining: 0,
    canAttempt: state.attempts < maxAttempts
  }
}

export function updateRateLimit(state: RateLimitState, failed: boolean, maxAttempts: number = 5, lockoutMinutes: number = 15): RateLimitState {
  if (!failed) {
    // Reset on success
    return { attempts: 0, lockoutUntil: null }
  }
  
  const newAttempts = state.attempts + 1
  
  if (newAttempts >= maxAttempts) {
    return {
      attempts: newAttempts,
      lockoutUntil: Date.now() + (lockoutMinutes * 60 * 1000)
    }
  }
  
  return {
    attempts: newAttempts,
    lockoutUntil: state.lockoutUntil
  }
}
