create type "public"."transaction_action" as enum (
  'Buy',
  'Sell',
  'Dividend Cash',
  'Dividend Shares'
);