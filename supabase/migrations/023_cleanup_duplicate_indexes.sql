-- Migration 023: Clean up duplicate indexes and add missing grants
-- This migration addresses issues found in code revision

-- ============================================
-- 1. REMOVE DUPLICATE MAGICAL_NAME INDEX
-- ============================================
-- Migration 001 created idx_profiles_magical_name
-- Migrations 007 and 008 created idx_profiles_magical_name_ci (unique)
-- We only need the unique case-insensitive one

DROP INDEX IF EXISTS idx_profiles_magical_name;

-- ============================================
-- 2. ENSURE ALL RPC FUNCTIONS HAVE GRANTS
-- ============================================
-- Some earlier migrations may not have included these

-- set_team_ready is already granted in migration 012
-- set_team_captain is already granted in migration 008
-- Verify claim_position is granted
DO $$
BEGIN
  -- claim_position from migration 020
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
    AND p.proname = 'claim_position'
    AND pg_get_function_arguments(p.oid) = 'p_team_id uuid, p_user_id uuid, p_position text'
  ) THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION claim_position(UUID, UUID, TEXT) TO authenticated';
  END IF;
END $$;

-- ============================================
-- 3. ADD ROOM CLEANUP FUNCTION (OPTIONAL)
-- ============================================
-- Clean up expired rooms that are not currently playing
-- Can be called manually or scheduled with pg_cron

CREATE OR REPLACE FUNCTION cleanup_expired_rooms()
RETURNS TABLE (deleted_count INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Delete expired rooms that are not playing or finished
  DELETE FROM rooms
  WHERE expires_at < timezone('utc', now())
    AND status IN ('waiting', 'ready');
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN QUERY SELECT v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION cleanup_expired_rooms() TO authenticated;

COMMENT ON FUNCTION cleanup_expired_rooms() IS 
  'Removes expired rooms that are not currently playing. Safe to call periodically.';

-- ============================================
-- 4. ADD HELPER VIEWS FOR DEBUGGING
-- ============================================

-- View to check which RPC functions are granted to authenticated users
CREATE OR REPLACE VIEW public_rpc_functions AS
SELECT 
  p.proname AS function_name,
  pg_get_function_arguments(p.oid) AS arguments,
  pg_get_function_result(p.oid) AS return_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_proc_acl
      WHERE grantee = (SELECT oid FROM pg_roles WHERE rolname = 'authenticated')
    ) THEN 'YES'
    ELSE 'CHECK_DEFAULT'
  END AS granted_to_authenticated
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN (
    'claim_position',
    'set_team_ready', 
    'set_team_captain',
    'begin_quidditch_match',
    'record_match_result',
    'get_or_create_quidditch_game_state',
    'save_quidditch_game_state',
    'cleanup_expired_rooms'
  )
ORDER BY p.proname;

-- ============================================
-- 5. NOTIFY POSTGREST TO RELOAD SCHEMA
-- ============================================
NOTIFY pgrst, 'reload schema';
