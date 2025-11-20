-- Script para verificar dados do usuário no Supabase
-- Execute no SQL Editor do Supabase Dashboard

-- 1. Listar todos os usuários do Auth
SELECT 
  id,
  email,
  created_at,
  confirmed_at,
  last_sign_in_at
FROM auth.users
ORDER BY created_at DESC;

-- 2. Verificar profiles cadastrados
SELECT 
  p.id,
  p.empresa_id,
  p.role,
  p.nome,
  p.email,
  p.ativo,
  p.cadastro_concluido
FROM profiles p
ORDER BY p.id;

-- 3. Verificar empresas cadastradas
SELECT 
  e.id,
  e.razaoSocial,
  e.fantasia,
  e.cor,
  e.logo,
  e.em_teste
FROM empresa e
ORDER BY e.id;

-- 4. Verificar usuários SEM profile (problema comum!)
SELECT 
  u.id,
  u.email,
  'SEM PROFILE' as status
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- 5. Verificar profiles SEM empresa vinculada (outro problema comum!)
SELECT 
  p.id,
  p.email,
  p.empresa_id,
  'SEM EMPRESA' as status
FROM profiles p
WHERE p.empresa_id IS NULL;

-- 6. Query completa para verificar um usuário específico
-- Substitua 'seu@email.com' pelo email que você está testando
SELECT 
  u.id as auth_id,
  u.email as auth_email,
  p.id as profile_id,
  p.empresa_id,
  p.nome,
  p.role,
  p.ativo,
  e.fantasia as empresa_nome,
  e.cor as empresa_cor
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
LEFT JOIN empresa e ON p.empresa_id = e.id
WHERE u.email = 'seu@email.com';

-- 7. Contar registros
SELECT 
  (SELECT COUNT(*) FROM auth.users) as total_users,
  (SELECT COUNT(*) FROM profiles) as total_profiles,
  (SELECT COUNT(*) FROM empresa) as total_empresas,
  (SELECT COUNT(*) FROM auth.users u LEFT JOIN profiles p ON u.id = p.id WHERE p.id IS NULL) as users_sem_profile;

