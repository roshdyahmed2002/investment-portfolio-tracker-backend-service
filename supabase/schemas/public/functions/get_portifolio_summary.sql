create or replace function public.get_portfolio_summary(
  p_user_id uuid
)
returns table (
  portfolio_value numeric,
  total_invested numeric,
  realized_pl numeric
)
language sql
security invoker
as $$
  select
    coalesce(sum(units_held * current_price), 0) as portfolio_value,
    coalesce(sum(units_held * avg_buy_cost), 0) as total_invested,
    coalesce(sum(realized_pl), 0) as realized_pl
  from public.instruments
  where user_id = p_user_id;
$$;