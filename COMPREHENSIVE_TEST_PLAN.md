# 🧪 COMPREHENSIVE TEST PLAN - Quiditch Game

## Test Execution Status

### ✅ Automated Tests
- [x] TypeScript compilation
- [x] Production build
- [x] Environment validation
- [ ] Component rendering (requires test setup)
- [ ] Integration tests (requires test setup)

### 📋 Manual Testing Required
All features below need manual browser testing with real users.

---

## 1. AUTHENTICATION & USER MANAGEMENT

### 1.1 Registration (`/register`)
- [ ] Fill all fields with valid data → Success
- [ ] Leave email empty → Error shown
- [ ] Use invalid email format → Error shown
- [ ] Password < 6 characters → Error shown
- [ ] Passwords don't match → Error shown
- [ ] Email already exists → Error shown
- [ ] Submit form → Redirects to login
- [ ] Click "Already have account" → Redirects to login

### 1.2 Login (`/login`)
- [ ] Valid credentials → Redirects to /home
- [ ] Invalid email → Error shown
- [ ] Invalid password → Error shown
- [ ] Empty fields → Error shown
- [ ] Click "Don't have account" → Redirects to register
- [ ] Click "Forgot password" → Redirects to forgot-password

### 1.3 Forgot Password (`/forgot-password`)
- [ ] Enter valid email → Success message
- [ ] Enter invalid email → Error shown
- [ ] Check email for reset link
- [ ] Click reset link → Redirects to reset-password page
- [ ] Click "Back to login" → Redirects to login

### 1.4 Reset Password (`/reset-password`)
- [ ] Valid token + new password → Success
- [ ] Invalid token → Error shown
- [ ] Password < 6 chars → Error shown
- [ ] Passwords don't match → Error shown
- [ ] After reset → Can login with new password

### 1.5 Session Persistence
- [ ] Login → Close browser → Reopen → Still logged in
- [ ] Logout → Redirects to landing page
- [ ] Access protected route without auth → Redirects to login

---

## 2. HOME & NAVIGATION

### 2.1 Landing Page (`/`)
- [ ] Shows game title and description
- [ ] "Get Started" button visible
- [ ] Click "Get Started" → Redirects appropriately (login if not authed)
- [ ] Responsive on mobile
- [ ] All images load

### 2.2 Home Page (`/home`)
- [ ] Shows username/profile
- [ ] Navigation bar visible
- [ ] "Play" button works
- [ ] "Achievements" button works
- [ ] "Leaderboard" visible
- [ ] Logout button works

### 2.3 Navigation Bar
- [ ] Shows on all protected pages
- [ ] Logo/title links to home
- [ ] Active page highlighted
- [ ] Responsive on mobile (hamburger menu)
- [ ] All links work

---

## 3. ROOM MANAGEMENT

### 3.1 Play Page (`/play`)
- [ ] "Create Room" button visible
- [ ] "Join Room" button visible
- [ ] Click Create → Redirects to /room/create
- [ ] Click Join → Redirects to /room/join

### 3.2 Create Room (`/room/create`)
- [ ] Room code auto-generated (4 chars)
- [ ] Can edit room code
- [ ] Select max players (2-8)
- [ ] Select time limit (5-30 min)
- [ ] Click "Create" → Room created
- [ ] Redirects to `/room/[code]`
- [ ] Room code is shareable

### 3.3 Join Room (`/room/join`)
- [ ] Enter room code input visible
- [ ] Enter invalid code → Error shown
- [ ] Enter valid code → Room found
- [ ] Click "Join" → Redirects to `/room/[code]`
- [ ] Room full → Error shown

### 3.4 Room Lobby (`/room/[code]`)
- [ ] Room code displayed at top
- [ ] "Copy Code" button works
- [ ] Shows current players list
- [ ] Shows max players count
- [ ] Team selection (Yellow/Purple)
- [ ] Position selection (Defender/Attacker/Seeker)
- [ ] "Claim Captain" button visible if available
- [ ] Captain badge shown on captain
- [ ] "Ready" button toggles state
- [ ] "Start Game" button (captain only, both teams ready)
- [ ] Spectator option visible
- [ ] Real-time player updates when others join

---

## 4. GAME - DEPLOYMENT PHASE

### 4.1 Initial State (`/game/[code]`)
- [ ] Board renders (4 columns × 7 rows)
- [ ] Yellow goal zone (row 0) highlighted
- [ ] Purple goal zone (row 6) highlighted
- [ ] Phase indicator shows "Deployment"
- [ ] Team assignment visible
- [ ] Both goalkeepers (GK) pre-placed
- [ ] Piece selector shows: D, A, S buttons
- [ ] Piece limits shown (D: 0/2, A: 0/3, S: 0/1)

### 4.2 Placing Defenders (D)
- [ ] Click D button → D selected (highlighted)
- [ ] Valid cells highlighted (home zone)
- [ ] Click valid cell → Piece placed
- [ ] Piece counter updates (D: 1/2)
- [ ] Click invalid cell → Nothing happens
- [ ] Place 2nd D → Counter shows 2/2
- [ ] D button disabled after 2 placed

### 4.3 Placing Attackers (A)
- [ ] Click A button → A selected
- [ ] Valid cells highlighted
- [ ] Place 3 attackers successfully
- [ ] Counter updates (A: 3/3)
- [ ] A button disabled after 3 placed

### 4.4 Placing Seeker (S)
- [ ] Click S button → S selected
- [ ] Valid cells highlighted
- [ ] Place 1 seeker successfully
- [ ] Counter shows (S: 1/1)
- [ ] S button disabled after 1 placed

### 4.5 Broom Speed Assignment (Captain Only)
- [ ] Broom panel visible (captain only)
- [ ] Each piece shows current speed (default 0)
- [ ] Speed buttons: 1★, 2★, 3★, 4★
- [ ] Click speed → Assigned to piece
- [ ] Speed limits enforced:
  - [ ] Speed 1: exactly 3 pieces
  - [ ] Speed 2: exactly 2 pieces
  - [ ] Speed 3: exactly 1 piece
  - [ ] Speed 4: exactly 1 piece
- [ ] Can't assign same speed beyond limit
- [ ] GK always speed 0 (locked)
- [ ] Invalid assignment → Warning shown
- [ ] Valid assignment → Checkmark shown

### 4.6 Finishing Deployment
- [ ] "Mark Ready" button disabled until:
  - [ ] All 6 pieces placed (2D, 3A, 1S)
  - [ ] All speeds assigned correctly
- [ ] Click "Mark Ready" → Button shows "Waiting..."
- [ ] Other team not ready → Wait indicator shown
- [ ] Both teams ready → Phase changes to "Match"

### 4.7 Multiplayer Deployment
- [ ] **Two Browser Test:**
  - [ ] Tab 1: Yellow team places pieces
  - [ ] Tab 2: Purple team sees Yellow pieces (hidden until match)
  - [ ] Tab 1: Sees own pieces immediately
  - [ ] Both mark ready → Both see "Starting match..."
  - [ ] Starter wheel appears for both

---

## 5. GAME - MATCH PHASE

### 5.1 Match Start
- [ ] Starter wheel spins (3 seconds)
- [ ] Random team selected to start
- [ ] Turn indicator shows current team
- [ ] Starting team can move pieces
- [ ] Non-turn team pieces disabled

### 5.2 Moving Pieces
- [ ] Click own piece → Piece selected (highlighted)
- [ ] Valid moves shown (based on speed):
  - [ ] Speed 1: 1 square (adjacent)
  - [ ] Speed 2: 1 square (adjacent)
  - [ ] Speed 3: 1 square (adjacent)
  - [ ] Speed 4: 2 squares (jump)
- [ ] Click valid cell → Piece moves
- [ ] Click invalid cell → Nothing happens
- [ ] Turn counter increments
- [ ] Turn switches to other team
- [ ] Press Escape → Deselect piece

### 5.3 Combat System
- [ ] Move piece to cell with opponent → Combat triggered
- [ ] Combat modal appears
- [ ] Shows attacker speed vs defender speed
- [ ] Higher speed wins → Opponent removed
- [ ] Equal speed → Defender wins
- [ ] Winner stays, loser removed from board
- [ ] Combat animation shown
- [ ] Modal closes automatically

### 5.4 Bludger System (Defender Special)
- [ ] Select defender with unused bludger
- [ ] Bludger icon shown on defender
- [ ] Bludger cells highlighted (knight-move pattern)
- [ ] Click target cell → Bludger fires
- [ ] Bludger travels (animation)
- [ ] Multiple pieces in path → Choice modal appears
- [ ] Select target → Target disabled for 2 turns
- [ ] Bludger marked as used
- [ ] Each defender can use bludger once per game

### 5.5 Goal Zone Scoring
- [ ] Move attacker to opponent goal zone → Goal duel triggered
- [ ] Duel modal appears
- [ ] Shows three choices: LEFT, MIDDLE, RIGHT
- [ ] Attacker chooses first
- [ ] Defender chooses second
- [ ] "Waiting for opponent" shown
- [ ] Both chosen → Result revealed:
  - [ ] Different choice → GOAL! +10 points
  - [ ] Same choice → BLOCKED! No points
- [ ] Streak bonus: 2 goals in a row → +20 points (2nd goal)
- [ ] Goal animation shown
- [ ] Score updates on scoreboard

### 5.6 Snitch System (Seeker Special)
- [ ] After turn 20 → Snitch appears
- [ ] Snitch shown on board (flashing)
- [ ] Move seeker to snitch → Snitch duel
- [ ] Seeker spins snitch wheel
- [ ] Three outcomes:
  - [ ] HOLD: Snitch stays, no change
  - [ ] MOVE: Snitch moves to random cell
  - [ ] HIDE: Snitch disappears, reappears later
- [ ] Catch snitch → +30 points
- [ ] Game continues until time/score limit

---

## 6. GAME - END CONDITIONS

### 6.1 Victory Conditions
- [ ] Score reaches 100 → Game ends
- [ ] Time limit reached → Highest score wins
- [ ] All opponent pieces removed → Victory
- [ ] Snitch caught with lead → Victory

### 6.2 Game Over Screen
- [ ] Winner announced
- [ ] Final scores shown
- [ ] Match statistics:
  - [ ] Goals scored
  - [ ] Pieces captured
  - [ ] Bludgers used
  - [ ] Snitch attempts
- [ ] "Play Again" button
- [ ] "Back to Home" button
- [ ] Achievement unlocks shown

---

## 7. SPECTATOR MODE

### 7.1 Join as Spectator
- [ ] Join full room → Spectator option shown
- [ ] Click "Join as Spectator" → Game view loads
- [ ] Cannot select pieces
- [ ] Cannot make moves
- [ ] See both teams' pieces
- [ ] See real-time updates
- [ ] Turn indicator visible
- [ ] Score visible
- [ ] Can leave anytime

---

## 8. ACHIEVEMENTS SYSTEM

### 8.1 Achievement Page (`/achievements`)
- [ ] Grid of achievement cards shown
- [ ] Locked achievements shown (grayed out)
- [ ] Unlocked achievements highlighted
- [ ] Achievement icons load
- [ ] Achievement descriptions shown
- [ ] Progress bars shown (if applicable)
- [ ] Categories: Gameplay, Combat, Goals, Snitch

### 8.2 Achievement Unlocks
- [ ] First Goal → "First Blood" unlocked
- [ ] Win 5 games → "Pentacle" unlocked
- [ ] Catch snitch → "Seeker's Glory" unlocked
- [ ] 10 bludger hits → "Bludger Master" unlocked
- [ ] Unlock notification shown in-game
- [ ] Achievement saved to database
- [ ] Visible on profile

---

## 9. LEADERBOARD SYSTEM

### 9.1 Leaderboard Display
- [ ] Top players shown (rank 1-100)
- [ ] Player avatar/name shown
- [ ] Stats shown:
  - [ ] Total wins
  - [ ] Total goals
  - [ ] Win rate %
  - [ ] Highest score
- [ ] Current user highlighted
- [ ] Sortable by different stats
- [ ] Pagination works (if >100 players)
- [ ] Real-time updates

---

## 10. REAL-TIME MULTIPLAYER

### 10.1 Connection Status
- [ ] Connected indicator (green dot)
- [ ] Disconnected indicator (red dot)
- [ ] Reconnect automatically when back online
- [ ] Show "Reconnecting..." message

### 10.2 Synchronization Tests
- [ ] **Two Browser Test - Fast Actions:**
  - [ ] Tab 1: Move piece rapidly
  - [ ] Tab 2: Sees move immediately (<100ms)
  - [ ] No piece duplication
  - [ ] No missing pieces
  - [ ] Turn order maintained

- [ ] **Two Browser Test - Simultaneous Actions:**
  - [ ] Both tabs try to move at same time
  - [ ] Only turn-owner's move succeeds
  - [ ] Other player gets "Not your turn" feedback

- [ ] **Two Browser Test - Combat:**
  - [ ] Tab 1: Attacks Tab 2's piece
  - [ ] Both see combat modal
  - [ ] Combat resolves correctly
  - [ ] Loser removed from both views
  - [ ] Winner stays in both views

- [ ] **Two Browser Test - Goal Duel:**
  - [ ] Tab 1: Attacker enters goal zone
  - [ ] Tab 2: Defender sees duel modal
  - [ ] Both choose options
  - [ ] Result shown to both
  - [ ] Score updates for both

- [ ] **Two Browser Test - Disconnect/Reconnect:**
  - [ ] Tab 1: Close tab
  - [ ] Tab 2: Sees "Opponent disconnected" (optional)
  - [ ] Tab 1: Reopen tab
  - [ ] Tab 1: Game state restored
  - [ ] Can continue playing

---

## 11. UI/UX TESTING

### 11.1 Responsive Design
- [ ] Desktop (1920×1080) → All elements visible
- [ ] Laptop (1366×768) → All elements visible
- [ ] Tablet (768×1024) → Mobile layout
- [ ] Mobile (375×667) → Mobile layout
- [ ] Board scales correctly
- [ ] Buttons accessible
- [ ] Text readable
- [ ] No horizontal scroll

### 11.2 Animations & Feedback
- [ ] Hover effects on buttons
- [ ] Click feedback (button press)
- [ ] Piece selection highlight
- [ ] Valid move highlight
- [ ] Invalid action shake/red flash
- [ ] Turn indicator animation
- [ ] Score increment animation
- [ ] Goal celebration animation
- [ ] Combat flash animation
- [ ] Bludger travel animation

### 11.3 Accessibility
- [ ] Keyboard navigation works
- [ ] Tab through interactive elements
- [ ] Enter/Space to activate buttons
- [ ] Escape to close modals
- [ ] Focus indicators visible
- [ ] Color contrast sufficient
- [ ] Screen reader compatible (alt text)

---

## 12. ERROR HANDLING

### 12.1 Network Errors
- [ ] Lose internet connection → Error shown
- [ ] Database timeout → Retry/error shown
- [ ] Supabase down → Graceful degradation

### 12.2 Invalid States
- [ ] Invalid room code → Error message
- [ ] Room deleted → Redirect to home
- [ ] Player kicked → Notification + redirect
- [ ] Invalid move → Error feedback

### 12.3 Browser Compatibility
- [ ] Chrome (latest) → All features work
- [ ] Firefox (latest) → All features work
- [ ] Safari (latest) → All features work
- [ ] Edge (latest) → All features work

---

## 13. PERFORMANCE TESTING

### 13.1 Load Times
- [ ] Landing page < 2s
- [ ] Game page < 3s
- [ ] Board render < 1s
- [ ] Piece movement < 100ms
- [ ] Real-time sync < 100ms

### 13.2 Resource Usage
- [ ] CPU usage reasonable (<50% on modern hardware)
- [ ] Memory stable (no leaks after 30 min)
- [ ] Network traffic minimal
- [ ] No console errors

---

## 14. SECURITY TESTING

### 14.1 Authentication
- [ ] Can't access protected routes without login
- [ ] JWT tokens expire correctly
- [ ] Logout clears session
- [ ] XSS protection active

### 14.2 Game Rules
- [ ] Can't move opponent's pieces
- [ ] Can't move on opponent's turn
- [ ] Can't place pieces outside zone
- [ ] Can't cheat speed limits
- [ ] Can't modify score directly
- [ ] Database RLS enforced

---

## 15. DATABASE INTEGRITY

### 15.1 Data Persistence
- [ ] Game state saved correctly
- [ ] Achievements persist after logout
- [ ] Leaderboard updates correctly
- [ ] User profile data accurate

### 15.2 Concurrent Access
- [ ] Multiple games running simultaneously
- [ ] No data corruption
- [ ] Revision conflicts handled
- [ ] Transaction rollbacks work

---

## TEST EXECUTION COMMANDS

```bash
# TypeScript validation
npm run type-check

# Production build
npm run build

# Start dev server for manual testing
npm run dev

# Run linter
npm run lint

# Check bundle size
npm run build && du -sh .next/static
```

---

## CRITICAL TESTS (MUST PASS)

### Priority 1 - Blocker Bugs
- [ ] Can register new account
- [ ] Can login
- [ ] Can create room
- [ ] Can join room
- [ ] Can place all pieces
- [ ] Can move pieces
- [ ] Game doesn't crash
- [ ] Multiplayer sync works

### Priority 2 - Major Features
- [ ] Combat works
- [ ] Goal scoring works
- [ ] Broom speeds work
- [ ] Game ends correctly
- [ ] Achievements unlock
- [ ] Leaderboard updates

### Priority 3 - Polish
- [ ] Animations smooth
- [ ] UI responsive
- [ ] No console errors
- [ ] Performance good

---

## BUG TRACKING TEMPLATE

```
**Bug:** [Brief description]
**Severity:** Critical / Major / Minor
**Steps to Reproduce:**
1. 
2. 
3. 
**Expected:** 
**Actual:** 
**Browser:** 
**Screenshot:** [link]
```

---

## TEST RESULTS

Will be filled during manual testing:

- **Total Tests:** TBD
- **Passed:** TBD
- **Failed:** TBD
- **Blocked:** TBD
- **Coverage:** TBD%

---

**Note:** This plan requires manual browser testing with 2+ users for multiplayer features. Automated tests can be added later using Playwright or Cypress.
