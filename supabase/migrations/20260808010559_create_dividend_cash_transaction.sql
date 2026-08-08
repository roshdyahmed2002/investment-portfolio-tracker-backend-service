create or replace function public.create_dividend_cash_transaction(
    p_user_id uuid,
    p_instrument_id bigint,
    p_dividend_cash numeric,
    p_txn_date date
)
returns void
language plpgsql
security invoker
as $$
declare
    v_old_realized_pl numeric;
begin

    -- Validate input
    if p_dividend_cash <= 0 then
        raise exception 'Dividend cash must be greater than zero';
    end if;

    -- Get the current realized P/L and lock the instrument row
    select realized_pl
    into v_old_realized_pl
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
        dividend_cash
    )
    values (
        p_user_id,
        p_instrument_id,
        'Dividend Cash',
        p_txn_date,
        p_dividend_cash
    );

    -- Add dividend cash to realized P/L
    update public.instruments
    set realized_pl = v_old_realized_pl + p_dividend_cash
    where id = p_instrument_id
      and user_id = p_user_id;

end;
$$;