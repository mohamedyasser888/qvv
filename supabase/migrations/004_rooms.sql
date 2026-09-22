-- Create rooms table
CREATE TABLE rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_code TEXT NOT NULL UNIQUE,
  mode TEXT NOT NULL CHECK (mode IN ('solo', 'team')),
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'ready', 'playing', 'finished')),
  creator_id UUID REFERENCES profiles(id) ON DELETE SET NULL NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (TIMEZONE('utc', NOW()) + INTERVAL '1 hour')
);

-- Enable RLS
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view rooms"
  ON rooms FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create rooms"
  ON rooms FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Room creator can update their room"
  ON rooms FOR UPDATE
  USING (auth.uid() = creator_id);

-- Index for room code lookup
CREATE INDEX idx_rooms_room_code ON rooms(room_code);
CREATE INDEX idx_rooms_status ON rooms(status);
CREATE INDEX idx_rooms_mode ON rooms(mode);

-- Enable realtime for rooms
ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
