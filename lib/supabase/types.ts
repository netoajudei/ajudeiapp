// Tipos extraídos do schema do Supabase
export type AppRole = 
  | 'garcon'
  | 'portaria'
  | 'metre'
  | 'gerente'
  | 'financeiro'
  | 'adm'
  | 'proprietario'
  | 'dev';

export type ApiProviderType = 'wappi' | 'wame' | 'api_oficial';
export type ModoIaType = 'prompt_unico' | 'roteador_de_agentes' | 'roteador_com_variaveis' | 'conversation';

export interface Profile {
  id: string;
  empresa_id: number | null;
  role: AppRole;
  nome: string | null;
  email: string | null;
  foto_url: string | null;
  telefone: string | null;
  chat_id: string | null;
  ativo: boolean;
  updated_at: string | null;
  cadastro_concluido: boolean;
  ddd: string | null;
}

export interface Empresa {
  id: number;
  created_at: string;
  modificadoDia: string | null;
  razaoSocial: string | null;
  fantasia: string | null;
  modificadoPor: number | null;
  contatoPrincipal: string | null;
  logo: string | null;
  instanciaChat: string | null;
  senhaWiFi: string | null;
  LimiteDeReservasPorDia: number | null;
  LimiteDeConvidadosPorReserva: number | null;
  reservasAutomaticas: number | null;
  prompt: string | null;
  adm: number | null;
  contatoSoReserva: string[] | null;
  respostas_prontas: string[] | null;
  em_teste: boolean | null;
  contato_respostas: string[] | null;
  contato_vagas_de_emprego: string[] | null;
  contato_fornecedores: string[] | null;
  contato_teste: string | null;
  api_provider: ApiProviderType;
  modo_ia: ModoIaType;
  cor: string | null;
}

export interface ResumoReservaDiaria {
  empresa_id: number | null;
  date: string | null;
  periodo: string | null;
  total_de_convidados: string | null;
  total_de_reservas: string | null;
}

export interface AuthUser {
  profile: Profile;
  empresa: Empresa;
}

