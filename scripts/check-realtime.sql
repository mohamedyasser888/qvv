-- Quick Realtime Diagnostic Script
-- Run this in Supabase SQL Editor to check your realtime configuration

\echo '=== Checking Realtime Configuration ==='
\echo ''

-- 1. Check if quidditch_game_states is in realtime publication
\echo '1. Checking realtime publication:'
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
        AND tablename = 'quidditch_game_states'
    )
    THEN '✅ quidditch_game_states IS in realtime publication'
    ELSE '❌ quidditch_game_states NOT in realtime publication - RUN: ALTER PUBLICATION supabase_realtime ADD TABLE quidditch_game_states;'
  END as status;

\echo ''

-- 2. Check RLS policies on realtime.messages
\echo '2. Checking realtime.messages policies:'
SELECT 
  CASE 
    WHEN COUNT(*) >= 2 
    THEN '✅ Found ' || COUNT(*) || ' policies on realtime.messages'
    ELSE '❌ Missing policies - Run migration 017_realtime_game_permissions.sql'
  END as status
FROM pg_policies 
WHERE schemaname = 'realtime' 
  AND tablename = 'messages';

-- List the policies
SELECT 
  policyname,
  cmd,
  CASE 
    WHEN policyname LIKE '%watch%' THEN 'Allows reading broadcasts'
    WHEN policyname LIKE '%publish%' THEN 'Allows sending broadcasts'
    ELSE 'Other'
  END as purpose
FROM pg_policies 
WHERE schemaname = 'realtime' 
  AND tablename = 'messages'
ORDER BY policyname;

\echo ''

-- 3. Check if rooms table exists
\echo '3. Checking rooms table:'
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name = 'rooms'
    )
    THEN '✅ rooms table exists'
    ELSE '❌ rooms table missing'
  END as status;

\echo ''

-- 4. Check if teams and team_members exist
\echo '4. Checking team tables:'
SELECT 
  table_name,
  CASE 
    WHEN table_name IS NOT NULL THEN '✅ exists'
    ELSE '❌ missing'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('teams', 'team_members')
ORDER BY table_name;

\echo ''

-- 5. Check if game state functions exist
\echo '5. Checking game state functions:'
SELECT 
  routine_name,
  CASE 
    WHEN routine_name IS NOT NULL THEN '✅ exists'
    ELSE '❌ missing'
  END as status
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN (
    'get_or_create_quidditch_game_state',
    'save_quidditch_game_state',
    'record_match_result'
  )
ORDER BY routine_name;

\echo ''
\echo '=== Summary ==='
\echo 'If you see any ❌ above, follow the instructions next to them.'
\echo 'All ✅ means your realtime setup should be working!'
\echo ''
\echo 'Next steps:'
\echo '1. Test at http://localhost:3000/test-realtime'
\echo '2. Check browser console for connection status'
\echo '3. Try the game with two browsers'
