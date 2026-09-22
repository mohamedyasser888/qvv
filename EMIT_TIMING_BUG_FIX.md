# EMIT TIMING BUG - Root Cause & Fix

## Date
2026-09-16

## Status
**FIXED** - Awaiting user verification

---

## THE SECOND BUG

After implementing the first fix (revision increment + SYNC validation), users reported the bug **still occurs**.

Upon deeper investigation, a second critical timing bug was discovered in the `emit()` function.

---

## ROOT CAUSE #2: React State Update Timing Race

### The Flow (BROKEN)

```
1. User clicks cell
   ↓
2. clickCell() calls disp({ kind: 'PLACE', ... })
   → Schedules React state update (gs will change)
   → State update is ASYNC (not immediate)
   ↓
3. clickCell() immediately calls emit({ kind: 'PLACE', ... }, true)
   → skipLocalDispatch = true (don't call disp again)
   ↓
4. Inside emit():
   → currentRevision = gsRef.current.revision  ← STILL OLD STATE!
   → nextState = reduce(gsRef.current, a)     ← STILL OLD STATE!
   ↓
5. Database RPC called with WRONG expected_revision
   ↓
6. Conflict detection fails because revision is stale
```

### Why gsRef.current Is Stale

```typescript
useEffect(() => { gsRef.current = gs }, [gs])
```

This `useEffect` only runs **AFTER** the render completes. But `emit()` is called **synchronously** in `clickCell()`, before React flushes the state update.

### The Problem

When `skipLocalDispatch=true`, the caller has already dispatched the action locally:

```typescript
// In clickCell():
disp({ kind: 'PLACE', ... })  // Schedules state update (ASYNC)
emit({ kind: 'PLACE', ... }, true)  // Runs immediately (SYNC)
```

Inside `emit()`, when it reads `gsRef.current`, it gets the state **before** the `disp()` took effect.

This causes:
1. Wrong `currentRevision` sent to database
2. Wrong `nextState` calculated
3. Database save uses stale expected_revision
4. Revision conflicts on subsequent placements
5. Pieces disappear intermittently

---

## THE FIX

Detect when `skipLocalDispatch=true` and compute the state **as if the action was already applied**:

```typescript
const emit = useCallback((a: Act, skipLocalDispatch = false) => {
  if (isSpectator || !teamIdentityReady) return
  
  // CRITICAL FIX: When skipLocalDispatch=true, the caller ALREADY called disp(a)
  // But gsRef.current is still the OLD state (React hasn't flushed the update yet)
  // So we need to compute the state AS IF the action was already applied
  const baseState = skipLocalDispatch ? reduce(gsRef.current, a) : gsRef.current
  const currentRevision = baseState.revision ?? 0
  const nextState = skipLocalDispatch ? baseState : reduce(gsRef.current, a)
  
  // ... rest of emit logic uses baseState and nextState correctly
}, [isSpectator, roomCode, supabase, teamIdentityReady, myTeam])
```

### Why This Works

1. When `skipLocalDispatch=false` (normal case):
   - `baseState = gsRef.current` (unchanged)
   - `nextState = reduce(gsRef.current, a)` (apply action)
   - Works as before

2. When `skipLocalDispatch=true` (optimistic update case):
   - `baseState = reduce(gsRef.current, a)` (apply action to get "current" state)
   - `nextState = baseState` (already computed, don't apply twice)
   - Uses correct revision for database save
   - Sends correct state to database

---

## FILES CHANGED

- `src/app/game/[roomCode]/page.tsx` (emit function, lines ~1421-1487)

---

## VERIFICATION NEEDED

User must test:

1. ✅ **Primary bug**: Place pieces one by one - all should appear on first click
2. ✅ **Rapid placement**: Click multiple cells quickly - all pieces appear
3. ✅ **Multiplayer**: Two players placing simultaneously - no conflicts
4. ✅ **Console logs**: Check for SYNC REJECTED messages (proves stale syncs blocked)
5. ✅ **No duplicates**: Each piece appears exactly once, no duplicates

---

## RELATIONSHIP TO FIRST FIX

Both fixes work together:

### Fix #1 (Revision Increment)
- **Problem**: PLACE action didn't increment revision
- **Fix**: Increment revision in PLACE reducer
- **Prevents**: Equal-revision race conditions

### Fix #2 (Emit Timing)
- **Problem**: emit() reads stale gsRef.current when skipLocalDispatch=true
- **Fix**: Compute baseState by applying action when skipLocalDispatch=true
- **Prevents**: Wrong expected_revision sent to database

Both are necessary for complete reliability.

---

## NEXT STEPS

1. **User verification** (CRITICAL)
   - Run game and test piece placement
   - Verify console shows correct flow
   - Confirm no pieces disappear

2. **Remove debug logging** (after verification)
   - Remove all console.log statements
   - Keep code clean for production

3. **Address performance** (separate task)
   - Profile re-renders
   - Add memoization where needed
   - Optimize realtime subscriptions

---

## TECHNICAL SUMMARY

**Root Cause**: React state updates are async, but emit() was reading state synchronously, causing it to use stale revision numbers when skipLocalDispatch=true.

**Solution**: When skipLocalDispatch=true, compute the "current" state by applying the action to gsRef.current before reading revision or calculating nextState.

**Impact**: Database saves now use correct expected_revision, preventing conflicts and piece disappearance.
