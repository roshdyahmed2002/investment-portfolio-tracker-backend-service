set local check_function_bodies = off;

create or replace function public.get_portfolio_summary (
  p_user_id uuid
)
  returns table (
    portfolio_value numeric,
    total_invested  numeric,
    realized_pl     numeric
  )
  language sql
  AS $function$
  select
    coalesce(sum(units_held * current_price), 0) as portfolio_value,
    coalesce(sum(units_held * avg_buy_cost), 0) as total_invested,
    coalesce(sum(realized_pl), 0) as realized_pl
  from public.instruments
  where user_id = p_user_id;
$function$;

create or replace function public.rls_auto_enable()
  returns event_trigger
  language plpgsql
  security definer
  set search_path to 'pg_catalog'
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
$function$;

create or replace function public.update_current_prices (
  p_user_id uuid,
  p_prices  jsonb
)
  returns void
  language sql
  AS $function$
  update public.instruments AS i
  set current_price = v.current_price
  from jsonb_to_recordset(p_prices) as v(
    id bigint,
    current_price numeric
  )
  where i.id = v.id
    and i.user_id = p_user_id;
$function$;

revoke all on function "public"."get_portfolio_summary"(uuid) from public;

grant execute on function "public"."get_portfolio_summary"(uuid) to "postgres", "service_role";

revoke all on function "public"."update_current_prices"(uuid, jsonb) from public;

grant execute on function "public"."update_current_prices"(uuid, jsonb) to "postgres", "service_role";
