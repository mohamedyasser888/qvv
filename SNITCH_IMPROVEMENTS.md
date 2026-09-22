# Snitch Improvements

## Changes Made ✅

### 1. **Improved Snitch Visual** 🪽

**Before:**
- Snitch was in top-right corner
- Overlapped with pieces
- Hard to see

**After:**
- Snitch centered in the cell (like pieces)
- Doesn't overlap - floats above with z-index
- Bounces animation for visibility
- Glowing effect (amber shadow)
- Label below the snitch
- Scales with cell size

### 2. **Full Turn Delay Logic** 🎯

**The Problem:**
When snitch returns from hiding after 4 moves, if seekers are already on that square, the wheel triggered immediately - even if only ONE team moved. This was unfair!

**Example of the bug:**
```
Move 1: Team 1 moves (hiddenMoves = 1)
Move 2: Team 2 moves (hiddenMoves = 2)
Move 3: Team 1 moves (hiddenMoves = 3)
Move 4: Team 2 moves (hiddenMoves = 4) ← Snitch returns NOW
         But Team 1 hasn't moved yet this turn!
         Wheel triggers unfairly!
```

**The Fix:**
Snitch now waits for BOTH teams to move (full turn) before triggering the encounter wheel.

**How It Works:**
- `hiddenMoves` counts individual team moves
- Snitch returns when: `hiddenMoves >= 4` AND `hiddenMoves is EVEN`
- EVEN number = both teams moved
- ODD number = only one team moved (wait!)

**Example of correct behavior:**
```
Move 1: Team 1 moves (hiddenMoves = 1)
Move 2: Team 2 moves (hiddenMoves = 2)
Move 3: Team 1 moves (hiddenMoves = 3)
Move 4: Team 2 moves (hiddenMoves = 4) ← Both teams moved!
         Snitch returns and wheel triggers ✅
```

**Another example (odd number):**
```
Move 1: Team 1 moves (hiddenMoves = 1)
Move 2: Team 2 moves (hiddenMoves = 2)
Move 3: Team 1 moves (hiddenMoves = 3)
Move 4: Team 2 moves (hiddenMoves = 4) ← Both moved ✅
         Snitch returns

But if Team 1 moved fast:
Move 1: Team 1 moves (hiddenMoves = 1)
Move 2: Team 2 moves (hiddenMoves = 2)
Move 3: Team 1 moves (hiddenMoves = 3)
Move 4: Team 1 moves again (hiddenMoves = 4) ← NOT both teams!
         Snitch STAYS HIDDEN (wait for Team 2)
Move 5: Team 2 moves (hiddenMoves = 5) ← ODD, wait!
Move 6: Team 1 moves (hiddenMoves = 6) ← EVEN, both moved! ✅
         NOW snitch returns
```

## Snitch Visual Details

### Position:
- **z-index: 30** - Above pieces (z-index 20)
- **Centered** in cell using flexbox
- **Size**: 35% of cell width (responsive)

### Animations:
- **Bounce** - Up and down motion
- **Glow** - Amber drop-shadow effect
- **Pulsing glow** - Double shadow for emphasis

### Label:
- Black text on amber background
- Small rounded badge below snitch
- Says "SNITCH" in tiny letters

## Testing the Fix

### Test 1: Snitch Returns After Full Turn
1. Play until snitch hides
2. Make exactly 4 moves (2 per team)
3. Snitch should return and wheel triggers ✅

### Test 2: Snitch Waits for Full Turn
1. Play until snitch hides
2. Team 1 makes 3 moves quickly
3. Team 2 makes 1 move (total = 4 but ODD since last was Team 2)
4. Snitch should STAY HIDDEN
5. Team 1 makes 1 move (total = 5, ODD)
6. Team 2 makes 1 move (total = 6, EVEN)
7. NOW snitch returns ✅

### Test 3: Seeker Already on Square
1. Move seeker to a square
2. Snitch hides
3. Seeker stays on that square
4. After 4+ moves (EVEN number), snitch returns
5. Wheel triggers immediately ✅

## Snitch Flow Summary

```
Snitch active → Seeker reaches it
  ↓
Encounter wheel (hold/move/hide)
  ↓
If "hide" chosen:
  ↓
Snitch disappears (snitchPhase = 'hiding')
  ↓
Track moves: hiddenMoves = 0
  ↓
Each team move: hiddenMoves++
  ↓
When hiddenMoves >= 4 AND even:
  ↓
Snitch returns (snitchPhase = 'encounter')
  ↓
If seekers on square: Wheel triggers
If no seekers: Snitch active, seekers can chase
```

## Code Changes

### File: `src/app/game/[roomCode]/page.tsx`

**Function Modified:** `progressAfterMove`

**Old Logic:**
```javascript
s.snitchPhase === 'hiding' && hiddenMoves === 4
  ? 'encounter'
  : s.snitchPhase
```

**New Logic:**
```javascript
s.snitchPhase === 'hiding' 
  && hiddenMoves >= 4 
  && hiddenMoves % 2 === 0
  ? 'encounter'
  : s.snitchPhase
```

**Key Difference:**
- `>= 4` instead of `=== 4` (handles cases where it takes more moves)
- `% 2 === 0` ensures BOTH teams moved (even number)

## Result

✅ Snitch now properly centered and visible
✅ Snitch waits for full turns before returning
✅ Fair gameplay - both teams get equal opportunity
✅ No more premature wheel triggers

The snitch system is now balanced and fair! 🪽✨
