CREATE POLICY "Anyone can claim empty team captain"
  ON teams FOR UPDATE
  TO authenticated
  USING (captain_id IS NULL)
  WITH CHECK (captain_id = auth.uid());
