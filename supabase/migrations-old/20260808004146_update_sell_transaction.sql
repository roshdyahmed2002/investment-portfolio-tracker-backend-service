create or replace function public.create_sell_transaction(
    p_user_id uuid,
    p_instrument_id bigint,
    p_units numeric,
    p_price numeric,
    p_txn_date date
)
returns void
language plpgsql
security invoker
as $$
declare
    v_old_units numeric;
    v_avg_buy_cost numeric;
    v_old_realized_pl numeric;
    v_new_units numeric;
    v_realized_pl numeric;
begin

    if p_units <= 0 then
        raise exception 'Units must be greater than zero';
    end if;

    if p_price <= 0 then
        raise exception 'Price must be greater than zero';
    end if;

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

    if not found then
        raise exception 'Instrument not found';
    end if;

    if p_units > v_old_units then
        raise exception 'Insufficient units to sell';
    end if;

    v_new_units := v_old_units - p_units;

    v_realized_pl :=
        v_old_realized_pl
        + (p_units * (p_price - v_avg_buy_cost));

    insert into public.transactions (
        user_id,
        instrument_id,
        action,
        txn_date,
        units,
        price
    )
    values (
        p_user_id,
        p_instrument_id,
        'Sell',
        p_txn_date,
        p_units,
        p_price
    );

    update public.instruments
    set
        units_held = v_new_units,
        avg_buy_cost = case
            when v_new_units = 0 then 0
            else v_avg_buy_cost
        end,
        realized_pl = v_realized_pl
    where id = p_instrument_id
      and user_id = p_user_id;

end;
$$;