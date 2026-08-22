alter default privileges for role "postgres" in schema "public" grant select, usage on sequences to "service_role";

alter default privileges for role "postgres" in schema "public" grant delete, insert, select, update on tables to "service_role";
