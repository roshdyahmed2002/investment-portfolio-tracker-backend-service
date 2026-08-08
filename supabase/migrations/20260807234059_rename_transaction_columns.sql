alter table public.instruments
rename column avg_cost to avg_buy_cost;

alter table public.transactions
rename column cash_amount to dividend_cash;

alter table public.transactions
rename column dividend_ratio to dividend_shares_ratio;