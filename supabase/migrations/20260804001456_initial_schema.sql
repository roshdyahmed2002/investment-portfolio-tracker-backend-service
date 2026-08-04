-- ============================================
-- Transaction Action Enum
-- ============================================

create type transaction_action as enum (
    'Buy',
    'Sell',
    'Dividend Cash',
    'Dividend Shares'
);

-- ============================================
-- Categories
-- ============================================

create table public.categories (
    id bigint generated always as identity primary key,
    name text not null unique,
    created_at timestamptz not null default now()
);

insert into public.categories (name)
values
('Stock'),
('Mutual Fund'),
('Metal');

-- ============================================
-- Instruments
-- ============================================

create table public.instruments (
    id bigint generated always as identity primary key,

    user_id uuid not null
        references auth.users(id)
        on delete cascade,

    category_id bigint not null
        references public.categories(id),

    name text not null,

    units_held numeric not null default 0,
    avg_cost numeric not null default 0,
    realized_pl numeric not null default 0,

    created_at timestamptz not null default now(),

    unique (user_id, name)
);

-- ============================================
-- Transactions
-- ============================================

create table public.transactions (
    id bigint generated always as identity primary key,

    user_id uuid not null
        references auth.users(id)
        on delete cascade,

    instrument_id bigint not null
        references public.instruments(id)
        on delete cascade,

    action transaction_action not null,

    txn_date date not null,

    units numeric,
    price numeric,
    cash_amount numeric,

    created_at timestamptz not null default now()
);

-- ============================================
-- Indexes
-- ============================================

create index idx_instruments_user
on public.instruments(user_id);

create index idx_transactions_user
on public.transactions(user_id);

create index idx_transactions_instrument_date
on public.transactions(instrument_id, txn_date, id);

-- ============================================
-- Enable RLS
-- ============================================

alter table public.categories enable row level security;
alter table public.instruments enable row level security;
alter table public.transactions enable row level security;