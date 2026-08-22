create or replace function public.create_dividend_shares_transaction(
    p_user_id uuid,
    p_instrument_id bigint,
    p_dividend_shares_ratio numeric,
    p_txn_date date
)
returns void
language plpgsql
security invoker
as $$
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

    -- Calculate the number of free shares received
    v_new_shares :=
        v_old_units * p_dividend_shares_ratio;

    -- Calculate the new total units
    v_new_units :=
        v_old_units + v_new_shares;

    -- Calculate the new average buy cost
    v_new_avg_buy_cost :=
        (v_old_units * v_old_avg_buy_cost)
        / v_new_units;

    -- Insert the dividend shares transaction
    insert into public.transactions (
        user_id,
        instrument_id,
        action,
        txn_date,
        dividend_shares_ratio
    )
    values (
        p_user_id,
        p_instrument_id,
        'Dividend Shares',
        p_txn_date,
        p_dividend_shares_ratio
    );

    -- Update instrument summary
    update public.instruments
    set
        units_held = v_new_units,
        avg_buy_cost = v_new_avg_buy_cost
    where id = p_instrument_id
      and user_id = p_user_id;

end;
$$;