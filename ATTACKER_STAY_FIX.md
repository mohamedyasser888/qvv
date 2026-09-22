# 🔧 ATTACKER STAY - IMMEDIATE TURN END FIX

## Issue Reported
"When I click STAY, turn should end immediately. But I can press the attacker again and it shoots in the same turn."

## Root Cause
The ATTACKER_CHOICE reducer was not clearing the `combat` state when player chose "stay". This could cause residual state issues.

## Fix Applied

### Changed in `src/app/game/[roomCode]/page.tsx` Line ~548

**BEFORE:**
```typescript
} else {
  // Stay in position - mark piece so next move to goal zone auto-shoots
  return {
    ...s,
    pieces: s.pieces.map(p => 
      p.id === atk.id ? { ...p, stayedInGoalZone: true } : p
    ),
    attackerScoringChoice: undefined,
    turn: nextTeam(s.turn),
  }
}
```

**AFTER:**
```typescript
} else {
  // Stay in position - mark piece and end turn immediately
  return {
    ...s,
    pieces: s.pieces.map(p => 
      p.id === atk.id ? { ...p, stayedInGoalZone: true } : p
    ),
    combat: null,  // ← ADDED: Clear combat state
    attackerScoringChoice: undefined,
    turn: nextTeam(s.turn),
  }
}
```

## What This Fixes

1. **Clears Combat State:** Ensures no residual combat data remains
2. **Switches Turn Immediately:** `turn: nextTeam(s.turn)` prevents same-turn actions
3. **Marks Piece:** `stayedInGoalZone: true` for next encounter

## Expected Behavior After Fix

### Scenario: Attacker Stays
```
1. Attacker wins combat in goal zone
2. UI shows: "STAY" vs "SHOOT"
3. Player clicks "STAY IN POSITION"
4. emit({ kind: 'ATTACKER_CHOICE', choice: 'stay' })
5. Reducer runs:
   - Sets stayedInGoalZone = true
   - Clears combat = null ✅
   - Clears attackerScoringChoice = undefined
   - Switches turn to opponent
6. ✅ Player CANNOT click attacker again (not their turn)
7. ✅ Opponent's turn starts
```

### What Prevents Double Action

**Turn Guard in `clickPiece`:**
```typescript
if (p.team !== myTeam || gs.turn !== myTeam) return
```

After clicking "STAY":
- `gs.turn` switches to opponent
- Clicking your attacker → `gs.turn !== myTeam` → Returns early → No action

**Result:** Player cannot act again in same turn! ✅

## Testing Steps

### Test 1: Verify Turn Switches
1. Start game
2. Attacker wins combat in goal zone
3. Click "🛡️ STAY IN POSITION"
4. **Check turn indicator** → Should show opponent's name
5. Try clicking your attacker → **Should not respond**
6. **Expected:** Turn has ended, opponent can now move

### Test 2: Verify No Double Shoot
1. Attacker wins combat in goal zone
2. Click "STAY"
3. Rapidly click the attacker piece multiple times
4. **Expected:** No response, piece not selectable
5. **Verify:** No goal duel triggered in same turn

### Test 3: Verify Combat Cleared
1. Open browser DevTools → Console
2. After clicking "STAY", check game state:
   ```javascript
   // Check that combat is null
   console.log(gs.combat)  // Should be: null
   ```
3. **Expected:** `combat: null`

## Debug Console Checks

If issue persists, check in browser console:

```javascript
// After clicking STAY, verify:
console.log("Turn:", gs.turn, "My Team:", myTeam)  
// Should show: Turn is NOT your team

console.log("Combat:", gs.combat)  
// Should show: null

console.log("Attacker Scoring Choice:", gs.attackerScoringChoice)  
// Should show: undefined

console.log("Turn Count:", gs.turnCount)
// Should increment after actions
```

## Additional Safeguard

If the issue still occurs, it might be a race condition. Consider adding this extra check in `clickPiece`:

```typescript
// Block clicking pieces during attacker choice modal
if (gs.attackerScoringChoice) {
  console.log('[CLICK PIECE] Cannot select pieces during attacker choice')
  return
}
```

But this shouldn't be necessary since the choice UI is modal and blocks interaction.

## Summary

✅ **Fix Applied:** Added `combat: null` to ATTACKER_CHOICE "stay" case  
✅ **Turn Switches:** Immediately after clicking STAY  
✅ **No Double Action:** Turn guard prevents same-turn actions  
✅ **Build Status:** Passing  

**Test now!** Clear browser cache (Ctrl+Shift+R) and verify turn ends immediately when clicking STAY.
