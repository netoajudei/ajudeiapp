# 🔧 Instruções de Debug - Login Travando

## ✅ O que foi feito:

### 1. Logs Detalhados Adicionados
Agora você verá no console cada etapa do processo:
- 🔐 Login iniciado
- ✅ Login no Auth bem-sucedido
- 🔍 [1/4] Iniciando busca de dados
- 🔍 [2/4] Buscando profile
- ⏳ Aguardando resposta...
- 📦 Resposta recebida
- 🔍 [3/4] Buscando empresa
- 🎉 [4/4] Concluído!

### 2. Timeout de 15 segundos
Se travar por mais de 15 segundos, mostrará erro automaticamente.

### 3. Botão de Teste no Login
Agora há um botão roxo **"🧪 Testar Supabase"** no canto inferior direito da página de login.

---

## 🧪 Como Usar o Botão de Teste

### Passo 1: Acesse a página de login
```
http://localhost:3002/login
```

### Passo 2: Clique no botão roxo "🧪 Testar Supabase"

### Passo 3: Veja os resultados
O botão vai mostrar:
- ✅ **Conexão OK** - Supabase está acessível
- 👥 **Número de profiles** - Quantos profiles existem
- 🏢 **Número de empresas** - Quantas empresas existem
- 🔐 **Sessão ativa** - Se você está logado

### Passo 4: Analise os resultados

#### Cenário 1: "Encontrados 0 profiles"
**Problema**: Nenhum profile cadastrado!

**Solução**: Execute no Supabase SQL Editor:
```sql
-- 1. Primeiro, veja seu UUID de usuário
SELECT id, email FROM auth.users;

-- 2. Crie o profile (substitua os valores)
INSERT INTO profiles (
  id,  -- UUID do passo anterior
  empresa_id,
  role,
  nome,
  email,
  ativo,
  cadastro_concluido
) VALUES (
  'UUID-DO-USUARIO',
  1,  -- ID da empresa (veja próximo passo)
  'adm',
  'Seu Nome',
  'seu@email.com',
  true,
  true
);
```

#### Cenário 2: "Encontradas 0 empresas"
**Problema**: Nenhuma empresa cadastrada!

**Solução**: Execute no Supabase SQL Editor:
```sql
INSERT INTO empresa (
  razaoSocial,
  fantasia,
  cor,
  LimiteDeReservasPorDia,
  LimiteDeConvidadosPorReserva,
  api_provider,
  modo_ia,
  em_teste
) VALUES (
  'Restaurante Teste LTDA',
  'Restaurante Teste',
  '#2293DD',
  50,
  10,
  'wappi',
  'prompt_unico',
  true
) RETURNING id;
```

#### Cenário 3: Profiles e Empresas existem, mas profile sem empresa_id
**Problema**: Profile não está vinculado a uma empresa!

**Solução**: Execute no Supabase SQL Editor:
```sql
-- Veja o profile
SELECT * FROM profiles WHERE email = 'seu@email.com';

-- Se empresa_id for NULL, atualize:
UPDATE profiles 
SET empresa_id = 1  -- ID da empresa
WHERE email = 'seu@email.com';
```

---

## 🔍 Debug com Console do Navegador

### 1. Abra o Console (F12)

### 2. Tente fazer login

### 3. Procure pelas mensagens com emojis

#### Exemplo de SUCESSO:
```
🔐 Tentando login com: teste@restaurante.com
✅ Login no Supabase Auth bem-sucedido! abc-123-uuid
🔍 Iniciando busca de dados do usuário...
🔍 [1/4] Iniciando fetchUserData para userId: abc-123-uuid
🔍 [2/4] Buscando profile na tabela profiles...
⏳ Aguardando resposta da query de profile...
📦 Resposta recebida!
Profile data: { id: "abc-123", email: "teste@...", empresa_id: 1 }
Profile error: null
✅ Profile encontrado: { id: "abc-123", email: "...", empresa_id: 1 }
🔍 [3/4] Buscando empresa com ID: 1
⏳ Aguardando resposta da query de empresa...
📦 Resposta recebida!
Empresa data: { id: 1, fantasia: "Restaurante Teste" }
Empresa error: null
✅ Empresa encontrada: { id: 1, fantasia: "Restaurante Teste" }
🎉 [4/4] Todos os dados carregados com sucesso!
✅ Dados do usuário carregados com sucesso!
```

#### Exemplo de ERRO (Profile não existe):
```
🔐 Tentando login com: teste@restaurante.com
✅ Login no Supabase Auth bem-sucedido! abc-123-uuid
🔍 Iniciando busca de dados do usuário...
🔍 [1/4] Iniciando fetchUserData para userId: abc-123-uuid
🔍 [2/4] Buscando profile na tabela profiles...
⏳ Aguardando resposta da query de profile...
📦 Resposta recebida!
Profile data: null
Profile error: { code: "PGRST116", message: "no rows found" }
❌ Erro ao buscar profile: { code: "PGRST116" ... }
💥 Erro crítico em fetchUserData: Profile não encontrado
```

**Ação**: Profile não existe! Use o SQL acima para criar.

#### Exemplo de ERRO (Profile sem empresa):
```
...
✅ Profile encontrado: { id: "abc-123", email: "...", empresa_id: null }
❌ Profile sem empresa vinculada
```

**Ação**: Profile.empresa_id é NULL! Use UPDATE para vincular.

---

## 📋 Checklist Completo

Execute em ordem:

### ✅ 1. Verificar se servidor está rodando
```bash
npm run dev
```

### ✅ 2. Acessar página de login
```
http://localhost:3002/login
```

### ✅ 3. Clicar no botão "🧪 Testar Supabase"
- Deve mostrar número de profiles e empresas

### ✅ 4. Se profiles = 0, criar profile
```sql
-- No Supabase SQL Editor
SELECT id, email FROM auth.users;  -- Copie o UUID

INSERT INTO profiles (id, empresa_id, role, nome, email, ativo, cadastro_concluido)
VALUES ('UUID-AQUI', 1, 'adm', 'Nome', 'email@exemplo.com', true, true);
```

### ✅ 5. Se empresas = 0, criar empresa
```sql
INSERT INTO empresa (razaoSocial, fantasia, cor, api_provider, modo_ia)
VALUES ('Teste LTDA', 'Teste', '#2293DD', 'wappi', 'prompt_unico')
RETURNING id;
```

### ✅ 6. Tentar login novamente
- Abra F12 (console)
- Digite email/senha
- Clique "Entrar no Sistema"
- **Leia os logs com emojis**

### ✅ 7. Me envie os logs!
Copie TUDO que aparecer no console e me envie.

---

## 🆘 O que me enviar se ainda não funcionar:

1. **Screenshot** do resultado do botão "🧪 Testar Supabase"
2. **Logs do console** (F12) ao tentar login
3. **Resultado desta query** no Supabase SQL Editor:
```sql
SELECT 
  u.id as auth_id,
  u.email,
  p.id as profile_id,
  p.empresa_id,
  e.fantasia
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
LEFT JOIN empresa e ON p.empresa_id = e.id
WHERE u.email = 'seu@email.com';  -- Substitua pelo seu email
```

---

## 🎯 Próximos Passos Depois que Funcionar

Quando o login funcionar:
1. Remover o botão de teste (ou deixar só em dev)
2. Configurar RLS (Row Level Security)
3. Remover logs excessivos do console
4. Adicionar tratamento de erro mais elegante

Por enquanto, **precisamos fazer funcionar primeiro**! 🚀

