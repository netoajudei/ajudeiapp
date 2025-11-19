

import { Reserva, DashboardSummary, DateSummary, CreateReservationPayload } from '../types';

// Helper to format dates YYYY-MM-DD
const formatDate = (date: Date) => date.toISOString().split('T')[0];

const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);

const nextWeek = new Date(today);
nextWeek.setDate(nextWeek.getDate() + 7);

const christmas = new Date(today.getFullYear(), 11, 25); // Month is 0-indexed

// Mock data stored in a variable so we can "push" to it during the session
let mockReservas: Reserva[] = [
  // --- HOJE ---
  {
    id: 1,
    nome: "Carlos Eduardo Silva",
    data_reserva: formatDate(today),
    horario: "19:30",
    adultos: 2,
    criancas: 0,
    observacoes: "Mesa perto da janela se possível.",
    aniversario: false,
    confirmada_dia_reserva: true,
    mesa: "04",
    status: 'confirmada'
  },
  {
    id: 2,
    nome: "Fernanda Torres",
    data_reserva: formatDate(today),
    horario: "20:00",
    adultos: 4,
    criancas: 2,
    observacoes: "Cadeira alta para criança.",
    aniversario: true,
    confirmada_dia_reserva: false,
    mesa: null,
    status: 'pendente'
  },
  {
    id: 3,
    nome: "Roberto Justus",
    data_reserva: formatDate(today),
    horario: "21:00",
    adultos: 8,
    criancas: 0,
    observacoes: "Reunião de negócios, lugar silencioso.",
    aniversario: false,
    confirmada_dia_reserva: true,
    mesa: "VIP-01",
    status: 'confirmada'
  },

  // --- AMANHÃ (Exemplo 1) ---
  {
    id: 4,
    nome: "Mariana Ximenes",
    data_reserva: formatDate(tomorrow),
    horario: "19:00",
    adultos: 2,
    criancas: 0,
    observacoes: null,
    aniversario: false,
    confirmada_dia_reserva: true,
    mesa: "12",
    status: 'confirmada'
  },
  {
    id: 5,
    nome: "Grupo Aniversário Lucas",
    data_reserva: formatDate(tomorrow),
    horario: "20:30",
    adultos: 10,
    criancas: 5,
    observacoes: "Vão trazer bolo.",
    aniversario: true,
    confirmada_dia_reserva: false,
    mesa: null,
    status: 'pendente'
  },
  
  // --- NATAL ALMOÇO ---
  {
    id: 6,
    nome: "Família Souza",
    data_reserva: formatDate(christmas),
    horario: "12:30",
    adultos: 15,
    criancas: 5,
    observacoes: "Mesa longa, almoço de natal.",
    aniversario: false,
    confirmada_dia_reserva: true,
    mesa: "Salão-B",
    status: 'confirmada'
  },

   // --- NATAL JANTAR ---
   {
    id: 7,
    nome: "Casal Romântico",
    data_reserva: formatDate(christmas),
    horario: "20:00",
    adultos: 2,
    criancas: 0,
    observacoes: null,
    aniversario: false,
    confirmada_dia_reserva: true,
    mesa: "02",
    status: 'confirmada'
  },
  {
    id: 8,
    nome: "João e Amigos",
    data_reserva: formatDate(christmas),
    horario: "21:00",
    adultos: 4,
    criancas: 0,
    observacoes: null,
    aniversario: false,
    confirmada_dia_reserva: true,
    mesa: "05",
    status: 'confirmada'
  },
  {
    id: 9,
    nome: "Mesa Avulsa",
    data_reserva: formatDate(christmas),
    horario: "21:30",
    adultos: 2,
    criancas: 0,
    observacoes: null,
    aniversario: false,
    confirmada_dia_reserva: false,
    mesa: null,
    status: 'pendente'
  },
  {
    id: 10,
    nome: "Turma do Trabalho",
    data_reserva: formatDate(christmas),
    horario: "19:00",
    adultos: 4,
    criancas: 0,
    observacoes: "Confra",
    aniversario: false,
    confirmada_dia_reserva: true,
    mesa: "10",
    status: 'confirmada'
  }
];

export interface ExtendedReserva extends Reserva {
  telefone: string;
  data_nascimento?: string;
}

export const reservationService = {
  // Agora aceita 'today', 'all' ou uma data específica 'YYYY-MM-DD'
  getReservas: async (filter: 'today' | 'all' | string = 'today'): Promise<Reserva[]> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 600));

    if (filter === 'today') {
      const todayStr = formatDate(today);
      return mockReservas.filter(r => r.data_reserva === todayStr);
    }
    
    if (filter === 'all') {
      return mockReservas;
    }

    // Se for uma data específica "YYYY-MM-DD"
    return mockReservas.filter(r => r.data_reserva === filter);
  },

  getReservaById: async (id: number): Promise<ExtendedReserva | null> => {
    await new Promise(resolve => setTimeout(resolve, 600));
    const reserva = mockReservas.find(r => r.id === id);
    
    if (!reserva) return null;

    // Mocking extra data that usually comes from a join with 'clientes' table
    return {
      ...reserva,
      telefone: "5511999998888",
      data_nascimento: reserva.aniversario ? "1990-05-20" : undefined
    };
  },

  updateStatus: async (id: number, status: 'confirmada' | 'cancelada'): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    const index = mockReservas.findIndex(r => r.id === id);
    if (index !== -1) {
      mockReservas[index].status = status;
      mockReservas[index].confirmada_dia_reserva = status === 'confirmada';
      if (status === 'confirmada' && !mockReservas[index].mesa) {
         mockReservas[index].mesa = "AUTO-" + Math.floor(Math.random() * 20);
      }
      return true;
    }
    return false;
  },

  updateTable: async (id: number, mesa: string): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    const index = mockReservas.findIndex(r => r.id === id);
    if (index !== -1) {
        mockReservas[index].mesa = mesa;
        // Se definir mesa, assume que confirmou a reserva
        if (mesa && mockReservas[index].status !== 'confirmada') {
             mockReservas[index].status = 'confirmada';
             mockReservas[index].confirmada_dia_reserva = true;
        }
        return true;
    }
    return false;
  },

  getSummary: async (filter: 'today' | 'all' = 'today'): Promise<DashboardSummary> => {
    await new Promise(resolve => setTimeout(resolve, 600));

    let filtered = mockReservas;
    if (filter === 'today') {
        const todayStr = formatDate(today);
        filtered = mockReservas.filter(r => r.data_reserva === todayStr);
    }

    const total_reservas = filtered.length;
    const total_convidados = filtered.reduce((acc, curr) => acc + curr.adultos + curr.criancas, 0);

    return {
      total_reservas,
      total_convidados
    };
  },

  // Novo método para trazer o agrupamento por datas
  getDateSummaries: async (): Promise<DateSummary[]> => {
    await new Promise(resolve => setTimeout(resolve, 600));

    // Mockando dados agrupados manualmente para demonstrar exatamente o que foi pedido
    // Num backend real, isso seria um "GROUP BY data_reserva, periodo"
    return [
      {
        date: formatDate(tomorrow),
        weekday: "Amanhã",
        period: "Noite",
        total_reservas: 2,
        total_convidados: 17
      },
      {
        date: formatDate(christmas),
        weekday: "Domingo",
        period: "Almoço",
        total_reservas: 1,
        total_convidados: 20
      },
      {
        date: formatDate(christmas),
        weekday: "Domingo",
        period: "Noite",
        total_reservas: 4,
        total_convidados: 12
      },
      {
        date: formatDate(nextWeek),
        weekday: "Quarta-feira",
        period: "Noite",
        total_reservas: 15,
        total_convidados: 120
      }
    ];
  },

  createReservation: async (payload: CreateReservationPayload): Promise<Reserva> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newReserva: Reserva = {
        id: Date.now(), // Mock ID
        empresa_id: payload.empresa_id,
        nome: payload.nome,
        data_reserva: payload.data_reserva,
        horario: payload.horario,
        adultos: payload.adultos,
        criancas: payload.criancas,
        observacoes: payload.observacoes || null,
        aniversario: payload.aniversario,
        confirmada_dia_reserva: false, // Começa manual
        mesa: null,
        status: 'pendente'
    };

    // Add to mock store so it shows up in the list immediately
    mockReservas.push(newReserva);

    return newReserva;
  }
};