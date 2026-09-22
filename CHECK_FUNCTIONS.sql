-- Quick check: Do the game functions exist?
-- Run this in Supabase SQL Editor to verify

SELECT 
  proname as function_name,
  pronargs as num_params,
  CASE 
    WHEN proname IS NOT NULL THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status
FROM pg_proc 
WHERE proname IN (
  'save_quidditch_game_state',
  'get_or_create_quidditch_game_state',
  'begin_quidditch_match',
  'record_match_result'
)
ORDER BY proname;

-- If any functions are missing, run migration 028_recreate_all_game_functions.sql
