# 🧹 Quidditch Academy - Deployment Checklist

## Pre-Deployment Setup

### 1. Supabase Configuration
- [ ] Create a Supabase project at [supabase.com](https://supabase.com)
- [ ] Copy project URL and anon key
- [ ] Get service role key (for API routes)

### 2. Environment Variables
- [ ] Copy `.env.example` to `.env.local`
- [ ] Update `.env.local` with your Supabase credentials:
  ```env
  NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
  ```

### 3. Database Migration
Run all migration files in order in Supabase SQL Editor:

**Core Setup (Required)**
- [ ] `001_profiles.sql` - User profiles with magical names
- [ ] `002_achievements.sql` - Achievement definitions
- [ ] `003_user_achievements.sql` - User achievement tracking
- [ ] `004_rooms.sql` - Game room system
- [ ] `005_teams.sql` - Team management
- [ ] `006_team_members.sql` - Team membership
- [ ] `007_security_fixes.sql` - Security improvements
- [ ] `008_comprehensive_security.sql` - Additional security
- [ ] `009_add_team_names.sql` - Team naming
- [ ] `010_claim_captain.sql` - Captain assignment
- [ ] `011_auto_captain.sql` - Auto-captain logic
- [ ] `012_set_team_ready.sql` - Team readiness

**Game Features (Required)**
- [ ] `013_leaderboard.sql` - Leaderboard & match results ⚠️ CRITICAL
- [ ] `014_game_achievements.sql` - Achievement system ⚠️ CRITICAL
- [ ] `015_reload_postgrest_schema.sql` - Schema refresh ⚠️ CRITICAL
- [ ] `016_match_start_and_spectators.sql` - Match start logic
- [ ] `017_realtime_game_permissions.sql` - Realtime permissions
- [ ] `018_fix_match_start_randomness.sql` - Random team selection
- [ ] `019_persistent_game_state.sql` - Game state persistence ⚠️ CRITICAL
- [ ] `020_team_position_integrity.sql` - Position constraints
- [ ] `021_match_result_guard.sql` - Result validation
- [ ] `022_game_state_revisions.sql` - Conflict resolution ⚠️ CRITICAL (JUST FIXED)

### 4. Supabase Realtime Setup
Enable Realtime for these tables in Supabase Dashboard → Database → Replication:
- [ ] `rooms`
- [ ] `teams`
- [ ] `team_members`
- [ ] `player_game_stats`
- [ ] `quidditch_game_states`

### 5. Authentication Setup
- [ ] Enable Email authentication in Supabase Dashboard → Authentication → Providers
- [ ] (Optional) Configure email templates for better branding
- [ ] (Optional) Enable other auth providers (Google, GitHub, etc.)

## Testing Checklist

### Registration & Login
- [ ] Register a new user with magical name
- [ ] Choose house (Gryffindor, Hufflepuff, Ravenclaw, Slytherin)
- [ ] Login with magical name
- [ ] Logout and login again

### Solo Mode Game Flow
- [ ] Create a solo room
- [ ] See room code (QUID-XXXX format)
- [ ] Join as second player
- [ ] Deploy pieces (1 GK, 2 Defenders, 3 Attackers, 1 Seeker)
- [ ] Assign broom speeds (1x speed-1, 2x speed-2, 2x speed-3, 1x speed-4)
- [ ] Confirm deployment for both teams
- [ ] See coin toss animation
- [ ] Play match (move pieces, combat, shooting, bludgers)
- [ ] Wait for Golden Snitch to appear (after 4 moves)
- [ ] Catch the Snitch to end match
- [ ] See match results saved
- [ ] Check leaderboard updates

### Team Mode Game Flow
- [ ] Create a team room
- [ ] Have 7 players join and select positions:
  - [ ] 1 Keeper
  - [ ] 3 Chasers
  - [ ] 2 Beaters
  - [ ] 1 Seeker
- [ ] Captain confirms team readiness
- [ ] Start match
- [ ] Each player controls their position
- [ ] Complete match
- [ ] Verify stats updated for all players

### Leaderboard
- [ ] View leaderboard on achievements page
- [ ] Toggle between Solo/Team modes
- [ ] Toggle between Wins/Score/Saves metrics
- [ ] Verify real-time updates after match
- [ ] Click refresh button

### Achievements
- [ ] Check achievements page
- [ ] Verify "First Flight" unlocked after first match
- [ ] Verify "First Victory" after first win
- [ ] Verify "Golden Seeker" after catching Snitch
- [ ] Check achievement progress

### Real-time Features
- [ ] Open room in two browsers
- [ ] Verify lobby updates in real-time
- [ ] Verify game state syncs across clients
- [ ] Test piece movements sync
- [ ] Test combat animations sync
- [ ] Test Snitch wheel syncs

## Conflict Resolution Testing (NEW - JUST FIXED)
- [ ] Have two clients make rapid moves
- [ ] Verify no duplicate moves appear
- [ ] Check console for "Game state conflict detected, resyncing..." messages
- [ ] Verify game state remains consistent across clients

## Common Issues & Solutions

### Issue: "Stats are not connected"
**Solution**: Run migrations 013, 014, and 015 in order, then refresh the page.

### Issue: "Match results could not be saved"
**Solution**: 
1. Verify migration 013 is applied
2. Check that the `record_match_result` function exists in Supabase
3. Verify function has proper permissions: `GRANT EXECUTE ... TO authenticated`

### Issue: Game state not syncing
**Solution**:
1. Verify Realtime is enabled for `quidditch_game_states` table
2. Check migration 019 is applied
3. Verify RLS policies are correct
4. Check browser console for WebSocket errors

### Issue: Revision conflicts (added in latest fix)
**Solution**: This is now handled automatically! The game will auto-resync on conflicts.

### Issue: "Position X is full"
**Solution**: 
1. Verify migration 020 is applied
2. Check trigger `enforce_position_limits` exists
3. Try a different position or wait for slot to open

## Performance Optimization

### Optional Enhancements
- [ ] Enable Supabase connection pooling for better performance
- [ ] Add indexes for frequently queried columns
- [ ] Configure CDN for static assets
- [ ] Enable Edge Functions for lower latency

## Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
# Deploy to production
vercel --prod
```

### Manual Deployment
```bash
# Build for production
npm run build

# Start production server
npm start
```

## Monitoring

### Post-Deployment
- [ ] Monitor Supabase dashboard for API usage
- [ ] Check for error logs in browser console
- [ ] Monitor database performance
- [ ] Set up error tracking (Sentry, LogRocket, etc.)
- [ ] Monitor Realtime connection stability

## Backup & Recovery
- [ ] Export Supabase database regularly
- [ ] Keep migration files in version control
- [ ] Document custom RLS policies
- [ ] Maintain seed data for achievements table

---

**Last Updated**: January 2025
**Migration Version**: 022 (with revision system fix)
**Build Status**: ✅ Passing
