# 🛡️ Error Handling & Edge Cases Analysis

## Overview
Comprehensive review of error handling patterns, edge cases, and failure scenarios across the application.

---

## 🔴 CRITICAL ISSUES

### 1. Empty Catch Blocks Silencing Errors (🔴 Critical)
**Files**: Multiple authentication and room pages

**Problem**: Many catch blocks only log to console or show generic messages without proper error reporting:

```typescript
// login/page.tsx, register/page.tsx, room/[roomCode]/page.tsx
} catch {
  setError('A magical disturbance occurred.')
  setLoading(false)
}
```

**Impact**: 
- Lost error context makes debugging production issues impossible
- Users get unhelpful generic messages
- No error telemetry for monitoring

**Fix**: Implement proper error handling:

```typescript
} catch (err) {
  console.error('Registration failed:', err)
  
  // Send to error monitoring service (e.g., Sentry)
  if (typeof window !== 'undefined' && window.Sentry) {
    window.Sentry.captureException(err)
  }
  
  // User-friendly message with context
  const message = err instanceof Error 
    ? `Registration failed: ${err.message}`
    : 'A magical disturbance occurred. Please try again.'
  setError(message)
  setLoading(false)
}
```

---

### 2. No Validation Before Database Calls (🔴 Critical)
**Files**: `room/[roomCode]/page.tsx`, `room/join/page.tsx`

**Problem**: Direct database calls without input validation:

```typescript
// room/[roomCode]/page.tsx - handleJoinTeam
const team = teams.find(t => t.team_number === teamNumber)
if (!team) {
  // But what if teams is empty? What if teamNumber is invalid?
  setActionLoading(false)
  return
}
```

**Issues**:
- No type checking on `roomCode` parameter (could be injection attempt)
- No bounds checking on `teamNumber` (could be negative, too large)
- No validation that `position` is a valid position string
- No check for stale data (team could have been deleted)

**Fix**:
```typescript
// Add input validation utility
function validateTeamNumber(num: unknown): num is 1 | 2 {
  return num === 1 || num === 2
}

function validatePosition(pos: unknown): pos is 'keeper' | 'chaser' | 'beater' | 'seeker' {
  return typeof pos === 'string' && 
    ['keeper', 'chaser', 'beater', 'seeker'].includes(pos)
}

function validateRoomCode(code: unknown): code is string {
  return typeof code === 'string' &&
    /^QUID-[A-Z0-9]{4}$/.test(code)
}

// In component
const handleJoinTeam = async (teamNumber: number) => {
  if (!validateTeamNumber(teamNumber)) {
    setError('Invalid team number')
    return
  }
  
  if (!profile || !room) {
    setError('Session expired. Please refresh.')
    return
  }
  
  // ... rest of logic
}
```

---

### 3. Race Conditions in Realtime Updates (🔴 Critical)
**File**: `room/[roomCode]/page.tsx`

**Problem**: Multiple state updates can conflict:

```typescript
// Realtime subscription triggers loadRoomData()
.on('postgres_changes', {
  event: '*',
  schema: 'public',
  table: 'teams'
}, () => {
  loadRoomData()  // Full reload
})

// But user is simultaneously updating team name locally
const handleUpdateTeamName = async (teamId: string, name: string) => {
  await supabase
    .from('teams')
    .update({ name: name.trim() })
    .eq('id', teamId)
  // This triggers the realtime subscription above
  // which reloads and overwrites localTeamNames state!
}
```

**Impact**: User typing team name gets interrupted by realtime updates

**Fix**: Use optimistic updates and debouncing:
```typescript
const [localTeamNames, setLocalTeamNames] = useState<Record<string, string>>({})
const updateTimeouts = useRef<Record<string, NodeJS.Timeout>>({})

const handleUpdateTeamName = (teamId: string, name: string) => {
  // Update local state immediately (optimistic)
  setLocalTeamNames(prev => ({ ...prev, [teamId]: name }))
  
  // Debounce the database update
  if (updateTimeouts.current[teamId]) {
    clearTimeout(updateTimeouts.current[teamId])
  }
  
  updateTimeouts.current[teamId] = setTimeout(async () => {
    try {
      await supabase
        .from('teams')
        .update({ name: name.trim() })
        .eq('id', teamId)
    } catch (err) {
      console.error('Failed to update team name:', err)
      // Revert optimistic update
      setError('Failed to update team name')
    }
  }, 500)
}
```

---

### 4. Password Reset Allows Weak Passwords (🔴 Critical)
**File**: `reset-password/page.tsx`, `forgot-password/page.tsx`

**Problem**: Minimum 6 characters but no complexity requirements:

```typescript
if (password.length < 6) {
  setError('Password must be at least 6 characters')
  return
}
```

**But**: Registration requires 8+ chars with complexity (via `validatePassword`)

**Inconsistency Risk**: Users can reset to weaker password than registration allows!

**Fix**: Use the same validation everywhere:
```typescript
import { validatePassword } from '@/lib/validation'

const handleResetPassword = async (e: React.FormEvent) => {
  e.preventDefault()
  setError('')

  const passwordError = validatePassword(password)
  if (passwordError) {
    setError(passwordError)
    return
  }
  
  // ... rest of logic
}
```

---

## 🟠 HIGH PRIORITY ISSUES

### 5. No Session Expiry Handling (🟠 High)
**Files**: All protected pages

**Problem**: No detection when session expires mid-operation:

```typescript
const { data: { user } } = await supabase.auth.getUser()

if (!user) {
  router.push('/login')
  return
}
// But what if session expires AFTER this check?
```

**Fix**: Wrap all Supabase calls with session checking:
```typescript
async function withAuth<T>(
  operation: () => Promise<T>,
  onUnauthorized?: () => void
): Promise<T | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      onUnauthorized?.()
      throw new Error('Session expired')
    }
    return await operation()
  } catch (err) {
    if (err instanceof Error && err.message.includes('JWT')) {
      // Session expired
      await supabase.auth.signOut()
      window.location.href = '/login?expired=true'
      return null
    }
    throw err
  }
}

// Usage
const result = await withAuth(
  () => supabase.from('profiles').select('*').single(),
  () => router.push('/login')
)
```

---

### 6. No Network Failure Handling (🟠 High)
**Files**: All pages with Supabase calls

**Problem**: No retry logic or offline detection:

```typescript
const { data, error } = await supabase
  .from('rooms')
  .select('*')
  .eq('room_code', roomCode)
  .single()

if (error) {
  setError('Room not found')
  // But what if it's a network error, not missing room?
}
```

**Fix**: Differentiate network errors from data errors:
```typescript
async function fetchWithRetry<T>(
  fetchFn: () => Promise<{ data: T | null; error: any }>,
  retries = 3,
  delay = 1000
): Promise<{ data: T | null; error: any }> {
  for (let i = 0; i < retries; i++) {
    try {
      const result = await fetchFn()
      
      // If it's a network error and we have retries left, retry
      if (result.error?.message?.includes('Failed to fetch') && i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)))
        continue
      }
      
      return result
    } catch (err) {
      if (i === retries - 1) throw err
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)))
    }
  }
  
  throw new Error('Max retries exceeded')
}

// Usage
const result = await fetchWithRetry(
  () => supabase.from('rooms').select('*').eq('room_code', roomCode).single()
)
```

---

### 7. No Concurrent Request Protection (🟠 High)
**Files**: `room/[roomCode]/page.tsx`

**Problem**: User can spam "Join Team" button:

```typescript
const handleJoinTeam = async (teamNumber: number) => {
  setActionLoading(true)  // UI disabled
  
  // But multiple requests could already be in flight!
  const { error } = await supabase.from('team_members').insert({ ... })
  
  setActionLoading(false)
}
```

**Impact**: 
- Multiple team member records created
- Race condition on captain assignment
- Potential database constraint violations

**Fix**: Use abort controller and request deduplication:
```typescript
const requestInFlight = useRef(false)

const handleJoinTeam = async (teamNumber: number) => {
  if (requestInFlight.current) {
    return  // Silently ignore duplicate requests
  }
  
  requestInFlight.current = true
  setActionLoading(true)
  
  try {
    // ... operation
  } finally {
    requestInFlight.current = false
    setActionLoading(false)
  }
}
```

---

### 8. Missing Boundary Checks on Arrays (🟠 High)
**Files**: Multiple

**Problem**: Accessing array elements without checking length:

```typescript
// room/[roomCode]/page.tsx
const myTeamMember = teamMembers.find(tm => tm.user_id === profile.id)
const myTeam = teams.find(team => team.id === myTeamMember?.team_id)

// What if teamMembers is empty? What if teams is empty?
const t1 = teams.find(team => team.team_number === 1)
const t2 = teams.find(team => team.team_number === 2)
// Both could be undefined!
```

**Fix**: Always check before using:
```typescript
if (teams.length < 2) {
  setError('Room setup incomplete. Please refresh.')
  return
}

const t1 = teams.find(team => team.team_number === 1)
const t2 = teams.find(team => team.team_number === 2)

if (!t1 || !t2) {
  setError('Invalid room configuration')
  return
}
```

---

### 9. Room Expiry Not Enforced Client-Side (🟠 High)
**File**: `room/join/page.tsx`

**Problem**: Expiry checked but room still accessible:

```typescript
if (new Date(roomData.expires_at) < new Date()) {
  setError('This Quidditch room has expired.')
  setJoining(false)
  return
}
// But if user refreshes /room/[code] page, no expiry check!
```

**Fix**: Add expiry check to room detail page:
```typescript
// room/[roomCode]/page.tsx - in loadRoomData()
if (room && new Date(room.expires_at) < new Date()) {
  setError('This room has expired.')
  router.push('/play')
  return
}
```

---

## 🟡 MEDIUM PRIORITY ISSUES

### 10. No Stale Data Detection (🟡 Medium)
**Files**: All pages with realtime data

**Problem**: No timestamp checking for stale reads:

```typescript
const { data: roomData } = await supabase
  .from('rooms')
  .select('*')
  .eq('room_code', roomCode)
  .single()

// What if this data is from 5 minutes ago due to caching?
// What if another user just modified it?
```

**Enhancement**: Use timestamp comparison:
```typescript
interface TimestampedData {
  updated_at: string
}

function isStale(data: TimestampedData, maxAgeSeconds = 30): boolean {
  const age = (Date.now() - new Date(data.updated_at).getTime()) / 1000
  return age > maxAgeSeconds
}

if (isStale(roomData)) {
  console.warn('Stale room data detected, refetching...')
  await loadRoomData()
}
```

---

### 11. Logout Doesn't Clear State (🟡 Medium)
**Files**: All pages with logout

**Problem**: State persists after logout:

```typescript
const handleLogout = async () => {
  await supabase.auth.signOut()
  router.push('/login')
  // But profile, teams, etc. are still in state!
}
```

**Issue**: If user uses browser back button, stale data visible

**Fix**: Clear all state on logout:
```typescript
const handleLogout = async () => {
  try {
    await supabase.auth.signOut()
    
    // Clear all local state
    setProfile(null)
    setRoom(null)
    setTeams([])
    setTeamMembers([])
    setError('')
    
    // Clear any localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('lastRoomCode')
    }
    
    router.push('/login')
  } catch (err) {
    console.error('Logout failed:', err)
    // Force navigation anyway
    window.location.href = '/login'
  }
}
```

---

### 12. No Validation on Email Derived from Name (🟡 Medium)
**Files**: `register/page.tsx`, `login/page.tsx`

**Problem**: Edge cases in email generation:

```typescript
const sanitizedMagicalName = magicalName
  .toLowerCase()
  .replace(/\s+/g, '')
  .replace(/[^a-z0-9]/g, '')
const email = `${sanitizedMagicalName}@gmail.com`

// What if sanitizedMagicalName is empty after sanitization?
// What if it's "admin" or a reserved word?
```

**Fix**: Validate generated email:
```typescript
const sanitizedMagicalName = magicalName
  .toLowerCase()
  .replace(/\s+/g, '')
  .replace(/[^a-z0-9]/g, '')

if (sanitizedMagicalName.length < 3) {
  setError('Magical name must contain at least 3 alphanumeric characters')
  return
}

const email = `${sanitizedMagicalName}@gmail.com`
```

---

### 13. useEffect Dependencies Disabled (🟡 Medium)
**Files**: Multiple pages

**Problem**: Many useEffect hooks disable exhaustive-deps:

```typescript
useEffect(() => {
  loadRoomData()
}, [roomCode]) // eslint-disable-line react-hooks/exhaustive-deps
```

**Issue**: Missing dependencies could cause stale closures

**Assessment**: 
- Most are intentional (setup functions, auth checks)
- But some could benefit from proper dependencies
- Consider using `useCallback` for stable function references

**Recommendation**: 
```typescript
const loadRoomData = useCallback(async () => {
  // ... implementation
}, [roomCode, supabase])  // Include all dependencies

useEffect(() => {
  loadRoomData()
}, [loadRoomData])  // Now safe with no lint disable
```

---

### 14. Copy Code Button Error Handling (🟡 Medium)
**File**: `room/[roomCode]/page.tsx`

**Problem**: No error handling for clipboard API:

```typescript
<button
  onClick={(e) => {
    navigator.clipboard.writeText(roomCode.toUpperCase());
    // What if clipboard API is blocked or fails?
  }}
>
  Copy Code
</button>
```

**Fix**:
```typescript
<button
  onClick={async (e) => {
    try {
      await navigator.clipboard.writeText(roomCode.toUpperCase())
      const btn = e.currentTarget
      const originalText = btn.innerText
      btn.innerText = 'Copied!'
      setTimeout(() => btn.innerText = originalText, 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
      // Fallback: show code in alert
      alert(`Room Code: ${roomCode.toUpperCase()}`)
    }
  }}
>
  Copy Code
</button>
```

---

### 15. No Loading States for Realtime Subscriptions (🟡 Medium)
**File**: `room/[roomCode]/page.tsx`

**Problem**: Realtime updates happen silently:

```typescript
const roomSubscription = supabase
  .channel(channelName)
  .on('postgres_changes', { ... }, (payload) => {
    if (payload.new) {
      setRoom(payload.new as Room)  // No loading indicator
    }
  })
```

**Enhancement**: Add loading states:
```typescript
const [realtimeConnected, setRealtimeConnected] = useState(false)

const roomSubscription = supabase
  .channel(channelName)
  .on('postgres_changes', { ... }, (payload) => {
    setRealtimeConnected(true)
    if (payload.new) {
      setRoom(payload.new as Room)
    }
  })
  .subscribe((status) => {
    setRealtimeConnected(status === 'SUBSCRIBED')
  })

// Show indicator
{!realtimeConnected && (
  <div className="text-yellow-400 text-sm">
    ⚠️ Connecting to live updates...
  </div>
)}
```

---

## 🔵 EDGE CASES TO HANDLE

### 16. What if Both Teams Ready Simultaneously?
**File**: `room/[roomCode]/page.tsx`

**Scenario**: Both teams click "Ready" at exactly the same time

**Current**: Race condition on `begin_quidditch_match` RPC

**Fix**: Database function should be idempotent (✅ Already handled by UPDATE)

---

### 17. What if User Joins Room Mid-Game?
**File**: `room/[roomCode]/page.tsx`

**Current**: Redirects to game as spectator ✅

```typescript
if (room.status === 'playing') {
  if (!myTeamMember) gameParams.set('spectator', 'true')
  router.replace(`/game/${roomCode}?${gameParams.toString()}`)
  return
}
```

**Good**: Already handled!

---

### 18. What if All Team Members Leave?
**Files**: `room/[roomCode]/page.tsx`

**Scenario**: Last member leaves room

**Current**: Room stays in database until expiry

**Enhancement**: Add room cleanup:
```typescript
const handleLeaveRoom = async () => {
  // ... existing leave logic
  
  // Check if room is now empty
  const { data: remainingMembers } = await supabase
    .from('team_members')
    .select('id')
    .in('team_id', teams.map(t => t.id))
  
  if (!remainingMembers || remainingMembers.length === 0) {
    // Delete empty room
    await supabase.from('rooms').delete().eq('id', room.id)
  }
  
  router.push('/play')
}
```

---

### 19. What if Captain Leaves?
**File**: `room/[roomCode]/page.tsx`

**Current**: Captain set to null, team ready reset ✅

```typescript
if (team?.captain_id === profile.id) {
  await supabase
    .from('teams')
    .update({ captain_id: null, ready: false })
    .eq('id', team.id)
}
```

**Enhancement**: Auto-assign new captain from remaining members

---

### 20. What if User Has Multiple Tabs Open?
**All Pages**

**Scenario**: User opens room in two browser tabs

**Current**: Both tabs subscribe to realtime, could cause conflicts

**Issue**: Both tabs try to update same data simultaneously

**Mitigation**: 
- Use tab sync via localStorage
- Lock mechanism for mutations
- Or accept "last write wins" (current behavior)

---

## 📊 ERROR HANDLING SCORE

**Current Score**: 60/100

### Breakdown:
- **Error Catching**: 70% (catch blocks exist but too generic)
- **Error Reporting**: 30% (console.error only, no telemetry)
- **Input Validation**: 50% (some validation, many gaps)
- **Edge Cases**: 65% (some handled, many ignored)
- **Recovery**: 40% (few retry mechanisms)

### Target Score: 90+/100

---

## 🛠️ RECOMMENDED FIXES PRIORITY

### IMMEDIATE (Critical Security)
1. ⚠️ Add proper error types and context to all catch blocks
2. ⚠️ Validate all inputs before database operations
3. ⚠️ Fix password validation inconsistency (reset vs register)
4. ⚠️ Add race condition protection on concurrent requests

### Before Production Launch
5. Add session expiry handling with auto-refresh
6. Implement network error retry logic
7. Add error monitoring/telemetry (Sentry, LogRocket)
8. Fix realtime update race conditions
9. Add boundary checks on all array access

### Post-Launch (Enhancement)
10. Add optimistic updates for better UX
11. Implement stale data detection
12. Add comprehensive error recovery flows
13. Create error boundary components for React errors

---

## 💡 ERROR HANDLING BEST PRACTICES

### 1. Create Error Types
```typescript
// lib/errors.ts
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public userMessage?: string
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class ValidationError extends AppError {
  constructor(message: string, userMessage?: string) {
    super(message, 'VALIDATION_ERROR', 400, userMessage)
    this.name = 'ValidationError'
  }
}

export class AuthError extends AppError {
  constructor(message: string, userMessage?: string) {
    super(message, 'AUTH_ERROR', 401, userMessage)
    this.name = 'AuthError'
  }
}

export class NetworkError extends AppError {
  constructor(message: string) {
    super(message, 'NETWORK_ERROR', 503, 'Network connection issue. Please check your internet.')
    this.name = 'NetworkError'
  }
}
```

### 2. Create Error Handler Utility
```typescript
// lib/error-handler.ts
export function handleError(err: unknown, context?: string): string {
  console.error(`Error in ${context}:`, err)
  
  // Send to monitoring service
  if (typeof window !== 'undefined' && window.Sentry) {
    window.Sentry.captureException(err, {
      tags: { context }
    })
  }
  
  // Return user-friendly message
  if (err instanceof AppError) {
    return err.userMessage || err.message
  }
  
  if (err instanceof Error) {
    // Check for known error patterns
    if (err.message.includes('JWT')) {
      return 'Your session has expired. Please log in again.'
    }
    if (err.message.includes('Failed to fetch')) {
      return 'Network error. Please check your connection.'
    }
    if (err.message.includes('duplicate key')) {
      return 'That name is already taken.'
    }
  }
  
  return 'An unexpected error occurred. Please try again.'
}
```

### 3. Create Error Boundary Component
```typescript
// components/ErrorBoundary.tsx
'use client'

import React from 'react'
import ErrorMagic from './ui/ErrorMagic'

interface Props {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('React error boundary caught:', error, errorInfo)
    
    if (typeof window !== 'undefined' && window.Sentry) {
      window.Sentry.captureException(error, {
        contexts: { react: { componentStack: errorInfo.componentStack } }
      })
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <ErrorMagic
          message={this.state.error?.message || 'Something went wrong'}
          onRetry={() => {
            this.setState({ hasError: false, error: undefined })
            window.location.reload()
          }}
        />
      )
    }

    return this.props.children
  }
}
```

---

## ✅ GOOD PRACTICES FOUND

### 1. Loading States ✅
All async operations have loading states:
```typescript
const [loading, setLoading] = useState(false)
// ...
<MagicalButton disabled={loading}>
```

### 2. Error Display ✅
Consistent error display across pages:
```typescript
{error && (
  <div className="bg-rose-600/20 border border-rose-500/50 rounded-lg p-3 text-rose-400">
    {error}
  </div>
)}
```

### 3. Auth Guards ✅
All protected pages check authentication:
```typescript
const { data: { user } } = await supabase.auth.getUser()
if (!user) {
  router.push('/login')
  return
}
```

### 4. RLS Enforcement ✅
Database has strong RLS policies protecting data

### 5. Optimistic UI in Some Places ✅
Room code copy shows immediate feedback

---

## 🧪 TESTING CHECKLIST

### Manual Tests Needed:
- [ ] Test all error paths (invalid inputs, network failures)
- [ ] Test with slow/flaky network (throttle in DevTools)
- [ ] Test session expiry mid-operation
- [ ] Test concurrent actions (multiple tabs)
- [ ] Test with malformed URLs
- [ ] Test browser back/forward navigation
- [ ] Test with disabled JavaScript
- [ ] Test clipboard API blocking
- [ ] Test with stale/expired rooms
- [ ] Test captain leaving mid-setup

### Automated Tests Needed:
- [ ] Unit tests for validation functions
- [ ] Integration tests for database operations
- [ ] E2E tests for critical user flows
- [ ] Error scenario tests

---

## 📝 FINAL RECOMMENDATIONS

### Quick Wins (1-2 hours):
1. Add error context to all catch blocks
2. Use `validatePassword` in reset flows
3. Add input validation guards
4. Add request deduplication
5. Fix logout state clearing

### Medium Effort (1 day):
6. Implement retry logic for network errors
7. Add session expiry handling
8. Create error handler utility
9. Add error boundary components
10. Improve realtime race condition handling

### Long Term (1 week):
11. Set up error monitoring (Sentry)
12. Add comprehensive unit tests
13. Create error recovery flows
14. Implement optimistic updates
15. Add performance monitoring

---

## ✅ VERDICT

**Current State**: Error handling is **basic but functional**. Most happy paths work well, but edge cases and failure scenarios need significant improvement.

**Critical Issues**: 4 (empty catches, validation gaps, password inconsistency, race conditions)  
**High Priority**: 5  
**Medium Priority**: 6

**Estimated Improvement Effort**: 2-3 days for critical + high priority fixes.

**Production Readiness**: 60% - needs work before launch to handle real-world failure scenarios gracefully.
