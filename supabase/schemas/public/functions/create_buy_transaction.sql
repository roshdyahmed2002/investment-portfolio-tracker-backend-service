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

grant execute on function "public"."create_buy_transaction"(uuid, bigint, numeric, numeric, date) to "postgres";
