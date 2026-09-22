-- Create teams table
CREATE TABLE teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE NOT NULL,
  team_number INTEGER NOT NULL CHECK (team_number IN (1, 2)),
  captain_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ready BOOLEAN DEFAULT false NOT NULL,
  UNIQUE(room_id, team_number)
);

-- Enable RLS
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view teams"
  ON teams FOR SELECT
  USING (true);

CREATE POLICY "Room creator can update teams"
  ON teams FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM rooms r WHERE r.id = teams.room_id AND r.creator_id = auth.uid()
    )
  );

-- Index for team lookups
CREATE INDEX idx_teams_room_id ON teams(room_id);
CREATE INDEX idx_teams_captain_id ON teams(captain_id);

-- Enable realtime for teams
ALTER PUBLICATION supabase_realtime ADD TABLE teams;
