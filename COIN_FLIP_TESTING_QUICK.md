# 🪙 COIN FLIP ANIMATION - QUICK TEST GUIDE

## 🚀 HOW TO TEST THE COIN FLIP ANIMATION

### Method 1: Quick Test Button (EASIEST)

1. **Navigate to any active game** (create a match and join it)
2. **Look at the top of the screen** - you'll see a purple button: **"🪙 TEST COIN FLIP"**
3. **Click the button**
4. **Watch the animation!**

The button instantly triggers the coin flip animation without needing to deploy pieces.

---

### Method 2: Real Game Flow (FULL TEST)

1. **Create a new match** in room lobby
2. **Join with second player/window**
3. **Deploy all pieces** for both teams
4. **Click "Deploy"** on both sides
5. **Watch:** Coin flip triggers automatically when both teams are ready

---

## 🎬 WHAT YOU SHOULD SEE

### Animation Sequence:

1. **Dark overlay appears** with text "CHOOSING STARTING TEAM"

2. **Coin appears** in center:
   - Purple side (Team 1)
   - Yellow side (Team 2)
   - Shows "50/50" and "Fair & Random"

3. **Coin flips** (4 seconds):
   - Launches upward in parabolic arc
   - Spins rapidly in 3D (rotateY)
   - Smooth physics: fast launch → maintain speed → slow landing
   - No jerky motion

4. **Coin lands** showing the winning side:
   - Purple side up = Team 1 starts
   - Yellow side up = Team 2 starts

5. **Result announcement** (3 seconds):
   - "PURPLE STARTS!" or "YELLOW STARTS!"
   - Team name shown

6. **Match begins** with correct team's turn

---

## ✅ VERIFICATION CHECKLIST

### Visual Quality:
- [ ] Coin visible and centered
- [ ] Both sides clearly distinguishable (Purple vs Yellow)
- [ ] 3D perspective visible
- [ ] Smooth rotation (no stuttering)
- [ ] Parabolic lift motion (goes up, then down)
- [ ] No "fast → slow → fast" speed issues

### Physics:
- [ ] Launch: Quick acceleration upward
- [ ] Spin: Consistent rotation speed
- [ ] Land: Smooth deceleration

### Result:
- [ ] Final side matches announcement
  - Purple side up → "PURPLE STARTS"
  - Yellow side up → "YELLOW STARTS"
- [ ] Correct team gets first turn
- [ ] No desync between players

### Randomness:
- [ ] Click test button 10 times
- [ ] Results vary (not always same team)
- [ ] Roughly 50% Purple, 50% Yellow

---

## 🐛 TROUBLESHOOTING

### Button doesn't appear:
- Make sure you're **not a spectator**
- Hard refresh browser: `Ctrl + Shift + R`
- Clear cache and reload

### Coin doesn't show:
- Open console (F12) and check for errors
- Look for `[COIN]` logs
- Verify `gs.coinFlipStatus === 'flipping'`

### Animation is choppy:
- Close other browser tabs
- Check CPU usage
- Try different browser

### Wrong team starts:
- Check console logs
- Verify `gs.coinFlipResult` matches `gs.turn`
- Check final rotation matches result

---

## 🎨 ANIMATION DETAILS

### Timing:
- **4 seconds:** Flip animation
- **3 seconds:** Result display
- **7 seconds total** before match starts

### Rotation:
- **4 full spins:** 1440° (4 × 360°)
- **Purple final:** 0° or 1440°
- **Yellow final:** 180° or 1620°

### Lift:
- **Peak height:** 100px
- **Easing:** Parabolic (sine wave)

---

## 📝 NOTES FOR TESTING

1. **Test button is for development only** - remove before production
2. **Works in all phases** - you can test anytime during a match
3. **Does not affect game state** - pure visual test
4. **Multiple tests allowed** - click as many times as you want

---

## 🎯 WHAT TO REPORT

If you find issues, please note:

1. **What phase?** (room lobby, deployment, match)
2. **Animation quality?** (smooth, choppy, freezes)
3. **Result accuracy?** (does final side match announcement?)
4. **Console errors?** (open F12 and check)
5. **Browser?** (Chrome, Firefox, Edge, etc.)

---

**Status:** ✅ TEST BUTTON ADDED - READY FOR TESTING

Just click the purple **"🪙 TEST COIN FLIP"** button in the game to see the animation!
