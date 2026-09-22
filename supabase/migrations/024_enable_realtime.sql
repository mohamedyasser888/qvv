-- Enable Realtime for quidditch_game_states table
-- This ensures postgres_changes events are broadcast to subscribed clients

-- Add the table to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE quidditch_game_states;

-- Verify the table is in the publication
SELECT 
  schemaname, 
  tablename,
  'realtime enabled' as status
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
  AND tablename = 'quidditch_game_states';

-- Also verify that the realtime schema policies exist
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE schemaname = 'realtime' 
  AND tablename = 'messages'
ORDER BY policyname;
