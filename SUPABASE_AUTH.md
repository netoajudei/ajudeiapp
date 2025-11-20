# Autenticação com Supabase - RestauranteIA

## ✅ Implementação Concluída

### 🔐 Componentes Criados

1. **Configuração do Cliente Supabase**
   - `lib/supabase/client.ts` - Cliente browser
   - `lib/supabase/server.ts` - Cliente server-side
   - `lib/supabase/types.ts` - Tipos TypeScript do schema

2. **Contexto de Autenticação**
   - `contexts/AuthContext.tsx` - Provider global de autenticação
   - Gerencia sessão do usuário
   - Carrega profile e empresa automaticamente no login
   - Disponível em toda aplicação via `useAuth()`

3. **Serviços**
   - `services/supabaseReservationService.ts` - Serviço para buscar reservas usando empresa_id

4. **Componentes**
   - `components/ProtectedRoute.tsx` - HOC para proteger rotas
   - `components/LoginPage.tsx` - Atualizado para usar Supabase real
   - `components/dashboard/DashboardLayout.tsx` - Atualizado para usar contexto

### 📊 Estrutura de Dados

#### Profile (carregado no login)
```typescript
{
  id: string;              // UUID do auth.users
  empresa_id: number;      // FK para empresa
  role: AppRole;           // Permissões do usuário
  nome: string;
  email: string;
  foto_url: string;
  telefone: string;
  ativo: boolean;
  cadastro_concluido: boolean;
}
```

#### Empresa (carregada junto com profile)
```typescript
{
  id: number;
  razaoSocial: string;
  fantasia: string;
  logo: string;
  cor: string;              // Cor tema da empresa
  LimiteDeReservasPorDia: number;
  LimiteDeConvidadosPorReserva: number;
  // ... outros campos
}
```

### 🚀 Como Usar

#### 1. Hook useAuth (em qualquer componente client)
```typescript
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, authUser, loading, signIn, signOut } = useAuth();
  
  // authUser.profile - dados do profile
  // authUser.empresa - dados da empresa
  
  if (!authUser) return <div>Não autenticado</div>;
  
  return (
    <div>
      <h1>Bem-vindo, {authUser.profile.nome}</h1>
      <p>Empresa: {authUser.empresa.fantasia}</p>
      <p>Logo: <img src={authUser.empresa.logo} /></p>
    </div>
  );
}
```

#### 2. Buscar Reservas da Empresa
```typescript
import { supabaseReservationService } from '@/services/supabaseReservationService';
import { useAuth } from '@/contexts/AuthContext';

function ReservasPage() {
  const { authUser } = useAuth();
  const [resumo, setResumo] = useState([]);
  
  useEffect(() => {
    if (authUser?.empresa.id) {
      // Buscar resumo de hoje
      supabaseReservationService
        .getResumoHoje(authUser.empresa.id)
        .then(setResumo);
    }
  }, [authUser]);
  
  return <div>{/* renderizar reservas */}</div>;
}
```

#### 3. Proteger uma Rota
```typescript
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
```

### 🔑 Variáveis de Ambiente

Arquivo `.env.local` criado:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://ctsvfluufyfhkqlonqio.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

### 📝 Views do Supabase Disponíveis

#### resumo_reservas_diarias
```sql
empresa_id: bigint
date: date
periodo: text (almoco/jantar)
total_de_convidados: text
total_de_reservas: text
```

Uso:
```typescript
const resumo = await supabaseReservationService.getResumoProximos30Dias(empresaId);
```

### ⚡ Próximos Passos

1. **Atualizar DashboardPage** para usar `supabaseReservationService`
2. **Remover services mock** antigos (authService, reservationService mockados)
3. **Implementar RLS** no Supabase para segurança (filtrar por empresa_id)
4. **Criar função** para buscar métricas usando `daily_metrics_by_company` view
5. **Middleware** Next.js para proteger rotas no server-side

### 🔒 Segurança

- Autenticação via Supabase Auth (JWT)
- Dados da empresa carregados automaticamente
- Todos os queries devem filtrar por `empresa_id`
- RLS policies devem ser configuradas no Supabase

### 🐛 Debug

Para ver dados do usuário logado:
```typescript
const { authUser } = useAuth();
console.log('Profile:', authUser?.profile);
console.log('Empresa:', authUser?.empresa);
```

### 📦 Pacotes Instalados

```json
{
  "@supabase/supabase-js": "latest",
  "@supabase/ssr": "latest"
}
```

