# Diagnostic Logging - Finding The Piece Disappearing Bug

## What I Added

I've added **comprehensive diagnostic logging** throughout the game to trace EXACTLY where and why pieces disappear.

**NO ASSUMPTIONS** - We will observe the actual behavior.

## How To Use This

1. Open the game in your browser
2. Open Developer Console (F12)
3. Clear console
4. Place a piece on the board
5. Watch the console logs carefully
6. If piece disappears, review the log sequence

## What The Logs Show

### [CLICK CELL] - User Action
```
When you click a cell to place a piece, you'll see:
- pieceId: unique ID generated
- position: where it's being placed
- currentPiecesCount: how many pieces before placement
- currentRevision: database version number
```

### [REDUCER PLACE] - State Update (Local)
```
When the reducer adds the piece to local state:
- beforeCount: pieces before
- afterCount: pieces after
- newPiece: the piece that was added
```

### [STATE CHANGE] - React Re-render
```
After state updates, React re-renders with:
- piecesCount: total pieces now
- pieces: list of all pieces with positions
- revision: current version
```

### [EMIT] - Broadcasting/Saving
```
When the action is broadcast and saved:
- kind: PLACE/MOVE/etc
- currentRevision: version before save
- nextPiecesCount: pieces after action
- Whether it's being saved to database
```

### [REALTIME] - Network Events
```
When events arrive from other clients or database:
- kind: PLACE/SYNC/etc
- revision: version of incoming state
- piecesCount: pieces in incoming state
```

### [REDUCER SYNC] - State Replacement
```
When SYNC attempts to replace state:
- incomingRevision: version from server
- currentRevision: local version
- willAccept: true/false
- REJECTED or ACCEPTED
```

## What To Look For

### SCENARIO 1: Piece Disappears Immediately

**Expected log sequence:**
```
[CLICK CELL] Starting placement
[REDUCER PLACE] Adding piece
[STATE CHANGE] piecesCount: 1
[EMIT] Action: PLACE
[REALTIME] Received SYNC
[REDUCER SYNC] REJECTED (stale)
```

**If you see:**
```
[REDUCER SYNC] ACCEPTED
piecesCount goes from 1 to 0
```
→ **BUG: Stale SYNC overwriting piece**

### SCENARIO 2: Piece Appears Then Disappears

**Expected log sequence:**
```
[CLICK CELL] Starting placement
[REDUCER PLACE] Adding piece
[STATE CHANGE] piecesCount: 1
[EMIT] Broadcasting
[STATE CHANGE] piecesCount: 1 (still there)
[REALTIME] SYNC received
[REDUCER SYNC] Checking revisions
[REDUCER SYNC] REJECTED (older)
[STATE CHANGE] piecesCount: 1 (still there)
```

**If you see:**
```
[STATE CHANGE] piecesCount: 1
[REDUCER SYNC] ACCEPTED
[STATE CHANGE] piecesCount: 0
```
→ **BUG: SYNC accepted with older revision**

### SCENARIO 3: Piece Doesn't Appear At All

**Expected log sequence:**
```
[CLICK CELL] Starting placement
[REDUCER PLACE] Adding piece
[STATE CHANGE] piecesCount: 1
```

**If you DON'T see [STATE CHANGE]:**
→ **BUG: Reducer not triggering re-render**

**If piecesCount is wrong:**
→ **BUG: Piece not being added to array**

### SCENARIO 4: Database Conflict

**Expected log sequence:**
```
[EMIT] Saving to database
[EMIT] Database save response: {success: true}
```

**If you see:**
```
[EMIT] CONFLICT detected
[EMIT] Syncing with server state
[REDUCER SYNC] incoming has FEWER pieces
[REDUCER SYNC] ACCEPTED
```
→ **BUG: Database returned stale state**

## Critical Questions To Answer

1. **Does piece appear in [REDUCER PLACE] output?**
   - YES → Piece was added to state
   - NO → Reducer never ran

2. **Does [STATE CHANGE] show the piece?**
   - YES → State has piece, React should render it
   - NO → State doesn't have piece

3. **Is there a [REDUCER SYNC] between placement and disappearance?**
   - YES → Check if ACCEPTED or REJECTED
   - ACCEPTED → This is the bug
   - REJECTED → Look for another cause

4. **What are the revision numbers?**
   - Same → Expected
   - Incoming < Current → Should be REJECTED
   - Incoming > Current → Should be ACCEPTED

5. **Is database saving PLACE actions?**
   - See: `[EMIT] Saving to database: PLACE`
   - YES → Good
   - NO → BUG: PLACE not in save list

6. **Does database conflict return correct state?**
   - Check: `[EMIT] CONFLICT detected`
   - Check: `serverPiecesCount`
   - Does it include the placed piece?

## Testing Procedure

### Test 1: Single Player, Single Piece
```
1. Open game
2. Clear console
3. Place ONE piece
4. Watch logs
5. Does piece stay visible?
```

### Test 2: Single Player, Multiple Pieces
```
1. Open game
2. Clear console
3. Place 3 pieces quickly
4. Watch for SYNC events between placements
5. Do all pieces stay visible?
```

### Test 3: Two Players (Two Browsers)
```
1. Open game in Chrome
2. Open same game in Firefox
3. Clear both consoles
4. Player 1: Place piece
5. Player 2: Place piece
6. Watch both consoles
7. Do pieces sync correctly?
8. Any SYNC events with wrong revision?
```

### Test 4: Rapid Placement
```
1. Open game
2. Clear console
3. Place 6 pieces as fast as possible
4. Which piece disappears (if any)?
5. Check logs for that specific piece ID
6. Trace its journey through the logs
```

## How To Identify The Root Cause

Once you see a piece disappear:

1. **Find the piece ID in logs**
   - Search for the piece ID that disappeared

2. **Trace its lifecycle:**
   ```
   [CLICK CELL] pieceId: abc123
   [REDUCER PLACE] pieceId: abc123 ← ADDED
   [STATE CHANGE] pieces: [..., abc123, ...] ← IN STATE
   [REDUCER SYNC] ACCEPTED ← SUSPECT!
   [STATE CHANGE] pieces: [...] ← abc123 GONE!
   ```

3. **Check the SYNC that happened:**
   - Was it REJECTED or ACCEPTED?
   - What was incomingRevision vs currentRevision?
   - How many pieces did incoming state have?

4. **Determine the cause:**
   - Stale SYNC? → Fix revision checking
   - Database conflict? → Fix save logic
   - Missing from state? → Fix reducer
   - React not rendering? → Fix render logic

## After Finding The Bug

1. Note the EXACT log sequence that caused it
2. Note which piece ID disappeared
3. Note the revision numbers involved
4. Note whether it was SYNC, database, or render issue
5. Share the console logs

Then I can implement the ACTUAL fix based on EVIDENCE, not guesses.

## Removing The Logs

Once the bug is fixed and verified, I'll remove all the console.log statements to clean up the code.

---

**Status:** 🔍 DIAGNOSTIC MODE ACTIVE  
**Goal:** Find EXACT cause of piece disappearing  
**Method:** Evidence-based debugging  
**No Assumptions:** Let the logs tell us what's happening  
