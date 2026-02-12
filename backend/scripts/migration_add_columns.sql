-- Migration: Adicionar colunas `created_by` e `due_date`
-- Execute no Supabase Dashboard → SQL Editor

-- 1. Adicionar created_by em todas as tabelas
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
ALTER TABLE projects      ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
ALTER TABLE tasks         ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- 2. Adicionar due_date em tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS due_date TIMESTAMPTZ;

-- 3. Criar índices para performance nas queries filtradas por created_by
CREATE INDEX IF NOT EXISTS idx_organizations_created_by ON organizations(created_by);
CREATE INDEX IF NOT EXISTS idx_projects_created_by      ON projects(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by         ON tasks(created_by);

-- 4. Habilitar RLS (Row Level Security) para proteger os dados por usuário
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects      ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks         ENABLE ROW LEVEL SECURITY;

-- 5. Políticas para que o service_role (backend) tenha acesso total
--    (o backend já usa a service_role key, então precisa de bypass)
CREATE POLICY "Service role full access" ON organizations FOR ALL
  USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access" ON projects FOR ALL
  USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access" ON tasks FOR ALL
  USING (true) WITH CHECK (true);
