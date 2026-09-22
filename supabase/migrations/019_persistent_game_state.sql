-- Broadcast delivery is intentionally fast but transient. Keep one latest
-- state per room so late joiners and clients that briefly lose a websocket
-- receive the exact current board.
CREATE TABLE IF NOT EXISTS quidditch_game_states (
  room_id UUID PRIMARY KEY REFERENCES rooms(id) ON DELETE CASCADE,
  game_state JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE quidditch_game_states ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Room viewers can read Quidditch game state" ON quidditch_game_states;
CREATE POLICY "Room viewers can read Quidditch game state"
ON quidditch_game_states FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM rooms r WHERE r.id = quidditch_game_states.room_id));

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
BEGIN
  SELECT * INTO v_room FROM rooms WHERE room_code = upper(trim(p_room_code));
  IF NOT FOUND OR v_room.status <> 'playing' THEN
    RETURN jsonb_build_object('success', false, 'error', 'This match is not active');
  END IF;

  INSERT INTO quidditch_game_states (room_id, game_state)
  VALUES (v_room.id, p_initial_state)
  ON CONFLICT (room_id) DO NOTHING;

  SELECT game_state INTO v_state FROM quidditch_game_states WHERE room_id = v_room.id;
  RETURN jsonb_build_object('success', true, 'room_id', v_room.id, 'game_state', v_state);
END;
$$;

CREATE OR REPLACE FUNCTION save_quidditch_game_state(
  p_room_code TEXT,
  p_game_state JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_room_id UUID;
BEGIN
  SELECT r.id INTO v_room_id
  FROM rooms r
  WHERE r.room_code = upper(trim(p_room_code)) AND r.status = 'playing';

  IF v_room_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'This match is not active');
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM team_members tm JOIN teams t ON t.id = tm.team_id
    WHERE t.room_id = v_room_id AND tm.user_id = auth.uid()
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only match players may update the board');
  END IF;

  INSERT INTO quidditch_game_states (room_id, game_state)
  VALUES (v_room_id, p_game_state)
  ON CONFLICT (room_id) DO UPDATE
  SET game_state = EXCLUDED.game_state, updated_at = timezone('utc', now());

  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION get_or_create_quidditch_game_state(TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION save_quidditch_game_state(TEXT, JSONB) TO authenticated;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE quidditch_game_states;
EXCEPTION WHEN duplicate_object THEN NULL;
END;
$$;

NOTIFY pgrst, 'reload schema';
