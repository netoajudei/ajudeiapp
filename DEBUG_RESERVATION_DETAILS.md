# 🔧 Debug: Página de Detalhes da Reserva Não Funciona

## ✅ Correções Implementadas

### 1. **Página Atualizada para Next.js App Router**
- ✅ Convertida para client component (`"use client"`)
- ✅ Usa `use()` hook para unwrap Promise de params
- ✅ Logs adicionados para verificar se ID está sendo recebido

### 2. **Logs Detalhados Adicionados**
- ✅ Logs em cada etapa do processo
- ✅ Logs no componente e no serviço
- ✅ Logs de erros com detalhes completos

### 3. **Tratamento de Erros Melhorado**
- ✅ Verifica se dados são null/undefined
- ✅ Mensagens de erro mais específicas
- ✅ Logs de todos os campos do erro

## 🔍 Como Debugar

### Passo 1: Abra o Console do Navegador
- **Chrome/Edge**: `F12` ou `Ctrl+Shift+I`
- **Firefox**: `F12`
- **Safari**: `Cmd+Option+I`

### Passo 2: Acesse a Página de Detalhes
```
http://localhost:3001/dashboard/reservas/1190
```

### Passo 3: Procure pelos Logs no Console

#### Se estiver funcionando, você verá:
```
🔍 [PAGE] ReservationDetails page renderizado com ID: 1190
🔄 [ReservationDetails] useEffect executado: { reservationId: "1190", hasAuthUser: true, empresaId: 2 }
🔍 [ReservationDetails] Iniciando busca: { reservationId: "1190", reservaIdNum: 1190, empresaId: 2, ... }
🚀 [getReservaById] Iniciando busca: { empresaId: 2, reservaId: 1190 }
📡 [getReservaById] Executando query no Supabase...
📦 [getReservaById] Resposta recebida: { hasData: true, hasError: false }
✅ [getReservaById] Reserva encontrada: { id: 1190, nome: "ariane", empresa_id: 2 }
✅ [ReservationDetails] Dados recebidos do Supabase: {...}
✅ [ReservationDetails] Reserva mapeada com sucesso: {...}
🏁 [ReservationDetails] Loading finalizado
```

#### Se NÃO estiver funcionando, você verá:

**Cenário 1: ID não está sendo recebido**
```
🔍 [PAGE] ReservationDetails page renderizado com ID: undefined
❌ [ReservationDetails] reservationId não fornecido
```
**Solução**: Verifique se a rota está correta e se o ID está sendo passado

**Cenário 2: authUser não disponível**
```
⏳ [ReservationDetails] Aguardando authUser estar disponível...
```
**Solução**: Verifique se o login foi feito corretamente

**Cenário 3: Erro na query do Supabase**
```
❌ [getReservaById] Erro ao buscar reserva por ID: {...}
❌ [getReservaById] Detalhes completos: {
  code: "PGRST116",
  message: "no rows found",
  ...
}
```
**Possíveis causas**:
- Reserva não existe com esse ID
- Reserva pertence a outra empresa
- RLS bloqueando a query

**Solução**: Verifique o erro específico e corrija

**Cenário 4: Reserva não encontrada (null)**
```
📦 [getReservaById] Resposta recebida: { hasData: false, hasError: false }
❌ [getReservaById] Reserva não encontrada (data é null)
```
**Solução**: Verifique se a reserva existe no banco

## 🐛 Problemas Comuns

### Problema 1: "Reserva não encontrada" mas existe no banco

**Possíveis causas**:
1. Reserva pertence a outra empresa
2. RLS bloqueando a query
3. ID incorreto

**Solução**:
1. Execute esta query no Supabase SQL Editor:
```sql
SELECT id, empresa_id, nome, data_reserva 
FROM reservas 
WHERE id = 1190;
```

2. Verifique se `empresa_id` corresponde ao ID da sua empresa

3. Verifique RLS:
```sql
-- Desabilitar RLS temporariamente para testar
ALTER TABLE reservas DISABLE ROW LEVEL SECURITY;

-- Testar novamente

-- Reabilitar depois
ALTER TABLE reservas ENABLE ROW LEVEL SECURITY;
```

### Problema 2: Erro PGRST116 (no rows found)

**Causa**: Query não retornou nenhuma linha

**Solução**:
1. Verifique se a reserva existe:
```sql
SELECT * FROM reservas WHERE id = 1190;
```

2. Verifique se o empresa_id está correto:
```sql
SELECT * FROM reservas 
WHERE id = 1190 
AND empresa_id = 2;  -- Substitua pelo ID da sua empresa
```

3. Se não retornar nada, a reserva não existe ou pertence a outra empresa

### Problema 3: Erro 42501 (permission denied)

**Causa**: RLS bloqueando a query

**Solução**:
1. Desabilite RLS temporariamente:
```sql
ALTER TABLE reservas DISABLE ROW LEVEL SECURITY;
```

2. Teste novamente

3. Crie políticas RLS corretas:
```sql
-- Usuário pode ler reservas da sua empresa
CREATE POLICY "Users can read own company reservations"
ON reservas FOR SELECT
USING (
  empresa_id IN (
    SELECT empresa_id FROM profiles WHERE id = auth.uid()
  )
);
```

## 📋 Checklist de Verificação

Execute em ordem:

- [ ] Console do navegador aberto (F12)
- [ ] Página `/dashboard/reservas/1190` acessada
- [ ] Login feito com sucesso
- [ ] Log mostra "PAGE renderizado com ID: 1190"
- [ ] Log mostra "useEffect executado"
- [ ] Log mostra "Iniciando busca"
- [ ] Log mostra "Executando query no Supabase"
- [ ] Log mostra "Resposta recebida"
- [ ] Se erro, verificar código e mensagem
- [ ] Se sucesso, verificar se dados aparecem na tela

## 🆘 O que me enviar se ainda não funcionar

1. **Screenshot** do console com TODOS os logs
2. **Texto completo** dos logs do console (copiar e colar)
3. **Resultado desta query** no Supabase SQL Editor:
```sql
-- Verificar se a reserva existe
SELECT id, empresa_id, nome, data_reserva, confirmada_dia_reserva
FROM reservas 
WHERE id = 1190;

-- Verificar seu empresa_id
SELECT empresa_id FROM profiles 
WHERE id = (SELECT id FROM auth.users WHERE email = 'seu@email.com');
```

4. **URL completa** que você está acessando

## 🎯 Próximos Passos

Quando funcionar:
1. Remover logs excessivos (ou deixar só em dev)
2. Adicionar tratamento de erro mais elegante na UI
3. Adicionar loading states mais visíveis
4. Adicionar mensagens quando não houver dados

Por enquanto, **precisamos fazer funcionar primeiro**! 🚀

