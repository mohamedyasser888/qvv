-- Reload PostgREST schema cache to recognize all functions
NOTIFY pgrst, 'reload schema';

-- Verify that all game functions exist and are accessible
DO $$
BEGIN
  -- Check if functions exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'save_quidditch_game_state'
  ) THEN
    RAISE EXCEPTION 'save_quidditch_game_state function not found';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'get_or_create_quidditch_game_state'
  ) THEN
    RAISE EXCEPTION 'get_or_create_quidditch_game_state function not found';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'begin_quidditch_match'
  ) THEN
    RAISE EXCEPTION 'begin_quidditch_match function not found';
  END IF;

  RAISE NOTICE 'All game functions verified successfully';
END $$;

-- Make sure realtime is properly enabled
-- Check if quidditch_game_states is in the publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND tablename = 'quidditch_game_states'
  ) THEN
    -- Add it if not present
    ALTER PUBLICATION supabase_realtime ADD TABLE quidditch_game_states;
    RAISE NOTICE 'Added quidditch_game_states to realtime publication';
  ELSE
    RAISE NOTICE 'quidditch_game_states already in realtime publication';
  END IF;
END $$;

-- Ensure all necessary grants are in place
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON quidditch_game_states TO authenticated;
GRANT EXECUTE ON FUNCTION get_or_create_quidditch_game_state(TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION save_quidditch_game_state(TEXT, JSONB, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION begin_quidditch_match(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION record_match_result(TEXT, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER) TO authenticated;

-- Final schema reload
NOTIFY pgrst, 'reload schema';

-- Show summary
SELECT 
  'Function exists: ' || proname as status
FROM pg_proc 
WHERE proname IN (
  'save_quidditch_game_state',
  'get_or_create_quidditch_game_state',
  'begin_quidditch_match',
  'record_match_result'
);
