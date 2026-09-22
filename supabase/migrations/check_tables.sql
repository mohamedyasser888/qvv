-- Check which tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'achievements', 'user_achievements', 'rooms', 'teams', 'team_members')
ORDER BY table_name;
