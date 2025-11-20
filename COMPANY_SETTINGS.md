# Página de Configurações da Empresa ⚙️

## ✅ Implementação Concluída

A página de configurações (`/dashboard/settings`) agora está totalmente integrada com o Supabase e carrega/salva os dados reais da empresa.

## 🎯 Funcionalidades

### 1. **Carregamento Automático de Dados**
- Dados da empresa são carregados do contexto `useAuth()`
- Sincronização automática com o Supabase
- Formulário pré-preenchido com valores atuais

### 2. **Seções Configuráveis**

#### 📸 Identidade Visual
- **Logo da Empresa**: URL da imagem
- **Razão Social**: Nome legal da empresa
- **Nome Fantasia**: Nome comercial
- **Cor Principal**: Seletor de cor hexadecimal (#000000)
  - Preview em tempo real
  - Aplicada na borda da logo

#### 🔌 Conectividade
- **Contato Principal**: WhatsApp principal
- **Senha WiFi**: Senha para compartilhar com clientes
- **Instância Chat**: ID da instância (read-only)

#### 📊 Regras Operacionais
- **Limite Reservas/Dia**: Máximo de reservas diárias
- **Limite Pessoas/Reserva**: Máximo de convidados por reserva
- **Modo de Teste**: Checkbox para ativar sandbox

#### 🤖 Configuração da IA
- **Provedor da API**: 
  - `wappi` (Não Oficial)
  - `api_oficial` (Meta Cloud API)
- **Modo de Operação**:
  - `prompt_unico` (Simples)
  - `multi_agent` (Avançado)
- **Prompt do Sistema**: Personalidade e instruções da IA

#### 📱 Contatos de Notificação (Arrays)
- **Alertas de Novas Reservas**: Lista de números para notificar
- **Alertas de Currículos/Vagas**: Contatos RH
- **Alertas de Fornecedores**: Contatos comerciais
- **Respostas Rápidas**: Botões de mensagem rápida

### 3. **Funcionalidades Especiais**

#### 💾 Salvar Alterações
- Botão "Salvar Alterações" no footer
- Validação de campos obrigatórios
- Atualiza timestamp `modificadoDia`
- Refresh automático dos dados no contexto
- Feedback visual de sucesso/erro

#### 🔐 Alterar Senha
- Botão "Alterar Senha" no header
- Envia email de redefinição via Supabase Auth
- Utiliza o email do profile do usuário

#### 🎨 Preview em Tempo Real
- Logo preview com borda colorida
- Quadrado de preview da cor selecionada
- Atualização instantânea ao digitar

## 🔧 Campos Salvos no Banco

```typescript
{
  razaoSocial: string
  fantasia: string
  contatoPrincipal: string
  logo: string
  cor: string  // Hexadecimal
  senhaWiFi: string
  LimiteDeReservasPorDia: number
  LimiteDeConvidadosPorReserva: number
  contatoSoReserva: string[]  // Array
  respostas_prontas: string[]  // Array
  contato_respostas: string[]  // Array
  contato_vagas_de_emprego: string[]  // Array
  contato_fornecedores: string[]  // Array
  api_provider: 'wappi' | 'wame' | 'api_oficial'
  modo_ia: 'prompt_unico' | 'roteador_de_agentes' | 'roteador_com_variaveis' | 'conversation'
  prompt: string
  em_teste: boolean
  modificadoDia: timestamp  // Atualizado automaticamente
}
```

## 🎨 Personalização Visual

### Sidebar do Dashboard
Agora mostra:
- **Logo da Empresa** (se configurada) com borda colorida
- **Nome Fantasia** como título principal
- **Nome do Usuário** como subtítulo
- Cor de destaque personalizada da empresa

### Exemplo no código:
```tsx
{authUser?.empresa?.logo ? (
  <img 
    src={authUser.empresa.logo} 
    style={{ borderColor: authUser.empresa.cor }}
  />
) : (
  <div style={{ backgroundColor: authUser.empresa.cor }}>
    <Bot />
  </div>
)}
```

## 🛡️ Proteção de Rotas

Todas as páginas do dashboard agora estão protegidas:
- ✅ `/dashboard` - Dashboard principal
- ✅ `/dashboard/metrics` - Métricas
- ✅ `/dashboard/clientes` - Clientes
- ✅ `/dashboard/regras` - Regras
- ✅ `/dashboard/horarios` - Horários
- ✅ `/dashboard/eventos` - Eventos
- ✅ `/dashboard/settings` - Configurações
- ✅ `/dashboard/reservas/[id]` - Detalhes da reserva

### Comportamento:
- Redireciona para `/login` se não autenticado
- Mostra loading spinner durante verificação
- Acesso garantido apenas com sessão válida

## 📝 Arrays (Campos Múltiplos)

### Como funciona:
1. **No formulário**: Valores separados por vírgula
   ```
   5511999999999, 5511888888888
   ```

2. **No banco**: Armazenado como array PostgreSQL
   ```json
   ["5511999999999", "5511888888888"]
   ```

3. **Componente ArrayInput**: Converte automaticamente

### Exemplo de uso:
```tsx
<ArrayInput 
  name="contatoSoReserva" 
  label="Alertas de Novas Reservas" 
  icon={MessageSquare} 
  placeholder="5511999999999, 5511888888888" 
/>
```

## 🚀 Como Usar

### Acessar Configurações:
1. Fazer login no sistema
2. Navegar para `/dashboard/settings`
3. Editar campos desejados
4. Clicar em "Salvar Alterações"

### Alterar Logo/Cor:
1. Inserir URL da logo
2. Definir cor hexadecimal (ex: #2293DD)
3. Ver preview em tempo real
4. Salvar

### Redefinir Senha:
1. Clicar em "Alterar Senha" (botão vermelho)
2. Confirmar
3. Verificar email
4. Seguir link de redefinição

## 🔄 Sincronização com Contexto

### Fluxo:
1. Usuário edita formulário
2. Clica em "Salvar"
3. Dados atualizados no Supabase
4. `refreshUserData()` é chamado
5. Contexto é atualizado
6. Sidebar mostra novos dados automaticamente

### No código:
```typescript
await supabase.from('empresa').update(data).eq('id', empresaId);
await refreshUserData();  // Atualiza o contexto
```

## 🎨 Estilização

- Design moderno com glassmorphism
- Cards com bordas sutis
- Barra lateral colorida em cada seção
- Animações suaves (framer-motion)
- Gradientes e sombras nos botões
- Preview visual de cores e logo
- Responsivo (mobile-first)

## 🐛 Tratamento de Erros

- Validação de campos obrigatórios
- Validação de formato de cor (hexadecimal)
- Feedback de erro em alerts
- Console.error para debug
- Try/catch em todas as operações async

## 📚 Próximos Passos

1. **Upload de Logo**: Implementar upload direto (Supabase Storage)
2. **Validação WhatsApp**: Verificar formato de números
3. **Preview do Prompt**: Testar IA com prompt atual
4. **Histórico de Mudanças**: Log de alterações
5. **Permissões por Role**: Restringir edição por cargo

## 🔗 Arquivos Relacionados

- `components/dashboard/SettingsPage.tsx` - Componente principal
- `contexts/AuthContext.tsx` - Provider de autenticação
- `lib/supabase/types.ts` - Tipos TypeScript
- `lib/supabase/client.ts` - Cliente Supabase
- `app/dashboard/settings/page.tsx` - Rota Next.js

