# 🎮 Game Logic Analysis

## Overview
Comprehensive analysis of the Quidditch game mechanics, state management, and potential issues.

---

## ✅ Core Game Mechanics - VALIDATED

### 1. Piece Movement System
**Status**: ✅ **Correct**

- Goalkeeper: 2 cells left/right within goal zone (3 columns: A, B, C)
- Regular pieces: 1 cell in 4 directions (orthogonal)
- Speed 4 pieces: Additional 2-cell jumps (ignore intermediate pieces)
- Boundary checks: Rows 1-5, Columns A-D
- Collision detection: MAX_PIECES_PER_CELL = 5

**Verified**:
```typescript
function movable(ps: Piece[], p: Piece): string[] {
  // Correct boundary checks
  if (nr < 1 || nr > 5 || nc < 0 || nc >= 4) continue
  // Correct collision detection
  if (getOcc(ps, COLS[nc], nr).length < MAX_PIECES_PER_CELL)
}
```

---

### 2. Combat System
**Status**: ✅ **Correct**

**Trigger**: Attacker moves onto Defender's cell
**Wheel Mechanics**:
- ATK sections = attacker's broom speed (1-4)
- DEF sections = defender's broom speed + 1 (2-5)
- Defender advantage: Always gets +1 section

**Outcomes**:
- ATK wins: Attacker stays, continues forward, may trigger shootout
- DEF wins: Attacker pushed back (1 row normal, 2 rows if in scoring position)

**Verified Logic**:
```typescript
const sections = buildWheelSections(gs.combat.attackerSpeed, gs.combat.defenderSpeed)
// buildWheelSections correctly alternates ATK/DEF based on speeds
```

---

### 3. Goal Duel System
**Status**: ✅ **Correct**

**Trigger**: Attacker reaches row 1 (Team 1) or row 5 (Team 2)
**Mechanics**:
- Both teams choose: LEFT, MIDDLE, or RIGHT
- Goal: Choices differ
- Save: Choices match

**Scoring**:
- Goal: 10 points
- Streak bonus: 20 additional points on 2nd consecutive goal
- Streak reset: On save or after streak bonus

**Verified**:
```typescript
const isGoal = atkC !== gkC
const nextStreak = isGoal ? (atk.team === 1 ? s.streak1 + 1 : s.streak2 + 1) : 0
const streakBonus = isGoal && nextStreak === 2
const goalPoints = isGoal ? 10 + (streakBonus ? 20 : 0) : 0
```

---

### 4. Bludger System
**Status**: ⚠️ **Minor Issue Found**

**Mechanics**:
- Only Defenders can fire
- Travels in straight line (orthogonal)
- Stops at first opponent
- Knockback: 2 cells toward their goal zone
- One-time use per piece per match

**Issue Found**:
```typescript
// In BLUDGER_RESOLVE case:
pieces = knockBack(s.pieces, hit).map(piece => piece.id === hit.id
  ? { ...piece, disabledUntilTurn: progress.turnCount }
  : piece
)
```

**Problem**: `disabledUntilTurn` is set to the CURRENT turn count, meaning the piece is disabled for 0 turns (can move immediately next turn). Should be `progress.turnCount + 1` to disable for one turn.

**Impact**: Hit pieces aren't actually disabled for a turn as intended.

---

### 5. Golden Snitch System
**Status**: ✅ **Complex but Correct**

**Phases**:
1. `null` → Waiting (first 4 moves)
2. `appearing` → Transition animation
3. `spinning` → Wheel animation selecting position
4. `active` → Snitch on board, seekers can reach it
5. `encounter` → Seeker reached snitch, determining fate
6. `catching` → Multiple seekers, speed-weighted wheel
7. `hiding` → Snitch hidden for 4 moves
8. `caught` → Game over

**Fate Wheel** (when seeker reaches snitch):
- `hold`: Snitch stays (50 points if one seeker, catching wheel if multiple)
- `move`: Snitch relocates immediately
- `hide`: Snitch disappears for 4 moves

**Verified**:
- Turn counting: ✅ Correct
- Recent squares tracking: ✅ Prevents immediate return
- Multiple seeker handling: ✅ Speed-weighted wheel
- Hidden moves counter: ✅ Reappears after 4 moves

---

## 🔴 CRITICAL BUGS FOUND

### Bug #1: Bludger Disabled Duration (🔴 Critical)
**File**: `src/app/game/[roomCode]/page.tsx`
**Line**: ~530

**Current Code**:
```typescript
case 'BLUDGER_RESOLVE': {
  // ...
  if (hit) {
    pieces = knockBack(s.pieces, hit).map(piece => piece.id === hit.id
      ? { ...piece, disabledUntilTurn: progress.turnCount }  // WRONG
      : piece
    )
  }
}
```

**Problem**: Sets `disabledUntilTurn` to current turn, not next turn.

**Fix**:
```typescript
? { ...piece, disabledUntilTurn: progress.turnCount + 1 }
```

**Impact**: Hit pieces can move immediately on their next turn instead of being disabled.

---

### Bug #2: Revision Not Preserved in SYNC Action
**File**: `src/app/game/[roomCode]/page.tsx`
**Line**: ~560

**Current Code**:
```typescript
case 'SYNC':
  return s.phase === 'finished' ? s : a.gs
```

**Problem**: When syncing from database, the revision from `a.gs` might be undefined or incorrect format.

**Potential Issue**: If database returns game_state without revision field, it gets lost.

**Recommendation**: Ensure revision is always included:
```typescript
case 'SYNC':
  return s.phase === 'finished' ? s : { ...a.gs, revision: a.gs.revision ?? s.revision ?? 0 }
```

---

## 🟠 HIGH PRIORITY ISSUES

### Issue #1: No Validation for Piece Placement in Deployment
**Severity**: 🟠 High

**Problem**: The `PLACE` action doesn't verify the piece ID is unique:
```typescript
case 'PLACE':
  return {
    ...s,
    pieces: [...s.pieces, { id: a.id, team: a.team, type: a.pt, col: a.col, row: a.row, broomSpeed: 1 }],
  }
```

**Risk**: If two clients generate the same timestamp-based ID, pieces could have duplicate IDs.

**Impact**: Piece selection and movement would break.

**Solution**: Use UUID or include team number in ID generation:
```typescript
const id = `${myTeam}-${dpType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
```

---

### Issue #2: Turn Stealing Possible with Rapid Clicks
**Severity**: 🟠 High

**Problem**: No client-side turn verification before emitting actions:
```typescript
function clickPiece(p: Piece) {
  if (isSpectator || !teamIdentityReady) return
  if (gs.duel || gs.combat || gs.bludger || gs.phase !== 'match') return
  if (bludgerMode) { /* ... */ return }
  if (p.team !== myTeam || gs.turn !== myTeam) return  // ✅ Good check
  // But emit happens before server validation
}
```

**Risk**: Fast clicking or modified client could emit out-of-turn actions.

**Mitigation**: Server-side validation via revision system catches this, but UX suffers.

**Recommendation**: Add optimistic UI lock during action processing.

---

### Issue #3: Snitch Spawn Timing Not Synced
**Severity**: 🟠 High

**Problem**: Snitch spawns after exactly 4 moves (`SNITCH_SPAWN_AFTER_MOVES`):
```typescript
const turnCount = s.turnCount + 1
// ...
snitchPhase:
  s.snitchPhase === null && turnCount === SNITCH_SPAWN_AFTER_MOVES
    ? 'appearing' as const
    : // ...
```

**Risk**: If clients get out of sync on turn count, snitch spawns at different times.

**Mitigation**: Revision system should prevent this, but could cause desync notifications.

**Status**: Acceptable with revision system in place.

---

## 🟡 MEDIUM PRIORITY ISSUES

### Issue #4: No Maximum Game Length Protection
**Severity**: 🟡 Medium

**Problem**: Games can theoretically run forever if snitch is never caught.

**Impact**: Database records grow indefinitely, rooms never expire.

**Recommendation**: Add move limit or time limit:
```typescript
if (s.turnCount > 200) {
  return { ...s, phase: 'finished', winner: s.s1 > s.s2 ? 1 : 2 }
}
```

---

### Issue #5: Streak Bonus Edge Case
**Severity**: 🟡 Medium

**Current Logic**:
```typescript
const nextStreak = isGoal ? (atk.team === 1 ? s.streak1 + 1 : s.streak2 + 1) : 0
const streakBonus = isGoal && nextStreak === 2
const goalPoints = isGoal ? 10 + (streakBonus ? 20 : 0) : 0
```

**Edge Case**: If Team 1 scores 2 goals in a row, they get:
- Goal 1: 10 points, streak = 1
- Goal 2: 30 points (10 + 20 bonus), streak resets to 0

But then Goal 3 would be streak = 1 again, not continuing.

**Question**: Is this intentional? Should streaks continue beyond 2?

**Status**: Design decision - current behavior seems intentional (bonus only on 2nd goal).

---

### Issue #6: No Stalemate Detection
**Severity**: 🟡 Medium

**Problem**: If all pieces are blocked or disabled, game has no end condition besides snitch.

**Scenario**:
- All attackers disabled
- Snitch hidden
- Game stuck

**Recommendation**: Add turn timeout or forced snitch appearance after X moves.

---

## 🟢 LOW PRIORITY OBSERVATIONS

### 1. Broom Speed Assignment Timing
Current implementation requires assigning speeds during deployment before confirming.

**Observation**: This is correct - speeds are part of team strategy, not runtime decisions.

---

### 2. Goal Zone Column Restriction
Goalkeepers use only 3 columns (A, B, C) while field is 4 columns wide.

**Observation**: This creates intentional strategic space - attackers can aim for column D which keeper can't directly defend.

---

### 3. Speed 4 Two-Block Jump
Speed 4 pieces can jump 2 cells, ignoring intermediate pieces.

**Observation**: This is powerful but balanced by limited availability (only 1 per team).

---

## ✅ WELL-DESIGNED FEATURES

### 1. Revision System Integration
The newly added revision system correctly prevents conflicting updates:
```typescript
const currentRevision = gsRef.current.revision ?? 0
// ...
p_expected_revision: currentRevision,
// ...
if (data?.conflict && data?.game_state) {
  disp({ kind: 'SYNC', gs: data.game_state as GS })
}
```

**Status**: ✅ Excellent implementation

---

### 2. Team Identity Verification
Doesn't trust URL parameters, verifies team membership via database:
```typescript
useEffect(() => {
  // ... fetch actual team membership from database
  const verifiedTeam = teams?.find(team => team.id === membership?.team_id)?.team_number
  if (!cancelled && (verifiedTeam === 1 || verifiedTeam === 2)) setMyTeam(verifiedTeam)
}, [isSpectator, roomCode, supabase])
```

**Status**: ✅ Secure and correct

---

### 3. Snitch Recent Squares Tracking
Prevents snitch from immediately returning to same position:
```typescript
const currentSquare = gsRef.current.snitchPos
  ? `${gsRef.current.snitchPos.col}${gsRef.current.snitchPos.row}`
  : null
const squares = shuffleSquares().filter(square => square !== currentSquare)
```

**Status**: ✅ Good UX design

---

## 🔧 RECOMMENDED FIXES

### Immediate (Critical)
1. ✅ Fix bludger disabled turn calculation
2. ✅ Add fallback for revision in SYNC
3. ✅ Improve piece ID generation

### Short Term (High Priority)
4. Add optimistic UI locking during action processing
5. Add client-side move validation before emit
6. Add game length limit (200-300 moves)

### Long Term (Enhancement)
7. Add stalemate detection
8. Add replay/spectator improvements
9. Add game statistics tracking

---

## 📊 COMPLEXITY METRICS

- **State Machine Complexity**: High (8 snitch phases, 3 game phases)
- **Action Types**: 12 distinct actions
- **Branching Factor**: Deep (nested conditionals in MOVE case)
- **Race Condition Risk**: Mitigated by revision system
- **Overall Code Quality**: Good (clear structure, well-commented)

---

## ✅ VERDICT

**Overall Assessment**: The game logic is **well-designed and mostly correct**. The issues found are:
- 1 critical bug (bludger disable duration)
- 2-3 high priority improvements needed
- Several medium/low priority enhancements

The revision system integration was a crucial addition that prevents most race conditions. The state machine is complex but correctly implemented.

**Recommendation**: Fix the critical bug, then the game is production-ready for beta testing.
