import { Clock, DollarSign, Frown, Bot, Calendar, Users, Package } from 'lucide-react';
import { Feature, PainPoint, FAQItem, Testimonial } from './types';

export const PAIN_POINTS: PainPoint[] = [
  {
    id: 1,
    title: "1h = cliente perdido",
    description: "Resposta às 10h para quem perguntou à 1h da madrugada? Já foi para o concorrente.",
    icon: Clock,
    color: "text-red-400"
  },
  {
    id: 2,
    title: "Tráfego caro, conversão zero",
    description: "R$ 5.000 em ads. Lead chega. Ninguém responde. Dinheiro no lixo.",
    icon: DollarSign,
    color: "text-orange-400"
  },
  {
    id: 3,
    title: "Copiar e colar não é atendimento",
    description: "Mensagens prontas irritam. Cliente quer ser ouvido, não robotizado.",
    icon: Frown,
    color: "text-yellow-400"
  }
];

export const FEATURES: Feature[] = [
  {
    id: 1,
    title: "Atendimento 24/7",
    description: "Cliente pergunta às 3h? IA responde em 0.8 segundos. Humanizado. Contextual. Converte.",
    icon: Bot
  },
  {
    id: 2,
    title: "Reservas Automáticas",
    description: "Sistema valida disponibilidade, confirma reserva e envia lembrete. 40% mais reservas, 30% menos no-show.",
    icon: Calendar
  },
  {
    id: 3,
    title: "Recrutamento Inteligente",
    description: "IA filtra, qualifica e organiza candidatos. Você só fala com quem realmente serve.",
    icon: Users
  },
  {
    id: 4,
    title: "Seleção de Fornecedores",
    description: "Captamos ofertas automaticamente. Você vê só o que importa. Mais economia, menos spam.",
    icon: Package
  }
];

export const TESTIMONIALS: Testimonial[] = [
  {
    id: 1,
    name: "João Silva",
    role: "Proprietário",
    restaurant: "Churrascaria Premium",
    content: "Antes: 15 reservas/semana. Depois: 40+ reservas/semana. Paguei a ferramenta só com o aumento da primeira semana.",
    rating: 5,
    image: "https://picsum.photos/100/100?random=1"
  },
  {
    id: 2,
    name: "Mariana Costa",
    role: "Gerente Geral",
    restaurant: "Bistrô Le Jardin",
    content: "A IA entende nuances do cardápio que nem meus garçons novos entendem. Impressionante.",
    rating: 5,
    image: "https://picsum.photos/100/100?random=2"
  },
  {
    id: 3,
    name: "Carlos Oliveira",
    role: "Dono",
    restaurant: "Pizzaria Veloz",
    content: "O atendimento de madrugada explodiu nossas vendas no delivery. A ferramenta trabalha enquanto eu durmo.",
    rating: 5,
    image: "https://picsum.photos/100/100?random=3"
  }
];

export const FAQS: FAQItem[] = [
  {
    question: "Quanto tempo leva para implementar?",
    answer: "48 horas. Você nos passa as informações do restaurante, a gente configura, testa e coloca no ar. Rápido assim."
  },
  {
    question: "E se o cliente fizer uma pergunta muito específica?",
    answer: "A IA aprende com seu cardápio, políticas e histórico. Mas se não souber, ela encaminha para você com contexto completo da conversa."
  },
  {
    question: "Funciona para delivery também?",
    answer: "Sim! Integra com iFood, Rappi e atendimento direto pelo WhatsApp."
  },
  {
    question: "Preciso mudar meu número de WhatsApp?",
    answer: "Não. A gente conecta no seu número atual através da API oficial do WhatsApp Business."
  },
  {
    question: "E se eu não gostar?",
    answer: "Garantia de 30 dias. Não gostou? Devolvemos 100% do valor."
  }
];

// Changed from Tech Stack to Integration Partners for better client conversion
export const TECH_STACK = [
  "WhatsApp", "Instagram", "iFood", "Rappi", "Google Business", "UberEats", "Facebook", "Telegram"
];