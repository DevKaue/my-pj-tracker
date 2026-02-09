-- Cria as tabelas necessárias para o backend e garante consistência básica.
create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  cnpj text,
  email text,
  phone text,
  created_at timestamptz not null default now()
);

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  description text,
  hourly_rate numeric not null,
  status text not null check (status in ('active','completed','paused')),
  created_at timestamptz not null default now()
);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  title text not null,
  description text,
  hours numeric not null default 0,
  date timestamptz not null,
  status text not null check (status in ('pending','in_progress','completed')),
  created_at timestamptz not null default now()
);

-- Um índice em tasks.date pode ajudar nos filtros utilizados pela API.
create index if not exists idx_tasks_date on tasks (date desc, created_at desc);

-- Depois de criar ou alterar tabelas, execute Reload schema cache no dashboard do Supabase.
