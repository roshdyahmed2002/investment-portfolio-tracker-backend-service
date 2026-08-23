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