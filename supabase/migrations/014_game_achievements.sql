-- Award achievements from the trusted match-result transaction. Client code
-- never writes user_achievements directly, which keeps progress authoritative.

ALTER TABLE match_results
  ADD COLUMN IF NOT EXISTS snitch_team INTEGER CHECK (snitch_team IN (1, 2));

DROP POLICY IF EXISTS "Users can insert their own achievements" ON user_achievements;

CREATE OR REPLACE FUNCTION unlock_achievement(p_user_id UUID, p_name TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO user_achievements (user_id, achievement_id)
  SELECT p_user_id, id
  FROM achievements
  WHERE name = p_name
  ON CONFLICT (user_id, achievement_id) DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION evaluate_game_achievements(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_matches INTEGER := 0;
  v_wins INTEGER := 0;
  v_score INTEGER := 0;
  v_saves INTEGER := 0;
  v_team_matches INTEGER := 0;
  v_total_achievements INTEGER := 0;
BEGIN
  SELECT
    COALESCE(SUM(matches), 0),
    COALESCE(SUM(wins), 0),
    COALESCE(SUM(total_score), 0),
    COALESCE(SUM(total_saves), 0),
    COALESCE(MAX(matches) FILTER (WHERE mode = 'team'), 0)
  INTO v_matches, v_wins, v_score, v_saves, v_team_matches
  FROM player_game_stats
  WHERE user_id = p_user_id;

  IF v_matches >= 1 THEN PERFORM unlock_achievement(p_user_id, 'First Flight'); END IF;
  IF v_wins >= 1 THEN PERFORM unlock_achievement(p_user_id, 'First Victory'); END IF;
  IF v_saves >= 10 THEN PERFORM unlock_achievement(p_user_id, 'Keeper''s Wall'); END IF;
  IF v_score >= 100 THEN PERFORM unlock_achievement(p_user_id, 'Chaser''s Glory'); END IF;
  IF v_team_matches >= 10 THEN PERFORM unlock_achievement(p_user_id, 'Team Player'); END IF;
  IF v_wins >= 10 THEN PERFORM unlock_achievement(p_user_id, 'Quidditch Champion'); END IF;

  IF EXISTS (
    SELECT 1
    FROM match_results mr
    JOIN teams t ON t.room_id = mr.room_id AND t.team_number = mr.winner_team
    JOIN team_members tm ON tm.team_id = t.id
    WHERE tm.user_id = p_user_id
      AND ((mr.winner_team = 1 AND mr.team2_score = 0) OR (mr.winner_team = 2 AND mr.team1_score = 0))
  ) THEN
    PERFORM unlock_achievement(p_user_id, 'Perfect Defense');
  END IF;

  -- Count total achievements excluding Legendary Wizard
  SELECT COUNT(*) INTO v_total_achievements
  FROM achievements
  WHERE name <> 'Legendary Wizard';

  -- Legendary Wizard is only awarded after every other seeded achievement.
  IF (SELECT COUNT(*) FROM user_achievements ua
      JOIN achievements a ON a.id = ua.achievement_id
      WHERE ua.user_id = p_user_id AND a.name <> 'Legendary Wizard')
     >= v_total_achievements THEN
    PERFORM unlock_achievement(p_user_id, 'Legendary Wizard');
  END IF;
END;
$$;

-- Existing players receive the achievements their already-recorded stats merit.
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  FOR v_user_id IN SELECT DISTINCT user_id FROM player_game_stats LOOP
    PERFORM evaluate_game_achievements(v_user_id);
  END LOOP;
END;
$$;

DROP FUNCTION IF EXISTS record_match_result(TEXT, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER);

CREATE FUNCTION record_match_result(
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
  IF NOT FOUND THEN RETURN json_build_object('success', false, 'error', 'Room not found'); END IF;
  IF p_winner_team NOT IN (1, 2) OR p_snitch_team IS NOT NULL AND p_snitch_team NOT IN (1, 2) THEN
    RETURN json_build_object('success', false, 'error', 'Invalid team result');
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM team_members tm JOIN teams t ON t.id = tm.team_id
    WHERE t.room_id = v_room.id AND tm.user_id = auth.uid()
  ) THEN RETURN json_build_object('success', false, 'error', 'Not a room participant'); END IF;

  INSERT INTO match_results (room_id, mode, winner_team, team1_score, team2_score, team1_saves, team2_saves, snitch_team)
  VALUES (v_room.id, v_room.mode, p_winner_team, p_team1_score, p_team2_score, p_team1_saves, p_team2_saves, p_snitch_team)
  ON CONFLICT (room_id) DO NOTHING RETURNING room_id INTO v_inserted;
  IF v_inserted IS NULL THEN RETURN json_build_object('success', true, 'already_recorded', true); END IF;

  INSERT INTO player_game_stats (user_id, mode, matches, wins, losses, total_score, total_saves)
  SELECT tm.user_id, v_room.mode, 1,
         CASE WHEN t.team_number = p_winner_team THEN 1 ELSE 0 END,
         CASE WHEN t.team_number = p_winner_team THEN 0 ELSE 1 END,
         CASE WHEN t.team_number = 1 THEN p_team1_score ELSE p_team2_score END,
         CASE WHEN t.team_number = 1 THEN p_team1_saves ELSE p_team2_saves END
  FROM team_members tm JOIN teams t ON t.id = tm.team_id
  WHERE t.room_id = v_room.id
  ON CONFLICT (user_id, mode) DO UPDATE SET
    matches = player_game_stats.matches + EXCLUDED.matches,
    wins = player_game_stats.wins + EXCLUDED.wins,
    losses = player_game_stats.losses + EXCLUDED.losses,
    total_score = player_game_stats.total_score + EXCLUDED.total_score,
    total_saves = player_game_stats.total_saves + EXCLUDED.total_saves,
    updated_at = timezone('utc', now());

  PERFORM evaluate_game_achievements(tm.user_id)
  FROM team_members tm JOIN teams t ON t.id = tm.team_id
  WHERE t.room_id = v_room.id;

  IF p_snitch_team IS NOT NULL THEN
    PERFORM unlock_achievement(tm.user_id, 'Golden Seeker')
    FROM team_members tm JOIN teams t ON t.id = tm.team_id
    WHERE t.room_id = v_room.id AND t.team_number = p_snitch_team
      AND (v_room.mode = 'solo' OR tm.position = 'seeker');
  END IF;

  -- Recheck the collection achievement after any Snitch award.
  PERFORM evaluate_game_achievements(tm.user_id)
  FROM team_members tm JOIN teams t ON t.id = tm.team_id
  WHERE t.room_id = v_room.id;

  UPDATE rooms SET status = 'finished', updated_at = timezone('utc', now()) WHERE id = v_room.id;
  RETURN json_build_object('success', true, 'already_recorded', false);
END;
$$;

GRANT EXECUTE ON FUNCTION record_match_result(TEXT, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER) TO authenticated;
REVOKE ALL ON FUNCTION unlock_achievement(UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION evaluate_game_achievements(UUID) FROM PUBLIC;
