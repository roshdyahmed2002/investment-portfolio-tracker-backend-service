create type "public"."transaction_action" as enum (
  'Buy',
  'Sell',
  'Dividend Cash',
  'Dividend Shares'
);

grant usage on type "public"."transaction_action" to "postgres";
