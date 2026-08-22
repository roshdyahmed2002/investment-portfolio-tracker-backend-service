alter default privileges for role "postgres" in schema "public" revoke all on sequences from "anon";

alter default privileges for role "postgres" in schema "public" revoke all on sequences from "authenticated";

alter default privileges for role "postgres" in schema "public" revoke all on sequences from "service_role";

alter default privileges for role "postgres" in schema "public" grant execute on FUNCTIONS to public;

alter default privileges for role "postgres" in schema "public" revoke all on tables from "anon";

alter default privileges for role "postgres" in schema "public" revoke all on tables from "authenticated";

alter default privileges for role "postgres" in schema "public" revoke all on tables from "service_role";

revoke all on schema "public" from public;

revoke all on schema "public" from "pg_database_owner";

revoke all on table "public"."categories" from "anon";

revoke all on table "public"."categories" from "authenticated";

revoke all on table "public"."instruments" from "anon";

revoke all on table "public"."instruments" from "authenticated";

revoke all on table "public"."transactions" from "anon";

revoke all on table "public"."transactions" from "authenticated";

comment on schema "public" is null;

revoke all on schema "public" from "postgres";

grant create, usage on schema "public" to "postgres";

revoke all on table "public"."categories" from "service_role";

grant delete, insert, select, update on table "public"."categories" to "service_role";

revoke all on table "public"."instruments" from "service_role";

grant delete, insert, select, update on table "public"."instruments" to "service_role";

revoke all on table "public"."transactions" from "service_role";

grant delete, insert, select, update on table "public"."transactions" to "service_role";

alter default privileges for role "postgres" in schema "public" grant select, usage on sequences to "service_role";

alter default privileges for role "postgres" in schema "public" grant delete, insert, select, update on tables to "service_role";

