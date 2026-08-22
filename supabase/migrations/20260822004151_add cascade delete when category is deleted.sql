alter table "public"."instruments"
  drop constraint "instruments_category_id_fkey";

alter table "public"."instruments"
  add constraint "instruments_category_id_fkey" foreign key (category_id) references public.categories(id) on delete cascade;
