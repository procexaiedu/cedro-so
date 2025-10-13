-- Fix permissions for cedro schema
-- Based on Supabase documentation: https://supabase.com/docs/guides/api/using-custom-schemas

-- Grant usage on the cedro schema to all API roles
GRANT USAGE ON SCHEMA cedro TO anon, authenticated, service_role;

-- Grant all privileges on all tables in cedro schema
GRANT ALL ON ALL TABLES IN SCHEMA cedro TO anon, authenticated, service_role;

-- Grant all privileges on all routines (functions) in cedro schema
GRANT ALL ON ALL ROUTINES IN SCHEMA cedro TO anon, authenticated, service_role;

-- Grant all privileges on all sequences in cedro schema
GRANT ALL ON ALL SEQUENCES IN SCHEMA cedro TO anon, authenticated, service_role;

-- Set default privileges for future objects created by postgres role
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA cedro GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA cedro GRANT ALL ON ROUTINES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA cedro GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

-- Verify permissions (optional - for debugging)
-- SELECT 
--   schemaname,
--   tablename,
--   grantor,
--   grantee,
--   privilege_type
-- FROM information_schema.table_privileges 
-- WHERE schemaname = 'cedro'
-- ORDER BY tablename, grantee;