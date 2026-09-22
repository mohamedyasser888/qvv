# Realtime Synchronization Debug Guide

## Issue: No Live Updates Between Browsers

You're opening the game in Chrome and Edge on the same device, but changes in one browser aren't reflected in the other.

## Diagnosis Steps

### 1. Check Supabase Realtime Is Enabled

1. Go to your Supabase Dashboard: https://app.supabase.com/project/pwrztvuljacexgucpmxt
2. Navigate to **Database** → **Replication**
3. Make sure **Realtime** is enabled
4. Check that the `quidditch_game_states` table has replication enabled

### 2. Enable Realtime for the Game States Table

Run this SQL in your Supabase SQL Editor:

```sql
-- Enable realtime for the game states table
ALTER PUBLICATION supabase_realtime ADD TABLE quidditch_game_states;

-- Verify it's added
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
```

### 3. Check Realtime Broadcast Configuration

The game uses **Broadcast mode** (not Database Changes), which requires:

1. Go to **Settings** → **API** in Supabase Dashboard
2. Scroll to **Realtime** section
3. Make sure **Enable Realtime** is turned ON
4. Check that **Broadcast** is enabled

### 4. Verify RLS Policies for Realtime

The game requires these policies on the `realtime.messages` table. Check if they exist:

```sql
-- Check existing policies on realtime.messages
SELECT * FROM pg_policies WHERE tablename = 'messages' AND schemaname = 'realtime';
```

If they don't exist, apply migration `017_realtime_game_permissions.sql`:

```bash
# From your project root
supabase db push
```

Or run this SQL manually:

```sql
-- Allow authenticated users to watch broadcasts
DROP POLICY IF EXISTS "Authenticated users can watch Quidditch game broadcasts" ON realtime.messages;
CREATE POLICY "Authenticated users can watch Quidditch game broadcasts"
ON realtime.messages FOR SELECT TO authenticated
USING (
  realtime.topic() LIKE 'game:%'
  AND EXISTS (
    SELECT 1 FROM rooms r
    WHERE r.room_code = upper(split_part(realtime.topic(), ':', 2))
  )
);

-- Only team members can publish
DROP POLICY IF EXISTS "Only team members can publish Quidditch game broadcasts" ON realtime.messages;
CREATE POLICY "Only team members can publish Quidditch game broadcasts"
ON realtime.messages FOR INSERT TO authenticated
WITH CHECK (
  realtime.topic() LIKE 'game:%'
  AND EXISTS (
    SELECT 1
    FROM rooms r
    JOIN teams t ON t.room_id = r.id
    JOIN team_members tm ON tm.team_id = t.id
    WHERE r.room_code = upper(split_part(realtime.topic(), ':', 2))
      AND tm.user_id = auth.uid()
  )
);
```

### 5. Open Browser Console and Check for Errors

In both Chrome and Edge:

1. Press `F12` to open Developer Tools
2. Go to the **Console** tab
3. Look for any errors related to:
   - `realtime`
   - `channel`
   - `websocket`
   - `subscription`

Common errors:
- `401 Unauthorized` → Check RLS policies
- `Connection failed` → Check if Realtime is enabled
- `Channel closed` → Check broadcast configuration

### 6. Test the Channel Connection

Add this temporary debug code to see if the channel is connecting. Open the game page in both browsers and check the console:

**In `src/app/game/[roomCode]/page.tsx`**, find the channel setup around line 1570 and add these console logs:

```typescript
useEffect(() => {
  if (!gameStateRoomId) return
  console.log('🔌 Setting up channel for room:', roomCode)
  
  const chan = supabase.channel(`game:${roomCode}`, {
    config: { private: true, broadcast: { self: false } },
  })
  chRef.current = chan

  chan.on('broadcast', { event: 'g' }, ({ payload }) => {
    console.log('📡 Received broadcast:', payload)
    // ... rest of the code
  })

  // ... postgres_changes listener

  chan.subscribe(async (status) => {
    console.log('📊 Channel status:', status)
    // ... rest of the code
  })

  return () => { 
    console.log('🔌 Cleaning up channel')
    supabase.removeChannel(chan) 
  }
}, [roomCode, gameStateRoomId])
```

### 7. Test Sending a Broadcast

You can also verify that broadcasts are being sent. Add this log in the `emit` function:

```typescript
const emit = useCallback((a: Act) => {
  if (isSpectator || !teamIdentityReady) return
  console.log('📤 Emitting action:', a.kind, a)
  // ... rest of the emit code
}, [isSpectator, roomCode, supabase, teamIdentityReady])
```

## Expected Behavior

When working correctly:

1. **Browser 1 (Chrome)**: You place a piece → Console shows `📤 Emitting action: PLACE`
2. **Browser 2 (Edge)**: Console shows `📡 Received broadcast: { kind: 'PLACE', ... }` within ~100ms
3. Both browsers show the piece in the same location

## Quick Test

1. Open game in Chrome as Team 1
2. Open same game in Edge as Team 2
3. In Chrome console, type: `console.log('Chrome ready')`
4. In Edge console, type: `console.log('Edge ready')`
5. Place a piece in Chrome's deployment phase
6. Check if Edge console shows the broadcast message
7. Check if Edge UI updates with the new piece

## Common Solutions

### Solution 1: Realtime Not Enabled
Go to Supabase Dashboard → Database → Replication → Enable Realtime

### Solution 2: RLS Blocking Messages
Apply migration 017 or run the SQL above

### Solution 3: Broadcast Config
The channel uses `private: true` which requires proper authentication. Make sure both browsers are logged in as different users (or same user in different teams).

### Solution 4: Browser Caching
Hard refresh both browsers: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)

### Solution 5: WebSocket Connection Failed
Check your network/firewall settings. Realtime requires WebSocket connections on port 443.

## Still Not Working?

If none of the above works, check:

1. **Supabase Project Status**: Is your project active? Check the dashboard.
2. **Network Issues**: Try from different networks (mobile hotspot vs WiFi)
3. **Browser Extensions**: Disable ad blockers and privacy extensions
4. **Incognito Mode**: Test in incognito/private windows to rule out cache issues

## Database Fallback

The game also uses database polling as a fallback:

- Every action is saved to `quidditch_game_states` table
- Postgres changes trigger syncs
- This is slower but more reliable if broadcasts fail

To verify database syncing works:
1. Check the `quidditch_game_states` table in Supabase SQL Editor
2. Make a move in one browser
3. Refresh the SQL query to see if `game_state` updates
4. The other browser should pick it up via postgres_changes listener
