-- Add snitch_team column to match_results table for tracking which team caught the Snitch
ALTER TABLE match_results ADD COLUMN IF NOT EXISTS snitch_team INTEGER CHECK (snitch_team IN (1, 2));

-- Update the record_match_result function to accept snitch_team parameter
CREATE OR REPLACE FUNCTION record_match_result(
  p_room_code TEXT,
  p_winner_team INTEGER,
  p_team1_score INTEGER,
  p_team2_score INTEGER,
  p_team1_saves INTEGER DEFAULT 0,
  p_team2_saves INTEGER DEFAULT 0,
  p_snitch_team INTEGER DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_room rooms%ROWTYPE;
  v_inserted UUID;
BEGIN
  SELECT * INTO v_room FROM rooms WHERE room_code = upper(p_room_code) FOR UPDATE;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Room not found');
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM team_members tm JOIN teams t ON t.id = tm.team_id
    WHERE t.room_id = v_room.id AND tm.user_id = auth.uid()
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Not a room participant');
  END IF;

  INSERT INTO match_results (room_id, mode, winner_team, team1_score, team2_score, team1_saves, team2_saves, snitch_team)
  VALUES (v_room.id, v_room.mode, p_winner_team, p_team1_score, p_team2_score, p_team1_saves, p_team2_saves, p_snitch_team)
  ON CONFLICT (room_id) DO NOTHING
  RETURNING room_id INTO v_inserted;
  IF v_inserted IS NULL THEN
    RETURN json_build_object('success', true, 'already_recorded', true);
  END IF;

  INSERT INTO player_game_stats (user_id, mode, matches, wins, losses, total_score, total_saves)
  SELECT tm.user_id, v_room.mode, 1,
         CASE WHEN t.team_number = p_winner_team THEN 1 ELSE 0 END,
         CASE WHEN t.team_number = p_winner_team THEN 0 ELSE 1 END,
         CASE WHEN t.team_number = 1 THEN p_team1_score ELSE p_team2_score END,
         CASE WHEN t.team_number = 1 THEN p_team1_saves ELSE p_team2_saves END
  FROM team_members tm
  JOIN teams t ON t.id = tm.team_id
  WHERE t.room_id = v_room.id
  ON CONFLICT (user_id, mode) DO UPDATE SET
    matches = player_game_stats.matches + 1,
    wins = player_game_stats.wins + EXCLUDED.wins,
    losses = player_game_stats.losses + EXCLUDED.losses,
    total_score = player_game_stats.total_score + EXCLUDED.total_score,
    total_saves = player_game_stats.total_saves + EXCLUDED.total_saves,
    updated_at = timezone('utc', now());

  UPDATE rooms SET status = 'finished', updated_at = timezone('utc', now()) WHERE id = v_room.id;
  RETURN json_build_object('success', true, 'already_recorded', false);
END;
$$;

-- Revoke old permission and grant new one
REVOKE EXECUTE ON FUNCTION record_match_result(TEXT, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER) FROM authenticated;
GRANT EXECUTE ON FUNCTION record_match_result(TEXT, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER) TO authenticated;
