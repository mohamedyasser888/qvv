-- =============================================================================
-- Complete Fix: Starter Wheel + Schema Cache Reload + Function Verification
-- Run this in Supabase SQL Editor
-- =============================================================================

-- Fix 1: Starter Wheel Mapping (Purple at 270°, Yellow at 90°)
CREATE OR REPLACE FUNCTION begin_quidditch_match(p_room_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_room rooms%ROWTYPE;
  v_starting_team INTEGER;
  v_wheel_angle NUMERIC;
BEGIN
  SELECT * INTO v_room
  FROM rooms
  WHERE room_code = upper(trim(p_room_code))
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Room not found');
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM team_members tm
    JOIN teams t ON t.id = tm.team_id
    WHERE t.room_id = v_room.id AND tm.user_id = auth.uid()
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only match players may start a match');
  END IF;

  IF v_room.status = 'finished' THEN
    RETURN jsonb_build_object('success', false, 'error', 'This match has finished');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM teams WHERE room_id = v_room.id AND ready = false) THEN
    v_starting_team := COALESCE(
      v_room.starting_team,
      CASE WHEN random() < 0.5 THEN 1 ELSE 2 END
    );
    -- Purple (Team 1) is at top of wheel (270°), Yellow (Team 2) is at bottom (90°)
    v_wheel_angle := COALESCE(
      v_room.starting_wheel_angle,
      4320 + CASE WHEN v_starting_team = 1 THEN 270 ELSE 90 END
    );

    UPDATE rooms
    SET starting_team = v_starting_team,
        starting_wheel_angle = v_wheel_angle,
        match_started_at = COALESCE(match_started_at, timezone('utc', now())),
        status = 'playing',
        updated_at = timezone('utc', now())
    WHERE id = v_room.id;

    RETURN jsonb_build_object('success', true, 'starting_team', v_starting_team, 'wheel_angle', v_wheel_angle);
  END IF;

  RETURN jsonb_build_object('success', false, 'error', 'Both teams must be ready first');
END;
$$;

-- Fix 2: Ensure all function grants are in place
GRANT EXECUTE ON FUNCTION begin_quidditch_match(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_or_create_quidditch_game_state(TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION save_quidditch_game_state(TEXT, JSONB, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION record_match_result(TEXT, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER) TO authenticated;

-- Fix 3: Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- Verification: List all available game functions
SELECT 
  proname as function_name,
  pronargs as num_args,
  'Available ✓' as status
FROM pg_proc 
WHERE proname IN (
  'save_quidditch_game_state',
  'get_or_create_quidditch_game_state',
  'begin_quidditch_match',
  'record_match_result',
  'set_team_ready',
  'claim_position',
  'claim_captain'
)
ORDER BY proname;
