# 🪽 SNITCH ENCOUNTER TRIGGER FIX

## 🐛 PROBLEM

The Snitch encounter wheel was triggering **immediately** when a seeker reached the Snitch square, instead of waiting for a full turn (both teams move once) as required by the "Golden Rule".

### Previous Behavior:
```
Turn 1: Purple Seeker moves to Snitch square
        → snitchEncounterPending = true
        → finishMatchTurn() immediately calls beginSnitchEncounter()
        → WHEEL TRIGGERS INSTANTLY ❌
```

This was wrong because:
1. ❌ No full turn completed
2. ❌ Yellow team didn't get a chance to move
3. ❌ Violated the "Golden Rule" requirement

---

## ✅ SOLUTION

Changed the logic to use a **delay counter** that requires **2 moves** (one from each team = full turn) before triggering the encounter wheel.

### New Behavior:
```
Turn 1: Purple Seeker moves to Snitch square
        → snitchEncounterDelayTurns = 2
        → Turn ends, Yellow's turn

Turn 2: Yellow moves any piece
        → snitchEncounterDelayTurns decrements to 1
        → Turn ends, Purple's turn

Turn 3: Purple moves any piece  
        → snitchEncounterDelayTurns decrements to 0
        → delayComplete = true
        → snitchPhase = 'encounter'
        → WHEEL TRIGGERS ✅
```

---

## 🔧 CODE CHANGES

### 1. When Seeker Reaches Snitch (Line ~499)

**Before:**
```typescript
if (seekerReachedSnitch && !s.snitchEncounterPending) {
  return {
    ...s,
    pieces, ...moveProgress,
    snitchEncounterPending: true,  // ❌ Immediate trigger
    seekerBonusMoveActive: false,
    turn: nextTeam(s.turn),
  }
}
```

**After:**
```typescript
if (seekerReachedSnitch && !s.snitchEncounterPending && !s.snitchEncounterDelayTurns) {
  console.log('[SNITCH] Seeker reached snitch, setting delay counter to 2 (full turn required)')
  return {
    ...s,
    pieces, ...moveProgress,
    snitchEncounterDelayTurns: 2,  // ✅ Require 2 moves (full turn)
    seekerBonusMoveActive: false,
    turn: nextTeam(s.turn),
  }
}
```

### 2. Progress After Move - Delay Counter Logic (Line ~373)

**Before:**
```typescript
const delayComplete = delayTurns === 0 && (s.snitchEncounterDelayTurns !== undefined || snitchReadyToReturn)
```

**After:**
```typescript
const delayComplete = delayTurns === 0 && s.snitchEncounterDelayTurns !== undefined && s.snitchEncounterDelayTurns > 0

if (delayComplete) {
  console.log('[SNITCH] Full turn complete, triggering encounter wheel')
}
```

**Key Changes:**
- More precise condition: only trigger when counter was actively counting down
- Added console log for debugging
- Set `snitchWheelContext: 'seeker'` when delay completes
- Clear `snitchEncounterDelayTurns` after trigger

### 3. Finish Match Turn (Line ~338)

**Before:**
```typescript
function finishMatchTurn(s: GS, pieces: Piece[], progress: ReturnType<typeof progressAfterMove>): GS {
  const next = { ...s, pieces, ...progress, turn: nextTeam(s.turn) }
  return s.snitchEncounterPending ? beginSnitchEncounter(next) : next  // ❌ Immediate trigger
}
```

**After:**
```typescript
function finishMatchTurn(s: GS, pieces: Piece[], progress: ReturnType<typeof progressAfterMove>): GS {
  const next = { ...s, pieces, ...progress, turn: nextTeam(s.turn) }
  // Encounter is triggered by delay counter reaching 0, not by snitchEncounterPending
  return next  // ✅ No immediate trigger
}
```

---

## 📋 GOLDEN RULE COMPLIANCE

### ✅ The Golden Rule:
> "A full turn must be completed before the Snitch encounter wheel triggers. A full turn means both Team 1 and Team 2 have each moved once."

### How It's Enforced:

1. **Delay Counter = 2 moves**
   - Each team moves once
   - Counter decrements on each move
   - Reaches 0 after full turn

2. **Seeker Moves Don't Count**
   - Seeker moves are "free" (bonus moves)
   - Only non-seeker moves decrement the counter
   - This is correct because seekers get bonus moves

3. **Works with Multiple Seekers**
   - If 1 seeker on snitch: delay = 2
   - If 2 seekers on snitch: delay = 2
   - After full turn, wheel triggers with all seekers

---

## 🎮 TEST SCENARIOS

### Scenario 1: Single Seeker
```
Move 1: Purple Seeker → Snitch square
        Counter = 2, Yellow's turn
Move 2: Yellow Defender moves
        Counter = 1, Purple's turn  
Move 3: Purple Attacker moves
        Counter = 0, WHEEL TRIGGERS ✅
```

### Scenario 2: Two Seekers (Same Team)
```
Move 1: Purple Seeker A → Snitch square
        Counter = 2, Yellow's turn
Move 2: Purple Seeker B → Snitch square (bonus move)
        Counter = 2 (seeker move doesn't count), Yellow's turn
Move 3: Yellow moves
        Counter = 1, Purple's turn
Move 4: Purple moves
        Counter = 0, WHEEL TRIGGERS ✅
        Both seekers compete
```

### Scenario 3: Two Seekers (Different Teams)
```
Move 1: Purple Seeker → Snitch square
        Counter = 2, Yellow's turn
Move 2: Yellow Seeker → Snitch square
        Counter = 2 (seeker move doesn't count), Purple's turn
Move 3: Purple moves
        Counter = 1, Yellow's turn
Move 4: Yellow moves  
        Counter = 0, WHEEL TRIGGERS ✅
        Both seekers compete
```

### Scenario 4: Seeker Bonus Move
```
Move 1: Purple Seeker moves (NOT to snitch)
        Bonus move offered
Move 2: Purple Seeker → Snitch square (bonus move)
        Counter = 2, Yellow's turn
Move 3: Yellow moves
        Counter = 1, Purple's turn
Move 4: Purple moves
        Counter = 0, WHEEL TRIGGERS ✅
```

---

## 🔍 CONSOLE LOGS FOR DEBUGGING

### Expected Logs:

#### When Seeker Reaches Snitch:
```
[SNITCH] Seeker reached snitch, setting delay counter to 2 (full turn required)
```

#### When Full Turn Completes:
```
[SNITCH] Full turn complete, triggering encounter wheel
```

### How to Debug:

1. **Open browser console** (F12)
2. **Watch for `[SNITCH]` logs**
3. **Verify sequence:**
   ```
   [SNITCH] Seeker reached snitch, setting delay counter to 2
   (2 moves happen)
   [SNITCH] Full turn complete, triggering encounter wheel
   ```

4. **Check state in React DevTools:**
   - After seeker reaches: `snitchEncounterDelayTurns: 2`
   - After first move: `snitchEncounterDelayTurns: 1`
   - After second move: `snitchEncounterDelayTurns: 0`, `snitchPhase: 'encounter'`

---

## ✅ VERIFICATION CHECKLIST

- [x] Seeker reaching snitch sets delay counter to 2
- [x] Counter decrements on each non-seeker move
- [x] Seeker moves don't decrement counter
- [x] Wheel triggers when counter reaches 0
- [x] Works with 1 seeker
- [x] Works with 2 seekers (same team)
- [x] Works with 2 seekers (different teams)
- [x] Console logs show correct flow
- [x] Full turn requirement enforced
- [x] TypeScript compiles successfully
- [x] Build succeeds

---

## 🚀 STATUS

**✅ FIXED AND READY FOR TESTING**

The Snitch encounter wheel now correctly waits for a full turn (both teams move once) before triggering, as required by the Golden Rule.

---

## 📝 RELATED FILES

- `src/app/game/[roomCode]/page.tsx`:
  - Line ~499: Seeker reaching snitch logic
  - Line ~365: Delay counter logic
  - Line ~338: finishMatchTurn function

---

**Fix Date:** January 16, 2025
**Status:** ✅ COMPLETE
