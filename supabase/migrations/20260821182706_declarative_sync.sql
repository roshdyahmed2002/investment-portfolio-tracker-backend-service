set local check_function_bodies = off;

alter default privileges for role "postgres" in schema "public" revoke all on sequences from "service_role";

alter default privileges for role "postgres" in schema "public" revoke all on tables from "service_role";

create table "public"."categories" (
  "id"         bigint                   generated always as identity not null,
  "name"       text                     not null,
  "created_at" timestamp with time zone not null default now(),
  constraint "categories_name_key" unique (name),
  constraint "categories_pkey" primary key (id)
);

alter table "public"."categories"
  enable row level security;

create table "public"."instruments" (
  "id"           bigint                   generated always as identity not null,
  "user_id"      uuid                     not null,
  "category_id"  bigint                   not null,
  "name"         text                     not null,
  "units_held"   numeric                  not null default 0,
  "avg_buy_cost" numeric                  not null default 0,
  "realized_pl"  numeric                  not null default 0,
  "created_at"   timestamp with time zone not null default now(),
  constraint "instruments_pkey" primary key (id),
  constraint "instruments_user_id_name_key" unique (user_id, name)
);

alter table "public"."instruments"
  enable row level security;

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
  constraint "transactions_pkey" primary key (id)
);

alter table "public"."transactions"
  enable row level security;

create type "public"."transaction_action" as enum (
  'Buy',
  'Sell',
  'Dividend Cash',
  'Dividend Shares'
);

alter table "public"."transactions"
  add column "action" public.transaction_action not null;

create or replace function public.create_buy_transaction (
  p_user_id       uuid,
  p_instrument_id bigint,
  p_units         numeric,
  p_price         numeric,
  p_txn_date      date
)
  returns void
  language plpgsql
  AS $function$
declare
    v_old_units numeric;
    v_old_avg_buy_cost numeric;
    v_new_units numeric;
    v_new_avg_buy_cost numeric;
begin

    -- Validate input
    if p_units <= 0 then
        raise exception 'Units must be greater than zero';
    end if;

    if p_price <= 0 then
        raise exception 'Price must be greater than zero';
    end if;

    -- Get the instrument and lock its row
    select
        units_held,
        avg_buy_cost
    into
        v_old_units,
        v_old_avg_buy_cost
    from public.instruments
    where id = p_instrument_id
      and user_id = p_user_id
    for update;

    -- Make sure the instrument exists and belongs to the user
    if not found then
        raise exception 'Instrument not found';
    end if;

    -- Calculate new number of units
    v_new_units := v_old_units + p_units;

    -- Calculate new weighted average buy cost
    v_new_avg_buy_cost :=
        (
            (v_old_units * v_old_avg_buy_cost)
            + (p_units * p_price)
        )
        / v_new_units;

    -- Insert transaction
    insert into public.transactions (
        user_id,
        instrument_id,
        action,
        txn_date,
        units,
        price,
        realized_pl
    )
    values (
        p_user_id,
        p_instrument_id,
        'Buy',
        p_txn_date,
        p_units,
        p_price,
        0
    );

    -- Update instrument summary
    update public.instruments
    set
        units_held = v_new_units,
        avg_buy_cost = v_new_avg_buy_cost
    where id = p_instrument_id
      and user_id = p_user_id;

end;
$function$;

create or replace function public.create_dividend_cash_transaction (
  p_user_id       uuid,
  p_instrument_id bigint,
  p_dividend_cash numeric,
  p_txn_date      date
)
  returns void
  language plpgsql
  AS $function$
declare
    v_old_realized_pl numeric;
begin

    -- Validate input
    if p_dividend_cash <= 0 then
        raise exception 'Dividend cash must be greater than zero';
    end if;

    -- Get the current realized P/L and lock the instrument row
    select
        realized_pl
    into
        v_old_realized_pl
    from public.instruments
    where id = p_instrument_id
      and user_id = p_user_id
    for update;

    -- Make sure the instrument exists and belongs to the user
    if not found then
        raise exception 'Instrument not found';
    end if;

    -- Insert the dividend cash transaction
    insert into public.transactions (
        user_id,
        instrument_id,
        action,
        txn_date,
        dividend_cash,
        realized_pl
    )
    values (
        p_user_id,
        p_instrument_id,
        'Dividend Cash',
        p_txn_date,
        p_dividend_cash,
        p_dividend_cash
    );

    -- Add dividend cash to instrument realized P/L
    update public.instruments
    set
        realized_pl = v_old_realized_pl + p_dividend_cash
    where id = p_instrument_id
      and user_id = p_user_id;

end;
$function$;

create or replace function public.create_dividend_shares_transaction (
  p_user_id               uuid,
  p_instrument_id         bigint,
  p_dividend_shares_ratio numeric,
  p_txn_date              date
)
  returns void
  language plpgsql
  AS $function$
declare
    v_old_units numeric;
    v_old_avg_buy_cost numeric;
    v_new_units numeric;
    v_new_avg_buy_cost numeric;
    v_new_shares numeric;
begin

    -- Validate input
    if p_dividend_shares_ratio <= 0 then
        raise exception 'Dividend shares ratio must be greater than zero';
    end if;

    -- Get the current instrument values and lock the row
    select
        units_held,
        avg_buy_cost
    into
        v_old_units,
        v_old_avg_buy_cost
    from public.instruments
    where id = p_instrument_id
      and user_id = p_user_id
    for update;

    -- Make sure the instrument exists and belongs to the user
    if not found then
        raise exception 'Instrument not found';
    end if;

    -- Make sure the user currently owns units
    if v_old_units <= 0 then
        raise exception 'No units available for dividend shares';
    end if;

    -- Calculate the number of free shares received
    v_new_shares :=
        v_old_units * p_dividend_shares_ratio;

    -- Calculate the new total units
    v_new_units :=
        v_old_units + v_new_shares;

    -- Calculate the new average buy cost
    -- Total cost basis stays unchanged while units increase
    v_new_avg_buy_cost :=
        (v_old_units * v_old_avg_buy_cost)
        / v_new_units;

    -- Insert dividend shares transaction
    insert into public.transactions (
        user_id,
        instrument_id,
        action,
        txn_date,
        dividend_shares_ratio,
        realized_pl
    )
    values (
        p_user_id,
        p_instrument_id,
        'Dividend Shares',
        p_txn_date,
        p_dividend_shares_ratio,
        0
    );

    -- Update instrument summary
    update public.instruments
    set
        units_held = v_new_units,
        avg_buy_cost = v_new_avg_buy_cost
    where id = p_instrument_id
      and user_id = p_user_id;

end;
$function$;

create or replace function public.create_sell_transaction (
  p_user_id       uuid,
  p_instrument_id bigint,
  p_units         numeric,
  p_price         numeric,
  p_txn_date      date
)
  returns void
  language plpgsql
  AS $function$
declare
    v_old_units numeric;
    v_avg_buy_cost numeric;
    v_old_realized_pl numeric;
    v_new_units numeric;

    -- Realized P/L generated by THIS sell transaction
    v_transaction_realized_pl numeric;

    -- New cumulative realized P/L on the instrument
    v_new_realized_pl numeric;
begin

    -- Validate input
    if p_units <= 0 then
        raise exception 'Units must be greater than zero';
    end if;

    if p_price <= 0 then
        raise exception 'Price must be greater than zero';
    end if;

    -- Get the instrument and lock its row
    select
        units_held,
        avg_buy_cost,
        realized_pl
    into
        v_old_units,
        v_avg_buy_cost,
        v_old_realized_pl
    from public.instruments
    where id = p_instrument_id
      and user_id = p_user_id
    for update;

    -- Make sure the instrument exists and belongs to the user
    if not found then
        raise exception 'Instrument not found';
    end if;

    -- Make sure the user owns enough units
    if p_units > v_old_units then
        raise exception 'Insufficient units to sell';
    end if;

    -- Calculate new units
    v_new_units := v_old_units - p_units;

    -- Calculate realized P/L generated by THIS transaction
    v_transaction_realized_pl :=
        p_units * (p_price - v_avg_buy_cost);

    -- Calculate new cumulative instrument realized P/L
    v_new_realized_pl :=
        v_old_realized_pl + v_transaction_realized_pl;

    -- Insert transaction
    insert into public.transactions (
        user_id,
        instrument_id,
        action,
        txn_date,
        units,
        price,
        realized_pl
    )
    values (
        p_user_id,
        p_instrument_id,
        'Sell',
        p_txn_date,
        p_units,
        p_price,
        v_transaction_realized_pl
    );

    -- Update instrument summary
    update public.instruments
    set
        units_held = v_new_units,

        avg_buy_cost = case
            when v_new_units = 0 then 0
            else v_avg_buy_cost
        end,

        realized_pl = v_new_realized_pl

    where id = p_instrument_id
      and user_id = p_user_id;

end;
$function$;

create or replace function public.delete_transaction (
  p_user_id        uuid,
  p_transaction_id bigint
)
  returns void
  language plpgsql
  AS $function$
declare
    v_instrument_id bigint;
    v_locked_instrument_id bigint;
begin

    -- ========================================================
    -- LOCK TRANSACTION
    -- ========================================================

    select instrument_id
    into v_instrument_id
    from public.transactions
    where id = p_transaction_id
      and user_id = p_user_id
    for update;

    if not found then
        raise exception 'Transaction not found';
    end if;


    -- ========================================================
    -- LOCK INSTRUMENT
    -- ========================================================

    select id
    into v_locked_instrument_id
    from public.instruments
    where id = v_instrument_id
      and user_id = p_user_id
    for update;

    if not found then
        raise exception 'Instrument not found';
    end if;


    -- ========================================================
    -- DELETE TRANSACTION
    -- ========================================================

    delete from public.transactions
    where id = p_transaction_id
      and user_id = p_user_id;


    -- ========================================================
    -- REPLAY REMAINING TRANSACTIONS
    -- ========================================================

    perform public.recalculate_instrument(
        p_user_id,
        v_instrument_id
    );

end;
$function$;

create or replace function public.recalculate_instrument (
  p_user_id       uuid,
  p_instrument_id bigint
)
  returns void
  language plpgsql
  AS $function$
declare
    v_transaction record;

    v_units numeric := 0;
    v_avg_buy_cost numeric := 0;
    v_realized_pl numeric := 0;

    v_new_shares numeric;
    v_new_units numeric;
    v_new_avg_buy_cost numeric;
    v_transaction_realized_pl numeric;
begin

    -- ========================================================
    -- RESET INSTRUMENT STATE
    -- ========================================================

    v_units := 0;
    v_avg_buy_cost := 0;
    v_realized_pl := 0;


    -- ========================================================
    -- REPLAY ALL TRANSACTIONS IN CHRONOLOGICAL ORDER
    -- ========================================================

    for v_transaction in
        select
            id,
            action,
            units,
            price,
            dividend_cash,
            dividend_shares_ratio
        from public.transactions
        where user_id = p_user_id
          and instrument_id = p_instrument_id
        order by txn_date asc, id asc
    loop

        -- ====================================================
        -- BUY
        -- ====================================================

        if v_transaction.action = 'Buy' then

            v_units :=
                v_units + v_transaction.units;

            v_avg_buy_cost :=
                (
                    (v_units - v_transaction.units) * v_avg_buy_cost
                    + (v_transaction.units * v_transaction.price)
                )
                / v_units;

            -- Buy has no realized P/L
            update public.transactions
            set realized_pl = 0
            where id = v_transaction.id;


        -- ====================================================
        -- SELL
        -- ====================================================

        elsif v_transaction.action = 'Sell' then

            -- The edited history may make a later sell invalid
            if v_transaction.units > v_units then
                raise exception
                    'Insufficient units for transaction %',
                    v_transaction.id;
            end if;

            v_transaction_realized_pl :=
                v_transaction.units
                * (v_transaction.price - v_avg_buy_cost);

            v_units :=
                v_units - v_transaction.units;

            if v_units = 0 then
                v_avg_buy_cost := 0;
            end if;

            v_realized_pl :=
                v_realized_pl + v_transaction_realized_pl;

            -- Update the realized P/L generated by THIS sell
            update public.transactions
            set realized_pl = v_transaction_realized_pl
            where id = v_transaction.id;


        -- ====================================================
        -- DIVIDEND CASH
        -- ====================================================

        elsif v_transaction.action = 'Dividend Cash' then

            v_realized_pl :=
                v_realized_pl + v_transaction.dividend_cash;

            update public.transactions
            set realized_pl = v_transaction.dividend_cash
            where id = v_transaction.id;


        -- ====================================================
        -- DIVIDEND SHARES
        -- ====================================================

        elsif v_transaction.action = 'Dividend Shares' then

            if v_units <= 0 then
                raise exception
                    'No units available for dividend shares transaction %',
                    v_transaction.id;
            end if;

            v_new_shares :=
                v_units * v_transaction.dividend_shares_ratio;

            v_new_units :=
                v_units + v_new_shares;

            -- Total cost basis stays the same
            v_new_avg_buy_cost :=
                (v_units * v_avg_buy_cost)
                / v_new_units;

            v_units := v_new_units;
            v_avg_buy_cost := v_new_avg_buy_cost;

            update public.transactions
            set realized_pl = 0
            where id = v_transaction.id;

        end if;

    end loop;


    -- ========================================================
    -- UPDATE INSTRUMENT SUMMARY
    -- ========================================================

    update public.instruments
    set
        units_held = v_units,
        avg_buy_cost = v_avg_buy_cost,
        realized_pl = v_realized_pl
    where id = p_instrument_id
      and user_id = p_user_id;

end;
$function$;

create or replace function public.update_transaction (
  p_user_id               uuid,
  p_transaction_id        bigint,
  p_instrument_id         bigint,
  p_action                public.transaction_action,
  p_units                 numeric,
  p_price                 numeric,
  p_dividend_cash         numeric,
  p_dividend_shares_ratio numeric,
  p_txn_date              date
)
  returns void
  language plpgsql
  AS $function$
declare
    v_old_instrument_id bigint;
    v_locked_instrument_id bigint;
begin

    -- ========================================================
    -- LOCK TRANSACTION
    -- ========================================================

    select instrument_id
    into v_old_instrument_id
    from public.transactions
    where id = p_transaction_id
      and user_id = p_user_id
    for update;

    if not found then
        raise exception 'Transaction not found';
    end if;


    -- ========================================================
    -- LOCK OLD INSTRUMENT
    -- ========================================================

    select id
    into v_locked_instrument_id
    from public.instruments
    where id = v_old_instrument_id
      and user_id = p_user_id
    for update;

    if not found then
        raise exception 'Old instrument not found';
    end if;


    -- ========================================================
    -- LOCK NEW INSTRUMENT
    -- ========================================================
    -- Only needed if the transaction is being moved
    -- to another instrument.

    if p_instrument_id <> v_old_instrument_id then

        select id
        into v_locked_instrument_id
        from public.instruments
        where id = p_instrument_id
          and user_id = p_user_id
        for update;

        if not found then
            raise exception 'New instrument not found';
        end if;

    end if;


    -- ========================================================
    -- UPDATE TRANSACTION
    -- ========================================================

    update public.transactions
    set
        instrument_id = p_instrument_id,
        action = p_action,
        units = p_units,
        price = p_price,
        dividend_cash = p_dividend_cash,
        dividend_shares_ratio = p_dividend_shares_ratio,
        txn_date = p_txn_date
    where id = p_transaction_id
      and user_id = p_user_id;


    -- ========================================================
    -- REPLAY
    -- ========================================================

    if p_instrument_id = v_old_instrument_id then

        -- Same instrument → replay once
        perform public.recalculate_instrument(
            p_user_id,
            v_old_instrument_id
        );

    else

        -- Different instruments → replay both

        -- Old instrument loses the transaction
        perform public.recalculate_instrument(
            p_user_id,
            v_old_instrument_id
        );

        -- New instrument receives the transaction
        perform public.recalculate_instrument(
            p_user_id,
            p_instrument_id
        );

    end if;

end;
$function$;

alter table "public"."instruments"
  add constraint "instruments_category_id_fkey" foreign key (category_id) references public.categories(id);

alter table "public"."instruments"
  add constraint "instruments_user_id_fkey" foreign key (user_id) references auth.users(id) on delete cascade;

alter table "public"."transactions"
  add constraint "transactions_instrument_id_fkey" foreign key (instrument_id) references public.instruments(id) on delete cascade;

alter table "public"."transactions"
  add constraint "transactions_user_id_fkey" foreign key (user_id) references auth.users(id) on delete cascade;

create index idx_instruments_user on public.instruments using btree (user_id);

create index idx_transactions_instrument_date on public.transactions using btree (instrument_id, txn_date, id);

create index idx_transactions_user on public.transactions using btree (user_id);

grant execute on function "public"."create_buy_transaction"(uuid, bigint, numeric, numeric, date) to public, "postgres";

grant execute on function "public"."create_dividend_cash_transaction"(uuid, bigint, numeric, date) to public, "postgres";

grant execute on function "public"."create_dividend_shares_transaction"(uuid, bigint, numeric, date) to public, "postgres";

grant execute on function "public"."create_sell_transaction"(uuid, bigint, numeric, numeric, date) to public, "postgres";

grant execute on function "public"."delete_transaction"(uuid, bigint) to public, "postgres";

grant execute on function "public"."recalculate_instrument"(uuid, bigint) to public, "postgres";

grant execute on function "public"."update_transaction"(uuid, bigint, bigint, public.transaction_action, numeric, numeric, numeric, numeric, date) to public, "postgres";

revoke all on schema "public" from "pg_database_owner";

revoke all on schema "public" from "postgres";

grant create, usage on schema "public" to "postgres";

grant maintain, references, trigger, truncate on table "public"."categories" to "anon", "authenticated";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."categories" to "postgres", "service_role";

grant maintain, references, trigger, truncate on table "public"."instruments" to "anon", "authenticated";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."instruments" to "postgres", "service_role";

grant maintain, references, trigger, truncate on table "public"."transactions" to "anon", "authenticated";

grant delete, insert, maintain, references, select, trigger, truncate, update on table "public"."transactions" to "postgres", "service_role";

grant usage on type "public"."transaction_action" to "postgres";

alter default privileges for role "postgres" in schema "public" grant select, update, usage on sequences to "service_role";

alter default privileges for role "postgres" in schema "public" grant delete, insert, maintain, references, select, trigger, truncate, update on tables to "service_role";
