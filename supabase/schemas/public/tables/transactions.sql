create table "public"."transactions" (
  "id"                    bigint                   generated always as identity not null,
  "user_id"               uuid                     not null,
  "instrument_id"         bigint                   not null,
  "txn_date"              date                     not null,
  "units"                 numeric,
  "price"                 numeric,
  "dividend_cash"         numeric,
  "created_at"            timestamp with time zone not null default now(),
  "dividend_shares_ratio" numeric,
  "realized_pl"           numeric                  not null default 0,
  constraint "transactions_instrument_id_fkey" foreign key (instrument_id) references public.instruments(id) on delete cascade,
  constraint "transactions_pkey" primary key (id),
  constraint "transactions_user_id_fkey" foreign key (user_id) references auth.users(id) on delete cascade
);

alter table "public"."transactions"
  add column "action" public.transaction_action not null;

create index idx_transactions_instrument_date on public.transactions using btree (instrument_id, txn_date, id);

create index idx_transactions_user on public.transactions using btree (user_id);
