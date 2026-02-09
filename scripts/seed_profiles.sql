-- Insere um registro de exemplo (CPF 775.072.490-77) para facilitar testes locais.
-- Atualize o email e nome conforme o usuário real que desejar testar.
insert into public.profiles (user_id, email, document, full_name)
select
  gen_random_uuid(),
  'demo.cpf@example.com',
  '77507249077',
  'Usuário Demo CPF'
where not exists (
  select 1
  from public.profiles
  where document = '77507249077'
);
