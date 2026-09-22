-- PostgREST caches exposed function signatures. Reload it after adding the
-- seven-argument record_match_result RPC in migration 014 so Supabase clients
-- can call the function immediately after migrations are applied.
NOTIFY pgrst, 'reload schema';
