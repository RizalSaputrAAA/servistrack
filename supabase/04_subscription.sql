-- Jalankan di Supabase > SQL Editor. AMAN dijalankan berulang kali.
alter table shops
  add column if not exists plan text not null default 'trial' check (plan in ('trial','monthly','yearly')),
  add column if not exists trial_ends_at timestamptz not null default (now() + interval '3 days'),
  add column if not exists paid_until timestamptz;

create table if not exists sub_invoices (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid not null references shops(id) on delete cascade,
  plan text not null check (plan in ('monthly','yearly')),
  amount int not null,
  unique_code int not null,
  status text not null default 'pending' check (status in ('pending','paid','rejected','cancelled')),
  claimed boolean not null default false,
  claim_note text,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);
alter table sub_invoices add column if not exists method text;
alter table sub_invoices enable row level security;

-- (Opsional) mulai ulang masa percobaan 3 hari dari SEKARANG untuk semua toko:
-- update shops set plan = 'trial', trial_ends_at = now() + interval '3 days', paid_until = null;
