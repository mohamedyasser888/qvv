# Fix Realtime & Missing Functions

## The Errors

1. ❌ **Channel error** - Realtime not connecting
2. ❌ **Function not found** - `save_quidditch_game_state` not in schema cache

## Quick Fix (3 Steps)

### Step 1: Run the Migration

Open your terminal and run:

```powershell
cd d:\quiditch
npx supabase db push
```

This will apply migration `025_reload_schema_and_fix_realtime.sql` which:
- Reloads the PostgREST schema cache
- Verifies all functions exist
- Ensures realtime is enabled
- Grants proper permissions

### Step 2: Restart Your Dev Server

```powershell
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

### Step 3: Hard Refresh Your Browsers

In both Chrome and Edge:
- Press `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- This clears cache and reloads everything

## If Migration Fails

If `npx supabase db push` doesn't work, run this SQL manually in Supabase SQL Editor:

```sql
-- Reload schema
NOTIFY pgrst, 'reload schema';

-- Add to realtime if missing
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS quidditch_game_states;

-- Grant permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON quidditch_game_states TO authenticated;
GRANT EXECUTE ON FUNCTION get_or_create_quidditch_game_state(TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION save_quidditch_game_state(TEXT, JSONB, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION begin_quidditch_match(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION record_match_result(TEXT, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER) TO authenticated;

-- Final reload
NOTIFY pgrst, 'reload schema';
```

## What Each Error Means

### 1. Channel Error

**Cause:** Supabase Realtime service having issues connecting

**Fixed by:**
- Added `ack: false` to broadcast config (less strict)
- Removing `private: true` (already done)
- Ensuring proper grants and permissions

### 2. Function Not Found

**Cause:** PostgREST schema cache is stale

**Why it happens:**
- Functions were created in migrations
- PostgREST didn't reload its cache
- It doesn't know the functions exist

**Fixed by:**
- `NOTIFY pgrst, 'reload schema'` command
- Forces PostgREST to re-scan all functions

## Verify It Works

After applying the fix:

1. **Open browser console** (F12)
2. **Navigate to game page**
3. **Look for these messages:**

✅ **Success looks like:**
```
🔌 [1] Setting up realtime channel for room: QUID-XXXX
📊 [1] Channel status: SUBSCRIBED
✅ [1] Successfully subscribed to realtime
📤 [1] Emitting action: PLACE
📡 [1] Broadcast sent via channel
💾 [1] Game state saved to database
```

❌ **Failure looks like:**
```
❌ [1] Channel error - check Supabase realtime settings
❌ [1] Unable to save game state: "Could not find the function..."
```

## Alternative: Restart Supabase (if using local)

If you're running Supabase locally:

```powershell
npx supabase stop
npx supabase start
npx supabase db push
```

## Check Function Exists

Run this in Supabase SQL Editor to verify:

```sql
SELECT 
  routine_name,
  routine_type,
  specific_name
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN (
    'save_quidditch_game_state',
    'get_or_create_quidditch_game_state',
    'begin_quidditch_match',
    'record_match_result'
  );
```

Should return 4 rows - one for each function.

## Check Realtime Status

```sql
SELECT 
  schemaname, 
  tablename
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
  AND tablename = 'quidditch_game_states';
```

Should return 1 row.

## Still Not Working?

If errors persist after all steps:

1. **Check Supabase Dashboard:**
   - Project Status (is it active?)
   - Settings → API → Is PostgREST running?

2. **Check Browser Network Tab:**
   - F12 → Network
   - Look for failed requests
   - Check WebSocket connections

3. **Try Different Browser:**
   - Test in Incognito/Private mode
   - Rules out extension conflicts

4. **Check Supabase Logs:**
   - Dashboard → Logs
   - Look for error messages

## Summary

The fix is simple:
1. ✅ Run migration 025
2. ✅ Restart dev server
3. ✅ Hard refresh browsers
4. ✅ Test the game!

The migration reloads the schema cache so PostgREST knows about all your functions.
