create table
  "public"."instruments" (
    "id" bigint generated always as identity not null,
    "user_id" uuid not null,
    "category_id" bigint not null,
    "name" text not null,
    "units_held" numeric not null default 0,
    "avg_buy_cost" numeric not null default 0,
    "realized_pl" numeric not null default 0,
    "created_at" timestamp
    with
      time zone not null default now (),
      constraint "instruments_category_id_fkey" foreign key (category_id) references public.categories (id) on delete cascade,
      constraint "instruments_pkey" primary key (id),
      constraint "instruments_user_id_fkey" foreign key (user_id) references auth.users (id) on delete cascade,
      constraint "instruments_user_id_name_key" unique (user_id, name)
  );

create index idx_instruments_user on public.instruments using btree (user_id);