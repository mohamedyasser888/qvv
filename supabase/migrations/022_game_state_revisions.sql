-- Avoid silent last-write-wins conflicts when both clients act near the same
-- time. Clients send the revision they read; stale writes receive the latest
-- board and must resync before making another move.
ALTER TABLE quidditch_game_states
  ADD COLUMN IF NOT EXISTS revision INTEGER NOT NULL DEFAULT 0;

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

GRANT EXECUTE ON FUNCTION save_quidditch_game_state(TEXT, JSONB, INTEGER) TO authenticated;
NOTIFY pgrst, 'reload schema';
