# DEBUGGING GUIDE: Two Tabs Bug Investigation

## Date
2026-09-16

## Status
🔍 **INVESTIGATION MODE** - Enhanced logging added

---

## CRITICAL TESTS TO RUN

### Test Setup

1. **Open Tab A:** `localhost:3000/game/ROOM123?team=1`
2. **Open Tab B:** `localhost:3000/game/ROOM123?team=2`
3. **Open Browser Console** in BOTH tabs
4. **Clear console** in both tabs

### Test 1: Place Piece in Tab B

**Action:** In Tab B, select Defender, click a valid cell

**What to Look For in Tab B Console:**

```
✅ EXPECTED FLOW (if working):
[CLICK CELL] Starting piece placement
[REDUCER PLACE] Adding piece
  beforeCount: 2
  afterCount: 3
  newRevision: 6
[EMIT] Action: PLACE
  currentRevision: 5  ← Should be OLD revision
  nextRevision: 6     ← Should be NEW revision
[EMIT] Broadcasting to realtime channel
[EMIT] Saving to database
[EMIT] Database save response: { success: true, revision: 6 }
(Piece stays visible) ✅

❌ PROBLEM INDICATORS:
[EMIT] Server validation failed: { error: "Only match players may update" }
  → User is not authenticated as team member
  
[EMIT] CONFLICT detected
  → Wrong expected revision sent
  
[REALTIME] ⚠️ SELF-ECHO DETECTED!
  → broadcast self:false not working
  
[REDUCER SYNC] REJECTED
  → Stale sync arrived and was blocked (good)
  
[REDUCER SYNC] ACCEPTED
  → Followed by piece disappearing (bad - stale sync overwrote)
```

### Test 2: Check Tab A Console

**What to Look For in Tab A:**

```
✅ EXPECTED (if working):
[REALTIME] Received broadcast: PLACE
  myTeam: 1
[REALTIME] Action received, dispatching: PLACE
[REDUCER PLACE] Adding piece
  team: 2  ← Tab B's piece
(Tab A sees Tab B's piece) ✅

❌ NO MESSAGES AT ALL:
  → Tab B's broadcast not reaching Tab A
  → Channel name mismatch or subscription issue
```

---

## INVESTIGATION CHECKLIST

### ✅ Check 1: Channel Name
- Open both tabs
- In console, type: `window.location.href`
- Verify both have SAME room code (e.g., `ROOM123`)
- **Expected:** Channel name is `game:ROOM123` for both

### ✅ Check 2: Authentication
- In Tab B console: `await supabase.auth.getUser()`
- Check if user is logged in
- **Expected:** Valid user object with `id`

### ✅ Check 3: Team Membership
- Check if Tab B user is actually in a team
- Look for log: `[EMIT] Server validation failed`
- **If validation fails:** User is not in team_members table

### ✅ Check 4: Self-Echo Detection
- Place piece in Tab B
- Look for: `[REALTIME] ⚠️ SELF-ECHO DETECTED!`
- **If you see this:** `broadcast: { self: false }` is not working
- **Solution:** Filter out self-echoes manually

### ✅ Check 5: Revision Numbers
- Place piece in Tab B
- Check console logs for:
  - `currentRevision` in [EMIT]
  - `nextRevision` in [EMIT]
- **Expected:** currentRevision should be N, nextRevision should be N+1
- **If both are same:** Revision calculation bug

### ✅ Check 6: Database Response
- Look for `[EMIT] Database save response:`
- **Check for:**
  - `{ success: true }` → Save worked
  - `{ success: false, error: "..." }` → Validation failed
  - `{ conflict: true }` → Revision conflict

---

## MOST LIKELY ROOT CAUSES (Based on Two-Tab Symptom)

### Scenario A: Self-Echo Bug
**Symptom:** `broadcast: { self: false }` not working
**Evidence:** `[REALTIME] ⚠️ SELF-ECHO DETECTED!` in console
**Why Tab A works:** Tab A never sends, only receives
**Why Tab B fails:** Tab B receives its own PLACE twice, causes duplicate/conflict
**Fix:** Manually filter self-echoes in broadcast handler

### Scenario B: Authentication/Team Membership
**Symptom:** Tab B user not in team_members table
**Evidence:** `[EMIT] Server validation failed`
**Why Tab A works:** Tab A user IS in team_members
**Why Tab B fails:** Database rejects Tab B's saves
**Fix:** Ensure both users are properly joined to teams

### Scenario C: Revision Conflict Loop
**Symptom:** Every save causes conflict
**Evidence:** `[EMIT] CONFLICT detected` every time
**Why Tab B fails:** Wrong expected revision, perpetual conflicts
**Fix:** Already implemented - verify currentRevision calculation

### Scenario D: Broadcast Not Reaching Tab A
**Symptom:** Tab A console shows no broadcasts from Tab B
**Evidence:** Tab A console is silent when Tab B acts
**Why this matters:** If broadcasts don't work, system relies on postgres_changes (disabled)
**Fix:** Enable postgres_changes or fix broadcast configuration

---

## CONSOLE COMMANDS FOR DEBUGGING

### In Tab B Console:

```javascript
// Check authentication
supabase.auth.getUser().then(({data}) => console.log('User:', data.user))

// Check current game state
console.log('Current pieces:', gs.pieces.length)
console.log('Current revision:', gs.revision)

// Manually trigger REQ (request fresh state)
chRef.current?.send({ type: 'broadcast', event: 'g', payload: { kind: 'REQ' } })
```

---

## FIXES TO TRY (Based on Investigation Results)

### Fix A: Manual Self-Echo Filter (if needed)

If `broadcast: { self: false }` is not working:

```typescript
// In broadcast handler, BEFORE disp(payload)
if ('team' in payload && payload.team === myTeam) {
  console.log('[REALTIME] Ignoring self-echo')
  return  // Don't dispatch our own actions back to ourselves
}
```

### Fix B: Enable postgres_changes Listener (if broadcasts fail)

If broadcasts aren't reaching other tabs:

```typescript
chan.on('postgres_changes', {
  event: 'UPDATE',
  schema: 'public',
  table: 'quidditch_game_states',
  filter: `room_id=eq.${gameStateRoomId}`,
}, (payload) => {
  const state = (payload.new as { game_state?: GS }).game_state
  if (state) {
    console.log('[POSTGRES] Database change detected')
    disp({ kind: 'SYNC', gs: state })
  }
})
```

### Fix C: Request SYNC After Save Failure

If validation fails, request fresh state:

```typescript
if (data && !data.success) {
  console.error('[EMIT] Server validation failed')
  // Request fresh state from other clients
  chRef.current?.send({ type: 'broadcast', event: 'g', payload: { kind: 'REQ' } })
  return
}
```

---

## NEXT STEPS

1. **Run Test 1** - Place piece in Tab B
2. **Capture console output** from BOTH tabs
3. **Identify which scenario** matches the logs
4. **Apply corresponding fix**
5. **Re-test** with same setup

---

## CURRENT ENHANCED LOGGING

The following logging has been added for debugging:

### In emit() function:
- Server validation failure detection
- Enhanced database response logging
- Revision number tracking

### In broadcast handler:
- Self-echo detection with warning
- Team identification in logs
- Detailed action dispatching

### Expected Logs:
Every piece placement should show clear flow:
1. CLICK CELL
2. REDUCER PLACE (local)
3. EMIT (broadcast + save)
4. Database response
5. REALTIME (other tab receives)
6. REDUCER PLACE (other tab applies)

If any step is missing or shows errors, that's where the bug is.
