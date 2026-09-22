-- Fix the match result guard to allow recording when status is 'playing' or 'finished'
-- This prevents race conditions where the status might be updated before the trigger fires

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
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Room not found';
  END IF;
  -- Allow recording if status is 'playing' or 'finished' (handles race conditions)
  IF v_room.status NOT IN ('playing', 'finished') THEN
    RAISE EXCEPTION 'A result can only be recorded for an active or finished match (current status: %)', v_room.status;
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
