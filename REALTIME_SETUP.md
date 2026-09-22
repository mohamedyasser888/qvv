# 🔴 URGENT: Fix Realtime Synchronization

## The Problem

You're testing on the same device with Chrome and Edge, but live updates aren't working. When you make a move in one browser, it doesn't appear in the other browser.

## Quick Fix Steps

### Step 1: Run the Migration

Open your terminal and run:

```powershell
# Navigate to your project
cd d:\quiditch

# Apply the new migration
npx supabase db push
```

Or manually run this SQL in Supabase SQL Editor (https://app.supabase.com/project/pwrztvuljacexgucpmxt/sql):

```sql
-- Enable Realtime for quidditch_game_states table
ALTER PUBLICATION supabase_realtime ADD TABLE quidditch_game_states;

-- Verify it worked
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
```

### Step 2: Verify Realtime is Enabled in Supabase

1. Go to: https://app.supabase.com/project/pwrztvuljacexgucpmxt/settings/api
2. Scroll to **Realtime** section
3. Make sure **Enable Realtime** toggle is ON
4. Make sure **Realtime API** shows as "Enabled"

### Step 3: Test With the Debug Page

1. Make sure your dev server is running: `npm run dev`
2. Open in **Chrome**: http://localhost:3000/test-realtime
3. Open in **Edge**: http://localhost:3000/test-realtime
4. Type a message in Chrome and click Send
5. The message should appear in BOTH browsers

**If the test page works but the game doesn't**, the issue is with authentication or room setup.
**If the test page doesn't work**, continue to Step 4.

### Step 4: Check Console Logs in the Game

1. Open your game in Chrome (as Team 1)
2. Open your game in Edge (as Team 2)
3. Press F12 in both browsers
4. Go to Console tab
5. Look for these messages:

**Expected in Chrome:**
```
🔌 [1] Setting up realtime channel for room: ABCD
📊 [1] Channel status: SUBSCRIBED
✅ [1] Successfully subscribed to realtime
📤 [1] Emitting action: PLACE
📡 [1] Broadcast sent via channel
💾 [1] Game state saved to database
```

**Expected in Edge:**
```
🔌 [2] Setting up realtime channel for room: ABCD
📊 [2] Channel status: SUBSCRIBED
✅ [2] Successfully subscribed to realtime
📡 [2] Received broadcast: PLACE
✅ [2] Dispatching action: PLACE
```

### Step 5: Common Issues and Solutions

#### Issue: "Channel status: CHANNEL_ERROR"
**Solution:** Realtime is not enabled. Go to Supabase Dashboard → Settings → API → Enable Realtime

#### Issue: "401 Unauthorized" in console
**Solution:** RLS policies blocking realtime. Run migration 017:
```powershell
npx supabase db push
```

#### Issue: Broadcasts send but don't receive
**Solution:** Check that both browsers are logged in as DIFFERENT users on DIFFERENT teams:
- Chrome: Login as user A, join Team 1
- Edge: Login as user B, join Team 2

**Note:** If you're using the same user in both browsers, broadcasts are filtered out by `self: false` config.

#### Issue: Messages only appear after refreshing
**Solution:** WebSocket connection is failing. Check:
- Firewall settings (allow port 443)
- Corporate network restrictions
- Try a different network (mobile hotspot)

## How It Works

Your game uses TWO methods for synchronization:

### Method 1: Broadcast (Fast, Real-time)
- Uses WebSockets
- Updates appear instantly (~100ms)
- Requires Realtime enabled
- Channel: `game:ROOMCODE`

### Method 2: Database Changes (Fallback)
- Uses database polling
- Updates appear in ~1-2 seconds
- More reliable
- Requires `quidditch_game_states` in realtime publication

Both should work together. If broadcasts fail, database changes provide backup sync.

## Detailed Troubleshooting

### Check 1: Verify Realtime Publication

```sql
SELECT 
  schemaname, 
  tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
  AND tablename = 'quidditch_game_states';
```

Should return 1 row. If empty, run:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE quidditch_game_states;
```

### Check 2: Verify RLS Policies

```sql
SELECT policyname 
FROM pg_policies 
WHERE schemaname = 'realtime' 
  AND tablename = 'messages';
```

Should return:
- `Authenticated users can watch Quidditch game broadcasts`
- `Only team members can publish Quidditch game broadcasts`

If missing, run migration 017.

### Check 3: Test Raw Channel

Open browser console and run:

```javascript
const supabase = window.supabase // if available
const channel = supabase.channel('test123')
channel.on('broadcast', { event: 'test' }, (payload) => {
  console.log('Received:', payload)
})
channel.subscribe((status) => {
  console.log('Status:', status)
  if (status === 'SUBSCRIBED') {
    channel.send({
      type: 'broadcast',
      event: 'test',
      payload: { message: 'Hello from console!' }
    })
  }
})
```

## Still Not Working?

If you've tried everything above and it's still not working:

1. **Restart Supabase locally** (if using local setup):
   ```powershell
   npx supabase stop
   npx supabase start
   ```

2. **Check Supabase Status**: https://status.supabase.com/

3. **Try Incognito Mode**: Rules out browser extensions/cache

4. **Check Network Tab** (F12 → Network → WS):
   - Look for WebSocket connections
   - Should see `wss://` connection to Supabase
   - Check for connection errors

5. **Contact Support**: If using Supabase Cloud, check their docs or support

## Architecture Notes

Your realtime setup:

```
Browser 1 (Chrome)          Browser 2 (Edge)
     |                            |
     | emit('PLACE')              |
     v                            |
  Local State                     |
     |                            |
     +---> Broadcast --------->   v
     |         (fast)         Receive & Update
     |                            ^
     +---> Database --------->    |
           (reliable)         Postgres Changes
```

Both paths should work independently. If broadcast fails, database changes provide sync.

## Next Steps After Fixing

Once realtime is working:

1. Remove console.logs from production code (if desired)
2. Test with 3+ players in different locations
3. Test with spectators
4. Test network reconnection (turn off WiFi briefly)
5. Monitor Supabase realtime usage in dashboard

## Support Files Created

- `REALTIME_DEBUG_GUIDE.md` - Comprehensive debugging guide
- `supabase/migrations/024_enable_realtime.sql` - Enable realtime publication
- `src/app/test-realtime/page.tsx` - Simple test page
- Game page now has detailed console logging

Visit http://localhost:3000/test-realtime to verify realtime works before testing the actual game.
