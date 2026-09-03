-- InvoiceFlow — Supabase schema (run in SQL Editor after creating a project)

create extension if not exists "pgcrypto";

-- Profiles extend Supabase Auth users
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default 'User',
  role text not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  contact_name text,
  email text,
  phone text,
  address text,
  city text,
  postal_code text,
  country text not null default 'Indonesia',
  tax_id text,
  notes text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.company_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles (id) on delete cascade,
  company_name text not null default 'My Company',
  legal_name text,
  tax_id text,
  email text,
  phone text,
  address text,
  city text,
  postal_code text,
  country text not null default 'Indonesia',
  logo text,
  workshop text,
  document_intro_text text,
  default_terms text,
  signature_image text,
  signature_name text,
  default_tax_name text not null default 'PPN',
  default_tax_rate numeric(5, 2) not null default 11,
  invoice_prefix text not null default 'INV/{YYYY}/{MM}/',
  invoice_next_num int not null default 1,
  invoice_padding int not null default 5,
  quotation_prefix text not null default 'QT/{YYYY}/{MM}/',
  quotation_next_num int not null default 1,
  sph_prefix text not null default 'SPH/{YYYY}/',
  sph_next_num int not null default 1,
  sph_padding int not null default 4,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bank_accounts (
  id uuid primary key default gen_random_uuid(),
  settings_id uuid not null references public.company_settings (id) on delete cascade,
  bank_name text not null,
  account_num text not null,
  holder_name text not null default '',
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text not null unique,
  client_id uuid not null references public.clients (id),
  user_id uuid not null references public.profiles (id) on delete cascade,
  issue_date timestamptz not null default now(),
  due_date timestamptz not null,
  project_name text,
  po_number text,
  subtotal numeric(15, 2) not null,
  tax_rate numeric(5, 2) not null default 11,
  tax_amount numeric(15, 2) not null,
  discount numeric(15, 2) not null default 0,
  total numeric(15, 2) not null,
  status text not null default 'draft',
  notes text,
  terms text,
  bank_account text,
  signature_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices (id) on delete cascade,
  group_name text,
  model text,
  description text not null,
  quantity int not null,
  unit text not null default 'unit',
  rate numeric(15, 2) not null,
  amount numeric(15, 2) not null
);

create table if not exists public.payment_records (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices (id) on delete cascade,
  amount numeric(15, 2) not null,
  payment_date timestamptz not null,
  method text,
  reference text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.quotations (
  id uuid primary key default gen_random_uuid(),
  quotation_number text not null unique,
  client_id uuid not null references public.clients (id),
  user_id uuid not null references public.profiles (id) on delete cascade,
  issue_date timestamptz not null default now(),
  valid_until timestamptz not null,
  project_name text,
  subtotal numeric(15, 2) not null,
  tax_rate numeric(5, 2) not null default 11,
  tax_amount numeric(15, 2) not null,
  discount numeric(15, 2) not null default 0,
  total numeric(15, 2) not null,
  status text not null default 'draft',
  notes text,
  terms text,
  bank_account text,
  signature_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quotation_items (
  id uuid primary key default gen_random_uuid(),
  quotation_id uuid not null references public.quotations (id) on delete cascade,
  group_name text,
  model text,
  description text not null,
  quantity int not null,
  unit text not null default 'unit',
  rate numeric(15, 2) not null,
  amount numeric(15, 2) not null
);

create index if not exists idx_clients_user_id on public.clients (user_id);
create index if not exists idx_invoices_user_id on public.invoices (user_id);
create index if not exists idx_quotations_user_id on public.quotations (user_id);

-- New user → profile + default company settings
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1), 'User'),
    'user'
  );
  insert into public.company_settings (user_id, company_name)
  values (new.id, 'My Company');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.company_settings enable row level security;
alter table public.bank_accounts enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.payment_records enable row level security;
alter table public.quotations enable row level security;
alter table public.quotation_items enable row level security;

-- Profiles: own row only
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- Clients
create policy "clients_all_own" on public.clients for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Company settings
create policy "settings_all_own" on public.company_settings for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Bank accounts (via settings ownership)
create policy "bank_accounts_all_own" on public.bank_accounts for all
  using (
    exists (
      select 1 from public.company_settings s
      where s.id = settings_id and s.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.company_settings s
      where s.id = settings_id and s.user_id = auth.uid()
    )
  );

-- Invoices
create policy "invoices_all_own" on public.invoices for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Invoice items (via invoice)
create policy "invoice_items_all_own" on public.invoice_items for all
  using (
    exists (select 1 from public.invoices i where i.id = invoice_id and i.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.invoices i where i.id = invoice_id and i.user_id = auth.uid())
  );

-- Payments
create policy "payments_all_own" on public.payment_records for all
  using (
    exists (select 1 from public.invoices i where i.id = invoice_id and i.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.invoices i where i.id = invoice_id and i.user_id = auth.uid())
  );

-- Quotations
create policy "quotations_all_own" on public.quotations for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Quotation items
create policy "quotation_items_all_own" on public.quotation_items for all
  using (
    exists (select 1 from public.quotations q where q.id = quotation_id and q.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.quotations q where q.id = quotation_id and q.user_id = auth.uid())
  );

-- Grants for API roles (anon, authenticated, service_role)
grant all on all tables in schema public to postgres, anon, authenticated, service_role;
grant all on all sequences in schema public to postgres, anon, authenticated, service_role;
grant all on all functions in schema public to postgres, anon, authenticated, service_role;

alter default privileges in schema public grant all on tables to postgres, anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to postgres, anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to postgres, anon, authenticated, service_role;
