create table "public"."categories" (
  "id" bigint generated always as identity not null,
  "user_id" uuid references "auth"."users"("id") on delete cascade,
  "name" text not null,
  "created_at" timestamp with time zone not null default now(),

  constraint "categories_pkey" primary key ("id")
);

alter table "public"."categories"
  enable row level security;

grant delete, insert, maintain, references, select, trigger, truncate, update
on table "public"."categories" to "postgres";

grant delete, insert, select, update
on table "public"."categories" to "service_role";

create unique index "categories_system_name_unique"
on "public"."categories" ("name")
where "user_id" is null;

create unique index "categories_user_name_unique"
on "public"."categories" ("user_id", "name")
where "user_id" is not null;