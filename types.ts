

import { LucideIcon } from 'lucide-react';

export interface Testimonial {
  id: number;
  name: string;
  role: string;
  restaurant: string;
  content: string;
  rating: number;
  image: string;
}

export interface Feature {
  id: number;
  title: string;
  description: string;
  icon: LucideIcon;
}

export interface PainPoint {
  id: number;
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
}

export interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export type RestaurantType = 'alacarte' | 'rodizio' | 'delivery';

export type AppRole = 'garcon' | 'admin' | 'gerente' | 'cozinha';

// Based on public.profiles table
export interface UserProfile {
  id: string; // uuid
  empresa_id: number | null; // bigint
  role: AppRole; // app_role
  nome: string | null; // text
  email: string | null; // text
  foto_url: string | null; // text
  telefone: string | null; // text
  chat_id: string | null; // text
  ativo: boolean; // boolean
  cadastro_concluido: boolean; // boolean
  ddd: string | null; // text
  updated_at?: string; // timestamp
}

export interface AuthResponse {
  user: UserProfile | null;
  error: string | null;
  token?: string;
}

// Based on public.reservas table
export interface Reserva {
  id: number; // bigint
  empresa_id?: number;
  nome: string | null;
  data_reserva: string; // date string YYYY-MM-DD
  horario: string | null; // text (ex: "20:00")
  convidados?: number; // integer (total)
  adultos: number; // integer not null
  criancas: number; // integer default 0
  observacoes: string | null;
  aniversario: boolean; // boolean default false
  confirmada_dia_reserva: boolean; // boolean default false (Used for confirmed icon)
  status?: 'confirmada' | 'pendente' | 'cancelada' | 'finalizada'; // Derived from other booleans for UI logic
  mesa: string | null;
  created_at?: string;
}

export interface CreateReservationPayload {
  empresa_id: number;
  nome: string;
  telefone?: string; // Opcional se for anônima presencial
  data_reserva: string;
  horario: string;
  adultos: number;
  criancas: number;
  observacoes?: string;
  aniversario: boolean;
}

export interface DashboardSummary {
  total_reservas: number;
  total_convidados: number;
}

export interface DateSummary {
  date: string; // YYYY-MM-DD
  weekday: string; // ex: "Quarta-feira"
  period: string; // ex: "Noite" ou "Almoço"
  total_reservas: number;
  total_convidados: number;
}

// --- New Interfaces based on SQL ---

export type ApiProviderType = 'wappi' | 'oficial';
export type ModoIaType = 'prompt_unico' | 'multi_agent';

export interface Empresa {
  id: number;
  created_at: string;
  modificadoDia?: string | null;
  modificadoPor?: string | null; // UUID
  
  // Identidade
  razaoSocial: string | null;
  fantasia: string | null;
  logo: string | null; // URL image
  cor: string; // Hex color default '#000000'
  
  // Contato & Conexão
  contatoPrincipal: string | null;
  instanciaChat?: string | null;
  senhaWiFi?: string | null;
  
  // Limites
  LimiteDeReservasPorDia?: number | null;
  LimiteDeConvidadosPorReserva?: number | null;
  reservasAutomaticas?: number | null; // Bigint in SQL, likely 0 or 1 logic
  
  // IA & Config
  prompt?: string | null;
  api_provider: ApiProviderType;
  modo_ia: ModoIaType;
  em_teste?: boolean | null;
  
  // Arrays de Contato (Postgres text[])
  contatoSoReserva?: string[] | null;
  respostas_prontas?: string[] | null;
  contato_respostas?: string[] | null;
  contato_vagas_de_emprego?: string[] | null;
  contato_fornecedores?: string[] | null;
  contato_teste?: string | null;
  
  adm?: string | null; // ID do user admin
}

export interface Cliente {
  id: number;
  nome: string | null;
  foto: string | null;
  empresa_id: number | null;
  chatId: string | null; // Phone number usually
  uuid_identificador: string;
  // ... other fields
}

export interface PublicReservationData {
  empresa: Empresa;
  cliente: Cliente;
}

// --- Regras de Reserva ---

export interface LimitesPorPeriodo {
  [key: string]: number; // ex: { "almoco": 50, "jantar": 100 }
}

export interface ReservationRules {
  id: number;
  empresa_id: number;
  dias_semana_indisponiveis: number[]; // 0=Sun, 6=Sat
  horario_limite_reserva_mesmo_dia: string; // "HH:mm"
  limite_minimo_pessoas_reserva: number;
  limite_maximo_pessoas_reserva: number;
  limites_por_periodo: LimitesPorPeriodo; // JSONB
}

// --- Períodos de Funcionamento ---

export interface OperatingPeriod {
  id?: number; // Optional for new creation
  empresa_id: number;
  dia_semana: number; // 1=Dom, 2=Seg, ... 7=Sab (Seguindo check do SQL)
  nome_periodo: string;
  horario_inicio: string; // HH:mm:ss or HH:mm
  horario_fim: string; // HH:mm:ss or HH:mm
  promocao?: string | null;
  atracao?: string | null;
  cardapio?: string | null;
  ativo: boolean;
  data_especial: boolean;
  data_evento_especial?: string | null; // YYYY-MM-DD
}

// --- Eventos ---

export interface Evento {
  id?: number;
  empresa_id: number;
  data_evento: string; // date YYYY-MM-DD
  titulo: string;
  descricao?: string | null;
  created_at?: string;
}