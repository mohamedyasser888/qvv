-- Results are written by a SECURITY DEFINER RPC. Guard the table itself so
-- future callers cannot record a result before a live match is finished.
DO $$
BEGIN
  ALTER TABLE match_results
    ADD CONSTRAINT match_results_nonnegative_scores
    CHECK (team1_score >= 0 AND team2_score >= 0 AND team1_saves >= 0 AND team2_saves >= 0) NOT VALID;
EXCEPTION WHEN duplicate_object THEN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION guard_match_result()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_room rooms%ROWTYPE;
BEGIN
  SELECT * INTO v_room FROM rooms WHERE id = NEW.room_id;
  IF NOT FOUND OR v_room.status <> 'playing' THEN
    RAISE EXCEPTION 'A result can only be recorded for an active match';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM teams t JOIN team_members tm ON tm.team_id = t.id
    WHERE t.room_id = NEW.room_id
      AND tm.user_id = auth.uid()
      AND (v_room.mode = 'solo' OR t.captain_id = auth.uid())
  ) THEN
    RAISE EXCEPTION 'Only a match captain can record the result';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_match_result ON match_results;
CREATE TRIGGER protect_match_result
  BEFORE INSERT ON match_results
  FOR EACH ROW EXECUTE FUNCTION guard_match_result();

NOTIFY pgrst, 'reload schema';
