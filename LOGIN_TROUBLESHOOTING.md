# 🔧 Troubleshooting - Login Travado

## Problema
O login fica em loading infinito (spinner girando sem parar).

## Causas Possíveis

### 1. ❌ Usuário não tem Profile cadastrado
**Sintoma**: Login no Supabase Auth funciona, mas não carrega dados.

**Solução**:
1. Abra o console do navegador (F12)
2. Procure por erros como: "Profile não encontrado" ou "404"
3. No Supabase Dashboard, vá em **SQL Editor**
4. Execute:
```sql
SELECT * FROM profiles WHERE email = 'seu@email.com';
```
5. Se retornar vazio, crie o profile:
```sql
-- Primeiro, pegue o UUID do usuário em Authentication > Users
INSERT INTO profiles (
  id,  -- UUID do auth.users
  empresa_id,  -- ID de uma empresa existente
  role,
  nome,
  email,
  ativo,
  cadastro_concluido
) VALUES (
  'UUID-DO-USUARIO-AQUI',
  1,  -- ID da empresa
  'adm',
  'Seu Nome',
  'seu@email.com',
  true,
  true
);
```

### 2. ❌ Profile sem empresa vinculada
**Sintoma**: Console mostra "Profile sem empresa vinculada".

**Solução**:
1. Verifique se a empresa existe:
```sql
SELECT * FROM empresa LIMIT 1;
```
2. Se não existir, crie uma empresa (veja `CREATE_TEST_USER.sql`)
3. Atualize o profile com o `empresa_id`:
```sql
UPDATE profiles 
SET empresa_id = 1  -- ID da empresa
WHERE email = 'seu@email.com';
```

### 3. ❌ Tabelas não existem
**Sintoma**: Console mostra "relation does not exist".

**Solução**:
1. Verifique se as tabelas foram criadas no Supabase
2. Acesse **Table Editor** no Supabase Dashboard
3. Confirme que existem as tabelas:
   - `profiles`
   - `empresa`
   - `reservas`
   - `clientes`

### 4. ❌ RLS (Row Level Security) bloqueando
**Sintoma**: Retorna vazio mesmo com dados no banco.

**Solução**:
1. Vá em **Table Editor** > Tabela > **RLS**
2. **Temporariamente**, desative RLS para testar:
```sql
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE empresa DISABLE ROW LEVEL SECURITY;
```
3. Teste o login
4. **IMPORTANTE**: Reative RLS depois:
```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE empresa ENABLE ROW LEVEL SECURITY;
```

### 5. ❌ Credenciais incorretas no .env.local
**Sintoma**: Erro de autenticação ou CORS.

**Solução**:
1. Verifique o arquivo `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```
2. Confirme que o URL e a chave estão corretos no Supabase Dashboard
3. Reinicie o servidor Next.js:
```bash
npm run dev
```

## 🔍 Como Debugar

### Passo 1: Abra o Console do Navegador
```
Chrome/Edge: F12 ou Ctrl+Shift+I
Firefox: F12 ou Ctrl+Shift+K
Safari: Cmd+Option+I
```

### Passo 2: Procure pelos Logs
O sistema agora tem logs detalhados:
- 🔐 Tentando login com: ...
- ✅ Login bem-sucedido!
- 🔍 Buscando dados do usuário: ...
- ✅ Profile encontrado: ...
- 🔍 Buscando empresa ID: ...
- ✅ Empresa encontrada: ...
- ❌ Erro ao buscar profile: ...

### Passo 3: Identifique Onde Parou
Se parou em:
- **"Tentando login"** → Problema de credenciais ou Supabase Auth
- **"Login bem-sucedido"** mas não continua → Problema no profile
- **"Profile encontrado"** mas não continua → Problema na empresa
- **Nenhum log aparece** → Problema no código ou build

### Passo 4: Verifique a Aba Network
1. Abra **Network** no DevTools
2. Filtre por "supabase"
3. Verifique os requests:
   - Status 200 = OK
   - Status 401 = Não autorizado
   - Status 404 = Não encontrado
   - Status 500 = Erro no servidor

## ✅ Solução Rápida: Criar Usuário de Teste

### Opção 1: Via Supabase Dashboard

#### 1. Criar Empresa
```sql
INSERT INTO empresa (
  razaoSocial, fantasia, cor, 
  LimiteDeReservasPorDia, LimiteDeConvidadosPorReserva,
  api_provider, modo_ia, em_teste
) VALUES (
  'Teste LTDA', 'Restaurante Teste', '#2293DD',
  50, 10, 'wappi', 'prompt_unico', true
) RETURNING id;
```
**Anote o ID retornado!**

#### 2. Criar Usuário no Auth
1. Vá em **Authentication > Users**
2. Clique em **Add User**
3. Preencha:
   - Email: `teste@restaurante.com`
   - Password: `Teste123!`
   - Auto Confirm User: ✅ Sim
4. **Copie o UUID do usuário criado**

#### 3. Criar Profile
```sql
INSERT INTO profiles (
  id, empresa_id, role, nome, email, ativo, cadastro_concluido
) VALUES (
  'UUID-COPIADO-NO-PASSO-2',
  ID-DA-EMPRESA-DO-PASSO-1,
  'adm', 'Usuário Teste', 'teste@restaurante.com', true, true
);
```

#### 4. Testar Login
- Email: `teste@restaurante.com`
- Senha: `Teste123!`

### Opção 2: Desabilitar Verificação Temporariamente (Apenas Dev)

**ATENÇÃO**: Apenas para desenvolvimento local!

Em `contexts/AuthContext.tsx`, comente a validação:
```typescript
// if (!profile || !profile.empresa_id) {
//   throw new Error('Usuário sem empresa vinculada');
// }
```

## 🔒 Verificação de RLS (Row Level Security)

### Políticas Necessárias

#### Para `profiles`:
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

#### Para `empresa`:
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

## 📞 Ainda não funciona?

1. ✅ Verifique se o servidor está rodando (`npm run dev`)
2. ✅ Limpe o cache do navegador (Ctrl+Shift+Delete)
3. ✅ Teste em aba anônima
4. ✅ Verifique se `.env.local` tem as variáveis corretas
5. ✅ Reinicie o servidor Next.js
6. ✅ Verifique os logs do console (emojis 🔐✅❌)

## 📋 Checklist Completo

- [ ] Supabase Auth configurado
- [ ] Tabela `profiles` existe
- [ ] Tabela `empresa` existe
- [ ] Usuário criado no Authentication
- [ ] Profile criado com `empresa_id` válido
- [ ] Empresa existe no banco
- [ ] `.env.local` configurado
- [ ] RLS configurado (ou desabilitado para teste)
- [ ] Console do navegador sem erros
- [ ] Servidor Next.js rodando
- [ ] Cache limpo

## 🎯 Logs Esperados (Sucesso)

```
🔐 Tentando login com: teste@restaurante.com
✅ Login bem-sucedido! abc123-uuid-456
🔍 Buscando dados do usuário: abc123-uuid-456
✅ Profile encontrado: { id: ..., empresa_id: 1, ... }
🔍 Buscando empresa ID: 1
✅ Empresa encontrada: { id: 1, fantasia: "Restaurante Teste", ... }
✅ Dados do usuário carregados!
```

Se você ver todos esses logs, o login deve funcionar! 🎉

