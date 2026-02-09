-- SQL para criar a tabela profiles exigida pelo login
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  email text not null unique,
  document text not null unique,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

alter table public.profiles
  add column if not exists user_id uuid;

alter table public.profiles
  add column if not exists updated_at timestamptz not null default now();

create unique index if not exists profiles_user_id_unique on public.profiles(user_id);

drop policy if exists anon_select_profiles on public.profiles;

create policy anon_select_profiles
  on public.profiles
  for select
  using (true);

drop policy if exists authenticated_insert_profiles on public.profiles;

create policy authenticated_insert_profiles
  on public.profiles
  for insert
  with check (auth.uid() = user_id AND auth.role() = 'authenticated');

drop policy if exists authenticated_update_profiles on public.profiles;

create policy authenticated_update_profiles
  on public.profiles
  for update
  using (auth.uid() = user_id AND auth.role() = 'authenticated');

grant select on public.profiles to anon;

-- Após rodar, recarregue o schema cache em Project Settings > Database > Settings
