-- Realtime broadcasts are a server-enforced boundary: anyone with a valid
-- room code may subscribe to watch, but only a team member may publish a game
-- action. This prevents spectator clients from changing match state even when
-- they bypass the interface.
DROP POLICY IF EXISTS "Authenticated users can watch Quidditch game broadcasts" ON realtime.messages;
CREATE POLICY "Authenticated users can watch Quidditch game broadcasts"
ON realtime.messages FOR SELECT TO authenticated
USING (
  realtime.topic() LIKE 'game:%'
  AND EXISTS (
    SELECT 1 FROM rooms r
    WHERE r.room_code = upper(split_part(realtime.topic(), ':', 2))
  )
);

DROP POLICY IF EXISTS "Only team members can publish Quidditch game broadcasts" ON realtime.messages;
CREATE POLICY "Only team members can publish Quidditch game broadcasts"
ON realtime.messages FOR INSERT TO authenticated
WITH CHECK (
  realtime.topic() LIKE 'game:%'
  AND EXISTS (
    SELECT 1
    FROM rooms r
    JOIN teams t ON t.room_id = r.id
    JOIN team_members tm ON tm.team_id = t.id
    WHERE r.room_code = upper(split_part(realtime.topic(), ':', 2))
      AND tm.user_id = auth.uid()
  )
);
