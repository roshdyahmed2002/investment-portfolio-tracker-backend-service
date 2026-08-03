-- Migration unit 1: schema_changes
-- Transaction mode: transactional
-- Boundary reason: default

SET check_function_bodies = false;

DROP EXTENSION pg_net;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE UPDATE ON SEQUENCES FROM anon;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE UPDATE ON SEQUENCES FROM authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE UPDATE ON SEQUENCES FROM service_role;

CREATE FUNCTION public.rls_auto_enable()
  RETURNS event_trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'pg_catalog'
  AS $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$;

CREATE TABLE public.instruments (
  id          bigint                   GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id     uuid                     DEFAULT auth.uid(),
  category    text                     NOT NULL,
  name        text                     NOT NULL,
  created_at  timestamp with time zone DEFAULT now(),
  units_held  numeric                  DEFAULT 0,
  avg_cost    numeric                  DEFAULT 0,
  realized_pl numeric                  DEFAULT 0
);

ALTER TABLE public.instruments
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.instruments
  ADD CONSTRAINT instruments_category_check CHECK (category = ANY (ARRAY['mutual_fund'::text, 'stock'::text, 'metal'::text]));

ALTER TABLE public.instruments
  ADD CONSTRAINT instruments_pkey PRIMARY KEY (id);

ALTER TABLE public.instruments
  ADD CONSTRAINT instruments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.instruments TO anon;

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.instruments TO authenticated;

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.instruments TO service_role;

CREATE TABLE public.transactions (
  id            bigint                   GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id       uuid                     DEFAULT auth.uid(),
  instrument_id bigint,
  action        text                     NOT NULL,
  txn_date      date                     NOT NULL,
  units         numeric,
  price         numeric,
  cash_amount   numeric,
  created_at    timestamp with time zone DEFAULT now()
);

ALTER TABLE public.transactions
  ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.transactions
  ADD CONSTRAINT transactions_action_check CHECK (action = ANY (ARRAY['Buy'::text, 'Sell'::text, 'Dividend Cash'::text, 'Dividend Shares'::text]));

ALTER TABLE public.transactions
  ADD CONSTRAINT transactions_instrument_id_fkey FOREIGN KEY (instrument_id) REFERENCES public.instruments(id) ON DELETE CASCADE;

ALTER TABLE public.transactions
  ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);

ALTER TABLE public.transactions
  ADD CONSTRAINT transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.transactions TO anon;

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.transactions TO authenticated;

GRANT MAINTAIN, REFERENCES, TRIGGER, TRUNCATE ON public.transactions TO service_role;

CREATE INDEX idx_transactions_instrument_date ON public.transactions (instrument_id, txn_date, id);

CREATE EVENT TRIGGER ensure_rls
  ON ddl_command_end
  WHEN TAG IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
  EXECUTE FUNCTION public.rls_auto_enable();
