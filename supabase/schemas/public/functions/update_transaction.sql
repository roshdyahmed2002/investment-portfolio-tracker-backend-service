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

grant execute on function "public"."update_transaction"(uuid, bigint, bigint, public.transaction_action, numeric, numeric, numeric, numeric, date) to "postgres";
