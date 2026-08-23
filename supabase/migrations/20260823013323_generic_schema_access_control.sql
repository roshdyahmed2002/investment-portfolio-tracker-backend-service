set local check_function_bodies = off;

alter default privileges for role "postgres" in schema "public" revoke all on sequences from "anon";

alter default privileges for role "postgres" in schema "public" revoke all on sequences from "authenticated";

alter default privileges for role "postgres" in schema "public" revoke all on tables from "anon";

alter default privileges for role "postgres" in schema "public" revoke all on tables from "authenticated";

revoke all on schema "public" from public;

revoke all on schema "public" from "anon";

revoke all on schema "public" from "authenticated";

revoke all on table "public"."categories" from "anon";

revoke all on table "public"."categories" from "authenticated";

revoke all on table "public"."instruments" from "anon";

revoke all on table "public"."instruments" from "authenticated";

revoke all on table "public"."transactions" from "anon";

revoke all on table "public"."transactions" from "authenticated";

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

create event trigger "ensure_rls"
  on ddl_command_end
  when tag in ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
  execute function "public"."rls_auto_enable"();

revoke all on function "public"."create_buy_transaction"(uuid, bigint, numeric, numeric, date) from public;

revoke all on function "public"."create_buy_transaction"(uuid, bigint, numeric, numeric, date) from "service_role";

grant execute on function "public"."create_buy_transaction"(uuid, bigint, numeric, numeric, date) to "service_role";

revoke all on function "public"."create_dividend_cash_transaction"(uuid, bigint, numeric, date) from public;

revoke all on function "public"."create_dividend_cash_transaction"(uuid, bigint, numeric, date) from "service_role";

grant execute on function "public"."create_dividend_cash_transaction"(uuid, bigint, numeric, date) to "service_role";

revoke all on function "public"."create_dividend_shares_transaction"(uuid, bigint, numeric, date) from public;

revoke all on function "public"."create_dividend_shares_transaction"(uuid, bigint, numeric, date) from "service_role";

grant execute on function "public"."create_dividend_shares_transaction"(uuid, bigint, numeric, date) to "service_role";

revoke all on function "public"."create_sell_transaction"(uuid, bigint, numeric, numeric, date) from public;

revoke all on function "public"."create_sell_transaction"(uuid, bigint, numeric, numeric, date) from "service_role";

grant execute on function "public"."create_sell_transaction"(uuid, bigint, numeric, numeric, date) to "service_role";

revoke all on function "public"."delete_transaction"(uuid, bigint) from public;

revoke all on function "public"."delete_transaction"(uuid, bigint) from "service_role";

grant execute on function "public"."delete_transaction"(uuid, bigint) to "service_role";

revoke all on function "public"."recalculate_instrument"(uuid, bigint) from public;

revoke all on function "public"."recalculate_instrument"(uuid, bigint) from "service_role";

grant execute on function "public"."recalculate_instrument"(uuid, bigint) to "service_role";

revoke all on function "public"."rls_auto_enable"() from public;

grant execute on function "public"."rls_auto_enable"() to "postgres", "service_role";

revoke all on function "public"."update_transaction"(uuid, bigint, bigint, public.transaction_action, numeric, numeric, numeric, numeric, date) from public;

revoke all on function "public"."update_transaction"(uuid, bigint, bigint, public.transaction_action, numeric, numeric, numeric, numeric, date) from "service_role";

grant execute on function "public"."update_transaction"(uuid, bigint, bigint, public.transaction_action, numeric, numeric, numeric, numeric, date) to "service_role";

revoke all on schema "public" from "pg_database_owner";

grant create, usage on schema "public" to "pg_database_owner";

revoke all on schema "public" from "service_role";

grant create, usage on schema "public" to "service_role";

revoke all on type "public"."transaction_action" from public;

revoke all on type "public"."transaction_action" from "service_role";

grant usage on type "public"."transaction_action" to "service_role";

alter default privileges for role "postgres" in schema "public" revoke all on types from public;

alter default privileges for role "postgres" in schema "public" grant usage on types to "service_role";

alter default privileges for role "postgres" in schema "public" grant execute on FUNCTIONS to "service_role";
