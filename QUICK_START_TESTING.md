# 🚀 QUICK START - TESTING GUIDE

## ✅ Automated Tests Complete

All automated tests have passed:
- ✅ TypeScript: No errors
- ✅ Build: Success
- ✅ Structure: All files present

---

## 🎮 START TESTING NOW

### Step 1: Start the Server

```bash
npm run dev
```

Wait for: `✓ Ready on http://localhost:3000`

---

### Step 2: Open Browser

Navigate to: **http://localhost:3000**

---

### Step 3: Quick Smoke Test (5 minutes)

#### Test 1: Registration
1. Click "Get Started"
2. Click "Don't have an account? Register"
3. Fill form:
   - Name: Test User
   - Email: test@example.com
   - Password: test123
4. Click "Register"
5. ✅ Should redirect to login

#### Test 2: Login
1. Enter: test@example.com / test123
2. Click "Login"
3. ✅ Should redirect to /home

#### Test 3: Create Room
1. Click "Play"
2. Click "Create Room"
3. Room code shown (e.g., "ABCD")
4. Click "Create"
5. ✅ Should see room lobby

#### Test 4: Join Room (Second Tab)
1. Open **incognito/private window**
2. Go to http://localhost:3000
3. Login (or register new user)
4. Click "Play" → "Join Room"
5. Enter the room code from first tab
6. ✅ Should join same room

#### Test 5: Deployment
**Tab 1 (Yellow):**
1. Select team: Yellow
2. Choose position: Defender
3. Click "D" button
4. Click 2 valid cells on board
5. Click "A" button
6. Click 3 valid cells
7. Click "S" button
8. Click 1 valid cell
9. ✅ All pieces placed

**Tab 2 (Purple):**
1. Select team: Purple
2. Repeat placement
3. ✅ Both teams place pieces

#### Test 6: Broom Assignment (if Captain)
1. In broom panel, click speed buttons
2. Assign: 3×speed-1, 2×speed-2, 1×speed-3, 1×speed-4
3. ✅ Checkmark appears when valid

#### Test 7: Start Match
1. Both tabs click "Mark Ready"
2. ✅ Starter wheel spins
3. ✅ Match begins
4. ✅ Turn indicator shows

#### Test 8: Move Piece
1. Current turn tab: Click own piece
2. Click valid highlighted cell
3. ✅ Piece moves
4. ✅ Other tab sees move immediately
5. ✅ Turn switches

---

### Step 4: Full Feature Test (15 minutes)

Use **COMPREHENSIVE_TEST_PLAN.md** for detailed testing of:
- Combat system
- Goal scoring
- Bludger attacks
- Snitch mechanics
- Game completion

---

## 🐛 If Something Breaks

### Check Console
1. Press F12 (DevTools)
2. Go to "Console" tab
3. Look for red errors
4. Copy error message

### Check Network
1. In DevTools, go to "Network" tab
2. Filter: XHR
3. Look for failed requests (red)
4. Check status codes

### Common Issues

**Issue:** "Failed to fetch"
- **Cause:** Supabase not configured
- **Fix:** Check .env.local has SUPABASE_URL and SUPABASE_ANON_KEY

**Issue:** Pieces don't appear
- **Cause:** Database not migrated
- **Fix:** Run migrations in Supabase dashboard

**Issue:** Can't join room
- **Cause:** Room doesn't exist
- **Fix:** Create room first, then copy exact code

**Issue:** Moves don't sync
- **Cause:** Realtime not enabled
- **Fix:** Check Supabase Realtime is enabled for your project

---

## ✅ Success Criteria

Your game is working if:

1. ✅ Can register and login
2. ✅ Can create and join rooms
3. ✅ Can place all pieces
4. ✅ Can move pieces during match
5. ✅ Moves sync between tabs in <1 second
6. ✅ No console errors
7. ✅ No pieces disappear
8. ✅ Turn order enforced
9. ✅ Game doesn't crash

---

## 📊 Report Results

After testing, note:
- ✅ Features that work
- ❌ Features that break
- ⚠️ Features with issues

Use this template:

```
## Test Session [Date/Time]

### Working ✅
- Feature 1
- Feature 2

### Broken ❌
- Feature X: [error message]
- Feature Y: [what happened]

### Issues ⚠️
- Feature Z: works but slow
- Feature W: confusing UI

### Browser: [Chrome/Firefox/Safari]
### Users Tested: [1 / 2 / 3+]
```

---

## 🎯 Most Critical Tests

These MUST work:
1. ✅ Can login
2. ✅ Can create room
3. ✅ Can join room (2 users)
4. ✅ Can place pieces
5. ✅ Pieces sync between users
6. ✅ Can move pieces
7. ✅ Moves sync between users
8. ✅ Game doesn't crash

If all 8 pass → **Core game is functional** 🎉

---

## 📞 Need Help?

If tests fail:
1. Check .env.local file
2. Check Supabase dashboard
3. Check browser console
4. Try different browser
5. Clear cache and reload

---

**Ready?** Run `npm run dev` and start testing! 🚀
