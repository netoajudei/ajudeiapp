-- Script para criar usuário de teste no Supabase
-- Execute este script no SQL Editor do Supabase Dashboard

-- 1. Primeiro, crie uma empresa de teste (se ainda não existir)
INSERT INTO empresa (
  razaoSocial,
  fantasia,
  contatoPrincipal,
  logo,
  cor,
  LimiteDeReservasPorDia,
  LimiteDeConvidadosPorReserva,
  em_teste,
  api_provider,
  modo_ia
) VALUES (
  'Restaurante Teste LTDA',
  'Restaurante Teste',
  '5511999999999',
  'https://via.placeholder.com/150/2293DD/FFFFFF?text=RT',
  '#2293DD',
  50,
  10,
  true,
  'wappi',
  'prompt_unico'
)
ON CONFLICT DO NOTHING
RETURNING id;

-- 2. Depois, crie o usuário no auth.users
-- IMPORTANTE: Vá em Authentication > Users no Supabase Dashboard
-- Clique em "Add User" e crie um usuário com:
-- Email: teste@restaurante.com
-- Password: Teste123!
-- Confirm Email: Sim

-- 3. Pegue o UUID do usuário criado e execute:
-- Substitua 'SEU-UUID-AQUI' pelo UUID do usuário criado no passo 2
-- Substitua 'ID-DA-EMPRESA' pelo ID retornado no passo 1

-- Exemplo:
-- INSERT INTO profiles (
--   id,
--   empresa_id,
--   role,
--   nome,
--   email,
--   ativo,
--   cadastro_concluido
-- ) VALUES (
--   'SEU-UUID-AQUI',
--   1,  -- ID da empresa
--   'adm',
--   'Usuário Teste',
--   'teste@restaurante.com',
--   true,
--   true
-- );

-- 4. Verifique se o profile foi criado:
-- SELECT * FROM profiles WHERE email = 'teste@restaurante.com';

-- 5. Verifique se a empresa existe:
-- SELECT * FROM empresa WHERE fantasia = 'Restaurante Teste';

