# Quidditch Academy - Testing Guide

## Quick Start Testing

### Local Development Testing
```bash
# 1. Start the development server
npm run dev

# 2. Open in browser
http://localhost:3000

# 3. Enable debug mode for device info
http://localhost:3000?debug=true
```

### Mobile Device Testing (Same Network)
```bash
# 1. Find your computer's local IP address
# Windows: ipconfig
# Mac/Linux: ifconfig

# 2. Start dev server
npm run dev

# 3. On mobile device, navigate to:
http://YOUR_IP_ADDRESS:3000

# Example: http://192.168.1.100:3000
```

### Production Build Testing
```bash
# 1. Build for production
npm run build

# 2. Start production server
npm start

# 3. Test at http://localhost:3000
```

## Testing Checklist

### ✅ Authentication Flow
- [ ] Register new account
- [ ] Login with existing account
- [ ] Logout
- [ ] Forgot password
- [ ] Reset password

### ✅ Navigation
- [ ] Home page loads
- [ ] Play page shows rooms
- [ ] Achievements page displays
- [ ] Navigation between pages smooth
- [ ] Back button works correctly

### ✅ Room Creation & Joining
- [ ] Create solo room
- [ ] Create team room
- [ ] Join room with code
- [ ] Room code copy works
- [ ] Team selection works
- [ ] Position card selection
- [ ] Captain assignment correct
- [ ] Ready button enables when valid

### ✅ Deployment Phase
- [ ] All piece types deployable
- [ ] Valid placement cells highlighted
- [ ] Cannot deploy in invalid cells
- [ ] Broom speed assignment works
- [ ] Speed constraints enforced (e.g., 1 seeker gets speed 4)
- [ ] "Deploy Complete" button appears when ready
- [ ] Both teams must complete deployment

### ✅ Match Phase - Basic Movement
- [ ] Correct team's turn indicated
- [ ] Piece selection works (tap/click)
- [ ] Valid move cells highlighted
- [ ] Piece moves to selected cell
- [ ] Turn switches to other team
- [ ] Movement respects broom speed

### ✅ Match Phase - Combat
- [ ] Combat triggered when entering defender cell
- [ ] Combat wheel appears
- [ ] Wheel spins correctly
- [ ] Correct outcome applied (attacker wins/defender wins)
- [ ] Frozen pieces show ❄️ indicator
- [ ] Frozen pieces cannot move for 3 turns

### ✅ Match Phase - Goal Attempts
- [ ] Goal duel triggered in goal zone
- [ ] Choice buttons appear (LEFT/MIDDLE/RIGHT)
- [ ] Wheel shows attacker vs keeper speeds
- [ ] Goal scored adds 10 points
- [ ] Streak bonus adds 20 points total (not 30)
- [ ] Goal celebration animation plays
- [ ] Attacker choice after combat win in goal zone

### ✅ Match Phase - Bludger
- [ ] Defender can use bludger (1 per game)
- [ ] Bludger target selection works
- [ ] Bludger travels to target
- [ ] Hit pieces knocked back correctly
- [ ] Captain bludger can hit multiple pieces

### ✅ Match Phase - Snitch
- [ ] Snitch appears on board
- [ ] Seeker bonus move works correctly
- [ ] Seeker bonus UI shows "End Turn" and "Play Another Move"
- [ ] Snitch encounter triggered correctly
- [ ] Snitch priority: combat/duel first, then snitch
- [ ] Snitch delay timing correct (smart wait system)
- [ ] Snitch outcomes: hold/move/hide work
- [ ] Snitch catch-off between seekers
- [ ] Match ends when snitch caught (+50 points)

### ✅ Real-Time Sync
- [ ] Actions from one browser appear in another
- [ ] Both teams see same game state
- [ ] Turn changes synchronized
- [ ] Piece movements synchronized
- [ ] Combat/duel results synchronized
- [ ] Score updates synchronized
- [ ] Connection status indicator works (green/yellow/red)

### ✅ UI/UX
- [ ] Loading skeletons appear
- [ ] Smooth animations (pieces, wheels, celebrations)
- [ ] No lag or stuttering
- [ ] Error messages are user-friendly
- [ ] Buttons have hover effects
- [ ] Active elements have focus indicators
- [ ] Text is readable on all backgrounds

### ✅ Keyboard Navigation (Desktop)
- [ ] Tab navigates through elements
- [ ] Enter/Space activates buttons
- [ ] Escape deselects pieces
- [ ] Keyboard shortcuts panel visible on desktop
- [ ] All interactive elements reachable via keyboard

### ✅ Mobile-Specific
- [ ] Touch targets are large enough (44x44px min)
- [ ] No accidental text selection
- [ ] No double-tap zoom on buttons
- [ ] Smooth scrolling
- [ ] Images load quickly (WebP)
- [ ] Keyboard shortcuts panel hidden on mobile
- [ ] Portrait and landscape modes work
- [ ] Game fits on small screens (375px)

### ✅ Performance
- [ ] Page loads under 3 seconds
- [ ] Animations run at 60fps
- [ ] No memory leaks (test long sessions)
- [ ] Images optimized (check Network tab)
- [ ] No excessive re-renders

### ✅ Accessibility
- [ ] Screen reader announces game state
- [ ] All images have alt text
- [ ] Color contrast meets WCAG AA
- [ ] Focus indicators visible
- [ ] Keyboard navigation works
- [ ] Reduced motion respected

## Browser Testing Matrix

| Browser | Version | Priority | Status |
|---------|---------|----------|--------|
| Chrome | Latest | High | ⏳ |
| Firefox | Latest | High | ⏳ |
| Safari | Latest | High | ⏳ |
| Edge | Latest | Medium | ⏳ |
| Chrome Mobile | Latest | High | ⏳ |
| Safari iOS | Latest | High | ⏳ |

## Device Testing Matrix

| Device | Resolution | Priority | Status |
|--------|------------|----------|--------|
| Desktop | 1920×1080 | High | ⏳ |
| Laptop | 1366×768 | High | ⏳ |
| iPad | 1024×768 | Medium | ⏳ |
| iPhone 14 | 390×844 | High | ⏳ |
| Samsung Galaxy | 360×800 | High | ⏳ |
| Small Phone | 375×667 | Medium | ⏳ |

## Network Testing

| Condition | Download | Upload | Latency | Priority |
|-----------|----------|--------|---------|----------|
| Fast WiFi | 100+ Mbps | 100+ Mbps | <20ms | Low |
| Slow WiFi | 10 Mbps | 5 Mbps | 50ms | Medium |
| 4G | 4 Mbps | 1 Mbps | 100ms | High |
| 3G | 1 Mbps | 0.5 Mbps | 200ms | High |
| Offline | 0 | 0 | ∞ | Medium |

### Testing Network Conditions
```javascript
// Chrome DevTools: Network tab > Throttling dropdown
// Options: Fast 3G, Slow 3G, Offline
```

## Debugging Tools

### Enable Debug Mode
```
http://localhost:3000?debug=true
```
Shows device information panel with:
- Screen resolution
- Viewport size
- Device pixel ratio
- Touch support
- Orientation
- User agent

### Browser DevTools
```javascript
// Console commands for testing

// Check game state
// (Open console in game page, check React DevTools)

// Monitor network requests
// Network tab > Filter by type

// Check performance
// Performance tab > Record > Stop
// Look for:
// - Long tasks (> 50ms)
// - Layout shifts
// - Memory leaks
```

### Lighthouse Audit
```bash
# Chrome DevTools > Lighthouse tab
# Categories: Performance, Accessibility, Best Practices, SEO
# Device: Mobile
# Target scores: All > 90
```

## Common Issues & Solutions

### Issue: Game not loading
- Check console for errors
- Verify Supabase credentials in .env.local
- Check network connection

### Issue: Real-time sync not working
- Check Supabase realtime is enabled
- Verify both users in same room
- Check connection status indicator (should be green)

### Issue: Lag or stuttering
- Check Network tab for slow requests
- Disable animations in accessibility settings
- Try different browser
- Check CPU usage

### Issue: Touch not working on mobile
- Verify touch events in DevTools
- Check for JavaScript errors
- Test on actual device (not just emulator)

### Issue: Images not loading
- Check Network tab for failed requests
- Verify images exist in /public folder
- Check Next.js Image optimization

## Test User Accounts

For testing, create at least 4 accounts:
```
Team 1 - Captain: test1@example.com
Team 1 - Player: test2@example.com
Team 2 - Captain: test3@example.com
Team 2 - Player: test4@example.com
```

This allows testing:
- Captain-specific features
- Team coordination
- Real-time sync between players

## Automated Testing (Future)

### Unit Tests
```bash
# Add Jest + React Testing Library
npm install --save-dev jest @testing-library/react @testing-library/jest-dom

# Run tests
npm test
```

### E2E Tests
```bash
# Add Playwright or Cypress
npm install --save-dev @playwright/test

# Run E2E tests
npm run test:e2e
```

## Deployment Testing

### Pre-deployment Checklist
- [ ] All tests pass
- [ ] No console errors
- [ ] Environment variables set
- [ ] Database migrations applied
- [ ] Images optimized
- [ ] Build successful (`npm run build`)
- [ ] Production server works (`npm start`)

### Post-deployment Checklist
- [ ] Production site loads
- [ ] Authentication works
- [ ] Real-time sync works
- [ ] All pages accessible
- [ ] Images load correctly
- [ ] No broken links
- [ ] SSL certificate valid
- [ ] Performance acceptable

## Reporting Bugs

When reporting bugs, include:
1. **Description**: What happened vs what should happen
2. **Steps to reproduce**: Exact steps to trigger the bug
3. **Environment**: Browser, device, OS version
4. **Screenshots**: If visual bug
5. **Console logs**: Any error messages
6. **Network logs**: If sync/loading issue

## Testing Completion Criteria

✅ **All features work**:
- Authentication
- Room creation/joining
- Deployment
- Movement
- Combat
- Goals
- Bludgers
- Snitch
- Real-time sync

✅ **Performance acceptable**:
- Loads under 3 seconds
- Smooth animations
- No lag

✅ **Works across devices**:
- Desktop (Chrome, Firefox, Safari, Edge)
- Mobile (iOS Safari, Chrome Android)
- Tablets

✅ **Accessible**:
- Keyboard navigation
- Screen readers
- Color contrast
- Focus indicators

✅ **Production-ready**:
- No console errors
- Optimized images
- Environment variables secure
- Error handling graceful

## Summary

This testing guide ensures the Quidditch Academy game is:
- **Functional**: All features work as intended
- **Performant**: Fast and smooth on all devices
- **Accessible**: Usable by everyone
- **Production-ready**: Stable and secure

Run through this checklist before deploying to production.
