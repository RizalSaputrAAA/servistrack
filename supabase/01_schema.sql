-- Jalankan di Supabase > SQL Editor (sekali saja)
create table shops (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  phone text,
  sla_hours_waiting_approval int default 24,
  sla_hours_in_progress int default 72,
  created_at timestamptz default now()
);

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  shop_id uuid references shops(id) on delete cascade,
  full_name text not null,
  role text check (role in ('owner','cashier','technician')) not null,
  active boolean default true,
  created_at timestamptz default now()
);

create table customers (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid references shops(id) on delete cascade,
  name text not null,
  phone text,
  created_at timestamptz default now()
);

create table tickets (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid references shops(id) on delete cascade not null,
  ticket_code text unique not null,
  customer_id uuid references customers(id),
  customer_name text not null,
  customer_phone text,
  device_brand text,
  device_type text,
  symptoms text[] not null,
  notes text,
  public_note text,
  triage_score int default 0,
  triage_diagnosis text,
  triage_confidence numeric,
  status text check (status in
    ('received','diagnosing','waiting_approval','in_progress','done','picked_up','cancelled'))
    default 'received',
  assigned_to uuid references profiles(id),
  estimated_cost int,
  final_cost int,
  approved boolean default false,
  rejection_reason text,
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table ticket_events (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid references tickets(id) on delete cascade,
  from_status text,
  to_status text,
  note text,
  is_public boolean default false,
  actor_id uuid references profiles(id),
  created_at timestamptz default now()
);

create table parts (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid references shops(id) on delete cascade not null,
  code text,
  name text not null,
  category text,
  stock int default 0,
  min_stock int default 0,
  price_buy int,
  price_sell int,
  created_at timestamptz default now()
);

create table part_usage (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid references tickets(id) on delete cascade,
  part_id uuid references parts(id),
  qty int not null default 1,
  price_at_use int,
  created_at timestamptz default now()
);

create table payments (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid references tickets(id) on delete cascade,
  method text check (method in ('cash','qris','transfer')) not null,
  amount int not null,
  note text,
  paid_at timestamptz default now(),
  created_by uuid references profiles(id)
);

create table triage_rules (
  id uuid primary key default gen_random_uuid(),
  symptom text not null,
  diagnosis text not null,
  cf numeric not null check (cf > 0 and cf <= 1),
  active boolean default true
);

create table ticket_photos (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid references tickets(id) on delete cascade,
  url text not null,
  caption text,
  created_at timestamptz default now()
);

-- RLS aktif. Aplikasi mengakses data lewat API server (service role),
-- jadi tanpa policy untuk anon = data tertutup dari akses langsung browser.
alter table shops enable row level security;
alter table tickets enable row level security;
alter table parts enable row level security;
alter table part_usage enable row level security;
alter table payments enable row level security;
alter table customers enable row level security;
alter table ticket_events enable row level security;
alter table profiles enable row level security;
alter table triage_rules enable row level security;
alter table ticket_photos enable row level security;

create policy "shop members see tickets" on tickets for all
using (shop_id = (select shop_id from profiles where id = auth.uid()));
create policy "shop members see parts" on parts for all
using (shop_id = (select shop_id from profiles where id = auth.uid()));
create policy "see own profile" on profiles for select using (id = auth.uid());
