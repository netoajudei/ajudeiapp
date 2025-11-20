# 📅 Implementação de Reservas - Dashboard

## ✅ O que foi implementado

### 1. **Integração com Supabase**
- Substituído `reservationService` mockado por `supabaseReservationService` real
- Integrado com contexto de autenticação (`useAuth`) para pegar `empresa_id`
- Busca dados reais do banco de dados

### 2. **Busca de Dados na View `resumo_reservas_diarias`**

#### Quando "Hoje" está selecionado:
- ✅ Busca resumo de hoje da view `resumo_reservas_diarias`
- ✅ Primeira linha alimenta os campos:
  - **Número de reservas**: `total_de_reservas`
  - **Quantidade de pessoas**: `total_de_convidados`
- ✅ Busca todas as reservas confirmadas de hoje da tabela `reservas`:
  - `confirmada == true`
  - `data_reserva == hoje`
  - `empresa_id == id da empresa`

#### Quando "Futuras" está selecionado:
- ✅ Busca resumos dos próximos 30 dias da view `resumo_reservas_diarias`
- ✅ Agrupa por data e período (Almoço/Noite)
- ✅ Mostra lista de resumos clicáveis
- ✅ Ao clicar em uma data, busca reservas detalhadas daquela data

### 3. **Mapeamento de Dados**

#### Reservas (`Reserva`)
```typescript
{
  id: number
  empresa_id: number
  nome: string (do cliente ou reserva)
  data_reserva: string (YYYY-MM-DD)
  horario: string
  adultos: number
  criancas: number
  convidados: number (adultos + criancas)
  observacoes: string | null
  aniversario: boolean
  confirmada_dia_reserva: boolean
  mesa: string | null
  status: 'confirmada' | 'pendente' | 'cancelada'
}
```

#### Resumo de Datas (`DateSummary`)
```typescript
{
  date: string (YYYY-MM-DD)
  weekday: string (ex: "Quarta-feira")
  period: string ("Almoço" ou "Noite")
  total_reservas: number
  total_convidados: number
}
```

### 4. **Funções Implementadas**

#### `loadInitialData()`
- Busca resumo de hoje da view
- Busca reservas confirmadas de hoje
- Atualiza summary com dados da primeira linha da view
- Mapeia reservas para formato esperado pelo componente

#### `loadDateSummaries()`
- Busca resumos dos próximos 30 dias (excluindo hoje)
- Agrupa por data e período
- Ordena por data (mais antiga primeiro)
- Dentro da mesma data, Almoço vem antes de Noite

#### `loadDetailedReservations(date)`
- Busca reservas detalhadas de uma data específica
- Usa `getReservasDetalhadas` do serviço
- Mapeia para formato esperado

### 5. **Tratamento de Dados**

#### Mapeamento de Reservas
- Extrai nome do cliente relacionado (`clientes.nome`)
- Calcula `convidados` como soma de `adultos + criancas`
- Determina `status` baseado em `confirmada` e `cancelada_cliente`
- Preserva todos os campos originais

#### Mapeamento de Resumos
- Converte data para weekday em português
- Normaliza período (Almoço/Noite)
- Converte strings numéricas para números
- Agrupa múltiplos períodos da mesma data

## 🔧 Estrutura da View `resumo_reservas_diarias`

```sql
CREATE VIEW resumo_reservas_diarias AS
SELECT 
  empresa_id,
  date,
  periodo,
  total_de_convidados,
  total_de_reservas
FROM ...
```

### Campos:
- `empresa_id`: bigint - ID da empresa
- `date`: date - Data da reserva
- `periodo`: text - Período (ex: "Almoço", "Jantar", "Noite")
- `total_de_convidados`: text - Total de convidados (como string)
- `total_de_reservas`: text - Total de reservas (como string)

## 📊 Fluxo de Dados

### Aba "Hoje":
```
1. Usuário acessa página → useEffect detecta authUser
2. loadInitialData() é chamado
3. Busca resumo de hoje: getResumoHoje(empresaId)
4. Busca reservas confirmadas: getReservasHoje(empresaId)
5. Primeira linha do resumo → summary (total_reservas, total_convidados)
6. Reservas mapeadas → todayReservations
7. Componente renderiza cards de reservas
```

### Aba "Futuras":
```
1. Usuário clica em "Futuras" → activeTab muda para 'all'
2. useEffect detecta mudança → loadDateSummaries()
3. Busca resumos próximos 30 dias: getResumoReservasDiarias(...)
4. Mapeia para DateSummary[]
5. Componente renderiza lista de resumos
6. Usuário clica em uma data → loadDetailedReservations(date)
7. Busca reservas daquela data → renderiza cards
```

## 🎯 Funcionalidades

### ✅ Carregamento Automático
- Dados carregam automaticamente quando página abre
- Aguarda `authUser` estar disponível antes de buscar

### ✅ Atualização em Tempo Real
- Botão de refresh recarrega dados
- Mantém aba e data selecionada

### ✅ Tratamento de Erros
- Try/catch em todas as funções async
- Logs de erro no console
- Não quebra a UI se houver erro

### ✅ Estados de Loading
- Mostra spinner durante carregamento
- Desabilita ações durante loading

## 🔍 Queries do Supabase

### Resumo de Hoje
```typescript
supabase
  .from('resumo_reservas_diarias')
  .select('*')
  .eq('empresa_id', empresaId)
  .eq('date', hoje)
  .order('date', { ascending: true })
```

### Reservas Confirmadas de Hoje
```typescript
supabase
  .from('reservas')
  .select('*, clientes:clientes_id (*)')
  .eq('empresa_id', empresaId)
  .eq('data_reserva', hoje)
  .eq('confirmada', true)
  .order('horario', { ascending: true })
```

### Resumos Futuros
```typescript
supabase
  .from('resumo_reservas_diarias')
  .select('*')
  .eq('empresa_id', empresaId)
  .gte('date', amanha)
  .lte('date', daquiA30Dias)
  .order('date', { ascending: true })
```

## 📝 Próximos Passos

1. **Testar com dados reais** - Verificar se os dados estão sendo exibidos corretamente
2. **Adicionar paginação** - Se houver muitas reservas
3. **Filtros adicionais** - Por período, status, etc.
4. **Atualização automática** - Polling ou websocket para atualizar em tempo real
5. **Exportação** - Exportar lista de reservas

## 🐛 Troubleshooting

### Dados não aparecem
- Verificar se `authUser.empresa.id` está disponível
- Verificar console para erros
- Verificar se RLS está configurado corretamente
- Verificar se a view `resumo_reservas_diarias` existe

### Resumo não aparece
- Verificar se há dados na view para hoje
- Verificar formato da data (YYYY-MM-DD)
- Verificar se `empresa_id` está correto

### Reservas não aparecem
- Verificar se há reservas com `confirmada == true`
- Verificar se `data_reserva == hoje`
- Verificar relacionamento com tabela `clientes`

