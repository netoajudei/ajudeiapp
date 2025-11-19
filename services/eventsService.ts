
import { Evento } from '../types';

let MOCK_EVENTS: Evento[] = [
  {
    id: 1,
    empresa_id: 101,
    data_evento: "2024-06-12",
    titulo: "Jantar Dia dos Namorados",
    descricao: "Menu degustação especial com 5 tempos, música romântica ao vivo e decoração temática à luz de velas.",
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    empresa_id: 101,
    data_evento: "2024-12-31",
    titulo: "Réveillon da Virada",
    descricao: "Festa open bar e open food para celebrar a chegada do ano novo. Queima de fogos exclusiva e banda show.",
    created_at: new Date().toISOString()
  }
];

export const eventsService = {
  getEvents: async (): Promise<Evento[]> => {
    await new Promise(resolve => setTimeout(resolve, 600));
    // Sort by date ASC
    return [...MOCK_EVENTS].sort((a, b) => 
        new Date(a.data_evento).getTime() - new Date(b.data_evento).getTime()
    );
  },

  saveEvent: async (evento: Evento): Promise<Evento> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (evento.id) {
      // Update
      const index = MOCK_EVENTS.findIndex(e => e.id === evento.id);
      if (index !== -1) {
        MOCK_EVENTS[index] = { ...evento, created_at: MOCK_EVENTS[index].created_at };
      }
      return evento;
    } else {
      // Create
      const newEvent = { 
          ...evento, 
          id: Date.now(),
          created_at: new Date().toISOString() 
      };
      MOCK_EVENTS.push(newEvent);
      return newEvent;
    }
  },

  deleteEvent: async (id: number): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    MOCK_EVENTS = MOCK_EVENTS.filter(e => e.id !== id);
  }
};
