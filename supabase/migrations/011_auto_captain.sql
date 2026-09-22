CREATE OR REPLACE FUNCTION auto_assign_captain()
RETURNS TRIGGER AS \$\$
DECLARE
  current_captain UUID;
BEGIN
  -- Get the current captain of the team
  SELECT captain_id INTO current_captain FROM teams WHERE id = NEW.team_id;
  
  -- If there is no captain, make this new member the captain!
  IF current_captain IS NULL THEN
    UPDATE teams SET captain_id = NEW.user_id WHERE id = NEW.team_id;
  END IF;
  
  RETURN NEW;
END;
\$\$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_auto_assign_captain ON team_members;
CREATE TRIGGER trigger_auto_assign_captain
  AFTER INSERT ON team_members
  FOR EACH ROW
  EXECUTE FUNCTION auto_assign_captain();
