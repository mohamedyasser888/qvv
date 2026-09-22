-- Create team_members table
CREATE TABLE team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  position TEXT CHECK (position IN ('keeper', 'chaser', 'beater', 'seeker')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  confirmed BOOLEAN DEFAULT false NOT NULL,
  UNIQUE(team_id, user_id),
  CONSTRAINT unique_position_per_team UNIQUE (team_id, position)
);

-- Enable RLS
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view team members"
  ON team_members FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own team membership"
  ON team_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own team membership"
  ON team_members FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Captains can update their team members"
  ON team_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM teams t
      WHERE t.id = team_members.team_id AND t.captain_id = auth.uid()
    )
  );

-- Index for team member lookups
CREATE INDEX idx_team_members_team_id ON team_members(team_id);
CREATE INDEX idx_team_members_user_id ON team_members(user_id);
CREATE INDEX idx_team_members_position ON team_members(team_id, position);

-- Enable realtime for team_members
ALTER PUBLICATION supabase_realtime ADD TABLE team_members;

-- Function to check if position is available
CREATE OR REPLACE FUNCTION is_position_available(p_team_id UUID, p_position TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM team_members 
    WHERE team_id = p_team_id AND position = p_position
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to safely claim a position
CREATE OR REPLACE FUNCTION claim_position(
  p_team_id UUID,
  p_user_id UUID,
  p_position TEXT
)
RETURNS JSON AS $$
DECLARE
  v_available BOOLEAN;
  v_member_count INTEGER;
BEGIN
  -- Check if position is available
  SELECT is_position_available(p_team_id, p_position) INTO v_available;
  
  IF NOT v_available THEN
    RETURN json_build_object('success', false, 'error', 'Position already taken');
  END IF;
  
  -- Check team capacity
  SELECT COUNT(*) INTO v_member_count FROM team_members WHERE team_id = p_team_id;
  
  IF v_member_count >= 7 THEN
    RETURN json_build_object('success', false, 'error', 'Team is full');
  END IF;
  
  -- Insert the team member
  INSERT INTO team_members (team_id, user_id, position, confirmed)
  VALUES (p_team_id, p_user_id, p_position, true);
  
  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add missing RLS policy for teams (now that team_members exists)
DROP POLICY IF EXISTS "Room creator can update teams" ON teams;
CREATE POLICY "Room participants can update teams"
  ON teams FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      JOIN rooms r ON r.id = teams.room_id
      WHERE tm.team_id = teams.id AND tm.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM rooms r WHERE r.id = teams.room_id AND r.creator_id = auth.uid()
    )
  );
