-- =============================================================================
-- COMPLETE FIX: Recreate ALL game functions + Fix starter wheel + Reload schema
-- Run this ENTIRE script in Supabase SQL Editor
-- =============================================================================

-- =============================================================================
-- 1. Create quidditch_game_states table if missing
-- =============================================================================
CREATE TABLE IF NOT EXISTS quidditch_game_states (
  room_id UUID PRIMARY KEY REFERENCES rooms(id) ON DELETE CASCADE,
  game_state JSONB NOT NULL,
  revision INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE quidditch_game_states ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Room viewers can read Quidditch game state" ON quidditch_game_states;
CREATE POLICY "Room viewers can read Quidditch game state"
  ON quidditch_game_states FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM rooms r WHERE r.id = quidditch_game_states.room_id));

-- =============================================================================
-- 2. Create get_or_create_quidditch_game_state function
-- =============================================================================
CREATE OR REPLACE FUNCTION get_or_create_quidditch_game_state(
  p_room_code TEXT,
  p_initial_state JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_room rooms%ROWTYPE;
  v_state JSONB;
  v_revision INTEGER;
BEGIN
  SELECT * INTO v_room FROM rooms WHERE room_code = upper(trim(p_room_code));
  IF NOT FOUND OR v_room.status <> 'playing' THEN
    RETURN jsonb_build_object('success', false, 'error', 'This match is not active');
  END IF;
  INSERT INTO quidditch_game_states (room_id, game_state)
  VALUES (v_room.id, p_initial_state - 'revision')
  ON CONFLICT (room_id) DO NOTHING;
  SELECT game_state, revision INTO v_state, v_revision
  FROM quidditch_game_states WHERE room_id = v_room.id;
  RETURN jsonb_build_object(
    'success', true,
    'room_id', v_room.id,
    'game_state', v_state || jsonb_build_object('revision', v_revision)
  );
END;
$$;

-- =============================================================================
-- 3. Create save_quidditch_game_state function
-- =============================================================================
DROP FUNCTION IF EXISTS save_quidditch_game_state(TEXT, JSONB);
CREATE FUNCTION save_quidditch_game_state(
  p_room_code TEXT,
  p_game_state JSONB,
  p_expected_revision INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_room_id UUID;
  v_state JSONB;
  v_revision INTEGER;
BEGIN
  SELECT r.id INTO v_room_id FROM rooms r
  WHERE r.room_code = upper(trim(p_room_code)) AND r.status = 'playing';
  IF v_room_id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'This match is not active'); END IF;
  IF NOT EXISTS (
    SELECT 1 FROM team_members tm JOIN teams t ON t.id = tm.team_id
    WHERE t.room_id = v_room_id AND tm.user_id = auth.uid()
  ) THEN RETURN jsonb_build_object('success', false, 'error', 'Only match players may update the board'); END IF;

  SELECT game_state, revision INTO v_state, v_revision
  FROM quidditch_game_states WHERE room_id = v_room_id FOR UPDATE;
  IF v_revision IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Game board is unavailable'); END IF;
  IF v_revision <> p_expected_revision THEN
    RETURN jsonb_build_object('success', false, 'conflict', true,
      'game_state', v_state || jsonb_build_object('revision', v_revision));
  END IF;

  UPDATE quidditch_game_states
  SET game_state = p_game_state - 'revision', revision = revision + 1,
      updated_at = timezone('utc', now())
  WHERE room_id = v_room_id;
  RETURN jsonb_build_object('success', true, 'revision', v_revision + 1);
END;
$$;

-- =============================================================================
-- 4. Fix begin_quidditch_match (Starter wheel: Purple=270°, Yellow=90°)
-- =============================================================================
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

-- =============================================================================
-- 5. Grant all necessary permissions
-- =============================================================================
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON quidditch_game_states TO authenticated;
GRANT EXECUTE ON FUNCTION get_or_create_quidditch_game_state(TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION save_quidditch_game_state(TEXT, JSONB, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION begin_quidditch_match(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION record_match_result(TEXT, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER) TO authenticated;

-- =============================================================================
-- 6. Enable realtime for game states
-- =============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND tablename = 'quidditch_game_states'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE quidditch_game_states;
    RAISE NOTICE '✅ Added quidditch_game_states to realtime';
  ELSE
    RAISE NOTICE '✅ quidditch_game_states already in realtime';
  END IF;
END $$;

-- =============================================================================
-- 7. Reload PostgREST schema cache
-- =============================================================================
NOTIFY pgrst, 'reload schema';

-- =============================================================================
-- 8. Verification: Show all game functions
-- =============================================================================
SELECT 
  proname as function_name,
  pronargs as num_params,
  '✅ Available' as status
FROM pg_proc 
WHERE proname IN (
  'save_quidditch_game_state',
  'get_or_create_quidditch_game_state',
  'begin_quidditch_match',
  'record_match_result'
)
ORDER BY proname;
