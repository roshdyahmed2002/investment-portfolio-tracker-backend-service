-- ============================================================
-- ACCESS CONTROL — single source of truth for all privileges
-- and row-level security, current and future.
-- Must run AFTER all table/type/function creation files.
--
-- Result: only "postgres" and "service_role" can access
-- anything in the public schema. "anon" and "authenticated"
-- (and PUBLIC, which every role implicitly belongs to) have
-- zero access — no schema usage, no table/sequence/function
-- privileges, current or future.
-- ============================================================

-- ------------------------------------------------------------
-- Row Level Security — enable on every current table
-- ------------------------------------------------------------
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instruments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- Row Level Security — auto-enable on every FUTURE table
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rls_auto_enable()
RETURNS event_trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
    IF cmd.schema_name = 'public' THEN
      BEGIN
        EXECUTE format('ALTER TABLE IF EXISTS %s ENABLE ROW LEVEL SECURITY', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
    END IF;
  END LOOP;
END;
$$;

DROP EVENT TRIGGER IF EXISTS ensure_rls;
CREATE EVENT TRIGGER ensure_rls
ON ddl_command_end
WHEN TAG IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
EXECUTE FUNCTION public.rls_auto_enable();

-- ------------------------------------------------------------
-- Schema-level access
-- No one but postgres/service_role may even "see into" public
-- ------------------------------------------------------------
REVOKE ALL ON SCHEMA public FROM anon, authenticated, PUBLIC;
GRANT CREATE, USAGE ON SCHEMA public TO postgres, service_role;

-- ------------------------------------------------------------
-- Revoke everything from anon/authenticated/PUBLIC on
-- CURRENT objects
-- ------------------------------------------------------------
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated, PUBLIC;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated, PUBLIC;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon, authenticated, PUBLIC;
REVOKE ALL ON TYPE public.transaction_action FROM anon, authenticated, PUBLIC;

-- ------------------------------------------------------------
-- Grant full access to trusted roles on CURRENT objects
-- ------------------------------------------------------------
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, service_role;
GRANT USAGE ON TYPE public.transaction_action TO postgres, service_role;

-- ------------------------------------------------------------
-- Lock in the same behavior for anything created in the
-- FUTURE (tables, sequences, functions, types)
-- ------------------------------------------------------------
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON TABLES FROM anon, authenticated, PUBLIC;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON SEQUENCES FROM anon, authenticated, PUBLIC;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON FUNCTIONS FROM anon, authenticated, PUBLIC;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON TYPES FROM anon, authenticated, PUBLIC;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT ALL ON TABLES TO postgres, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT ALL ON SEQUENCES TO postgres, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT ALL ON FUNCTIONS TO postgres, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT USAGE ON TYPES TO postgres, service_role;