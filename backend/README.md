## Backend (API)

### Pré-requisitos
1. Copie ackend/.env.example para ackend/.env e preencha SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY com as credenciais do seu projeto (Project Settings > API). Se quiser, ajuste também PORT.
2. Dentro de ackend, rode 
pm install.
3. Configure o banco rodando:

`ash
supabase db query --file backend/scripts/create_tables.sql
`

4. Após criar as tabelas, clique em Project Settings > Database > Settings > Reload schema cache.

### Rodando localmente
`ash
cd backend
npm run dev
`

O servidor fica disponível em http://localhost:4000, com documentação Swagger em /docs.

### Deploy
Use um provedor que suporte processos persistentes (Render, Railway, Fly.io etc.). Garanta que SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY e PORT estejam definidos no ambiente de execução. Como os dados ficam no Supabase, não é necessário manter um arquivo SQLite.
