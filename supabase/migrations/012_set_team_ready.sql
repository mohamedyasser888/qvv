-- Migration 012: Add set_team_ready RPC function
-- Allows any team member to mark their team as ready (bypasses RLS safely)

CREATE OR REPLACE FUNCTION set_team_ready(p_team_id UUID, p_name TEXT)
RETURNS JSONB AS $$
DECLARE
  v_room_mode TEXT;
  v_member_count INTEGER;
  v_required INTEGER;
  v_is_member BOOLEAN;
BEGIN
  -- Verify the caller is a member of this team
  SELECT EXISTS (
    SELECT 1 FROM team_members
    WHERE team_id = p_team_id AND user_id = auth.uid()
  ) INTO v_is_member;

  IF NOT v_is_member THEN
    RETURN jsonb_build_object('success', false, 'error', 'You are not a member of this team.');
  END IF;

  -- Get the room mode
  SELECT r.mode INTO v_room_mode
  FROM teams t
  JOIN rooms r ON r.id = t.room_id
  WHERE t.id = p_team_id;

  -- Count current members
  SELECT COUNT(*) INTO v_member_count
  FROM team_members
  WHERE team_id = p_team_id;

  -- Determine required player count
  IF v_room_mode = 'solo' THEN
    v_required := 1;
  ELSE
    v_required := 7;
  END IF;

  IF v_member_count < v_required THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Your team must have ' || v_required || ' player(s) before confirming.'
    );
  END IF;

  -- Validate name
  IF p_name IS NULL OR TRIM(p_name) = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Please enter a team name before confirming.');
  END IF;

  -- Ensure team has a captain (auto-fix if missing)
  UPDATE teams
  SET
    ready    = true,
    name     = TRIM(p_name),
    captain_id = COALESCE(captain_id, auth.uid())
  WHERE id = p_team_id;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION set_team_ready(UUID, TEXT) TO authenticated;
