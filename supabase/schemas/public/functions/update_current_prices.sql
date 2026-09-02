create or replace function public.update_current_prices(
  p_user_id uuid,
  p_prices jsonb
)
returns void
language sql
security invoker
as $$
  update public.instruments AS i
  set current_price = v.current_price
  from jsonb_to_recordset(p_prices) as v(
    id bigint,
    current_price numeric
  )
  where i.id = v.id
    and i.user_id = p_user_id;
$$;