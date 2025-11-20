# 🔧 Fix: Query do Supabase Travando

## Problema Identificado

A query do Supabase está travando na busca do profile. Os logs mostram:
```
⏳ Aguardando resposta da query de profile...
```

Mas nunca recebe a resposta. Isso indica que:
1. **RLS (Row Level Security) está bloqueando** - Mais provável
2. Tabela não existe ou nome incorreto
3. Problema de conexão
4. Query muito lenta

## ✅ Correções Implementadas

### 1. Timeout de 10 segundos
- Agora a query não trava infinitamente
- Mostra erro claro se demorar mais de 10 segundos

### 2. Teste de Conexão
- Testa conexão antes de buscar dados
- Identifica problemas de conectividade rapidamente

### 3. Mensagens de Erro Melhoradas
- Códigos de erro específicos
- Mensagens mais claras sobre o problema

### 4. Logs Detalhados
- Mostra exatamente onde está travando
- Indica possíveis causas

## 🔍 Como Verificar se é RLS

### Passo 1: Verificar RLS no Supabase Dashboard

1. Acesse **Supabase Dashboard** → Seu Projeto
2. Vá em **Table Editor** → Tabela `profiles`
3. Clique na aba **RLS** (Row Level Security)
4. Veja se está **habilitado** ou **desabilitado**

### Passo 2: Se RLS estiver habilitado, verificar políticas

Execute no **SQL Editor**:

```sql
-- Ver políticas da tabela profiles
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'profiles';
```

### Passo 3: Criar política temporária para teste

**ATENÇÃO**: Apenas para desenvolvimento!

```sql
-- Política temporária: usuário pode ler seu próprio profile
CREATE POLICY "Users can read own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);
```

### Passo 4: Desabilitar RLS temporariamente (APENAS DEV)

```sql
-- Desabilitar RLS na tabela profiles (TEMPORÁRIO!)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Testar login novamente

-- Reabilitar depois:
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
```

## 🧪 Teste Direto no SQL Editor

Execute esta query no **Supabase SQL Editor**:

```sql
-- Substitua o UUID pelo do seu usuário
SELECT * FROM profiles 
WHERE id = '2729ee9d-e381-420d-abe9-2888537c991b';
```

**Se funcionar**: O problema é RLS bloqueando no código
**Se não funcionar**: O profile não existe ou há outro problema

## 🔧 Solução Rápida (Desenvolvimento)

Para desenvolvimento rápido, desabilite RLS temporariamente:

```sql
-- Desabilitar RLS
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE empresa DISABLE ROW LEVEL SECURITY;

-- Testar login

-- IMPORTANTE: Reabilitar depois!
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE empresa ENABLE ROW LEVEL SECURITY;
```

## ✅ Políticas RLS Corretas (Produção)

Quando estiver pronto para produção, crie estas políticas:

### Para `profiles`:
```sql
-- Usuário pode ler seu próprio profile
CREATE POLICY "Users can read own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- Usuário pode atualizar seu próprio profile
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);
```

### Para `empresa`:
```sql
-- Usuário pode ler a empresa dele
CREATE POLICY "Users can read own company"
ON empresa FOR SELECT
USING (
  id IN (
    SELECT empresa_id FROM profiles WHERE id = auth.uid()
  )
);

-- Apenas admins podem atualizar empresa
CREATE POLICY "Admins can update company"
ON empresa FOR UPDATE
USING (
  id IN (
    SELECT empresa_id FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('adm', 'proprietario', 'dev')
  )
);
```

## 📊 Verificar se Profile Existe

Execute no SQL Editor:

```sql
-- Ver todos os profiles
SELECT id, email, empresa_id, role, nome 
FROM profiles;

-- Ver profile específico
SELECT * FROM profiles 
WHERE id = '2729ee9d-e381-420d-abe9-2888537c991b';

-- Ver se usuário tem profile
SELECT 
  u.id as auth_id,
  u.email as auth_email,
  p.id as profile_id,
  p.empresa_id
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email = 'ajudeiservicosdigitais@gmail.com';
```

## 🎯 Próximos Passos

1. **Teste o login novamente** - Agora deve mostrar erro claro se timeout
2. **Verifique o console** - Veja a mensagem de erro específica
3. **Execute as queries acima** - Para identificar o problema exato
4. **Desabilite RLS temporariamente** - Se for o problema
5. **Crie políticas corretas** - Quando estiver pronto

## 📝 Logs Esperados Agora

### Se for RLS:
```
⏱️ TIMEOUT DETECTADO - A query do Supabase não retornou em tempo hábil
Possíveis causas:
1. RLS (Row Level Security) bloqueando a query
...
```

### Se profile não existir:
```
❌ Erro ao buscar profile: Profile não encontrado para o usuário...
```

### Se funcionar:
```
✅ Conexão com Supabase OK
📦 Resposta recebida!
✅ Profile encontrado
✅ Empresa encontrada
🎉 [4/4] Todos os dados carregados com sucesso!
```

