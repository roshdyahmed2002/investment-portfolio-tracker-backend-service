revoke all on schema "public" from "anon";

grant usage on schema "public" to "anon";

revoke all on schema "public" from "authenticated";

grant usage on schema "public" to "authenticated";

revoke all on schema "public" from "pg_database_owner";

revoke all on schema "public" from "postgres";

grant create, usage on schema "public" to "postgres";

revoke all on schema "public" from "service_role";

grant usage on schema "public" to "service_role";
