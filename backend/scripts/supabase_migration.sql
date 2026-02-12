-- Migration script for profiles table
-- Run this in the Supabase SQL Editor

-- Adiciona novas colunas se não existirem
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS company_cnpj TEXT,
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Adiciona comentários para documentação (opcional)
COMMENT ON COLUMN public.profiles.company_name IS 'Nome da empresa ou Nome Fantasia';
COMMENT ON COLUMN public.profiles.company_cnpj IS 'CNPJ da empresa';
COMMENT ON COLUMN public.profiles.logo_url IS 'URL pública do logo da empresa';
COMMENT ON COLUMN public.profiles.phone IS 'Telefone de contato ou WhatsApp';

-- Allow document to be NULL
ALTER TABLE public.profiles ALTER COLUMN document DROP NOT NULL;

-- Configurar RLS (Row Level Security) - já deve estar configurado, mas garante update do próprio usuário
-- Por padrão, usuários autenticados podem INSERT se policy permitir, e UPDATE se policy permitir.
-- Exemplo de policy para UPDATE (caso não exista):
-- CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

