alter table "public"."categories"
  drop constraint "categories_name_key";

alter table "public"."categories"
  add column "user_id" uuid;

alter table "public"."categories"
  add constraint "categories_user_id_fkey" foreign key (user_id) references auth.users(id) on delete cascade;

create unique index categories_system_name_unique on public.categories using btree (name)
  where (user_id is null);

create unique index categories_user_name_unique on public.categories using btree (user_id, name)
  where (user_id is not null);
